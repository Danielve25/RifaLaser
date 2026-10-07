import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import confetti from 'canvas-confetti'
import Roulette from '../components/Roulette'
import { api } from '../api/client'
import { usarRondaActiva, usarBoletas, usarSocket } from '../hooks/useRonda'

export default function Ruleta() {
  const ronda = usarRondaActiva()
  const id = ronda.data?.ronda?.id
  const boletas = usarBoletas(id)
  usarSocket(id)
  const qc = useQueryClient()
  const [girando, setGirando] = useState(false)
  const [ganado, setGanado] = useState(null)

  const girar = async () => {
    if (girando) return
    setGanado(null)
    let order
    try {
      // primero pide el sorteo, luego anima lo que ya salió
      const r = await api(`/rounds/${id}/draw`, { method: 'POST', body: JSON.stringify({}) })
      order = r.order
    } catch (e) {
      alert(e.status === 409 ? 'Sin jugadas o ronda cerrada.' : e.message)
      return
    }
    setGanado(order)
    setGirando(true)
    qc.invalidateQueries({ queryKey: ['boletas', id] })
    qc.invalidateQueries({ queryKey: ['saldo'] })
  }

  const fin = () => {
    setGirando(false)
    if (ganado?.es_raro) confetti({ particleCount: 120, spread: 70 })
  }

  const tickets = (boletas.data?.tickets ?? []).filter((t) => t.estado === 'disponible')

  return (
    <main className="min-h-screen bg-[#17100B] text-amber-100 p-4">
      <div className="max-w-lg mx-auto space-y-4 text-center">
        <h1 className="text-2xl font-black">Ruleta</h1>
        {!id && !ronda.isLoading && (
          <p className="rounded-xl border border-amber-500/20 bg-[#241610] p-4 text-stone-400">
            La ronda se cerró. Vuelve cuando el taller abra la siguiente.
          </p>
        )}
        <Roulette tickets={tickets} ganador={ganado} girando={girando} onFin={fin} />
        {!girando && (
          <button onClick={girar} className="rounded bg-amber-500 text-[#17100B] font-bold px-8 py-3">
            Girar
          </button>
        )}
        {ganado && !girando && (
          <div className="rounded-xl border-2 border-amber-400 bg-[#2B1B12] p-4">
            Ganaste: {ganado.producto} ({ganado.tema}). En 5 días se le entrega su premio, llega el {ganado.entrega_estimada}.
          </div>
        )}
      </div>
    </main>
  )
}
