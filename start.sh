#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

free_port() {
  local port="$1"
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${port}/tcp" >/dev/null 2>&1 || true
  elif command -v lsof >/dev/null 2>&1; then
    lsof -ti tcp:"$port" | xargs -r kill -9 || true
  fi
}

free_port 8000
free_port 3000

if [ ! -d "$ROOT/backend/.venv" ]; then
  echo "[sarkariscript] creating backend venv…"
  python3 -m venv "$ROOT/backend/.venv"
fi

if [ ! -x "$ROOT/backend/.venv/bin/uvicorn" ] || [ ! -f "$ROOT/backend/.venv/.installed" ] || [ "$ROOT/backend/requirements.txt" -nt "$ROOT/backend/.venv/.installed" ]; then
  echo "[sarkariscript] installing backend dependencies…"
  "$ROOT/backend/.venv/bin/pip" install --retries 5 --timeout 60 -q -r "$ROOT/backend/requirements.txt"
  touch "$ROOT/backend/.venv/.installed"
fi

echo "[sarkariscript] starting API on :8000 (log: /tmp/sarkariscript-api.log)"
(
  cd "$ROOT/backend"
  if [ -f .env ]; then
    set -a; source .env; set +a
  fi
  nohup ./.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 > /tmp/sarkariscript-api.log 2>&1 &
)

echo "[sarkariscript] starting web on :3000 (log: /tmp/sarkariscript-web.log)"
(
  cd "$ROOT/frontend"
  if [ ! -d node_modules ]; then
    echo "[sarkariscript] installing frontend dependencies…"
    npm install
  fi
  if [ ! -d .next ]; then
    echo "[sarkariscript] building frontend once…"
    npm run build
  fi
  nohup npm run start -- -p 3000 > /tmp/sarkariscript-web.log 2>&1 &
)

sleep 4
curl -sf http://localhost:8000/api/health >/dev/null && echo "[sarkariscript] API   ✓ http://localhost:8000/docs" || echo "[sarkariscript] API   ✗ (check /tmp/sarkariscript-api.log)"
curl -sf -o /dev/null http://localhost:3000 && echo "[sarkariscript] Web   ✓ http://localhost:3000" || echo "[sarkariscript] Web   ✗ (check /tmp/sarkariscript-web.log)"
