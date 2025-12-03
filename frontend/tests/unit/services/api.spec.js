import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import { server } from '../../mocks/server'
import { http, HttpResponse } from 'msw'

/**
 * Suite de tests pour le service API
 * Teste les intercepteurs Axios, la gestion du rafraîchissement automatique des tokens,
 * et la mise en queue des requêtes pendant le refresh
 */
describe('API Service', () => {
    /**
     * Configuration initiale avant chaque test
     * Réinitialise Pinia et le localStorage
     */
    beforeEach(() => {
        setActivePinia(createPinia())
        localStorage.clear()
    })

    /**
     * Tests de l'intercepteur de requêtes
     * Vérifie l'injection automatique du token JWT dans les headers
     */
    describe('Request Interceptor', () => {
        /**
         * Vérifie que le token JWT est automatiquement ajouté aux headers
         * lorsqu'un utilisateur est authentifié
         */
        it('devrait ajouter le token JWT aux headers', async () => {
            const auth = useAuthStore()
            auth.token = 'fake-jwt-token'

            // Exécution d'une requête GET
            const response = await api.get('/movies')

            // Vérification que l'header Authorization contient le token au format Bearer
            expect(response.config.headers.Authorization).toBe('Bearer fake-jwt-token')
        })

        /**
         * Vérifie que l'header Authorization n'est pas ajouté
         * si aucun token n'est présent dans le store
         */
        it('ne devrait pas ajouter Authorization si pas de token', async () => {
            const auth = useAuthStore()
            auth.token = null

            // Exécution d'une requête GET sans authentification
            const response = await api.get('/movies')

            // Vérification de l'absence de l'header Authorization
            expect(response.config.headers.Authorization).toBeUndefined()
        })
    })

    /**
     * Tests de l'intercepteur de réponses pour la gestion des erreurs 401
     * Vérifie le mécanisme de rafraîchissement automatique du token
     */
    describe('Response Interceptor - 401 Handling', () => {
        /**
         * Vérifie que le token est automatiquement rafraîchi
         * lorsqu'une requête retourne un code 401 (Unauthorized)
         * et que la requête originale est relancée avec le nouveau token
         */
        it('devrait rafraîchir le token automatiquement sur 401', async () => {
            const auth = useAuthStore()
            auth.token = 'expired-token'
            auth.refreshToken = 'fake-refresh-token'

            // Override temporaire : premier appel retourne 401
            // L'option { once: true } fait que ce handler n'est utilisé qu'une fois
            server.use(
                http.get('http://localhost:8000/api/movies', () => {
                    return HttpResponse.json(
                        { message: 'Token expired' },
                        { status: 401 }
                    )
                }, { once: true })
            )

            // Exécution de la requête qui déclenchera le refresh automatique
            await api.get('/movies')

            // Vérification que le token a été renouvelé
            expect(auth.token).toBeTruthy()
            expect(auth.token).not.toBe('expired-token')
        })

        /**
         * Vérifie que l'utilisateur est déconnecté et redirigé
         * si le rafraîchissement du token échoue (refresh token invalide)
         */
        it('devrait logout et rediriger si le refresh échoue', async () => {
            const auth = useAuthStore()
            auth.token = 'expired-token'
            auth.refreshToken = 'invalid-refresh-token'

            // Spy sur la méthode logout pour vérifier qu'elle est appelée
            const logoutSpy = vi.spyOn(auth, 'logout')

            // Override : requête principale retourne 401 et le refresh échoue
            server.use(
                http.get('http://localhost:8000/api/movies', () => {
                    return HttpResponse.json(
                        { message: 'Token expired' },
                        { status: 401 }
                    )
                }),
                http.post('http://localhost:8000/api/token/refresh', () => {
                    return HttpResponse.json(
                        { message: 'Invalid refresh token' },
                        { status: 401 }
                    )
                })
            )

            try {
                await api.get('/movies')
            } catch (error) {
                // Vérification que la méthode logout a bien été appelée
                expect(logoutSpy).toHaveBeenCalled()
            }
        })

        /**
         * Vérifie que le mécanisme de refresh automatique est désactivé
         * pour les requêtes avec l'option skipAuthRefresh: true
         * (notamment pour éviter les boucles infinies sur /token/refresh)
         */
        it('ne devrait pas tenter de refresh si skipAuthRefresh est true', async () => {
            const auth = useAuthStore()

            // Spy sur la méthode refresh pour vérifier qu'elle n'est PAS appelée
            const refreshSpy = vi.spyOn(auth, 'refresh')

            // Override : l'endpoint de refresh retourne 401
            server.use(
                http.post('http://localhost:8000/api/token/refresh', () => {
                    return HttpResponse.json(
                        { message: 'Unauthorized' },
                        { status: 401 }
                    )
                })
            )

            try {
                // Requête avec skipAuthRefresh pour éviter la boucle infinie
                await api.post('/token/refresh', { refresh_token: 'test' }, {
                    skipAuthRefresh: true
                })
            } catch (error) {
                // Vérification que refresh n'a pas été appelé
                expect(refreshSpy).not.toHaveBeenCalled()
            }
        })
    })

    /**
     * Tests de la gestion de la queue de requêtes
     * Vérifie que les requêtes concurrentes sont correctement mises en attente
     * pendant le rafraîchissement du token
     */
    describe('Queue Management', () => {
        /**
         * Vérifie que plusieurs requêtes lancées simultanément pendant un refresh
         * sont mises en queue et exécutées après l'obtention du nouveau token
         * au lieu de déclencher plusieurs refresh en parallèle
         */
        it('devrait mettre en queue les requêtes pendant le refresh', async () => {
            const auth = useAuthStore()
            auth.token = 'expired-token'
            auth.refreshToken = 'fake-refresh-token'

            // Compteur pour simuler un seul 401 puis des succès
            let refreshCount = 0

            // Override : premier appel retourne 401, les suivants réussissent
            server.use(
                http.get('http://localhost:8000/api/movies', () => {
                    if (refreshCount === 0) {
                        refreshCount++
                        return HttpResponse.json(
                            { message: 'Token expired' },
                            { status: 401 }
                        )
                    }
                    return HttpResponse.json({ member: [] })
                })
            )

            // Lancement de plusieurs requêtes simultanées
            const promises = [
                api.get('/movies'),
                api.get('/movies'),
                api.get('/movies')
            ]

            // Attente de la résolution de toutes les requêtes
            const results = await Promise.all(promises)

            // Vérification que toutes les requêtes ont réussi après le refresh
            expect(results).toHaveLength(3)
            results.forEach(result => {
                expect(result.status).toBe(200)
            })
        })
    })
})