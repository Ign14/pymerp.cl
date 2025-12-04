# GitHub Secrets Configuration Guide

Esta guía explica cómo configurar los secrets necesarios para los workflows de CI/CD.

## 📋 Secrets Requeridos

### 1. BRANCH_PROTECTION_TOKEN

**Propósito:** Token con permisos para configurar reglas de protección de ramas.

**Pasos para crear:**

1. Ve a GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click en "Generate new token (classic)"
3. Nombre: `Branch Protection Token`
4. Permisos requeridos:
   - ✅ `repo` (Full control of private repositories)
     - ✅ `repo:status`
     - ✅ `repo_deployment`
     - ✅ `public_repo`
   - ✅ `admin:repo_hook` (Full control of repository hooks)
5. Expiration: Configura según tus políticas (recomendado: 90 días)
6. Click "Generate token"
7. **Copia el token** (solo se muestra una vez)

**Añadir al repositorio:**
```
Repo → Settings → Secrets and variables → Actions → New repository secret
Name: BRANCH_PROTECTION_TOKEN
Secret: [pegar el token]
```

### 2. VERCEL_TOKEN

**Propósito:** Token para autenticar con la API de Vercel.

**Pasos para crear:**

1. Ve a [Vercel Dashboard](https://vercel.com/account/tokens)
2. Click en "Create Token"
3. Nombre: `GitHub Actions Deploy`
4. Scope: `Full Account`
5. Expiration: Recomendado sin expiración o 1 año
6. Click "Create"
7. **Copia el token**

**Añadir al repositorio:**
```
Repo → Settings → Secrets and variables → Actions → New repository secret
Name: VERCEL_TOKEN
Secret: [pegar el token]
```

### 3. VERCEL_ORG_ID

**Propósito:** ID de tu organización o cuenta personal en Vercel.

**Obtener el ID:**

1. Método 1 - Desde el proyecto:
   ```bash
   cd "tu-proyecto"
   vercel link
   cat .vercel/project.json
   ```

2. Método 2 - Desde la URL del dashboard:
   ```
   https://vercel.com/[team-slug]/settings
   El ID está en Settings → General
   ```

**Añadir al repositorio:**
```
Repo → Settings → Secrets and variables → Actions → New repository secret
Name: VERCEL_ORG_ID
Secret: [pegar el org ID]
```

### 4. VERCEL_PROJECT_ID

**Propósito:** ID del proyecto específico en Vercel.

**Obtener el ID:**

1. Método 1 - Desde el proyecto vinculado:
   ```bash
   cd "tu-proyecto"
   vercel link
   cat .vercel/project.json
   ```

2. Método 2 - Desde la configuración del proyecto:
   ```
   Vercel Dashboard → Tu proyecto → Settings → General
   El Project ID está visible ahí
   ```

**Añadir al repositorio:**
```
Repo → Settings → Secrets and variables → Actions → New repository secret
Name: VERCEL_PROJECT_ID
Secret: [pegar el project ID]
```

## 🚀 Uso de los Workflows

### Branch Protection

**Ejecutar manualmente:**
```
GitHub → Actions → "Configure Branch Protection" → Run workflow
Branch: main (o la rama que quieras proteger)
```

**Configuración aplicada:**
- Requiere CI tests (Node 18.x, 20.x) + E2E
- Requiere 1 aprobación en PRs
- Descarta reviews obsoletos
- Requiere resolver conversaciones
- Previene force push y eliminación

### Deploy to Vercel

**Ejecutar manualmente:**
```
GitHub → Actions → "Deploy to Vercel" → Run workflow
Environment: preview | production
```

**Deploy automático:**
- Push a `main` → deploy a production
- Puedes modificar el trigger según necesites

## ✅ Verificación

### 1. Verificar Branch Protection
```bash
# Usando GitHub CLI
gh api repos/{owner}/{repo}/branches/main/protection
```

### 2. Verificar Deploy Vercel
```bash
# Después del workflow, verifica el URL en el summary
# O usando Vercel CLI
vercel ls
```

## 🔒 Seguridad

- ✅ Los secrets nunca se imprimen en logs
- ✅ Los tokens tienen permisos mínimos necesarios
- ✅ Rota los tokens periódicamente
- ✅ Usa environments de GitHub para production
- ⚠️ BRANCH_PROTECTION_TOKEN requiere permisos de admin

## 🆘 Troubleshooting

### Error: "Resource not accessible by integration"
- El token no tiene permisos suficientes
- Verifica que BRANCH_PROTECTION_TOKEN tenga scope `repo` y `admin:repo_hook`

### Error: "Vercel: Invalid token"
- VERCEL_TOKEN expirado o incorrecto
- Regenera el token en Vercel Dashboard

### Error: "Project not found"
- VERCEL_PROJECT_ID incorrecto
- Ejecuta `vercel link` y copia el ID desde `.vercel/project.json`

### Branch protection no se aplica
- Necesitas ser admin del repositorio
- El token debe tener permisos de admin

## 📚 Referencias

- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [Vercel CLI](https://vercel.com/docs/cli)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
