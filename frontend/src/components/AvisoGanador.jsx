import { motion } from 'framer-motion'
import { FotoPremio } from './FotoPremio'

export function AvisoGanador({ order }) {
  if (!order) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      role="status"
      className="rounded-2xl border-2 border-ambar bg-madera-700 p-4 shadow-brasa space-y-3"
    >
      <FotoPremio src={order.producto_imagen} nombre={order.producto} grande />
      <div>
        <p className="font-display text-lg text-ambar-brillo">Ganaste: {order.producto}</p>
        <p className="text-sm text-crema/90">
          Boleta {order.codigo_visual} · {order.tema}. En 5 días se le entrega su premio, llega el {order.entrega_estimada}.
        </p>
      </div>
    </motion.div>
  )
}
