import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'

/**
 * Configuration Vitest pour les tests Vue.js
 * Définit l'environnement de test, les plugins, les alias et la couverture de code
 */
export default defineConfig({
    /**
     * Plugins Vite utilisés pendant les tests
     * Le plugin Vue est nécessaire pour compiler les composants .vue
     */
    plugins: [vue()],

    /**
     * Configuration spécifique aux tests
     */
    test: {
        /**
         * Active les API globales de test (describe, it, expect, etc.)
         * sans avoir besoin de les importer explicitement dans chaque fichier de test
         */
        globals: true,

        /**
         * Environnement de test simulant un navigateur
         * happy-dom : implémentation légère et rapide du DOM
         * Alternative : jsdom (plus complet mais plus lent)
         */
        environment: 'happy-dom',

        /**
         * Fichiers de configuration exécutés avant tous les tests
         * Configure MSW, localStorage mock, et autres initialisations globales
         */
        setupFiles: ['./tests/setup.js'],

        /**
         * Variables d'environnement disponibles pendant les tests
         * Simule les variables Vite (import.meta.env) dans l'environnement de test
         */
        env: {
            VITE_API_BASE_URL: 'http://localhost:8000'
        },

        /**
         * Exclusion des tests e2e, ils seront lancés avec playwright
         */
        exclude: [
            'node_modules',
            'dist',
            'tests/e2e/**'
        ],

        /**
         * Configuration de la couverture de code
         * Génère des rapports pour mesurer le pourcentage de code testé
         */
        coverage: {
            /**
             * Provider de couverture utilisé
             * v8 : intégré à Node.js, rapide et précis
             * Alternative : istanbul/c8
             */
            provider: 'v8',

            /**
             * Formats de rapport générés
             * - text : affichage console
             * - json : format machine-readable
             * - html : interface web interactive (./coverage/index.html)
             */
            reporter: ['text', 'json', 'html'],

            /**
             * Fichiers et dossiers exclus de la couverture
             * Ignore les dépendances, les tests eux-mêmes et les fichiers de config
             */
            exclude: [
                'node_modules/',
                'tests/',
                '*.config.js'
            ]
        }
    },

    /**
     * Configuration de la résolution des imports
     */
    resolve: {
        /**
         * Alias de chemins pour simplifier les imports
         * '@' pointe vers le dossier src/
         * Permet d'écrire : import X from '@/components/X.vue'
         * au lieu de : import X from '../../components/X.vue'
         */
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    }
})