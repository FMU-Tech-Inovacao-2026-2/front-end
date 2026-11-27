import { createContext, useContext, type ReactNode } from 'react'
import type { ApiAlta } from './alta'

export interface Apis {
  alta: ApiAlta
}

const ContextoApi = createContext<Apis | null>(null)

/** Entrega as APIs ao app. Nos testes, recebe versões falsas. */
export function ApiProvider({ apis, children }: { apis: Apis; children: ReactNode }) {
  return <ContextoApi.Provider value={apis}>{children}</ContextoApi.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useApi(): Apis {
  const apis = useContext(ContextoApi)
  if (!apis) throw new Error('useApi precisa estar dentro de <ApiProvider>.')
  return apis
}
