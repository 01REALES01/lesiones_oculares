#!/bin/bash

# =============================================================
#  RetinaAI - Script de inicio automático
#  Compatible con: macOS y Linux
#  Para Windows usa: start.ps1
# =============================================================

set -e

OS=$(uname -s)
REPO_URL="https://github.com/01REALES01/lesiones_oculares.git"
BRANCH="demo"

echo "=========================================="
echo "       RetinaAI - Setup y arranque        "
echo "       Sistema detectado: $OS             "
echo "=========================================="

# ---------- 1. Clonar repo si no existe ----------
if [ ! -f "backend/main.py" ]; then
  echo "[1/6] Clonando repositorio..."
  git clone "$REPO_URL" .
  git checkout "$BRANCH"
else
  echo "[1/6] Repositorio ya presente, asegurando rama $BRANCH..."
  git checkout "$BRANCH" 2>/dev/null || true
fi

# ---------- 2. Crear entorno virtual si no existe ----------
echo "[2/6] Configurando entorno virtual Python..."
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi

# Activar venv
source .venv/bin/activate

# ---------- 3. Instalar dependencias backend ----------
echo "[3/6] Instalando dependencias backend..."
pip install --upgrade pip -q
pip install -r requirements.txt -q
pip install tf_keras --no-deps -q

# ---------- 4. Verificar modelos ----------
echo "[4/6] Verificando archivos de modelos..."
MODELS_DIR="backend/models"
MISSING=0

for MODEL in "densenet_169_aptos_fine.h5" "mobilenetv3_model_fino.keras" "efficientnet_model.keras"; do
  if [ ! -f "$MODELS_DIR/$MODEL" ]; then
    echo "  [FALTA] $MODEL -> copialo a $MODELS_DIR/"
    MISSING=1
  else
    echo "  [OK]    $MODEL"
  fi
done

if [ "$MISSING" -eq 1 ]; then
  echo ""
  echo "ADVERTENCIA: Faltan modelos. El backend usara fallback heuristico."
  echo "Copia los archivos .h5 / .keras en la carpeta backend/models/ y vuelve a correr."
  echo ""
fi

# ---------- 5. Instalar dependencias frontend ----------
echo "[5/6] Instalando dependencias frontend..."
cd new_frontend
npm install --silent
cd ..

# ---------- 6. Liberar puertos si estaban ocupados ----------
echo "[6/6] Liberando puertos 8000 y 5173 si estaban ocupados..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# ---------- Arrancar servicios ----------
echo ""
echo "=========================================="
echo " Arrancando Backend  -> http://localhost:8000"
echo " Arrancando Frontend -> http://localhost:5173"
echo " Presiona Ctrl+C para apagar todo"
echo "=========================================="
echo ""

source .venv/bin/activate
python3 -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

cd new_frontend
npm run dev &
FRONTEND_PID=$!
cd ..

trap "echo 'Apagando...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" INT TERM
wait
