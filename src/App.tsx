import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { RotaProtegida } from './auth/RotaProtegida'
import type { Perfil } from './auth/tipos'
import Entrar from './pages/Entrar'

// Cada tela logada só é baixada quando aberta.
const Inicio = lazy(() => import('./pages/Inicio'))
const EnvioSumario = lazy(() => import('./pages/alta/EnvioSumario'))
const RevisaoProvisoria = lazy(() => import('./pages/alta/RevisaoProvisoria'))

function Tela({ children, perfis }: { children: ReactNode; perfis?: Perfil[] }) {
  return (
    <RotaProtegida perfis={perfis}>
      <Suspense fallback={<p role="status" className="p-8 text-texto-suave">Carregando…</p>}>{children}</Suspense>
    </RotaProtegida>
  )
}

export function Rotas() {
  return (
    <Routes>
      <Route path="/entrar" element={<Entrar />} />
      <Route path="/" element={<Tela><Inicio /></Tela>} />
      <Route path="/alta/novo" element={<Tela perfis={['profissional']}><EnvioSumario /></Tela>} />
      <Route path="/alta/extracoes/:id" element={<Tela perfis={['profissional']}><RevisaoProvisoria /></Tela>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
