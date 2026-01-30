# Propuesta de módulos por categoría

Documento de referencia para desplegar módulos completos según la categoría seleccionada (Servicios, Productos o Híbrido). Incluye enfoque de diseño/UX, tratamiento de datos y reportes clave, además de los flujos de solicitud y disponibilidad.

## 1) Enfoque transversal de UX/UI
- Diseño: layout de dashboard con header compacto, cards con sombras suaves, colores semánticos y uso consistente de íconos. Sidebar con agrupación por categoría y atajos rápidos (crear servicio/producto, ver agenda, ver pedidos).
- Personalización: soportar presets de tema (claro/oscuro), selección de fuente (2–3 familias) y acento de color por marca. Mostrar preview en vivo.
- Estados vacíos: ilustración + CTA (“Crear servicio”, “Crear producto”, “Configurar horarios”).
- Accesibilidad: foco visible, aria-label en icon-only, contrastes AA, saltos de navegación rápidos.
- Internacionalización: strings en i18n (`common`, `dashboard`, `services`, `products`).

## 2) Categoría Servicios
**Objetivo:** agenda y reservas por horarios, profesionales y recursos.
- Subcategorías sugeridas:
  - Salud y bienestar: consultas, terapias, masajes.
  - Belleza y estética: peluquería, manicure, estética integral.
  - Educación y consultoría: mentorías, clases, asesorías.
  - Hogar y mantenimiento: reparaciones, limpieza, jardinería.
  - Eventos y entretenimiento: fotografía, DJ, catering.
- Datos principales:
  - Servicios: nombre, descripción, duración, precio, categoría, tags, foto, lead_time, buffers, visibilidad.
  - Profesionales: nombre, contacto, especialidades, estado, capacidad concurrente, límites por plan.
  - Disponibilidad: plantillas semanales, excepciones (feriados), bloqueos manuales, overbooking flag.
  - Reservas: cliente, canal (web/WhatsApp), servicio, profesional, fecha/hora, estado, pagos, notas, recordatorios.
- Flujos clave:
  1. Selección de fecha → disponibilidad por servicio/profesional → reserva → confirmación (WhatsApp/Email).
  2. Cambios/cancelaciones con políticas (cutoff, penalización, reprogramación).
  3. Bloqueo rápido de agenda (vacaciones, mantenimiento).
- UI recomendada:
  - Calendario semanal/diario con vista de columnas por profesional.
  - Widget público “Agenda” (embed) con selector de servicio → profesional → horario.
  - Panel de capacidad: heatmap de ocupación y ratio de no-shows.
- Reportes:
  - Ocupación por profesional/servicio.
  - Tasa de conversión de clic a reserva.
  - No-show vs. confirmaciones, reprogramaciones.
  - Ingresos proyectados y reales por período.

## 3) Categoría Productos
**Objetivo:** catálogo, inventario y pedidos.
- Subcategorías sugeridas:
  - Retail: indumentaria, calzado, accesorios.
  - Alimentos y bebidas: frescos, empaquetados, preparaciones.
  - Belleza y estética: cosmética, skin-care, hair-care.
  - Electrónica y servicios asociados: dispositivos, instalación, soporte.
  - Salud y fitness: suplementos, equipamiento, merch.
- Datos principales:
  - Productos: nombre, SKU, variantes (talla/color), stock, stock de seguridad, precio lista/promoción, categoría, fotos, visibilidad.
  - Inventario: movimientos (entrada, salida, ajuste), proveedor, fecha y notas.
  - Pedidos: cliente, items, totales, dirección (opcional), canal (web/WhatsApp), estado (borrador, pendiente, pagado, despachado, cancelado).
  - Disponibilidad: reglas por stock, backorder, pre-order con fecha estimada.
- Flujos clave:
  1. Navegación por catálogo → carrito → checkout → pedido por WhatsApp o pasarela.
  2. Reposición: alertas por stock mínimo, órdenes a proveedores, recepción de inventario.
  3. Pre-orders: fecha estimada, confirmación y actualización de estado.
- UI recomendada:
  - Grid de productos con filtros (categoría, precio, disponibilidad).
  - Ficha detallada con variantes, badges de stock (“En stock”, “Bajo”, “Agotado”, “Pre-order”).
  - Checkout rápido (1 paso) y opción “Enviar por WhatsApp”.
- Reportes:
  - Top productos por ventas/unidades.
  - Margen estimado, ticket promedio.
  - Rotación de inventario y quiebres de stock.
  - Embudo: vista → add-to-cart → pedido.

## 4) Categoría Híbrido (Servicios + Productos)
**Objetivo:** negocios que venden servicios y también insumos/upsells.
- Reglas:
  - Mostrar ambos módulos con navegación clara (“Servicios” y “Productos” separados, con cross-sell contextual).
  - En reservas permitir agregar productos asociados (ej. kits, upsells).
  - En pedidos permitir agregar servicio complementario (ej. instalación).
- Datos combinados:
  - Paquetes: servicio + productos incluidos, precio bundle, disponibilidad condicionada a stock.
  - Políticas: si no hay stock, deshabilitar horario o marcar como “con insumo alternativo”.
- Reportes:
  - Ventas cruzadas y attach rate (productos por servicio).
  - Rentabilidad por paquete.

## 5) Módulos transversales
- Clientes/CRM ligero: fichas de cliente con historial de reservas/pedidos, preferencias, etiquetas y notas internas.
- Pagos: integración de pasarela (Stripe/Mercado Pago) + link de pago y registro de estado; fallback WhatsApp.
- Branding público: landing por empresa `/:companyId` con bloques de servicios, productos destacados, testimonios, FAQs, call-to-actions a WhatsApp y reserva/pedido.
- Notificaciones: recordatorios de citas, confirmaciones de pedido, alertas de stock, avisos de reprogramación.
- Seguridad y auditoría: sanitización de entrada, rate limiting en Functions, logs de cambios (quién cambió disponibilidad, precio o stock).

## 6) Tratamiento de datos y almacenamiento (alineado a Firestore)
- Colecciones recomendadas:
  - `services`, `professionals`, `availability` (slots/plantillas), `appointments`
  - `products`, `inventory_movements`, `orders`
  - `clients`, `notifications`, `analytics_events`
- Datos derivados:
  - Vistas agregadas para reportes (ocupación, ventas, inventario).
  - Índices por `company_id`, `status`, `date`, `category`.
- Integridad:
  - Reglas de ownership (company_id) y validaciones de rango (fechas futuras, stock >= 0).
  - Sanitizar campos ricos (descripciones) y validar precios/duraciones.

## 7) Reportes y paneles
- Panel ejecutivo: MRR/ingresos, ocupación (servicios), ventas (productos), tickets promedio, top canales.
- Servicios: ocupación por profesional, cancelaciones/no-show, lead time promedio, uso de buffers.
- Productos: rotación, margen estimado, quiebres, backorders, cumplimiento de fechas de pre-order.
- Clientes: recurrencia, LTV estimado, segmentos (por categoría comprada/servicio tomado).
- Exportables: CSV/PDF de reservas, pedidos e inventario (por rango de fechas).

## 8) Roadmap de implementación sugerido
1) Base de datos y servicios: colecciones, índices y reglas por categoría; servicios TypeScript para CRUD y disponibilidad.
2) UI de configuración inicial: selector de categoría (Servicios/Productos/Híbrido) que habilita los módulos pertinentes.
3) Módulo Servicios: calendario, reservas, profesionales, plantillas de disponibilidad, recordatorios.
4) Módulo Productos: catálogo, inventario, pedidos, alertas de stock y pre-order.
5) Módulo Híbrido: paquetes y cross-sell en reserva/checkout.
6) Reportes y dashboards: vistas agregadas, tarjetas KPI y exportación.
7) Pulido UX: personalización visual, estados vacíos, accesibilidad e i18n.
