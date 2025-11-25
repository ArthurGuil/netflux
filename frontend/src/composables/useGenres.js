// src/composables/useGenres.js
import { ref } from 'vue'
import api from '@/services/api'

export function useGenres() {
    const genres = ref([])
    const genre = ref(null)
    const loading = ref(false)
    const error = ref(null)

    // Récupérer tous les genres
    const fetchGenres = async () => {
        loading.value = true
        try {
            const { data } = await api.get('/genres')
            genres.value = data.member
        } catch (err) {
            error.value = err
        } finally {
            loading.value = false
        }
    }

    // Récupérer un genre
    const fetchGenre = async (id) => {
        loading.value = true
        try {
            const { data } = await api.get(`/genres/${id}`)
            genre.value = data
        } catch (err) {
            error.value = err
        } finally {
            loading.value = false
        }
    }

    // Créer un genre
    const createGenre = async (payload) => {
        loading.value = true
        try {
            const { data } = await api.post('/genres', payload)
            genre.value = data
        } catch (err) {
            error.value = err
        } finally {
            loading.value = false
        }
    }

    // Mettre à jour un genre
    const updateGenre = async (id, payload) => {
        loading.value = true
        try {
            const { data } = await api.patch(`/genres/${id}`, payload, {
                headers: {
                    'Content-Type': 'application/merge-patch+json'
                }
            })
            genre.value = data
        } catch (err) {
            error.value = err
        } finally {
            loading.value = false
        }
    }

    // Supprimer un genre
    const deleteGenre = async (id) => {
        loading.value = true
        try {
            await api.delete(`/genres/${id}`)
            genres.value = genres.value.filter(g => g.id !== id)
        } catch (err) {
            error.value = err
        } finally {
            loading.value = false
        }
    }

    return {
        genres,
        genre,
        loading,
        error,
        fetchGenres,
        fetchGenre,
        createGenre,
        updateGenre,
        deleteGenre
    }
}
