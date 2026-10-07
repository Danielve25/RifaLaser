import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '../api/client'
import { usarSesion } from '../store/sesion'

const esquema = z.object({
  nombre: z.string().min(2, 'nombre muy corto'),
  whatsapp: z.string().min(6, 'whatsapp muy corto'),
  email: z.string().email('revisa el correo'),
  direccion: z.string().min(5, 'dirección muy corta'),
  password: z.string().min(6, 'mínimo 6 letras'),
})

export default function Registro() {
  const nav = useNavigate()
  const entrar = usarSesion((s) => s.entrar)
  const { register, handleSubmit, formState } = useForm({ resolver: zodResolver(esquema) })

  const va = async (d) => {
    try {
      const r = await api('/auth/register', { method: 'POST', body: JSON.stringify(d) })
      entrar(r.usuario, r.token)
      nav('/canjear')
    } catch (e) {
      alert(e.message)
    }
  }

  const campo = 'w-full rounded bg-black/40 border border-amber-500/20 px-3 py-2'
  return (
    <main className="min-h-screen bg-[#17100B] text-amber-100 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit(va)} className="w-full max-w-sm rounded-xl bg-[#241610] border border-amber-500/20 p-6 space-y-3">
        <h1 className="text-2xl font-black">Crea tu cuenta</h1>
        {['nombre', 'whatsapp', 'email', 'direccion'].map((c) => (
          <div key={c}>
            <input {...register(c)} placeholder={c} className={campo} />
            {formState.errors[c] && <p className="text-xs text-red-400">{formState.errors[c].message}</p>}
          </div>
        ))}
        <input {...register('password')} type="password" placeholder="clave" className={campo} />
        {formState.errors.password && <p className="text-xs text-red-400">{formState.errors.password.message}</p>}
        <button className="w-full rounded bg-amber-500 text-[#17100B] font-bold py-2">Registrarme</button>
        <p className="text-sm text-stone-400">
          ¿Ya tienes? <Link to="/login" className="text-amber-400">Entra</Link>
        </p>
      </form>
    </main>
  )
}
