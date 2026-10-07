import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { usarSaldo } from '../hooks/useRonda'

export default function Canjear() {
  const [codigo, setCodigo] = useState('')
  const [msg, setMsg] = useState('')
  const nav = useNavigate()
  const qc = useQueryClient()
  const saldo = usarSaldo()

  const va = async (e) => {
    e.preventDefault()
    setMsg('')
    try {
      await api('/codes/redeem', { method: 'POST', body: JSON.stringify({ codigo }) })
      setCodigo('')
      qc.invalidateQueries({ queryKey: ['saldo'] })
      setMsg('Código bueno, ya puedes jugar.')
    } catch (err) {
      setMsg(err.message)
    }
  }

  const jugadas = saldo.data?.jugadas ?? 0

  return (
    <main className="min-h-screen bg-[#17100B] text-amber-100 p-4">
      <div className="max-w-md mx-auto rounded-xl bg-[#241610] border border-amber-500/20 p-6 space-y-4">
        <h1 className="text-2xl font-black">Canjea tu código</h1>
        <p className="text-sm text-stone-400">Te lo mandan por WhatsApp al comprar la boleta. Tienes {jugadas} jugadas.</p>
        <form onSubmit={va} className="flex gap-2">
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="LSR-XXXX"
            className="flex-1 rounded bg-black/40 border border-amber-500/20 px-3 py-2 font-mono"
          />
          <button className="rounded bg-amber-500 text-[#17100B] font-bold px-4">Canjear</button>
        </form>
        {msg && <p className="text-sm text-amber-300">{msg}</p>}
        <div className="flex gap-2">
          <button onClick={() => nav('/jugar')} className="flex-1 rounded border border-amber-500/40 py-2">A jugar</button>
          <Link to="/canjear" onClick={(e) => { e.preventDefault(); setCodigo(''); setMsg('Otro código listo.'); }} className="flex-1 text-center rounded border border-amber-500/40 py-2">
            Otro código
          </Link>
        </div>
      </div>
    </main>
  )
}
