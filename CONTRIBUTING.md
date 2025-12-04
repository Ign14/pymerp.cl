# 🤝 Guía de Contribución

¡Gracias por tu interés en contribuir a PYM-ERP! Esta guía te ayudará a empezar.

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [Cómo Contribuir](#cómo-contribuir)
- [Configuración del Entorno](#configuración-del-entorno)
- [Flujo de Trabajo](#flujo-de-trabajo)
- [Estándares de Código](#estándares-de-código)
- [Commits](#commits)
- [Pull Requests](#pull-requests)
- [Testing](#testing)
- [Documentación](#documentación)

## 📜 Código de Conducta

### Nuestro Compromiso

Nos comprometemos a hacer de la participación en este proyecto una experiencia libre de acoso para todos, independientemente de:
- Edad, tamaño corporal, discapacidad visible o invisible
- Etnia, características sexuales, identidad y expresión de género
- Nivel de experiencia, educación, estatus socioeconómico
- Nacionalidad, apariencia personal, raza, religión
- Identidad y orientación sexual

### Nuestros Estándares

**Comportamientos que contribuyen positivamente:**
- Usar lenguaje acogedor e inclusivo
- Respetar diferentes puntos de vista y experiencias
- Aceptar críticas constructivas con gracia
- Enfocarse en lo mejor para la comunidad
- Mostrar empatía hacia otros miembros

**Comportamientos inaceptables:**
- Lenguaje o imágenes sexualizadas y atención sexual no deseada
- Trolling, comentarios insultantes/despectivos y ataques personales o políticos
- Acoso público o privado
- Publicar información privada de otros sin permiso explícito
- Otra conducta que razonablemente podría considerarse inapropiada

## 🚀 Cómo Contribuir

### Reportar Bugs

Los bugs se rastrean como [GitHub Issues](https://github.com/tu-usuario/agendaweb/issues). Antes de crear un issue:

1. **Busca en issues existentes** para ver si ya fue reportado
2. **Verifica que sea un bug real** y no un problema de configuración
3. **Usa la plantilla de bug report** si está disponible

**Incluye en tu reporte:**
- Descripción clara y concisa del bug
- Pasos para reproducir el comportamiento
- Comportamiento esperado vs. actual
- Screenshots o videos (si aplica)
- Información del entorno:
  - OS: [e.g. Windows 11, macOS 14]
  - Navegador: [e.g. Chrome 120, Firefox 121]
  - Versión de Node.js
  - Versión del proyecto

**Ejemplo:**
```markdown
## Descripción
El botón de "Guardar" en el formulario de servicios no responde al hacer clic.

## Pasos para reproducir
1. Ir a Dashboard > Servicios > Nuevo Servicio
2. Llenar el formulario con datos válidos
3. Hacer clic en "Guardar"
4. Nada sucede, no hay respuesta visual

## Esperado
Debería guardar el servicio y mostrar un mensaje de éxito.

## Actual
El botón no responde, no hay feedback visual.

## Entorno
- OS: Windows 11
- Navegador: Chrome 120
- Node: 20.10.0
- Versión: 1.0.0
```

### Sugerir Mejoras

Las sugerencias de mejoras también se rastrean como issues. Incluye:

- **Título claro** que resuma la mejora
- **Descripción detallada** del problema actual y la mejora propuesta
- **Casos de uso** donde la mejora sería útil
- **Alternativas consideradas** (si aplica)
- **Screenshots o mockups** (si aplica)

### Contribuir con Código

1. **Fork el repositorio** en GitHub
2. **Clona tu fork** localmente
3. **Crea una rama** para tu feature/fix
4. **Haz tus cambios** siguiendo los estándares
5. **Escribe tests** para tu código
6. **Actualiza la documentación** si es necesario
7. **Haz commit** usando Conventional Commits
8. **Push** a tu fork
9. **Abre un Pull Request**

## 🛠 Configuración del Entorno

### Requisitos

- Node.js >= 18.x
- npm >= 9.x
- Git >= 2.x
- VS Code (recomendado)

### Configuración Inicial

```bash
# 1. Fork y clone
git clone https://github.com/TU-USUARIO/agendaweb.git
cd agendaweb

# 2. Agregar upstream remote
git remote add upstream https://github.com/USUARIO-ORIGINAL/agendaweb.git

# 3. Instalar dependencias
npm install
cd functions && npm install && cd ..

# 4. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# 5. Iniciar desarrollo
npm run dev
```

### Extensiones VS Code Recomendadas

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-playwright.playwright",
    "fireside.firecode",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

## 🔄 Flujo de Trabajo

### 1. Sincronizar con Upstream

```bash
# Actualizar main local con upstream
git checkout main
git fetch upstream
git merge upstream/main
git push origin main
```

### 2. Crear Rama Feature/Fix

**Nomenclatura de ramas:**
```
feat/nombre-descriptivo      # Nueva funcionalidad
fix/nombre-del-bug          # Corrección de bug
docs/tema-documentado       # Documentación
refactor/componente-x       # Refactorización
test/componente-a-testear   # Tests
chore/tarea-mantenimiento   # Tareas de mantenimiento
```

**Ejemplo:**
```bash
git checkout -b feat/add-pdf-export
```

### 3. Desarrollo

```bash
# Hacer cambios
# Ejecutar tests frecuentemente
npm run test:watch

# Verificar linting
npm run lint

# Verificar build
npm run build
```

### 4. Commit

Usa [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "feat: agregar exportación PDF de reportes"
```

### 5. Push y Pull Request

```bash
git push origin feat/add-pdf-export
```

Luego crea el PR en GitHub.

## 📝 Estándares de Código

### TypeScript

- **Usa tipos explícitos** siempre que sea posible
- **Evita `any`**, usa `unknown` si es necesario
- **Define interfaces** para objetos complejos
- **Usa enums** para conjuntos fijos de valores

```typescript
// ✅ Bueno
interface User {
  id: string;
  email: string;
  role: UserRole;
}

function getUser(id: string): Promise<User> {
  // ...
}

// ❌ Malo
function getUser(id: any): any {
  // ...
}
```

### React

- **Componentes funcionales** con hooks
- **Props con interfaces** bien definidas
- **Destructuring de props** en parámetros
- **Early returns** para condiciones
- **Custom hooks** para lógica reutilizable

```typescript
// ✅ Bueno
interface UserCardProps {
  user: User;
  onEdit: (id: string) => void;
}

export default function UserCard({ user, onEdit }: UserCardProps) {
  if (!user) return null;
  
  return (
    <div>
      <h3>{user.email}</h3>
      <button onClick={() => onEdit(user.id)}>Edit</button>
    </div>
  );
}

// ❌ Malo
export default function UserCard(props: any) {
  return (
    <div>
      {props.user && (
        <>
          <h3>{props.user.email}</h3>
          <button onClick={() => props.onEdit(props.user.id)}>Edit</button>
        </>
      )}
    </div>
  );
}
```

### Naming Conventions

- **Componentes**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase con prefijo `use` (`useAuth.ts`)
- **Utilidades**: camelCase (`formatDate.ts`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Tipos/Interfaces**: PascalCase (`User`, `ServiceProps`)

### Estructura de Archivos

```
components/
  UserProfile/
    UserProfile.tsx          # Componente principal
    UserProfile.test.tsx     # Tests
    UserProfile.styles.css   # Estilos (si no usa Tailwind)
    index.ts                 # Export
```

### Comentarios

- **JSDoc** para funciones públicas complejas
- **Comentarios inline** solo cuando el código no es auto-explicativo
- **TODO comments** con contexto

```typescript
/**
 * Calcula el precio total del carrito incluyendo impuestos y descuentos.
 * 
 * @param items - Array de items del carrito
 * @param discountCode - Código de descuento opcional
 * @returns Objeto con subtotal, impuestos, descuento y total
 * 
 * @example
 * ```typescript
 * const total = calculateCartTotal(cartItems, 'SUMMER2024');
 * console.log(total.final); // 150.50
 * ```
 */
export function calculateCartTotal(
  items: CartItem[],
  discountCode?: string
): CartTotal {
  // TODO: Implementar validación de código de descuento con API
  // Issue: #123
  
  // Código...
}
```

## 💬 Commits

### Conventional Commits

Formato: `<type>(<scope>): <description>`

**Types:**
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Solo documentación
- `style`: Formato, semicolons, etc. (no cambios de código)
- `refactor`: Refactorización de código
- `perf`: Mejora de performance
- `test`: Agregar o corregir tests
- `chore`: Mantenimiento (deps, configs, etc.)
- `ci`: Cambios en CI/CD
- `build`: Cambios en build system

**Scope (opcional):**
- `auth`: Autenticación
- `dashboard`: Dashboard
- `services`: Servicios
- `products`: Productos
- `admin`: Panel admin
- `i18n`: Internacionalización
- `analytics`: Analytics

**Ejemplos:**
```bash
feat(services): agregar filtro por categoría
fix(auth): corregir logout en Safari
docs(readme): actualizar guía de instalación
style(dashboard): formatear con Prettier
refactor(cart): simplificar cálculo de totales
perf(products): optimizar carga de imágenes
test(services): agregar tests unitarios
chore(deps): actualizar react a 18.3
```

### Breaking Changes

Para cambios que rompen compatibilidad:

```bash
feat(api)!: cambiar estructura de respuesta de API

BREAKING CHANGE: El campo `user` ahora es `userData` en todas las respuestas.
Migración: Buscar y reemplazar `response.user` por `response.userData`.
```

## 🔀 Pull Requests

### Antes de Crear el PR

- [ ] El código compila sin errores
- [ ] Todos los tests pasan
- [ ] ESLint no muestra errores
- [ ] La documentación está actualizada
- [ ] Los commits siguen Conventional Commits
- [ ] La rama está actualizada con main

### Título del PR

Usa el mismo formato de Conventional Commits:

```
feat(services): agregar filtro por categoría
```

### Descripción del PR

**Plantilla:**

```markdown
## Descripción
Breve descripción de los cambios.

## Motivación y Contexto
¿Por qué es necesario este cambio? ¿Qué problema resuelve?

## Tipo de Cambio
- [ ] Bug fix (cambio que corrige un issue)
- [ ] Nueva funcionalidad (cambio que agrega funcionalidad)
- [ ] Breaking change (fix o feature que causaría que funcionalidad existente no funcione como se espera)
- [ ] Documentación

## ¿Cómo se ha Testeado?
Describe los tests que ejecutaste.

## Checklist
- [ ] Mi código sigue los estándares del proyecto
- [ ] He realizado self-review de mi código
- [ ] He comentado mi código donde es necesario
- [ ] He actualizado la documentación
- [ ] Mis cambios no generan nuevos warnings
- [ ] He agregado tests que prueban que mi fix es efectivo o que mi feature funciona
- [ ] Tests unitarios existentes y nuevos pasan localmente
- [ ] He verificado que no hay conflictos con main

## Screenshots (si aplica)
```

### Review Process

1. **CI/CD checks** deben pasar (tests, linting, build)
2. **Al menos 1 approval** de un maintainer
3. **Todos los comentarios** deben ser resueltos
4. **No conflicts** con la rama base

### Merge

Los maintainers harán merge usando **Squash and Merge** para mantener historial limpio.

## 🧪 Testing

### Tests Obligatorios

- **Tests unitarios** para lógica compleja
- **Tests de integración** para flujos críticos
- **Tests E2E** para features principales

### Escribir Tests

```typescript
// services/auth.test.ts
import { describe, it, expect, vi } from 'vitest';
import { signIn } from './auth';

describe('signIn', () => {
  it('should sign in user with valid credentials', async () => {
    const email = 'test@example.com';
    const password = 'password123';
    
    const result = await signIn(email, password);
    
    expect(result).toBeDefined();
    expect(result.user.email).toBe(email);
  });

  it('should throw error with invalid credentials', async () => {
    await expect(
      signIn('test@example.com', 'wrongpassword')
    ).rejects.toThrow('Invalid credentials');
  });
});
```

### Ejecutar Tests

```bash
# Todos los tests
npm run test:all

# Solo unitarios
npm run test

# Solo E2E
npm run test:e2e

# Con coverage
npm run test -- --coverage
```

### Coverage Mínimo

- **Statements**: 70%
- **Branches**: 65%
- **Functions**: 70%
- **Lines**: 70%

## 📚 Documentación

### Documentar Código

- **JSDoc** en funciones exportadas
- **Comentarios inline** cuando sea necesario
- **README** en carpetas complejas
- **Examples** en la documentación

### Actualizar Docs

Si tu PR afecta:
- **Configuración**: Actualiza `ENV_VARIABLES_GUIDE.md`
- **APIs**: Actualiza `docs/API.md`
- **Arquitectura**: Actualiza `docs/ARCHITECTURE.md`
- **Usuario final**: Actualiza guías de usuario

### Changelog

Los maintainers actualizarán `CHANGELOG.md` automáticamente basándose en Conventional Commits.

## ❓ Preguntas

Si tienes preguntas:
1. Revisa la [documentación](./docs/)
2. Busca en [Issues cerrados](https://github.com/tu-usuario/agendaweb/issues?q=is%3Aissue+is%3Aclosed)
3. Abre un [Discussion](https://github.com/tu-usuario/agendaweb/discussions)
4. Contacta al equipo: ignacio@datakomerz.com

## 🎉 Reconocimientos

¡Todos los contribuidores son reconocidos en nuestra página de agradecimientos!

---

**¡Gracias por contribuir a PYM-ERP! 🙌**
