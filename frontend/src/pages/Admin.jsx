import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { usarSesion } from '../store/sesion'

const menu = [
  ['pedidos', 'Pedidos'],
  ['codigos', 'Códigos'],
  ['productos', 'Productos'],
]

const tarjeta = 'bg-white rounded-lg shadow-sm border border-gray-200 p-4'
const th = 'text-left text-xs font-medium text-gray-500 uppercase px-3 py-2'
const td = 'px-3 py-2 text-sm text-gray-800 border-t border-gray-100'

function insignia(estado) {
  const colores = {
    ganado: 'bg-yellow-100 text-yellow-800',
    preparacion: 'bg-blue-100 text-blue-800',
    en_camino: 'bg-purple-100 text-purple-800',
    entregado: 'bg-green-100 text-green-800',
    creado: 'bg-gray-100 text-gray-700',
    canjeado: 'bg-green-100 text-green-800',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colores[estado] || 'bg-gray-100'}`}>{estado}</span>
}

export default function Admin() {
  const usuario = usarSesion((s) => s.usuario)
  const qc = useQueryClient()
  const [pestana, setPestana] = useState('pedidos')
  const [cantidad, setCantidad] = useState(10)
  const [filtro, setFiltro] = useState('todos')
  const [nuevo, setNuevo] = useState({ nombre: '', descripcion: '', stock_inicial: '', es_raro: false })

  const pedidos = useQuery({ queryKey: ['admin-orders'], queryFn: () => api('/admin/orders') })
  const productos = useQuery({ queryKey: ['admin-products'], queryFn: () => api('/admin/products') })
  const codigos = useQuery({ queryKey: ['admin-codes'], queryFn: () => api('/admin/codes') })
  const stock = useQuery({ queryKey: ['admin-stock'], queryFn: () => api('/tickets/estado') })

  if (!usuario?.es_admin) return <main className="min-h-screen bg-[#f6f6f7] p-4">Solo admin.</main>

  const orders = pedidos.data?.orders ?? []
  const prods = productos.data?.productos ?? []
  const cods = codigos.data?.codigos ?? []
  const stockTotal = prods.reduce((s, p) => s + p.stock_inicial, 0)
  const cuenta = (e) => orders.filter((o) => o.estado === e).length

  const refresca = () => {
    qc.invalidateQueries({ queryKey: ['admin-orders'] })
    qc.invalidateQueries({ queryKey: ['admin-codes'] })
    qc.invalidateQueries({ queryKey: ['admin-products'] })
    qc.invalidateQueries({ queryKey: ['admin-stock'] })
  }

  const crearLote = async () => {
    await api('/admin/codes/batch', { method: 'POST', body: JSON.stringify({ cantidad: Number(cantidad) }) })
    refresca()
  }

  const sincroniza = async () => {
    const r = await api('/admin/stock/sincronizar', { method: 'POST', body: JSON.stringify({}) })
    alert(`Boletas listas: ${r.creadas} nuevas.`)
    refresca()
  }

  const cambiaEstado = async (id, estado) => {
    await api(`/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ estado }) })
    qc.invalidateQueries({ queryKey: ['admin-orders'] })
  }

  const creaProducto = async (e) => {
    e.preventDefault()
    await api('/admin/products', {
      method: 'POST',
      body: JSON.stringify({ ...nuevo, stock_inicial: Number(nuevo.stock_inicial) }),
    })
    setNuevo({ nombre: '', descripcion: '', stock_inicial: '', es_raro: false })
    qc.invalidateQueries({ queryKey: ['admin-products'] })
  }

  const ver = cods.filter((c) => filtro === 'todos' || c.estado === filtro)

  return (
    <div className="min-h-screen bg-[#f6f6f7] text-gray-800 flex">
      <aside className="w-52 shrink-0 bg-white border-r border-gray-200 p-4 space-y-1">
        <p className="font-bold text-lg px-2 pb-3">Rifa Láser</p>
        {menu.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setPestana(k)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${pestana === k ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            {label}
          </button>
        ))}
      </aside>

      <main className="flex-1 p-6 max-w-5xl">
        {pestana === 'pedidos' && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold">Pedidos</h1>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {['Total', 'ganado', 'preparacion', 'en_camino', 'entregado'].map((e, i) => (
                <div key={e} className={tarjeta}>
                  <p className="text-xs text-gray-500">{e === 'Total' ? 'Total' : e}</p>
                  <p className="text-2xl font-bold">{e === 'Total' ? orders.length : cuenta(e)}</p>
                </div>
              ))}
            </div>
            <div className={`${tarjeta} overflow-x-auto p-0`}>
              <table className="w-full">
                <thead><tr><th className={th}>Pedido</th><th className={th}>Producto</th><th className={th}>Cliente</th><th className={th}>Llevar a</th><th className={th}>Llega</th><th className={th}>Estado</th></tr></thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className={td}>#{o.id} · {o.codigo_visual}</td>
                      <td className={td}>{o.producto}</td>
                      <td className={td}>{o.nombre}<br /><span className="text-gray-500">{o.whatsapp}</span></td>
                      <td className={td}>{o.direccion_entrega}</td>
                      <td className={td}>{o.entrega_estimada}</td>
                      <td className={td}>
                        <select value={o.estado} onChange={(e) => cambiaEstado(o.id, e.target.value)} className="border border-gray-300 rounded-md text-sm px-2 py-1">
                          {['ganado', 'preparacion', 'en_camino', 'entregado'].map((e) => <option key={e} value={e}>{e}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {pestana === 'codigos' && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold">Códigos</h1>
            <div className="grid grid-cols-3 gap-3">
              {[['Creados', cods.length], ['Canjeados', cods.filter((c) => c.estado === 'canjeado').length], ['Libres', cods.filter((c) => c.estado === 'creado').length]].map(([l, n]) => (
                <div key={l} className={tarjeta}>
                  <p className="text-xs text-gray-500">{l}</p>
                  <p className="text-2xl font-bold">{n}</p>
                </div>
              ))}
            </div>
            <div className={tarjeta}>
              <div className="flex gap-2 items-center">
                <input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} className="w-20 border border-gray-300 rounded-md px-2 py-1.5" />
                <button onClick={crearLote} className="rounded-md bg-[#008060] text-white font-medium px-4 py-1.5">Crear lote</button>
                <div className="ml-auto flex gap-1">
                  {['todos', 'creado', 'canjeado'].map((f) => (
                    <button key={f} onClick={() => setFiltro(f)} className={`px-3 py-1.5 rounded-md text-sm ${filtro === f ? 'bg-gray-900 text-white' : 'border border-gray-300'}`}>{f}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className={`${tarjeta} overflow-x-auto p-0`}>
              <table className="w-full">
                <thead><tr><th className={th}>Código</th><th className={th}>Estado</th><th className={th}>Cliente</th><th className={th}>Canjeado</th></tr></thead>
                <tbody>
                  {ver.map((c) => (
                    <tr key={c.codigo}>
                      <td className={`${td} font-mono font-bold`}>{c.codigo}</td>
                      <td className={td}>{insignia(c.estado)}</td>
                      <td className={td}>{c.cliente ? `${c.cliente} · ${c.whatsapp}` : '—'}</td>
                      <td className={td}>{c.canjeado_at || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {pestana === 'productos' && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold">Productos · stock total {stockTotal}</h1>
            <div className={`${tarjeta} flex flex-wrap gap-3 items-center`}>
              <p className="text-sm text-gray-600">
                Boletas: {stock.data?.stock?.total ?? 0} · libres {stock.data?.stock?.disponibles ?? 0} · ocupadas {stock.data?.stock?.ocupadas ?? 0}
              </p>
              <button onClick={sincroniza} className="ml-auto rounded-md bg-[#008060] text-white font-medium px-4 py-1.5">Sincronizar boletas</button>
            </div>
            <form onSubmit={creaProducto} className={`${tarjeta} flex flex-wrap gap-2 items-end`}>
              <input value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} placeholder="Nombre" className="border border-gray-300 rounded-md px-3 py-1.5" />
              <input value={nuevo.descripcion} onChange={(e) => setNuevo({ ...nuevo, descripcion: e.target.value })} placeholder="Descripción" className="border border-gray-300 rounded-md px-3 py-1.5" />
              <input type="number" value={nuevo.stock_inicial} onChange={(e) => setNuevo({ ...nuevo, stock_inicial: e.target.value })} placeholder="Stock" className="w-24 border border-gray-300 rounded-md px-3 py-1.5" />
              <label className="text-sm flex items-center gap-1">
                <input type="checkbox" checked={nuevo.es_raro} onChange={(e) => setNuevo({ ...nuevo, es_raro: e.target.checked })} /> Raro
              </label>
              <button className="rounded-md bg-[#008060] text-white font-medium px-4 py-1.5">Añadir</button>
            </form>
            <div className={`${tarjeta} p-0 overflow-x-auto`}>
              <table className="w-full">
                <thead><tr><th className={th}>Producto</th><th className={th}>Stock</th><th className={th}>Raro</th></tr></thead>
                <tbody>
                  {prods.map((p) => (
                    <tr key={p.id}>
                      <td className={td}>{p.nombre}<br /><span className="text-gray-500 text-xs">{p.descripcion}</span></td>
                      <td className={td}>{p.stock_inicial}</td>
                      <td className={td}>{p.es_raro ? 'Sí' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
