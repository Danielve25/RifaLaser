import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { usarSaldo } from '../hooks/useRonda'

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
    <main className="min-h-screen bg-[#17100B] text-amber-100 p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="rounded-xl bg-[#241610] border border-amber-500/20 p-6 space-y-4">
          <h1 className="text-2xl font-black">Canjea tu código</h1>
          <p className="text-sm text-stone-400">
            Te lo mandan por WhatsApp al comprar la boleta. Cada código es una jugada.
          </p>
          <p className="text-sm">
            Tienes <span className="font-bold text-amber-400">{jugadas}</span> {jugadas === 1 ? 'jugada' : 'jugadas'}.
          </p>
          <form onSubmit={va} className="space-y-3">
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="LSR-XXXX"
              autoComplete="off"
              className="w-full rounded bg-black/40 border border-amber-500/20 px-3 py-2 font-mono text-center text-lg tracking-widest"
            />
            <button className="w-full rounded bg-amber-500 text-[#17100B] font-bold py-2">Canjear</button>
          </form>
          {msg && (
            <p className={`text-sm rounded-lg p-3 ${ok ? 'bg-green-900/40 text-green-200' : 'bg-red-900/40 text-red-200'}`}>
              {msg}
            </p>
          )}
        </div>
        {jugadas > 0 && (
          <button onClick={() => nav('/jugar')} className="w-full rounded-xl bg-[#2B1B12] border border-amber-500/40 py-3 font-bold">
            A jugar
          </button>
        )}
      </div>
    </main>
  )
}
