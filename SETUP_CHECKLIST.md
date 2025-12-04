# 🚀 Checklist de Configuración CI/CD

Usa este checklist para configurar el proyecto completamente.

## ✅ Tareas Completadas

- [x] Tests unitarios configurados (Vitest)
- [x] Tests E2E configurados (Playwright)
- [x] Workflows de CI creados
- [x] Thresholds de cobertura configurados
- [x] README actualizado con documentación

## 📋 Configuración de Secrets (Pendiente)

### 1. BRANCH_PROTECTION_TOKEN

**Estado:** ⏳ Pendiente

**Pasos:**
```bash
# 1. Crear token en GitHub
https://github.com/settings/tokens/new

# 2. Permisos requeridos:
- ✅ repo (full)
- ✅ admin:repo_hook

# 3. Agregar al repositorio
gh secret set BRANCH_PROTECTION_TOKEN
# O via UI: Settings → Secrets → New repository secret
```

### 2. VERCEL_TOKEN

**Estado:** ⏳ Pendiente

**Pasos:**
```bash
# 1. Crear token en Vercel
https://vercel.com/account/tokens

# 2. Scope: Full Account
# 3. Agregar al repositorio
gh secret set VERCEL_TOKEN
```

### 3. VERCEL_ORG_ID

**Estado:** ⏳ Pendiente

**Pasos:**
```bash
# 1. Vincular proyecto con Vercel
npm run setup:vercel
# o: vercel link

# 2. Obtener el ID
cat .vercel/project.json | grep orgId

# 3. Agregar al repositorio
gh secret set VERCEL_ORG_ID
```

### 4. VERCEL_PROJECT_ID

**Estado:** ⏳ Pendiente

**Pasos:**
```bash
# 1. Ya lo obtuviste en el paso anterior
cat .vercel/project.json | grep projectId

# 2. Agregar al repositorio
gh secret set VERCEL_PROJECT_ID
```

## 🔍 Verificación

Después de configurar los secrets, ejecuta:

```bash
# Windows
npm run verify:secrets

# Linux/Mac
./scripts/verify-secrets.sh
```

## 🚀 Lanzar Workflows

### Branch Protection

```bash
# Via GitHub CLI
gh workflow run branch-protection.yml

# Via UI
Actions → Enforce Branch Protection → Run workflow
  Branch: main
  Dry run: false (o true para preview)
```

### Deploy to Vercel

```bash
# Preview
gh workflow run deploy-vercel.yml -f environment=preview

# Production
gh workflow run deploy-vercel.yml -f environment=production

# Via UI
Actions → Deploy to Vercel → Run workflow
  Environment: production/preview
```

## 📝 Notas

- **Branch Protection** requiere permisos de admin en el repositorio
- **Vercel Deploy** automático en push a `main`
- Los secrets son sensibles, nunca los compartas en código
- Rota los tokens periódicamente (recomendado: cada 90 días)

## 🆘 Troubleshooting

### "Resource not accessible by integration"
→ El token no tiene permisos suficientes. Verifica scopes del PAT.

### "Invalid Vercel token"
→ Token expirado o incorrecto. Regenera en Vercel Dashboard.

### "Project not found"
→ VERCEL_PROJECT_ID incorrecto. Ejecuta `vercel link` nuevamente.

## 📚 Referencias

- [Guía completa de secrets](./.github/SECRETS.md)
- [GitHub Branch Protection Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [Vercel CLI Docs](https://vercel.com/docs/cli)

---

**Última actualización:** 3 de diciembre de 2025
