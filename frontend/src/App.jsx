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

// el admin no juega: solo ve su panel
function SoloJugador({ children }) {
  const usuario = usarSesion((s) => s.usuario)
  if (usuario?.es_admin) return <Navigate to="/admin" replace />
  return children
}

function SoloAdmin({ children }) {
  const usuario = usarSesion((s) => s.usuario)
  if (!usuario?.es_admin) return <Navigate to="/jugar" replace />
  return children
}

function Inicio() {
  const usuario = usarSesion((s) => s.usuario)
  return <Navigate to={usuario?.es_admin ? '/admin' : '/jugar'} replace />
}

function Barra() {
  const usuario = usarSesion((s) => s.usuario)
  const salir = usarSesion((s) => s.salir)
  const nav = useNavigate()
  if (!usuario) return null
  if (usuario.es_admin) {
    return (
      <nav className="bg-[#241610] border-b border-amber-500/20 text-amber-100 px-4 py-2 flex gap-4 text-sm items-center">
        <span className="font-black text-amber-400">Rifa Láser · Admin</span>
        <button
          onClick={() => { salir(); nav('/login') }}
          className="ml-auto text-stone-400"
        >
          Salir
        </button>
      </nav>
    )
  }
  return (
    <nav className="bg-[#241610] border-b border-amber-500/20 text-amber-100 px-4 py-2 flex gap-4 text-sm items-center">
      <Link to="/jugar" className="font-black text-amber-400">Rifa Láser</Link>
      <Link to="/jugar/galeria">Galería</Link>
      <Link to="/jugar/ruleta">Ruleta</Link>
      <Link to="/mis-premios">Premios</Link>
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
        <Route path="/canjear" element={<PideLogin><SoloJugador><Canjear /></SoloJugador></PideLogin>} />
        <Route path="/jugar" element={<PideLogin><SoloJugador><Jugar /></SoloJugador></PideLogin>} />
        <Route path="/jugar/galeria" element={<PideLogin><SoloJugador><Galeria /></SoloJugador></PideLogin>} />
        <Route path="/jugar/ruleta" element={<PideLogin><SoloJugador><Ruleta /></SoloJugador></PideLogin>} />
        <Route path="/mis-premios" element={<PideLogin><SoloJugador><Premios /></SoloJugador></PideLogin>} />
        <Route path="/admin" element={<PideLogin><SoloAdmin><Admin /></SoloAdmin></PideLogin>} />
        <Route path="*" element={<Inicio />} />
      </Routes>
    </BrowserRouter>
  )
}
