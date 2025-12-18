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
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# ============================================
# Stage développement
# ============================================
FROM base AS dev

# Configuration PHP pour le dev
COPY --from=php:8.3-fpm-alpine /usr/local/etc/php/php.ini-development /usr/local/etc/php/php.ini

# Xdebug pour le dev (installé mais désactivé par défaut)
RUN apk add --no-cache linux-headers $PHPIZE_DEPS \
    && pecl install xdebug \
    && docker-php-ext-enable xdebug \
    && apk del linux-headers

# Xdebug désactivé par défaut (performances)
RUN echo "xdebug.mode=off" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini

EXPOSE 9000
CMD ["php-fpm"]

# ============================================
# Stage production
# ============================================
FROM base AS prod

# Configuration PHP pour la prod
COPY --from=php:8.3-fpm-alpine /usr/local/etc/php/php.ini-production /usr/local/etc/php/php.ini

# Optimisations OPcache pour production
RUN echo "opcache.enable=1" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.memory_consumption=256" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.max_accelerated_files=20000" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.validate_timestamps=0" >> /usr/local/etc/php/conf.d/opcache.ini

# Copier les fichiers composer
COPY backend/composer.* ./

# Installer les dépendances (sans dev)
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction

# Copier le code source
COPY backend/ .

# Dump autoload optimisé
RUN composer dump-autoload --optimize --classmap-authoritative --no-dev

# Permissions
RUN mkdir -p /app/var/cache /app/var/log && \
    chown -R www-data:www-data /app/var && \
    chmod -R 775 /app/var

EXPOSE 9000
CMD ["php-fpm"]