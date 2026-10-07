package auth

import (
	"os"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var validar = validator.New()

type Usuario struct {
	ID        int    `json:"id"`
	Nombre    string `json:"nombre"`
	Whatsapp  string `json:"whatsapp"`
	Direccion string `json:"direccion"`
	EsAdmin   bool   `json:"es_admin"`
}

type Registro struct {
	Nombre    string `json:"nombre" validate:"required,min=2,max=80"`
	Whatsapp  string `json:"whatsapp" validate:"required,min=6,max=20"`
	Direccion string `json:"direccion" validate:"required,min=5,max=200"`
	Password  string `json:"password" validate:"required,min=6,max=72"`
}

type Entrar struct {
	Whatsapp string `json:"whatsapp" validate:"required,min=6,max=20"`
	Password string `json:"password" validate:"required"`
}

func Validar(v any) error {
	return validar.Struct(v)
}

func CifrarClave(clave string) (string, error) {
	h, err := bcrypt.GenerateFromPassword([]byte(clave), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(h), nil
}

func ClaveOk(clave, hash string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(clave)) == nil
}

func secreto() []byte {
	s := os.Getenv("JWT_SECRET")
	if s == "" {
		s = "cambia-esto-en-produccion-minimo-32-caracteres"
	}
	return []byte(s)
}

func CrearToken(u Usuario) (string, error) {
	claims := jwt.MapClaims{
		"user_id":  u.ID,
		"whatsapp": u.Whatsapp,
		"es_admin": u.EsAdmin,
		"exp":      time.Now().Add(7 * 24 * time.Hour).Unix(),
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString(secreto())
}

func LeerToken(token string) (Usuario, error) {
	var u Usuario
	t, err := jwt.Parse(token, func(t *jwt.Token) (any, error) {
		return secreto(), nil
	})
	if err != nil || !t.Valid {
		return u, err
	}
	m, ok := t.Claims.(jwt.MapClaims)
	if !ok {
		return u, jwt.ErrSignatureInvalid
	}
	if id, ok := m["user_id"].(float64); ok {
		u.ID = int(id)
	}
	if e, ok := m["whatsapp"].(string); ok {
		u.Whatsapp = e
	}
	if a, ok := m["es_admin"].(bool); ok {
		u.EsAdmin = a
	}
	return u, nil
}
