<?php

namespace App\Tests\Unit\Entity;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Validator\Validation;
use App\Entity\Movie;

use Symfony\Component\Validator\Validator\ValidatorInterface;

class MovieAssertTest extends TestCase
{
    public function testValidTitle(): void
    {
        
        $validator = Validation::createValidatorBuilder()
            ->enableAttributeMapping()
            ->getValidator();

        $movie = new Movie();
        $movie->setTitle('Un titre valide');

        $errors = $validator->validateProperty($movie, 'title');

        $this->assertCount(0, $errors);

    }

    public function testNotValidTitle(): void
    {
        
        $validator = Validation::createValidatorBuilder()
            ->enableAttributeMapping()
            ->getValidator();

        $movie = new Movie();
        $movie->setTitle('U');

        $errors = $validator->validateProperty($movie, 'title');

        $this->assertCount(1, $errors);

    }
}
