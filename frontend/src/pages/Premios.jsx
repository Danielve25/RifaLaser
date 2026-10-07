import { useQuery } from '@tanstack/react-query'
import OrderCard from '../components/OrderCard'
import { api } from '../api/client'

export default function Premios() {
  const { data } = useQuery({ queryKey: ['premios'], queryFn: () => api('/my/orders') })
  const orders = data?.orders ?? []

  return (
    <main className="min-h-screen bg-[#17100B] text-amber-100 p-4">
      <div className="max-w-lg mx-auto space-y-4">
        <h1 className="text-2xl font-black">Mis premios</h1>
        {orders.length === 0 && <p className="text-stone-400">Aún no ganas nada. Canjea un código y juega.</p>}
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}
      </div>
    </main>
  )
}
