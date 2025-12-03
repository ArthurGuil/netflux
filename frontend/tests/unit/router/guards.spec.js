import { describe, it, expect, beforeEach } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

/**
 * Suite de tests pour les guards de navigation du routeur
 * Vérifie que les protections d'accès aux routes fonctionnent correctement
 * selon l'état d'authentification et les rôles de l'utilisateur
 */
describe('Router Guards', () => {
    let router
    let pinia

    /**
     * Configuration initiale avant chaque test
     * Crée une instance Pinia et configure un routeur avec des guards
     */
    beforeEach(() => {
        // Création d'une instance Pinia partagée pour tous les stores
        pinia = createPinia()
        setActivePinia(pinia)

        // Configuration du routeur avec routes de test
        router = createRouter({
            history: createMemoryHistory(),
            routes: [
                { path: '/', component: { template: '<div>Home</div>' } },
                { path: '/login', component: { template: '<div>Login</div>' } },
                {
                    path: '/movies',
                    component: { template: '<div>Movies</div>' },
                    meta: { requiresAuth: true }
                },
                {
                    path: '/movies/create',
                    component: { template: '<div>Create</div>' },
                    meta: { requiresAuth: true, requiresAdmin: true }
                }
            ]
        })

        // Configuration du guard de navigation global
        // Implémente la logique d'authentification et d'autorisation
        router.beforeEach((to, from, next) => {
            // Utilisation du store d'authentification avec l'instance Pinia partagée
            const auth = useAuthStore(pinia)

            // Vérification si la route nécessite une authentification
            if (to.meta.requiresAuth && !auth.isLoggedIn) {
                // Redirection vers login si non authentifié
                next('/login')
            } else if (to.meta.requiresAdmin && !auth.isAdmin) {
                // Redirection vers home si pas administrateur
                next('/')
            } else {
                // Autorisation d'accès
                next()
            }
        })
    })

    /**
     * Test de redirection pour utilisateur non authentifié
     * Vérifie qu'un utilisateur non connecté est redirigé vers /login
     * lorsqu'il tente d'accéder à une route protégée
     */
    it('devrait rediriger vers /login si non authentifié', async () => {
        // Tentative d'accès à une route protégée sans authentification
        await router.push('/movies')
        await router.isReady()

        // Vérification de la redirection vers la page de login
        expect(router.currentRoute.value.path).toBe('/login')
    })

    /**
     * Test d'accès autorisé pour utilisateur authentifié
     * Vérifie qu'un utilisateur connecté peut accéder aux routes protégées
     */
    it('devrait autoriser l\'accès si authentifié', async () => {
        const auth = useAuthStore()

        // Configuration d'un token JWT valide pour un utilisateur standard
        auth.token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwicm9sZXMiOlsiUk9MRV9VU0VSIl0sImV4cCI6OTk5OTk5OTk5OX0.test'

        // Tentative d'accès à une route protégée avec authentification
        await router.push('/movies')
        await router.isReady()

        // Vérification que l'accès est autorisé
        expect(router.currentRoute.value.path).toBe('/movies')
    })

    /**
     * Test de restriction d'accès admin pour utilisateur standard
     * Vérifie qu'un utilisateur non-admin ne peut pas accéder aux routes admin
     */
    it('devrait bloquer l\'accès admin aux non-admins', async () => {
        const auth = useAuthStore()

        // Configuration d'un token JWT pour un utilisateur standard (ROLE_USER uniquement)
        auth.token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwicm9sZXMiOlsiUk9MRV9VU0VSIl0sImV4cCI6OTk5OTk5OTk5OX0.test'

        // Tentative d'accès à une route admin sans les permissions nécessaires
        await router.push('/movies/create')
        await router.isReady()

        // Vérification de la redirection vers la page d'accueil
        expect(router.currentRoute.value.path).toBe('/')
    })

    /**
     * Test d'accès autorisé pour administrateur
     * Vérifie qu'un utilisateur avec ROLE_ADMIN peut accéder aux routes admin
     */
    it('devrait autoriser l\'accès admin aux admins', async () => {
        // Utilisation de l'instance Pinia partagée
        const auth = useAuthStore(pinia)

        // Configuration d'un token JWT avec le rôle ROLE_ADMIN
        const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGVzIjpbIlJPTEVfVVNFUiIsIlJPTEVfQURNSU4iXSwiZXhwIjo5OTk5OTk5OTk5fQ.test'
        auth.token = adminToken

        // Configuration manuelle du payload décodé du JWT
        auth.decoded = {
            id: 1,
            email: 'admin@example.com',
            roles: ['ROLE_USER', 'ROLE_ADMIN'],
            exp: 9999999999
        }

        // Tentative d'accès à une route admin avec les permissions appropriées
        await router.push('/movies/create')
        await router.isReady()

        // Vérification que l'accès est autorisé
        expect(router.currentRoute.value.path).toBe('/movies/create')
    })
})