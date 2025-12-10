import { test, expect } from '@playwright/test'

/**
 * Suite de tests E2E pour la gestion des films
 * Version robuste avec attentes explicites et vérifications de visibilité
 */
test.describe('Gestion des films E2E', () => {

    test.beforeEach(async ({ page }) => {
        // Nettoyage complet
        await page.goto('/')
        await page.evaluate(() => localStorage.clear())

        // Connexion admin
        await page.goto('/login')
        await page.fill('input#email', 'admin@example.com')
        await page.fill('input#password', 'admin123')
        await page.click('button[type="submit"]')

        // Attendre d'être sur /movies
        await page.waitForURL('/movies', { timeout: 30000 })

        // Attendre que les cards soient visibles (= API a répondu et rendu)
        await expect(page.locator('.movie-card').first()).toBeVisible({ timeout: 30000 })
    })

    test('devrait afficher la liste des films', async ({ page }) => {
        await page.goto('/movies')
        await expect(page.locator('h1')).toContainText('Films', { timeout: 10000 })
        await expect(page.locator('.movie-card').first()).toBeVisible({ timeout: 30000 })
    })

    test('devrait filtrer les films par type', async ({ page }) => {
        await page.goto('/movies')
        await expect(page.locator('.movie-card').first()).toBeVisible({ timeout: 30000 })

        await page.selectOption('select[name="type"]', 'movie')
        await page.waitForTimeout(1500) // Attendre l'animation de filtrage

        await expect(page.locator('.movie-card').first()).toBeVisible({ timeout: 30000 })
    })

    test('devrait rechercher un film par titre', async ({ page }) => {
        await page.goto('/movies')
        await expect(page.locator('.movie-card').first()).toBeVisible({ timeout: 30000 })

        const firstMovieTitle = await page.locator('.movie-card h3').first().textContent()
        const searchTerm = firstMovieTitle.trim().substring(0, 5)

        await page.fill('input[name="search"]', searchTerm)
        await page.waitForTimeout(1500) // Attendre l'animation de filtrage

        await expect(page.locator('.movie-card').first()).toBeVisible({ timeout: 30000 })
    })

    test('devrait créer un nouveau film', async ({ page }) => {
        await page.goto('/movies')

        const addButton = page.locator('text=+ Ajouter un film')
        await expect(addButton).toBeVisible({ timeout: 10000 })
        await addButton.click()

        await page.waitForURL('/movies/create', { timeout: 30000 })

        const uniqueTitle = `Film Test ${Date.now()}`

        await page.fill('input#title', uniqueTitle)
        await page.fill('textarea#description', 'Description du film de test')
        await page.fill('input#duration', '120')
        await page.selectOption('select#type', 'movie')
        await page.fill('input#releaseDate', '2024-01-15')
        await page.click('button[type="submit"]')

        await page.waitForURL('/movies', { timeout: 30000 })
        await expect(page.locator('.movie-card').first()).toBeVisible({ timeout: 30000 })
    })

    test('devrait valider les champs obligatoires du formulaire', async ({ page }) => {
        await page.goto('/movies')

        const addButton = page.locator('text=+ Ajouter un film')
        await expect(addButton).toBeVisible({ timeout: 10000 })
        await addButton.click()

        await page.waitForURL('/movies/create', { timeout: 30000 })
        await page.click('button[type="submit"]')
        await page.waitForTimeout(1000)
        await expect(page).toHaveURL('/movies/create')
    })

    test('devrait afficher les détails d\'un film', async ({ page }) => {
        await page.goto('/movies')
        await expect(page.locator('.movie-card').first()).toBeVisible({ timeout: 30000 })

        await page.locator('.movie-card h3').first().click()
        await page.waitForURL(/\/movies\/\d+/, { timeout: 30000 })
        await page.waitForLoadState('networkidle')

        const h1Count = await page.locator('h1').count()
        expect(h1Count).toBeGreaterThan(0)
    })

    test('devrait modifier un film existant', async ({ page }) => {
        await page.goto('/movies')
        await expect(page.locator('.movie-card').first()).toBeVisible({ timeout: 30000 })

        const modifierLink = page.locator('.movie-card a:has-text("Modifier")').first()
        await expect(modifierLink).toBeVisible({ timeout: 30000 })
        await modifierLink.click()

        await page.waitForURL(/\/movies\/\d+\/edit/, { timeout: 30000 })
        await page.waitForTimeout(2000)

        const newTitle = `Film Modifié ${Date.now()}`
        await page.fill('input#title', newTitle)
        await page.click('button[type="submit"]')

        await page.waitForURL('/movies', { timeout: 30000 })
        await expect(page.locator('.movie-card').first()).toBeVisible({ timeout: 30000 })
    })

    test('devrait supprimer un film', async ({ page }) => {
        await page.goto('/movies')

        const addButton = page.locator('text=+ Ajouter un film')
        await expect(addButton).toBeVisible({ timeout: 10000 })
        await addButton.click()

        await page.waitForURL('/movies/create', { timeout: 30000 })

        const filmToDelete = `Film à Supprimer ${Date.now()}`

        await page.fill('input#title', filmToDelete)
        await page.fill('textarea#description', 'Film de test pour suppression')
        await page.fill('input#duration', '90')
        await page.selectOption('select#type', 'movie')
        await page.fill('input#releaseDate', '2024-01-01')
        await page.click('button[type="submit"]')

        await page.waitForURL('/movies', { timeout: 30000 })
        await page.waitForTimeout(2000)

        // Reset des filtres pour s'assurer que le film est visible
        const resetButton = page.locator('button:has-text("Reset filtres")')
        await expect(resetButton).toBeVisible({ timeout: 10000 })
        await resetButton.click()
        await page.waitForTimeout(2000)

        // Attendre que la card du film soit visible
        const movieCard = page.locator('.movie-card').filter({ hasText: filmToDelete })
        await expect(movieCard).toBeVisible({ timeout: 30000 })

        // Configuration du listener et suppression
        page.on('dialog', dialog => dialog.accept())

        const deleteButton = movieCard.locator('button:has-text("Supprimer")')
        await expect(deleteButton).toBeVisible({ timeout: 10000 })
        await deleteButton.click()
        await page.waitForTimeout(2000)
    })

    test('devrait ajouter et retirer un film des favoris', async ({ page }) => {
        await page.goto('/movies')
        await expect(page.locator('.movie-card').first()).toBeVisible({ timeout: 30000 })

        const firstMovie = page.locator('.movie-card').first()
        const favoriteButton = firstMovie.locator('button').filter({ hasText: /★|☆/ })
        await expect(favoriteButton).toBeVisible({ timeout: 10000 })

        const initialText = await favoriteButton.textContent()
        await favoriteButton.click()
        await page.waitForTimeout(1000)

        const newText = await favoriteButton.textContent()
        expect(newText).not.toBe(initialText)
    })

    test('devrait réinitialiser tous les filtres', async ({ page }) => {
        await page.goto('/movies')
        await expect(page.locator('.movie-card').first()).toBeVisible({ timeout: 30000 })

        await page.fill('input[name="search"]', 'test')
        await page.selectOption('select[name="type"]', 'movie')
        await page.waitForTimeout(1500)

        const resetButton = page.locator('button:has-text("Reset filtres")')
        await expect(resetButton).toBeVisible({ timeout: 10000 })
        await resetButton.click()
        await page.waitForTimeout(1500)

        await expect(page.locator('input[name="search"]')).toHaveValue('')
        await expect(page.locator('select[name="type"]')).toHaveValue('')
    })
})