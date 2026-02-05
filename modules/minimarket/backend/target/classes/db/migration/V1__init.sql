CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  parent_id UUID REFERENCES categories(id),
  visible_web BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES categories(id),
  sku VARCHAR(80),
  barcode VARCHAR(80),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  unit VARCHAR(30) NOT NULL DEFAULT 'unidad',
  price NUMERIC(12,2) NOT NULL,
  cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  visible_web BOOLEAN NOT NULL DEFAULT TRUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  low_stock_threshold INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  type VARCHAR(10) NOT NULL CHECK (type IN ('IN', 'OUT', 'ADJUST')),
  reason VARCHAR(20) NOT NULL CHECK (reason IN ('compra', 'venta', 'merma', 'vencimiento', 'robo', 'ajuste')),
  quantity INTEGER NOT NULL,
  document_type VARCHAR(40),
  document_number VARCHAR(80),
  notes TEXT,
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CHECK ((type IN ('IN', 'OUT') AND quantity > 0) OR (type = 'ADJUST' AND quantity <> 0))
);

CREATE TABLE web_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_email VARCHAR(255),
  status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'PREPARED', 'DELIVERED', 'CANCELLED')),
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE web_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  web_order_id UUID NOT NULL REFERENCES web_orders(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL
);

CREATE TABLE stock_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  web_order_id UUID REFERENCES web_orders(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  status VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE', 'RELEASED', 'CONSUMED')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE local_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL CHECK (status IN ('COMPLETED', 'CANCELLED')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE local_sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  local_sale_id UUID NOT NULL REFERENCES local_sales(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_type VARCHAR(20) NOT NULL CHECK (sale_type IN ('WEB_ORDER', 'LOCAL_SALE')),
  reference_id UUID NOT NULL,
  method VARCHAR(20) NOT NULL CHECK (method IN ('CASH', 'DEBIT', 'TRANSFER')),
  amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE VIEW inventory AS
SELECT
  p.id AS product_id,
  COALESCE(SUM(CASE
    WHEN m.type = 'IN' THEN m.quantity
    WHEN m.type = 'OUT' THEN -m.quantity
    WHEN m.type = 'ADJUST' THEN m.quantity
    ELSE 0
  END), 0) AS stock_on_hand
FROM products p
LEFT JOIN inventory_movements m ON m.product_id = p.id
GROUP BY p.id;

CREATE INDEX idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_created ON inventory_movements(created_at);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_web_orders_status ON web_orders(status);
CREATE INDEX idx_reservations_status ON stock_reservations(status);
