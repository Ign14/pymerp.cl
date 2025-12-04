# Verificar y Configurar Permisos de Firebase Functions

## Verificar Permisos Actuales

### Opción 1: Google Cloud Console
1. Ve a: https://console.cloud.google.com/functions/list?project=agendaemprende-8ac77
2. Haz clic en `sendAccessRequestEmail`
3. Ve a la pestaña **Permissions** (Permisos)
4. Verifica que `allUsers` tenga el rol `Cloud Functions Invoker`

### Opción 2: gcloud CLI
```bash
gcloud functions get-iam-policy sendAccessRequestEmail \
  --region=us-central1 \
  --project=agendaemprende-8ac77
```

## Si los Permisos No Están Configurados

### Configurar con gcloud CLI
```bash
gcloud functions add-iam-policy-binding sendAccessRequestEmail \
  --region=us-central1 \
  --member="allUsers" \
  --role="roles/cloudfunctions.invoker" \
  --project=agendaemprende-8ac77
```

## Nota Importante

Los cambios de permisos pueden tardar **1-2 minutos** en propagarse. Después de configurar los permisos:
1. Espera 1-2 minutos
2. Recarga la página de la aplicación
3. Intenta crear una solicitud de acceso nuevamente

## Alternativa Temporal

Si los permisos no funcionan, podemos cambiar a HTTP functions en lugar de callable functions, pero esto requiere más cambios en el código.

