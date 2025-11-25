<?php

namespace App\Serializer;

use App\Entity\Movie;
use Vich\UploaderBundle\Storage\StorageInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

class MovieNormalizer implements NormalizerInterface
{
    private const ALREADY_CALLED = 'MOVIE_NORMALIZER_ALREADY_CALLED';

    public function __construct(
        #[Autowire(service: 'api_platform.jsonld.normalizer.item')]
        private readonly NormalizerInterface $normalizer,
        private readonly StorageInterface $storage
    ) {
    }

    /**
     * @param Movie $object
     */
    public function normalize($object, ?string $format = null, array $context = []): array|string|int|float|bool|\ArrayObject|null
    {
        // éviter double appel
        $context[self::ALREADY_CALLED] = true;

        $data = $this->normalizer->normalize($object, $format, $context);

        // Ajouter URL complète du poster si existant
        if ($object->getImageFile() || $object->getPoster()) {
            $data['posterUrl'] = $this->storage->resolveUri($object, 'imageFile');
        }

        return $data;
    }

    public function supportsNormalization($data, ?string $format = null, array $context = []): bool
    {
        if (isset($context[self::ALREADY_CALLED])) {
            return false;
        }

        return $data instanceof Movie;
    }

    public function getSupportedTypes(?string $format): array
    {
        return [
            Movie::class => true,
        ];
    }
}
