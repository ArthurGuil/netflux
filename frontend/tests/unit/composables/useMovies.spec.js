import { describe, it, expect, beforeEach } from 'vitest'
import { useMovies } from '@/composables/useMovies'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { server } from '../../mocks/server'
import { http, HttpResponse } from 'msw'

// URL de base de l'API utilisée dans les tests
const API_URL = 'http://localhost:8000/api'

/**
 * Suite de tests pour le composable useMovies
 * Teste les opérations CRUD sur les films et la gestion d'état
 */
describe('useMovies', () => {
    /**
     * Configuration initiale avant chaque test
     * Réinitialise Pinia et configure un utilisateur authentifié
     */
    beforeEach(() => {
        setActivePinia(createPinia())

        // Configuration d'un token d'authentification pour les tests
        const auth = useAuthStore()
        auth.token = 'fake-jwt-token'
    })

    /**
     * Tests de récupération de la liste des films
     */
    describe('fetchMovies', () => {
        /**
         * Vérifie que la liste des films est correctement récupérée
         * et que l'état initial est bien configuré
         */
        it('devrait récupérer la liste des films', async () => {
            const { movies, loading, error, fetchMovies } = useMovies()

            // Vérification de l'état initial
            expect(movies.value).toEqual([])
            expect(loading.value).toBe(false)

            // Exécution de la récupération
            await fetchMovies()

            // Vérification de l'état après chargement
            expect(loading.value).toBe(false)
            expect(error.value).toBeNull()
            expect(movies.value).toHaveLength(2)
            expect(movies.value[0].title).toBe('Inception')
            expect(movies.value[1].title).toBe('Breaking Bad')
        })

        /**
         * Vérifie que l'indicateur de chargement est correctement géré
         * pendant et après la requête asynchrone
         */
        it('devrait gérer le loading state', async () => {
            const { loading, fetchMovies } = useMovies()

            // Démarrage de la requête sans attendre sa résolution
            const promise = fetchMovies()

            // Le loading devrait être actif pendant la requête
            expect(loading.value).toBe(true)

            // Attente de la fin de la requête
            await promise

            // Le loading devrait être désactivé après la requête
            expect(loading.value).toBe(false)
        })

        /**
         * Vérifie la gestion des erreurs réseau lors de la récupération
         * Simule une erreur serveur 500
         */
        it('devrait gérer les erreurs réseau', async () => {
            // Override temporaire du handler pour simuler une erreur serveur
            server.use(
                http.get(`${API_URL}/movies`, () => {
                    return HttpResponse.json(
                        { error: 'Internal server error' },
                        { status: 500 }
                    )
                })
            )

            const { movies, error, fetchMovies } = useMovies()

            await fetchMovies()

            // Vérification que l'erreur est capturée et la liste reste vide
            expect(error.value).toBeTruthy()
            expect(movies.value).toEqual([])
        })
    })

    /**
     * Tests de récupération d'un film spécifique
     */
    describe('fetchMovie', () => {
        /**
         * Vérifie la récupération correcte d'un film par son ID
         */
        it('devrait récupérer un film par ID', async () => {
            const { movie, fetchMovie } = useMovies()

            await fetchMovie(1)

            // Vérification des données du film récupéré
            expect(movie.value).toBeTruthy()
            expect(movie.value.id).toBe(1)
            expect(movie.value.title).toBe('Inception')
        })

        /**
         * Vérifie la gestion des erreurs pour un film inexistant
         */
        it('devrait gérer les erreurs 404', async () => {
            const { movie, error, fetchMovie } = useMovies()

            // Tentative de récupération d'un film inexistant
            await fetchMovie(999)

            // Vérification que l'erreur est bien capturée
            expect(movie.value).toBeNull()
            expect(error.value).toBeTruthy()
        })
    })

    /**
     * Tests de création d'un nouveau film
     */
    describe('createMovie', () => {
        /**
         * Vérifie la création d'un film avec des données JSON
         */
        it('devrait créer un nouveau film', async () => {
            const { createMovie } = useMovies()

            // Données du nouveau film à créer
            const newMovie = {
                title: 'New Movie',
                description: 'Test description',
                duration: 120,
                type: 'movie',
                releaseDate: '2024-01-01T00:00:00+00:00'
            }

            const result = await createMovie(newMovie)

            // Vérification que le film est créé avec un ID assigné
            expect(result).toBeTruthy()
            expect(result.id).toBe(3)
            expect(result.title).toBe('New Movie')
        })

        /**
         * Vérifie la création d'un film avec FormData et upload de fichier
         * Utilisé notamment pour l'upload de posters
         */
        it('devrait gérer l\'upload de poster avec FormData', async () => {
            const { createMovie } = useMovies()

            // Préparation du FormData pour l'upload
            const formData = new FormData()
            formData.append('title', 'Test Movie')
            formData.append('duration', '120')

            // Simulation d'un fichier image
            const file = new File(['test'], 'poster.jpg', { type: 'image/jpeg' })
            formData.append('poster', file)

            const result = await createMovie(formData)

            // Vérification que la création fonctionne avec FormData
            expect(result).toBeTruthy()
            expect(result.title).toBe('New Movie')
        })
    })

    /**
     * Tests de mise à jour d'un film existant
     * Note : API Platform impose l'utilisation de POST pour les uploads de fichiers
     */
    describe('updateMovie', () => {
        /**
         * Vérifie la mise à jour correcte d'un film existant
         * Utilise POST car API Platform nécessite cette méthode pour l'upload de fichiers
         */
        it('devrait mettre à jour un film existant', async () => {
            // Override temporaire pour simuler la mise à jour via POST
            server.use(
                http.post(`${API_URL}/movies/:id`, async ({ params, request }) => {
                    const authHeader = request.headers.get('Authorization')

                    if (!authHeader) {
                        return HttpResponse.json(
                            { message: 'Unauthorized' },
                            { status: 401 }
                        )
                    }

                    return HttpResponse.json({
                        id: parseInt(params.id),
                        title: 'Updated Movie',
                        description: 'Updated description',
                        duration: 150,
                        type: 'movie',
                        releaseDate: '2024-06-01T00:00:00+00:00',
                        posterUrl: null,
                        genres: []
                    })
                })
            )

            const { updateMovie } = useMovies()

            // Données à mettre à jour
            const updatedData = {
                title: 'Updated Movie',
                duration: 150
            }

            const result = await updateMovie(1, updatedData)

            // Vérification que les données sont bien mises à jour
            expect(result).toBeTruthy()
            expect(result.id).toBe(1)
            expect(result.title).toBe('Updated Movie')
            expect(result.duration).toBe(150)
        })

        /**
         * Vérifie que la mise à jour nécessite une authentification
         */
        it('devrait requérir une authentification', async () => {
            // Override temporaire pour le test d'authentification
            server.use(
                http.post(`${API_URL}/movies/:id`, async ({ request }) => {
                    const authHeader = request.headers.get('Authorization')

                    if (!authHeader) {
                        return HttpResponse.json(
                            { message: 'Unauthorized' },
                            { status: 401 }
                        )
                    }

                    return HttpResponse.json({ id: 1, title: 'Updated' })
                })
            )

            // Retrait du token pour simuler un utilisateur non authentifié
            const auth = useAuthStore()
            auth.token = null

            const { updateMovie } = useMovies()

            const updatedData = { title: 'Updated Title' }

            // La mise à jour devrait échouer sans token
            await expect(updateMovie(1, updatedData)).rejects.toThrow()
        })
    })

    /**
     * Tests de suppression de films
     */
    describe('deleteMovie', () => {
        /**
         * Vérifie que la suppression retire bien le film de la liste locale
         */
        it('devrait supprimer un film et le retirer de la liste', async () => {
            const { movies, fetchMovies, deleteMovie } = useMovies()

            // Chargement initial de la liste
            await fetchMovies()
            expect(movies.value).toHaveLength(2)

            // Suppression d'un film
            await deleteMovie(1)

            // Vérification que le film est retiré de la liste
            expect(movies.value).toHaveLength(1)
            expect(movies.value.find(m => m.id === 1)).toBeUndefined()
        })

        /**
         * Vérifie que la suppression nécessite une authentification
         */
        it('devrait requérir une authentification', async () => {
            // Retrait du token pour simuler un utilisateur non authentifié
            const auth = useAuthStore()
            auth.token = null

            const { deleteMovie } = useMovies()

            // La suppression devrait échouer sans token
            await expect(deleteMovie(1)).rejects.toThrow()
        })

        /**
         * Vérifie la gestion des erreurs lors de la suppression d'un film inexistant
         */
        it('devrait gérer les erreurs 404 lors de la suppression', async () => {
            // Override temporaire pour simuler un film inexistant
            server.use(
                http.delete(`${API_URL}/movies/:id`, () => {
                    return HttpResponse.json(
                        { message: 'Movie not found' },
                        { status: 404 }
                    )
                })
            )

            const { deleteMovie } = useMovies()

            // La suppression devrait lever une exception pour un film inexistant
            await expect(deleteMovie(999)).rejects.toThrow()
        })
    })
})