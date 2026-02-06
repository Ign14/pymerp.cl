import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Cargar .env desde la raíz del repo (mismo que dashboard) para Firebase y USE_FIRESTORE
const repoRoot = path.resolve(__dirname, '../../..');

export default defineConfig({
  plugins: [react()],
  envDir: repoRoot,
  server: {
    port: 5176
  }
});
