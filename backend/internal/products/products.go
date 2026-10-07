package products

import (
	"encoding/json"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"

	"rifa-laser/backend/internal/boletas"
)

type Manejador struct {
	DB *pgxpool.Pool
}

type Producto struct {
	ID           int    `json:"id"`
	Nombre       string `json:"nombre"`
	Descripcion  string `json:"descripcion"`
	StockInicial int    `json:"stock_inicial"`
	EsRaro       bool   `json:"es_raro"`
}

type Nuevo struct {
	Nombre       string `json:"nombre"`
	Descripcion  string `json:"descripcion"`
	StockInicial int    `json:"stock_inicial"`
	EsRaro       bool   `json:"es_raro"`
}

func escribir(w http.ResponseWriter, codigo int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(codigo)
	_ = json.NewEncoder(w).Encode(v)
}

func (m *Manejador) Crear(w http.ResponseWriter, r *http.Request) {
	var in Nuevo
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		escribir(w, 400, map[string]string{"error": "datos mal"})
		return
	}
	if len(in.Nombre) < 2 || in.StockInicial < 1 {
		escribir(w, 400, map[string]string{"error": "nombre corto o stock malo"})
		return
	}
	var p Producto
	err := m.DB.QueryRow(r.Context(),
		`INSERT INTO products(nombre, descripcion, stock_inicial, es_raro)
		 VALUES($1,$2,$3,$4) RETURNING id, nombre, descripcion, stock_inicial, es_raro`,
		in.Nombre, in.Descripcion, in.StockInicial, in.EsRaro,
	).Scan(&p.ID, &p.Nombre, &p.Descripcion, &p.StockInicial, &p.EsRaro)
	if err != nil {
		escribir(w, 500, map[string]string{"error": "no se pudo"})
		return
	}
	// todo el stock entra a la vez: crea sus boletas de una
	n, err := boletas.Sincroniza(r.Context(), m.DB)
	if err != nil {
		escribir(w, 500, map[string]string{"error": "se guardo pero falto sincronizar"})
		return
	}
	escribir(w, 201, map[string]any{"producto": p, "boletas": n})
}

func (m *Manejador) Listar(w http.ResponseWriter, r *http.Request) {
	rows, err := m.DB.Query(r.Context(),
		`SELECT id, nombre, descripcion, stock_inicial, es_raro FROM products ORDER BY id`)
	if err != nil {
		escribir(w, 500, map[string]string{"error": "no se pudo"})
		return
	}
	defer rows.Close()
	out := []Producto{}
	for rows.Next() {
		var p Producto
		_ = rows.Scan(&p.ID, &p.Nombre, &p.Descripcion, &p.StockInicial, &p.EsRaro)
		out = append(out, p)
	}
	escribir(w, 200, map[string]any{"productos": out})
}
