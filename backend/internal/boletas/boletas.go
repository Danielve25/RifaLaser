package boletas

import (
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"strconv"

	"github.com/jackc/pgx/v5/pgxpool"

	"rifa-laser/backend/internal/rounds"
)

type Manejador struct {
	DB *pgxpool.Pool
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

type Estado struct {
	Total        int `json:"total"`
	Disponibles  int `json:"disponibles"`
	Ocupadas     int `json:"ocupadas"`
}

func escribir(w http.ResponseWriter, codigo int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(codigo)
	_ = json.NewEncoder(w).Encode(v)
}

// Sincroniza crea las boletas que falten según el stock, sin repetir.
func Sincroniza(ctx context.Context, db *pgxpool.Pool) (int, error) {
	tx, err := db.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)
	hechas := map[int]int{}
	rows, err := tx.Query(ctx, `SELECT producto_id, count(*) FROM tickets GROUP BY producto_id`)
	if err != nil {
		return 0, err
	}
	for rows.Next() {
		var pid, n int
		_ = rows.Scan(&pid, &n)
		hechas[pid] = n
	}
	rows.Close()
	type prod struct {
		id     int
		stock  int
	}
	var ps []prod
	rows, err = tx.Query(ctx, `SELECT id, stock_inicial FROM products ORDER BY id`)
	if err != nil {
		return 0, err
	}
	for rows.Next() {
		var p prod
		_ = rows.Scan(&p.id, &p.stock)
		ps = append(ps, p)
	}
	rows.Close()
	faltan := []int{}
	for _, p := range ps {
		for i := hechas[p.id]; i < p.stock; i++ {
			faltan = append(faltan, p.id)
		}
	}
	if len(faltan) == 0 {
		_ = tx.Commit(ctx)
		return 0, nil
	}
	rand.Shuffle(len(faltan), func(a, b int) { faltan[a], faltan[b] = faltan[b], faltan[a] })
	var maximo int
	_ = tx.QueryRow(ctx, `SELECT COALESCE(MAX(codigo_visual::int),0) FROM tickets`).Scan(&maximo)
	temas := rounds.TemasAlAzar(len(faltan))
	ancho := len(strconv.Itoa(maximo + len(faltan)))
	if ancho < 3 {
		ancho = 3
	}
	for i, pid := range faltan {
		visual := fmt.Sprintf("%0*d", ancho, maximo+i+1)
		if _, err := tx.Exec(ctx,
			`INSERT INTO tickets(codigo_visual, tema, producto_id) VALUES($1,$2,$3)`,
			visual, temas[i], pid); err != nil {
			return 0, err
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return 0, err
	}
	return len(faltan), nil
}

func (m *Manejador) Lista(w http.ResponseWriter, r *http.Request) {
	rows, err := m.DB.Query(r.Context(),
		`SELECT t.id, t.codigo_visual, t.tema, t.producto_id, p.nombre, p.es_raro, t.estado
		 FROM tickets t JOIN products p ON p.id=t.producto_id
		 ORDER BY t.codigo_visual`)
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

func (m *Manejador) Estado(w http.ResponseWriter, r *http.Request) {
	var e Estado
	_ = m.DB.QueryRow(r.Context(),
		`SELECT count(*), count(*) FILTER (WHERE estado='disponible'),
			count(*) FILTER (WHERE estado='ocupada') FROM tickets`).Scan(&e.Total, &e.Disponibles, &e.Ocupadas)
	escribir(w, 200, map[string]any{"stock": e})
}

func (m *Manejador) Sincronizar(w http.ResponseWriter, r *http.Request) {	n, err := Sincroniza(r.Context(), m.DB)
	if err != nil {
		escribir(w, 500, map[string]string{"error": "no se pudo"})
		return
	}
	escribir(w, 201, map[string]any{"creadas": n})
}

var _ = rand.Intn
