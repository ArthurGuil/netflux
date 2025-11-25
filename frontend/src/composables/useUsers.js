// src/composables/useUsers.js
import { ref } from 'vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

export function useUsers() {
    const users = ref([])
    const loading = ref(false)
    const error = ref(null)
    const auth = useAuthStore() // accéder directement à l'utilisateur connecté

    // Récupérer la liste des utilisateurs
    const fetchUsers = async () => {
        loading.value = true
        try {
            const { data } = await api.get('/users')
            users.value = data.member ?? data
        } catch (err) {
            error.value = err
        } finally {
            loading.value = false
        }
    }

    // Récupérer un utilisateur spécifique (par id)
    const fetchUser = async (id) => {
        loading.value = true
        try {
            const { data } = await api.get(`/users/${id}`)
            // si c'est l'utilisateur connecté, on met à jour le store auth
            if (auth.user?.id === id) {
                auth.user = data
            }
            return data
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    // Mettre à jour un utilisateur
    const updateUser = async (id, payload) => {
        loading.value = true
        try {
            const { data } = await api.patch(`/users/${id}`, payload, {
                headers: {
                    'Content-Type': 'application/merge-patch+json'
                }
            })
            // si c'est l'utilisateur connecté, on met à jour le store auth
            if (auth.user?.id === id) {
                auth.user = data
            }
            // mettre à jour la liste locale si nécessaire
            const index = users.value.findIndex(u => u.id === id)
            if (index !== -1) users.value[index] = data
            return data
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    // Supprimer un utilisateur
    const deleteUser = async (id) => {
        loading.value = true
        try {
            await api.delete(`/users/${id}`)
            users.value = users.value.filter(u => u.id !== id)
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    // Toggle favoris pour l'utilisateur connecté
    const toggleFavorite = async (movieId) => {
        if (!auth.user) throw new Error("Utilisateur non connecté")

        const currentFavorites = auth.user.movies ?? []
        const movieIri = `/api/movies/${movieId}`
        
        const newFavorites = currentFavorites.includes(movieIri)
            ? currentFavorites.filter(m => m !== movieIri)
            : [...currentFavorites, movieIri]

        const updatedUser = await updateUser(auth.user.id, { movies: newFavorites })

        return updatedUser.movies ?? []
    }

    return { users, loading, error, fetchUsers, fetchUser, updateUser, deleteUser, toggleFavorite }
}
