-- +goose Up
ALTER TABLE users DROP COLUMN email;
ALTER TABLE users ADD CONSTRAINT users_whatsapp_uniq UNIQUE (whatsapp);
ALTER TABLE orders DROP COLUMN email;

-- +goose Down
ALTER TABLE users DROP CONSTRAINT users_whatsapp_uniq;
ALTER TABLE users ADD COLUMN email TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN email TEXT NOT NULL DEFAULT '';
