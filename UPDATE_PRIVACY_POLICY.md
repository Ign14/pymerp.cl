# 📝 Cómo Actualizar la Política de Privacidad

## Acción Requerida

Actualizar el contenido de `/privacidad` con información específica de GDPR.

---

## 📍 Ubicación del Archivo

```
src/pages/info/Privacidad.tsx
```

---

## ✏️ Qué Agregar

### Copiar de `PRIVACY_POLICY_TEMPLATE.md`:

1. **Sección de Cookies** (OBLIGATORIO)
   - Lista de cookies usadas
   - Google Analytics ID: G-RZ7NZ3TKSG
   - Propósito de cada cookie
   - Cómo gestionarlas

2. **Servicios de Terceros** (OBLIGATORIO)
   - Firebase/Google Cloud
   - Google Analytics 4
   - Google Maps API
   - Sentry
   - Bases legales (SCCs)

3. **Derechos del Usuario Expandidos** (OBLIGATORIO)
   - Cómo exportar datos (Dashboard → Exportar)
   - Cómo eliminar cuenta (Dashboard → Eliminar)
   - Timeframes (30 días)
   - Email de contacto: privacidad@pymerp.cl

4. **Períodos de Retención** (OBLIGATORIO)
   - Tabla clara de retención
   - Cuentas activas vs inactivas
   - Analytics: 26 meses
   - Logs: 90 días

5. **Transferencias Internacionales** (OBLIGATORIO)
   - Tabla de servicios en USA
   - SCCs mencionadas
   - Garantías de protección

6. **Información de Contacto** (OBLIGATORIO)
   - Email: privacidad@pymerp.cl
   - DPO (Delegado de Protección de Datos)
   - Tiempo de respuesta: 30 días
   - Autoridades de supervisión

---

## 🚀 Opción Rápida: Reemplazar Contenido Completo

### Paso 1: Abrir archivo

```bash
src/pages/info/Privacidad.tsx
```

### Paso 2: Reemplazar contenido JSX

Usar el contenido de `PRIVACY_POLICY_TEMPLATE.md` y convertir a JSX:

```typescript
export default function Privacidad() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6">
          Política de Privacidad
        </h1>
        
        <p className="text-sm text-gray-600 mb-4">
          Última actualización: {new Date().toLocaleDateString('es-CL')}
        </p>

        {/* Introducción */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introducción</h2>
          <p className="text-gray-700 leading-relaxed">
            Bienvenido a AgendaWeb, operado por PYM-ERP. Esta Política de Privacidad 
            explica cómo recopilamos, usamos, compartimos y protegemos tu información 
            personal de acuerdo con el GDPR y la Ley 19.628 de Chile.
          </p>
        </section>

        {/* Cookies */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">🍪 2. Cookies y Tecnologías</h2>
          
          <h3 className="text-xl font-semibold mb-3">Cookies Esenciales</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Firebase Auth: Sesión de usuario</li>
            <li>PWA Cache: Funcionalidad offline</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Cookies de Analytics</h3>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
            <p className="text-sm text-blue-900">
              <strong>Google Analytics 4</strong><br/>
              Measurement ID: <code className="bg-blue-100 px-2 py-1 rounded">G-RZ7NZ3TKSG</code><br/>
              Duración: Hasta 2 años<br/>
              Propósito: Entender cómo usas la app para mejorarla
            </p>
          </div>

          <p className="text-gray-700">
            Puedes gestionar tus cookies en cualquier momento a través del banner 
            de cookies o en la configuración de tu navegador.
          </p>
        </section>

        {/* Servicios de Terceros */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">🌐 3. Servicios de Terceros</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2">Servicio</th>
                  <th className="border px-4 py-2">Ubicación</th>
                  <th className="border px-4 py-2">Adecuación GDPR</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-4 py-2">Firebase</td>
                  <td className="border px-4 py-2">🇺🇸 USA</td>
                  <td className="border px-4 py-2">SCCs</td>
                </tr>
                <tr>
                  <td className="border px-4 py-2">Google Analytics</td>
                  <td className="border px-4 py-2">🇺🇸 USA</td>
                  <td className="border px-4 py-2">Consentimiento + SCCs</td>
                </tr>
                <tr>
                  <td className="border px-4 py-2">Google Maps</td>
                  <td className="border px-4 py-2">🇺🇸 USA</td>
                  <td className="border px-4 py-2">DPA</td>
                </tr>
                <tr>
                  <td className="border px-4 py-2">Sentry</td>
                  <td className="border px-4 py-2">🇺🇸 USA</td>
                  <td className="border px-4 py-2">Privacy Shield</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Derechos del Usuario */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">👤 4. Tus Derechos GDPR</h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold">Derecho de Acceso</h3>
              <p className="text-gray-700">
                Dashboard → Exportar Mis Datos (descarga JSON)
              </p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold">Derecho de Rectificación</h3>
              <p className="text-gray-700">
                Dashboard → Editar Perfil
              </p>
            </div>

            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-semibold">Derecho al Olvido</h3>
              <p className="text-gray-700">
                Dashboard → Eliminar Mi Cuenta (procesado en 30 días)
              </p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-semibold">Derecho de Oposición</h3>
              <p className="text-gray-700">
                Rechazar cookies de analytics en el banner
              </p>
            </div>
          </div>
        </section>

        {/* Contacto */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">📧 5. Contacto</h2>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="mb-2">
              <strong>Email de Privacidad:</strong>{' '}
              <a href="mailto:privacidad@pymerp.cl" className="text-blue-600 hover:underline">
                privacidad@pymerp.cl
              </a>
            </p>
            <p className="mb-2">
              <strong>Asunto:</strong> "Solicitud GDPR - [Tipo de Derecho]"
            </p>
            <p className="text-sm text-gray-600">
              Tiempo de respuesta: Máximo 30 días
            </p>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t pt-6 mt-8">
          <p className="text-sm text-gray-600 text-center">
            Esta política cumple con GDPR (UE), Ley 19.628 (Chile) y mejores 
            prácticas internacionales de privacidad.
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## ✅ Verificar Actualización

Después de actualizar:

1. **Abrir en navegador:**
   ```
   http://localhost:5173/privacidad
   ```

2. **Verificar que aparece:**
   - ✓ Sección de cookies con G-RZ7NZ3TKSG
   - ✓ Servicios de terceros
   - ✓ Derechos del usuario con instrucciones
   - ✓ Contacto: privacidad@pymerp.cl
   - ✓ Períodos de retención
   - ✓ Transferencias internacionales

3. **Link desde cookie banner:**
   - ✓ Verificar que "Más información" lleva a /privacidad

---

## 📝 Alternativa: Actualización Incremental

Si prefieres agregar secciones gradualmente:

### Fase 1 (Hoy - Crítico):
- Cookies detalladas
- Servicios de terceros
- Derechos del usuario

### Fase 2 (Esta semana):
- Períodos de retención
- Transferencias internacionales
- Base legal del procesamiento

### Fase 3 (Próxima semana):
- Proceso de breach notification
- Menores de edad
- Cambios a la política

---

**Template completo disponible en:**
`PRIVACY_POLICY_TEMPLATE.md`

**Copia y adapta el contenido a tu estilo!** ✍️

