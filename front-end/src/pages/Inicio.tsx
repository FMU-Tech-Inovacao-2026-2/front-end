import { useEffect } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/AuthProvider'
import type { Perfil } from '../auth/tipos'
import { Cabecalho } from '../components/Cabecalho'

interface Modulo {
  nome: string
  descricao: string
  /** Rota do módulo; sem ela, o módulo aparece como "Em construção". */
  rota?: string
}

const MODULOS: Record<Perfil, Modulo[]> = {
  profissional: [
    {
      nome: 'Alta Assistida',
      descricao: 'Transforma o sumário de alta num plano de cuidados que o paciente segue em casa.',
      rota: '/alta/novo',
    },
    { nome: 'Prescrição Assistida', descricao: 'Estrutura a prescrição, confere a origem de cada item e avisa sobre alergias.' },
    { nome: 'Paciente Assistido', descricao: 'Chat com o histórico do paciente, sempre com a fonte de cada resposta.' },
  ],
  paciente: [
    { nome: 'Meu plano de cuidados', descricao: 'Remédios, cuidados e retornos aprovados pela sua equipe de saúde.' },
  ],
}

export default function Inicio() {
  const { usuario } = useAuth()

  useEffect(() => {
    document.title = 'Início · HealthIA'
  }, [])

  if (!usuario) return null
  const profissional = usuario.perfil === 'profissional'

  return (
    <div className="min-h-dvh">
      <Cabecalho />
      <main id="conteudo" className="mx-auto flex max-w-205 flex-col gap-6 px-5 py-11">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">{profissional ? 'Olá, profissional' : 'Olá'}</h1>
          <p className="text-base text-texto-suave">
            {profissional
              ? 'Escolha um módulo para começar.'
              : 'Aqui você acompanha o plano de cuidados aprovado pela sua equipe de saúde.'}
          </p>
        </div>
        <ul className="flex flex-col gap-3">
          {MODULOS[usuario.perfil].map((modulo) => (
            <li key={modulo.nome}>
              {modulo.rota ? (
                <Link
                  to={modulo.rota}
                  className="pressionavel flex flex-col gap-1 rounded-xl border bg-white p-5 hover:border-destaque focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-destaque/40"
                >
                  <h2 className="text-lg font-semibold">{modulo.nome}</h2>
                  <span className="text-[0.9375rem] leading-snug text-texto-suave">{modulo.descricao}</span>
                  <span className="text-sm font-semibold text-destaque-escuro">Disponível</span>
                </Link>
              ) : (
                <div className="flex flex-col gap-1 rounded-xl border bg-white p-5">
                  <h2 className="text-lg font-semibold">{modulo.nome}</h2>
                  <p className="text-[0.9375rem] leading-snug text-texto-suave">{modulo.descricao}</p>
                  <p className="text-sm font-semibold text-texto-suave">Em construção</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
