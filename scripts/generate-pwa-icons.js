#!/usr/bin/env node

/**
 * Script para generar iconos PWA en todas las resoluciones necesarias
 * 
 * Uso:
 * 1. Coloca tu logo en public/logo-source.png (1024x1024 recomendado)
 * 2. npm install -D sharp (si no está instalado)
 * 3. node scripts/generate-pwa-icons.js
 */

const fs = require('fs');
const path = require('path');

// Verificar si sharp está disponible
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ Sharp no está instalado. Por favor instala con: npm install -D sharp');
  process.exit(1);
}

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const SOURCE_IMAGE = path.join(PUBLIC_DIR, 'logo-source.png');

// Resoluciones necesarias para PWA
const ICON_SIZES = [
  { size: 192, name: 'pwa-icon-192.png', purpose: 'any maskable' },
  { size: 512, name: 'pwa-icon-512.png', purpose: 'any maskable' },
  { size: 180, name: 'apple-touch-icon.png', purpose: 'any' },
  { size: 32, name: 'favicon-32x32.png', purpose: 'any' },
  { size: 16, name: 'favicon-16x16.png', purpose: 'any' },
];

// Verificar que existe la imagen fuente
if (!fs.existsSync(SOURCE_IMAGE)) {
  console.error(`❌ No se encontró ${SOURCE_IMAGE}`);
  console.log(`
📝 Instrucciones:
1. Crea o coloca tu logo en: public/logo-source.png
2. Tamaño recomendado: 1024x1024 pixels
3. Formato: PNG con fondo transparente o sólido
4. Vuelve a ejecutar este script
  `);
  process.exit(1);
}

console.log('🎨 Generando iconos PWA...\n');

// Función para generar un icono
async function generateIcon({ size, name, purpose }) {
  try {
    const outputPath = path.join(PUBLIC_DIR, name);
    
    await sharp(SOURCE_IMAGE)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    
    console.log(`✅ ${name} (${size}x${size}) - ${purpose}`);
  } catch (error) {
    console.error(`❌ Error generando ${name}:`, error.message);
  }
}

// Generar todos los iconos
async function generateAllIcons() {
  for (const iconConfig of ICON_SIZES) {
    await generateIcon(iconConfig);
  }
  
  console.log('\n🎉 ¡Todos los iconos generados exitosamente!');
  console.log(`
📁 Iconos generados en: public/
  - pwa-icon-192.png
  - pwa-icon-512.png
  - apple-touch-icon.png
  - favicon-32x32.png
  - favicon-16x16.png

🔄 Próximo paso:
  npm run build
  `);
}

generateAllIcons().catch(console.error);

