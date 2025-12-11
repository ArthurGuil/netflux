# Multi-stage build pour optimiser la taille
FROM php:8.3-fpm-alpine AS base

# Installation des dépendances système
RUN apk add --no-cache \
    git \
    unzip \
    libzip-dev \
    icu-dev \
    oniguruma-dev

# Installation des extensions PHP
RUN docker-php-ext-install \
    pdo_mysql \
    zip \
    intl \
    opcache

# Installation de Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Stage développement
FROM base AS dev

# Configuration PHP pour le dev
RUN mv "$PHP_INI_DIR/php.ini-development" "$PHP_INI_DIR/php.ini"

# Xdebug pour le dev (avec linux-headers)
RUN apk add --no-cache $PHPIZE_DEPS linux-headers \
    && pecl install xdebug \
    && docker-php-ext-enable xdebug \
    && apk del $PHPIZE_DEPS linux-headers

COPY backend/composer.* ./
RUN composer install --no-scripts --no-autoloader

COPY backend/ .
RUN composer dump-autoload --optimize

EXPOSE 9000

CMD ["php-fpm"]

# Stage production
FROM base AS prod

# Configuration PHP pour la prod
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

# Optimisations OPcache
RUN echo "opcache.enable=1" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.memory_consumption=256" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.max_accelerated_files=20000" >> /usr/local/etc/php/conf.d/opcache.ini

COPY backend/composer.* ./
RUN composer install --no-dev --optimize-autoloader --no-scripts

COPY backend/ .
RUN composer dump-autoload --optimize --classmap-authoritative

# Permissions
RUN chown -R www-data:www-data var/

EXPOSE 9000

CMD ["php-fpm"]