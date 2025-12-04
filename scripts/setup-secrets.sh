#!/bin/bash

# Script interactivo para configurar todos los secrets de GitHub Actions
# Uso: ./scripts/setup-secrets.sh

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   🔐 Configuración de Secrets de GitHub${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verificar gh CLI
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) no está instalado${NC}"
    echo "   Instalar: https://cli.github.com/"
    exit 1
fi

# Verificar autenticación
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️  No estás autenticado en GitHub CLI${NC}"
    echo "   Ejecutando: gh auth login"
    gh auth login
fi

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo -e "📦 Repositorio: ${GREEN}${REPO}${NC}"
echo ""

# Función para solicitar input
prompt_secret() {
    local secret_name=$1
    local description=$2
    local instructions=$3
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}📝 Configurando: ${secret_name}${NC}"
    echo -e "${NC}${description}${NC}"
    echo ""
    echo -e "${NC}${instructions}${NC}"
    echo ""
    
    read -p "¿Continuar con este secret? (s/n): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo -e "${YELLOW}⏭️  Saltando ${secret_name}${NC}"
        return 1
    fi
    
    read -sp "Pega el valor del secret (oculto): " secret_value
    echo ""
    
    if [ -z "$secret_value" ]; then
        echo -e "${RED}❌ Valor vacío, saltando${NC}"
        return 1
    fi
    
    echo "$secret_value" | gh secret set "$secret_name"
    echo -e "${GREEN}✅ ${secret_name} configurado${NC}"
    echo ""
    
    return 0
}

# Configurar BRANCH_PROTECTION_TOKEN
prompt_secret \
    "BRANCH_PROTECTION_TOKEN" \
    "Token para configurar reglas de protección de ramas" \
    "1. Ve a: https://github.com/settings/tokens/new
2. Permisos: repo + admin:repo_hook
3. Copia el token generado"

# Configurar VERCEL_TOKEN
prompt_secret \
    "VERCEL_TOKEN" \
    "Token de autenticación de Vercel" \
    "1. Ve a: https://vercel.com/account/tokens
2. Click 'Create Token'
3. Scope: Full Account
4. Copia el token"

# Configurar VERCEL_ORG_ID
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📝 Configurando: VERCEL_ORG_ID${NC}"
echo ""

if [ -f ".vercel/project.json" ]; then
    ORG_ID=$(cat .vercel/project.json | grep -o '"orgId":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$ORG_ID" ]; then
        echo -e "Encontrado en .vercel/project.json: ${GREEN}${ORG_ID}${NC}"
        read -p "¿Usar este valor? (s/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Ss]$ ]]; then
            echo "$ORG_ID" | gh secret set VERCEL_ORG_ID
            echo -e "${GREEN}✅ VERCEL_ORG_ID configurado${NC}"
            echo ""
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Archivo .vercel/project.json no encontrado${NC}"
    echo "   Ejecuta: vercel link"
    echo ""
    read -p "¿Ya ejecutaste 'vercel link'? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        prompt_secret \
            "VERCEL_ORG_ID" \
            "ID de organización de Vercel" \
            "Obtener de: cat .vercel/project.json | grep orgId"
    fi
fi

# Configurar VERCEL_PROJECT_ID
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📝 Configurando: VERCEL_PROJECT_ID${NC}"
echo ""

if [ -f ".vercel/project.json" ]; then
    PROJECT_ID=$(cat .vercel/project.json | grep -o '"projectId":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$PROJECT_ID" ]; then
        echo -e "Encontrado en .vercel/project.json: ${GREEN}${PROJECT_ID}${NC}"
        read -p "¿Usar este valor? (s/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Ss]$ ]]; then
            echo "$PROJECT_ID" | gh secret set VERCEL_PROJECT_ID
            echo -e "${GREEN}✅ VERCEL_PROJECT_ID configurado${NC}"
            echo ""
        fi
    fi
else
    prompt_secret \
        "VERCEL_PROJECT_ID" \
        "ID de proyecto de Vercel" \
        "Obtener de: cat .vercel/project.json | grep projectId"
fi

# Resumen
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Configuración completada${NC}"
echo ""
echo "Verificando secrets configurados..."
echo ""

gh secret list

echo ""
echo -e "${YELLOW}📖 Próximos pasos:${NC}"
echo "   1. Verifica los secrets: npm run verify:secrets"
echo "   2. Ejecuta Branch Protection: gh workflow run branch-protection.yml"
echo "   3. Ejecuta Deploy: gh workflow run deploy-vercel.yml -f environment=preview"
echo ""
