import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Global Setup - Se ejecuta UNA VEZ antes de todos los tests
 * 
 * Útil para:
 * - Crear directorios de resultados
 * - Setup de base de datos de prueba
 * - Autenticación global
 * - Verificar que el servidor está corriendo
 */

async function globalSetup(config: FullConfig) {
  console.log('🚀 Iniciando Playwright Global Setup...\n');

  // Crear directorios necesarios
  const dirs = [
    'test-results',
    'test-results/screenshots',
    'test-results/debug',
    'test-results/traces',
    'playwright-report',
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✓ Creado directorio: ${dir}`);
    }
  });

  // Verificar que el servidor de desarrollo está corriendo
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:5173';
  
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    console.log(`\n🔍 Verificando servidor en ${baseURL}...`);
    await page.goto(baseURL, { timeout: 5000 });
    
    console.log('✓ Servidor respondiendo correctamente\n');
    
    await browser.close();
  } catch (error) {
    console.error(`❌ Error: Servidor no responde en ${baseURL}`);
    console.error('   Asegúrate de que el servidor está corriendo: npm run dev\n');
    throw error;
  }

  // Limpiar screenshots antiguos (opcional)
  const screenshotsDir = 'test-results/screenshots';
  if (fs.existsSync(screenshotsDir)) {
    const files = fs.readdirSync(screenshotsDir);
    const oldFiles = files.filter(f => {
      const stat = fs.statSync(path.join(screenshotsDir, f));
      const dayInMs = 24 * 60 * 60 * 1000;
      return Date.now() - stat.mtime.getTime() > 7 * dayInMs; // > 7 días
    });
    
    oldFiles.forEach(f => {
      fs.unlinkSync(path.join(screenshotsDir, f));
    });
    
    if (oldFiles.length > 0) {
      console.log(`🗑️  Limpiados ${oldFiles.length} screenshots antiguos`);
    }
  }

  console.log('✅ Global Setup completado\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

export default globalSetup;

