package ws

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"sync"

	"github.com/coder/websocket"
	"github.com/go-chi/chi/v5"

	"rifa-laser/backend/internal/auth"
)

type Centro struct {
	mu    sync.Mutex
	salas map[int]map[*websocket.Conn]bool
}

var Hub = &Centro{salas: map[int]map[*websocket.Conn]bool{}}

func (c *Centro) mandarTexto(ronda int, texto string) {
	c.mu.Lock()
	sala := c.salas[ronda]
	vivos := make([]*websocket.Conn, 0, len(sala))
	for conn := range sala {
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

func textoCerrada() string {
	b, _ := json.Marshal(map[string]string{"tipo": "ronda_cerrada"})
	return string(b)
}

func textoPedido(order int) string {
	b, _ := json.Marshal(map[string]any{"tipo": "pedido_creado", "order_id": order})
	return string(b)
}

func AnunciaOcupada(ronda, ticket, order int, cerrada bool) {
	Hub.mandarTexto(ronda, textoOcupada(ticket))
	Hub.mandarTexto(ronda, textoPedido(order))
	if cerrada {
		Hub.mandarTexto(ronda, textoCerrada())
	}
}

func (c *Centro) Entrar(w http.ResponseWriter, r *http.Request) {
	u, err := auth.LeerToken(r.URL.Query().Get("token"))
	if err != nil || u.ID == 0 {
		http.Error(w, `{"error":"sesion mala"}`, http.StatusUnauthorized)
		return
	}
	ronda, _ := strconv.Atoi(chi.URLParam(r, "id"))
	conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{InsecureSkipVerify: true})
	if err != nil {
		return
	}
	c.mu.Lock()
	if c.salas[ronda] == nil {
		c.salas[ronda] = map[*websocket.Conn]bool{}
	}
	c.salas[ronda][conn] = true
	c.mu.Unlock()
	defer func() {
		c.mu.Lock()
		delete(c.salas[ronda], conn)
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
