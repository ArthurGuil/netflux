import axios from "axios";
import { useAuthStore } from "@/stores/auth";
import router from "@/router";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + "/api",
  headers: {
    'Content-Type': 'application/ld+json',
  },
})

// --- Interceptor pour ajouter le token JWT aux requêtes ---
api.interceptors.request.use((config) => {
  const auth = useAuthStore();
  const token = auth.token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
}, (error) => {
  return Promise.reject(error);
})

// --- Interceptor pour les réponses et gestion du 401 avec refresh ---
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  response => response,
  async error => {
    const auth = useAuthStore();
    const originalRequest = error.config;

    // Si pas 401 ou si flag skipAuthRefresh, rejeter directement
    if (error.response?.status !== 401 || originalRequest.skipAuthRefresh) {
      return Promise.reject(error);
    }

    // Si déjà en train de refresh, mettre en queue
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch(err => Promise.reject(err));
    }

    // Marquer comme en cours de refresh
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const success = await auth.refresh();

      if (success) {
        // Refresh réussi, relancer la requête originale
        processQueue(null, auth.token);
        originalRequest.headers.Authorization = `Bearer ${auth.token}`;
        return api(originalRequest);
      } else {
        // Refresh échoué
        processQueue(new Error('Refresh failed'), null);
        auth.logout();
        router.push('/login');
        return Promise.reject(error);
      }
    } catch (refreshError) {
      processQueue(refreshError, null);
      auth.logout();
      router.push('/login');
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api