package ws

import (
	"context"
	"encoding/json"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/coder/websocket"
	"github.com/go-chi/chi/v5"

	"rifa-laser/backend/internal/auth"
)

func servidorPrueba() *httptest.Server {
	r := chi.NewRouter()
	r.Get("/rounds/{id}", Hub.Entrar)
	return httptest.NewServer(r)
}

func TestAvisoLlega(t *testing.T) {
	u := auth.Usuario{ID: 7, Email: "x@y.com"}
	token, err := auth.CrearToken(u)
	if err != nil {
		t.Fatal(err)
	}
	srv := servidorPrueba()
	defer srv.Close()
	url := "ws" + srv.URL[4:] + "/rounds/9?token=" + token
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	c1, _, err := websocket.Dial(ctx, url, nil)
	if err != nil {
		t.Fatal(err)
	}
	defer c1.Close(websocket.StatusNormalClosure, "")
	c2, _, err := websocket.Dial(ctx, url, nil)
	if err != nil {
		t.Fatal(err)
	}
	defer c2.Close(websocket.StatusNormalClosure, "")
	time.Sleep(200 * time.Millisecond)
	AnunciaOcupada(9, 12, 34, false)
	leer := func(c *websocket.Conn) map[string]any {
		_, b, err := c.Read(ctx)
		if err != nil {
			t.Fatal(err)
		}
		var m map[string]any
		_ = json.Unmarshal(b, &m)
		return m
	}
	m1 := leer(c1)
	if m1["tipo"] != "ticket_ocupada" || int(m1["ticket_id"].(float64)) != 12 {
		t.Fatalf("aviso malo: %v", m1)
	}
	// el segundo recibe pedido_creado despues de su ticket_ocupada
	_ = leer(c2)
	m2 := leer(c2)
	if m2["tipo"] != "pedido_creado" || int(m2["order_id"].(float64)) != 34 {
		t.Fatalf("aviso malo: %v", m2)
	}
}

func TestSinTokenNoEntra(t *testing.T) {
	srv := servidorPrueba()
	defer srv.Close()
	url := "ws" + srv.URL[4:] + "/rounds/1"
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, resp, err := websocket.Dial(ctx, url, nil)
	if err == nil {
		t.Fatal("debió fallar sin token")
	}
	if resp != nil && resp.StatusCode != 401 {
		t.Fatalf("esperaba 401, dio %d", resp.StatusCode)
	}
}
