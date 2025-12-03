import { http, HttpResponse } from 'msw'

// URL de base de l'API mockée pour les tests
const API_URL = 'http://localhost:8000/api'

/**
 * Handlers MSW (Mock Service Worker) pour intercepter les appels API
 * Simule le comportement du backend Symfony/API Platform pendant les tests
 */
export const handlers = [
    /**
     * POST /login_check - Authentification utilisateur
     * Simule la connexion avec validation des credentials
     */
    http.post(`${API_URL}/login_check`, async ({ request }) => {
        const body = await request.json()

        // Validation des credentials mockés
        if (body.email === 'admin@example.com' && body.password === 'admin123') {
            return HttpResponse.json({
                token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGVzIjpbIlJPTEVfVVNFUiJdLCJleHAiOjk5OTk5OTk5OTl9.test',
                refresh_token: 'fake-refresh-token'
            })
        }

        // Retour d'erreur si credentials invalides
        return HttpResponse.json(
            { message: 'Invalid credentials' },
            { status: 401 }
        )
    }),

    /**
     * POST /register - Création d'un nouveau compte utilisateur
     * Simule la validation de l'email unique
     */
    http.post(`${API_URL}/register`, async ({ request }) => {
        const body = await request.json()

        // Simulation d'un email déjà existant
        if (body.email === 'existing@example.com') {
            return HttpResponse.json(
                { message: 'Email already exists' },
                { status: 400 }
            )
        }

        // Création réussie
        return HttpResponse.json({ message: 'User created' }, { status: 201 })
    }),

    /**
     * POST /token/refresh - Rafraîchissement du token JWT
     * Simule le renouvellement d'un access token via refresh token
     */
    http.post(`${API_URL}/token/refresh`, async ({ request }) => {
        const body = await request.json()

        // Validation du refresh token
        if (body.refresh_token === 'fake-refresh-token') {
            return HttpResponse.json({
                token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwicm9sZXMiOlsiUk9MRV9VU0VSIl0sImV4cCI6OTk5OTk5OTk5OX0.newtoken',
                refresh_token: 'new-fake-refresh-token'
            })
        }

        // Retour d'erreur si refresh token invalide
        return HttpResponse.json(
            { message: 'Invalid refresh token' },
            { status: 401 }
        )
    }),

    /**
     * GET /users/:id - Récupération des données d'un utilisateur
     * Retourne les informations basiques incluant les favoris
     */
    http.get(`${API_URL}/users/:id`, ({ params }) => {
        return HttpResponse.json({
            id: parseInt(params.id),
            email: 'user@example.com',
            roles: ['ROLE_USER'],
            movies: []
        })
    }),

    /**
     * PATCH /users/:id - Mise à jour partielle d'un utilisateur
     * Utilisé principalement pour le toggle des favoris
     * Nécessite une authentification via header Authorization
     */
    http.patch(`${API_URL}/users/:id`, async ({ params, request }) => {
        const authHeader = request.headers.get('Authorization')

        // Vérification de la présence du token d'authentification
        if (!authHeader) {
            return HttpResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Retour de l'utilisateur avec un favori ajouté
        return HttpResponse.json({
            id: parseInt(params.id),
            email: 'user@example.com',
            roles: ['ROLE_USER'],
            movies: ['/api/movies/1']
        })
    }),

    /**
     * GET /movies - Liste des films avec filtres optionnels
     * Supporte les query params : type (movie/series) et title (recherche)
     */
    http.get(`${API_URL}/movies`, ({ request }) => {
        const url = new URL(request.url)
        const type = url.searchParams.get('type')
        const title = url.searchParams.get('title')

        // Dataset de films mockés
        let movies = [
            {
                id: 1,
                title: 'Inception',
                description: 'A thief who steals corporate secrets',
                duration: 148,
                type: 'movie',
                releaseDate: '2010-07-16T00:00:00+00:00',
                posterUrl: '/uploads/inception.jpg',
                genres: [{ id: 1, name: 'Sci-Fi' }]
            },
            {
                id: 2,
                title: 'Breaking Bad',
                description: 'A chemistry teacher turned meth manufacturer',
                duration: 47,
                type: 'series',
                releaseDate: '2008-01-20T00:00:00+00:00',
                posterUrl: '/uploads/breaking-bad.jpg',
                genres: [{ id: 2, name: 'Drama' }]
            }
        ]

        // Application du filtre par type si présent
        if (type) {
            movies = movies.filter(m => m.type === type)
        }

        // Application du filtre par titre si présent
        if (title) {
            movies = movies.filter(m =>
                m.title.toLowerCase().includes(title.toLowerCase())
            )
        }

        // Retour au format API Platform (collection avec membre)
        return HttpResponse.json({ member: movies })
    }),

    /**
     * GET /movies/:id - Détails d'un film spécifique
     * Retourne les informations complètes incluant le trailer
     */
    http.get(`${API_URL}/movies/:id`, ({ params }) => {
        // Base de données mockée des films
        const movies = {
            1: {
                id: 1,
                title: 'Inception',
                description: 'A thief who steals corporate secrets',
                duration: 148,
                type: 'movie',
                releaseDate: '2010-07-16T00:00:00+00:00',
                posterUrl: '/uploads/inception.jpg',
                trailer: 'https://youtube.com/watch?v=test',
                genres: [{ id: 1, name: 'Sci-Fi' }]
            }
        }

        const movie = movies[params.id]

        // Gestion du cas où le film n'existe pas
        if (!movie) {
            return HttpResponse.json(
                { message: 'Movie not found' },
                { status: 404 }
            )
        }

        return HttpResponse.json(movie)
    }),

    /**
     * POST /movies - Création d'un nouveau film
     * Nécessite une authentification (réservé aux admins en production)
     */
    http.post(`${API_URL}/movies`, async ({ request }) => {
        const authHeader = request.headers.get('Authorization')

        // Vérification de l'authentification
        if (!authHeader) {
            return HttpResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Retour du film créé avec un ID généré
        return HttpResponse.json({
            id: 3,
            title: 'New Movie',
            description: 'Test description',
            duration: 120,
            type: 'movie',
            releaseDate: '2024-01-01T00:00:00+00:00',
            posterUrl: null,
            genres: []
        }, { status: 201 })
    }),

    /**
     * PUT /movies/:id - Mise à jour complète d'un film
     * Nécessite une authentification (réservé aux admins en production)
     */
    http.put(`${API_URL}/movies/:id`, async ({ params, request }) => {
        const authHeader = request.headers.get('Authorization')

        // Vérification de l'authentification
        if (!authHeader) {
            return HttpResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Retour du film mis à jour
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
    }),

    /**
     * DELETE /movies/:id - Suppression d'un film
     * Nécessite une authentification (réservé aux admins en production)
     */
    http.delete(`${API_URL}/movies/:id`, ({ params, request }) => {
        const authHeader = request.headers.get('Authorization')

        // Vérification de l'authentification
        if (!authHeader) {
            return HttpResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Retour 204 No Content pour une suppression réussie
        return new HttpResponse(null, { status: 204 })
    }),

    /**
     * GET /genres - Liste de tous les genres disponibles
     * Endpoint public sans authentification requise
     */
    http.get(`${API_URL}/genres`, () => {
        return HttpResponse.json({
            member: [
                { id: 1, name: 'Action' },
                { id: 2, name: 'Sci-Fi' },
                { id: 3, name: 'Drama' }
            ]
        })
    }),

    /**
     * OPTIONS * - Gestion des requêtes preflight CORS
     * Répond à toutes les requêtes OPTIONS avec les headers CORS appropriés
     */
    http.options('*', () => {
        return new HttpResponse(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization'
            }
        })
    })
]