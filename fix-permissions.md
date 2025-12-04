# Solución al Error "Forbidden" en Firebase Functions

## Problema
Las funciones callables de Firebase requieren autenticación por defecto. Para permitir llamadas públicas desde el formulario de solicitud de acceso, necesitas configurar permisos en Google Cloud.

## Solución

### Opción 1: Configurar permisos en Google Cloud Console (Recomendado)

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona el proyecto: `agendaemprende-8ac77`
3. Ve a **Cloud Functions** > **sendAccessRequestEmail**
4. Haz clic en la función
5. Ve a la pestaña **Permissions** (Permisos)
6. Haz clic en **Add Principal**
7. Agrega:
   - **Principal**: `allUsers`
   - **Role**: `Cloud Functions Invoker`
8. Guarda los cambios

### Opción 2: Usar gcloud CLI

```bash
gcloud functions add-iam-policy-binding sendAccessRequestEmail \
  --region=us-central1 \
  --member="allUsers" \
  --role="roles/cloudfunctions.invoker"
```

### Opción 3: Usar Firebase CLI (si está disponible)

```bash
firebase functions:config:set functions.invoker="allUsers"
```

## Verificar

Después de configurar los permisos, intenta crear una solicitud de acceso nuevamente. El error "Forbidden" debería desaparecer.

