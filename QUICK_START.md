# 🚀 Quick Start - Sistema de Citas PyM-ERP

## ⚡ Inicio Rápido (5 minutos)

### **1. Build & Verify** (30 segundos)
```bash
npm run build
```
✅ Debe compilar sin errores

### **2. Start Development** (10 segundos)
```bash
npm run dev
```
🌐 Abre http://localhost:5173

### **3. Login como ENTREPRENEUR** (30 segundos)
- Usuario: tu-email@example.com
- Password: tu-password

### **4. Crear Primer Profesional** (2 minutos)
```
Dashboard → Profesionales → + Nuevo profesional

Datos de ejemplo:
- Nombre: Dr. Juan Pérez
- Email: juan@example.com (opcional)
- Teléfono: +56912345678 (opcional)
- Especialidades: "Consulta general" (Enter para agregar)
- Estado: ACTIVE
- Guardar
```

### **5. Configurar Disponibilidad** (2 minutos)
Por ahora manual en Firestore Console:

```javascript
// Collection: professional_availability
{
  professional_id: "ID_DEL_PROFESIONAL_CREADO",
  company_id: "TU_COMPANY_ID",
  day_of_week: 1,  // Lunes
  start_time: "09:00",
  end_time: "18:00",
  is_available: true,
  created_at: new Date()
}

// Repetir para cada día de la semana (1-5 = Lun-Vie)
```

### **6. Crear Cita de Prueba** (1 minuto)
```
Dashboard → Acciones rápidas - Citas → Agenda manual

- Cliente: María González
- Teléfono: +56987654321
- Email: maria@example.com (opcional)
- Servicio: (seleccionar uno existente)
- Profesional: Dr. Juan Pérez
- Fecha: Mañana
- Hora inicio: 10:00
- Crear cita
```

### **7. Ver en Calendario** (30 segundos)
```
Dashboard → Horarios y pendientes
- Ver vista Día / Semana
- Filtrar por profesional
- Confirmar citas pendientes
```

---

## 🎯 Rutas Principales

```
/dashboard                                  → Dashboard principal
/dashboard/professionals                    → Gestionar profesionales
/dashboard/appointments/new                 → Crear cita manual
/dashboard/appointments                     → Ver calendario
/dashboard/settings/notifications           → Config notificaciones
/dashboard/reports/appointments             → Ver métricas
```

---

## 🔧 Setup Producción (después)

### **Firestore Collections:**
1. `professionals` - Ya puedes crear desde UI ✅
2. `professional_availability` - Manual por ahora
3. `appointments` - Ya se crean automáticamente ✅
4. `notification_settings` - Ya se crean automáticamente ✅

### **Cloud Functions:**
```bash
# 1. Inicializar
firebase init functions

# 2. Copiar archivos
cp functions/src/appointments/*.ts ./functions/src/

# 3. Deploy
firebase deploy --only functions
```

### **Email Service:**
```bash
# SendGrid (recomendado)
firebase functions:config:set sendgrid.key="TU_API_KEY"

# Implementar en Cloud Functions
# Ver: functions/src/appointments/sendReminders.ts
```

---

## 📚 Documentación

- `APPOINTMENTS_SYSTEM.md` - Sistema base completo
- `ADVANCED_FEATURES.md` - 5 funcionalidades avanzadas
- `FINAL_SUMMARY.md` - Resumen ejecutivo
- `QUICK_START.md` - Este archivo (inicio rápido)

---

## ✅ Checklist Básico

**Para empezar a usar (local):**
- [x] ~~Crear tipos TypeScript~~ ✅ Ya está
- [x] ~~Crear servicios~~ ✅ Ya está
- [x] ~~Crear componentes~~ ✅ Ya está
- [x] ~~Crear páginas~~ ✅ Ya está
- [x] ~~Agregar rutas~~ ✅ Ya está
- [ ] Crear al menos 1 profesional (UI)
- [ ] Configurar disponibilidad (manual)
- [ ] Probar flujo completo

**Para producción:**
- [ ] Deploy Cloud Functions
- [ ] Configurar email service
- [ ] Configurar Cloud Scheduler (reminders)
- [ ] Testing E2E
- [ ] Monitoring

---

## 🐛 Troubleshooting

### **No aparecen slots disponibles en booking:**
✅ Verifica que exista `professional_availability` para ese profesional y día

### **Error al crear cita:**
✅ Verifica que el servicio y profesional existan y estén activos

### **No se envían emails:**
✅ Emails requieren Cloud Functions deployed con servicio configurado

### **Quick Actions no aparecen:**
✅ Solo aparecen si `company.business_type === 'SERVICES'`

---

## 💡 Tips

1. **Desarrollo rápido**: Usa datos de prueba consistentes
2. **Testing**: Crea profesionales y servicios variados
3. **Disponibilidad**: Por ahora crea manualmente en Firestore
4. **Emails**: Usa mailtrap.io para testing local
5. **Reportes**: Necesitas citas con diferentes estados para ver métricas

---

## 🎉 ¡Listo!

Ya puedes usar el sistema completo de citas con profesionales.

**¿Siguiente paso?**
- Crear más profesionales
- Configurar disponibilidad
- Probar booking widget público
- Implementar emails
- Ver reportes

---

_Desarrollado con ❤️ para PyM-ERP_

