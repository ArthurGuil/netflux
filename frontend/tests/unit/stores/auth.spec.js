import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { server } from '../../mocks/server'
import { http, HttpResponse } from 'msw'

/**
 * Suite de tests pour le store d'authentification
 * Teste la gestion complète du cycle de vie de l'authentification :
 * login, register, refresh token, logout, et persistance dans localStorage
 */
describe('Auth Store', () => {
    /**
     * Configuration initiale avant chaque test
     * Réinitialise Pinia et nettoie le localStorage pour isoler les tests
     */
    beforeEach(() => {
        setActivePinia(createPinia())
        localStorage.clear()
    })

    /**
     * Tests de l'état initial du store
     * Vérifie les valeurs par défaut et la restauration depuis localStorage
     */
    describe('State initial', () => {
        /**
         * Vérifie que le store s'initialise avec des valeurs nulles
         * lorsqu'aucune donnée n'est présente dans localStorage
         */
        it('devrait initialiser avec des valeurs par défaut', () => {
            const auth = useAuthStore()

            // Vérification de l'état initial vide
            expect(auth.token).toBeNull()
            expect(auth.refreshToken).toBeNull()
            expect(auth.user).toBeNull()
            expect(auth.decoded).toBeNull()
            expect(auth.isLoggedIn).toBe(false)
            expect(auth.isAdmin).toBe(false)
        })

        /**
         * Vérifie que le token est automatiquement restauré depuis localStorage
         * lors de l'initialisation du store (persistance de session)
         */
        it('devrait charger le token depuis localStorage', () => {
            // Simulation d'un token stocké dans localStorage
            localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIiwicm9sZXMiOlsiUk9MRV9VU0VSIl0sImV4cCI6OTk5OTk5OTk5OX0.test')

            const auth = useAuthStore()

            // Vérification que le token et son payload décodé sont restaurés
            expect(auth.token).toBeTruthy()
            expect(auth.decoded).toBeTruthy()
        })
    })

    /**
     * Tests de la fonctionnalité de connexion
     * Vérifie l'authentification avec credentials valides/invalides
     * et la récupération des données utilisateur
     */
    describe('login', () => {
        /**
         * Vérifie la connexion réussie avec des credentials valides
         * et le stockage correct du token et refresh token
         */
        it('devrait se connecter avec des credentials valides', async () => {
            const auth = useAuthStore()

            const success = await auth.login('admin@example.com', 'admin123')

            // Vérification du succès et du stockage des tokens
            expect(success).toBe(true)
            expect(auth.token).toBeTruthy()
            expect(auth.refreshToken).toBe('fake-refresh-token')
            expect(auth.isLoggedIn).toBe(true)
        })

        /**
         * Vérifie que la connexion échoue avec des credentials invalides
         * et qu'un message d'erreur approprié est affiché
         */
        it('devrait échouer avec des credentials invalides', async () => {
            const auth = useAuthStore()

            const success = await auth.login('wrong@example.com', 'wrong')

            // Vérification de l'échec et du message d'erreur
            expect(success).toBe(false)
            expect(auth.error).toBe('Identifiants incorrects')
            expect(auth.token).toBeNull()
        })

        /**
         * Vérifie que les informations utilisateur sont récupérées
         * automatiquement après une connexion réussie
         */
        it('devrait récupérer les infos utilisateur après login', async () => {
            const auth = useAuthStore()

            await auth.login('admin@example.com', 'admin123')

            // Vérification de la présence des données utilisateur
            expect(auth.user).toBeTruthy()
            expect(auth.user.email).toBe('user@example.com')
        })
    })

    /**
     * Tests de la fonctionnalité d'inscription
     * Vérifie la création de compte, la gestion des emails dupliqués
     * et les erreurs de validation
     */
    describe('register', () => {
        /**
         * Vérifie la création réussie d'un compte avec un email valide
         */
        it('devrait créer un compte avec un email valide', async () => {
            const auth = useAuthStore()

            const success = await auth.register('new@example.com', 'password123')

            // Vérification du succès de l'inscription
            expect(success).toBe(true)
            expect(auth.error).toBeNull()
        })

        /**
         * Vérifie que l'inscription échoue si l'email est déjà utilisé
         */
        it('devrait échouer si email déjà utilisé', async () => {
            const auth = useAuthStore()

            const success = await auth.register('existing@example.com', 'password123')

            // Vérification de l'échec et du message d'erreur
            expect(success).toBe(false)
            expect(auth.error).toBe('Email already exists')
        })

        /**
         * Vérifie la gestion des erreurs de validation côté backend
         * Les erreurs sont mappées par champ dans fieldErrors
         */
        it('devrait gérer les erreurs de validation', async () => {
            // Override temporaire pour simuler une erreur de validation 422
            server.use(
                http.post('http://localhost:8000/api/register', () => {
                    return HttpResponse.json({
                        violations: [
                            { propertyPath: 'email', message: 'Email invalide' }
                        ]
                    }, { status: 422 })
                })
            )

            const auth = useAuthStore()
            const success = await auth.register('invalid', 'pass')

            // Vérification de l'échec et du mapping des erreurs par champ
            expect(success).toBe(false)
            expect(auth.fieldErrors.email).toBe('Email invalide')
        })
    })

    /**
     * Tests du rafraîchissement automatique du token
     * Vérifie le renouvellement du token via refresh token
     * et la déconnexion en cas d'échec
     */
    describe('refresh', () => {
        /**
         * Vérifie le rafraîchissement réussi du token
         * et sa sauvegarde dans localStorage
         */
        it('devrait rafraîchir le token avec un refresh token valide', async () => {
            const auth = useAuthStore()
            auth.refreshToken = 'fake-refresh-token'

            const success = await auth.refresh()

            // Vérification du succès et de la persistance
            expect(success).toBe(true)
            expect(auth.token).toBeTruthy()
            expect(localStorage.getItem('token')).toBeTruthy()
        })

        /**
         * Vérifie que l'utilisateur est déconnecté automatiquement
         * si le rafraîchissement échoue (refresh token invalide ou expiré)
         */
        it('devrait logout si le refresh échoue', async () => {
            // Override temporaire pour simuler un refresh token invalide
            server.use(
                http.post('http://localhost:8000/api/token/refresh', () => {
                    return HttpResponse.json(
                        { message: 'Invalid refresh token' },
                        { status: 401 }
                    )
                })
            )

            const auth = useAuthStore()
            auth.refreshToken = 'invalid-token'

            const success = await auth.refresh()

            // Vérification de l'échec et du nettoyage complet de la session
            expect(success).toBe(false)
            expect(auth.token).toBeNull()
            expect(auth.refreshToken).toBeNull()
        })
    })

    /**
     * Tests de la fonctionnalité de déconnexion
     * Vérifie le nettoyage complet des données d'authentification
     */
    describe('logout', () => {
        /**
         * Vérifie que la déconnexion nettoie complètement l'état
         * et supprime les données du localStorage
         */
        it('devrait nettoyer toutes les données', async () => {
            const auth = useAuthStore()

            // Connexion initiale
            await auth.login('admin@example.com', 'admin123')
            expect(auth.isLoggedIn).toBe(true)

            // Déconnexion
            auth.logout()

            // Vérification du nettoyage complet
            expect(auth.token).toBeNull()
            expect(auth.refreshToken).toBeNull()
            expect(auth.user).toBeNull()
            expect(auth.decoded).toBeNull()
            expect(localStorage.getItem('token')).toBeNull()
        })
    })

    /**
     * Tests de la validation d'expiration des tokens
     * Vérifie la détection des tokens expirés via le champ exp du JWT
     */
    describe('isTokenExpired', () => {
        /**
         * Vérifie la détection d'un token expiré
         * (timestamp exp dans le passé)
         */
        it('devrait détecter un token expiré', () => {
            const auth = useAuthStore()

            // Token avec exp dans le passé (timestamp Unix)
            const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.test'

            expect(auth.isTokenExpired(expiredToken)).toBe(true)
        })

        /**
         * Vérifie qu'un token non expiré est considéré comme valide
         * (timestamp exp dans le futur)
         */
        it('devrait valider un token non expiré', () => {
            const auth = useAuthStore()

            // Token avec exp dans le futur
            const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk5OTk5OTk5OTl9.test'

            expect(auth.isTokenExpired(validToken)).toBe(false)
        })
    })

    /**
     * Tests des propriétés calculées (computed)
     * Vérifie la logique de détection des rôles utilisateur
     */
    describe('Computed properties', () => {
        /**
         * Vérifie que isAdmin retourne true pour un utilisateur
         * possédant le rôle ROLE_ADMIN dans son token JWT
         */
        it('isAdmin devrait retourner true pour un admin', async () => {
            // Override temporaire pour retourner un token avec ROLE_ADMIN
            server.use(
                http.post('http://localhost:8000/api/login_check', () => {
                    return HttpResponse.json({
                        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGVzIjpbIlJPTEVfQURNSU4iXSwiZXhwIjo5OTk5OTk5OTk5fQ.test',
                        refresh_token: 'fake-refresh-token'
                    })
                })
            )

            const auth = useAuthStore()
            await auth.login('admin@example.com', 'admin123')

            // Vérification que la propriété isAdmin détecte correctement le rôle
            expect(auth.isAdmin).toBe(true)
        })
    })
})