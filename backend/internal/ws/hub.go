package ws

import (
	"context"
	"encoding/json"
	"net/http"
	"sync"

	"github.com/coder/websocket"

	"rifa-laser/backend/internal/auth"
)

type Centro struct {
	mu    sync.Mutex
	vivos map[*websocket.Conn]bool
}

var Hub = &Centro{vivos: map[*websocket.Conn]bool{}}

func (c *Centro) mandarTexto(texto string) {
	c.mu.Lock()
	vivos := make([]*websocket.Conn, 0, len(c.vivos))
	for conn := range c.vivos {
		vivos = append(vivos, conn)
	}
	c.mu.Unlock()
	ctx := context.Background()
	for _, conn := range vivos {
		func() {
			defer func() { _ = recover() }()
			_ = conn.Write(ctx, websocket.MessageText, []byte(texto))
		}()
	}
}

func textoOcupada(ticket int) string {
	b, _ := json.Marshal(map[string]any{"tipo": "ticket_ocupada", "ticket_id": ticket})
	return string(b)
}

func textoAgotado() string {
	b, _ := json.Marshal(map[string]string{"tipo": "stock_agotado"})
	return string(b)
}

func textoPedido(order int) string {
	b, _ := json.Marshal(map[string]any{"tipo": "pedido_creado", "order_id": order})
	return string(b)
}

func AnunciaOcupada(ticket, order int, agotado bool) {
	Hub.mandarTexto(textoOcupada(ticket))
	Hub.mandarTexto(textoPedido(order))
	if agotado {
		Hub.mandarTexto(textoAgotado())
	}
}

func (c *Centro) Entrar(w http.ResponseWriter, r *http.Request) {
	u, err := auth.LeerToken(r.URL.Query().Get("token"))
	if err != nil || u.ID == 0 {
		http.Error(w, `{"error":"sesion mala"}`, http.StatusUnauthorized)
		return
	}
	conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{InsecureSkipVerify: true})
	if err != nil {
		return
	}
	c.mu.Lock()
	c.vivos[conn] = true
	c.mu.Unlock()
	defer func() {
		c.mu.Lock()
		delete(c.vivos, conn)
		c.mu.Unlock()
		_ = conn.Close(websocket.StatusNormalClosure, "")
	}()
	for {
		_, _, err := conn.Read(r.Context())
		if err != nil {
			return
		}
	}
}
