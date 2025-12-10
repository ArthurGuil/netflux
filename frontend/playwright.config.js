import { defineConfig, devices } from '@playwright/test'

/**
 * Configuration Playwright pour les tests E2E
 * Ces tests valident l'application complète : frontend + backend + base de données
 */
export default defineConfig({
  /**
   * Dossier contenant les tests E2E
   */
  testDir: './tests/e2e',

  /**
   * Timeout maximum pour chaque test (90 secondes)
   */
  timeout: 90000,
  expect: {
    timeout: 15000 // 10s pour les expect
  },
  launchOptions: {
    slowMo: 50, // Ralentit pour debug
  },
  /**
   * Nombre de tentatives en cas d'échec (utile pour les tests flaky)
   */
  // retries: process.env.CI ? 2 : 0,
  retries: 2, // Retry 2 fois si échec

  /**
   * Nombre de workers (tests en parallèle)
   * CI : 1 worker (plus stable)
   * Local : plusieurs workers (plus rapide)
   */
  workers: process.env.CI ? 1 : undefined,

  /**
   * Format des rapports de test
   */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],

  /**
   * Configuration partagée pour tous les tests
   */
  use: {
    /**
     * URL de base de l'application
     * L'application Vue doit être lancée sur ce port
     */
    baseURL: 'http://localhost:5173',

    // Adapt des TO pour que tout passe à 100%
    navigationTimeout: 45000, // 45s pour les navigations
    actionTimeout: 15000, // 15s pour les actions
    /**
     * Capture de screenshots uniquement en cas d'échec
     */
    screenshot: 'only-on-failure',

    /**
     * Enregistrement vidéo pour débugger les échecs
     */
    video: 'retain-on-failure',

    /**
     * Trace complète en cas d'échec (très utile pour le debug)
     */
    trace: 'on-first-retry',
  },

  /**
   * Configuration de webServer pour démarrer automatiquement l'application
   * Playwright attend que le serveur soit prêt avant de lancer les tests
   */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  /**
   * Projets de test (navigateurs)
   * Définit les différents environnements de test
   */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
})