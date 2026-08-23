#!/usr/bin/env bash
set -uo pipefail

for port in 8000 3000; do
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${port}/tcp" >/dev/null 2>&1 || true
  elif command -v lsof >/dev/null 2>&1; then
    lsof -ti tcp:"$port" | xargs -r kill -9 || true
  fi
done

echo "[sarkariscript] stopped."
