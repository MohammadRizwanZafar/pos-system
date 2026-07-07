#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

die() {
  echo "[ERROR] $1" >&2
  exit 1
}

command -v php >/dev/null || die "PHP not installed"
command -v composer >/dev/null || die "Composer not installed"
command -v node >/dev/null || die "Node.js not installed"
command -v npm >/dev/null || die "npm not installed"

echo "==> Backend .env"
if [[ ! -f backend/.env ]]; then
  cp backend/.env.native.example backend/.env
  echo "Created backend/.env"
fi

echo "==> Frontend .env.local"
if [[ ! -f frontend/.env.local ]]; then
  cp frontend/.env.example frontend/.env.local
  echo "Created frontend/.env.local"
fi

echo "==> Composer install"
(cd backend && composer install --no-interaction)
if ! grep -q "APP_KEY=base64:" backend/.env 2>/dev/null; then
  (cd backend && php artisan key:generate --force)
fi

echo "==> Migrate + seed"
(cd backend && php artisan migrate --force && php artisan db:seed --force)

echo "==> npm install + build"
(cd frontend && npm install && npm run build)

echo ""
echo "Setup complete. Run: bash scripts/start-pos.sh"
