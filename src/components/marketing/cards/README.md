# Componentes Card Reutilizables

Componentes modulares y reutilizables para la landing page de marketing.

## 📦 Componentes Disponibles

### 1. FeatureCard

Card para mostrar funcionalidades con icono, título y descripción.

```tsx
import { FeatureCard } from './cards';

<FeatureCard
  icon="📅"
  title="Agenda Online"
  description="Sistema de reservas automático 24/7"
  color="from-blue-500 to-indigo-600"
  delay={0.1}
/>
```

**Props:**
- `icon` (string): Emoji o icono
- `title` (string): Título de la funcionalidad
- `description` (string): Descripción breve
- `color` (string, opcional): Gradiente Tailwind (default: `from-blue-500 to-indigo-600`)
- `delay` (number, opcional): Delay para animación (default: 0)

---

### 2. StepCard

Card para mostrar pasos de un proceso con número, icono y descripción.

```tsx
import { StepCard } from './cards';

<StepCard
  number={1}
  title="Crea tu emprendimiento"
  description="Registra tu negocio en 2 minutos"
  icon="🏪"
  delay={0.2}
  showArrow={true}
/>
```

**Props:**
- `number` (number): Número del paso
- `title` (string): Título del paso
- `description` (string): Descripción del paso
- `icon` (string): Emoji o icono
- `delay` (number, opcional): Delay para animación (default: 0)
- `showArrow` (boolean, opcional): Mostrar flecha en desktop (default: false)

---

### 3. SegmentCard

Card para mostrar segmentos de negocio con lista de características.

```tsx
import { SegmentCard } from './cards';

<SegmentCard
  title="Negocios de Servicios"
  description="Para peluquerías, spas, talleres..."
  features={[
    'Sistema de reservas online',
    'Gestión de horarios',
    'Recordatorios automáticos'
  ]}
  icon="📅"
  color="from-blue-600 to-indigo-700"
  delay={0.1}
  ctaText="Más Información"
  onCtaClick={() => navigate('/features')}
/>
```

**Props:**
- `title` (string): Título del segmento
- `description` (string): Descripción breve
- `features` (string[]): Lista de características
- `icon` (string): Emoji o icono
- `color` (string, opcional): Gradiente Tailwind (default: `from-blue-600 to-indigo-700`)
- `delay` (number, opcional): Delay para animación (default: 0)
- `ctaText` (string, opcional): Texto del botón (default: 'Más Información')
- `onCtaClick` (function, opcional): Handler del click en CTA

---

### 4. TestimonialCard

Card para mostrar testimonios de clientes con avatar, rating y contenido.

```tsx
import { TestimonialCard } from './cards';

<TestimonialCard
  name="María González"
  role="CEO"
  company="TechStart"
  content="Excelente plataforma..."
  avatar="https://example.com/avatar.jpg"
  rating={5}
  delay={0.1}
/>
```

**Props:**
- `name` (string): Nombre del cliente
- `role` (string): Rol o posición
- `company` (string): Nombre de la empresa
- `content` (string): Testimonio
- `avatar` (string, opcional): URL del avatar
- `rating` (number, opcional): Estrellas (default: 5)
- `delay` (number, opcional): Delay para animación (default: 0)

---

### 5. CTAButton

Botón reutilizable para llamadas a la acción.

```tsx
import { CTAButton } from './cards';

<CTAButton
  onClick={() => navigate('/request-access')}
  variant="primary"
  size="lg"
  ariaLabel="Solicitar acceso gratis"
>
  Solicitar acceso gratis →
</CTAButton>
```

**Props:**
- `children` (ReactNode): Contenido del botón
- `onClick` (function): Handler del click
- `variant` ('primary' | 'secondary' | 'outline', opcional): Estilo (default: 'primary')
- `size` ('sm' | 'md' | 'lg', opcional): Tamaño (default: 'md')
- `fullWidth` (boolean, opcional): Ancho completo (default: false)
- `ariaLabel` (string, opcional): Label de accesibilidad
- `disabled` (boolean, opcional): Deshabilitar botón (default: false)

**Variantes:**
- `primary`: Gradiente indigo a purple, texto blanco
- `secondary`: Fondo blanco, borde gris, texto gris
- `outline`: Transparente, borde blanco, texto blanco

**Tamaños:**
- `sm`: px-6 py-2 text-sm
- `md`: px-8 py-3 text-base
- `lg`: px-8 py-4 text-lg

---

## 🎨 Características

### Accesibilidad
- ✅ Roles ARIA apropiados (`article`, `button`)
- ✅ Labels descriptivos (`aria-label`, `aria-hidden`)
- ✅ Semantic HTML (`<article>`, `<blockquote>`, `<cite>`)
- ✅ Navegación por teclado
- ✅ Estados de focus visibles

### Animaciones
- ✅ Framer Motion para transiciones suaves
- ✅ Fade in + slide up al entrar en viewport
- ✅ Hover effects (scale, shadow)
- ✅ Delays escalonados configurables
- ✅ `viewport={{ once: true }}` para performance

### Responsive
- ✅ Mobile-first design
- ✅ Breakpoints: sm (640px), md (768px), lg (1024px)
- ✅ Padding y tamaños adaptables
- ✅ Grid responsive automático

### Tailwind Utility-First
- ✅ Clases utilitarias en lugar de CSS custom
- ✅ Gradientes con `bg-gradient-to-br`
- ✅ Sombras con `shadow-md`, `shadow-xl`
- ✅ Transiciones con `transition-all duration-300`

---

## 🔧 Uso en Componentes

### Features.tsx
```tsx
import { FeatureCard } from './cards';

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
  {features.map((feature, index) => (
    <FeatureCard
      key={feature.id}
      {...feature}
      delay={index * 0.1}
    />
  ))}
</div>
```

### HowItWorks.tsx
```tsx
import { StepCard } from './cards';

<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
  {steps.map((step, index) => (
    <StepCard
      key={step.number}
      {...step}
      delay={index * 0.2}
      showArrow={index < steps.length - 1}
    />
  ))}
</div>
```

### Segmentation.tsx
```tsx
import { SegmentCard } from './cards';

<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  {segments.map((segment, index) => (
    <SegmentCard
      key={segment.id}
      {...segment}
      delay={index * 0.1}
      onCtaClick={() => navigate('/features')}
    />
  ))}
</div>
```

---

## 📋 TypeScript Interfaces

Todas exportadas desde `./cards/index.ts`:

```tsx
export type { FeatureCardProps } from './FeatureCard';
export type { StepCardProps } from './StepCard';
export type { SegmentCardProps } from './SegmentCard';
export type { TestimonialCardProps } from './TestimonialCard';
export type { CTAButtonProps } from './CTAButton';
```

---

## 🎯 Principios de Diseño

1. **Sin lógica de negocio**: Solo presentación y animación
2. **Props simples**: Interfaces claras y minimalistas
3. **Composición**: Componentes pequeños y combinables
4. **Accesibles**: ARIA labels y semantic HTML
5. **Performance**: Animaciones optimizadas con `once: true`
6. **Responsive**: Mobile-first con breakpoints claros

---

## 🚀 Próximos Pasos

Para agregar nuevos componentes card:

1. Crear archivo en `/cards/NuevoCard.tsx`
2. Definir interface con TypeScript
3. Usar Framer Motion para animaciones
4. Agregar ARIA labels apropiados
5. Exportar desde `/cards/index.ts`
6. Documentar en este README

---

## 📦 Import/Export

```tsx
// Importar todo
import { 
  FeatureCard, 
  StepCard, 
  SegmentCard, 
  TestimonialCard,
  CTAButton 
} from './cards';

// Importar types
import type { 
  FeatureCardProps,
  StepCardProps 
} from './cards';
```

---

**Última actualización**: Diciembre 2024

