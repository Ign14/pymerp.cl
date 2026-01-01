# Componentes de Marketing

Componentes de la Landing Page construidos con React, TypeScript, Tailwind CSS y Framer Motion.

## 📁 Estructura

```
marketing/
├── Navbar.tsx            # Navegación sticky con scroll suave
├── Hero.tsx              # Sección hero con CTAs principales
├── LogoCloud.tsx         # Logos de empresas + stats de confianza
├── Features.tsx          # Grid de 6 cards con funcionalidades
├── Segmentation.tsx      # Tabs de Servicios/Productos
├── HowItWorks.tsx        # 3 pasos del proceso
├── Testimonials.tsx      # 3 testimonios de clientes
├── FAQ.tsx               # 6 preguntas frecuentes (acordeón)
├── CTASection.tsx        # CTA final con gradiente
├── types.ts              # Tipos TypeScript
├── mockData.ts           # Datos mockeados tipados
├── index.ts              # Exports centralizados
└── README.md             # Esta documentación
```

## 🎨 Componentes

### Navbar
**Ubicación:** Fixed top
**Características:**
- Navegación sticky con backdrop-blur
- Scroll suave a secciones con IDs
- Logo animado
- Menu responsive con hamburger
- 2 CTAs (Iniciar Sesión / Comenzar Gratis)
- Animaciones de entrada escalonadas

### Hero
**Ubicación:** Primera sección de la landing
**Características:**
- Título animado con gradiente
- Badge de novedades
- 2 CTAs (Primary: `/request-access`, Secondary: `/features`)
- Social proof (avatares + rating)
- Background con gradientes animados

### LogoCloud
**Ubicación:** Después del Hero
**Características:**
- 5 logos de empresas
- Efecto grayscale → color al hover
- 4 stats de confianza
- Animaciones escalonadas

### Features
**Ubicación:** Sección de funcionalidades
**Características:**
- Grid de 6 cards (responsive: 1/2/3 columnas)
- Cada card con icono emoji + gradiente único
- Animación de elevación al hover
- CTA al final de la sección

### Segmentation
**Ubicación:** Después de Features
**Características:**
- Tabs para alternar entre Servicios/Productos
- 2 cards por categoría
- Lista de features con checkmarks animados
- Gradientes de fondo sutiles

### HowItWorks
**Ubicación:** Sección de proceso
**Características:**
- 3 pasos con numeración
- Línea conectora en desktop
- Flechas entre pasos
- CTA al final

### Testimonials
**Ubicación:** Sección de testimonios
**Características:**
- Grid de 3 testimonios
- Avatares de pravatar.cc
- Rating de 5 estrellas
- Elevación al hover
- Badge de satisfacción al final

### FAQ
**Ubicación:** Preguntas frecuentes
**Características:**
- 6 preguntas en acordeón
- Animación de apertura/cierre suave
- Icono de flecha rotativa
- CTA de contacto al final

### CTASection
**Ubicación:** Última sección antes del footer
**Características:**
- Background con gradiente animado
- Shapes animados con motion
- Badge de usuarios activos
- 2 CTAs principales
- 3 trust indicators

## 🎭 Animaciones

Todas las animaciones usan **Framer Motion** con:
- `initial` → `whileInView` para scroll reveals
- `viewport={{ once: true }}` para evitar re-animaciones
- Delays escalonados (`delay: index * 0.1`)
- Hover effects (`whileHover`, `whileTap`)
- AnimatePresence para FAQ acordeón

### Patrón común:
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6 }}
>
  {/* Contenido */}
</motion.div>
```

## 📊 Datos Mockeados

Todo en `mockData.ts`:
- ✅ Tipado completo con TypeScript
- ✅ Sin llamadas a Firebase
- ✅ Arrays fácilmente modificables

### Tipos disponibles:
- `Logo` - Logos de empresas
- `Feature` - Funcionalidades (6)
- `Segment` - Servicios/Productos (4)
- `Step` - Pasos del proceso (3)
- `Testimonial` - Testimonios (3)
- `FAQ` - Preguntas (6)

## 🎨 Paleta de Colores

Gradientes Tailwind usados:
- `from-indigo-600 to-purple-600` - Principal
- `from-blue-500 to-indigo-600` - Features
- `from-purple-500 to-pink-600` - Destacados
- `from-green-500 to-teal-600` - Success
- `from-orange-500 to-red-600` - Llamativos

## 🚀 Uso

### Página completa:
```tsx
import { LandingPage } from './pages/LandingPage';

// En tu router
<Route path="/" element={<LandingPage />} />
```

### Componentes individuales:
```tsx
import { Hero, Features, FAQ } from './components/marketing';

function CustomPage() {
  return (
    <>
      <Hero />
      <Features />
      <FAQ />
    </>
  );
}
```

## 🔧 Personalización

### Cambiar datos:
Edita `mockData.ts` y modifica los arrays:

```typescript
export const features: Feature[] = [
  {
    id: '1',
    icon: '🚀',
    title: 'Tu Título',
    description: 'Tu descripción',
    color: 'from-blue-500 to-indigo-600'
  },
  // ...
];
```

### Cambiar colores:
Busca las clases de Tailwind en cada componente:

```tsx
className="bg-gradient-to-r from-indigo-600 to-purple-600"
```

### Cambiar animaciones:
Ajusta los valores en `transition`:

```tsx
transition={{ duration: 0.6, delay: 0.2 }}
```

## 📱 Responsive

Todos los componentes son completamente responsive:
- Mobile: 1 columna
- Tablet: 2 columnas
- Desktop: 3 columnas (donde aplica)

Breakpoints Tailwind:
- `sm:` - 640px
- `md:` - 768px
- `lg:` - 1024px

## ✅ Características

- ✅ Totalmente tipado con TypeScript
- ✅ Sin llamadas a Firebase
- ✅ Animaciones sutiles y performantes
- ✅ Responsive design
- ✅ Componentizado y modular
- ✅ Fácil personalización
- ✅ Accesible (semántica HTML correcta)
- ✅ SEO friendly

## 🎯 Rutas configuradas

- `/` - Landing Page completa
- `/request-access` - Solicitar acceso (existente)
- `/features` - Página de planes y funcionalidades

## 📦 Dependencias

Ya instaladas en el proyecto:
- `react` ^18.3.1
- `react-router-dom` ^6.28.0
- `framer-motion` ^12.23.25
- `tailwindcss` ^3.4.15

## 🎨 Imágenes Placeholder

- Logos: `via.placeholder.com`
- Avatares: `pravatar.cc`

Para producción, reemplaza con tus propias imágenes.

## 📝 Notas

- El footer está incluido en `LandingPage.tsx`
- Los CTAs redirigen a `/request-access` y `/features`
- Todas las animaciones usan `viewport={{ once: true }}` para mejor performance
- Los gradientes están optimizados para accesibilidad (contraste WCAG AA+)

