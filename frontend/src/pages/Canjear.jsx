import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { usarSaldo } from '../hooks/useJuego'
import { Titulo } from '../components/Titulo'

export default function Canjear() {
  const [codigo, setCodigo] = useState('')
  const [msg, setMsg] = useState('')
  const [ok, setOk] = useState(false)
  const nav = useNavigate()
  const qc = useQueryClient()
  const saldo = usarSaldo()
  const jugadas = saldo.data?.jugadas ?? 0

  const va = async (e) => {
    e.preventDefault()
    setMsg('')
    setOk(false)
    try {
      await api('/codes/redeem', { method: 'POST', body: JSON.stringify({ codigo }) })
      setCodigo('')
      setOk(true)
      setMsg('Código bueno. Ya tienes una jugada más.')
      qc.invalidateQueries({ queryKey: ['saldo'] })
    } catch (err) {
      setMsg(err.message)
    }
  }

  return (
    <main className="pantalla">
      <div className="max-w-md mx-auto space-y-4">
        <Titulo subtitulo="Te lo mandan por WhatsApp al comprar la boleta. Cada código es una jugada.">
          Canjea tu código
        </Titulo>
        <div className="rounded-2xl bg-madera-800 border border-ambar/20 p-4 flex items-center justify-between shadow-carta">
          <span className="text-sm text-piedra">Tus jugadas</span>
          <span className="font-display text-3xl text-ambar-brillo">{jugadas}</span>
        </div>
        <form onSubmit={va} className="rounded-2xl bg-madera-800 border border-ambar/20 p-6 space-y-3 shadow-carta">
          <div>
            <label className="etiqueta" htmlFor="codigo">Código de la boleta</label>
            <input
              id="codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="LSR-XXXX"
              autoComplete="off"
              className="input-taller font-display text-center text-xl tracking-[0.3em]"
            />
          </div>
          <button className="btn-ambar">Canjear</button>
          {msg && (
            <p role="status" className={`text-sm rounded-lg p-3 ${ok ? 'bg-green-400/10 text-green-300 border border-green-400/30' : 'bg-red-400/10 text-red-300 border border-red-400/30'}`}>
              {msg}
            </p>
          )}
        </form>
        {jugadas > 0 && (
          <button onClick={() => nav('/jugar')} className="btn-borde w-full">A jugar</button>
        )}
      </div>
    </main>
  )
}
