package products

import (
	"crypto/rand"
	"encoding/hex"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
)

func dirSubidas() string {
	d := os.Getenv("UPLOAD_DIR")
	if d == "" {
		d = "uploads"
	}
	return d
}

func (m *Manejador) SubirFoto(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	if id <= 0 {
		escribir(w, 400, map[string]string{"error": "producto malo"})
		return
	}
	if err := r.ParseMultipartForm(6 << 20); err != nil {
		escribir(w, 400, map[string]string{"error": "archivo muy pesado"})
		return
	}
	arch, _, err := r.FormFile("foto")
	if err != nil {
		escribir(w, 400, map[string]string{"error": "falta la foto"})
		return
	}
	defer arch.Close()
	datos, err := io.ReadAll(io.LimitReader(arch, 5<<20+1))
	if err != nil || len(datos) == 0 || len(datos) > 5<<20 {
		escribir(w, 400, map[string]string{"error": "archivo muy pesado"})
		return
	}
	var ext string
	switch tipo := http.DetectContentType(datos[:min(512, len(datos))]); tipo {
	case "image/jpeg":
		ext = ".jpg"
	case "image/png":
		ext = ".png"
	case "image/webp":
		ext = ".webp"
	default:
		escribir(w, 400, map[string]string{"error": "solo jpg, png o webp"})
		return
	}
	nombre := make([]byte, 16)
	_, _ = rand.Read(nombre)
	archivo := hex.EncodeToString(nombre) + ext
	dir := dirSubidas()
	if err := os.MkdirAll(dir, 0o755); err != nil {
		escribir(w, 500, map[string]string{"error": "no se pudo"})
		return
	}
	ruta := filepath.Join(dir, archivo)
	if strings.Contains(ruta, "..") {
		escribir(w, 400, map[string]string{"error": "nombre malo"})
		return
	}
	if err := os.WriteFile(ruta, datos, 0o644); err != nil {
		escribir(w, 500, map[string]string{"error": "no se pudo"})
		return
	}
	url := "/uploads/" + archivo
	tag, err := m.DB.Exec(r.Context(), `UPDATE products SET imagen_url=$2 WHERE id=$1`, id, url)
	if err != nil || tag.RowsAffected() == 0 {
		_ = os.Remove(ruta)
		escribir(w, 404, map[string]string{"error": "no hay producto"})
		return
	}
	escribir(w, 200, map[string]any{"imagen_url": url})
}
