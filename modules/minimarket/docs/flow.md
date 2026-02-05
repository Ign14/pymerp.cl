# Diagramas de flujo (texto)

## Pedido web
1. Cliente selecciona productos visibles.
2. Sistema valida stock disponible.
3. Se crea pedido PENDING.
4. Se generan reservas ACTIVE por item.
5. Al preparar/entregar:
   - Se crea movimiento OUT por venta.
   - Reservas pasan a CONSUMED.
6. Al cancelar:
   - Reservas pasan a RELEASED.

## Venta local (POS)
1. Operador escanea productos.
2. Sistema valida stock disponible.
3. Se confirma venta.
4. Se genera movimiento OUT por venta.
5. Se registra pago.
6. Se emite comprobante interno (PDF/HTML).
7. Si no hay conexion, se guarda en cola local.

## Ajuste de stock
1. Operador ingresa ajuste con motivo.
2. Sistema valida que no quede stock negativo.
3. Se registra movimiento ADJUST.
