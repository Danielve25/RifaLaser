package auth

import (
	"context"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

type ctxKey string

const llaveUsuario ctxKey = "usuario"

func UsuarioDe(ctx context.Context) (Usuario, bool) {
	u, ok := ctx.Value(llaveUsuario).(Usuario)
	return u, ok
}

func cookieToken(r *http.Request) string {
	c, err := r.Cookie("token")
	if err == nil && c.Value != "" {
		return c.Value
	}
	h := r.Header.Get("Authorization")
	if strings.HasPrefix(h, "Bearer ") {
		return strings.TrimPrefix(h, "Bearer ")
	}
	return r.URL.Query().Get("token")
}

func PedirLogin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t := cookieToken(r)
		if t == "" {
			http.Error(w, `{"error":"no hay sesion"}`, http.StatusUnauthorized)
			return
		}
		u, err := LeerToken(t)
		if err != nil || u.ID == 0 {
			http.Error(w, `{"error":"sesion mala"}`, http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), llaveUsuario, u)))
	})
}

func PedirAdmin(next http.Handler) http.Handler {
	return PedirLogin(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		u, _ := UsuarioDe(r.Context())
		if !u.EsAdmin {
			http.Error(w, `{"error":"solo admin"}`, http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	}))
}

type visita struct {
	n     int
	hasta time.Time
}

var freno = struct {
	sync.Mutex
	m map[string]visita
}{m: map[string]visita{}}

func LimitePorIP(max int, ventana time.Duration) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := r.RemoteAddr
			if f, _, err := net.SplitHostPort(ip); err == nil {
				ip = f
			}
			ahora := time.Now()
			freno.Lock()
			v := freno.m[ip]
			if ahora.After(v.hasta) {
				v = visita{n: 0, hasta: ahora.Add(ventana)}
			}
			v.n++
			freno.m[ip] = v
			n := v.n
			freno.Unlock()
			if n > max {
				http.Error(w, `{"error":"muy rapido, espera"}`, http.StatusTooManyRequests)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
