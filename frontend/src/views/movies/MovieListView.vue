<script setup>
import { onMounted, ref, watch } from 'vue'
import { useAuthStore } from "@/stores/auth";
import { useMovies } from "@/composables/useMovies";
import { useUsers } from "@/composables/useUsers";
import { useGenres } from "@/composables/useGenres";
import { useMovieFilters } from "@/composables/useMovieFilters";

const auth = useAuthStore();
const { movies, loading, fetchMovies, deleteMovie } = useMovies();
const { toggleFavorite } = useUsers();
const { genres, fetchGenres } = useGenres();

const {
    searchQuery,
    selectedGenres,
    typeFilter,
    filteredMovies,
    typeOptions,
    resetFilters,
    typeLabel
} = useMovieFilters(movies)

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const displayedMovies = ref([])
const isAnimating = ref(false)

// Toast notification
const toast = ref({ show: false, message: '', type: '' })

const showToast = (message, type = 'success') => {
    toast.value = { show: true, message, type }
    setTimeout(() => {
        toast.value.show = false
    }, 2500)
}

onMounted(async () => {
    await Promise.all([fetchMovies(), fetchGenres()])
    displayedMovies.value = filteredMovies.value.map(m => ({ ...m, entering: true }))
})

watch(filteredMovies, (newMovies) => {
    if (isAnimating.value) return

    isAnimating.value = true
    displayedMovies.value = displayedMovies.value.map(m => ({ ...m, leaving: true }))

    setTimeout(() => {
        displayedMovies.value = newMovies.map(m => ({ ...m, entering: true }))
        isAnimating.value = false
    }, 400)
})

const toggleGenre = (genreName) => {
    const index = selectedGenres.value.indexOf(genreName)
    index > -1 ? selectedGenres.value.splice(index, 1) : selectedGenres.value.push(genreName)
}

const handleFavorite = async (movie) => {
    const isFavorite = auth.user.movies?.includes(`/api/movies/${movie.id}`)
    await toggleFavorite(movie.id)

    if (isFavorite) {
        showToast(`${movie.title} retiré des favoris`, 'remove')
    } else {
        showToast(`${movie.title} ajouté aux favoris`, 'add')
    }
}
</script>

<template>
    <div class="p-6 bg-black min-h-screen">
        <!-- Toast Notification -->
        <transition name="toast">
            <div v-if="toast.show"
                class="fixed top-6 right-6 z-50 px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px]"
                :class="{
                    'bg-gradient-to-r from-red-600 to-red-700': toast.type === 'remove',
                    'bg-gradient-to-r from-green-600 to-green-700': toast.type === 'add'
                }">
                <span class="text-2xl text-yellow-400">{{ toast.type === 'add' ? "★" : "☆" }}</span>
                <span class="text-white font-medium flex-1">{{ toast.message }}</span>
            </div>
        </transition>

        <h1 class="text-4xl font-bold text-red-600 mb-6">Films et Séries</h1>

        <router-link v-if="auth.isAdmin" to="/movies/create"
            class="inline-block bg-red-600 text-white px-6 py-2 rounded mb-6 hover:bg-red-500 transition">
            + Ajouter un film
        </router-link>

        <div class="flex flex-col sm:flex-row gap-4 mb-6 items-start">
            <input v-model="searchQuery" type="text" placeholder="Rechercher un film..."
                class="p-2 rounded bg-gray-900 text-white border border-red-600 flex-1" />

            <select v-model="typeFilter"
                class="cursor-pointer p-2 rounded bg-gray-900 text-white border border-red-600">
                <option value="">Tous les types</option>
                <option v-for="type in typeOptions" :key="type" :value="type">{{ typeLabel(type) }}</option>
            </select>

            <div class="flex flex-wrap gap-2">
                <label v-for="genre in genres" :key="genre.id"
                    class="inline-flex items-center space-x-2 text-white border border-red-600 rounded px-2 py-1 cursor-pointer hover:bg-red-700"
                    :class="{ 'bg-red-600': selectedGenres.includes(genre.name) }">
                    <input type="checkbox" :value="genre.name" :checked="selectedGenres.includes(genre.name)"
                        @change="toggleGenre(genre.name)" class="cursor-pointer form-checkbox text-red-600" />
                    <span>{{ genre.name }}</span>
                </label>
            </div>

            <button @click="resetFilters"
                class="cursor-pointer ml-2 bg-gray-900 text-red-600 border border-red-600 px-3 py-1 rounded hover:bg-red-700 transition">
                Reset filtres
            </button>
        </div>

        <div v-if="loading" class="flex justify-center items-center py-20">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div v-for="(m, index) in displayedMovies" :key="m.id" class="movie-card"
                :class="{ 'movie-leaving': m.leaving, 'movie-entering': m.entering }"
                :style="{ '--delay': `${index * 40}ms` }">

                <div
                    class="bg-black border border-red-600 rounded-lg overflow-hidden shadow-lg shadow-red-900/50 hover:shadow-2xl hover:shadow-red-700/50 h-full">
                    <router-link :to="`/movies/${m.id}`" class="block h-48 w-full overflow-hidden">
                        <img v-if="m.posterUrl" :src="`${API_BASE_URL}${m.posterUrl}`" :alt="`Poster de ${m.title}`"
                            class="h-full w-full object-cover" />
                        <div v-else class="bg-gray-900 h-full w-full flex items-center justify-center text-gray-500">
                            Image
                        </div>
                    </router-link>

                    <div class="p-4">
                        <div class="flex justify-between items-start mb-2">
                            <router-link :to="`/movies/${m.id}`">
                                <h3 class="text-xl font-bold text-white">{{ m.title }}</h3>
                            </router-link>

                            <button v-if="auth.isLoggedIn" @click="handleFavorite(m)"
                                class="text-yellow-400 text-2xl cursor-pointer flex-shrink-0 hover:scale-110 transition-transform">
                                {{ auth.user.movies?.includes(`/api/movies/${m.id}`) ? "★" : "☆" }}
                            </button>
                        </div>

                        <p class="text-gray-300 mb-2">{{ m.duration }} min</p>

                        <div v-if="auth.isAdmin" class="flex space-x-2">
                            <router-link :to="`/movies/${m.id}/edit`"
                                class="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-500 transition">
                                Modifier
                            </router-link>
                            <button @click="deleteMovie(m.id)"
                                class="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-500 transition cursor-pointer">
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.movie-card {
    opacity: 1;
    transform: translateY(0) scale(1);
}

.movie-entering {
    animation: movieEnter 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    animation-delay: var(--delay);
    opacity: 0;
}

.movie-leaving {
    animation: movieLeave 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes movieEnter {
    0% {
        opacity: 0;
        transform: translateY(30px) scale(0.92);
    }

    60% {
        opacity: 1;
        transform: translateY(-5px) scale(1.02);
    }

    100% {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@keyframes movieLeave {
    0% {
        opacity: 1;
        transform: translateY(0) scale(1);
    }

    100% {
        opacity: 0;
        transform: translateY(20px) scale(0.92);
    }
}

/* Toast animations */
.toast-enter-active {
    animation: toastEnter 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.toast-leave-active {
    animation: toastLeave 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes toastEnter {
    0% {
        opacity: 0;
        transform: translateX(100%) scale(0.9);
    }

    100% {
        opacity: 1;
        transform: translateX(0) scale(1);
    }
}

@keyframes toastLeave {
    0% {
        opacity: 1;
        transform: translateX(0) scale(1);
    }

    100% {
        opacity: 0;
        transform: translateX(100%) scale(0.9);
    }
}
</style>