#!/bin/bash

# Script para verificar la configuración de secrets de GitHub Actions
# Uso: ./scripts/verify-secrets.sh

set -e

echo "🔍 Verificando configuración de secrets..."
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar si gh CLI está instalado
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) no está instalado${NC}"
    echo "   Instalar: https://cli.github.com/"
    exit 1
fi

# Verificar autenticación
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ No estás autenticado en GitHub CLI${NC}"
    echo "   Ejecuta: gh auth login"
    exit 1
fi

echo -e "${GREEN}✅ GitHub CLI configurado${NC}"
echo ""

# Obtener repo actual
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "📦 Repositorio: $REPO"
echo ""

# Función para verificar un secret
check_secret() {
    local secret_name=$1
    local description=$2
    
    if gh secret list | grep -q "^${secret_name}"; then
        echo -e "${GREEN}✅ ${secret_name}${NC} - ${description}"
        return 0
    else
        echo -e "${RED}❌ ${secret_name}${NC} - ${description}"
        return 1
    fi
}

# Verificar secrets
echo "🔐 Verificando secrets requeridos:"
echo ""

MISSING_SECRETS=0

# BRANCH_PROTECTION_TOKEN
if ! check_secret "BRANCH_PROTECTION_TOKEN" "Token para configurar branch protection"; then
    MISSING_SECRETS=$((MISSING_SECRETS + 1))
    echo -e "${YELLOW}   📖 Ver .github/SECRETS.md para crear el token${NC}"
    echo -e "${YELLOW}   Necesita permisos: repo + admin:repo_hook${NC}"
fi

# VERCEL_TOKEN
if ! check_secret "VERCEL_TOKEN" "Token de autenticación de Vercel"; then
    MISSING_SECRETS=$((MISSING_SECRETS + 1))
    echo -e "${YELLOW}   📖 Crear en: https://vercel.com/account/tokens${NC}"
fi

# VERCEL_ORG_ID
if ! check_secret "VERCEL_ORG_ID" "ID de organización en Vercel"; then
    MISSING_SECRETS=$((MISSING_SECRETS + 1))
    echo -e "${YELLOW}   📖 Obtener ejecutando: vercel link${NC}"
fi

# VERCEL_PROJECT_ID
if ! check_secret "VERCEL_PROJECT_ID" "ID de proyecto en Vercel"; then
    MISSING_SECRETS=$((MISSING_SECRETS + 1))
    echo -e "${YELLOW}   📖 Obtener ejecutando: vercel link${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $MISSING_SECRETS -eq 0 ]; then
    echo -e "${GREEN}✅ Todos los secrets están configurados correctamente${NC}"
    echo ""
    echo "🚀 Puedes ejecutar los workflows:"
    echo "   • Branch Protection: gh workflow run branch-protection.yml"
    echo "   • Deploy to Vercel: gh workflow run deploy-vercel.yml"
    exit 0
else
    echo -e "${RED}❌ Faltan $MISSING_SECRETS secret(s)${NC}"
    echo ""
    echo "📖 Para configurar secrets:"
    echo "   1. Lee la guía: .github/SECRETS.md"
    echo "   2. Agrega secrets en: https://github.com/$REPO/settings/secrets/actions"
    echo "   3. O usa: gh secret set SECRET_NAME"
    exit 1
fi
