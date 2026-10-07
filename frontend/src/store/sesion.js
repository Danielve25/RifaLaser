import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const usarSesion = create(
  persist(
    (set) => ({
      usuario: null,
      token: null,
      entrar: (usuario, token) => set({ usuario, token }),
      salir: () => set({ usuario: null, token: null }),
    }),
    { name: 'rifa-laser' }
  )
)
