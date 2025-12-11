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
    timeout: 15000 // 15s pour les expect
  },

  launchOptions: {
    slowMo: 50, // Ralentit pour debug
  },

  /**
   * Nombre de tentatives en cas d'échec (utile pour les tests flaky)
   */
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
     * En CI (Docker), on utilise localhost:5173 (network_mode: host)
     * En local, on utilise aussi localhost:5173
     */
    baseURL: 'http://localhost:5173',

    // Timeouts adaptés
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

    /**
     * Mode headless : activé en CI, désactivé en local
     */
    headless: process.env.CI ? true : false,
  },

  /**
   * Configuration de webServer
   * En CI : réutilise le serveur existant (conteneur frontend_test)
   * En local : lance npm run dev automatiquement
   */
  webServer: process.env.CI ? {
    command: 'echo "Using existing frontend_test container"',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 5000,
  } : {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120000,
  },

  /**
   * Projets de test (navigateurs)
   * Définit les différents environnements de test
   */
  projects: [
    // Desktop - Chromium
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: process.env.CI ? true : undefined,
      },
    },

    // // Desktop - Firefox
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     headless: process.env.CI ? true : undefined,
    //   },
    // },

    // // Desktop - WebKit (Safari)
    // {
    //   name: 'webkit',
    //   use: {
    //     ...devices['Desktop Safari'],
    //     headless: process.env.CI ? true : undefined,
    //   },
    // },

    // // Mobile - Chrome Android
    // {
    //   name: 'Mobile Chrome',
    //   use: {
    //     ...devices['Pixel 5'],
    //     headless: process.env.CI ? true : undefined,
    //   },
    // },

    // // Mobile - Safari iOS
    // {
    //   name: 'Mobile Safari',
    //   use: {
    //     ...devices['iPhone 13'],
    //     headless: process.env.CI ? true : undefined,
    //   },
    // },

    // // Tablette - iPad
    // {
    //   name: 'iPad',
    //   use: {
    //     ...devices['iPad Pro'],
    //     headless: process.env.CI ? true : undefined,
    //   },
    // },
  ],
})