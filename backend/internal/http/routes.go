package http

import (
	"time"

	nethttp "net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"rifa-laser/backend/internal/auth"
)

func Rutas(db *pgxpool.Pool) *chi.Mux {
	r := chi.NewRouter()
	ah := &auth.Manejador{DB: db}

	r.Get("/health", func(w nethttp.ResponseWriter, req *nethttp.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"ok":true}`))
	})

	r.Route("/auth", func(x chi.Router) {
		x.Post("/register", ah.Registrar)
		x.With(auth.LimitePorIP(10, time.Minute)).Post("/login", ah.Entrar)
	})

	r.With(auth.PedirLogin).Get("/me", ah.Yo)
	r.With(auth.PedirLogin).Patch("/me", ah.CambiarPerfil)

	return r
}
