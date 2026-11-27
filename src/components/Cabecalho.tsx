import { Link, NavLink, useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthProvider'
import { LogoHealthIA } from './Logo'

const NOME_PERFIL = { profissional: 'Profissional de saúde', paciente: 'Paciente' } as const

/** Cabeçalho das telas logadas: logo, navegação por perfil, identificação e Sair. */
export function Cabecalho() {
  const { usuario, sair, modoDemonstracao } = useAuth()
  const navegar = useNavigate()

  async function sairDaConta() {
    await sair()
    navegar('/entrar', { replace: true })
  }

  const links = usuario?.perfil === 'profissional'
    ? [{ para: '/', rotulo: 'Início' }, { para: '/alta/novo', rotulo: 'Nova alta' }]
    : usuario?.perfil === 'paciente'
      ? [{ para: '/', rotulo: 'Início' }, { para: '/alta/meu-plano', rotulo: 'Meu plano' }]
      : []

  return (
    <header className="nao-imprimir border-b bg-white">
      {modoDemonstracao ? (
        <p className="bg-marca px-4 py-1.5 text-center text-[0.8125rem] font-semibold text-texto-sobre-marca">
          Modo demonstração · dados fictícios no navegador, sem IA e sem servidor
        </p>
      ) : null}
      <div className="mx-auto flex max-w-300 flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link to="/" aria-label="HealthIA, ir para o início" className="foco rounded-lg">
            <LogoHealthIA />
          </Link>
          {links.length ? (
            <nav aria-label="Principal" className="hidden sm:block">
              <ul className="flex gap-1">
                {links.map((link) => (
                  <li key={link.para}>
                    <NavLink
                      to={link.para}
                      end
                      className={({ isActive }) =>
                        `foco inline-flex min-h-11 items-center rounded-lg px-3 text-[0.9375rem] font-semibold ${isActive ? 'bg-destaque-fundo text-destaque-escuro' : 'text-texto-suave hover:bg-superficie hover:text-marca'}`
                      }
                    >
                      {link.rotulo}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>
        <div className="flex items-center gap-3 text-sm">
          {usuario ? (
            <span className="hidden flex-col items-end leading-tight sm:flex">
              <span className="font-semibold text-marca">{usuario.nome ?? usuario.email}</span>
              <span className="text-texto-suave">{NOME_PERFIL[usuario.perfil]}</span>
            </span>
          ) : null}
          <button type="button" onClick={sairDaConta} className="botao-secundario">
            Sair
          </button>
        </div>
      </div>
    </header>
  )
}
