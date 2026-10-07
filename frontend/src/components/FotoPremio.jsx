import { urlFoto } from '../api/client'

export function FotoPremio({ src, nombre, grande }) {
  const url = urlFoto(src)
  const alto = grande ? 'h-48' : 'h-32'
  if (!url) {
    return (
      <div className={`w-full ${alto} rounded-xl bg-madera-600 border border-ambar/20 flex items-center justify-center`} aria-hidden="true">
        <span className="font-display text-4xl text-ambar/40">{(nombre || '?').slice(0, 1).toUpperCase()}</span>
      </div>
    )
  }
  return (
    <img
      src={url}
      alt={`Premio ${nombre}`}
      loading="lazy"
      className={`w-full ${alto} rounded-xl object-cover border border-amber/20`}
    />
  )
}
