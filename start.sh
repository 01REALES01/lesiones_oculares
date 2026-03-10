#!/bin/bash

# Script para iniciar RetinaAI (Frontend + Backend) simultáneamente

echo "================================================="
echo "        Iniciando RetinaAI (Dashboard API)       "
echo "================================================="

# Matar procesos en los puertos 8000 (Backend) y 5173 (Frontend) por si quedaron colgados
lsof -ti:5173 | xargs kill -9 2>/dev/null
lsof -ti:8000 | xargs kill -9 2>/dev/null

# 1. Iniciar el Backend (FastAPI) en segundo plano
echo "-> Iniciando Backend (FastAPI - Puerto 8000)..."
# Usamos unbuffer o stdbuf si es necesario, predeterminado: uvicorn 
./.venv/bin/python3 -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# 2. Iniciar el Frontend (Vite/React) en segundo plano
echo "-> Iniciando Frontend (React - Puerto 5173)..."
cd frontend || exit
npm run dev &
FRONTEND_PID=$!

echo "================================================="
echo "✅ Todos los servicios están corriendo!"
echo "➡️  Frontend: http://localhost:5173"
echo "➡️  Backend : http://localhost:8000"
echo "================================================="
echo "Presiona Ctrl+C en cualquier momento para apagar ambos sistemas."

# Esperar a que el usuario presione Ctrl+C y luego matar ambos procesos
trap "kill -15 $BACKEND_PID $FRONTEND_PID" INT TERM
wait
