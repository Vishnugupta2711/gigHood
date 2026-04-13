@echo off
setlocal ENABLEDELAYEDEXPANSION

cd /d "%~dp0"

echo =========================================
echo   gigHood Smart Setup Script (Windows)
echo =========================================
echo.

:: 1. Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH. Please install Python 3.11+.
    exit /b 1
)
echo [OK] Python found.

:: 2. Setup Virtual Environment
echo [INFO] Preparing virtual environment...
if not exist "venv" (
    python -m venv venv
    echo [OK] Virtual environment created.
)
if exist "venv" (
    echo [OK] Reusing existing virtual environment.
)
if not defined VIRTUAL_ENV (
    call venv\Scripts\activate.bat
)

:: 3. Install Dependencies
echo [INFO] Installing requirements...
python -m pip install --upgrade pip >nul 2>&1
if exist "backend\requirements.txt" (
    python -m pip install -r backend\requirements.txt
) else (
    if exist "requirements.txt" (
        python -m pip install -r requirements.txt
    ) else (
        echo [ERROR] No requirements file found.
        exit /b 1
    )
)

:: 3b. Install frontend dependencies
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] npm is not installed. Frontend setup skipped.
    goto :env_setup
)

echo [INFO] Installing frontend dependencies...
if not exist frontend\package.json (
    echo [WARNING] frontend/package.json not found. Skipping npm install.
) else (
    if exist frontend\package-lock.json (
        call npm ci --prefix frontend --force
    ) else (
        call npm install --prefix frontend --force
    )
    echo [INFO] Frontend installation completed.
)

echo [INFO] Proceeding with environment setup...
if not exist "backend\.env" (
    copy backend\.env.example backend\.env >nul
    echo [OK] Created backend\.env from template.
    echo [WARNING] IMPORTANT: Please open backend\.env and fill in your API keys!
) else (
    echo [OK] backend\.env already exists.
)

if not exist "frontend\.env.local" (
    if exist "frontend\.env.example" (
        copy frontend\.env.example frontend\.env.local >nul
        echo [OK] Created frontend\.env.local from template.
    )
)

:: 5. Check Firebase Credentials
if not exist "backend\firebase-credentials.json" (
    echo [WARNING] NOTE: backend\firebase-credentials.json is missing.
    echo          Please ask the team for the firebase service account key and place it there.
) else (
    echo [OK] Firebase credentials found.
)

:: 6. Pre-train/load risk profiler model for reproducible first boot
echo [INFO] Preparing risk profiler model...
python -c "from backend.services.risk_profiler import load_model; load_model(); print('Risk profiler model is ready.')"
if %errorlevel% neq 0 (
    echo [WARNING] Risk model prewarm failed. It will retry on backend startup.
)

echo.
echo =========================================
echo   Setup Complete!
echo =========================================
echo To start the development server:
echo 1. Activate environment: venv\Scripts\activate
echo 2. Add your keys to backend\.env
echo 3. Run backend from repo root: uvicorn backend.main:app --reload --reload-dir backend --host 0.0.0.0 --port 8001
echo 4. Run frontend in another terminal: cd frontend ^& npm run dev
echo 5. Or run both with Docker: docker compose up --build
pause
