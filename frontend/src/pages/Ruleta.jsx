import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import confetti from 'canvas-confetti'
import Roulette from '../components/Roulette'
import { AvisoGanador } from '../components/AvisoGanador'
import { Titulo } from '../components/Titulo'
import { api } from '../api/client'
import { usarBoletas, usarSocket } from '../hooks/useJuego'

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
    <main className="pantalla">
      <div className="max-w-lg mx-auto space-y-4 text-center">
        <div className="text-left">
          <Titulo subtitulo="El sorteo ya salió: la ruleta solo lo muestra.">Ruleta</Titulo>
        </div>
        {!boletas.isLoading && tickets.length === 0 && !girando && (
          <p className="nota text-left" role="status">
            Se acabó el stock. Vuelve cuando el taller produzca más.
          </p>
        )}
        <Roulette tickets={tickets} indice={indice} girando={girando} onFin={fin} />
        {!girando && tickets.length > 0 && (
          <button onClick={girar} className="btn-ambar max-w-xs mx-auto">
            Girar
          </button>
        )}
        <div className="text-left">
          <AvisoGanador order={ganado && !girando ? ganado : null} />
        </div>
      </div>
    </main>
  )
}
