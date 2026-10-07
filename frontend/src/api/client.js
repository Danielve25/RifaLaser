const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

async function una(path, opts = {}) {
  const r = await fetch(BASE + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) {
    const e = new Error(data.error || 'fallo')
    e.status = r.status
    throw e
  }
  return data
}

// doble intento solo si se cae la red, el 409 se muestra tal cual
export async function api(path, opts = {}) {
  try {
    return await una(path, opts)
  } catch (e) {
    if (e.status) throw e
    await new Promise((r) => setTimeout(r, 600))
    return una(path, opts)
  }
}

export const wsUrl = (token) => {
  const base = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws'
  return `${base}?token=${token}`
}

// la foto puede ser URL externa o archivo del servidor (/uploads/...)
export function urlFoto(ruta) {
  if (!ruta) return ''
  if (/^https?:\/\//i.test(ruta)) return ruta
  try {
    return new URL(BASE).origin + ruta
  } catch {
    return ruta
  }
}

// subida de archivo: sin Content-Type json para que vaya el borde
export async function subirFoto(path, archivo) {
  const forma = new FormData()
  forma.append('foto', archivo)
  const r = await fetch(BASE + path, { method: 'POST', credentials: 'include', body: forma })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) {
    const e = new Error(data.error || 'fallo')
    e.status = r.status
    throw e
  }
  return data
}
