import { useEffect, useRef, useState } from 'react'

// ruleta propia: solo anima el resultado que ya dio el sorteo.
// indice queda fijo al girar para que el polling no lo mueva.
export default function Roulette({ tickets, indice, girando, onFin }) {
  const [angulo, setAngulo] = useState(0)
  const finRef = useRef(onFin)
  finRef.current = onFin

  const n = Math.max(tickets.length, 1)
  const paso = 360 / n

  useEffect(() => {
    if (!girando || indice < 0) return
    const vueltas = 5 * 360
    const destino = vueltas + (360 - indice * paso)
    setAngulo(destino)
    const t = setTimeout(() => finRef.current?.(), 4200)
    return () => clearTimeout(t)
  }, [girando, indice, paso])

  useEffect(() => {
    if (!girando) setAngulo(0)
  }, [girando])

  return (
    <div className="relative w-72 h-72 mx-auto">
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-[16px] border-l-transparent border-r-transparent border-t-amber-400 z-10" />
      <div
        className="w-full h-full rounded-full border-4 border-amber-500/60 overflow-hidden relative"
        style={{
          transform: `rotate(${angulo}deg)`,
          transition: girando ? 'transform 4s cubic-bezier(0.15, 0.85, 0.15, 1)' : 'none',
          background: 'conic-gradient(from 0deg, #2B1B12, #3A2415, #2B1B12, #3A2415)',
        }}
      >
        {tickets.map((t, i) => (
          <span
            key={t.id}
            className="absolute top-1/2 left-1/2 font-mono text-[10px] text-amber-200/80"
            style={{ transform: `rotate(${i * paso}deg) translateY(-130px)` }}
          >
            {t.codigo_visual}
          </span>
        ))}
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-amber-500 text-[#17100B] font-black flex items-center justify-center">
        {girando ? '...' : 'GIRA'}
      </div>
    </div>
  )
}
