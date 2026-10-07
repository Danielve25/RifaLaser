export default function OrderCard({ order }) {
  return (
    <div
      className={
        order.es_raro
          ? 'rounded-xl p-4 bg-[#2B1B12] border-2 border-amber-400 shadow-[0_0_24px_rgba(245,165,36,0.35)]'
          : 'rounded-xl p-4 bg-[#241610] border border-amber-500/20'
      }
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-bold text-amber-100">{order.producto}</h3>
        {order.es_raro && <span className="text-xs font-bold text-amber-400">RARO</span>}
      </div>
      <p className="text-sm text-stone-400">
        Boleta {order.codigo_visual} · {order.tema}
      </p>
      <p className="mt-2 text-sm text-amber-100/90">
        En 5 días se le entrega su premio · llega el {order.entrega_estimada}
      </p>
      <p className="text-xs text-stone-500">Estado: {order.estado}</p>
    </div>
  )
}
