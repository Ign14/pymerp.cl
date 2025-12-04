@echo off
REM Script para configurar rápidamente el archivo .env en Windows
REM Uso: CONFIGURE_ENV.bat

echo.
echo ================================================
echo  Configurando Google Analytics 4 para AgendaWeb
echo ================================================
echo.

REM Verificar si .env ya existe
if exist ".env" (
    echo [WARNING] El archivo .env ya existe.
    set /p overwrite="Deseas sobrescribirlo? (s/n): "
    if /i not "%overwrite%"=="s" (
        echo [CANCELADO] Operacion cancelada
        exit /b 1
    )
)

REM Crear archivo .env
(
echo # ====================================
echo # AGENDAWEB - Development Environment
echo # ====================================
echo.
echo # ============ GOOGLE ANALYTICS 4 ============
echo # Measurement ID: G-RZ7NZ3TKSG
echo VITE_GA_MEASUREMENT_ID=G-RZ7NZ3TKSG
echo VITE_GA_DEBUG=true
echo VITE_ENABLE_ANALYTICS=true
echo.
echo # ============ APPLICATION ============
echo VITE_APP_VERSION=1.0.0
echo VITE_APP_NAME=AgendaWeb
echo VITE_APP_ENV=development
echo.
echo # ============ FIREBASE ============
echo # IMPORTANTE: Reemplazar con tus credenciales
echo VITE_FIREBASE_API_KEY=your-api-key-here
echo VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
echo VITE_FIREBASE_PROJECT_ID=your-project-id
echo VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
echo VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
echo VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
echo.
echo # ============ GOOGLE MAPS ============
echo VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
echo.
echo # ============ SENTRY ============
echo VITE_SENTRY_DSN=your-sentry-dsn-here
echo VITE_SENTRY_ENVIRONMENT=development
echo VITE_ENABLE_SENTRY=true
echo.
echo # ============ DEBUG ============
echo VITE_DEBUG=true
) > .env

echo.
echo [OK] Archivo .env creado exitosamente
echo.
echo Google Analytics 4 configurado con:
echo    Measurement ID: G-RZ7NZ3TKSG
echo    Debug Mode: Habilitado
echo.
echo [IMPORTANTE]
echo    - Actualiza las credenciales de Firebase en .env
echo    - Actualiza Google Maps API Key en .env
echo.
echo Proximo paso:
echo    npm run dev
echo.
echo Documentacion completa:
echo    - SETUP_GA4_AGENDAWEB.md
echo    - GOOGLE_ANALYTICS_SETUP.md
echo.
pause

