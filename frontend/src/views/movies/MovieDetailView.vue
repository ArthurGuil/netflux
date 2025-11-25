<script setup>
import { onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useMovies } from "@/composables/useMovies";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();

const { movie, loading, error, fetchMovie } = useMovies();
const auth = useAuthStore();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

onMounted(async () => {
    await fetchMovie(route.params.id);
});

const posterUrl = computed(() =>
    movie.value?.posterUrl ? `${API_BASE_URL}${movie.value.posterUrl}` : null
);

const trailerEmbedUrl = computed(() => {
    if (!movie.value?.trailer) return null;

    // Extrait l'id youtube
    const url = movie.value.trailer;

    try {
        const urlObj = new URL(url);
        const videoId = urlObj.searchParams.get("v");

        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    } catch {
        return null;
    }
});

</script>

<template>
    <div class="p-6 bg-black min-h-screen text-white">
        <!-- Loader -->
        <div v-if="loading" class="flex justify-center items-center h-64">
            <span class="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></span>
        </div>

        <!-- Erreur -->
        <p v-if="error && !loading" class="text-red-600">
            Une erreur est survenue : {{ error.message }}
        </p>

        <!-- Contenu -->
        <div v-if="movie && !loading" class="max-w-4xl mx-auto">
            <!-- Boutons -->
            <div class="flex justify-between mb-6">
                <button @click="router.push('/movies')"
                    class="cursor-pointer bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500 transition">
                    ← Retour
                </button>

                <router-link v-if="auth.isAdmin" :to="`/movies/${movie.id}/edit`"
                    class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500 transition">
                    Modifier
                </router-link>
            </div>

            <!-- En-tête -->
            <h1 class="text-4xl font-bold text-red-600 mb-6">
                {{ movie.title }}
            </h1>

            <div class="flex flex-col md:flex-row gap-8">
                <!-- Poster -->
                <div class="flex-shrink-0">
                    <img v-if="posterUrl" :src="posterUrl" :alt="`Affiche de ${movie.title}`"
                        class="w-64 rounded border border-red-600 shadow-lg shadow-red-900/50" />
                    <div v-else
                        class="w-64 h-96 bg-gray-900 flex items-center justify-center rounded border border-red-600">
                        Pas d'image
                    </div>
                </div>

                <!-- Infos -->
                <div class="flex-grow space-y-4">
                    <p class="text-gray-300"><strong class="text-red-600">Durée :</strong> {{ movie.duration }} min</p>

                    <p class="text-gray-300">
                        <strong class="text-red-600">Type :</strong>
                        {{ movie.type === "movie" ? "Film" : "Série" }}
                    </p>

                    <p class="text-gray-300">
                        <strong class="text-red-600">Date de sortie :</strong>
                        {{ new Date(movie.releaseDate).toLocaleDateString("fr-FR") }}
                    </p>

                    <p class="text-gray-300">
                        <strong class="text-red-600">Genres : </strong>
                        <span v-if="movie.genres?.length">
                            {{movie.genres.map(g => g.name).join(", ")}}
                        </span>
                        <span v-else>Aucun</span>
                    </p>

                    <div>
                        <strong class="text-red-600 block mb-1">Description :</strong>
                        <p class="text-gray-300 whitespace-pre-line">{{ movie.description }}</p>
                    </div>

                    <div v-if="trailerEmbedUrl" class="mt-6">
                        <strong class="text-red-600 block mb-1">Trailer :</strong>
                        <iframe :src="trailerEmbedUrl" class="w-full h-64 md:h-96 rounded border border-red-600"
                            frameborder="0" allowfullscreen></iframe>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
