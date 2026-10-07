import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '../api/client'
import { usarSesion } from '../store/sesion'

const esquema = z.object({
  nombre: z.string().min(2, 'nombre muy corto'),
  whatsapp: z.string().min(6, 'teléfono muy corto'),
  direccion: z.string().min(5, 'dirección muy corta'),
  password: z.string().min(6, 'mínimo 6 letras'),
})

const campos = [
  ['nombre', 'Nombre', 'Ana María', 'name', 'text'],
  ['whatsapp', 'Teléfono', '300 123 4567', 'tel', 'tel'],
  ['direccion', 'Dirección de entrega', 'Calle 10 #5-20', 'street-address', 'text'],
]

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

  return (
    <main className="pantalla flex items-center justify-center">
      <form onSubmit={handleSubmit(va)} className="caja">
        <div>
          <p className="font-display text-ambar text-sm tracking-widest">TALLER · CORTE LÁSER</p>
          <h1 className="font-display text-3xl mt-1">Crea tu cuenta</h1>
        </div>
        {campos.map(([c, label, ph, ac, type]) => (
          <div key={c}>
            <label className="etiqueta" htmlFor={`reg-${c}`}>{label}</label>
            <input id={`reg-${c}`} {...register(c)} placeholder={ph} autoComplete={ac} inputMode={type === 'tel' ? 'tel' : undefined} className="input-taller" />
            {formState.errors[c] && <p className="text-xs text-red-400 mt-1">{formState.errors[c].message}</p>}
          </div>
        ))}
        <div>
          <label className="etiqueta" htmlFor="reg-password">Clave</label>
          <input id="reg-password" {...register('password')} type="password" autoComplete="new-password" placeholder="Mínimo 6 letras" className="input-taller" />
          {formState.errors.password && <p className="text-xs text-red-400 mt-1">{formState.errors.password.message}</p>}
        </div>
        <button className="btn-ambar">Registrarme</button>
        <p className="text-sm text-piedra text-center">
          ¿Ya tienes? <Link to="/login" className="text-ambar-brillo font-semibold">Entra</Link>
        </p>
      </form>
    </main>
  )
}
