<template>
    <div class="max-w-3xl mx-auto p-6 bg-black rounded-lg shadow-xl mt-8">
        <button @click="router.push('/movies')"
            class="mb-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500 transition cursor-pointer">
            ← Retour
        </button>
        <h1 class="text-3xl font-bold text-red-600 mb-6">
            {{ isEdit ? "Modifier le film" : "Créer un nouveau film" }}
        </h1>
        <div class="mb-4 p-3 bg-gray-900 border-l-4 border-red-600 text-white text-sm rounded">
            <p>Les champs marqués d'un <span class="text-red-600 font-bold">*</span> sont obligatoires.</p>
        </div>
        <form @submit.prevent="submit" class="space-y-4">

            <!-- Titre -->
            <div>
                <label for="title" class="block text-white font-semibold mb-1">Titre<span class="text-red-600 font-bold">*</span></label>
                <input id="title" v-model="form.title" type="text" class="w-full px-4 py-2 rounded bg-black text-white border border-red-600 
                      focus:outline-none focus:ring-2 focus:ring-red-600" />
                <p v-for="err in fieldErrors('title')" :key="err.code" class="text-red-600 text-sm mt-1">
                    {{ err.message }}
                </p>
            </div>

            <!-- Description -->
            <div>
                <label for="description" class="block text-white font-semibold mb-1">Description<span class="text-red-600 font-bold">*</span></label>
                <textarea id="description" v-model="form.description" class="w-full px-4 py-2 rounded bg-black text-white border border-red-600 
                         focus:outline-none focus:ring-2 focus:ring-red-600"></textarea>
                <p v-for="err in fieldErrors('description')" :key="err.code" class="text-red-600 text-sm mt-1">
                    {{ err.message }}
                </p>
            </div>

            <!-- Durée -->
            <div>
                <label for="duration" class="block text-white font-semibold mb-1">Durée (minutes)<span class="text-red-600 font-bold">*</span></label>
                <input id="duration" v-model.number="form.duration" type="number" min="0" class="w-full px-4 py-2 rounded bg-black text-white border border-red-600 
                      focus:outline-none focus:ring-2 focus:ring-red-600" />
                <p v-for="err in fieldErrors('duration')" :key="err.code" class="text-red-600 text-sm mt-1">
                    {{ err.message }}
                </p>
            </div>

            <!-- Trailer -->
            <div>
                <label for="trailer" class="block text-white font-semibold mb-1">Trailer URL (Lien de la vidéo Youtube)</label>
                <input id="trailer" v-model="form.trailer" type="text" class="w-full px-4 py-2 rounded bg-black text-white border border-red-600 
                      focus:outline-none focus:ring-2 focus:ring-red-600" />
                <p v-for="err in fieldErrors('trailer')" :key="err.code" class="text-red-600 text-sm mt-1">
                    {{ err.message }}
                </p>
            </div>

            <!-- Type -->
            <div>
                <label for="type" class="block text-white font-semibold mb-1">Type<span class="text-red-600 font-bold">*</span></label>
                <select id="type" v-model="form.type" class="w-full px-4 py-2 rounded bg-black text-white border border-red-600 
                       focus:outline-none focus:ring-2 focus:ring-red-600">
                    <option value="movie" class="bg-black text-white">Film</option>
                    <option value="series" class="bg-black text-white">Série</option>
                </select>
                <p v-for="err in fieldErrors('type')" :key="err.code" class="text-red-600 text-sm mt-1">
                    {{ err.message }}
                </p>
            </div>

            <!-- Date de sortie -->
            <div>
                <label for="releaseDate" class="block text-white font-semibold mb-1">Date de sortie<span class="text-red-600 font-bold">*</span></label>
                <input id="releaseDate" v-model="form.releaseDate" type="date" class="w-full px-4 py-2 rounded bg-black text-white border border-red-600 
                      focus:outline-none focus:ring-2 focus:ring-red-600" />
                <p v-for="err in fieldErrors('releaseDate')" :key="err.code" class="text-red-600 text-sm mt-1">
                    {{ err.message }}
                </p>
            </div>

            <!-- Genres -->
            <div>
                <label class="block text-white font-semibold mb-2">Genres</label>
                <div class="flex flex-wrap gap-3">
                    <div v-for="genre in allGenres" :key="genre.id" class="flex items-center">
                        <input type="checkbox" :id="'genre-' + genre.id" :value="genre.id" v-model="form.genres"
                            class="h-4 w-4 text-red-600 bg-black border border-red-600 rounded focus:ring-red-600" />
                        <label :for="'genre-' + genre.id" class="ml-2 text-white">{{ genre.name }}</label>
                    </div>
                </div>
                <p v-for="err in fieldErrors('genres')" :key="err.code" class="text-red-600 text-sm mt-1">
                    {{ err.message }}
                </p>
            </div>

            <!-- Affiche -->
            <div>
                <label for="imageFile" class="block text-white font-semibold mb-1">Affiche</label>
                <input id="imageFile" type="file" @change="onFileChange" class="w-full px-4 py-2 rounded bg-black text-white border border-red-600 
                      focus:outline-none focus:ring-2 focus:ring-red-600" />
                <img v-if="isEdit && form.poster && !form.imageFilePreview" :src="posterUrl" alt="poster"
                    class="mt-3 w-32 rounded border border-red-600" />
                <img v-if="form.imageFilePreview" :src="form.imageFilePreview"
                    class="mt-3 w-32 rounded border border-red-600" />
            </div>

            <button type="submit"
                class="cursor-pointer w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded transition">
                {{ isEdit ? "Mettre à jour" : "Créer" }}
            </button>
        </form>
    </div>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMovies } from '@/composables/useMovies'
import { useGenres } from '@/composables/useGenres'

const router = useRouter()
const route = useRoute()

const { movie, loading, createMovie, fetchMovie, updateMovie } = useMovies()
const { genres: allGenres, fetchGenres } = useGenres()

const error = ref(null)
const isEdit = computed(() => !!route.params.id)

const form = reactive({
    title: '',
    description: '',
    duration: 0,
    poster: '',
    trailer: '',
    type: 'movie',
    releaseDate: '',
    genres: [],
    imageFile: null,
    imageFilePreview: null
})

const posterUrl = computed(() =>
    form.poster ? `${import.meta.env.VITE_API_BASE_URL}/uploads/movies/${form.poster}` : ''
)

onMounted(async () => {
    await fetchGenres()

    if (isEdit.value) {
        await fetchMovie(route.params.id)

        form.title = movie.value.title
        form.description = movie.value.description
        form.duration = movie.value.duration
        form.poster = movie.value.poster
        form.trailer = movie.value.trailer
        form.type = movie.value.type
        form.releaseDate = new Date(movie.value.releaseDate).toISOString().split('T')[0]
        form.genres = movie.value.genres.map(g => g.id)
    }
})

const onFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    form.imageFile = file
    form.poster = file.name
    form.imageFilePreview = URL.createObjectURL(file)
}

// Filtrer les violations par champ
const fieldErrors = (field) => {
    if (!error.value?.response?.data?.violations) return []
    return error.value.response.data.violations.filter(v => v.propertyPath === field)
}

const submit = async () => {
    try {
        const formData = new FormData()
        formData.append('title', form.title)
        formData.append('description', form.description)
        formData.append('duration', form.duration)
        formData.append('trailer', form.trailer)
        formData.append('type', form.type)
        if (form.releaseDate) {
            formData.append('releaseDate', form.releaseDate)
        }
        form.genres.forEach(id => formData.append('genres[]', `/api/genres/${id}`))
        if (form.imageFile) formData.append('imageFile', form.imageFile)

        if (isEdit.value) {
            await updateMovie(route.params.id, formData)
        } else {
            await createMovie(formData)
        }

        router.push('/movies')
    } catch (err) {
        error.value = err
    }
}
</script>
