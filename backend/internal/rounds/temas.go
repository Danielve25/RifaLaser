package rounds

import (
	"fmt"
	"math/rand"
)

// Respaldo de la carta volteada: no dice el premio, solo da algo que escoger.
var banco = []string{
	"mapache", "zorro", "buho", "colibri", "tucan", "jaguar", "perezoso", "rana",
	"tortuga", "delfin", "ballena", "pulpo", "caballo", "ciervo", "lobo", "oso",
	"abeja", "mariposa", "libelula", "escarabajo", "gato", "perro", "conejo", "erizo",
	"vaca", "oveja", "gallo", "pato", "cisne", "flamenco", "loro", "aguila",
	"dragon", "unicornio", "fenix", "grifo", "hada", "duende", "mago", "caballero",
	"hormiga", "caracol", "cangrejo", "koala", "panda", "tigre", "leon", "elefante",
	"jirafa", "cebra", "mono", "gorila", "camello", "cabra", "burro", "cerdo",
	"raton", "murcielago", "ardilla", "castor", "nutria", "foca", "pinguino", "gaviota",
	"paloma", "cuervo", "halcon", "pavo", "avestruz", "pelicano", "garza", "otarda",
	"tiburon", "rayas", "medusa", "estrella-mar", "caballito", "pez", "trucha", "salmon",
	"rosa", "girasol", "orquidea", "cactus", "helecho", "bambu", "roble", "pino",
	"margarita", "tulipan", "lirio", "jazmin", "clavel", "dalia", "violeta", "amapola",
	"buganvilia", "hortensia", "lavanda", "magnolia", "narciso", "peonía", "gardenia", "azucena",
	"ceiba", "sauce", "cedro", "nogal", "almendro", "olivo", "manzano", "naranjo",
	"luna", "sol", "estrella", "cometa", "planeta", "arcoiris", "nube", "rayo",
	"montana", "volcan", "cascada", "rio", "lago", "mar", "isla", "desierto",
	"amanecer", "atardecer", "medianoche", "aurora", "eclipse", "marea", "brisa", "tormenta",
	"nieve", "lluvia", "viento", "trueno", "arco", "cielo", "horizonte", "oasis",
	"castillo", "faro", "molino", "puente", "barco", "avion", "tren", "auto",
	"guitarra", "tambor", "violin", "flauta", "trompeta", "piano", "campana", "libro",
	"taza", "tetera", "reloj", "llave", "candado", "vela", "lampara", "espejo",
	"corazon", "ancla", "brujula", "mapa", "cofre", "corona", "espada", "escudo",
	"atrapasuenos", "mandala", "arbol-vida", "ojo-turco", "trompo", "barrilete",
	"papalote", "canica", "yoyo", "balero", "matraca", "sonaja", "piñata", "papel",
	"tijeras", "aguja", "hilo", "boton", "caja", "bolsa", "cuerda", "red",
	"manzana", "pera", "uva", "mango", "piña", "sandia", "melon", "fresa",
	"naranja", "limon", "platano", "coco", "papaya", "kiwi", "durazno", "cereza",
	"pan", "queso", "miel", "cafe", "chocolate", "azucar", "sal", "pimienta",
	"sombrero", "zapato", "camisa", "pantalon", "vestido", "bufanda", "guante", "cinturon",
	"silla", "mesa", "puerta", "ventana", "techo", "pared", "piso", "escalera",
}

func TemasAlAzar(n int) []string {
	mezcla := append([]string{}, banco...)
	rand.Shuffle(len(mezcla), func(a, b int) { mezcla[a], mezcla[b] = mezcla[b], mezcla[a] })
	out := []string{}
	vuelta := 0
	for len(out) < n {
		for _, t := range mezcla {
			if len(out) >= n {
				break
			}
			if vuelta == 0 {
				out = append(out, t)
			} else {
				out = append(out, fmt.Sprintf("%s %d", t, vuelta+1))
			}
		}
		vuelta++
	}
	rand.Shuffle(len(out), func(a, b int) { out[a], out[b] = out[b], out[a] })
	return out
}
