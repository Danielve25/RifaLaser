package orders

import (
	"math/rand"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"

	"rifa-laser/backend/internal/auth"
	"rifa-laser/backend/internal/ws"
)

type candidato struct {
	ticketID int
	prodID   int
	peso     int
}

type grupo struct {
	prodID int
	peso   int
}

func sortearRuleta(grupos []grupo) grupo {
	total := 0
	for _, g := range grupos {
		total += g.peso
	}
	tiro := rand.Intn(total)
	for _, g := range grupos {
		tiro -= g.peso
		if tiro < 0 {
			return g
		}
	}
	return grupos[len(grupos)-1]
}

func (m *Manejador) Girar(w http.ResponseWriter, r *http.Request) {
	u, ok := auth.UsuarioDe(r.Context())
	if !ok {
		escribir(w, 401, map[string]string{"error": "sin sesion"})
		return
	}
	roundID, _ := strconv.Atoi(chi.URLParam(r, "id"))
	tx, err := m.DB.Begin(r.Context())
	if err != nil {
		escribir(w, 500, map[string]string{"error": "no se pudo"})
		return
	}
	defer tx.Rollback(r.Context())

	var codeID int
	// lock de una jugada libre del usuario
	err = tx.QueryRow(r.Context(),
		`SELECT c.id FROM codes c WHERE c.canjeado_por=$1 AND c.estado='canjeado'
		 AND NOT EXISTS (SELECT 1 FROM tickets t WHERE t.codigo_canje_id=c.id)
		 LIMIT 1 FOR UPDATE`, u.ID).Scan(&codeID)
	if err != nil {
		escribir(w, 409, map[string]string{"error": "canjea un codigo primero"})
		return
	}
	rows, err := tx.Query(r.Context(),
		`SELECT t.id, t.producto_id, p.stock_inicial FROM tickets t
		 JOIN products p ON p.id=t.producto_id
		 WHERE t.round_id=$1 AND t.estado='disponible'`, roundID)
	if err != nil {
		escribir(w, 500, map[string]string{"error": "no se pudo"})
		return
	}
	var lista []candidato
	porProd := map[int][]int{}
	pesoProd := map[int]int{}
	for rows.Next() {
		var c candidato
		_ = rows.Scan(&c.ticketID, &c.prodID, &c.peso)
		lista = append(lista, c)
		porProd[c.prodID] = append(porProd[c.prodID], c.ticketID)
		pesoProd[c.prodID] = c.peso
	}
	rows.Close()
	if len(lista) == 0 {
		escribir(w, 409, map[string]string{"error": "la ronda se cerro"})
		return
	}
	// peso inicial: lo comun sostiene, lo raro celebra
	grupos := []grupo{}
	for prodID, peso := range pesoProd {
		grupos = append(grupos, grupo{prodID: prodID, peso: peso})
	}
	elegido := sortearRuleta(grupos)
	ids := porProd[elegido.prodID]
	ticketID := ids[rand.Intn(len(ids))]

	var tEstado string
	var prodID int
	err = tx.QueryRow(r.Context(),
		`SELECT producto_id, estado FROM tickets WHERE id=$1 FOR UPDATE`, ticketID,
	).Scan(&prodID, &tEstado)
	if err != nil || tEstado != "disponible" {
		escribir(w, 409, map[string]string{"error": "intenta de nuevo"})
		return
	}
	var prodNombre, prodDesc string
	var esRaro bool
	_ = tx.QueryRow(r.Context(),
		`SELECT nombre, descripcion, es_raro FROM products WHERE id=$1`, prodID,
	).Scan(&prodNombre, &prodDesc, &esRaro)
	var nombre, whatsapp, direccion string
	_ = tx.QueryRow(r.Context(),
		`SELECT nombre, whatsapp, direccion FROM users WHERE id=$1`, u.ID,
	).Scan(&nombre, &whatsapp, &direccion)
	var visual, tema string
	_, err = tx.Exec(r.Context(),
		`UPDATE tickets SET estado='ocupada', ocupada_por=$2, codigo_canje_id=$3 WHERE id=$1`,
		ticketID, u.ID, codeID)
	if err != nil {
		escribir(w, 500, map[string]string{"error": "no se pudo"})
		return
	}
	_ = tx.QueryRow(r.Context(), `SELECT codigo_visual, tema FROM tickets WHERE id=$1`, ticketID).Scan(&visual, &tema)
	estimada := time.Now().AddDate(0, 0, 5).Format("2006-01-02")
	var orderID int
	var ganadoTime time.Time
	// la direccion queda fija en el pedido aunque el perfil cambie despues
	err = tx.QueryRow(r.Context(),
		`INSERT INTO orders(ticket_id, user_id, producto_id, producto_nombre, producto_descripcion,
		 es_raro, nombre, whatsapp, direccion_entrega, estado, entrega_estimada)
		 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'ganado',$10)
		 RETURNING id, ganado_at`, ticketID, u.ID, prodID, prodNombre, prodDesc,
		esRaro, nombre, whatsapp, direccion, estimada,
	).Scan(&orderID, &ganadoTime)
	if err != nil {
		escribir(w, 500, map[string]string{"error": "no se pudo"})
		return
	}
	var libres int
	_ = tx.QueryRow(r.Context(),
		`SELECT count(*) FROM tickets WHERE round_id=$1 AND estado='disponible'`, roundID).Scan(&libres)
	if libres == 0 {
		_, _ = tx.Exec(r.Context(), `UPDATE rounds SET estado='cerrada' WHERE id=$1`, roundID)
	}
	if err := tx.Commit(r.Context()); err != nil {
		escribir(w, 500, map[string]string{"error": "no se pudo"})
		return
	}
	ws.AnunciaOcupada(roundID, ticketID, orderID, libres == 0)
	escribir(w, 200, map[string]any{"order": Pedido{
		ID: orderID, TicketID: ticketID, CodigoVisual: visual, Tema: tema,
		Producto: prodNombre, EsRaro: esRaro, DireccionEntrega: direccion,
		Estado: "ganado", GanadoAt: ganadoTime.Format(time.RFC3339), EntregaEstimada: estimada,
	}})
}
