import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import { jwtDecode } from 'jwt-decode'

export const useAuthStore = defineStore('auth', () => {
  const decoded = ref(null)
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))
  const error = ref(null)
  const fieldErrors = ref({})
  const loading = ref(false)
  const refreshToken = ref(localStorage.getItem('refresh_token'))
  const isRefreshing = ref(false)

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => decoded.value?.roles?.includes('ROLE_ADMIN'))

  const isTokenExpired = (token) => {
    try {
      const decoded = jwtDecode(token)
      return decoded.exp * 1000 < Date.now()
    } catch {
      return true
    }
  }

  const fetchUser = async (id) => {
    try {
      const { data } = await api.get(`/users/${id}`)
      user.value = data
    } catch (err) {
      user.value = null
      error.value = err
    }
  }

  const refresh = async () => {
    if (!refreshToken.value || isRefreshing.value) {
      return false
    }

    isRefreshing.value = true

    try {
      // Appel direct sans intercepteur pour éviter la boucle infinie
      const { data } = await api.post('/token/refresh', {
        refresh_token: refreshToken.value
      }, {
        skipAuthRefresh: true // Flag pour l'intercepteur
      })

      token.value = data.token
      refreshToken.value = data.refresh_token

      localStorage.setItem('token', data.token)
      localStorage.setItem('refresh_token', data.refresh_token)

      decoded.value = jwtDecode(data.token)

      return true
    } catch (err) {
      console.error('Erreur refresh token:', err)
      logout()
      return false
    } finally {
      isRefreshing.value = false
    }
  }

  const register = async (email, password) => {
    loading.value = true
    error.value = null
    fieldErrors.value = {}

    try {
      await api.post('/register', { email, password })
      return true
    } catch (err) {
      if (!err.response) {
        error.value = "Impossible de contacter le serveur."
        return false
      }

      const data = err.response.data

      // Erreurs de contraintes (422)
      if (data.violations) {
        data.violations.forEach(v => {
          fieldErrors.value[v.propertyPath] = v.message
        })
      }

      // Message global (ex : email déjà utilisé)
      if (data.message) {
        error.value = data.message
      }

      return false
    } finally {
      loading.value = false
    }
  }

  const login = async (email, password) => {
    loading.value = true
    error.value = null
    fieldErrors.value = {}
    try {
      const { data } = await api.post('/login_check', { email, password })
      token.value = data.token
      refreshToken.value = data.refresh_token

      localStorage.setItem('token', data.token)
      localStorage.setItem('refresh_token', data.refresh_token)

      decoded.value = jwtDecode(data.token)
      await fetchUser(decoded.value.id)
      return true

    } catch (err) {
      error.value = 'Identifiants incorrects'
      return false
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refresh_token')

    token.value = null
    refreshToken.value = null
    decoded.value = null
    user.value = null
    error.value = null
    fieldErrors.value = {}
  }

  if (token.value) {
    try {
      if (isTokenExpired(token.value)) {
        refresh()
      }
      decoded.value = jwtDecode(token.value)
      // fetchUser(decoded.value.id)
    } catch (e) {
      logout();
    }
  }

  return {
    user,
    decoded,
    token,
    refreshToken,
    isLoggedIn,
    isAdmin,
    error,
    fieldErrors,
    loading,
    login,
    logout,
    register,
    refresh,
    isTokenExpired,
    fetchUser
  }
})
