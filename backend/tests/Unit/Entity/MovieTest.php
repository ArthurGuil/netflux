<?php

namespace App\Tests\Unit\Entity;

use App\Entity\Movie;
use App\Entity\Genre;
use App\Entity\User;
use App\Enum\Type;
use PHPUnit\Framework\TestCase;
use DateTime;
use DateTimeImmutable;
use Symfony\Component\HttpFoundation\File\File;

/**
 * Tests unitaires de l'entité Movie
 * 
 * Cette classe teste les méthodes getters, setters et les relations
 * de l'entité Movie de manière isolée, sans interaction avec la base de données.
 */
class MovieTest extends TestCase
{
    /**
     * Teste l'ensemble des getters et setters de l'entité Movie
     * 
     * Vérifie que chaque propriété peut être définie et récupérée correctement
     * via ses méthodes accesseurs (titre, description, durée, poster, trailer,
     * type, date de sortie, dates de création et de mise à jour).
     */
    public function testGettersAndSetters(): void
    {
        $movie = new Movie();

        // Test du titre
        $movie->setTitle('Inception');
        $this->assertSame('Inception', $movie->getTitle());

        // Test de la description
        $movie->setDescription('A mind-bending thriller.');
        $this->assertSame('A mind-bending thriller.', $movie->getDescription());

        // Test de la durée
        $movie->setDuration(148);
        $this->assertSame(148, $movie->getDuration());

        // Test du poster
        $movie->setPoster('poster.jpg');
        $this->assertSame('poster.jpg', $movie->getPoster());

        // Test du trailer
        $movie->setTrailer('trailer.mp4');
        $this->assertSame('trailer.mp4', $movie->getTrailer());

        // Test du type (enum)
        $movie->setType(Type::MOVIE);
        $this->assertSame(Type::MOVIE, $movie->getType());

        // Test de la date de sortie
        $date = new DateTime('2023-01-01');
        $movie->setReleaseDate($date);
        $this->assertSame($date, $movie->getReleaseDate());

        // Test des dates de création et de mise à jour
        $createdAt = new DateTimeImmutable('2022-12-01');
        $updatedAt = new DateTime('2023-01-01 12:00:00');
        $movie->setCreatedAt($createdAt);
        $movie->setUpdatedAt($updatedAt);
        $this->assertSame($createdAt, $movie->getCreatedAt());
        $this->assertSame($updatedAt, $movie->getUpdatedAt());
    }

    /**
     * Teste la gestion du fichier image via VichUploader
     * 
     * Vérifie que l'assignation d'un fichier image déclenche automatiquement
     * la mise à jour du champ updatedAt (comportement requis par VichUploader
     * pour le rafraîchissement du cache).
     */
    public function testImageFile(): void
    {
        $movie = new Movie();

        // Création d'un mock de File pour simuler un upload
        $file = $this->createMock(File::class);

        $movie->setImageFile($file);

        // Vérification que le fichier est correctement assigné
        $this->assertSame($file, $movie->getImageFile());

        // Vérification que updatedAt est automatiquement défini lors de l'assignation du fichier
        $this->assertInstanceOf(DateTime::class, $movie->getUpdatedAt());
    }

    /**
     * Teste la gestion de la collection de genres (relation Many-to-Many)
     * 
     * Vérifie que l'ajout et la suppression de genres dans la collection
     * fonctionnent correctement via les méthodes addGenre et removeGenre.
     */
    public function testGenresCollection(): void
    {
        $movie = new Movie();
        $genre = new Genre();

        // Test de l'ajout d'un genre
        $movie->addGenre($genre);
        $this->assertTrue($movie->getGenres()->contains($genre));

        // Test de la suppression d'un genre
        $movie->removeGenre($genre);
        $this->assertFalse($movie->getGenres()->contains($genre));
    }

    /**
     * Teste la gestion de la collection des utilisateurs ayant le film en favori
     * 
     * Vérifie que l'ajout et la suppression d'utilisateurs dans la collection
     * de favoris fonctionnent correctement via les méthodes addFavorite et removeFavorite.
     */
    public function testFavoritesCollection(): void
    {
        $movie = new Movie();
        $user = new User();

        // Test de l'ajout d'un utilisateur aux favoris
        $movie->addFavorite($user);
        $this->assertTrue($movie->getFavorites()->contains($user));

        // Test de la suppression d'un utilisateur des favoris
        $movie->removeFavorite($user);
        $this->assertFalse($movie->getFavorites()->contains($user));
    }
}
