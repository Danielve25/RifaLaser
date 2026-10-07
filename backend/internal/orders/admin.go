package orders

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type PedidoAdmin struct {
	Pedido
	Nombre   string `json:"nombre"`
	Whatsapp string `json:"whatsapp"`
}

func (m *Manejador) ListaAdmin(w http.ResponseWriter, r *http.Request) {
	rows, err := m.DB.Query(r.Context(),
		`SELECT o.id, o.ticket_id, t.codigo_visual, t.tema, o.producto_nombre, o.es_raro,
			o.direccion_entrega, o.estado, o.ganado_at::text, o.entrega_estimada::text,
			o.nombre, o.whatsapp
		 FROM orders o JOIN tickets t ON t.id=o.ticket_id
		 ORDER BY o.id DESC`)
	if err != nil {
		escribir(w, 500, map[string]string{"error": "no se pudo"})
		return
	}
	defer rows.Close()
	out := []PedidoAdmin{}
	for rows.Next() {
		var p PedidoAdmin
		_ = rows.Scan(&p.ID, &p.TicketID, &p.CodigoVisual, &p.Tema, &p.Producto,
			&p.EsRaro, &p.DireccionEntrega, &p.Estado, &p.GanadoAt, &p.EntregaEstimada,
			&p.Nombre, &p.Whatsapp)
		out = append(out, p)
	}
	escribir(w, 200, map[string]any{"orders": out})
}

func (m *Manejador) CambiarEstado(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var in struct {
		Estado string `json:"estado"`
	}
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		escribir(w, 400, map[string]string{"error": "datos mal"})
		return
	}
	switch in.Estado {
	case "ganado", "preparacion", "en_camino", "entregado":
	default:
		escribir(w, 400, map[string]string{"error": "estado malo"})
		return
	}
	tag, err := m.DB.Exec(r.Context(), `UPDATE orders SET estado=$2 WHERE id=$1`, id, in.Estado)
	if err != nil || tag.RowsAffected() == 0 {
		escribir(w, 404, map[string]string{"error": "no hay pedido"})
		return
	}
	escribir(w, 200, map[string]any{"ok": true, "estado": in.Estado})
}
