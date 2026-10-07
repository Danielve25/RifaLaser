import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '../api/client'
import { usarSesion } from '../store/sesion'

const esquema = z.object({
  whatsapp: z.string().min(6, 'revisa el teléfono'),
  password: z.string().min(1, 'falta la clave'),
})

export default function Login() {
  const nav = useNavigate()
  const entrar = usarSesion((s) => s.entrar)
  const { register, handleSubmit, formState } = useForm({ resolver: zodResolver(esquema) })

  const va = async (d) => {
    try {
      const r = await api('/auth/login', { method: 'POST', body: JSON.stringify(d) })
      entrar(r.usuario, r.token)
      nav('/jugar')
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <main className="min-h-screen bg-[#17100B] text-amber-100 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit(va)} className="w-full max-w-sm rounded-xl bg-[#241610] border border-amber-500/20 p-6 space-y-3">
        <h1 className="text-2xl font-black">Entra a la rifa</h1>
        <input {...register('whatsapp')} placeholder="teléfono" inputMode="tel" className="w-full rounded bg-black/40 border border-amber-500/20 px-3 py-2" />
        {formState.errors.whatsapp && <p className="text-xs text-red-400">{formState.errors.whatsapp.message}</p>}
        <input {...register('password')} type="password" placeholder="clave" className="w-full rounded bg-black/40 border border-amber-500/20 px-3 py-2" />
        <button className="w-full rounded bg-amber-500 text-[#17100B] font-bold py-2">Entrar</button>
        <p className="text-sm text-stone-400">
          ¿Sin cuenta? <Link to="/registro" className="text-amber-400">Regístrate</Link>
        </p>
      </form>
    </main>
  )
}
