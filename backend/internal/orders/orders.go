package orders

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"rifa-laser/backend/internal/auth"
	"rifa-laser/backend/internal/ws"
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
	ProductoImagen   string `json:"producto_imagen"`
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

func (m *Manejador) ocuparBoleta(w http.ResponseWriter, r *http.Request, ticketID, userID int) (Pedido, int, string, bool) {
	var out Pedido
	tx, err := m.DB.Begin(r.Context())
	if err != nil {
		return out, 500, "no se pudo", false
	}
	defer tx.Rollback(r.Context())

	var codeID int
	// lock de una jugada libre del usuario
	err = tx.QueryRow(r.Context(),
		`SELECT c.id FROM codes c WHERE c.canjeado_por=$1 AND c.estado='canjeado'
		 AND NOT EXISTS (SELECT 1 FROM tickets t WHERE t.codigo_canje_id=c.id)
		 LIMIT 1 FOR UPDATE`, userID).Scan(&codeID)
	if err != nil {
		return out, 409, "canjea un codigo primero", false
	}
	var tID, prodID int
	var tEstado string
	// lock de la boleta pedida
	err = tx.QueryRow(r.Context(),
		`SELECT id, producto_id, estado FROM tickets WHERE id=$1 FOR UPDATE`, ticketID,
	).Scan(&tID, &prodID, &tEstado)
	if err != nil {
		return out, 404, "esa boleta no existe", false
	}
	if tEstado != "disponible" {
		return out, 409, "esa boleta ya se ocupo", false
	}
	var prodNombre, prodDesc, prodImg string
	var esRaro bool
	_ = tx.QueryRow(r.Context(),
		`SELECT nombre, descripcion, es_raro, imagen_url FROM products WHERE id=$1`, prodID,
	).Scan(&prodNombre, &prodDesc, &esRaro, &prodImg)
	var nombre, whatsapp, direccion string
	_ = tx.QueryRow(r.Context(),
		`SELECT nombre, whatsapp, direccion FROM users WHERE id=$1`, userID,
	).Scan(&nombre, &whatsapp, &direccion)
	var visual, tema string
	_, err = tx.Exec(r.Context(),
		`UPDATE tickets SET estado='ocupada', ocupada_por=$2, codigo_canje_id=$3 WHERE id=$1`,
		tID, userID, codeID)
	if err != nil {
		return out, 500, "no se pudo", false
	}
	_ = tx.QueryRow(r.Context(), `SELECT codigo_visual, tema FROM tickets WHERE id=$1`, tID).Scan(&visual, &tema)
	estimada := time.Now().AddDate(0, 0, 5).Format("2006-01-02")
	var orderID int
	var ganadoTime time.Time
	// la direccion queda fija en el pedido aunque el perfil cambie despues
	err = tx.QueryRow(r.Context(),
		`INSERT INTO orders(ticket_id, user_id, producto_id, producto_nombre, producto_descripcion,
		 producto_imagen, es_raro, nombre, whatsapp, direccion_entrega, estado, entrega_estimada)
		 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'ganado',$11)
		 RETURNING id, ganado_at`, tID, userID, prodID, prodNombre, prodDesc, prodImg,
		esRaro, nombre, whatsapp, direccion, estimada,
	).Scan(&orderID, &ganadoTime)
	if err != nil {
		return out, 500, "no se pudo", false
	}
	var libres int
	_ = tx.QueryRow(r.Context(),
		`SELECT count(*) FROM tickets WHERE estado='disponible'`).Scan(&libres)
	if err := tx.Commit(r.Context()); err != nil {
		return out, 500, "no se pudo", false
	}
	out = Pedido{
		ID: orderID, TicketID: tID, CodigoVisual: visual, Tema: tema,
		Producto: prodNombre, ProductoImagen: prodImg, EsRaro: esRaro, DireccionEntrega: direccion,
		Estado: "ganado", GanadoAt: ganadoTime.Format(time.RFC3339), EntregaEstimada: estimada,
	}
	agotado := libres == 0
	return out, 200, "", agotado
}

func (m *Manejador) Escoger(w http.ResponseWriter, r *http.Request) {
	u, ok := auth.UsuarioDe(r.Context())
	if !ok {
		escribir(w, 401, map[string]string{"error": "sin sesion"})
		return
	}
	var in struct {
		TicketID int `json:"ticket_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil || in.TicketID == 0 {
		escribir(w, 400, map[string]string{"error": "falta ticket_id"})
		return
	}
	pedido, codigo, msg, agotado := m.ocuparBoleta(w, r, in.TicketID, u.ID)
	if codigo != 200 {
		escribir(w, codigo, map[string]string{"error": msg})
		return
	}
	ws.AnunciaOcupada(pedido.TicketID, pedido.ID, agotado)
	escribir(w, 200, map[string]any{"order": pedido})
}

func (m *Manejador) Mios(w http.ResponseWriter, r *http.Request) {
	u, ok := auth.UsuarioDe(r.Context())
	if !ok {
		escribir(w, 401, map[string]string{"error": "sin sesion"})
		return
	}
	rows, err := m.DB.Query(r.Context(),
		`SELECT o.id, o.ticket_id, t.codigo_visual, t.tema, o.producto_nombre, o.producto_imagen,
			o.es_raro, o.direccion_entrega, o.estado, o.ganado_at::text, o.entrega_estimada::text
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
		_ = rows.Scan(&p.ID, &p.TicketID, &p.CodigoVisual, &p.Tema, &p.Producto, &p.ProductoImagen,
			&p.EsRaro, &p.DireccionEntrega, &p.Estado, &p.GanadoAt, &p.EntregaEstimada)
		out = append(out, p)
	}
	escribir(w, 200, map[string]any{"orders": out})
}
