import { Link } from 'react-router-dom'
import { usarStock, usarSaldo } from '../hooks/useJuego'
import { Titulo } from '../components/Titulo'

export default function Jugar() {
  const stock = usarStock()
  const saldo = usarSaldo()
  const libres = stock.data?.stock?.disponibles ?? 0
  const jugadas = saldo.data?.jugadas ?? 0

  return (
    <main className="pantalla">
      <div className="max-w-lg mx-auto space-y-4">
        <Titulo subtitulo={libres > 0 ? `Quedan ${libres} boletas · tienes ${jugadas} ${jugadas === 1 ? 'jugada' : 'jugadas'}.` : undefined}>
          Elige cómo jugar
        </Titulo>
        {stock.isLoading && <p className="text-piedra">Buscando boletas...</p>}
        {!stock.isLoading && libres === 0 && (
          <p className="nota" role="status">
            Se acabó el stock. Vuelve cuando el taller produzca más.
          </p>
        )}
        {libres > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/jugar/galeria"
              className="rounded-2xl bg-gradient-to-b from-madera-600 to-madera-700 border border-ambar/40 p-6 text-center shadow-carta transition-all hover:border-ambar hover:shadow-brasa hover:-translate-y-0.5"
            >
              <span className="font-display text-xl block">Galería</span>
              <span className="block text-xs text-piedra mt-1">escoge tu tarjeta</span>
            </Link>
            <Link
              to="/jugar/ruleta"
              className="rounded-2xl bg-gradient-to-b from-madera-600 to-madera-700 border border-ambar/40 p-6 text-center shadow-carta transition-all hover:border-ambar hover:shadow-brasa hover:-translate-y-0.5"
            >
              <span className="font-display text-xl block">Ruleta</span>
              <span className="block text-xs text-piedra mt-1">gira y gana</span>
            </Link>
          </div>
        )}
        <Link to="/canjear" className="block text-center text-sm text-ambar-brillo font-semibold py-2 min-h-[44px]">
          Canjear otro código
        </Link>
      </div>
    </main>
  )
}
