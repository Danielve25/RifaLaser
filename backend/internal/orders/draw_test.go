package orders

import "testing"

func TestSortearRuletaPonderado(t *testing.T) {
	grupos := []grupo{
		{prodID: 1, peso: 70},
		{prodID: 2, peso: 25},
		{prodID: 3, peso: 5},
	}
	n := map[int]int{}
	for i := 0; i < 10000; i++ {
		g := sortearRuleta(grupos)
		n[g.prodID]++
	}
	if n[1] < 6000 || n[1] > 8000 {
		t.Fatalf("lo comun debe salir ~70%%, salio %d", n[1])
	}
	if n[3] == 0 {
		t.Fatal("lo raro nunca salio")
	}
	t.Logf("reparto: comun=%d medio=%d raro=%d", n[1], n[2], n[3])
}
