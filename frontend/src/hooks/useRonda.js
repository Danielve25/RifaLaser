import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, wsUrl } from '../api/client'
import { usarSesion } from '../store/sesion'

export function usarStock() {
  return useQuery({
    queryKey: ['stock'],
    queryFn: () => api('/tickets/estado'),
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    retry: 1,
  })
}

export function usarBoletas() {
  return useQuery({
    queryKey: ['boletas'],
    queryFn: () => api('/tickets'),
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
export function usarSocket() {
  const qc = useQueryClient()
  const token = usarSesion((s) => s.token)
  useEffect(() => {
    if (!token) return
    let ws
    let vivo = true
    let espera = 1000
    const entra = () => {
      ws = new WebSocket(wsUrl(token))
      ws.onmessage = () => {
        qc.invalidateQueries({ queryKey: ['boletas'] })
        qc.invalidateQueries({ queryKey: ['stock'] })
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
  }, [token, qc])
}
