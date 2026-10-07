package orders

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"rifa-laser/backend/internal/auth"
)

type Manejador struct {
	DB *pgxpool.Pool
}

type Pedido struct {
	ID               int    `json:"id"`
	TicketID         int    `json:"ticket_id"`
	CodigoVisual     string `json:"codigo_visual"`
	Tema             string `json:"tema"`
	Producto         string `json:"producto"`
	EsRaro           bool   `json:"es_raro"`
	DireccionEntrega string `json:"direccion_entrega"`
	Estado           string `json:"estado"`
	GanadoAt         string `json:"ganado_at"`
	EntregaEstimada  string `json:"entrega_estimada"`
}

func escribir(w http.ResponseWriter, codigo int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(codigo)
	_ = json.NewEncoder(w).Encode(v)
}

func (m *Manejador) ocuparBoleta(w http.ResponseWriter, r *http.Request, ticketID, roundID, userID int) (Pedido, int, string) {
	var out Pedido
	tx, err := m.DB.Begin(r.Context())
	if err != nil {
		return out, 500, "no se pudo"
	}
	defer tx.Rollback(r.Context())

	var codeID int
	// lock de una jugada libre del usuario
	err = tx.QueryRow(r.Context(),
		`SELECT c.id FROM codes c WHERE c.canjeado_por=$1 AND c.estado='canjeado'
		 AND NOT EXISTS (SELECT 1 FROM tickets t WHERE t.codigo_canje_id=c.id)
		 LIMIT 1 FOR UPDATE`, userID).Scan(&codeID)
	if err != nil {
		return out, 409, "canjea un codigo primero"
	}
	var tID, prodID int
	var tEstado string
	var tRound int
	// lock de la boleta pedida
	err = tx.QueryRow(r.Context(),
		`SELECT id, round_id, producto_id, estado FROM tickets WHERE id=$1 FOR UPDATE`, ticketID,
	).Scan(&tID, &tRound, &prodID, &tEstado)
	if err != nil {
		return out, 404, "esa boleta no existe"
	}
	if tRound != roundID {
		return out, 400, "esa boleta no es de esta ronda"
	}
	if tEstado != "disponible" {
		return out, 409, "esa boleta ya se ocupo"
	}
	var prodNombre, prodDesc string
	var esRaro bool
	_ = tx.QueryRow(r.Context(),
		`SELECT nombre, descripcion, es_raro FROM products WHERE id=$1`, prodID,
	).Scan(&prodNombre, &prodDesc, &esRaro)
	var nombre, whatsapp, email, direccion string
	_ = tx.QueryRow(r.Context(),
		`SELECT nombre, whatsapp, email, direccion FROM users WHERE id=$1`, userID,
	).Scan(&nombre, &whatsapp, &email, &direccion)
	var visual, tema string
	_, err = tx.Exec(r.Context(),
		`UPDATE tickets SET estado='ocupada', ocupada_por=$2, codigo_canje_id=$3 WHERE id=$1`,
		tID, userID, codeID)
	if err != nil {
		return out, 500, "no se pudo"
	}
	_ = tx.QueryRow(r.Context(), `SELECT codigo_visual, tema FROM tickets WHERE id=$1`, tID).Scan(&visual, &tema)
	estimada := time.Now().AddDate(0, 0, 5).Format("2006-01-02")
	var orderID int
	var ganadoTime time.Time
	// la direccion queda fija en el pedido aunque el perfil cambie despues
	err = tx.QueryRow(r.Context(),
		`INSERT INTO orders(ticket_id, user_id, producto_id, producto_nombre, producto_descripcion,
		 es_raro, nombre, whatsapp, email, direccion_entrega, estado, entrega_estimada)
		 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'ganado',$11)
		 RETURNING id, ganado_at`, tID, userID, prodID, prodNombre, prodDesc,
		esRaro, nombre, whatsapp, email, direccion, estimada,
	).Scan(&orderID, &ganadoTime)
	if err != nil {
		return out, 500, "no se pudo"
	}
	var libres int
	_ = tx.QueryRow(r.Context(),
		`SELECT count(*) FROM tickets WHERE round_id=$1 AND estado='disponible'`, roundID).Scan(&libres)
	if libres == 0 {
		_, _ = tx.Exec(r.Context(), `UPDATE rounds SET estado='cerrada' WHERE id=$1`, roundID)
	}
	if err := tx.Commit(r.Context()); err != nil {
		return out, 500, "no se pudo"
	}
	out = Pedido{
		ID: orderID, TicketID: tID, CodigoVisual: visual, Tema: tema,
		Producto: prodNombre, EsRaro: esRaro, DireccionEntrega: direccion,
		Estado: "ganado", GanadoAt: ganadoTime.Format(time.RFC3339), EntregaEstimada: estimada,
	}
	return out, 200, ""
}

func (m *Manejador) Escoger(w http.ResponseWriter, r *http.Request) {
	u, ok := auth.UsuarioDe(r.Context())
	if !ok {
		escribir(w, 401, map[string]string{"error": "sin sesion"})
		return
	}
	roundID, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var in struct {
		TicketID int `json:"ticket_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil || in.TicketID == 0 {
		escribir(w, 400, map[string]string{"error": "falta ticket_id"})
		return
	}
	pedido, codigo, msg := m.ocuparBoleta(w, r, in.TicketID, roundID, u.ID)
	if codigo != 200 {
		escribir(w, codigo, map[string]string{"error": msg})
		return
	}
	escribir(w, 200, map[string]any{"order": pedido})
}

func (m *Manejador) Mios(w http.ResponseWriter, r *http.Request) {
	u, ok := auth.UsuarioDe(r.Context())
	if !ok {
		escribir(w, 401, map[string]string{"error": "sin sesion"})
		return
	}
	rows, err := m.DB.Query(r.Context(),
		`SELECT o.id, o.ticket_id, t.codigo_visual, t.tema, o.producto_nombre, o.es_raro,
			o.direccion_entrega, o.estado, o.ganado_at::text, o.entrega_estimada::text
		 FROM orders o JOIN tickets t ON t.id=o.ticket_id
		 WHERE o.user_id=$1 ORDER BY o.id DESC`, u.ID)
	if err != nil {
		escribir(w, 500, map[string]string{"error": "no se pudo"})
		return
	}
	defer rows.Close()
	out := []Pedido{}
	for rows.Next() {
		var p Pedido
		_ = rows.Scan(&p.ID, &p.TicketID, &p.CodigoVisual, &p.Tema, &p.Producto,
			&p.EsRaro, &p.DireccionEntrega, &p.Estado, &p.GanadoAt, &p.EntregaEstimada)
		out = append(out, p)
	}
	escribir(w, 200, map[string]any{"orders": out})
}
