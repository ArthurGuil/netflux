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
    },
    {
        path: "/register",
        name: "register",
        component: RegisterView,
    },

    // GENRES (index + form create/edit)
    {
        path: "/genres",
        name: "genres.index",
        component: GenreListView,
        meta: { requiresAuth: true }
    },
    {
        path: "/genres/create",
        name: "genres.create",
        component: GenreFormView,
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: "/genres/:id/edit",
        name: "genres.edit",
        component: GenreFormView,
        meta: { requiresAuth: true, requiresAdmin: true }
    },

    // MOVIES (index + form create/edit + detail)
    {
        path: "/movies",
        name: "movies.index",
        component: MovieListView,
        meta: { requiresAuth: true }
    },
    {
        path: "/movies/create",
        name: "movies.create",
        component: MovieFormView,
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: "/movies/:id/edit",
        name: "movies.edit",
        component: MovieFormView,
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/movies/:id',
        name: 'movie-detail',
        component: MovieDetailView,
        meta: { requiresAuth: true }
    },

    // USERS
    {
        path: '/users',
        name: 'users.index',
        component: UserListView,
        meta: { requiresAuth: true, requiresAdmin: true }
    },

    // FAVORIS
    {
        path: "/favorites",
        name: "favorites",
        component: () => import("@/views/movies/FavoritesView.vue"),
        meta: { requiresAuth: true }
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

export default router;
