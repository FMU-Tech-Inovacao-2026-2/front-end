import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { RotaProtegida } from './auth/RotaProtegida'
import type { Perfil } from './auth/tipos'
import Entrar from './pages/Entrar'

// Cada tela é baixada só quando aberta.
const Inicio = lazy(() => import('./pages/Inicio'))
const Privacidade = lazy(() => import('./pages/Privacidade'))
const EnvioSumario = lazy(() => import('./pages/alta/EnvioSumario'))
const RevisaoAlta = lazy(() => import('./pages/alta/RevisaoAlta'))
const AceiteFinal = lazy(() => import('./pages/alta/AceiteFinal'))
const MeuPlano = lazy(() => import('./pages/alta/MeuPlano'))

const carregando = <p role="status" className="p-8 text-texto-suave">Carregando…</p>

function Tela({ children, perfis }: { children: ReactNode; perfis?: Perfil[] }) {
  return (
    <RotaProtegida perfis={perfis}>
      <Suspense fallback={carregando}>{children}</Suspense>
    </RotaProtegida>
  )
}

export function Rotas() {
  return (
    <Routes>
      <Route path="/entrar" element={<Entrar />} />
      <Route path="/privacidade" element={<Suspense fallback={carregando}><Privacidade /></Suspense>} />
      <Route path="/" element={<Tela><Inicio /></Tela>} />
      <Route path="/alta/novo" element={<Tela perfis={['profissional']}><EnvioSumario /></Tela>} />
      <Route path="/alta/extracoes/:id" element={<Tela perfis={['profissional']}><RevisaoAlta /></Tela>} />
      <Route path="/alta/extracoes/:id/revisao-final" element={<Tela perfis={['profissional']}><AceiteFinal /></Tela>} />
      <Route path="/alta/meu-plano" element={<Tela perfis={['paciente']}><MeuPlano /></Tela>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
