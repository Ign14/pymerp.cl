# Deployment Instructions - SEO Implementation

## 🚀 Desplegar Sitemap Dinámico

### 1. **Desplegar Cloud Function**

```bash
# Navegar a functions
cd functions

# Instalar dependencias (si es necesario)
npm install

# Compilar TypeScript
npm run build

# Desplegar solo la función generateSitemap
firebase deploy --only functions:generateSitemap

# O desplegar todas las funciones
firebase deploy --only functions
```

### 2. **Verificar Deployment**

```bash
# URL de la función desplegada:
# https://us-central1-agendaweb-d0e5d.cloudfunctions.net/generateSitemap

# Probar en navegador o con curl
curl https://us-central1-agendaweb-d0e5d.cloudfunctions.net/generateSitemap

# Debe devolver XML sitemap válido
```

### 3. **Actualizar robots.txt (si cambió el project ID)**

Si tu project ID de Firebase es diferente a `agendaweb-d0e5d`, actualiza:

**Archivo:** `public/robots.txt`

```txt
Sitemap: https://us-central1-TU-PROJECT-ID.cloudfunctions.net/generateSitemap
```

### 4. **Desplegar Frontend**

```bash
# Volver a la raíz del proyecto
cd ..

# Build del frontend
npm run build

# Desplegar a Firebase Hosting
firebase deploy --only hosting

# O todo junto
firebase deploy
```

---

## 🔍 Verificar Implementación SEO

### **1. Verificar Meta Tags**

Abre cada página en el navegador y usa DevTools:

```javascript
// En la consola del navegador:
document.querySelector('title').innerText
document.querySelector('meta[name="description"]').content
document.querySelector('meta[property="og:title"]').content

// Ver todos los schemas:
[...document.querySelectorAll('script[type="application/ld+json"]')]
  .map(s => JSON.parse(s.innerHTML))
```

### **2. Probar Sitemap**

```bash
# Local (con firebase emulators)
firebase emulators:start --only functions

# Producción
curl https://us-central1-agendaweb-d0e5d.cloudfunctions.net/generateSitemap

# Validar XML
curl https://us-central1-agendaweb-d0e5d.cloudfunctions.net/generateSitemap | xmllint --format -
```

### **3. Verificar robots.txt**

```bash
# Local
http://localhost:5173/robots.txt

# Producción
https://pymerp.cl/robots.txt
```

### **4. Testing con Herramientas SEO**

#### **Google Rich Results Test**
```
https://search.google.com/test/rich-results
```
- Pegar URL de producción
- Verificar Organization Schema
- Verificar LocalBusiness Schema

#### **Facebook Debugger**
```
https://developers.facebook.com/tools/debug/
```
- Pegar URL (ej: https://pymerp.cl)
- Verificar Open Graph image
- Ver preview de compartir

#### **Twitter Card Validator**
```
https://cards-dev.twitter.com/validator
```
- Validar Twitter Cards
- Ver preview

---

## 📊 Monitoreo Post-Deployment

### **1. Google Search Console**

```
https://search.google.com/search-console
```

**Pasos:**
1. Agregar propiedad (pymerp.cl)
2. Verificar propiedad (DNS o HTML tag)
3. Enviar sitemap:
   - URL: `https://us-central1-agendaweb-d0e5d.cloudfunctions.net/generateSitemap`
4. Monitorear:
   - Cobertura de índice
   - Errores de rastreo
   - Rich results
   - Core Web Vitals

### **2. Bing Webmaster Tools**

```
https://www.bing.com/webmasters
```

**Pasos:**
1. Agregar sitio
2. Verificar
3. Enviar sitemap
4. Monitorear indexación

---

## 🐛 Troubleshooting

### **Problema: Sitemap no genera XML**

```bash
# Ver logs de la función
firebase functions:log --only generateSitemap

# Verificar que hay empresas en Firestore
# Firestore Console > companies > filtrar por slug != null
```

### **Problema: Meta tags no aparecen**

- Verificar que HelmetProvider está en `main.tsx`
- Verificar que el componente SEO está antes del contenido
- Usar React DevTools para ver props del componente SEO

### **Problema: Schema.org no válido**

- Copiar JSON-LD del código fuente
- Validar en: https://validator.schema.org/
- Verificar que todos los campos requeridos están presentes

### **Problema: Open Graph no funciona en Facebook**

- Usar Facebook Debugger para ver errores
- Verificar que la imagen OG:
  - Es accesible públicamente
  - Tiene mínimo 200x200px
  - Formato JPG o PNG
  - Peso menor a 8MB

---

## ✅ Checklist Post-Deployment

- [ ] Cloud Function `generateSitemap` desplegada
- [ ] Sitemap accesible vía URL
- [ ] robots.txt actualizado con URL correcta
- [ ] Frontend desplegado con nuevos meta tags
- [ ] Verificado meta tags en al menos 3 páginas
- [ ] Schema.org válido en Google Rich Results Test
- [ ] Open Graph preview OK en Facebook Debugger
- [ ] Twitter Cards preview OK
- [ ] Sitemap enviado a Google Search Console
- [ ] Sitemap enviado a Bing Webmaster Tools
- [ ] Documentación SEO_IMPLEMENTATION.md actualizada

---

## 🎯 KPIs a Monitorear

### **Semana 1-4**
- [ ] URLs indexadas en Google (aumentar de X a Y)
- [ ] Impresiones en Search Console (baseline)
- [ ] CTR promedio en SERPs (baseline)
- [ ] Rich results apareciendo

### **Mes 2-3**
- [ ] Ranking para palabras clave objetivo
- [ ] Tráfico orgánico (aumentar 20%+)
- [ ] Páginas en Top 10 de Google
- [ ] Compartidos en redes sociales

### **Mes 4-6**
- [ ] ROI de SEO
- [ ] Conversiones desde búsqueda orgánica
- [ ] Featured snippets obtenidos
- [ ] Authority score del dominio

---

**Última actualización:** 3 de diciembre de 2025  
**Versión:** 1.0  
**Estado:** ✅ READY FOR DEPLOYMENT
