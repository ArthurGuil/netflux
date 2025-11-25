<?php

namespace App\Enum;

enum Type: string
{
    case MOVIE = 'movie';
    case SERIES = 'series';

    public function label(): string
    {
        return match ($this) {
            self::MOVIE => 'Film',
            self::SERIES => 'Série',
        };
    }
}