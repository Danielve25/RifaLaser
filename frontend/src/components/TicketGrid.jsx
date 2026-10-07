import { motion } from 'framer-motion'

export default function TicketGrid({ tickets, onPick, busy }) {
  return (
    <div className="grid grid-cols-5 md:grid-cols-10 gap-2" role="list">
      {tickets.map((t) => {
        const libre = t.estado === 'disponible'
        return (
          <motion.button
            role="listitem"
            key={t.id}
            whileTap={libre ? { scale: 0.9 } : {}}
            disabled={!libre || busy}
            onClick={() => onPick(t)}
            aria-label={libre ? `Boleta ${t.codigo_visual}, tema ${t.tema}` : `Boleta ${t.codigo_visual} ocupada`}
            className={
              libre
                ? 'aspect-square rounded-xl bg-gradient-to-b from-madera-600 to-madera-700 border border-ambar/40 text-crema flex-col items-center justify-center p-1 shadow-carta transition-all hover:border-ambar hover:shadow-brasa hover:-translate-y-0.5 active:translate-y-0 cursor-pointer min-h-[44px] flex'
                : 'aspect-square rounded-xl bg-black/50 border border-white/5 text-stone-600 flex-col items-center justify-center p-1 flex'
            }
          >
            <span className="font-display text-xs md:text-sm">{t.codigo_visual}</span>
            <span className="text-[10px] leading-tight truncate w-full text-center opacity-80">{t.tema}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
