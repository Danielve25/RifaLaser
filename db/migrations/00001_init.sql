-- +goose Up
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  direccion TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE rounds (
  id SERIAL PRIMARY KEY,
  total_tickets INT NOT NULL DEFAULT 100 CHECK (total_tickets > 0 AND total_tickets <= 100),
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador','activa','cerrada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  stock_inicial INT NOT NULL CHECK (stock_inicial > 0),
  es_raro BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE codes (
  id SERIAL PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  estado TEXT NOT NULL DEFAULT 'creado' CHECK (estado IN ('creado','canjeado')),
  canjeado_por INT REFERENCES users(id),
  canjeado_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  round_id INT NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  codigo_visual TEXT NOT NULL,
  tema TEXT NOT NULL,
  producto_id INT NOT NULL REFERENCES products(id),
  estado TEXT NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible','ocupada')),
  ocupada_por INT REFERENCES users(id),
  codigo_canje_id INT REFERENCES codes(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (round_id, codigo_visual),
  UNIQUE (round_id, tema)
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  ticket_id INT NOT NULL UNIQUE REFERENCES tickets(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id),
  producto_id INT NOT NULL REFERENCES products(id),
  producto_nombre TEXT NOT NULL,
  producto_descripcion TEXT NOT NULL DEFAULT '',
  es_raro BOOLEAN NOT NULL DEFAULT FALSE,
  nombre TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL,
  direccion_entrega TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'ganado' CHECK (estado IN ('ganado','preparacion','en_camino','entregado')),
  ganado_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  entrega_estimada DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tickets_round_estado ON tickets(round_id, estado);
CREATE INDEX idx_codes_estado ON codes(estado);
CREATE INDEX idx_orders_user ON orders(user_id);

-- +goose Down
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS codes;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS rounds;
DROP TABLE IF EXISTS users;
