<?php
// src/Encoder/MultipartDecoder.php

namespace App\Encoder;

use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\Serializer\Encoder\DecoderInterface;

final class MultipartDecoder implements DecoderInterface
{
    public const FORMAT = 'multipart';

    public function __construct(private readonly RequestStack $requestStack) {}

    /**
     * Décoder la requête multipart en tableau.
     *
     * @param string $data Chaîne vide, inutilisée
     * @param string $format Format attendu (multipart)
     * @param array $context Contexte du serializer
     *
     * @return array|null
     */
    public function decode(string $data, string $format, array $context = []): ?array
    {
        $request = $this->requestStack->getCurrentRequest();

        if (!$request) {
            return null;
        }

        $decoded = [];

        foreach ($request->request->all() as $key => $value) {
            // Checkbox ou select multiple -> on garde tel quel
            if (is_array($value)) {
                $decoded[$key] = $value;
                continue;
            }

            // Champs numériques à convertir
            if (in_array($key, ['duration'])) {
                $decoded[$key] = (int) $value;
                continue;
            }

            // Valeur simple, on essaie de décoder JSON si ça commence par { ou [
            if (is_string($value)) {
                $trimmed = trim($value);
                if (str_starts_with($trimmed, '{') || str_starts_with($trimmed, '[')) {
                    try {
                        $decoded[$key] = json_decode($trimmed, true, flags: \JSON_THROW_ON_ERROR);
                    } catch (\JsonException $e) {
                        $decoded[$key] = $value;
                    }
                } else {
                    $decoded[$key] = $value;
                }
                continue;
            }

            // Valeur brute (int, float, etc.)
            $decoded[$key] = $value;
        }

        // Ajoute les fichiers uploadés
        foreach ($request->files->all() as $key => $file) {
            if ($file instanceof UploadedFile) {
                $decoded[$key] = $file;
            }
        }

        return $decoded;
    }

    public function supportsDecoding(string $format): bool
    {
        return self::FORMAT === $format;
    }
}
