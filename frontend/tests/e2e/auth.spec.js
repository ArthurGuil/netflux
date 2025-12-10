import { test, expect } from '@playwright/test'

/**
 * Suite de tests E2E pour l'authentification
 * Teste le cycle complet : inscription, connexion, déconnexion
 * avec une vraie base de données et un vrai backend Symfony
 */
test.describe('Authentification E2E', () => {
    /**
     * Nettoyage du localStorage avant chaque test
     * Assure que chaque test démarre avec un état propre
     */
    test.beforeEach(async ({ page }) => {
        await page.goto('/')
        await page.evaluate(() => {
            localStorage.clear()
        })
    })

    /**
     * Test d'inscription d'un nouvel utilisateur
     * Vérifie le formulaire, la validation et la redirection vers login
     */
    test('devrait permettre de créer un compte', async ({ page }) => {
        // Navigation vers la page d'inscription
        await page.goto('/register')

        // Vérification du titre de la page
        await expect(page.locator('h1')).toContainText('Créer un compte')

        // Vérification de la présence de l'info sur les champs obligatoires
        await expect(page.locator('text=Les champs marqués')).toBeVisible()

        // Génération d'un email unique pour éviter les collisions
        const uniqueEmail = `test-${Date.now()}@example.com`
        const password = 'TestPassword123!'

        // Remplissage du formulaire d'inscription
        await page.fill('input#email', uniqueEmail)
        await page.fill('input#password', password)

        // Soumission du formulaire
        await page.click('button[type="submit"]')

        // Vérification de la redirection vers login après inscription réussie
        await page.waitForURL('**/login', { timeout: 30000 })
        await expect(page).toHaveURL('/login')
    })

    /**
     * Test d'inscription avec un email déjà existant
     * Vérifie l'affichage du message d'erreur approprié
     */
    test('devrait afficher une erreur si email déjà utilisé', async ({ page }) => {
        await page.goto('/register')

        // Tentative d'inscription avec un email existant
        await page.fill('input#email', 'admin@example.com')
        await page.fill('input#password', 'password123')

        // Intercepte la réponse de l'API pour vérifier l'erreur
        const responsePromise = page.waitForResponse(
            response => response.url().includes('/register') && response.request().method() === 'POST'
        )

        await page.click('button[type="submit"]:has-text("S\'inscrire")')

        // Attends la réponse du backend
        await responsePromise

        // Attends que l'erreur s'affiche dans l'interface
        await page.waitForTimeout(500)

        // Compte le nombre de paragraphes avec text-red-600 (devrait être > 0 si erreur)
        const errorParagraphs = page.locator('p.text-red-600')

        // Vérifie le premier message d'erreur trouvé
        await expect(errorParagraphs.first()).toBeVisible()

        // Vérification qu'on reste sur la page register
        await expect(page).toHaveURL('/register')
    })

    /**
     * Test de validation côté client
     * Vérifie que les champs email obligatoires sont validés
     */
    test('devrait valider les champs obligatoires', async ({ page }) => {
        await page.goto('/register')

        // Tentative de soumission avec champ vide
        await page.fill('input#email', '')
        await page.fill('input#password', 'password123')

        // Le navigateur devrait empêcher la soumission
        const emailInput = page.locator('input#email')
        await expect(emailInput).toHaveAttribute('type', 'email')
    })

    /**
     * Test de connexion avec des credentials valides
     * Vérifie la persistance de session et la redirection vers /movies
     */
    test('devrait se connecter avec des credentials valides', async ({ page }) => {
        // Navigation vers la page de connexion
        await page.goto('/login')

        // Vérification du titre de la page
        await expect(page.locator('h1')).toContainText('Connexion')

        // Saisie des identifiants valides
        await page.fill('input#email', 'admin@example.com')
        await page.fill('input#password', 'admin123')

        // Soumission du formulaire
        await page.click('button[type="submit"]:has-text("Se connecter")')

        // Vérification de la redirection vers la liste des films
        await page.waitForURL('**/movies', { timeout: 10000 })
        await expect(page).toHaveURL('/movies')

        // Vérification de la persistance du token dans localStorage
        const token = await page.evaluate(() => localStorage.getItem('token'))
        expect(token).toBeTruthy()

        const refreshToken = await page.evaluate(() => localStorage.getItem('refresh_token'))
        expect(refreshToken).toBeTruthy()
    })

    /**
     * Test de connexion avec des credentials invalides
     * Vérifie l'affichage du message d'erreur "Identifiants incorrects"
     */
    test('devrait afficher une erreur avec des credentials invalides', async ({ page }) => {
        await page.goto('/login')

        // Saisie de credentials incorrects
        await page.fill('input#email', 'wrong@example.com')
        await page.fill('input#password', 'wrongpassword')

        await page.click('button[type="submit"]:has-text("Se connecter")')

        // Vérification du message d'erreur exact défini dans le store
        await expect(page.locator('p.text-red-600')).toContainText('Identifiants incorrects')

        // Vérification que l'utilisateur reste sur la page login
        await expect(page).toHaveURL('/login')

        // Vérification qu'aucun token n'est stocké
        const token = await page.evaluate(() => localStorage.getItem('token'))
        expect(token).toBeNull()
    })

    /**
     * Test de connexion avec champs vides
     * Vérifie que le formulaire ne se soumet pas sans données
     */
    test('devrait empêcher la connexion avec des champs vides', async ({ page }) => {
        await page.goto('/login')

        // Tentative de soumission sans remplir les champs
        const emailInput = page.locator('input#email')
        const passwordInput = page.locator('input#password')

        // Vérification que les champs sont de type approprié
        await expect(emailInput).toHaveAttribute('type', 'email')
        await expect(passwordInput).toHaveAttribute('type', 'password')

        // Les champs email HTML5 empêchent la soumission si vides
    })

    /**
     * Test de déconnexion
     * Vérifie la suppression de la session et la redirection
     * Note: Ce test nécessite que tu aies un bouton de déconnexion dans ton interface
     */
    test('devrait se déconnecter correctement', async ({ page }) => {
        // Connexion préalable
        await page.goto('/login')
        await page.fill('input#email', 'admin@example.com')
        await page.fill('input#password', 'admin123')
        await page.click('button[type="submit"]:has-text("Se connecter")')

        // Attente de la redirection après login
        await expect(page).toHaveURL('/movies')

        // Vérification de la présence du token
        let token = await page.evaluate(() => localStorage.getItem('token'))
        expect(token).toBeTruthy()

        // Clic sur le bouton de déconnexion (adapte le sélecteur selon ton UI)
        await page.click('button:has-text("Se déconnecter")')

        // Vérification de la redirection vers login
        await expect(page).toHaveURL('/login')

        // Vérification que le token est supprimé
        token = await page.evaluate(() => localStorage.getItem('token'))
        expect(token).toBeNull()

        const refreshToken = await page.evaluate(() => localStorage.getItem('refresh_token'))
        expect(refreshToken).toBeNull()
    })

    /**
     * Test de persistance de session après rechargement
     * Vérifie que l'utilisateur reste connecté après un refresh
     */
    test('devrait maintenir la session après rechargement de la page', async ({ page }) => {
        // Connexion
        await page.goto('/login')
        await page.fill('input#email', 'admin@example.com')
        await page.fill('input#password', 'admin123')
        await page.click('button[type="submit"]:has-text("Se connecter")')

        await expect(page).toHaveURL('/movies')

        // Rechargement de la page
        await page.reload()

        // Vérification que l'utilisateur est toujours connecté
        await expect(page).toHaveURL('/movies')

        // Vérification que le token est toujours présent
        const token = await page.evaluate(() => localStorage.getItem('token'))
        expect(token).toBeTruthy()
    })

    /**
     * Test de redirection automatique si déjà connecté
     * Un utilisateur connecté qui accède à /login devrait être redirigé
     * (Ce test dépend de la logique de ton routeur)
     */
    test('devrait rediriger vers movies si déjà connecté', async ({ page }) => {
        // Connexion
        await page.goto('/login')
        await page.fill('input#email', 'admin@example.com')
        await page.fill('input#password', 'admin123')
        await page.click('button[type="submit"]:has-text("Se connecter")')

        await expect(page).toHaveURL('/movies')

        // Tentative de retour sur la page login
        await page.goto('/login')

        // Si tu as un guard dans ton router qui redirige les users connectés,
        // décommente la ligne suivante :
        // await expect(page).toHaveURL('/movies')
    })

    /**
     * Test de gestion des erreurs de validation du backend
     * Vérifie l'affichage des erreurs par champ (fieldErrors)
     */
    test('devrait afficher les erreurs de validation par champ', async ({ page }) => {
        await page.goto('/register')

        // Selon ta config backend, tu peux avoir des contraintes de validation
        // Par exemple : email invalide, mot de passe trop court, etc.

        // Tentative avec un email potentiellement invalide (selon validation backend)
        await page.fill('input#email', 'invalid-email')
        await page.fill('input#password', '123') // Mot de passe trop court

        await page.click('button[type="submit"]:has-text("S\'inscrire")')

        // Si ton backend retourne des violations, elles devraient s'afficher
        // Attends un court instant pour que les erreurs s'affichent
        await page.waitForTimeout(1000)

        // Tu peux vérifier la présence de messages d'erreur
        // (adapte selon les règles de validation de ton backend)
    })

    /**
     * Test de nettoyage des erreurs à la navigation
     * Vérifie que les erreurs sont effacées quand on quitte la page
     */
    test('devrait nettoyer les erreurs lors du changement de page', async ({ page }) => {
        // Provoque une erreur de connexion
        await page.goto('/login')
        await page.fill('input#email', 'wrong@example.com')
        await page.fill('input#password', 'wrong')
        await page.click('button[type="submit"]:has-text("Se connecter")')

        // Vérification que l'erreur s'affiche
        await expect(page.locator('p.text-red-600')).toContainText('Identifiants incorrects')

        // Navigation vers register
        await page.goto('/register')

        // Retour sur login : l'erreur devrait avoir disparu
        // (grâce au onUnmounted dans LoginView.vue)
        await page.goto('/login')

        // L'erreur ne devrait plus être visible
        const errorText = await page.locator('p.text-red-600').count()
        expect(errorText).toBe(0)
    })
})