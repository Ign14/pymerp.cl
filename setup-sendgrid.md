# Guía Rápida: Configurar SendGrid con Firebase Functions

## Paso 1: Obtener API Key de SendGrid

1. Ve a SendGrid Dashboard > Settings > API Keys
2. Haz clic en "Create API Key"
3. Configura:
   - **Name**: AgendaWeb Functions
   - **API Key Permissions**: "Mail Send" (Full Access)
4. Copia la API Key (empieza con `SG.`)

## Paso 2: Configurar en Firebase

Ejecuta estos comandos desde la raíz del proyecto:

```bash
# Configurar API Key de SendGrid
firebase functions:config:set sendgrid.api_key="TU_API_KEY_AQUI"

# Configurar email del administrador
firebase functions:config:set email.admin="ignacio@datakomerz.com"

# Verificar la configuración
firebase functions:config:get
```

## Paso 3: Desplegar Functions

```bash
# Asegúrate de estar en la raíz del proyecto
cd functions
npm run build
cd ..
firebase deploy --only functions
```

## Paso 4: Verificar

1. Crea una solicitud de acceso desde la aplicación
2. Verifica los logs:
   ```bash
   firebase functions:log
   ```

## Nota sobre el Email "From"

Por defecto, los emails se envían desde `noreply@agendaemprende.com`. 

Para producción, necesitarás:
1. Verificar tu dominio en SendGrid (Settings > Sender Authentication)
2. O usar un email verificado en SendGrid

