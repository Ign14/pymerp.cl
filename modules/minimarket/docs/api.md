# API minimarket

Base URL: /api

## Auth (JWT)
- POST /auth/login
- GET /auth/me

Header requerido en endpoints privados:
`Authorization: Bearer <token>`

## Productos
- POST /products
- PUT /products/{id}
- GET /products

## Inventario
- POST /inventory/purchase
- POST /inventory/adjustments
- GET /inventory/{productId}/stock
- GET /inventory/{productId}/movements

## Pedidos web
- POST /web-orders
- PATCH /web-orders/{id}/status

## Ventas locales
- POST /local-sales
- GET /local-sales/{id}/receipt.pdf
- GET /local-sales/{id}/receipt.html

## Dashboard
- GET /dashboard/summary
