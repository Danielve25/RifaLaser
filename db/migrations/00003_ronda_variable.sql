-- +goose Up
ALTER TABLE rounds DROP CONSTRAINT IF EXISTS rounds_total_tickets_check;
ALTER TABLE rounds ADD CONSTRAINT rounds_total_ok CHECK (total_tickets > 0 AND total_tickets <= 5000);
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_round_id_tema_key;

-- +goose Down
ALTER TABLE rounds DROP CONSTRAINT IF EXISTS rounds_total_ok;
ALTER TABLE rounds ADD CONSTRAINT rounds_total_tickets_check CHECK (total_tickets > 0 AND total_tickets <= 100);
ALTER TABLE tickets ADD CONSTRAINT tickets_round_id_tema_key UNIQUE (round_id, tema);
