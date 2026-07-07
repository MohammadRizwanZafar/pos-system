#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

API_PORT="${API_PORT:-9051}"
FRONTEND_PORT="${FRONTEND_PORT:-9050}"

die() {
  echo "[ERROR] $1" >&2
  exit 1
}

[[ -f backend/artisan ]] || die "Run from pos-system folder."
[[ -f backend/.env ]] || die "backend/.env missing. Run: bash scripts/setup-native.sh"
[[ -d backend/vendor ]] || die "Run: bash scripts/setup-native.sh first"
[[ -d frontend/node_modules ]] || die "Run: bash scripts/setup-native.sh first"

if [[ ! -d frontend/.next ]]; then
  echo "[WARN] Building frontend..."
  (cd frontend && npm run build)
fi

cleanup() {
  echo ""
  echo "Stopping ShopPOS..."
  [[ -n "${API_PID:-}" ]] && kill "$API_PID" 2>/dev/null || true
  [[ -n "${WEB_PID:-}" ]] && kill "$WEB_PID" 2>/dev/null || true
  wait 2>/dev/null || true
  echo "Stopped."
}

trap cleanup EXIT INT TERM

echo "Starting API on http://localhost:${API_PORT}"
(cd backend && php artisan serve --host=127.0.0.1 --port="$API_PORT") &
API_PID=$!

sleep 2

echo "Starting frontend on http://localhost:${FRONTEND_PORT}"
(cd frontend && PORT="$FRONTEND_PORT" npm run start) &
WEB_PID=$!

echo ""
echo "========================================"
echo " ShopPOS is running"
echo " Open: http://localhost:${FRONTEND_PORT}"
echo " Press Ctrl+C to stop both"
echo "========================================"
echo ""

wait
