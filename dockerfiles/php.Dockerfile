FROM php:8.3-fpm-alpine AS base

RUN apk add --no-cache \
    git curl zip unzip libzip-dev oniguruma-dev icu-dev \
    libpng-dev libjpeg-turbo-dev libwebp-dev freetype-dev libxml2-dev \
    && docker-php-ext-configure intl \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install pdo_mysql intl mbstring exif pcntl bcmath gd zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

FROM base AS dev

COPY docker/entrypoints/backend-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/bin/sh", "/entrypoint.sh"]

FROM base AS production

COPY backend/composer.json backend/composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction

COPY backend/ .
RUN chown -R www-data:www-data storage bootstrap/cache

USER www-data
EXPOSE 9000
CMD ["php-fpm"]
