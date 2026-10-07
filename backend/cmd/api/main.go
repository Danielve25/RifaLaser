package main

import (
	"context"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
	"github.com/rs/zerolog/log"

	"rifa-laser/backend/internal/db"
	apihttp "rifa-laser/backend/internal/http"
)

func main() {
	// godotenv solo local: ignora si no hay .env (producción usa variables reales)
	_ = godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	corsOrigin := os.Getenv("CORS_ORIGIN")
	if corsOrigin == "" {
		corsOrigin = "http://localhost:5173"
	}

	ctx := context.Background()
	pool, err := db.Connect(ctx)
	if err != nil {
		log.Fatal().Err(err).Msg("no hay base de datos")
	}
	defer pool.Close()
	if err := pool.Ping(ctx); err != nil {
		log.Fatal().Err(err).Msg("la base no responde")
	}

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{corsOrigin},
		AllowedMethods:   []string{"GET", "POST", "PATCH", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
	}))

	r.Mount("/api", apihttp.Rutas(pool))
	r.Mount("/ws", apihttp.RutasWS())

	subidas := os.Getenv("UPLOAD_DIR")
	if subidas == "" {
		subidas = "uploads"
	}
	if err := os.MkdirAll(subidas, 0o755); err != nil {
		log.Fatal().Err(err).Msg("no hay carpeta de fotos")
	}
	r.Handle("/uploads/*", http.StripPrefix("/uploads/", http.FileServer(http.Dir(subidas))))

	log.Info().Str("port", port).Msg("backend rifa-laser listo")
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal().Err(err).Msg("no pudo arrancar")
	}
}
