import { FotoPremio } from './FotoPremio'

const estados = {
  ganado: 'bg-yellow-400/15 text-ambar-brillo border-yellow-400/30',
  preparacion: 'bg-sky-400/15 text-sky-300 border-sky-400/30',
  en_camino: 'bg-violet-400/15 text-violet-300 border-violet-400/30',
  entregado: 'bg-green-400/15 text-green-300 border-green-400/30',
}

function fechaCorta(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function OrderCard({ order }) {  return (
    <article
      className={
        order.es_raro
          ? 'rounded-2xl p-4 bg-madera-700 border-2 border-ambar shadow-brasa space-y-3'
          : 'rounded-2xl p-4 bg-madera-800 border border-ambar/20 shadow-carta space-y-3'
      }
    >
      <FotoPremio src={order.producto_imagen} nombre={order.producto} />
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-lg text-crema">{order.producto}</h3>
        {order.es_raro && (
          <span className="text-[11px] font-bold tracking-widest text-madera-950 bg-ambar rounded px-2 py-0.5">RARO</span>
        )}
      </div>
      <p className="text-sm text-piedra">
        Boleta {order.codigo_visual} · {order.tema}
      </p>
      <p className="mt-2 text-sm text-crema/90">
        En 5 días se le entrega su premio · llega el {fechaCorta(order.entrega_estimada)}
      </p>
      <p className="mt-2">
        <span className={`text-xs font-semibold border rounded-full px-2 py-0.5 ${estados[order.estado] || estados.ganado}`}>
          {order.estado}
        </span>
      </p>
    </article>
  )
}
