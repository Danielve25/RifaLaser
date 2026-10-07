import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import confetti from 'canvas-confetti'
import Roulette from '../components/Roulette'
import { api } from '../api/client'
import { usarBoletas, usarSocket } from '../hooks/useRonda'

export default function Ruleta() {
  const boletas = usarBoletas()
  usarSocket()
  const qc = useQueryClient()
  const [girando, setGirando] = useState(false)
  const [ganado, setGanado] = useState(null)
  const [indice, setIndice] = useState(-1)

  const girar = async () => {
    if (girando) return
    setGanado(null)
    setIndice(-1)
    let order
    try {
      // primero pide el sorteo, luego anima lo que ya salió
      const r = await api('/tickets/draw', { method: 'POST', body: JSON.stringify({}) })
      order = r.order
    } catch (e) {
      alert(e.status === 409 ? 'Sin jugadas o sin stock.' : e.message)
      return
    }
    const lista = (boletas.data?.tickets ?? []).filter((t) => t.estado === 'disponible')
    const idx = lista.findIndex((t) => t.id === order.ticket_id)
    setGanado(order)
    if (idx < 0) return
    setIndice(idx)
    setGirando(true)
    qc.invalidateQueries({ queryKey: ['boletas'] })
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
        {!boletas.isLoading && tickets.length === 0 && !girando && (
          <p className="rounded-xl border border-amber-500/20 bg-[#241610] p-4 text-stone-400">
            Se acabó el stock. Vuelve cuando el taller produzca más.
          </p>
        )}
        <Roulette tickets={tickets} indice={indice} girando={girando} onFin={fin} />
        {!girando && tickets.length > 0 && (
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
