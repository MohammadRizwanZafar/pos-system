.PHONY: up down build logs migrate seed fresh test lint

up:
	docker compose up --build -d

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f

migrate:
	docker compose exec php php artisan migrate

seed:
	docker compose exec php php artisan db:seed

fresh:
	docker compose exec php php artisan migrate:fresh --seed

test:
	docker compose exec php php artisan test

lint:
	docker compose exec frontend npm run lint

artisan:
	docker compose exec php php artisan $(cmd)

composer:
	docker compose exec php composer $(cmd)
