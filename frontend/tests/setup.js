import { beforeAll, afterEach, afterAll, vi } from 'vitest'
import { server } from './mocks/server'

/**
 * Configuration globale des tests avec Vitest
 * Ce fichier est exécuté automatiquement avant tous les tests
 * et configure l'environnement de test (MSW, mocks, etc.)
 */

/**
 * Mock des variables d'environnement Vite
 * Doit être configuré AVANT toute importation pour éviter les erreurs
 * d'accès à import.meta.env dans les modules
 */
vi.stubGlobal('import', {
    meta: {
        env: {
            // URL de base de l'API mockée (HTTP pour les tests, pas HTTPS)
            VITE_API_BASE_URL: 'http://localhost:8000'
        }
    }
})

/**
 * Mock de localStorage pour l'environnement de test Node.js
 * Implémente l'API localStorage du navigateur en mémoire
 * pour tester la persistance des tokens et autres données
 */
global.localStorage = (() => {
    // Store en mémoire pour simuler le stockage persistant
    let store = {}

    return {
        /**
         * Récupère une valeur depuis le store
         * @param {string} key - Clé de la valeur à récupérer
         * @returns {string|null} La valeur stockée ou null
         */
        getItem: (key) => store[key] || null,

        /**
         * Stocke une valeur dans le store
         * @param {string} key - Clé de stockage
         * @param {any} value - Valeur à stocker (convertie en string)
         */
        setItem: (key, value) => { store[key] = value.toString() },

        /**
         * Supprime une valeur du store
         * @param {string} key - Clé à supprimer
         */
        removeItem: (key) => { delete store[key] },

        /**
         * Vide complètement le store
         */
        clear: () => { store = {} }
    }
})()

/**
 * Configuration du serveur MSW (Mock Service Worker)
 * Intercepte toutes les requêtes HTTP pendant les tests
 */

/**
 * Démarre le serveur MSW avant l'exécution de tous les tests
 * onUnhandledRequest: 'warn' affiche un avertissement pour les requêtes non mockées
 * au lieu de les bloquer complètement (utile pour le debug)
 */
beforeAll(() => {
    server.listen({ onUnhandledRequest: 'warn' })
})

/**
 * Réinitialise l'état après chaque test
 * - Réinitialise les handlers MSW à leur configuration par défaut
 * - Vide le localStorage pour isoler les tests
 */
afterEach(() => {
    server.resetHandlers()
    localStorage.clear()
})

/**
 * Ferme proprement le serveur MSW après tous les tests
 * Libère les ressources et arrête l'interception des requêtes
 */
afterAll(() => server.close())