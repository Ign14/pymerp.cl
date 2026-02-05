# Manual de uso - Minimarket

## 1. Catalogo
- Crear productos con precio, costo y unidad.
- Marcar visible_web si debe aparecer en vitrina.

## 2. Ingreso de stock (compras)
- Usar endpoint de compra con tipo y numero de documento.
- Cada ingreso genera movimiento IN.

## 3. Vitrina web
- Muestra solo productos visibles y activos.
- Indica stock bajo y bloquea productos sin stock.
 - Permite enviar pedido con nombre y telefono.

## 4. Pedidos web
- Al confirmar un pedido se reserva stock.
- El pedido queda en estado PENDING.
- Al entregar, se descuenta stock real.
- Al cancelar, se libera la reserva.

## 5. POS (venta presencial)
- Escanear codigo o buscar por SKU/nombre exacto.
- Editar cantidades rapidamente.
- Elegir medio de pago y confirmar.
- Si no hay internet, la venta queda en cola local.

## 5.1 Acceso (JWT)
- Iniciar sesion con credenciales del operador.
- El token se usa para POS, inventario y dashboard.

## 5.2 Inventario (operacion)
- Ingreso de compras con documento.
- Ajustes manuales con motivo obligatorio.
- Historial por producto.

## 6. Comprobante
- Disponible en PDF e HTML imprimible.
- Incluye numero de operacion, fecha, productos y total.

## 7. Dashboard diario
- Revisa ventas del dia, pedidos pendientes, stock critico y ajustes.

## Buenas practicas
- No editar stock directamente.
- Registrar siempre motivo de ajuste.
- Revisar stock critico a primera hora.
