# 🇪🇺 GDPR Compliance Checklist - AgendaWeb

## General Data Protection Regulation (RGPD en Español)

---

## 📋 Resumen Ejecutivo

**Aplicabilidad:** ✅ Sí
- Procesa datos personales de ciudadanos UE/Chile
- Almacena información identificable
- Realiza tracking con Google Analytics

**Estado Actual:** ⚠️ Requiere implementaciones
**Objetivo:** 100% Cumplimiento GDPR

---

## 🎯 Principios GDPR

### 1. ✅ Lawfulness, Fairness, Transparency

**Requisito:** Procesar datos de forma legal, justa y transparente

**Implementación:**
- [ ] **Política de Privacidad** clara y accesible
- [ ] **Términos y Condiciones** visibles
- [ ] **Consentimiento explícito** antes de procesar datos
- [ ] **Información clara** sobre qué datos se recopilan

**Estado en AgendaWeb:**
- ✅ Existe `/privacidad` y `/terminos`
- ⚠️ Falta banner de cookies/consentimiento
- ⚠️ Falta explicación clara de datos recopilados

---

### 2. ✅ Purpose Limitation

**Requisito:** Datos solo para propósitos específicos y legítimos

**Checklist:**
- [ ] Definir propósitos claros para cada dato
- [ ] No usar datos para otros fines sin consentimiento
- [ ] Documentar uso de datos

**Datos Recopilados:**
| Dato | Propósito | Base Legal |
|------|-----------|------------|
| Email | Autenticación, comunicación | Consentimiento |
| Nombre | Identificación, contacto | Consentimiento |
| WhatsApp | Comunicación comercial | Consentimiento |
| Dirección | Geolocalización, servicios | Consentimiento |
| Datos de empresa | Funcionalidad de la app | Contractual |
| Analytics (GA4) | Mejorar servicio | Interés legítimo |

---

### 3. ✅ Data Minimisation

**Requisito:** Recopilar solo datos necesarios

**Checklist:**
- [ ] Revisar cada campo de formulario
- [ ] Remover campos innecesarios
- [ ] Hacer opcionales los no críticos

**Revisión de Forms:**
```typescript
// ✅ BIEN - Solo lo necesario
{
  name: required,
  email: required,
  whatsapp: required,
  business_name: required
}

// ❌ MAL - Datos innecesarios
{
  fecha_nacimiento: optional,  // ← No necesario
  dni: optional,               // ← No necesario
  direccion_personal: optional // ← No necesario
}
```

---

### 4. ✅ Accuracy

**Requisito:** Datos precisos y actualizados

**Implementación:**
- [ ] Permitir a usuarios actualizar sus datos
- [ ] Validar datos en cada actualización
- [ ] Opción de corregir información

**Estado:**
- ✅ Dashboard permite editar datos
- ✅ Validación en formularios
- ⚠️ Falta opción de eliminar cuenta

---

### 5. ✅ Storage Limitation

**Requisito:** No conservar datos más tiempo del necesario

**Implementación:**
- [ ] Definir períodos de retención
- [ ] Eliminar datos antiguos automáticamente
- [ ] Permitir eliminación de cuenta

**Períodos Recomendados:**
| Dato | Retención | Razón |
|------|-----------|-------|
| Usuarios activos | Indefinido | Servicio activo |
| Usuarios inactivos | 2 años | Recuperación |
| Logs de analytics | 26 meses | GA4 estándar |
| Datos de formularios | 30 días | Procesamiento |
| Backups | 30 días | Recuperación |

---

### 6. ✅ Integrity and Confidentiality

**Requisito:** Seguridad apropiada de datos

**Implementación:**
- [ ] Encriptación en tránsito (HTTPS)
- [ ] Encriptación en reposo (Firebase)
- [ ] Control de acceso
- [ ] Auditoría de seguridad

**Estado:**
- ✅ Firebase Auth (encriptado)
- ✅ Firestore (encriptado en reposo)
- ✅ HTTPS forzado (en producción)
- ⚠️ Falta: Encryption adicional para datos muy sensibles

---

### 7. ✅ Accountability

**Requisito:** Demostrar cumplimiento

**Implementación:**
- [ ] Documentación de procesos
- [ ] Registros de consentimiento
- [ ] Audit logs
- [ ] DPO (Data Protection Officer) si aplica

---

## 🍪 Cookie Consent

### Requisito GDPR

**Obligatorio:**
- Consentimiento ANTES de colocar cookies no esenciales
- Opción de rechazar cookies
- Explicación clara de cada tipo de cookie

**Cookies en AgendaWeb:**

| Cookie | Tipo | Propósito | Esencial |
|--------|------|-----------|----------|
| Firebase Auth | Primera parte | Autenticación | ✅ Sí |
| GA4 Cookies | Tercera parte | Analytics | ❌ No |
| PWA Cache | Primera parte | Funcionalidad | ✅ Sí |

**Fix Requerido:** ✅ Implementar banner de consentimiento

---

## 👤 Derechos del Usuario (GDPR)

### Derechos que DEBES implementar:

#### 1. ✅ Derecho de Acceso
**¿Qué?** Usuario puede solicitar copia de sus datos

**Implementación:**
```typescript
// Crear endpoint/función para exportar datos del usuario
export async function exportUserData(userId: string) {
  const user = await getUser(userId);
  const company = user.company_id ? await getCompany(user.company_id) : null;
  const services = company ? await getServices(company.id) : [];
  const products = company ? await getProducts(company.id) : [];
  
  return {
    user: {
      email: user.email,
      name: user.name,
      created_at: user.created_at,
      // ... todos los datos
    },
    company,
    services,
    products
  };
}
```

#### 2. ✅ Derecho de Rectificación
**¿Qué?** Usuario puede corregir datos incorrectos

**Estado:** ✅ Ya implementado (Dashboard de edición)

#### 3. ✅ Derecho al Olvido (Supresión)
**¿Qué?** Usuario puede solicitar eliminación de datos

**Implementación:**
```typescript
export async function deleteUserAccount(userId: string) {
  // 1. Eliminar datos de Firestore
  await deleteUser(userId);
  
  // 2. Eliminar archivos de Storage
  await deleteUserFiles(userId);
  
  // 3. Anonimizar en Analytics (no se puede eliminar)
  // GA4 retiene datos por 26 meses mínimo
  
  // 4. Eliminar cuenta de Firebase Auth
  await auth.currentUser?.delete();
  
  // 5. Limpiar cache local
  localStorage.clear();
  sessionStorage.clear();
}
```

#### 4. ✅ Derecho a la Portabilidad
**¿Qué?** Exportar datos en formato machine-readable

**Implementación:**
```typescript
export async function downloadUserData(userId: string) {
  const data = await exportUserData(userId);
  
  // Crear JSON
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  // Descargar
  const a = document.createElement('a');
  a.href = url;
  a.download = `agendaweb-data-${userId}-${Date.now()}.json`;
  a.click();
}
```

#### 5. ✅ Derecho de Oposición
**¿Qué?** Usuario puede oponerse al procesamiento

**Implementación:**
- [ ] Opt-out de marketing
- [ ] Opt-out de analytics
- [ ] Opt-out de cookies no esenciales

#### 6. ✅ Derecho a No ser Perfilado
**¿Qué?** No decisiones automatizadas sin consentimiento

**Estado:** ✅ No aplica (no hay perfilado automático)

---

## 📧 Datos Personales Procesados

### Categorías de Datos

**Datos de Identidad:**
- Nombre completo
- Email
- RUT (Chile)

**Datos de Contacto:**
- WhatsApp
- Teléfono
- Dirección de empresa

**Datos Técnicos:**
- IP address (Google Analytics)
- Browser type
- Device information
- Cookies

**Datos de Uso:**
- Page views
- Click events
- Time on page
- Scroll depth

---

## 🔐 Seguridad de Datos

### Medidas Técnicas

- ✅ **Encriptación en tránsito:** HTTPS
- ✅ **Encriptación en reposo:** Firebase (AES-256)
- ✅ **Control de acceso:** Firebase Auth + Firestore Rules
- ✅ **Backups:** Firebase automáticos
- ✅ **Monitoring:** Sentry error tracking
- ⚠️ **Logs de acceso:** Implementar

### Medidas Organizacionales

- [ ] Política de privacidad publicada
- [ ] Términos de servicio
- [ ] Proceso de eliminación de datos
- [ ] Formación del equipo en GDPR
- [ ] Registro de tratamientos
- [ ] Evaluación de impacto (si aplica)

---

## 🌍 Transferencias Internacionales

**Servicios de Terceros:**

| Servicio | Ubicación | Adecuación GDPR | Alternativa |
|----------|-----------|-----------------|-------------|
| Firebase | USA | ✅ Privacy Shield / SCCs | - |
| Google Analytics | USA | ✅ Con consentimiento | Plausible, Matomo |
| Sentry | USA | ✅ Privacy Shield | Self-hosted |
| Google Maps | USA | ✅ DPA disponible | OpenStreetMap |

**SCCs:** Standard Contractual Clauses (Firebase/Google las proporciona)

---

## 📄 Documentos Necesarios

### 1. Política de Privacidad

**Debe incluir:**
- Qué datos recopilamos
- Por qué los recopilamos
- Cómo los usamos
- Con quién los compartimos
- Cuánto tiempo los conservamos
- Derechos del usuario
- Cómo ejercer derechos
- Cómo contactarnos

**Estado:** ✅ Existe en `/privacidad`
**Acción:** Revisar y actualizar con info específica

### 2. Términos y Condiciones

**Estado:** ✅ Existe en `/terminos`

### 3. Política de Cookies

**Estado:** ⚠️ Crear
**Debe incluir:**
- Tipos de cookies usadas
- Propósito de cada una
- Duración
- Opt-out options

### 4. Aviso de Consentimiento

**Estado:** ⚠️ Implementar banner

---

## 🍪 Cookie Banner Required

### Implementar Componente

Ver `src/components/CookieConsent.tsx` (a crear)

**Requisitos:**
- ✅ Aparecer antes de colocar cookies
- ✅ Explicar qué cookies se usan
- ✅ Permitir aceptar/rechazar
- ✅ Permitir personalizar (esenciales/analytics/marketing)
- ✅ Recordar elección del usuario
- ✅ Fácil de revocar consentimiento

---

## 📊 Google Analytics & GDPR

### Configuración Necesaria

```typescript
// Inicializar GA4 solo con consentimiento
const initializeAnalytics = () => {
  if (hasUserConsent('analytics')) {
    initGA(env.analytics.measurementId);
  }
};

// Configurar GA4 con privacidad
ReactGA.initialize(measurementId, {
  gaOptions: {
    anonymize_ip: true,  // ✅ Ya implementado
    // ...
  }
});

// Google Consent Mode v2
gtag('consent', 'default', {
  'ad_storage': 'denied',
  'analytics_storage': 'denied',
  'personalization_storage': 'denied',
});

// Actualizar cuando usuario da consentimiento
gtag('consent', 'update', {
  'analytics_storage': 'granted'
});
```

---

## ✅ Checklist de Cumplimiento

### Transparencia
- [ ] Política de privacidad actualizada
- [ ] Política de cookies creada
- [ ] Banner de consentimiento implementado
- [ ] Información clara y accesible

### Consentimiento
- [ ] Consentimiento antes de cookies no esenciales
- [ ] Opción de rechazar sin consecuencias
- [ ] Granular (esenciales/analytics/marketing)
- [ ] Fácil de revocar

### Derechos de Usuario
- [ ] Acceso: Exportar datos
- [ ] Rectificación: Editar datos ✅
- [ ] Supresión: Eliminar cuenta
- [ ] Portabilidad: Descargar JSON
- [ ] Oposición: Opt-out analytics

### Seguridad
- [ ] Encriptación HTTPS ✅
- [ ] Firebase Auth ✅
- [ ] Firestore Rules ⚠️
- [ ] Security headers ⚠️
- [ ] Audit logs

### Transferencias
- [ ] Identificar todos los terceros
- [ ] Verificar SCCs/Privacy Shield
- [ ] Documentar transferencias
- [ ] Informar en política de privacidad

### Menores de Edad
- [ ] Verificación de edad (si aplica)
- [ ] Consentimiento parental (< 16 años)
- [ ] Protección especial

---

## 🚨 Multas GDPR

**Tier 1:** Hasta €10 millones o 2% revenue anual
- Violaciones de principios básicos
- Derechos del usuario

**Tier 2:** Hasta €20 millones o 4% revenue anual
- Violaciones de procesamiento
- Sin consentimiento

**Prevención:** ✅ Implementar todos los requisitos

---

## 📝 Template de Registro

### Registro de Actividades de Tratamiento

```markdown
## Tratamiento: Gestión de Usuarios

**Responsable:** [Nombre de la empresa]
**Contacto DPO:** [Email]

**Propósito:** Autenticación y gestión de usuarios

**Categorías de datos:**
- Datos de identidad (nombre, email)
- Datos de contacto (WhatsApp)
- Datos de empresa (RUT, nombre, dirección)

**Categorías de interesados:**
- Usuarios registrados
- Empresarios
- Clientes potenciales

**Destinatarios:**
- Firebase (Google Cloud) - Almacenamiento
- Google Analytics - Analytics
- Sentry - Error tracking

**Transferencias internacionales:**
- Firebase/Google: USA (Privacy Shield + SCCs)
- Sentry: USA (Privacy Shield)

**Plazos de supresión:**
- Usuarios activos: Mientras usen el servicio
- Usuarios inactivos: 2 años
- Solicitudes de acceso: 30 días tras procesamiento

**Medidas técnicas:**
- Encriptación HTTPS/TLS
- Firebase Auth
- Firestore Rules
- Backups cifrados
```

---

## 🔒 Medidas Técnicas Recomendadas

### 1. Pseudonimización

```typescript
// Usar IDs en lugar de datos identificables en logs
logger.info('User action', { 
  user_id: 'abc123',  // ✅ Pseudonimizado
  // NO: email: 'user@example.com'  ❌
});
```

### 2. Encriptación Adicional

```typescript
// Para datos muy sensibles
import CryptoJS from 'crypto-js';

const encrypt = (data: string, key: string) => {
  return CryptoJS.AES.encrypt(data, key).toString();
};

const decrypt = (encrypted: string, key: string) => {
  const bytes = CryptoJS.AES.decrypt(encrypted, key);
  return bytes.toString(CryptoJS.enc.Utf8);
};
```

### 3. Audit Logging

```typescript
// Registrar accesos a datos personales
const auditLog = async (action: string, userId: string, details: any) => {
  await createAuditLog({
    timestamp: new Date(),
    action,
    user_id: userId,
    details,
    ip_address: await getClientIP(),  // Anonimizar
  });
};
```

---

## 📧 Breach Notification

### Requisito GDPR

**72 horas** para notificar a autoridad de protección de datos

**Pasos:**
1. Detectar breach
2. Contener breach
3. Evaluar riesgo
4. Notificar a autoridad (72h)
5. Notificar a usuarios afectados
6. Documentar incident

**Template:**
```markdown
## Data Breach Notification

**Fecha del incident:** YYYY-MM-DD
**Detectado:** YYYY-MM-DD HH:MM

**Naturaleza del breach:**
- Tipo de datos afectados
- Número de usuarios afectados

**Consecuencias:**
- Riesgos para individuos

**Medidas tomadas:**
- Pasos para contener
- Pasos para mitigar

**Medidas preventivas:**
- Cambios implementados
```

---

## 🌐 Responsabilidades

### Data Controller (Controlador)
**AgendaWeb** es el controlador de datos

**Responsabilidades:**
- Determinar propósitos y medios
- Garantizar cumplimiento GDPR
- Implementar medidas técnicas
- Responder a solicitudes de usuarios

### Data Processors (Procesadores)
**Terceros que procesan datos:**
- Firebase/Google (almacenamiento)
- Google Analytics (analytics)
- Sentry (error tracking)
- SendGrid (si se usa para emails)

**Requisito:** DPA (Data Processing Agreement) con cada uno

---

## 📋 Action Items

### Críticos (Hacer Ya)
- [ ] Implementar Cookie Consent Banner
- [ ] Actualizar Política de Privacidad con datos específicos
- [ ] Crear Política de Cookies
- [ ] Implementar función de eliminar cuenta
- [ ] Configurar Google Consent Mode

### Importantes (Próximas 2 semanas)
- [ ] Implementar exportación de datos
- [ ] Crear proceso de supresión
- [ ] Audit logs básicos
- [ ] Revisar Firestore rules
- [ ] DPAs con procesadores

### Mejoras (Próximo mes)
- [ ] Evaluación de impacto (DPIA)
- [ ] Registro de tratamientos completo
- [ ] Formación del equipo
- [ ] Proceso de breach notification
- [ ] Revisar períodos de retención

---

## 📚 Recursos

### Documentación Oficial
- [GDPR Official Text](https://gdpr-info.eu/)
- [ICO GDPR Guide](https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/)
- [EDPB Guidelines](https://edpb.europa.eu/our-work-tools/general-guidance/gdpr-guidelines-recommendations-best-practices_en)

### Herramientas
- [Cookie Consent Solutions](https://www.cookiebot.com/)
- [Privacy Policy Generator](https://www.freeprivacypolicy.com/)
- [GDPR Checklist](https://gdprchecklist.io/)

### Chile Específico
- [Ley 19.628 sobre Protección de Datos](https://www.bcn.cl/leychile/navegar?idNorma=141599)
- [SERNAC - Protección de Datos](https://www.sernac.cl/)

---

## ⚠️ DISCLAIMER

Este checklist es una guía general. Para cumplimiento legal completo:
1. Consultar con abogado especializado en privacidad
2. Adaptar a jurisdicción específica (Chile + UE si aplica)
3. Revisar regulaciones locales adicionales
4. Mantener actualizado con cambios legislativos

---

**Próximo paso:** Implementar componentes en `GDPR_IMPLEMENTATION.md`

