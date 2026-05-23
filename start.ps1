# =============================================================
#  RetinaAI - Script de inicio automatico para Windows
#  Uso: Abre PowerShell en esta carpeta y corre:
#       Set-ExecutionPolicy -Scope Process Bypass; .\start.ps1
# =============================================================

$REPO_URL = "https://github.com/01REALES01/lesiones_oculares.git"
$BRANCH   = "reciente"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "      RetinaAI - Setup y arranque         " -ForegroundColor Cyan
Write-Host "      Sistema detectado: Windows          " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# ---------- 1. Clonar repo si no existe ----------
Write-Host "[1/6] Verificando repositorio..." -ForegroundColor Yellow
if (-not (Test-Path "backend\main.py")) {
    Write-Host "      Clonando repositorio..." -ForegroundColor Yellow
    git clone $REPO_URL .
    git checkout $BRANCH
} else {
    Write-Host "      Repositorio ya presente, asegurando rama $BRANCH..." -ForegroundColor Yellow
    git checkout $BRANCH 2>$null
}

# ---------- 2. Crear entorno virtual si no existe ----------
Write-Host "[2/6] Configurando entorno virtual Python..." -ForegroundColor Yellow
if (-not (Test-Path ".venv")) {
    py -3.11 -m venv .venv
    if ($LASTEXITCODE -ne 0) {
        python -m venv .venv
    }
}

# Activar venv
. .\.venv\Scripts\Activate.ps1

# ---------- 3. Instalar dependencias backend ----------
Write-Host "[3/6] Instalando dependencias backend..." -ForegroundColor Yellow
python -m pip install --upgrade pip -q
python -m pip install -r requirements.txt -q

# ---------- 4. Verificar modelos ----------
Write-Host "[4/6] Verificando archivos de modelos..." -ForegroundColor Yellow
$modelsDir = "backend\models"
$modelos   = @("densenet_169_aptos_fine.h5", "xception_aptos_fine2.h5", "resnet50_model_fine.h5")
$missing   = $false

foreach ($m in $modelos) {
    $path = Join-Path $modelsDir $m
    if (Test-Path $path) {
        Write-Host "  [OK]    $m" -ForegroundColor Green
    } else {
        Write-Host "  [FALTA] $m  -> copialo a $modelsDir\" -ForegroundColor Red
        $missing = $true
    }
}

if ($missing) {
    Write-Host ""
    Write-Host "ADVERTENCIA: Faltan modelos. El backend usara fallback heuristico." -ForegroundColor Red
    Write-Host "Copia los archivos .h5 / .keras en backend\models\ y vuelve a correr." -ForegroundColor Red
    Write-Host ""
}

# ---------- 5. Instalar dependencias frontend ----------
Write-Host "[5/6] Instalando dependencias frontend..." -ForegroundColor Yellow
Set-Location new_frontend
npm install --silent
Set-Location ..

# ---------- 6. Liberar puertos si estaban ocupados ----------
Write-Host "[6/6] Liberando puertos 8000 y 5173 si estaban ocupados..." -ForegroundColor Yellow
$ports = @(8000, 5173)
foreach ($port in $ports) {
    $pids = netstat -ano | Select-String ":$port " | ForEach-Object {
        ($_ -split '\s+')[-1]
    } | Sort-Object -Unique
    foreach ($p in $pids) {
        if ($p -match '^\d+$' -and $p -ne "0") {
            Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        }
    }
}

# ---------- Arrancar servicios en ventanas separadas ----------
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Arrancando Backend  -> http://localhost:8000" -ForegroundColor Green
Write-Host " Arrancando Frontend -> http://localhost:5173" -ForegroundColor Green
Write-Host " Cierra las ventanas emergentes para apagar" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Backend en ventana nueva
$backendCmd = "cd '$PWD'; . .\.venv\Scripts\Activate.ps1; python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

# Esperar 3 segundos para que el backend inicie antes del frontend
Start-Sleep -Seconds 3

# Frontend en ventana nueva
$frontendCmd = "cd '$PWD\new_frontend'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host "Listo! Abre http://localhost:5173 en tu navegador." -ForegroundColor Green
