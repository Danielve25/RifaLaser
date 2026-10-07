import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, wsUrl } from '../api/client'
import { usarSesion } from '../store/sesion'

export function usarRondaActiva() {
  return useQuery({
    queryKey: ['ronda'],
    queryFn: () => api('/rounds/active'),
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    retry: 1,
  })
}

export function usarBoletas(rondaId) {
  return useQuery({
    queryKey: ['boletas', rondaId],
    queryFn: () => api(`/rounds/${rondaId}/tickets`),
    enabled: !!rondaId,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  })
}

export function usarSaldo() {
  return useQuery({
    queryKey: ['saldo'],
    queryFn: () => api('/codes/saldo'),
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  })
}

// socket avisa, el polling cubre si se cae
export function usarSocket(rondaId) {
  const qc = useQueryClient()
  const token = usarSesion((s) => s.token)
  useEffect(() => {
    if (!rondaId || !token) return
    let ws
    let vivo = true
    let espera = 1000
    const entra = () => {
      ws = new WebSocket(wsUrl(rondaId, token))
      ws.onmessage = () => {
        qc.invalidateQueries({ queryKey: ['boletas', rondaId] })
        qc.invalidateQueries({ queryKey: ['ronda'] })
      }
      ws.onclose = () => {
        if (!vivo) return
        setTimeout(() => {
          espera = Math.min(espera * 2, 10000)
          entra()
        }, espera)
      }
    }
    entra()
    return () => {
      vivo = false
      ws?.close()
    }
  }, [rondaId, token, qc])
}
