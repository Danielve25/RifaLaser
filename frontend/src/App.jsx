import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom'
import { usarSesion } from './store/sesion'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Canjear from './pages/Canjear'
import Jugar from './pages/Jugar'
import Galeria from './pages/Galeria'
import Ruleta from './pages/Ruleta'
import Premios from './pages/Premios'
import Admin from './pages/Admin'

function PideLogin({ children }) {
  const usuario = usarSesion((s) => s.usuario)
  if (!usuario) return <Navigate to="/login" replace />
  return children
}

function Barra() {
  const usuario = usarSesion((s) => s.usuario)
  const salir = usarSesion((s) => s.salir)
  const nav = useNavigate()
  if (!usuario) return null
  return (
    <nav className="bg-[#241610] border-b border-amber-500/20 text-amber-100 px-4 py-2 flex gap-4 text-sm items-center">
      <Link to="/jugar" className="font-black text-amber-400">Rifa Láser</Link>
      <Link to="/jugar/galeria">Galería</Link>
      <Link to="/jugar/ruleta">Ruleta</Link>
      <Link to="/mis-premios">Premios</Link>
      {usuario.es_admin && <Link to="/admin">Admin</Link>}
      <button
        onClick={() => { salir(); nav('/login') }}
        className="ml-auto text-stone-400"
      >
        Salir
      </button>
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Barra />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/canjear" element={<PideLogin><Canjear /></PideLogin>} />
        <Route path="/jugar" element={<PideLogin><Jugar /></PideLogin>} />
        <Route path="/jugar/galeria" element={<PideLogin><Galeria /></PideLogin>} />
        <Route path="/jugar/ruleta" element={<PideLogin><Ruleta /></PideLogin>} />
        <Route path="/mis-premios" element={<PideLogin><Premios /></PideLogin>} />
        <Route path="/admin" element={<PideLogin><Admin /></PideLogin>} />
        <Route path="*" element={<Navigate to="/jugar" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
