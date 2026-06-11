import { createRouter, createWebHistory } from "vue-router";

// Views
import HomeView from "../views/HomeView.vue";

// Auth
import LoginView from "../views/auth/LoginView.vue";
import RegisterView from "../views/auth/RegisterView.vue";

// Genres
import GenreListView from "../views/genres/GenreListView.vue";
import GenreFormView from "../views/genres/GenreFormView.vue";

// Movies
import MovieListView from "../views/movies/MovieListView.vue";
import MovieFormView from "../views/movies/MovieFormView.vue";
import MovieDetailView from "../views/movies/MovieDetailView.vue";

import { useAuthStore } from "@/stores/auth";
import UserListView from "@/views/users/UserListView.vue";

const routes = [
    {
        path: "/",
        name: "home",
        component: HomeView,
    },

    // AUTH
    {
        path: "/login",
        name: "login",
        component: LoginView,
        meta: { title: 'Connexion' }
    },
    {
        path: "/register",
        name: "register",
        component: RegisterView,
        meta: { title: 'Inscription' }
    },

    // GENRES (index + form create/edit)
    {
        path: "/genres",
        name: "genres.index",
        component: GenreListView,
        meta: { requiresAuth: true, title: 'Liste des genres' }
    },
    {
        path: "/genres/create",
        name: "genres.create",
        component: GenreFormView,
        meta: { requiresAuth: true, requiresAdmin: true, title: 'Ajouter un genre' }
    },
    {
        path: "/genres/:id/edit",
        name: "genres.edit",
        component: GenreFormView,
        meta: { requiresAuth: true, requiresAdmin: true, title: 'Modifier un genre' }
    },

    // MOVIES (index + form create/edit + detail)
    {
        path: "/movies",
        name: "movies.index",
        component: MovieListView,
        meta: { requiresAuth: true, title: 'Catalogue' }
    },
    {
        path: "/movies/create",
        name: "movies.create",
        component: MovieFormView,
        meta: { requiresAuth: true, requiresAdmin: true, title: 'Ajouter un film' }
    },
    {
        path: "/movies/:id/edit",
        name: "movies.edit",
        component: MovieFormView,
        meta: { requiresAuth: true, requiresAdmin: true, title: 'Modifier un film' }
    },
    {
        path: '/movies/:id',
        name: 'movie-detail',
        component: MovieDetailView,
        meta: { requiresAuth: true, title: 'Détail du film' }
    },

    // USERS
    {
        path: '/users',
        name: 'users.index',
        component: UserListView,
        meta: { requiresAuth: true, requiresAdmin: true, title: 'Liste des utilisateurs' }
    },

    // FAVORIS
    {
        path: "/favorites",
        name: "favorites",
        component: () => import("@/views/movies/FavoritesView.vue"),
        meta: { requiresAuth: true, title: 'Mes favoris' }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to, from, next) => {
    const auth = useAuthStore();

    if (to.meta.requiresAuth && !auth.token) {
        return next("/login");
    }

    // Si la route nécessite un rôle admin
    if (to.meta.requiresAdmin) {
        // Vérifie si l'utilisateur est admin
        const isAdmin = auth.user?.roles?.includes('ROLE_ADMIN')
        if (!isAdmin) {
            // Redirige vers home ou page d'erreur
            return next("/")
        }
    }

    next();
});

// Gestion basique de la balise title. 
// Pour une gestion plus avancée et pour le SEO, utiliser le package @unhead/vue
router.afterEach((to) => {
  document.title = to.meta.title
    ? `Netflux - ${to.meta.title}`
    : 'Netflux'
});

export default router;
