-- +goose Up
ALTER TABLE products ADD COLUMN imagen_url TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN producto_imagen TEXT NOT NULL DEFAULT '';

-- +goose Down
ALTER TABLE products DROP COLUMN IF EXISTS imagen_url;
ALTER TABLE orders DROP COLUMN IF EXISTS producto_imagen;
