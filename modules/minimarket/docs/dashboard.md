# Dashboard operativo

Enfoque: dueno de minimarket, rapido y accionable.

## Componentes
- Ventas del dia: total y cantidad de ventas locales.
- Pedidos web pendientes: lista y contador.
- Productos con stock critico: stock_on_hand <= low_stock_threshold.
- Ajustes manuales recientes: movimientos ADJUST mas recientes.

## Endpoint
- GET /api/dashboard/summary

## Consideraciones
- Zona horaria: America/Santiago.
- Ventas del dia: solo ventas locales completadas (por ahora).
- Pedidos web pendientes: estado PENDING.
