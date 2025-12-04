# 📝 Textos y Etiquetas Actualizados

## ✅ Ajustes Aplicados para Contexto Chileno/Español

---

## 🍪 Cookie Consent Banner

### Título
```
🍪 Este sitio usa cookies
```

### Descripción
```
Usamos cookies esenciales para el funcionamiento de AgendaWeb y 
cookies de análisis para mejorar tu experiencia. Puedes personalizar 
tus preferencias o aceptar todo.
```

### Botones
- **Personalizar** - Abre panel de preferencias
- **Rechazar Todo** - Solo cookies esenciales
- **Aceptar Todo** - Todas las cookies

### Panel de Personalización

#### Cookies Esenciales
```
Título: Cookies Esenciales
Descripción: Necesarias para el funcionamiento de AgendaWeb: 
autenticación, sesión de usuario y seguridad. No se pueden 
desactivar porque son indispensables.
Estado: Siempre activas
```

#### Cookies de Análisis
```
Título: Cookies de Análisis  
Descripción: Nos ayudan a entender cómo usas AgendaWeb para mejorar 
continuamente. Utilizamos Google Analytics 4. Tus datos son anónimos 
y agregados.
Toggle: ON/OFF
```

#### Cookies de Publicidad
```
Título: Cookies de Publicidad
Descripción: Actualmente no utilizamos cookies de publicidad o 
marketing. AgendaWeb no muestra anuncios de terceros.
Estado: Desactivadas
```

---

## 📥 Data Export

### Título
```
📥 Descargar Mis Datos
```

### Descripción
```
Descarga una copia completa de toda tu información personal 
almacenada en AgendaWeb. Este es tu derecho garantizado por 
la RGPD (Reglamento General de Protección de Datos).
```

### Botón
- **Estado normal:** "Descargar Mis Datos"
- **Estado cargando:** "Descargando..." (con spinner)

### Disclaimer
```
Incluye: perfil de usuario, información de empresa, servicios, 
productos y metadatos.

No incluye: datos de Google Analytics (debes solicitarlos 
directamente a Google).
```

### Mensajes
- **Éxito:** "✅ Tus datos se han descargado correctamente"
- **Error:** "❌ No se pudieron exportar los datos. Intenta nuevamente."

---

## 🗑️ Data Deletion Request

### Título
```
Eliminar Permanentemente Mi Cuenta
```

### Paso 1: Información

#### Advertencia Principal
```
⚠️ Advertencia: Esta acción es permanente y no se puede deshacer
```

#### ¿Qué se eliminará?
```
✓ Tu perfil de usuario y credenciales
✓ Toda la información de tu empresa
✓ Servicios y productos publicados
✓ Imágenes y archivos que hayas subido
✓ Historial de solicitudes y pedidos
✓ Preferencias y configuraciones
```

#### ¿Qué NO se puede eliminar?
```
• Datos en Google Analytics (se conservan 26 meses por política de Google)
• Registros de auditoría requeridos por ley chilena
• Datos ya anonimizados en estadísticas agregadas
• Transacciones con obligación legal de conservación
```

#### Proceso
```
1. Envías tu solicitud de eliminación desde aquí
2. Verificamos tu identidad (24 a 48 horas hábiles)
3. Procesamos la eliminación permanente (máximo 30 días según RGPD)
4. Recibes confirmación por email cuando esté completa
```

#### Botones
- **Cancelar** - Volver sin hacer cambios
- **Continuar con la Eliminación** - Ir al paso 2

### Paso 2: Confirmación

#### Instrucciones
```
Para confirmar la eliminación permanente, escribe exactamente:

ELIMINAR
```

#### Advertencia Final
```
⚠️ Última advertencia: Una vez confirmado, NO podrás recuperar tu 
información. Asegúrate de haber descargado todo lo importante usando 
"Descargar Mis Datos".
```

#### Botones
- **Volver Atrás** - Regresar al paso 1
- **Eliminar Permanentemente** - Confirmar eliminación
  - Estado cargando: "Procesando..."

### Mensajes
- **Éxito:** "✅ Solicitud de eliminación enviada exitosamente. Te contactaremos en 24-48 horas hábiles."
- **Error:** "❌ No se pudo procesar la solicitud. Por favor intenta nuevamente o contacta a soporte@pymerp.cl"

---

## 📱 PWA Install Prompt

### Título
```
📲 Instalar AgendaWeb en tu dispositivo
```

### Descripción
```
Instala la aplicación para acceder más rápido y usarla sin 
conexión a internet
```

### Beneficios
```
✓ Abre como aplicación desde tu pantalla de inicio
✓ Funciona sin conexión a internet
✓ Actualizaciones automáticas cuando haya novedades
```

### Botones
- **Instalar** - Instalar la PWA
- **Ahora no** - Posponer (recordar en 7 días)
- **×** - Cerrar (arriba a la derecha)

---

## 🔄 PWA Update Prompt

### Título (Estado: Update)
```
✨ Nueva versión disponible
```

### Descripción (Estado: Update)
```
Hay una actualización de AgendaWeb. Actualiza ahora para obtener 
las últimas mejoras y correcciones.
```

### Título (Estado: Offline Ready)
```
✅ Listo para usar sin conexión
```

### Descripción (Estado: Offline Ready)
```
AgendaWeb ya está disponible sin conexión a internet. Puedes 
usarla en cualquier momento.
```

### Botones
- **Actualizar Ahora** - Actualizar y recargar
- **×** - Cerrar notificación

---

## 📡 Offline Indicator

### Mensaje
```
📡 Sin conexión a internet - Trabajando en modo sin conexión
```

---

## 📊 Loading Spinner

### Textos según contexto
- **Full screen:** (sin texto, solo spinner)
- **En botón:** "Cargando...", "Guardando...", "Procesando...", etc.

---

## 🎯 ARIA Labels Estandarizados

### Modales
```
aria-label="Diálogo modal"
aria-label="Ventana de confirmación"
aria-label="Vista previa de imagen"
aria-label="Carrito de compras"
```

### Botones
```
aria-label="Cerrar ventana"
aria-label="Cerrar vista previa"
aria-label="Aumentar cantidad de {producto}"
aria-label="Disminuir cantidad de {producto}"
aria-label="Eliminar {producto} del carrito"
aria-label="Ver imagen grande de {item}"
```

### Navegación
```
aria-label="Menú principal"
aria-label="Navegación de usuario"
aria-label="Enlaces de navegación rápida"
aria-label="Volver a la página anterior"
```

---

## 🌐 Consistencia de Términos

### Términos Estandarizados

| Término | Uso Correcto | Evitar |
|---------|--------------|--------|
| AgendaWeb | Nombre de la app | Agenda Web, agendaweb |
| Sin conexión | Estado offline | Offline, desconectado |
| Descargar | Acción | Exportar, bajar |
| Eliminar | Acción destructiva | Borrar, quitar |
| Guardar | Acción de save | Salvar, grabar |
| Carrito | Shopping cart | Carro, canasta |
| Producto | Product | Item |
| Servicio | Service | Servicio (ok) |
| Empresa | Company | Compañía, negocio |

### Formato de Mensajes

**Éxito:**
```
✅ [Acción] [resultado] correctamente
Ejemplo: ✅ Datos guardados correctamente
```

**Error:**
```
❌ [Descripción del error]. [Acción sugerida]
Ejemplo: ❌ No se pudo guardar. Intenta nuevamente
```

**Advertencia:**
```
⚠️ [Mensaje de advertencia]
Ejemplo: ⚠️ Completa todos los campos obligatorios
```

**Info:**
```
ℹ️ [Información]
Ejemplo: ℹ️ Los cambios se guardarán automáticamente
```

---

## 🔤 Tono y Estilo

### Principios

1. **Claro y Directo**
   - Evitar jerga técnica
   - Oraciones cortas
   - Lenguaje sencillo

2. **Amigable pero Profesional**
   - Tutear al usuario (tú/tu)
   - Ser cortés
   - No demasiado informal

3. **Informativo**
   - Explicar qué pasará
   - Dar contexto cuando sea necesario
   - Incluir tiempos estimados

4. **Accionable**
   - Decir qué hacer a continuación
   - Botones con verbos claros
   - Alternativas cuando sea posible

### Ejemplos

**❌ MAL:**
```
"Operación fallida"
"Error 500"
"No se pudo"
```

**✅ BIEN:**
```
"No se pudieron guardar los cambios. Por favor intenta nuevamente"
"Error de conexión. Verifica tu internet"  
"La operación tardó demasiado. Intenta nuevamente"
```

---

## 📦 Archivo Centralizado

**Creado:** `src/utils/messages.ts`

**Uso:**
```typescript
import { MESSAGES, COMPONENT_TEXTS, formatMessage } from './utils/messages';

// Toast messages
toast.success(MESSAGES.auth.loginSuccess);
toast.error(MESSAGES.auth.loginError);

// Con placeholders
const msg = formatMessage(MESSAGES.validation.minLength, { length: 8 });
// "❌ Mínimo 8 caracteres"

// Component texts
const { title, description } = COMPONENT_TEXTS.cookieConsent;
```

---

## ✅ Archivos Actualizados

### Componentes GDPR:
- ✅ `src/components/CookieConsent.tsx` - Textos mejorados
- ✅ `src/components/DataExport.tsx` - Textos claros
- ✅ `src/components/DataDeletionRequest.tsx` - Mensajes detallados

### Componentes PWA:
- ✅ `src/components/PWAInstallPrompt.tsx` - Beneficios claros
- ✅ `src/components/PWAUpdatePrompt.tsx` - Estados claros
- ✅ `src/components/OfflineIndicator.tsx` - Mensaje mejorado

### Utilidades:
- ✅ `src/utils/messages.ts` - Mensajes centralizados

---

## 🎯 Mejoras Aplicadas

### 1. Español Chileno Apropiado
- ✅ Tuteo consistente (tú/tu)
- ✅ Terminología local
- ✅ Expresiones naturales

### 2. Claridad y Contexto
- ✅ Explicaciones detalladas
- ✅ Tiempos estimados (24-48h, 30 días)
- ✅ Qué incluye/excluye

### 3. Accesibilidad
- ✅ ARIA labels descriptivos
- ✅ Instrucciones claras
- ✅ Alternativas siempre disponibles

### 4. Feedback Visual
- ✅ Emojis para quick recognition
- ✅ Iconos de estado (✅❌⚠️ℹ️)
- ✅ Colores semánticos

---

## 📋 Checklist de Consistencia

- [x] Todos los títulos capitalizados correctamente
- [x] Botones con verbos de acción claros
- [x] Mensajes de error con solución sugerida
- [x] Mensajes de éxito confirmatorios
- [x] ARIA labels descriptivos
- [x] Tiempos y plazos especificados
- [x] Contactos de soporte incluidos
- [x] Referencias a RGPD cuando corresponde
- [x] Emojis apropiados y consistentes
- [x] Tono amigable pero profesional

---

## 🚀 Estado Final

**Todos los textos actualizados y estandarizados:**
- ✅ Componentes GDPR
- ✅ Componentes PWA  
- ✅ Componentes de animación
- ✅ Mensajes centralizados
- ✅ ARIA labels
- ✅ Tooltips y ayudas
- ✅ Errores y éxitos

**Build:**
- ✅ TypeScript compila
- ✅ Vite renderizando
- ✅ Sin errores de linting

**¡Textos listos para producción!** ✍️✨

