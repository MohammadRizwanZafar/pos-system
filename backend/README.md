# POS System — Backend API

Laravel REST API for a point-of-sale (POS) system. The Next.js frontend lives in `../frontend` and talks to this API.

**One install = one shop.** Each vendor gets a separate deployment with its own database.

## Tech Stack

- PHP 8.3
- Laravel 13
- Laravel Sanctum (API tokens)
- Spatie Laravel Permission (roles & permissions)
- MySQL 8

## Project Structure

```
app/
├── Http/Controllers/     # Base controller
├── Models/               # User model
├── Modules/              # Feature modules (self-contained)
│   ├── Auth/
│   ├── Product/
│   ├── Sale/
│   ├── Dashboard/
│   ├── Report/
│   ├── Setting/
│   ├── Expense/
│   └── User/
├── Providers/
└── Traits/               # ApiResponse trait
```

Each module contains its own Controllers, Services, Models, Requests, Routes, and Migrations.

## Roles

| Role    | Access |
|---------|--------|
| `admin` | Full access — products, sales, reports, settings, users, expenses |
| `cashier` | POS, dashboard, sales list, reports (sales only) |

## API Base URL

```
http://localhost:9051/api/v1
```

All protected routes require a Bearer token from `POST /auth/login`.

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | — | Login |
| POST | `/auth/logout` | ✓ | Logout |
| GET | `/auth/me` | ✓ | Current user |

### Products & Categories

| Method | Endpoint | Role |
|--------|----------|------|
| GET | `/products` | admin, cashier |
| GET | `/products/{id}` | admin, cashier |
| POST | `/products` | admin |
| PUT | `/products/{id}` | admin |
| DELETE | `/products/{id}` | admin |
| GET | `/categories` | admin, cashier |
| POST | `/categories` | admin |
| PUT | `/categories/{id}` | admin |
| DELETE | `/categories/{id}` | admin |

### Sales (POS)

| Method | Endpoint | Role |
|--------|----------|------|
| GET | `/sales` | admin, cashier |
| POST | `/sales` | admin, cashier |
| GET | `/sales/{id}` | admin, cashier |
| GET | `/sales/{id}/invoice` | admin, cashier |

### Dashboard & Reports

| Method | Endpoint | Role |
|--------|----------|------|
| GET | `/dashboard/stats` | admin, cashier |
| GET | `/reports/sales` | admin, cashier |
| GET | `/reports/expenses` | admin |

### Settings, Users, Expenses

| Method | Endpoint | Role |
|--------|----------|------|
| GET | `/settings` | any authenticated |
| PUT | `/settings` | admin |
| GET/POST/PUT | `/users`, `/users/{id}` | admin |
| CRUD | `/expenses` | admin |

### Health

| Method | Endpoint | Description |
|--------|----------|---------------|
| GET | `/api/health` | API health check |
| GET | `/up` | Laravel health check |

## Docker (recommended)

From the project root:

```bash
cp .env.example .env
docker compose up --build
```

| Service | URL |
|---------|-----|
| API | http://localhost:9051 |
| Frontend | http://localhost:9050 |
| phpMyAdmin | http://localhost:9052 |

Migrations and seeders run automatically on first backend container start.

### Useful commands

```bash
make up          # build and start
make down        # stop
make migrate     # run migrations
make fresh       # migrate:fresh --seed
make artisan cmd="route:list"
docker compose exec php php artisan test
```

## Environment

Copy `backend/.env.example` to `backend/.env` and set:

```env
DB_CONNECTION=mysql
DB_HOST=mysql          # use "mysql" inside Docker, "127.0.0.1" locally
DB_PORT=3306
DB_DATABASE=pos_system
DB_USERNAME=pos_user
DB_PASSWORD=pos_secret

FRONTEND_URL=http://localhost:9050
APP_URL=http://localhost:9051
```

Generate app key (first time only):

```bash
docker compose run --rm artisan key:generate
```

## Response Format

All API responses use a consistent JSON structure via the `ApiResponse` trait:

```json
{
  "success": true,
  "message": "OK",
  "data": { }
}
```

## Local Development (without Docker)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve --host=0.0.0.0 --port=9051
```

Requires a running MySQL instance with credentials matching `.env`.
