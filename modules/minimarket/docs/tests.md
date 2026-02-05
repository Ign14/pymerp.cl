# Pruebas reales (simulaciones)

Casos cubiertos con tests de servicio (mock):
- Venta local normal: validacion de stock insuficiente.
- Pedido web + venta simultanea: reserva bloquea venta local.
- Stock bajo: expuesto en dashboard.
- Ajuste por merma: evita dejar stock negativo.
- Error humano comun: ajuste con cantidad 0.

Ubicacion:
- backend/src/test/java/cl/pymerp/minimarket/service/InventoryServiceTest.java
- backend/src/test/java/cl/pymerp/minimarket/service/WebOrderServiceTest.java
- backend/src/test/java/cl/pymerp/minimarket/service/LocalSaleServiceTest.java
- backend/src/test/java/cl/pymerp/minimarket/service/DashboardServiceTest.java
