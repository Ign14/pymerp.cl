# Sincronizar localhost con producción (pymerp.cl)

Guía para descargar todo lo necesario de Firebase y dejar el proyecto local 100% igual y funcional como pymerp.cl.

---

## 1. Ejecutar script de descarga

```powershell
npm run firebase:download
```

O directamente:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/firebase-download-all.ps1
```

Esto crea la carpeta `firebase-backup/` con:
- Firestore rules e indexes (copiados del proyecto)
- index.html y assets descargados de pymerp.cl
- Instrucciones para Firestore export y Storage download

---

## 2. Firestore Rules (ya hecho)

Las reglas ya están en `firestore.rules`. Si necesitas recuperarlas de nuevo:

```powershell
# En carpeta temporal
mkdir temp-firestore-backup
cd temp-firestore-backup
firebase init firestore
# Seleccionar "Use an existing project" → agendaemprende-8ac77
# Aceptar firestore.rules y firestore.indexes.json
# Copiar al proyecto:
copy firestore.rules "..\AGENDAWEB\firestore.rules"
copy firestore.indexes.json "..\AGENDAWEB\firestore.indexes.json"
```

---

## 3. Exportar datos de Firestore (opcional)

**Requisitos:** Google Cloud SDK (`gcloud`) y plan Blaze de Firebase.

```powershell
# 1. Crear bucket para export (solo primera vez)
gcloud storage buckets create gs://agendaemprende-8ac77-firestore-export --location=southamerica-east1

# 2. Exportar datos
gcloud firestore export gs://agendaemprende-8ac77-firestore-export/export-$(Get-Date -Format 'yyyyMMdd')

# 3. Descargar export
gcloud storage cp -r gs://agendaemprende-8ac77-firestore-export/export-* ./firestore-export
```

**Nota:** El export está en formato LevelDB, no JSON. Para datos legibles, usa la consola de Firebase o BigQuery.

---

## 4. Descargar Firebase Storage

**Requisitos:** `gsutil` (incluido con gcloud) o `gcloud storage`.

```powershell
# Crear directorio de backup
mkdir firebase-storage-backup -ErrorAction SilentlyContinue

# Opción A - gsutil
gsutil -m cp -r gs://agendaemprende-8ac77.firebasestorage.app/* ./firebase-storage-backup/

# Opción B - gcloud storage
gcloud storage cp -r gs://agendaemprende-8ac77.firebasestorage.app/* ./firebase-storage-backup/
```

Incluye: logos, fondos, imágenes de productos, etc.

---

## 5. Variables de entorno para coincidir con producción

Asegúrate de que `.env.local` tenga la misma config de Firebase que producción:

```
VITE_FIREBASE_PROJECT_ID=agendaemprende-8ac77
VITE_FIREBASE_STORAGE_BUCKET=agendaemprende-8ac77.firebasestorage.app
# ... resto igual que .env
```

Para **localhost** las URLs públicas serán `localhost:5173/slug`.
Para **producción** serán `pymerp.cl/slug` (VITE_PUBLIC_BASE_URL).

---

## 6. Build de producción local

Para probar el build como en producción:

```powershell
# Usar .env.production
npm run build
npm run preview
```

Luego abre `http://localhost:4173` (o el puerto que muestre).

---

## 7. Comparar con assets de pymerp.cl

Tras ejecutar `npm run firebase:download`, revisa:

- `firebase-backup/<timestamp>/hosting/index.html` – HTML de producción
- `firebase-backup/<timestamp>/hosting/assets/` – JS y CSS de producción

Puedes comparar con tu `dist/` local tras `npm run build`.

---

## 8. Checklist de sincronización

- [ ] `npm run firebase:download` ejecutado
- [ ] `firestore.rules` actualizados (permiso read en companies si aplica)
- [ ] `.env.local` apunta a agendaemprende-8ac77
- [ ] `npm run build` sin errores
- [ ] `npm run dev` o `npm run preview` muestra la app
- [ ] Página pública (ej. /micarritodecomida) carga datos
- [ ] Imágenes y estilos se ven correctamente

---

## Problemas frecuentes

### "Missing or insufficient permissions"
- Firestore rules: `companies` debe tener `allow read: if true;` para páginas públicas.
- Desplegar: `firebase deploy --only firestore:rules`

### Imágenes/tarjetas desproporcionadas
- Revisar que no haya reglas CSS que afecten `body.public-page-mode *`.
- Los iconos de búsqueda deben tener tamaños fijos (w-5 h-5).

### URLs incorrectas (agendaemprende-8ac77.web.app)
- `env.publicBaseUrl` detecta localhost vs producción.
- En local: usa `window.location.origin`.
- En prod: usa `VITE_PUBLIC_BASE_URL` o `https://pymerp.cl`.
