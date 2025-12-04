# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.0.0] - 2025-12-XX

### 🎉 Lanzamiento Inicial

Primera versión estable de PYM-ERP (AgendaWeb), plataforma SaaS para emprendedores.

### ✨ Added

#### Autenticación y Usuarios
- Sistema de autenticación con Firebase Auth (Email/Password)
- Roles de usuario: SUPERADMIN y ENTREPRENEUR
- Estados de usuario: ACTIVE, INACTIVE, FORCE_PASSWORD_CHANGE
- Cambio de contraseña forzado en primer login
- Sistema de solicitudes de acceso con aprobación manual
- Custom claims de Firebase para control de acceso a nivel de empresa
- Protección de rutas basada en roles y estado

#### Gestión de Empresas
- CRUD completo de empresas con propietario asignado
- Configuración de tipo de negocio (SERVICES o PRODUCTS)
- Sistema de slugs únicos para páginas públicas
- Integración con Google Maps para ubicación
- Soporte para múltiples planes (BASIC, STANDARD, PRO)
- Wizard de configuración inicial con 4 pasos:
  - Tipo de negocio
  - Información básica
  - Información de contacto
  - Ubicación geográfica

#### Apariencia Personalizable
- Upload de logos y banners con redimensionamiento automático
- Selector de colores primario y secundario
- Selector de fuentes (títulos y cuerpo)
- Preview en tiempo real de cambios
- Compresión automática de imágenes para optimización

#### Gestión de Servicios
- CRUD completo de servicios
- Campos: nombre, descripción, precio, duración
- Estado activo/inactivo
- Ordenamiento drag-and-drop
- Horarios de atención configurables por día
- Bloques horarios personalizables

#### Gestión de Productos
- CRUD completo de productos
- Campos: nombre, descripción, precio, stock, categoría
- Upload de imágenes de productos
- Estado activo/inactivo
- Control de inventario

#### Páginas Públicas
- Página pública personalizada por empresa (/{slug})
- Diseño adaptado al tipo de negocio (servicios/productos)
- Catálogo de servicios con precios y duración
- Catálogo de productos con imágenes y stock
- Botón de contacto por WhatsApp
- Diseño responsive (mobile-first)
- Aplicación de estilos personalizados (colores, fuentes)

#### Analytics
- Integración con Google Analytics 4
- Tracking de eventos personalizados:
  - PAGE_VIEW: Vistas de página pública
  - WHATSAPP_CLICK: Clicks en botón WhatsApp
  - SERVICE_BOOK_CLICK: Clicks en agendar servicio
  - PRODUCT_ORDER_CLICK: Clicks en ordenar producto
- Dashboard de analytics con métricas clave
- Almacenamiento de eventos en Firestore para análisis histórico
- Web Vitals tracking para performance monitoring

#### Internacionalización (i18n)
- Soporte completo para Español e Inglés
- Selector de idioma persistente en localStorage
- Traducciones para:
  - Interfaz de usuario completa
  - Mensajes de error
  - Emails transaccionales
  - Páginas públicas
  - Documentación
- Detección automática del idioma del navegador
- 100% de las cadenas traducidas

#### Emails Transaccionales
- Integración con SendGrid
- Email de notificación de nueva solicitud (admin)
- Email de bienvenida con credenciales (usuario)
- Soporte multiidioma en emails
- Templates HTML responsivos
- Manejo de errores graceful (no bloquea operaciones)

#### Monitoreo y Logging
- Integración con Sentry para error tracking
- Sistema de logging personalizado con niveles:
  - error: Errores críticos
  - warn: Advertencias
  - info: Información general
  - success: Operaciones exitosas
- Logs en consola con colores para desarrollo
- Captura de errores de React con Error Boundary

#### Testing
- Testing unitario con Vitest
- Testing E2E con Playwright
- Modo E2E con datos mock para testing sin Firebase
- Usuarios de prueba preconfigur ados:
  - admin@test.com (SUPERADMIN)
  - entrepreneur@test.com (ENTREPRENEUR)
- Cobertura mínima configurada
- Scripts para testing en diferentes modos

#### Infraestructura
- Firebase Hosting con configuración de SPA
- Cloud Functions en Node.js 20
- Firestore con reglas de seguridad estrictas
- Storage con reglas de seguridad por carpeta
- Soporte para múltiples entornos (dev, staging, prod)
- Deploy selectivo por servicio
- CI/CD ready con Firebase CLI

#### Developer Experience
- Hot Module Replacement (HMR) con Vite
- TypeScript 5.5 con configuración estricta
- ESLint para linting
- Tailwind CSS para estilos
- Framer Motion para animaciones
- Organización modular del código
- Documentación completa
- Scripts npm bien definidos

### 🔒 Security

- Reglas de seguridad de Firestore por colección
- Validación de permisos basada en roles
- Custom claims para autorización a nivel de empresa
- Reglas de Storage con límites de tamaño (5MB)
- Validación de tipos de archivo permitidos
- Protección contra CSRF en Cloud Functions
- Sanitización de inputs del usuario
- Rate limiting en emails (pendiente)

### 📚 Documentation

- README.md completo con setup y deploy
- CONTRIBUTING.md con guidelines detalladas
- docs/ARCHITECTURE.md con diagramas del sistema
- docs/API.md con documentación de servicios
- JSDoc en funciones complejas
- Comentarios inline en código crítico
- Guías de troubleshooting
- Documentación de analytics, PWA, i18n

### 🎨 UI/UX

- Diseño modern o con Tailwind CSS
- Tema claro/oscuro con toggle
- Animaciones suaves con Framer Motion
- Toasts para feedback de acciones
- Loading states en operaciones async
- Validación de formularios en tiempo real
- Mensajes de error descriptivos
- Responsive design (mobile-first)
- Accesibilidad básica (pendiente mejoras)

### ⚡ Performance

- Vite para builds ultra-rápidos
- Code splitting automático
- Lazy loading de rutas
- Optimización de imágenes automática
- Compresión de assets
- CDN de Firebase Hosting
- Service Workers para PWA (configurado)

---

## [Unreleased]

### 🔄 En Desarrollo

#### Features Planificados
- [ ] Sistema de reservas/citas online
- [ ] Carrito de compras para productos
- [ ] Integración con pasarelas de pago
- [ ] Notificaciones push
- [ ] Chat en vivo
- [ ] Sistema de reviews/calificaciones
- [ ] Generación de reportes PDF
- [ ] Exportación de datos (CSV/Excel)
- [ ] API REST pública
- [ ] Webhooks para integraciones

#### Mejoras Pendientes
- [ ] Migrar a React 19
- [ ] Implementar Server Components (cuando Vite soporte)
- [ ] Mejorar accesibilidad (WCAG 2.1 AA)
- [ ] Rate limiting en Cloud Functions
- [ ] Cache de queries Firestore
- [ ] Optimización de imágenes WebP
- [ ] Lazy loading de componentes pesados
- [ ] Prefetching de datos
- [ ] Skeleton loaders

#### Bugs Conocidos
- [ ] Delay en actualización de custom claims (requiere logout/login)
- [ ] Map no se centra correctamente en mobile en algunos casos
- [ ] Selector de fecha no respeta idioma en algunos navegadores
- [ ] Preview de imágenes no funciona en Safari < 15

---

## Tipos de Cambios

- **Added**: Nuevas funcionalidades
- **Changed**: Cambios en funcionalidades existentes
- **Deprecated**: Funcionalidades obsoletas que se eliminarán
- **Removed**: Funcionalidades eliminadas
- **Fixed**: Corrección de bugs
- **Security**: Cambios relacionados con seguridad

---

## Notas de Versionado

Este proyecto sigue [Semantic Versioning](https://semver.org/lang/es/):

- **MAJOR** (1.x.x): Cambios incompatibles con la API anterior
- **MINOR** (x.1.x): Nuevas funcionalidades compatibles con versiones anteriores
- **PATCH** (x.x.1): Correcciones de bugs compatibles

---

## Contribuir al Changelog

Al crear un PR, actualiza este archivo en la sección `[Unreleased]` siguiendo el formato:

```markdown
### Added
- Nueva funcionalidad con descripción breve (#123)

### Fixed
- Corrección de bug específico (#124)
```

Los mantenedores moverán los cambios a la versión correspondiente al hacer release.

---

**Última actualización:** Diciembre 2025
