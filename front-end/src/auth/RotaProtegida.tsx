import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { Cabecalho } from '../components/Cabecalho'
import { useAuth } from './AuthProvider'
import type { Perfil } from './tipos'

interface Props {
  children: ReactNode
  /** Perfis que podem abrir a tela. Sem a lista, basta estar logado. */
  perfis?: Perfil[]
}

/**
 * Só deixa passar quem fez login e tem o perfil certo. Isto melhora a
 * experiência, mas não é segurança: o back-end confere o perfil em toda rota.
 */
export function RotaProtegida({ children, perfis }: Props) {
  const { usuario, carregando } = useAuth()
  const local = useLocation()

  if (carregando) {
    return (
      <p role="status" className="p-8 text-texto-suave">
        Carregando…
      </p>
    )
  }
  if (!usuario) return <Navigate to="/entrar" replace state={{ voltarPara: local.pathname }} />
  if (perfis && !perfis.includes(usuario.perfil)) return <SemPermissao />
  return <>{children}</>
}

function SemPermissao() {
  return (
    <div className="min-h-dvh">
      <Cabecalho />
      <main id="conteudo" className="mx-auto flex max-w-205 flex-col items-start gap-4 px-5 py-11">
        <h1 className="text-2xl font-bold">Seu perfil não tem acesso a esta função</h1>
        <p className="text-base text-texto-suave">Se você acha que deveria ter acesso, fale com o administrador da sua unidade.</p>
        <Link
          to="/"
          className="pressionavel inline-flex min-h-11 items-center rounded-lg bg-marca px-5 font-semibold text-white hover:bg-marca-escura focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-destaque/50 focus-visible:ring-offset-2"
        >
          Voltar para o início
        </Link>
      </main>
    </div>
  )
}
