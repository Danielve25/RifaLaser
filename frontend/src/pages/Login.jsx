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
    <main className="pantalla flex items-center justify-center">
      <form onSubmit={handleSubmit(va)} className="caja" noValidate={false}>
        <div>
          <p className="font-display text-ambar text-sm tracking-widest">TALLER · CORTE LÁSER</p>
          <h1 className="font-display text-3xl mt-1">Entra a la rifa</h1>
        </div>
        <div>
          <label className="etiqueta" htmlFor="login-tel">Teléfono</label>
          <input id="login-tel" {...register('whatsapp')} inputMode="tel" autoComplete="tel" placeholder="300 123 4567" className="input-taller" />
          {formState.errors.whatsapp && <p className="text-xs text-red-400 mt-1">{formState.errors.whatsapp.message}</p>}
        </div>
        <div>
          <label className="etiqueta" htmlFor="login-clave">Clave</label>
          <input id="login-clave" {...register('password')} type="password" autoComplete="current-password" placeholder="••••••" className="input-taller" />
        </div>
        <button className="btn-ambar">Entrar</button>
        <p className="text-sm text-piedra text-center">
          ¿Sin cuenta? <Link to="/registro" className="text-ambar-brillo font-semibold">Regístrate</Link>
        </p>
      </form>
    </main>
  )
}
