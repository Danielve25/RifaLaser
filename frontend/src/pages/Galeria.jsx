import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import confetti from 'canvas-confetti'
import TicketGrid from '../components/TicketGrid'
import { AvisoGanador } from '../components/AvisoGanador'
import { Titulo } from '../components/Titulo'
import { api } from '../api/client'
import { usarBoletas, usarSocket } from '../hooks/useJuego'

export default function Galeria() {
  const boletas = usarBoletas()
  usarSocket()
  const qc = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [ganado, setGanado] = useState(null)

  const escoger = async (t) => {
    if (busy) return
    setBusy(true)
    try {
      const r = await api('/tickets/pick', { method: 'POST', body: JSON.stringify({ ticket_id: t.id }) })
      setGanado(r.order)
      if (r.order.es_raro) confetti({ particleCount: 120, spread: 70 })
      qc.invalidateQueries({ queryKey: ['boletas'] })
      qc.invalidateQueries({ queryKey: ['saldo'] })
    } catch (e) {
      alert(e.status === 409 ? 'Esa boleta ya se ocupó, escoge otra.' : e.message)
      qc.invalidateQueries({ queryKey: ['boletas'] })
    } finally {
      setBusy(false)
    }
  }

  const tickets = boletas.data?.tickets ?? []
  const libres = tickets.filter((t) => t.estado === 'disponible').length

  return (
    <main className="pantalla">
      <div className="max-w-4xl mx-auto space-y-4">
        <Titulo subtitulo={`Primero que llega, primero que escoge · ${libres} libres.`}>
          Galería
        </Titulo>
        {!boletas.isLoading && libres === 0 && (
          <p className="nota" role="status">
            Se acabó el stock. Vuelve cuando el taller produzca más.
          </p>
        )}
        <AvisoGanador order={ganado} />
        <TicketGrid tickets={tickets} onPick={escoger} busy={busy} />
      </div>
    </main>
  )
}
