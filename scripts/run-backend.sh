#!/usr/bin/env bash
# Arranca FastAPI en :8000 (usa .venv si existe)
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
if [[ -f .venv/bin/activate ]]; then
  # shellcheck source=/dev/null
  source .venv/bin/activate
fi
export PYTHONPATH=.
exec uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
