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

export const wsUrl = (rondaId, token) => {
  const base = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws'
  return `${base}/rounds/${rondaId}?token=${token}`
}
