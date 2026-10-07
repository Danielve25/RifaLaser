# DESPLIEGUE — Rifa Láser

Solo comandos. Nada aquí se ejecutó al escribir esto.

## Piezas sueltas

- `backend/` Go. Solo sirve `/api/*` y `/ws/*`. Nunca sirve el `dist`.
- `frontend/` Vite. Solo habla por `VITE_API_URL` y `VITE_WS_URL`.
- Postgres aparte, con la URL que ya tienes.

## 1. Base de datos

```bash
# crea la base vacía (una vez)
createdb rifa_laser
```

```bash
# sube las tablas (desde backend/)
cd backend
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?sslmode=disable" \
  go run github.com/pressly/goose/v3/cmd/goose@v3.24.3 \
  -dir ../db/migrations postgres "$DATABASE_URL" up
```

Bajar (solo si hay que empezar de cero):

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?sslmode=disable" \
  go run github.com/pressly/goose/v3/cmd/goose@v3.24.3 \
  -dir ../db/migrations postgres "$DATABASE_URL" down
```

## 2. Backend

```bash
cd backend
cp .env.example .env
# edita .env: PORT, DATABASE_URL, JWT_SECRET (mínimo 32 letras), CORS_ORIGIN
go vet ./...
go run ./cmd/api
```

Queda en `http://localhost:8080`. Salud en `GET /api/health`.

## 3. Frontend

```bash
cd frontend
cp .env.example .env
# edita .env: VITE_API_URL=http://localhost:8080/api, VITE_WS_URL=ws://localhost:8080/ws
npm install
npm run build
npm run dev -- --port 5173
```

Queda en `http://localhost:5173`. El `dist/` se sirve con cualquier hosting
estático aparte, nunca desde el Go.

## 4. Primer admin

Regístrate normal en `/registro` y luego en la base:

```sql
UPDATE users SET is_admin = true WHERE whatsapp = '3000000001';
```

## 5. Producir y jugar (como admin)

1. `POST /api/admin/products` con lo que se produjo. Cada producto crea sus
   boletas de una vez, con tema al azar que no dice el premio.
2. Si algo quedó a medias, `POST /api/admin/stock/sincronizar` completa lo que falte.
3. `POST /api/admin/codes/batch` `{"cantidad": N}` y reparte los `LSR-XXXX` por WhatsApp.

## 6. Juego (como cliente)

1. `/registro` con nombre, teléfono, dirección y clave. El teléfono es único:
   sirve para entrar y para avisarte por WhatsApp.
2. `/canjear` mete un código por jugada, repite para más jugadas.
3. `/jugar/galeria` escoge tarjeta o `/jugar/ruleta` gira.
4. `/mis-premios` muestra cada premio con entrega en 5 días y fecha.

## Notas

- Todo lo que cambia datos va por REST con `SELECT FOR UPDATE`. El socket
  solo avisa (`ticket_ocupada`, `stock_agotado`, `pedido_creado`).
- Si el socket se cae, el frontend sigue por polling cada 10 segundos.
- Ante fallo de red el cliente reintenta una vez; el 409 se muestra tal cual.
- Límites: login 10/min y canje 20/min por IP.
- Todo el stock juega a la vez, sin rondas. Cuando se ocupa la última boleta
  se avisa `stock_agotado`.
