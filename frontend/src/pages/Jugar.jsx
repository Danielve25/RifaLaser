import { Link } from 'react-router-dom'
import { usarStock, usarSaldo } from '../hooks/useRonda'

export default function Jugar() {
  const stock = usarStock()
  const saldo = usarSaldo()
  const libres = stock.data?.stock?.disponibles ?? 0
  const jugadas = saldo.data?.jugadas ?? 0

  return (
    <main className="min-h-screen bg-[#17100B] text-amber-100 p-4">
      <div className="max-w-lg mx-auto space-y-4">
        <h1 className="text-2xl font-black">Elige cómo jugar</h1>
        {stock.isLoading && <p className="text-stone-400">Buscando boletas...</p>}
        {!stock.isLoading && libres === 0 && (
          <p className="rounded-xl border border-amber-500/20 bg-[#241610] p-4 text-stone-400">
            Se acabó el stock. Vuelve cuando el taller produzca más.
          </p>
        )}
        {libres > 0 && (
          <>
            <p className="text-sm text-stone-400">Quedan {libres} boletas · tienes {jugadas} jugadas.</p>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/jugar/galeria" className="rounded-xl bg-[#2B1B12] border border-amber-500/40 p-6 text-center hover:border-amber-400">
                <span className="text-lg font-bold">Galería</span>
                <span className="block text-xs text-stone-400 mt-1">escoge tu tarjeta</span>
              </Link>
              <Link to="/jugar/ruleta" className="rounded-xl bg-[#2B1B12] border border-amber-500/40 p-6 text-center hover:border-amber-400">
                <span className="text-lg font-bold">Ruleta</span>
                <span className="block text-xs text-stone-400 mt-1">gira y gana</span>
              </Link>
            </div>
          </>
        )}
        <Link to="/canjear" className="block text-center text-sm text-amber-400">Canjear otro código</Link>
      </div>
    </main>
  )
}
