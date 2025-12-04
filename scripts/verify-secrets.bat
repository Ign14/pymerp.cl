@echo off
REM Script para verificar la configuración de secrets de GitHub Actions (Windows)

echo Verificando configuracion de secrets...
echo.

REM Verificar si gh CLI está instalado
where gh >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] GitHub CLI ^(gh^) no esta instalado
    echo    Instalar: https://cli.github.com/
    exit /b 1
)

REM Verificar autenticación
gh auth status >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] No estas autenticado en GitHub CLI
    echo    Ejecuta: gh auth login
    exit /b 1
)

echo [OK] GitHub CLI configurado
echo.

REM Obtener repo actual
for /f "delims=" %%i in ('gh repo view --json nameWithOwner -q .nameWithOwner') do set REPO=%%i
echo Repositorio: %REPO%
echo.

echo Verificando secrets requeridos:
echo.

set MISSING_SECRETS=0

REM Verificar BRANCH_PROTECTION_TOKEN
gh secret list | findstr /C:"BRANCH_PROTECTION_TOKEN" >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] BRANCH_PROTECTION_TOKEN
) else (
    echo [FALTA] BRANCH_PROTECTION_TOKEN - Token para branch protection
    echo    Ver .github/SECRETS.md para crear el token
    set /a MISSING_SECRETS+=1
)

REM Verificar VERCEL_TOKEN
gh secret list | findstr /C:"VERCEL_TOKEN" >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] VERCEL_TOKEN
) else (
    echo [FALTA] VERCEL_TOKEN - Token de autenticacion de Vercel
    echo    Crear en: https://vercel.com/account/tokens
    set /a MISSING_SECRETS+=1
)

REM Verificar VERCEL_ORG_ID
gh secret list | findstr /C:"VERCEL_ORG_ID" >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] VERCEL_ORG_ID
) else (
    echo [FALTA] VERCEL_ORG_ID - ID de organizacion en Vercel
    echo    Obtener ejecutando: vercel link
    set /a MISSING_SECRETS+=1
)

REM Verificar VERCEL_PROJECT_ID
gh secret list | findstr /C:"VERCEL_PROJECT_ID" >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] VERCEL_PROJECT_ID
) else (
    echo [FALTA] VERCEL_PROJECT_ID - ID de proyecto en Vercel
    echo    Obtener ejecutando: vercel link
    set /a MISSING_SECRETS+=1
)

echo.
echo ========================================

if %MISSING_SECRETS% equ 0 (
    echo [OK] Todos los secrets estan configurados
    echo.
    echo Puedes ejecutar los workflows:
    echo    gh workflow run branch-protection.yml
    echo    gh workflow run deploy-vercel.yml
    exit /b 0
) else (
    echo [ERROR] Faltan %MISSING_SECRETS% secret^(s^)
    echo.
    echo Para configurar secrets:
    echo    1. Lee la guia: .github/SECRETS.md
    echo    2. Agrega secrets en: https://github.com/%REPO%/settings/secrets/actions
    echo    3. O usa: gh secret set SECRET_NAME
    exit /b 1
)
