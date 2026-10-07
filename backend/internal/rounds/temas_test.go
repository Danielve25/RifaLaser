package rounds

import "testing"

func TestTemasAlAzar(t *testing.T) {
	for _, n := range []int{100, 200, 600} {
		got := temasAlAzar(n)
		if len(got) != n {
			t.Fatalf("queria %d temas, salieron %d", n, len(got))
		}
		vistos := map[string]bool{}
		for _, x := range got {
			if vistos[x] {
				t.Fatalf("tema repetido: %s", x)
			}
			vistos[x] = true
		}
	}
}
