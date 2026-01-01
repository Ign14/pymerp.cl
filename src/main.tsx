import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import './index.css'
import './styles/marquee.css'
import './styles/background-optimization.css'
import './styles/horizontal-carousel.css'
import { ThemeProvider } from './contexts/ThemeContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { initSentry } from './config/sentry'
import { initGA } from './config/analytics'
import { initWebVitals } from './config/webVitals'
import './config/i18n' // Inicializar i18next

// Inicializar Sentry antes de renderizar la app
initSentry();

// Inicializar Google Analytics 4
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
if (GA_MEASUREMENT_ID) {
  initGA(GA_MEASUREMENT_ID);
}

// Inicializar Web Vitals tracking
initWebVitals();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <LanguageProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </LanguageProvider>
    </HelmetProvider>
  </React.StrictMode>,
)
