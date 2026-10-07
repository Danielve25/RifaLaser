import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { usarSesion } from '../store/sesion'

export default function Admin() {
  const usuario = usarSesion((s) => s.usuario)
  const qc = useQueryClient()
  const [cantidad, setCantidad] = useState(10)
  const [lote, setLote] = useState([])
  const pedidos = useQuery({ queryKey: ['admin-orders'], queryFn: () => api('/admin/orders') })
  const productos = useQuery({ queryKey: ['admin-products'], queryFn: () => api('/admin/products') })

  if (!usuario?.es_admin) return <main className="min-h-screen bg-[#17100B] text-amber-100 p-4">Solo admin.</main>

  const crearLote = async () => {
    const r = await api('/admin/codes/batch', { method: 'POST', body: JSON.stringify({ cantidad: Number(cantidad) }) })
    setLote(r.codigos)
  }

  const crearRonda = async () => {
    const r = await api('/admin/rounds', { method: 'POST', body: JSON.stringify({}) })
    await api(`/admin/rounds/${r.ronda.id}/generate-tickets`, { method: 'POST', body: JSON.stringify({}) })
    alert('Ronda lista con 100 boletas.')
  }

  const cambiaEstado = async (id, estado) => {
    await api(`/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ estado }) })
    qc.invalidateQueries({ queryKey: ['admin-orders'] })
  }

  const orders = pedidos.data?.orders ?? []

  return (
    <main className="min-h-screen bg-[#17100B] text-amber-100 p-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-black">Admin del taller</h1>
        <section className="rounded-xl bg-[#241610] border border-amber-500/20 p-4 space-y-2">
          <h2 className="font-bold">Ronda y códigos</h2>
          <div className="flex gap-2">
            <button onClick={crearRonda} className="rounded bg-amber-500 text-[#17100B] font-bold px-4 py-2">Nueva ronda 100</button>
            <input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} className="w-20 rounded bg-black/40 border border-amber-500/20 px-2" />
            <button onClick={crearLote} className="rounded border border-amber-500/40 px-4 py-2">Lote códigos</button>
          </div>
          {lote.length > 0 && <p className="font-mono text-xs break-all">{lote.join(' · ')}</p>}
          <p className="text-xs text-stone-500">Inventario: {(productos.data?.productos ?? []).map((p) => `${p.nombre}(${p.stock_inicial})`).join(' · ')}</p>
        </section>
        <section className="space-y-2">
          <h2 className="font-bold">Pedidos ({orders.length})</h2>
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl bg-[#241610] border border-amber-500/20 p-3 text-sm">
              <p><span className="font-bold text-amber-200">{o.producto}</span> → {o.nombre} ({o.whatsapp})</p>
              <p className="text-stone-400">Llevar a: {o.direccion_entrega} · llega {o.entrega_estimada} · {o.estado}</p>
              <div className="flex gap-1 mt-2">
                {['ganado', 'preparacion', 'en_camino', 'entregado'].map((e) => (
                  <button key={e} onClick={() => cambiaEstado(o.id, e)} className="rounded border border-amber-500/30 px-2 py-1 text-xs">{e}</button>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}
