import { motion } from 'framer-motion'

export default function TicketGrid({ tickets, onPick, busy }) {
  return (
    <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
      {tickets.map((t) => (
        <motion.button
          key={t.id}
          whileTap={t.estado === 'disponible' ? { scale: 0.92 } : {}}
          disabled={t.estado !== 'disponible' || busy}
          onClick={() => onPick(t)}
          className={
            t.estado === 'disponible'
              ? 'aspect-square rounded-lg bg-[#2B1B12] border border-amber-500/40 hover:border-amber-400 hover:bg-[#3A2415] text-amber-100 flex flex-col items-center justify-center p-1 transition-colors'
              : 'aspect-square rounded-lg bg-black/40 border border-white/5 text-stone-600 flex flex-col items-center justify-center p-1'
          }
        >
          <span className="font-mono text-xs font-bold">{t.codigo_visual}</span>
          <span className="text-[10px] leading-tight truncate w-full text-center">{t.tema}</span>
        </motion.button>
      ))}
    </div>
  )
}
