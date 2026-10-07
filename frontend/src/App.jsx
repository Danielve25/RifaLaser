import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
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

const icono = 'w-4 h-4 shrink-0'
const IconoTicket = () => (
  <svg className={icono} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-6z" />
    <path d="M13 5v2m0 4v2m0 4v2" strokeDasharray="2 2" />
  </svg>
)
const IconoDado = () => (
  <svg className={icono} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <circle cx="8.5" cy="8.5" r="1" fill="currentColor" />
    <circle cx="15.5" cy="15.5" r="1" fill="currentColor" />
    <circle cx="15.5" cy="8.5" r="1" fill="currentColor" />
    <circle cx="8.5" cy="15.5" r="1" fill="currentColor" />
  </svg>
)
const IconoRegalo = () => (
  <svg className={icono} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="8" width="18" height="4" />
    <path d="M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8M12 8v13M12 8S7 8 5 6s1-4 3-2 4 4 4 4zm0 0s5 0 7-2 1-4-3-2-4 4-4 4z" />
  </svg>
)
const IconoLlave = () => (
  <svg className={icono} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="8" cy="15" r="4" />
    <path d="M11 12l9-9m-4 4l3 3" />
  </svg>
)

function Enlace({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-1.5 px-2 py-2 text-sm min-h-[44px] transition-colors ${
          isActive ? 'text-ambar-brillo font-bold' : 'text-crema/70 hover:text-crema'
        }`
      }
    >
      {children}
    </NavLink>
  )
}

function Barra() {
  const usuario = usarSesion((s) => s.usuario)
  const salir = usarSesion((s) => s.salir)
  const nav = useNavigate()
  if (!usuario) return null
  if (usuario.es_admin) {
    return (
      <nav className="sticky top-0 z-20 bg-madera-900/90 backdrop-blur border-b border-ambar/20 px-4 flex gap-2 text-sm items-center">
        <span className="font-display text-ambar px-2 py-2">Rifa Láser · Admin</span>
        <button
          onClick={() => { salir(); nav('/login') }}
          className="ml-auto text-piedra px-2 py-2 min-h-[44px] hover:text-crema"
        >
          Salir
        </button>
      </nav>
    )
  }
  return (
    <nav className="sticky top-0 z-20 bg-madera-900/90 backdrop-blur border-b border-ambar/20 px-2 flex gap-1 text-sm items-center overflow-x-auto">
      <NavLink to="/jugar" className="font-display text-ambar px-2 py-2 whitespace-nowrap">Rifa Láser</NavLink>
      <Enlace to="/canjear"><IconoLlave />Canjear</Enlace>
      <Enlace to="/jugar/galeria"><IconoTicket />Galería</Enlace>
      <Enlace to="/jugar/ruleta"><IconoDado />Ruleta</Enlace>
      <Enlace to="/mis-premios"><IconoRegalo />Premios</Enlace>
      <button
        onClick={() => { salir(); nav('/login') }}
        className="ml-auto text-piedra px-2 py-2 min-h-[44px] hover:text-crema whitespace-nowrap"
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
