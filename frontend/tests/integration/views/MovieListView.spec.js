import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import MovieListView from '@/views/movies/MovieListView.vue'
import { useAuthStore } from '@/stores/auth'
import { createTestingPinia } from '@pinia/testing'
import { server } from '../../mocks/server'
import { http, HttpResponse } from 'msw'

// URL de base de l'API utilisée dans les tests
const API_URL = 'http://localhost:8000/api'

/**
 * Suite de tests pour le composant MovieListView
 * Vérifie le comportement de la liste des films incluant le chargement,
 * le filtrage, les permissions utilisateur et la gestion des favoris
 */
describe('MovieListView', () => {
    let pinia
    let router

    /**
     * Configuration initiale exécutée avant chaque test
     * Initialise Pinia, le routeur et configure un utilisateur authentifié basique
     */
    beforeEach(() => {
        // Initialisation du store Pinia pour la gestion d'état
        pinia = createPinia()
        setActivePinia(pinia)

        // Configuration du routeur avec les routes nécessaires aux tests
        router = createRouter({
            history: createMemoryHistory(),
            routes: [
                { path: '/', component: { template: '<div>Home</div>' } },
                { path: '/movies', component: MovieListView },
                { path: '/movies/create', component: { template: '<div>Create</div>' } },
                { path: '/movies/:id', component: { template: '<div>Detail</div>' } }
            ]
        })

        // Configuration d'un utilisateur authentifié avec le rôle USER par défaut
        const auth = useAuthStore()
        auth.token = 'fake-jwt-token'
        auth.user = {
            id: 1,
            email: 'user@test.com',
            roles: ['ROLE_USER'],
            movies: []
        }
        auth.decoded = {
            id: 1,
            roles: ['ROLE_USER']
        }
    })

    /**
     * Test d'affichage de la liste des films
     * Vérifie que les films mockés sont correctement rendus après le chargement
     */
    it('devrait afficher la liste des films après chargement', async () => {
        const wrapper = mount(MovieListView, {
            global: {
                plugins: [pinia, router]
            }
        })

        // Attente de la résolution de toutes les promesses en cours
        await flushPromises()

        // Vérification de la présence des titres de films dans le DOM
        expect(wrapper.text()).toContain('Inception')
        expect(wrapper.text()).toContain('Breaking Bad')
    })

    /**
     * Test de l'état de chargement
     * Vérifie que l'indicateur de chargement est actif pendant la récupération des données
     * puis se désactive une fois le chargement terminé
     */
    it('devrait afficher un loader pendant le chargement', async () => {
        // Override temporaire du handler MSW pour simuler un délai de réponse
        server.use(
            http.get(`${API_URL}/movies`, async () => {
                await new Promise(resolve => setTimeout(resolve, 50))
                return HttpResponse.json({
                    member: [
                        { id: 1, title: 'Inception', duration: 148, type: 'movie' }
                    ]
                })
            }),
            http.get(`${API_URL}/genres`, () => {
                return HttpResponse.json({
                    member: [
                        { id: 1, name: 'Action' },
                        { id: 2, name: 'Sci-Fi' }
                    ]
                })
            })
        )

        const wrapper = mount(MovieListView, {
            global: {
                plugins: [pinia, router]
            }
        })

        // Vérification que le loader est actif au montage du composant
        expect(wrapper.vm.loading).toBe(true)

        // Attente de la fin du chargement simulé
        await new Promise(resolve => setTimeout(resolve, 100))
        await flushPromises()

        // Vérification que le loader est désactivé après chargement
        expect(wrapper.vm.loading).toBe(false)
    })

    /**
     * Test du filtrage par recherche textuelle
     * Vérifie que la saisie dans le champ de recherche filtre correctement la liste
     */
    it('devrait filtrer les films par recherche textuelle', async () => {
        const wrapper = mount(MovieListView, {
            global: {
                plugins: [pinia, router]
            }
        })

        await flushPromises()

        // Simulation de la saisie d'un terme de recherche
        const searchInput = wrapper.find('input[type="text"]')
        await searchInput.setValue('Inception')
        await flushPromises()

        // Attente du délai de debounce potentiel
        await new Promise(resolve => setTimeout(resolve, 500))

        // Vérification que le nombre de résultats est réduit après filtrage
        const movieCards = wrapper.findAll('.movie-card')
        expect(movieCards.length).toBeLessThanOrEqual(2)
    })

    /**
     * Test du filtrage par type de média
     * Vérifie que le filtre type (movie/series) n'affiche que les contenus correspondants
     */
    it('devrait filtrer par type (movie/series)', async () => {
        const wrapper = mount(MovieListView, {
            global: {
                plugins: [pinia, router]
            }
        })

        await flushPromises()

        // Sélection du type "movie" dans le filtre
        const select = wrapper.find('select')
        await select.setValue('movie')
        await wrapper.vm.$nextTick()

        // Récupération des films filtrés depuis le composant
        const filteredMovies = wrapper.vm.filteredMovies

        // Vérification que seuls les films de type "movie" sont retournés
        expect(filteredMovies.length).toBeGreaterThan(0)
        expect(filteredMovies.every(m => m.type === 'movie')).toBe(true)
    })

    /**
     * Test des permissions administrateur
     * Vérifie que le bouton d'ajout de film est visible uniquement pour les admins
     */
    it('devrait afficher le bouton Ajouter pour les admins', async () => {
        // Configuration d'un utilisateur avec le rôle ADMIN
        const auth = useAuthStore()
        auth.user.roles = ['ROLE_ADMIN']
        auth.decoded = { id: 1, roles: ['ROLE_ADMIN'] }

        const wrapper = mount(MovieListView, {
            global: {
                plugins: [pinia, router]
            }
        })

        await flushPromises()

        // Vérification de la présence du bouton d'ajout
        expect(wrapper.text()).toContain('Ajouter un film')
    })

    /**
     * Test des restrictions utilisateur
     * Vérifie que le bouton d'ajout est caché pour les utilisateurs non-admin
     */
    it('ne devrait pas afficher le bouton Ajouter pour les users', async () => {
        const wrapper = mount(MovieListView, {
            global: {
                plugins: [pinia, router]
            }
        })

        await flushPromises()

        // Vérification de l'absence du bouton d'ajout
        expect(wrapper.text()).not.toContain('Ajouter un film')
    })

    /**
     * Test de la fonctionnalité toggle favoris
     * Vérifie que le clic sur le bouton favori déclenche l'affichage d'un toast
     */
    it('devrait gérer le toggle des favoris', async () => {
        // Initialisation avec aucun favori
        const auth = useAuthStore()
        auth.user.movies = []

        const wrapper = mount(MovieListView, {
            global: {
                plugins: [pinia, router]
            }
        })

        await flushPromises()

        // Recherche des boutons favoris (étoile vide ou pleine)
        const favoriteButtons = wrapper.findAll('button').filter(btn =>
            btn.text().includes('☆') || btn.text().includes('★')
        )

        expect(favoriteButtons.length).toBeGreaterThan(0)

        // Simulation du clic sur le premier bouton favori
        await favoriteButtons[0].trigger('click')
        await flushPromises()

        // Vérification que le toast est affiché
        expect(wrapper.vm.toast.show).toBe(true)
    })

    /**
     * Test de la notification d'ajout aux favoris
     * Vérifie que l'ajout d'un film aux favoris affiche un toast avec le bon message
     */
    it('devrait afficher un toast lors de l\'ajout aux favoris', async () => {
        // Configuration initiale sans favoris
        const auth = useAuthStore()
        auth.user.movies = []

        // Mock de la requête PATCH pour l'ajout aux favoris
        server.use(
            http.patch(`${API_URL}/users/1`, () => {
                return HttpResponse.json({
                    id: 1,
                    email: 'user@example.com',
                    movies: ['/api/movies/1']
                })
            })
        )

        const wrapper = mount(MovieListView, {
            global: {
                plugins: [pinia, router]
            }
        })

        await flushPromises()

        // Recherche des boutons favoris par leur classe CSS
        const favoriteButtons = wrapper.findAll('button').filter(btn =>
            btn.classes().includes('text-yellow-400')
        )

        expect(favoriteButtons.length).toBeGreaterThan(0)

        // Simulation de l'ajout aux favoris
        await favoriteButtons[0].trigger('click')
        await flushPromises()

        // Vérification du contenu et du type du toast affiché
        expect(wrapper.vm.toast.show).toBe(true)
        expect(wrapper.vm.toast.message).toContain('ajouté aux favoris')
        expect(wrapper.vm.toast.type).toBe('add')
    })

    /**
     * Test de la réinitialisation des filtres
     * Vérifie que le bouton Reset efface tous les filtres appliqués
     */
    it('devrait réinitialiser les filtres', async () => {
        const wrapper = mount(MovieListView, {
            global: {
                plugins: [createTestingPinia(), router],
                stubs: { RouterLink: true }
            }
        })

        await flushPromises()

        // Application d'un filtre de recherche
        const searchInput = wrapper.find('input[type="text"]')
        await searchInput.setValue('Inception')

        // Recherche et clic sur le bouton Reset
        const resetButton = wrapper.findAll('button').find(btn => btn.text().includes('Reset'))
        expect(resetButton).toBeTruthy()

        await resetButton.trigger('click')
        await wrapper.vm.$nextTick()

        // Vérification que le champ de recherche est bien réinitialisé
        expect(wrapper.vm.searchQuery).toBe('')
    })
})