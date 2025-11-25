// src/composables/useMovies.js
import { ref } from 'vue'
import api from '@/services/api'

export function useMovies() {
    const movies = ref([])
    const movie = ref(null)
    const loading = ref(false)
    const error = ref(null)

    const fetchMovies = async () => {
        loading.value = true
        try {
            const { data } = await api.get('/movies')
            movies.value = data.member ?? data
        } catch (err) {
            error.value = err
        } finally {
            loading.value = false
        }
    }

    const fetchMovie = async (id) => {
        loading.value = true
        try {
            const { data } = await api.get(`/movies/${id}`)
            movie.value = data
        } catch (err) {
            error.value = err
        } finally {
            loading.value = false
        }
    }

    const createMovie = async (payload) => {
        try {
            const { data } = await api.post('/movies', payload, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            return data
        } catch (err) {
            throw err
        }
    }

    const updateMovie = async (id, payload) => {
        try {
            const { data } = await api.post(`/movies/${id}`, payload, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            movie.value = data
            return data
        } catch (err) {
            throw err
        }
    }

    const deleteMovie = async (id) => {
        try {
            await api.delete(`/movies/${id}`)
            movies.value = movies.value.filter(m => m.id !== id)
        } catch (err) {
            throw err
        }
    }

    return { movies, movie, loading, error, fetchMovies, fetchMovie, createMovie, updateMovie, deleteMovie }
}
