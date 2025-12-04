#!/bin/bash

# Script para configurar rápidamente el archivo .env
# Uso: ./CONFIGURE_ENV.sh

echo "🚀 Configurando Google Analytics 4 para AgendaWeb"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar si .env ya existe
if [ -f ".env" ]; then
    echo "⚠️  El archivo .env ya existe."
    read -p "¿Deseas sobrescribirlo? (s/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "❌ Operación cancelada"
        exit 1
    fi
fi

# Crear archivo .env
cat > .env << 'EOF'
# ====================================
# AGENDAWEB - Development Environment
# ====================================

# ============ GOOGLE ANALYTICS 4 ============
# Measurement ID: G-RZ7NZ3TKSG
VITE_GA_MEASUREMENT_ID=G-RZ7NZ3TKSG
VITE_GA_DEBUG=true
VITE_ENABLE_ANALYTICS=true

# ============ APPLICATION ============
VITE_APP_VERSION=1.0.0
VITE_APP_NAME=AgendaWeb
VITE_APP_ENV=development

# ============ FIREBASE ============
# IMPORTANTE: Reemplazar con tus credenciales
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# ============ GOOGLE MAPS ============
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here

# ============ SENTRY ============
VITE_SENTRY_DSN=your-sentry-dsn-here
VITE_SENTRY_ENVIRONMENT=development
VITE_ENABLE_SENTRY=true

# ============ DEBUG ============
VITE_DEBUG=true
EOF

echo "✅ Archivo .env creado exitosamente"
echo ""
echo "📊 Google Analytics 4 configurado con:"
echo "   Measurement ID: G-RZ7NZ3TKSG"
echo "   Debug Mode: Habilitado"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - Actualiza las credenciales de Firebase en .env"
echo "   - Actualiza Google Maps API Key en .env"
echo ""
echo "🚀 Próximo paso:"
echo "   npm run dev"
echo ""
echo "📖 Documentación completa:"
echo "   - SETUP_GA4_AGENDAWEB.md"
echo "   - GOOGLE_ANALYTICS_SETUP.md"
echo ""

