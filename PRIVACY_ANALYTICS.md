# Configuración de Privacidad y Analytics

## 📊 Google Analytics 4

### Configuración Actual

- **Measurement ID:** `G-58V5RL01MF`
- **Estado en desarrollo:** ❌ DESHABILITADO (para evitar tracking en localhost)
- **Estado en producción:** ✅ HABILITADO
- **Anonimización de IP:** ✅ Activa
- **Cookies:** SameSite=None;Secure, expiración 2 años

### Variables de Entorno

#### `.env` (Desarrollo - localhost)
```bash
VITE_GA_MEASUREMENT_ID=G-58V5RL01MF
VITE_GA_DEBUG=false
VITE_ENABLE_ANALYTICS=false  # ❌ DESHABILITADO en desarrollo
```

#### `.env.production` (Producción)
```bash
VITE_GA_MEASUREMENT_ID=G-58V5RL01MF
VITE_GA_DEBUG=false
VITE_ENABLE_ANALYTICS=true  # ✅ HABILITADO en producción
```

---

## 🔒 Medidas de Privacidad Implementadas

### 1. **Anonimización de IP**
Todas las IPs de usuarios son anonimizadas antes de ser enviadas a Google Analytics.

### 2. **Consentimiento de Cookies**
El componente `CookieConsent` permite a los usuarios:
- Aceptar o rechazar cookies analíticas
- Ver política de privacidad
- Configurar preferencias en cualquier momento

### 3. **Deshabilitado en Desarrollo**
GA no rastrea actividad en `localhost` para evitar:
- Datos de desarrollo en producción
- Tracking de formularios de prueba
- Contaminación de métricas reales

### 4. **Cookies Seguras**
- **SameSite=None:** Solo permite cookies en contextos seguros
- **Secure:** Solo transmite cookies por HTTPS
- **Expiración:** 2 años (configurable)

---

## 📈 Eventos Rastreados

### Eventos de Usuario
- `sign_up` - Registro de nuevo usuario
- `login` - Inicio de sesión
- `logout` - Cierre de sesión
- `profile_update` - Actualización de perfil

### Eventos de Navegación
- `page_view` - Vista de página
- `click` - Clics en elementos importantes
- `search` - Búsquedas

### Eventos de Conversión
- `whatsapp_click` - Clic en botón de WhatsApp
- `service_booking` - Reserva de servicio
- `product_order` - Orden de producto
- `contact_submit` - Envío de formulario de contacto

### Eventos de Negocio
- `service_create` - Creación de servicio
- `product_create` - Creación de producto
- `company_setup` - Configuración de empresa

---

## 🛡️ Content Security Policy (CSP)

La aplicación incluye CSP estricta que permite:
- Scripts de `www.googletagmanager.com` y `www.google-analytics.com`
- Conexiones a `*.google-analytics.com`
- Sin `unsafe-inline` o `unsafe-eval` innecesarios

Ver `vercel.json`, `public/_headers` y `src/utils/security.ts` para más detalles.

---

## 🚀 Deployment

### Verificar antes de desplegar

1. **Variables de producción configuradas:**
   ```bash
   VITE_ENABLE_ANALYTICS=true
   VITE_GA_MEASUREMENT_ID=G-58V5RL01MF
   ```

2. **CSP actualizado** (si cambió el Measurement ID)

3. **Cookie Consent visible** en producción

### Comandos

```bash
# Build con analytics habilitado (usa .env.production)
npm run build

# Preview del build de producción
npm run preview

# Deploy a Vercel
vercel --prod
```

---

## 📝 Cumplimiento Legal

### GDPR (Europa)
✅ Consentimiento explícito de cookies  
✅ Anonimización de IP  
✅ Política de privacidad accesible  
✅ Opción de rechazar tracking  

### CCPA (California)
✅ Divulgación de recopilación de datos  
✅ Opción de opt-out  
✅ No venta de datos personales  

### Ley de Protección de Datos (Chile)
✅ Información clara sobre recopilación  
✅ Consentimiento del usuario  
✅ Medidas de seguridad implementadas  

---

## 🔍 Testing

### Verificar que GA está deshabilitado en desarrollo
1. Abrir DevTools > Network
2. Filtrar por `google-analytics.com`
3. **No debería haber peticiones** a GA en localhost

### Verificar que GA está habilitado en producción
1. Desplegar a producción
2. Abrir DevTools > Network
3. **Debería haber peticiones** a `www.google-analytics.com/g/collect`
4. Verificar que aparece el banner de consentimiento

---

## 📞 Contacto y Soporte

Si necesitas ayuda con la configuración de analytics o privacidad:
- Revisa la documentación de GA4: https://support.google.com/analytics
- Consulta las políticas de privacidad vigentes
- Contacta al equipo de desarrollo

---

**Última actualización:** 4 de diciembre de 2025
