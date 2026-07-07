#!/bin/sh
set -e
docker compose exec php php artisan test "$@"
