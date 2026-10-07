export function Titulo({ children, subtitulo }) {
  return (
    <header className="space-y-1">
      <h1 className="titulo-pagina">{children}</h1>
      {subtitulo && <p className="text-sm text-piedra">{subtitulo}</p>}
    </header>
  )
}
