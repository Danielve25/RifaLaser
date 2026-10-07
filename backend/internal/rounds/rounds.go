package rounds

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Manejador struct {
	DB *pgxpool.Pool
}

type Ronda struct {
	ID           int    `json:"id"`
	TotalTickets int    `json:"total_tickets"`
	Estado       string `json:"estado"`
}

type Boleta struct {
	ID           int    `json:"id"`
	CodigoVisual string `json:"codigo_visual"`
	Tema         string `json:"tema"`
	ProductoID   int    `json:"producto_id"`
	Producto     string `json:"producto"`
	EsRaro       bool   `json:"es_raro"`
	Estado       string `json:"estado"`
}

func escribir(w http.ResponseWriter, codigo int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(codigo)
	_ = json.NewEncoder(w).Encode(v)
}

func (m *Manejador) Crear(w http.ResponseWriter, r *http.Request) {
	var total int
	_ = m.DB.QueryRow(r.Context(), `SELECT COALESCE(SUM(stock_inicial),0) FROM products`).Scan(&total)
	if total <= 0 {
		escribir(w, 400, map[string]string{"error": "primero carga el inventario"})
		return
	}
	if total > 5000 {
		escribir(w, 400, map[string]string{"error": "mucho stock, parte la produccion"})
		return
	}
	var x Ronda
	err := m.DB.QueryRow(r.Context(),
		`INSERT INTO rounds(total_tickets, estado) VALUES($1,'borrador') RETURNING id, total_tickets, estado`,
		total,
	).Scan(&x.ID, &x.TotalTickets, &x.Estado)
	if err != nil {
		escribir(w, 500, map[string]string{"error": "no se pudo"})
		return
	}
	escribir(w, 201, map[string]any{"ronda": x})
}

func (m *Manejador) Activa(w http.ResponseWriter, r *http.Request) {
	var x Ronda
	err := m.DB.QueryRow(r.Context(),
		`SELECT id, total_tickets, estado FROM rounds WHERE estado='activa' ORDER BY id DESC LIMIT 1`,
	).Scan(&x.ID, &x.TotalTickets, &x.Estado)
	if err != nil {
		escribir(w, 200, map[string]any{"ronda": nil})
		return
	}
	escribir(w, 200, map[string]any{"ronda": x})
}

func (m *Manejador) Boletas(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	rows, err := m.DB.Query(r.Context(),
		`SELECT t.id, t.codigo_visual, t.tema, t.producto_id, p.nombre, p.es_raro, t.estado
		 FROM tickets t JOIN products p ON p.id=t.producto_id
		 WHERE t.round_id=$1 ORDER BY t.codigo_visual`, id)
	if err != nil {
		escribir(w, 500, map[string]string{"error": "no se pudo"})
		return
	}
	defer rows.Close()
	out := []Boleta{}
	for rows.Next() {
		var b Boleta
		_ = rows.Scan(&b.ID, &b.CodigoVisual, &b.Tema, &b.ProductoID, &b.Producto, &b.EsRaro, &b.Estado)
		out = append(out, b)
	}
	escribir(w, 200, map[string]any{"tickets": out})
}

func (m *Manejador) Generar(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var total int
	var estado string
	err := m.DB.QueryRow(r.Context(), `SELECT total_tickets, estado FROM rounds WHERE id=$1`, id).Scan(&total, &estado)
	if err != nil {
		escribir(w, 404, map[string]string{"error": "no hay ronda"})
		return
	}
	var ya int
	_ = m.DB.QueryRow(r.Context(), `SELECT count(*) FROM tickets WHERE round_id=$1`, id).Scan(&ya)
	if ya > 0 {
		escribir(w, 409, map[string]string{"error": "ya tiene boletas"})
		return
	}
	type prod struct {
		id     int
		nombre string
		stock  int
	}
	rows, err := m.DB.Query(r.Context(), `SELECT id, nombre, stock_inicial FROM products ORDER BY id`)
	if err != nil {
		escribir(w, 500, map[string]string{"error": "no se pudo"})
		return
	}
	var ps []prod
	suma := 0
	for rows.Next() {
		var p prod
		_ = rows.Scan(&p.id, &p.nombre, &p.stock)
		ps = append(ps, p)
		suma += p.stock
	}
	rows.Close()
	if suma != total {
		escribir(w, 400, map[string]string{"error": fmt.Sprintf("stock suma %d y la ronda pide %d", suma, total)})
		return
	}
	bolsa := []prod{}
	for _, p := range ps {
		for i := 0; i < p.stock; i++ {
			bolsa = append(bolsa, p)
		}
	}
	rand.Shuffle(len(bolsa), func(a, b int) { bolsa[a], bolsa[b] = bolsa[b], bolsa[a] })
	// la carta va volteada: el tema no dice el premio
	temas := temasAlAzar(total)

	tx, err := m.DB.Begin(r.Context())
	if err != nil {
		escribir(w, 500, map[string]string{"error": "no se pudo"})
		return
	}
	defer tx.Rollback(r.Context())
	ancho := len(strconv.Itoa(total))
	if ancho < 3 {
		ancho = 3
	}
	for i := 0; i < total; i++ {
		visual := fmt.Sprintf("%0*d", ancho, i+1)
		_, err = tx.Exec(r.Context(),
			`INSERT INTO tickets(round_id, codigo_visual, tema, producto_id) VALUES($1,$2,$3,$4)`,
			id, visual, temas[i], bolsa[i].id)
		if err != nil {
			escribir(w, 500, map[string]string{"error": "no se pudo"})
			return
		}
	}
	_, _ = tx.Exec(r.Context(), `UPDATE rounds SET estado='activa' WHERE id=$1`, id)
	_ = tx.Commit(r.Context())
	escribir(w, 201, map[string]any{"creadas": total})
}
