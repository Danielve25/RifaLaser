import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import OrderCard from '../components/OrderCard'
import { Titulo } from '../components/Titulo'
import { api } from '../api/client'

export default function Premios() {
  const { data, isLoading } = useQuery({ queryKey: ['premios'], queryFn: () => api('/my/orders') })
  const orders = data?.orders ?? []

  return (
    <main className="pantalla">
      <div className="max-w-lg mx-auto space-y-4">
        <Titulo subtitulo={orders.length > 0 ? `${orders.length} ${orders.length === 1 ? 'premio ganado' : 'premios ganados'}.` : undefined}>
          Mis premios
        </Titulo>
        {isLoading && <p className="text-piedra">Buscando premios...</p>}
        {!isLoading && orders.length === 0 && (
          <div className="nota space-y-2">
            <p>Aún no ganas nada.</p>
            <Link to="/canjear" className="btn-borde inline-block">Canjear un código</Link>
          </div>
        )}
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}
      </div>
    </main>
  )
}
