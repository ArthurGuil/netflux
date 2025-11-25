<script setup>
import { computed, onMounted } from "vue";
import { useMovies } from "@/composables/useMovies";
import { useAuthStore } from "@/stores/auth";
import { useUsers } from "@/composables/useUsers";

const { movies, loading, fetchMovies } = useMovies();
const auth = useAuthStore();
const { toggleFavorite } = useUsers();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Charger tous les films une fois
onMounted(fetchMovies);

// Films favoris filtrés
const favoriteMovies = computed(() => {
    if (!auth.user?.movies) return [];
    const favoriteIds = auth.user.movies.map(iri => {
        return Number(iri.split("/").pop());
    });
    return movies.value.filter(m => favoriteIds.includes(m.id));
});

// Toggle favoris depuis cette vue
const handleFavorite = async (movieId) => {
    const updated = await toggleFavorite(movieId);
    auth.user.movies = updated;
};
</script>

<template>
    <div class="p-6 bg-black min-h-screen">
        <h1 class="text-4xl font-bold text-red-600 mb-6">
            Mes films favoris
        </h1>

        <div v-if="loading" class="text-white">Chargement...</div>

        <div v-if="favoriteMovies.length === 0 && !loading" class="text-gray-400 text-lg">
            Vous n'avez aucun film en favoris.
        </div>

        <div v-if="favoriteMovies.length > 0"
            class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

            <div v-for="m in favoriteMovies" :key="m.id"
                class="bg-black border border-red-600 rounded-lg overflow-hidden shadow-lg shadow-red-900/50">

                <router-link :to="`/movies/${m.id}`">
                    <img v-if="m.posterUrl" :src="`${API_BASE_URL}${m.posterUrl}`" :alt="m.title"
                        class="h-48 w-full object-cover" />
                    <div v-else class="bg-gray-800 h-48 flex items-center justify-center text-gray-500">
                        Image
                    </div>
                </router-link>

                <div class="p-4">
                    <div class="flex justify-between items-center">
                        <router-link :to="`/movies/${m.id}`">
                            <h3 class="text-xl text-white font-bold">
                                {{ m.title }}
                            </h3>
                        </router-link>

                        <button class="cursor-pointer text-yellow-400 text-2xl" @click="handleFavorite(m.id)">
                            ★
                        </button>
                    </div>

                    <p class="text-gray-300">{{ m.duration }} min</p>
                </div>
            </div>

        </div>
    </div>
</template>
