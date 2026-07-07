#!/bin/sh
set -e

cd /var/www/html

if [ ! -f .env ]; then
    cp .env.example .env
fi

if [ ! -d vendor ]; then
    composer install --no-interaction --prefer-dist
fi

if ! grep -q "APP_KEY=base64:" .env 2>/dev/null; then
    php artisan key:generate --force
fi

chmod -R 775 storage bootstrap/cache 2>/dev/null || true

echo "Waiting for database..."
until php -r "
try {
    new PDO(
        'mysql:host=' . getenv('DB_HOST') . ';dbname=' . getenv('DB_DATABASE'),
        getenv('DB_USERNAME'),
        getenv('DB_PASSWORD')
    );
    exit(0);
} catch (Exception \$e) {
    exit(1);
}
" 2>/dev/null; do
    sleep 2
done

php artisan migrate --force
php artisan db:seed --force

exec php-fpm
