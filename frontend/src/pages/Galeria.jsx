import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import confetti from 'canvas-confetti'
import TicketGrid from '../components/TicketGrid'
import { api } from '../api/client'
import { usarRondaActiva, usarBoletas, usarSocket } from '../hooks/useRonda'

export default function Galeria() {
  const ronda = usarRondaActiva()
  const id = ronda.data?.ronda?.id
  const boletas = usarBoletas(id)
  usarSocket(id)
  const qc = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [ganado, setGanado] = useState(null)

  const escoger = async (t) => {
    if (busy) return
    setBusy(true)
    try {
      const r = await api(`/rounds/${id}/pick`, { method: 'POST', body: JSON.stringify({ ticket_id: t.id }) })
      setGanado(r.order)
      if (r.order.es_raro) confetti({ particleCount: 120, spread: 70 })
      qc.invalidateQueries({ queryKey: ['boletas', id] })
      qc.invalidateQueries({ queryKey: ['saldo'] })
    } catch (e) {
      alert(e.status === 409 ? 'Esa boleta ya se ocupó, escoge otra.' : e.message)
      qc.invalidateQueries({ queryKey: ['boletas', id] })
    } finally {
      setBusy(false)
    }
  }

  const tickets = boletas.data?.tickets ?? []

  return (
    <main className="min-h-screen bg-[#17100B] text-amber-100 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-2xl font-black">Galería · primero que llega, primero que escoge</h1>
        {!id && !ronda.isLoading && (
          <p className="rounded-xl border border-amber-500/20 bg-[#241610] p-4 text-stone-400">
            La ronda se cerró. Vuelve cuando el taller abra la siguiente.
          </p>
        )}
        {ganado && (
          <div className="rounded-xl border-2 border-amber-400 bg-[#2B1B12] p-4">
            Ganaste: {ganado.producto} ({ganado.tema}). En 5 días se le entrega su premio, llega el {ganado.entrega_estimada}.
          </div>
        )}
        <TicketGrid tickets={tickets} onPick={escoger} busy={busy} />
      </div>
    </main>
  )
}
