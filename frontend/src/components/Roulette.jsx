import { useEffect, useRef, useState } from 'react'

// ruleta propia: solo anima el resultado que ya dio el sorteo.
// indice queda fijo al girar para que el polling no lo mueva.
export default function Roulette({ tickets, indice, girando, onFin }) {
  const [angulo, setAngulo] = useState(0)
  const finRef = useRef(onFin)
  finRef.current = onFin

  const n = Math.max(tickets.length, 1)
  const paso = 360 / n
  const calma = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

  useEffect(() => {
    if (!girando || indice < 0) return
    if (calma) {
      finRef.current?.()
      return
    }
    const vueltas = 5 * 360
    const destino = vueltas + (360 - indice * paso)
    setAngulo(destino)
    const t = setTimeout(() => finRef.current?.(), 4200)
    return () => clearTimeout(t)
  }, [girando, indice, paso, calma])

  useEffect(() => {
    if (!girando) setAngulo(0)
  }, [girando])

  return (
    <div className="relative w-72 h-72 md:w-80 md:h-80 mx-auto" role="img" aria-label="Ruleta de boletas">
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-[16px] border-l-transparent border-r-transparent border-t-ambar-brillo z-10 drop-shadow-[0_0_6px_rgba(255,197,61,0.8)]" />
      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-ambar/50 via-transparent to-transparent p-1">
        <div
          className="w-full h-full rounded-full overflow-hidden relative bg-madera-800"
          style={{
            transform: `rotate(${angulo}deg)`,
            transition: girando && !calma ? 'transform 4s cubic-bezier(0.15, 0.85, 0.15, 1)' : 'none',
            background: 'conic-gradient(from 0deg, #2B1B12 0deg 30deg, #3A2415 30deg 60deg)',
          }}
        >
          {tickets.map((t, i) => (
            <span key={t.id}>
              <span
                className="absolute top-1/2 left-1/2 h-3 w-px bg-ambar/40"
                style={{ transform: `rotate(${i * paso}deg) translateY(-138px)`, transformOrigin: 'top center' }}
              />
              <span
                className="absolute top-1/2 left-1/2 font-display text-[10px] text-ambar-suave/90 -translate-x-1/2"
                style={{ transform: `translateX(-50%) rotate(${i * paso}deg) translateY(-120px)` }}
              >
                {t.codigo_visual}
              </span>
            </span>
          ))}
        </div>
      </div>
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full font-display flex items-center justify-center border-2 ${
          girando ? 'bg-madera-700 text-ambar border-ambar/50' : 'bg-ambar text-madera-950 border-ambar-brillo shadow-brasa'
        }`}
      >
        {girando ? '···' : 'GIRA'}
      </div>
    </div>
  )
}
