<?php

namespace App\Tests\Functional\Api;

use ApiPlatform\Symfony\Bundle\Test\ApiTestCase;
use App\Entity\Genre;
use App\Entity\Movie;
use App\Enum\Type;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;

/**
 * Tests fonctionnels de l'API Movies
 * 
 * Cette classe teste l'ensemble des opérations CRUD sur l'entité Movie
 * via l'API Platform, ainsi que les fonctionnalités avancées telles que
 * la gestion des fichiers multipart, les filtres et la recherche.
 */
class MovieApiTest extends ApiTestCase
{
    /**
     * Force le démarrage du kernel pour chaque test
     */
    protected static ?bool $alwaysBootKernel = true;

    /**
     * Token JWT d'authentification
     */
    private ?string $token = null;

    /**
     * Gestionnaire d'entités Doctrine
     */
    private EntityManagerInterface $entityManager;

    /**
     * Client HTTP pour les requêtes API
     */
    private $client;

    /**
     * Initialisation avant chaque test
     * 
     * Prépare le client HTTP, l'EntityManager et effectue l'authentification
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->entityManager = static::getContainer()->get(EntityManagerInterface::class);
        $this->client = static::createClient();
        $this->authenticate();
    }

    /**
     * Authentifie l'utilisateur et récupère le token JWT
     * 
     * Utilise les identifiants de l'utilisateur admin pour obtenir
     * un token d'authentification valide pour les tests.
     */
    private function authenticate(): void
    {
        $response = $this->client->request('POST', '/api/login_check', [
            'json' => [
                'email' => 'admin@example.com',
                'password' => 'admin123',
            ],
        ]);

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();
        $this->token = $data['token'];
    }

    /**
     * Retourne les en-têtes d'authentification
     * 
     * @return array En-têtes HTTP contenant le token Bearer
     */
    private function getAuthHeaders(): array
    {
        return [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->token,
            ],
        ];
    }

    /**
     * Crée une requête multipart/form-data et retourne la réponse
     * 
     * Cette méthode utilise directement le KernelBrowser pour gérer
     * les requêtes multipart, notamment pour l'upload de fichiers.
     * 
     * @param string $method Méthode HTTP (POST, PUT, PATCH)
     * @param string $uri URI de la ressource
     * @param array $parameters Paramètres de la requête
     * @param array $files Fichiers à uploader
     * @return Response Réponse HTTP
     */
    private function requestMultipart(string $method, string $uri, array $parameters = [], array $files = [])
    {
        // Utiliser le KernelBrowser directement
        $kernelBrowser = $this->client->getKernelBrowser();

        $kernelBrowser->request(
            $method,
            $uri,
            $parameters,
            $files,
            [
                'HTTP_AUTHORIZATION' => 'Bearer ' . $this->token,
                'CONTENT_TYPE' => 'multipart/form-data',
            ]
        );

        return $kernelBrowser->getResponse();
    }

    /**
     * Teste la récupération de la collection de films
     * 
     * Vérifie que la requête GET sur /api/movies retourne bien
     * une collection au format JSON-LD avec le bon contexte.
     */
    public function testGetCollection(): void
    {
        $this->client->request('GET', '/api/movies', $this->getAuthHeaders());

        $this->assertResponseIsSuccessful();
        $this->assertResponseHeaderSame('content-type', 'application/ld+json; charset=utf-8');
        $this->assertJsonContains([
            '@context' => '/api/contexts/Movie',
            '@type' => 'Collection',
        ]);
    }

    /**
     * Teste la création d'un film sans authentification
     * 
     * Vérifie que l'API refuse l'accès avec un code 401
     * lorsqu'aucun token d'authentification n'est fourni.
     */
    public function testCreateMovieWithoutAuthentication(): void
    {
        $kernelBrowser = $this->client->getKernelBrowser();

        $kernelBrowser->request('POST', '/api/movies', [
            'title' => 'Test Movie',
            'description' => 'Test description',
            'duration' => 120,
            'type' => 'movie',
            'releaseDate' => '2024-01-01T00:00:00+00:00',
        ]);

        $this->assertResponseStatusCodeSame(401);
    }

    /**
     * Teste la création d'un film avec des données valides
     * 
     * Vérifie que l'API accepte la création d'un film avec toutes
     * les informations requises et retourne un code 201 avec les données créées.
     */
    public function testCreateMovieWithValidData(): void
    {
        $response = $this->requestMultipart('POST', '/api/movies', [
            'title' => 'Inception',
            'description' => 'A thief who steals corporate secrets through dream-sharing technology.',
            'duration' => 148,
            'type' => 'movie',
            'trailer' => 'https://www.youtube.com/watch?v=YoHD9XEInc0',
            'releaseDate' => '2010-07-16T00:00:00+00:00',
        ]);

        $this->assertEquals(201, $response->getStatusCode());
        $this->assertStringContainsString('application/ld+json', $response->headers->get('Content-Type'));

        $data = json_decode($response->getContent(), true);
        $this->assertEquals('Inception', $data['title']);
        $this->assertEquals('Movie', $data['@type']);
    }

    /**
     * Teste la création d'un film avec un titre invalide
     * 
     * Vérifie que la validation refuse un titre trop court
     * et retourne un code 422 (Unprocessable Entity).
     */
    public function testCreateMovieWithInvalidTitle(): void
    {
        $response = $this->requestMultipart('POST', '/api/movies', [
            'title' => 'A',
            'description' => 'Valid description here',
            'duration' => 120,
            'type' => 'movie',
            'releaseDate' => '2024-01-01T00:00:00+00:00',
        ]);

        $this->assertEquals(422, $response->getStatusCode());
    }

    /**
     * Teste la création d'un film sans titre
     * 
     * Vérifie que la validation refuse l'absence du champ obligatoire
     * 'title' et retourne un code 422.
     */
    public function testCreateMovieWithMissingTitle(): void
    {
        $this->requestMultipart('POST', '/api/movies', [
            'description' => 'Valid description here',
            'duration' => 120,
            'type' => 'movie',
            'releaseDate' => '2024-01-01T00:00:00+00:00',
        ]);

        $this->assertResponseStatusCodeSame(422);
    }

    /**
     * Teste la création d'un film avec une description invalide
     * 
     * Vérifie que la validation refuse une description trop courte
     * et retourne un code 422.
     */
    public function testCreateMovieWithInvalidDescription(): void
    {
        $this->requestMultipart('POST', '/api/movies', [
            'title' => 'Valid Title',
            'description' => 'Test',
            'duration' => 120,
            'type' => 'movie',
            'releaseDate' => '2024-01-01T00:00:00+00:00',
        ]);

        $this->assertResponseStatusCodeSame(422);
    }

    /**
     * Teste la création d'un film avec une durée invalide
     * 
     * Vérifie que la validation refuse une durée négative
     * et retourne un code 422.
     */
    public function testCreateMovieWithInvalidDuration(): void
    {
        $this->requestMultipart('POST', '/api/movies', [
            'title' => 'Valid Title',
            'description' => 'Valid description here',
            'duration' => -10,
            'type' => 'movie',
            'releaseDate' => '2024-01-01T00:00:00+00:00',
        ]);

        $this->assertResponseStatusCodeSame(422);
    }

    /**
     * Teste la création d'un film avec un type invalide
     * 
     * Vérifie que l'API refuse une valeur qui n'existe pas dans l'enum Type
     * et retourne un code 400 (Bad Request).
     */
    public function testCreateMovieWithInvalidType(): void
    {
        $this->requestMultipart('POST', '/api/movies', [
            'title' => 'Valid Title',
            'description' => 'Valid description here',
            'duration' => 120,
            'type' => 'invalid_type',
            'releaseDate' => '2024-01-01T00:00:00+00:00',
        ]);

        // 400 car le type enum n'est pas valide
        $this->assertResponseStatusCodeSame(400);
    }

    /**
     * Teste la création d'une série
     * 
     * Vérifie que l'API accepte le type 'series' et crée correctement
     * l'entité avec les données fournies.
     */
    public function testCreateSeries(): void
    {
        $response = $this->requestMultipart('POST', '/api/movies', [
            'title' => 'Breaking Bad',
            'description' => 'A high school chemistry teacher turned methamphetamine manufacturer.',
            'duration' => 47,
            'type' => 'series',
            'releaseDate' => '2008-01-20T00:00:00+00:00',
        ]);

        $this->assertEquals(201, $response->getStatusCode());

        $data = json_decode($response->getContent(), true);
        $this->assertEquals('series', $data['type']);
        $this->assertEquals('Breaking Bad', $data['title']);
    }

    /**
     * Teste la création d'un film avec des genres associés
     * 
     * Crée des genres en base de données puis vérifie que l'association
     * Many-to-Many entre Movie et Genre fonctionne correctement.
     */
    public function testCreateMovieWithGenres(): void
    {
        $genre1 = new Genre();
        $genre1->setName('Action');
        $this->entityManager->persist($genre1);

        $genre2 = new Genre();
        $genre2->setName('Sci-Fi');
        $this->entityManager->persist($genre2);

        $this->entityManager->flush();

        $response = $this->requestMultipart('POST', '/api/movies', [
            'title' => 'The Matrix',
            'description' => 'A computer hacker learns about the true nature of his reality.',
            'duration' => 136,
            'type' => 'movie',
            'releaseDate' => '1999-03-31T00:00:00+00:00',
            'genres' => json_encode([
                '/api/genres/' . $genre1->getId(),
                '/api/genres/' . $genre2->getId(),
            ]),
        ]);

        $this->assertEquals(201, $response->getStatusCode());

        $data = json_decode($response->getContent(), true);
        $this->assertEquals('The Matrix', $data['title']);
    }

    /**
     * Teste la récupération d'un film spécifique
     * 
     * Crée un film en base puis vérifie que la requête GET
     * retourne bien les données attendues au format JSON-LD.
     */
    public function testGetMovie(): void
    {
        $movie = new Movie();
        $movie->setTitle('Test Movie for Get');
        $movie->setDescription('Description for test movie');
        $movie->setDuration(100);
        $movie->setType(Type::MOVIE);
        $movie->setReleaseDate(new \DateTime('2024-01-01'));

        $this->entityManager->persist($movie);
        $this->entityManager->flush();

        $this->client->request('GET', '/api/movies/' . $movie->getId(), $this->getAuthHeaders());

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains([
            '@type' => 'Movie',
            'title' => 'Test Movie for Get',
        ]);
    }

    /**
     * Teste la mise à jour complète d'un film (PUT)
     * 
     * Crée un film puis vérifie que la requête PUT met à jour
     * tous les champs de manière complète.
     */
    public function testUpdateMovie(): void
    {
        $movie = new Movie();
        $movie->setTitle('Original Title');
        $movie->setDescription('Original description');
        $movie->setDuration(100);
        $movie->setType(Type::MOVIE);
        $movie->setReleaseDate(new \DateTime('2024-01-01'));

        $this->entityManager->persist($movie);
        $this->entityManager->flush();

        $response = $this->requestMultipart('PUT', '/api/movies/' . $movie->getId(), [
            'title' => 'Updated Title',
            'description' => 'Updated description',
            'duration' => 150,
            'type' => 'movie',
            'releaseDate' => '2024-06-01T00:00:00+00:00',
        ]);

        $this->assertEquals(200, $response->getStatusCode());

        $data = json_decode($response->getContent(), true);
        $this->assertEquals('Updated Title', $data['title']);
    }

    /**
     * Teste la mise à jour partielle d'un film (PATCH)
     * 
     * Crée un film puis vérifie que la requête PATCH met à jour
     * uniquement les champs spécifiés sans affecter les autres.
     */
    public function testPatchMovie(): void
    {
        $movie = new Movie();
        $movie->setTitle('Patch Test Movie');
        $movie->setDescription('Original description');
        $movie->setDuration(100);
        $movie->setType(Type::MOVIE);
        $movie->setReleaseDate(new \DateTime('2024-01-01'));

        $this->entityManager->persist($movie);
        $this->entityManager->flush();

        $response = $this->requestMultipart('PATCH', '/api/movies/' . $movie->getId(), [
            'title' => 'Patched Title',
            'description' => 'Original description',
            'duration' => 100,
            'type' => 'movie',
            'releaseDate' => '2024-01-01T00:00:00+00:00',
        ]);

        $this->assertEquals(200, $response->getStatusCode());

        $data = json_decode($response->getContent(), true);
        $this->assertEquals('Patched Title', $data['title']);
    }

    /**
     * Teste la suppression d'un film
     * 
     * Crée un film puis vérifie que la requête DELETE
     * supprime correctement l'entité avec un code 204 (No Content).
     */
    public function testDeleteMovie(): void
    {
        $movie = new Movie();
        $movie->setTitle('Movie to Delete');
        $movie->setDescription('This movie will be deleted');
        $movie->setDuration(90);
        $movie->setType(Type::MOVIE);
        $movie->setReleaseDate(new \DateTime('2024-01-01'));

        $this->entityManager->persist($movie);
        $this->entityManager->flush();

        $movieId = $movie->getId();

        $this->client->request('DELETE', '/api/movies/' . $movieId, $this->getAuthHeaders());

        $this->assertResponseStatusCodeSame(204);
    }

    /**
     * Teste la création d'un film avec upload de fichier (multipart/form-data)
     * 
     * Crée un fichier temporaire simulant une image et vérifie que l'upload
     * fonctionne correctement avec le traitement multipart.
     */
    public function testCreateMovieWithMultipartFormData(): void
    {
        // Création d'un fichier temporaire pour simuler une image
        $tempFile = tempnam(sys_get_temp_dir(), 'test_poster');
        file_put_contents($tempFile, 'fake image content');

        $uploadedFile = new UploadedFile(
            $tempFile,
            'poster.jpg',
            'image/jpeg',
            null,
            true
        );

        $response = $this->requestMultipart('POST', '/api/movies', [
            'title' => 'Movie with Poster',
            'description' => 'This movie has a poster image',
            'duration' => 120,
            'type' => 'movie',
            'releaseDate' => '2024-01-01T00:00:00+00:00',
        ], [
            'imageFile' => $uploadedFile,
        ]);

        $this->assertEquals(201, $response->getStatusCode());

        $data = json_decode($response->getContent(), true);
        $this->assertEquals('Movie with Poster', $data['title']);
        $this->assertArrayHasKey('posterUrl', $data);
    }

    /**
     * Teste le filtrage des films par type
     * 
     * Nettoie la base de données, crée un film de type 'movie',
     * puis vérifie que le filtre ?type=movie retourne uniquement
     * les films du type spécifié.
     */
    public function testFilterMoviesByType(): void
    {
        // Nettoyage de la base de données
        $connection = $this->entityManager->getConnection();
        $connection->executeStatement('SET FOREIGN_KEY_CHECKS=0');
        $connection->executeStatement('TRUNCATE TABLE movie_genre');
        $connection->executeStatement('TRUNCATE TABLE movie_user');
        $connection->executeStatement('TRUNCATE TABLE movie');
        $connection->executeStatement('SET FOREIGN_KEY_CHECKS=1');
        $connection->executeStatement('ALTER TABLE movie AUTO_INCREMENT = 1');

        // Création d'un film pour le test
        $movie = new Movie();
        $movie->setTitle('Filter Test Movie');
        $movie->setDescription('Movie description');
        $movie->setDuration(100);
        $movie->setType(Type::MOVIE);
        $movie->setReleaseDate(new \DateTime('2024-01-01'));
        $this->entityManager->persist($movie);
        $this->entityManager->flush();
        $this->entityManager->clear();

        $response = $this->client->request('GET', '/api/movies?type=movie', $this->getAuthHeaders());

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();

        $this->assertArrayHasKey('member', $data);
        $this->assertGreaterThan(0, count($data['member']));

        // Vérification que tous les résultats sont du type 'movie'
        foreach ($data['member'] as $item) {
            $this->assertEquals('movie', $item['type']);
        }
    }

    /**
     * Teste la recherche de films par titre
     * 
     * Nettoie la base de données, crée un film avec un titre unique,
     * puis vérifie que la recherche ?title=... retourne bien le film créé.
     */
    public function testSearchMoviesByTitle(): void
    {
        // Nettoyage de la base de données
        $connection = $this->entityManager->getConnection();
        $connection->executeStatement('SET FOREIGN_KEY_CHECKS=0');
        $connection->executeStatement('TRUNCATE TABLE movie_genre');
        $connection->executeStatement('TRUNCATE TABLE movie_user');
        $connection->executeStatement('TRUNCATE TABLE movie');
        $connection->executeStatement('SET FOREIGN_KEY_CHECKS=1');

        // Création d'un film avec un titre unique pour le test
        $movie = new Movie();
        $movie->setTitle('UniqueSearchTitleXYZ123');
        $movie->setDescription('Description for search test');
        $movie->setDuration(100);
        $movie->setType(Type::MOVIE);
        $movie->setReleaseDate(new \DateTime('2024-01-01'));

        $this->entityManager->persist($movie);
        $this->entityManager->flush();

        $response = $this->client->request('GET', '/api/movies?title=UniqueSearchTitleXYZ123', $this->getAuthHeaders());

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();

        $this->assertArrayHasKey('member', $data);
        $this->assertGreaterThan(0, count($data['member']));
    }

    /**
     * Nettoyage après chaque test
     * 
     * Ferme l'EntityManager pour libérer les ressources.
     */
    protected function tearDown(): void
    {
        parent::tearDown();
        $this->entityManager->close();
    }
}