-- +goose Up
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_round_id_codigo_visual_key;
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_round_id_key;
ALTER TABLE tickets DROP COLUMN IF EXISTS round_id;
ALTER TABLE tickets ADD CONSTRAINT tickets_codigo_visual_uniq UNIQUE (codigo_visual);
DROP TABLE IF EXISTS rounds;

-- +goose Down
CREATE TABLE rounds (
  id SERIAL PRIMARY KEY,
  total_tickets INT NOT NULL DEFAULT 100 CHECK (total_tickets > 0 AND total_tickets <= 5000),
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador','activa','cerrada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_codigo_visual_uniq;
ALTER TABLE tickets ADD COLUMN round_id INT REFERENCES rounds(id) ON DELETE CASCADE;
