# pymerp-minimarket

Modulo funcional de minimarket dentro del ecosistema pymerp. Diseñado para la operacion real de minimarkets chilenos con un solo stock compartido entre web y tienda, movimientos auditados y flujos rapidos.

## Alcance
- Catalogo maestro de productos.
- Inventario real calculado por movimientos auditados.
- Vitrina web publica con disponibilidad en tiempo real.
- Pedidos web con reserva de stock.
- Venta presencial (POS) con scanner.
- Emision de comprobante interno (PDF/HTML) preparado para SII.
- Dashboard operativo diario.

## Stack
- Backend: Spring Boot 3 + PostgreSQL + Flyway + JWT.
- Frontend: React + Vite.

## Flujo general
1. Se crean productos y categorias.
2. Se ingresan compras (IN) con documento.
3. La vitrina publica muestra productos disponibles segun stock.
4. Pedido web genera reserva ACTIVE en estado PENDING.
5. Entrega convierte reserva en movimiento OUT.
6. Venta local genera movimiento OUT y comprobante.
7. Ajustes generan movimientos ADJUST con motivo obligatorio.
8. Dashboard muestra operacion diaria.

## Estructura
- backend/: API REST + migraciones
- frontend/: Vitrina, POS y dashboard
- docs/: Documentacion de dominio y operacion

## Ejecutar
Backend:
```bash
cd modules/minimarket/backend
mvn -q -DskipTests -Dmaven.repo.local=/tmp/m2 package
```

### Base de datos (Docker recomendado)
En `modules/minimarket/backend/docker-compose.yml`:
```bash
cd modules/minimarket/backend
docker compose up -d
```

Variables disponibles:
- `DB_URL` (default: `jdbc:postgresql://localhost:5432/pymerp_minimarket`)
- `DB_USER` (default: `pymerp`)
- `DB_PASSWORD` (default: `pymerp`)

Frontend:
```bash
cd modules/minimarket/frontend
npm install
npm run dev
```

## Automatizacion build/preview (root)
Desde la raiz del repo:
```bash
npm run build
npm run preview
```

- `build` compila el frontend principal + minimarket backend/frontend.
- `preview` levanta el frontend principal y el stack minimarket (db + backend + preview).

## Credenciales seed
Se crea un usuario admin por defecto (si `seed.enabled=true`):
- Email: `admin@minimarket.cl`
- Password: `admin123`

## Documentacion
- docs/domain.md
- docs/api.md
- docs/manual.md
- docs/flow.md
- docs/assumptions.md
- docs/workflows.md
- docs/dashboard.md
- docs/tests.md
- docs/architecture.md
