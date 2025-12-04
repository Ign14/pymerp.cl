# 📄 Actualización de Política de Privacidad

## Secciones que DEBEN agregarse a `/privacidad`

---

## 1. Cookies y Tecnologías de Rastreo

### Agregar esta sección:

```markdown
## 🍪 Cookies y Tecnologías de Rastreo

### ¿Qué cookies utilizamos?

Utilizamos las siguientes categorías de cookies:

#### Cookies Esenciales (No requieren consentimiento)
- **Firebase Authentication**: Necesarias para mantener tu sesión activa
  - Nombre: `__session`
  - Duración: Hasta que cierres sesión
  - Propósito: Autenticación y seguridad

#### Cookies de Analytics (Requieren consentimiento)
- **Google Analytics 4**: Para entender cómo usas nuestra aplicación
  - Measurement ID: G-RZ7NZ3TKSG
  - Nombres: `_ga`, `_ga_*`, `_gid`
  - Duración: Hasta 2 años
  - Propósito: Análisis de uso, mejora de experiencia
  - Más info: [Política de Google Analytics](https://policies.google.com/privacy)

#### Cookies de Funcionalidad
- **Preferencias de usuario**: Idioma, tema, configuración
  - localStorage: `theme`, `language`, `cookie-consent`
  - Duración: Permanente (hasta que las elimines)
  - Propósito: Recordar tus preferencias

### Gestionar Cookies

Puedes gestionar tus preferencias de cookies en cualquier momento:
- Click en el ícono de cookies en la esquina inferior
- O borra las cookies desde la configuración de tu navegador

### Google Consent Mode v2

Utilizamos Google Consent Mode v2 para respetar tus decisiones:
- Si rechazas cookies de analytics, Google Analytics NO se ejecutará
- Si aceptas, recopilaremos datos anónimos de uso
```

---

## 2. Servicios de Terceros

### Agregar esta sección:

```markdown
## 🌐 Servicios de Terceros

Utilizamos los siguientes servicios de terceros que procesan tus datos:

### Firebase (Google Cloud)
- **Propósito**: Almacenamiento de datos, autenticación
- **Ubicación**: Estados Unidos
- **Adecuación GDPR**: Standard Contractual Clauses (SCCs)
- **Datos compartidos**: Email, nombre, datos de empresa
- **Política**: [Firebase Privacy](https://firebase.google.com/support/privacy)

### Google Analytics 4
- **Propósito**: Análisis de uso de la aplicación
- **Ubicación**: Estados Unidos
- **Adecuación GDPR**: Consentimiento del usuario + SCCs
- **Datos compartidos**: IP address (anonimizada), página visitada, eventos
- **Política**: [Google Privacy Policy](https://policies.google.com/privacy)
- **Opt-out**: Rechazar cookies de analytics en el banner

### Google Maps API
- **Propósito**: Mostrar ubicaciones de empresas
- **Ubicación**: Estados Unidos
- **Adecuación GDPR**: Data Processing Amendment
- **Datos compartidos**: Geolocalización al usar mapas
- **Política**: [Google Maps Privacy](https://policies.google.com/privacy)

### Sentry
- **Propósito**: Monitoreo de errores y rendimiento
- **Ubicación**: Estados Unidos
- **Adecuación GDPR**: Privacy Shield + SCCs
- **Datos compartidos**: Logs de errores, información del browser
- **Política**: [Sentry Privacy](https://sentry.io/privacy/)

### SendGrid (si se usa)
- **Propósito**: Envío de emails transaccionales
- **Ubicación**: Estados Unidos
- **Adecuación GDPR**: Privacy Shield + DPA
- **Datos compartidos**: Email, nombre
```

---

## 3. Derechos del Usuario

### Agregar esta sección expandida:

```markdown
## 👤 Tus Derechos (GDPR)

De acuerdo con el Reglamento General de Protección de Datos (GDPR), tienes los siguientes derechos:

### Derecho de Acceso (Art. 15)
Puedes solicitar una copia de todos tus datos personales.

**Cómo ejercer:**
- Ve a tu Dashboard → Configuración
- Click en "Exportar Mis Datos"
- Recibirás un archivo JSON con toda tu información

### Derecho de Rectificación (Art. 16)
Puedes corregir datos incorrectos o incompletos.

**Cómo ejercer:**
- Ve a tu Dashboard → Editar Perfil
- Actualiza la información
- Los cambios son inmediatos

### Derecho al Olvido (Art. 17)
Puedes solicitar la eliminación de tus datos.

**Cómo ejercer:**
- Ve a tu Dashboard → Configuración
- Click en "Eliminar Mi Cuenta"
- Confirma la acción
- Procesaremos tu solicitud en máximo 30 días

**Nota:** Algunos datos pueden conservarse por obligaciones legales (contabilidad, prevención de fraude).

### Derecho a la Portabilidad (Art. 20)
Puedes recibir tus datos en formato estructurado.

**Cómo ejercer:**
- Usa la función "Exportar Mis Datos"
- Recibes archivo JSON machine-readable

### Derecho de Oposición (Art. 21)
Puedes oponerte al procesamiento de tus datos.

**Cómo ejercer:**
- Cookies de analytics: Rechazar en banner de cookies
- Marketing: Opt-out en preferencias
- Completamente: Eliminar cuenta

### Derecho a Limitar el Procesamiento (Art. 18)
Puedes solicitar que limitemos el uso de tus datos.

**Cómo ejercer:**
- Contactar: privacidad@pymerp.cl
- Especificar qué datos limitar

### Contacto para Ejercer Derechos

**Email:** privacidad@pymerp.cl
**Asunto:** "Solicitud GDPR - [Tipo de Derecho]"
**Tiempo de respuesta:** Máximo 30 días

Incluir en tu solicitud:
- Nombre completo
- Email registrado
- Descripción de tu solicitud
- Documento de identidad (para verificación)
```

---

## 4. Período de Retención de Datos

### Agregar tabla clara:

```markdown
## ⏰ ¿Cuánto tiempo conservamos tus datos?

| Tipo de Dato | Período de Retención | Razón |
|--------------|---------------------|-------|
| Cuenta activa | Mientras uses el servicio | Funcionalidad |
| Cuenta inactiva | 2 años desde última actividad | Recuperación posible |
| Solicitudes de acceso | 30 días tras procesamiento | Proceso de registro |
| Datos de empresa | Mientras la cuenta esté activa | Servicio |
| Analytics (Google) | 26 meses | Política de Google |
| Logs de errores (Sentry) | 90 días | Debugging |
| Backups | 30 días | Recuperación ante desastres |
| Datos legalmente requeridos | Según legislación chilena | Obligación legal |

### Eliminación Automática

- Las cuentas inactivas por más de 2 años son eliminadas automáticamente
- Los logs de analytics se anoninizan después de 26 meses
- Los backups se eliminan después de 30 días
```

---

## 5. Transferencias Internacionales

### Agregar sección específica:

```markdown
## 🌍 Transferencias Internacionales de Datos

Tus datos pueden ser transferidos y procesados fuera de Chile/Unión Europea:

### Destinos y Salvaguardas

| Servicio | País | Mecanismo de Protección |
|----------|------|------------------------|
| Firebase | 🇺🇸 USA | Standard Contractual Clauses (SCCs) |
| Google Analytics | 🇺🇸 USA | SCCs + Consentimiento |
| Google Maps | 🇺🇸 USA | Data Processing Amendment (DPA) |
| Sentry | 🇺🇸 USA | Privacy Shield + SCCs |

### Garantías de Protección

Todos nuestros proveedores:
- ✅ Tienen certificación ISO 27001
- ✅ Firmaron SCCs con nosotros
- ✅ Cumplen con GDPR
- ✅ Tienen políticas de privacidad públicas
- ✅ Permiten auditorías de seguridad

Para más información sobre transferencias internacionales:
[European Commission SCCs](https://ec.europa.eu/info/law/law-topic/data-protection/international-dimension-data-protection/standard-contractual-clauses-scc_en)
```

---

## 6. Notificación de Brechas de Seguridad

### Agregar compromiso:

```markdown
## 🚨 Notificación de Brechas de Seguridad

### Nuestro Compromiso

En caso de una brecha de seguridad que afecte tus datos personales:

1. **Notificaremos a la autoridad** competente en máximo 72 horas
2. **Te notificaremos a ti** sin demora si hay alto riesgo
3. **Tomaremos medidas** inmediatas para contener la brecha
4. **Implementaremos mejoras** para prevenir futuros incidentes

### Qué incluirá la notificación

- Naturaleza de la brecha
- Datos potencialmente afectados
- Consecuencias probables
- Medidas tomadas y propuestas
- Contacto para más información

### Contacto de Emergencia

**Email:** seguridad@pymerp.cl
**Para reportar:** Vulnerabilidades de seguridad o sospechas de breach
```

---

## 7. Base Legal del Procesamiento

### Agregar tabla clara:

```markdown
## ⚖️ Base Legal para el Procesamiento

| Procesamiento | Base Legal | Artículo GDPR |
|---------------|------------|---------------|
| Crear y mantener cuenta | Consentimiento + Contractual | Art. 6(1)(a)(b) |
| Procesar pagos | Contractual | Art. 6(1)(b) |
| Enviar emails transaccionales | Contractual | Art. 6(1)(b) |
| Analytics | Interés legítimo + Consentimiento | Art. 6(1)(f) |
| Prevenir fraude | Interés legítimo + Legal | Art. 6(1)(f)(c) |
| Cumplir con leyes | Obligación legal | Art. 6(1)(c) |
| Marketing (si aplica) | Consentimiento | Art. 6(1)(a) |
```

---

## 8. Información de Contacto

### Actualizar con información completa:

```markdown
## 📧 Contacto

### Responsable del Tratamiento
**Nombre:** [Nombre de la empresa]
**Dirección:** [Dirección]
**Email:** contacto@pymerp.cl

### Delegado de Protección de Datos (DPO)
**Email:** privacidad@pymerp.cl
**Asunto:** Indicar "GDPR" o "Protección de Datos"

### Autoridad de Supervisión (Chile)
Si consideras que no hemos respetado tus derechos de privacidad, puedes presentar una reclamación ante:

**SERNAC (Servicio Nacional del Consumidor)**
**Web:** www.sernac.cl
**Teléfono:** 800 700 100

### Respuestas
Responderemos todas las solicitudes en un plazo máximo de **30 días**.
```

---

## 🔄 Cómo Actualizar

### Opción 1: Editar archivo existente

```bash
# Abrir archivo actual
src/pages/info/Privacidad.tsx

# Agregar secciones faltantes
# Usar el contenido de arriba
```

### Opción 2: Crear nueva versión

```bash
# Usar el contenido completo
# Reemplazar contenido actual
# Mantener formato consistente
```

---

## ✅ Checklist de Actualización

- [ ] Cookies y tecnologías de rastreo
- [ ] Servicios de terceros detallados
- [ ] Derechos del usuario expandidos
- [ ] Períodos de retención claros
- [ ] Transferencias internacionales
- [ ] Notificación de brechas
- [ ] Base legal del procesamiento
- [ ] Información de contacto completa
- [ ] Fecha de última actualización
- [ ] Versión de la política

---

## 📝 Template Completo

Ver archivo: `PRIVACY_POLICY_TEMPLATE.md` (siguiente paso)

---

**Estas actualizaciones son OBLIGATORIAS para cumplimiento GDPR**

