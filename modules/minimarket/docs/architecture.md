# Arquitectura

## Stack
- Backend: Spring Boot 3 + PostgreSQL + Flyway + JWT.
- Frontend: React + Vite.

## Decisiones
- Modulo aislado dentro de pymerp para no afectar otras categorias.
- Stock calculado por movimientos, no editable.
- Reservas separadas para evitar sobreventa web vs POS.
- JWT para operaciones internas (POS, inventario, dashboard).
