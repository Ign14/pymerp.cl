# Ejemplos de Uso - Componentes Marketing

## 🚀 Implementación Rápida

### 1. Landing Page Completa (Recomendado)

```tsx
// src/pages/LandingPage.tsx
import { 
  Navbar, Hero, LogoCloud, Features, 
  Segmentation, HowItWorks, Testimonials, 
  FAQ, CTASection 
} from '../components/marketing';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div id="hero"><Hero /></div>
      <LogoCloud />
      <div id="features"><Features /></div>
      <div id="segmentation"><Segmentation /></div>
      <HowItWorks />
      <div id="testimonials"><Testimonials /></div>
      <div id="faq"><FAQ /></div>
      <CTASection />
    </div>
  );
};
```

### 2. Landing Minimalista

```tsx
import { Navbar, Hero, Features, CTASection } from '../components/marketing';

export const SimpleLanding = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <CTASection />
    </>
  );
};
```

### 3. Página de Producto

```tsx
import { Navbar, Hero, Features, Testimonials } from '../components/marketing';

export const ProductPage = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <Testimonials />
      {/* Tu contenido específico del producto */}
    </>
  );
};
```

## 🎨 Personalización de Datos

### Cambiar Features

```tsx
// src/components/marketing/mockData.ts
export const features: Feature[] = [
  {
    id: '1',
    icon: '🎯', // Cambiar emoji
    title: 'Tu Título Personalizado',
    description: 'Descripción adaptada a tu negocio',
    color: 'from-blue-500 to-indigo-600' // Cambiar gradiente
  },
  // ... más features
];
```

### Cambiar Testimonios

```tsx
export const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Juan Pérez',
    role: 'CEO',
    company: 'Tu Empresa SRL',
    avatar: 'https://tu-cdn.com/avatar.jpg', // URL personalizada
    content: 'Testimonio real de tu cliente...',
    rating: 5
  },
  // ... más testimonios
];
```

### Cambiar FAQs

```tsx
export const faqs: FAQ[] = [
  {
    id: '1',
    question: '¿Tu pregunta específica?',
    answer: 'Tu respuesta detallada aquí...'
  },
  // ... más preguntas
];
```

## 🎭 Personalización de Animaciones

### Ajustar Velocidad

```tsx
// Más lento
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 1.2 }} // default: 0.6
>

// Más rápido
<motion.div
  transition={{ duration: 0.3 }}
>
```

### Ajustar Delays

```tsx
// Delay más largo entre elementos
{items.map((item, index) => (
  <motion.div
    key={item.id}
    transition={{ 
      duration: 0.6, 
      delay: index * 0.2 // default: 0.1
    }}
  >
```

### Desactivar Animaciones

```tsx
// Sin animación de entrada
<motion.div
  initial={{ opacity: 1, y: 0 }}
  animate={{ opacity: 1, y: 0 }}
>
  {/* Contenido sin animación */}
</motion.div>

// O simplemente usa un div normal
<div>
  {/* Sin Framer Motion */}
</div>
```

## 🎨 Personalización de Estilos

### Cambiar Paleta de Colores

```tsx
// Hero.tsx - Cambiar gradiente principal
className="bg-gradient-to-r from-emerald-600 to-teal-600"

// Features.tsx - Cambiar color de cards
{
  id: '1',
  color: 'from-rose-500 to-pink-600' // Tu gradiente
}
```

### Cambiar Espaciado

```tsx
// Menos espacio vertical
<section className="py-12"> // default: py-24

// Más espacio
<section className="py-32">
```

### Cambiar Tipografía

```tsx
// Título más grande
<h1 className="text-7xl"> // default: text-5xl

// Texto más pequeño
<p className="text-base"> // default: text-xl
```

## 🔧 Componentes Individuales

### Solo Hero sin Navbar

```tsx
import { Hero } from '../components/marketing';

function MyPage() {
  return (
    <div>
      {/* Tu navbar personalizado */}
      <Hero />
    </div>
  );
}
```

### Features con Datos Personalizados

```tsx
import { motion } from 'framer-motion';

const myFeatures = [
  { id: '1', title: 'Feature 1', /* ... */ },
  { id: '2', title: 'Feature 2', /* ... */ }
];

function CustomFeatures() {
  return (
    <section className="py-24">
      <div className="grid grid-cols-3 gap-8">
        {myFeatures.map((feature, index) => (
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {/* Tu diseño personalizado */}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
```

### FAQ con Datos Externos

```tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function CustomFAQ({ faqs }: { faqs: FAQ[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {faqs.map((faq) => (
        <motion.div key={faq.id}>
          <button onClick={() => setOpenId(openId === faq.id ? null : faq.id)}>
            {faq.question}
          </button>
          <AnimatePresence>
            {openId === faq.id && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
              >
                {faq.answer}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}
```

## 🌐 Integración con i18n

```tsx
import { useTranslation } from 'react-i18next';

function TranslatedHero() {
  const { t } = useTranslation();

  return (
    <section>
      <h1>{t('hero.title')}</h1>
      <p>{t('hero.subtitle')}</p>
      {/* ... */}
    </section>
  );
}
```

## 📱 Layouts Alternativos

### Features en 2 Columnas

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
  {/* Solo muestra 4 features */}
</div>
```

### Testimonios en Carrusel

```tsx
// Instalar: npm install swiper
import { Swiper, SwiperSlide } from 'swiper/react';

<Swiper spaceBetween={32} slidesPerView={1}>
  {testimonials.map((testimonial) => (
    <SwiperSlide key={testimonial.id}>
      {/* Card de testimonio */}
    </SwiperSlide>
  ))}
</Swiper>
```

## 🔗 Navegación Personalizada

### Scroll Suave a Sección

```tsx
const scrollToSection = (id: string) => {
  const element = document.getElementById(id);
  element?.scrollIntoView({ 
    behavior: 'smooth', 
    block: 'start' 
  });
};

<button onClick={() => scrollToSection('features')}>
  Ver Features
</button>
```

### Navegación con Offset (para navbar fixed)

```tsx
const scrollWithOffset = (id: string) => {
  const element = document.getElementById(id);
  const offset = 80; // altura del navbar
  const elementPosition = element?.getBoundingClientRect().top ?? 0;
  const offsetPosition = elementPosition + window.pageYOffset - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
};
```

## 🎯 CTAs Personalizados

### Cambiar Rutas de los Botones

```tsx
// Hero.tsx
<button onClick={() => navigate('/tu-ruta-personalizada')}>
  Tu CTA Text
</button>

// CTASection.tsx
<button onClick={() => window.open('https://calendly.com/tu-usuario')}>
  Agendar Demo
</button>
```

### Agregar Analytics

```tsx
import { trackEvent } from './analytics';

<button 
  onClick={() => {
    trackEvent('cta_clicked', { section: 'hero' });
    navigate('/request-access');
  }}
>
  Comenzar Gratis
</button>
```

## 🎨 Temas Oscuros

```tsx
// Agregar clases de dark mode
<section className="py-24 bg-white dark:bg-gray-900">
  <h2 className="text-gray-900 dark:text-white">
    Título
  </h2>
  <p className="text-gray-600 dark:text-gray-300">
    Descripción
  </p>
</section>
```

## 📊 Integrar con CMS

```tsx
import { useEffect, useState } from 'react';
import { Hero, Features } from '../components/marketing';
import type { Feature } from '../components/marketing';

function DynamicLanding() {
  const [features, setFeatures] = useState<Feature[]>([]);

  useEffect(() => {
    // Fetch desde tu CMS
    fetch('/api/features')
      .then(res => res.json())
      .then(setFeatures);
  }, []);

  return (
    <>
      <Hero />
      {/* Pasar datos dinámicos a Features */}
      <FeaturesWithData features={features} />
    </>
  );
}
```

## 🚀 Optimización de Performance

### Lazy Loading de Secciones

```tsx
import { lazy, Suspense } from 'react';

const Testimonials = lazy(() => import('../components/marketing/Testimonials'));

function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <Suspense fallback={<div>Cargando...</div>}>
        <Testimonials />
      </Suspense>
    </>
  );
}
```

### Reducir Motion para Usuarios con Preferencias

```tsx
import { useReducedMotion } from 'framer-motion';

function AnimatedComponent() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Contenido */}
    </motion.div>
  );
}
```

## 📦 Exportar como Biblioteca

```tsx
// package.json
{
  "exports": {
    "./marketing": "./src/components/marketing/index.ts"
  }
}

// Uso en otro proyecto
import { Hero, Features } from '@tu-empresa/components/marketing';
```

## 🎬 Videos en Background

```tsx
// Hero.tsx - agregar video de fondo
<section className="relative">
  <video 
    autoPlay 
    loop 
    muted 
    className="absolute inset-0 w-full h-full object-cover opacity-20"
  >
    <source src="/hero-video.mp4" type="video/mp4" />
  </video>
  <div className="relative z-10">
    {/* Contenido del hero */}
  </div>
</section>
```

## 🔍 SEO Meta Tags

```tsx
import { Helmet } from 'react-helmet-async';

function LandingPage() {
  return (
    <>
      <Helmet>
        <title>Tu Producto | Landing Page</title>
        <meta name="description" content="Descripción optimizada para SEO" />
        <meta property="og:title" content="Tu Producto" />
        <meta property="og:description" content="..." />
        <meta property="og:image" content="/og-image.jpg" />
      </Helmet>
      <Hero />
      {/* ... */}
    </>
  );
}
```

