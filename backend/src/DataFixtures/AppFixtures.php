<?php

namespace App\DataFixtures;

use App\Entity\Movie;
use App\Entity\User;
use App\Entity\Genre;
use App\Enum\Type;
use DateTimeImmutable;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    public function __construct(private UserPasswordHasherInterface $passwordHasher)
    {
    }

    public function load(ObjectManager $manager): void
    {
        /**
         * --- GENRES ---
         */
        $genresData = ['Drame', 'Action', 'Horreur', 'Fantaisie', 'Comédie'];
        $genres = [];

        foreach ($genresData as $name) {
            $genre = new Genre();
            $genre->setName($name);
            $manager->persist($genre);
            $genres[$name] = $genre;
        }

        /**
         * --- USERS ---
         */
        $admin = new User();
        $admin->setEmail('admin@example.com');
        $admin->setRoles(['ROLE_ADMIN']);
        $admin->setPassword($this->passwordHasher->hashPassword($admin, 'admin123'));
        $manager->persist($admin);

        $user = new User();
        $user->setEmail('user@example.com');
        $user->setRoles(['ROLE_USER']);
        $user->setPassword($this->passwordHasher->hashPassword($user, 'user123'));
        $manager->persist($user);

        /**
         * --- MOVIES ---
         */
        $moviesData = [
            ['title' => 'Matrix', 'type' => Type::MOVIE, 'genre' => 'Action'],
            ['title' => 'Breaking Bad', 'type' => Type::SERIES, 'genre' => 'Drame'],
            ['title' => 'Tchernobyl', 'type' => Type::SERIES, 'genre' => 'Drame'],
            ['title' => "2001: L'Odyssée de l'espace", 'type' => Type::MOVIE, 'genre' => 'Fantaisie'],
            ['title' => 'The Wire', 'type' => Type::SERIES, 'genre' => 'Drame'],
            ['title' => 'The Thing', 'type' => Type::MOVIE, 'genre' => 'Horreur'],
        ];

        foreach ($moviesData as $data) {
            $movie = new Movie();
            $movie->setTitle($data['title']);
            $movie->setType($data['type']);
            $movie->addGenre($genres[$data['genre']]);
            $movie->setDescription("Description du film/série {$data['title']}");
            $movie->setReleaseDate(new \DateTime('2000-01-01'));
            $movie->setDuration(rand(90, 180));
            $manager->persist($movie);
        }

        $manager->flush();
    }
}