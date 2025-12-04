/**
 * Playwright Test Configuration Override
 * 
 * Este archivo permite configuraciones específicas
 * sin modificar playwright.config.ts
 */

import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  // Deshabilitar PWA prompts durante tests
  use: {
    // Simular que la app ya está instalada
    userAgent: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36 (PWA-Test)',
    
    // Viewport consistente
    viewport: { width: 1280, height: 720 },
    
    // Permisos mínimos
    permissions: [],
    
    // Context options para tests más estables
    contextOptions: {
      reducedMotion: 'reduce',  // Deshabilitar animaciones
    },
  },
};

export default config;

