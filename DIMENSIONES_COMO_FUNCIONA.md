# Dimensiones exactas - Sección "Cómo Funciona"

## 📐 Dimensiones del Contenedor

### Ancho máximo:
- **Contenedor interno**: `max-w-7xl` = **1280px** (Tailwind CSS)
- **Padding horizontal**: 
  - Mobile: `px-4` = **16px** (cada lado)
  - Tablet: `px-6` = **24px** (cada lado)
  - Desktop: `px-8` = **32px** (cada lado)
- **Ancho útil del contenido** (desktop):
  - 1280px - (32px × 2) = **1216px**

### Ancho del viewport (considerar para imagen de fondo):
- **Mobile**: 375px - 640px (iPhone, Android pequeños)
- **Tablet**: 640px - 1024px (iPad, tablets)
- **Desktop**: 1024px - 1920px (más común), hasta 2560px (2K) y 3840px (4K)

## 📏 Altura de la Sección

### Padding vertical:
- **Mobile**: `py-12` = **48px** (arriba y abajo) = **96px total**
- **Tablet**: `py-16` = **64px** (arriba y abajo) = **128px total**
- **Desktop**: `py-20` = **80px** (arriba y abajo) = **160px total**

### Contenido interno:

**Header** (título + subtítulo):
- Título: `text-3xl md:text-4xl lg:text-5xl` ≈ **60px - 72px** de altura
- Subtítulo: `text-lg md:text-xl` ≈ **28px - 32px** de altura
- Margin bottom: `mb-12` = **48px**
- **Total header**: ≈ **180px - 190px**

**Grid de cards** (3 StepCards en desktop):
- **StepCard**: `max-w-sm` = **384px** de ancho máximo
- **Padding interno**: `p-8 md:p-10` = **32px / 40px**
- **Altura estimada por card**:
  - Badge número: 56px (w-14 h-14) + margin: 24px (mb-6) = **80px**
  - Icono: 80px - 96px (w-20 md:w-24) + margin: 20px (mb-5) = **100px - 116px**
  - Título: ~30px - 40px + margin: 12px (mb-3) = **42px - 52px**
  - Descripción: ~60px - 80px (líneas de texto)
  - Padding vertical: 40px × 2 = **80px**
  - **Total por card**: ≈ **362px - 428px**

**Espaciado entre cards**:
- Mobile: `gap-8` = **32px** (solo vertical, 1 columna)
- Desktop: `gap-8 lg:gap-12` = **32px / 48px** (horizontal y vertical)

### Altura total estimada:

**Mobile** (1 columna):
- Padding: 96px
- Header: ~190px
- Cards: 428px × 3 = 1284px
- Gaps: 32px × 2 = 64px
- **Total**: ≈ **1634px**

**Desktop** (3 columnas):
- Padding: 160px
- Header: ~190px
- Card (más alta): ~428px
- **Total**: ≈ **778px**

## 🖼️ Dimensiones Recomendadas para Imagen de Fondo

### Opción 1: Imagen optimizada para desktop (recomendada)
- **Ancho**: **1920px** (Full HD - el tamaño más común)
- **Alto**: **900px** (proporción 16:9)
- **Ratio**: 2.13:1 (ligeramente más ancha que 16:9)

### Opción 2: Imagen para pantallas grandes
- **Ancho**: **2560px** (2K - pantallas grandes)
- **Alto**: **1200px** 
- **Ratio**: 2.13:1

### Opción 3: Imagen ultra alta resolución
- **Ancho**: **3840px** (4K)
- **Alto**: **1800px**
- **Ratio**: 2.13:1

## 📱 Consideraciones Responsive

La sección usa `object-cover` que recorta la imagen para mantener la proporción. Para mejores resultados:

1. **Área importante**: Coloca el contenido importante (centro de la imagen) en el centro horizontal y entre el 20% y 80% vertical
2. **Proporción 16:9 o 21:9**: Funciona bien para `object-cover`
3. **Resolución múltiple**: Considera crear versiones @2x y @3x para pantallas Retina

## ✅ Dimensiones Finales Recomendadas

**Para una imagen de fondo óptima:**
- **Dimensiones**: **1920px × 900px** o **2560px × 1200px**
- **Proporción**: **16:9** o **21:9** (ligeramente más ancha)
- **Formato**: PNG (si tiene transparencia) o WebP (mejor compresión)
- **Peso objetivo**: < 500KB (optimizada)

**Nota**: La imagen se escalará automáticamente con `object-cover` para cubrir toda la sección sin distorsión.

