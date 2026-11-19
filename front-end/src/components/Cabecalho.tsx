import { Link, useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthProvider'
import { LogoHealthIA } from './Logo'

/** Cabeçalho das telas logadas: logo (volta ao início), e-mail e Sair. */
export function Cabecalho() {
  const { usuario, sair } = useAuth()
  const navegar = useNavigate()

  async function sairDaConta() {
    await sair()
    navegar('/entrar', { replace: true })
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b bg-white px-6 py-3.5">
      <Link
        to="/"
        aria-label="HealthIA, ir para o início"
        className="rounded-lg focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-destaque/40"
      >
        <LogoHealthIA />
      </Link>
      <div className="flex items-center gap-4 text-sm">
        {usuario ? <span className="text-texto-suave">{usuario.email}</span> : null}
        <button
          type="button"
          onClick={sairDaConta}
          className="pressionavel min-h-11 rounded-lg border border-borda-campo px-4 font-semibold hover:bg-superficie focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-destaque/40"
        >
          Sair
        </button>
      </div>
    </header>
  )
}
