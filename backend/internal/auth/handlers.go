package auth

import (
	"encoding/json"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Manejador struct {
	DB *pgxpool.Pool
}

func escribir(w http.ResponseWriter, codigo int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(codigo)
	_ = json.NewEncoder(w).Encode(v)
}

func ponerCookie(w http.ResponseWriter, token string) {
	c := &http.Cookie{
		Name:     "token",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   7 * 24 * 3600,
	}
	http.SetCookie(w, c)
}

func (m *Manejador) Registrar(w http.ResponseWriter, r *http.Request) {
	var in Registro
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		escribir(w, 400, map[string]string{"error": "datos mal"})
		return
	}
	if err := Validar(in); err != nil {
		escribir(w, 400, map[string]string{"error": "revisa nombre, telefono, direccion y clave"})
		return
	}
	hash, err := CifrarClave(in.Password)
	if err != nil {
		escribir(w, 500, map[string]string{"error": "no se pudo"})
		return
	}
	var u Usuario
	err = m.DB.QueryRow(r.Context(),
		`INSERT INTO users(nombre, whatsapp, direccion, password_hash)
		 VALUES($1,$2,$3,$4)
		 RETURNING id, nombre, whatsapp, direccion, is_admin`,
		in.Nombre, in.Whatsapp, in.Direccion, hash,
	).Scan(&u.ID, &u.Nombre, &u.Whatsapp, &u.Direccion, &u.EsAdmin)
	if err != nil {
		escribir(w, 409, map[string]string{"error": "ese telefono ya existe"})
		return
	}
	t, _ := CrearToken(u)
	ponerCookie(w, t)
	escribir(w, 201, map[string]any{"usuario": u, "token": t})
}

func (m *Manejador) Entrar(w http.ResponseWriter, r *http.Request) {
	var in Entrar
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		escribir(w, 400, map[string]string{"error": "datos mal"})
		return
	}
	if err := Validar(in); err != nil {
		escribir(w, 400, map[string]string{"error": "falta telefono o clave"})
		return
	}
	var u Usuario
	var hash string
	err := m.DB.QueryRow(r.Context(),
		`SELECT id, nombre, whatsapp, direccion, is_admin, password_hash
		 FROM users WHERE whatsapp=$1`, in.Whatsapp,
	).Scan(&u.ID, &u.Nombre, &u.Whatsapp, &u.Direccion, &u.EsAdmin, &hash)
	if err != nil || !ClaveOk(in.Password, hash) {
		escribir(w, 401, map[string]string{"error": "telefono o clave mal"})
		return
	}
	t, _ := CrearToken(u)
	ponerCookie(w, t)
	escribir(w, 200, map[string]any{"usuario": u, "token": t})
}

func (m *Manejador) Yo(w http.ResponseWriter, r *http.Request) {
	u, ok := UsuarioDe(r.Context())
	if !ok {
		escribir(w, 401, map[string]string{"error": "sin sesion"})
		return
	}
	var full Usuario
	err := m.DB.QueryRow(r.Context(),
		`SELECT id, nombre, whatsapp, direccion, is_admin FROM users WHERE id=$1`, u.ID,
	).Scan(&full.ID, &full.Nombre, &full.Whatsapp, &full.Direccion, &full.EsAdmin)
	if err != nil {
		escribir(w, 401, map[string]string{"error": "sin sesion"})
		return
	}
	escribir(w, 200, map[string]any{"usuario": full})
}

func (m *Manejador) CambiarPerfil(w http.ResponseWriter, r *http.Request) {
	u, ok := UsuarioDe(r.Context())
	if !ok {
		escribir(w, 401, map[string]string{"error": "sin sesion"})
		return
	}
	var in struct {
		Direccion *string `json:"direccion"`
		Nombre    *string `json:"nombre"`
		Whatsapp  *string `json:"whatsapp"`
	}
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		escribir(w, 400, map[string]string{"error": "datos mal"})
		return
	}
	if in.Direccion == nil || len(*in.Direccion) < 5 {
		escribir(w, 400, map[string]string{"error": "direccion muy corta"})
		return
	}
	nombre := ""
	ws := ""
	_ = nombre
	_ = ws
	var full Usuario
	err := m.DB.QueryRow(r.Context(),
		`UPDATE users SET direccion=$2 WHERE id=$1
		 RETURNING id, nombre, whatsapp, direccion, is_admin`,
		u.ID, *in.Direccion,
	).Scan(&full.ID, &full.Nombre, &full.Whatsapp, &full.Direccion, &full.EsAdmin)
	if err != nil {
		escribir(w, 500, map[string]string{"error": "no se pudo"})
		return
	}
	escribir(w, 200, map[string]any{"usuario": full})
}
