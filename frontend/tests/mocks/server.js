import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/**
 * Configuration du serveur MSW (Mock Service Worker) pour l'environnement Node.js
 * 
 * Ce serveur intercepte toutes les requêtes HTTP pendant l'exécution des tests
 * et retourne les réponses mockées définies dans handlers.js
 * 
 * Utilisé dans le setup de Vitest (setup.js) pour être actif durant tous les tests
 */
export const server = setupServer(...handlers)