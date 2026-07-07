# ShopPOS

ShopPOS is a point-of-sale system for local shops and vendors. It includes a Laravel REST API, a Next.js frontend, and Docker so you can run the full stack on any machine with a single command.

**One install = one shop.** Each vendor gets a separate deployment with its own database.

## Prerequisites

- Docker and Docker Compose
- Git

You do not need PHP, Node, or MySQL installed locally.

## Quick start

```bash
git clone <repo-url> pos-system
cd pos-system
cp .env.example .env
docker compose up --build
```

Wait until all services are healthy, then open:

| Service | URL |
|---------|-----|
| Frontend | http://localhost:9050 |
| API | http://localhost:9051/api/v1 |
| API health | http://localhost:9051/api/health |
| phpMyAdmin | http://localhost:9052 |

On first run, the backend container installs Composer dependencies, runs migrations, and seeds demo data automatically.

### Demo accounts

| Email | Password | Role |
|-------|----------|------|
| admin@pos.com | password | admin |
| cashier@pos.com | password | cashier |

## Running tests

```bash
docker compose exec php php artisan test
```

Or:

```bash
sh scripts/run-tests.sh
```

Frontend lint:

```bash
docker compose exec frontend npm run lint
```

## Auth choice: Sanctum bearer tokens

The frontend and API run on different ports inside Docker, so **Sanctum personal access tokens** are used. Login returns a token; the Next.js client stores it in `localStorage` and sends `Authorization: Bearer ...` on API calls. This avoids CSRF and cross-origin cookie issues in local development.

## Running on WSL2

Develop and test in WSL2 with Docker Desktop (WSL2 backend) or Docker Engine inside WSL.

Notes:

- **Bind mounts**: Source code is mounted for hot reload. If file changes feel slow, `WATCHPACK_POLLING=true` is set for Next.js.
- **Line endings**: Keep LF line endings. Entrypoints must stay executable: `chmod +x docker/entrypoints/*.sh`
- **Permissions**: If Laravel cannot write to `storage/` or `bootstrap/cache/`, run:
  ```bash
  docker compose exec php chmod -R 775 storage bootstrap/cache
  ```
- **Ports**: ShopPOS uses `9050`, `9051`, and `9052` — dedicated range, avoids common ports (`3000`, `8000`, `8080`, `8100`, `8200`, etc.) and TaskFlow (`8200–8202`).

## Environment variables

Root `.env.example`:

- `FRONTEND_PORT`, `API_PORT`, `PHPMYADMIN_PORT`
- `NEXT_PUBLIC_API_URL`
- Database credentials (`DB_*`)

See also `backend/.env.example` and `frontend/.env.example` for app-specific settings.

## Useful commands

```bash
make up          # build and start in background
make down        # stop containers
make logs        # follow logs
make migrate     # run migrations
make fresh       # migrate:fresh --seed
make artisan cmd="route:list"
```

## Decisions and trade-offs

- **Laravel 13 + PHP 8.3 FPM + Nginx**: Production-style stack instead of `artisan serve`; matches how real deployments run.
- **Next.js 15 App Router**: Client components for POS interactivity; shared typed API client in `frontend/src/lib/api.ts`.
- **Bearer tokens over cookies**: Simpler with separate frontend/API ports in Docker.
- **Modular Laravel backend**: Features live in `app/Modules/*` with their own routes, migrations, and services.
- **MySQL in Compose**: Self-contained database; no host MySQL required.
- **Single repo + root docker-compose.yml**: Clone anywhere, run `docker compose up --build`.
- **Multi-stage Dockerfiles**: `dev` target for hot reload; `production` target excludes dev dependencies.
- **Single-shop per install**: Sold to multiple vendors as separate deployments, not multi-tenant SaaS.
- **phpMyAdmin included**: Optional DB access for setup and support without extra tools.

## Project layout

```
pos-system/
├── backend/          Laravel API
├── frontend/         Next.js app
├── docker/           nginx, php config, entrypoints
├── dockerfiles/      multi-stage Dockerfiles
├── scripts/          helper scripts
└── docker-compose.yml
```

More API details: [backend/README.md](backend/README.md)
