# Modelo de dominio - Minimarket

## Principios
- Un solo stock real compartido por web y tienda.
- El stock nunca se edita directo.
- Todo cambio de stock genera un movimiento auditado.

## Entidades y relaciones
- User: operador que registra movimientos y ventas.
- Category: clasifica productos, puede ser jerarquica.
- Product: item vendible, visible_web determina vitrina publica.
- InventoryMovement: unico mecanismo para alterar stock (IN/OUT/ADJUST).
- Inventory: vista calculada desde movimientos (stock_on_hand).
- StockReservation: reserva por pedido web (ACTIVE/RELEASED/CONSUMED).
- WebOrder y WebOrderItem: pedidos web y sus items.
- LocalSale y LocalSaleItem: ventas en POS.
- Payment: pagos asociados a venta local o pedido web.

## Reglas criticas
- InventoryMovement es la unica entidad que altera stock.
- Inventory se calcula a partir de movimientos (view `inventory`).
- Cada movimiento incluye type, reason, quantity, user y timestamp.
- Ajustes requieren motivo obligatorio.
- No se permite eliminar movimientos, solo registrar ajustes.

## Notas de diseno
- `inventory` es una vista calculada para evitar edicion directa.
- La disponibilidad web se calcula como `stock_on_hand - reservas_activas`.
- Las reservas se consumen al entregar y se liberan al cancelar.
