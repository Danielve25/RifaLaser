package codes

import (
	"crypto/rand"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"

	"rifa-laser/backend/internal/auth"
)

type Manejador struct {
	DB *pgxpool.Pool
}

func escribir(w http.ResponseWriter, codigo int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(codigo)
	_ = json.NewEncoder(w).Encode(v)
}

func nuevoCodigo() string {
	letras := "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	b := make([]byte, 4)
	_, _ = rand.Read(b)
	for i := range b {
		b[i] = letras[int(b[i])%len(letras)]
	}
	return "LSR-" + string(b)
}

func (m *Manejador) Lote(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Cantidad int `json:"cantidad"`
	}
	_ = json.NewDecoder(r.Body).Decode(&in)
	if in.Cantidad < 1 || in.Cantidad > 1000 {
		escribir(w, 400, map[string]string{"error": "cantidad entre 1 y 1000"})
		return
	}
	out := []string{}
	for len(out) < in.Cantidad {
		c := nuevoCodigo()
		tag, err := m.DB.Exec(r.Context(), `INSERT INTO codes(codigo) VALUES($1) ON CONFLICT DO NOTHING`, c)
		if err != nil {
			escribir(w, 500, map[string]string{"error": "no se pudo"})
			return
		}
		if tag.RowsAffected() == 1 {
			out = append(out, c)
		}
	}
	escribir(w, 201, map[string]any{"codigos": out})
}

func (m *Manejador) Canjear(w http.ResponseWriter, r *http.Request) {
	u, ok := auth.UsuarioDe(r.Context())
	if !ok {
		escribir(w, 401, map[string]string{"error": "sin sesion"})
		return
	}
	var in struct {
		Codigo string `json:"codigo"`
	}
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil || in.Codigo == "" {
		escribir(w, 400, map[string]string{"error": "falta codigo"})
		return
	}
	codigo := strings.ToUpper(strings.TrimSpace(in.Codigo))
	tx, err := m.DB.Begin(r.Context())
	if err != nil {
		escribir(w, 500, map[string]string{"error": "no se pudo"})
		return
	}
	defer tx.Rollback(r.Context())
	var id int
	var estado string
	// lock del codigo para que dos canjes no lo tomen a la vez
	err = tx.QueryRow(r.Context(), `SELECT id, estado FROM codes WHERE codigo=$1 FOR UPDATE`, codigo).Scan(&id, &estado)
	if err != nil {
		escribir(w, 404, map[string]string{"error": "ese codigo no existe"})
		return
	}
	if estado != "creado" {
		escribir(w, 409, map[string]string{"error": "ese codigo ya se uso"})
		return
	}
	_, err = tx.Exec(r.Context(),
		`UPDATE codes SET estado='canjeado', canjeado_por=$2, canjeado_at=now() WHERE id=$1`, id, u.ID)
	if err != nil {
		escribir(w, 500, map[string]string{"error": "no se pudo"})
		return
	}
	if err := tx.Commit(r.Context()); err != nil {
		escribir(w, 500, map[string]string{"error": "no se pudo"})
		return
	}
	var n int
	_ = m.DB.QueryRow(r.Context(),
		`SELECT count(*) FROM codes c WHERE c.canjeado_por=$1 AND c.estado='canjeado'
		 AND NOT EXISTS (SELECT 1 FROM tickets t WHERE t.codigo_canje_id=c.id)`, u.ID).Scan(&n)
	escribir(w, 200, map[string]any{"participacion": true, "codigo": codigo, "jugadas": n})
}

func (m *Manejador) Saldo(w http.ResponseWriter, r *http.Request) {
	u, ok := auth.UsuarioDe(r.Context())
	if !ok {
		escribir(w, 401, map[string]string{"error": "sin sesion"})
		return
	}
	var n int
	_ = m.DB.QueryRow(r.Context(),
		`SELECT count(*) FROM codes c WHERE c.canjeado_por=$1 AND c.estado='canjeado'
		 AND NOT EXISTS (SELECT 1 FROM tickets t WHERE t.codigo_canje_id=c.id)`, u.ID).Scan(&n)
	escribir(w, 200, map[string]any{"jugadas": n})
}
