import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useApi } from '../api/ApiProvider'
import type { ResumoExtracao } from '../api/alta'
import { reiniciarDemonstracao } from '../api/demonstracao'
import { useTratarErro } from '../api/useTratarErro'
import { useAuth } from '../auth/AuthProvider'
import { Aviso } from '../components/Aviso'
import { Pagina } from '../components/Pagina'
import { formatarDataHora } from '../lib/formatar'

interface Modulo {
  nome: string
  descricao: string
  /** Rota do módulo; sem ela, o módulo aparece como "Em construção". */
  rota?: string
}

const MODULOS_PROFISSIONAL: Modulo[] = [
  { nome: 'Alta Assistida', descricao: 'Transforma o sumário de alta num plano de cuidados que o paciente segue em casa.', rota: '/alta/novo' },
  { nome: 'Prescrição Assistida', descricao: 'Estrutura a prescrição, confere a origem de cada item e avisa sobre alergias.' },
  { nome: 'Paciente Assistido', descricao: 'Chat com o histórico do paciente, sempre com a fonte de cada resposta.' },
]

const ROTEIRO = [
  'Em “Nova alta”, escolha o sumário cardiológico da base e gere as sugestões.',
  'Veja a sugestão com citação inexistente: ela é bloqueada automaticamente.',
  'Aceite, reprove ou edite os demais itens e use “Mostrar no sumário”.',
  'Na revisão final, confirme as declarações do termo e aprove.',
  'Saia e entre como Paciente para ver o plano aprovado.',
]

export default function Inicio() {
  const { usuario } = useAuth()
  if (!usuario) return null
  return usuario.perfil === 'profissional' ? <InicioProfissional nome={usuario.nome} /> : <InicioPaciente nome={usuario.nome} />
}

function InicioProfissional({ nome }: { nome?: string }) {
  const { alta } = useApi()
  const { modoDemonstracao } = useAuth()
  const tratarErro = useTratarErro()
  const [extracoes, setExtracoes] = useState<ResumoExtracao[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    let ignorar = false
    alta.listarExtracoes()
      .then((lista) => { if (!ignorar) setExtracoes(lista) })
      .catch(async (falha: unknown) => {
        const mensagem = await tratarErro(falha, 'Não foi possível carregar as altas recentes.')
        if (!ignorar && mensagem) setErro(mensagem)
      })
    return () => { ignorar = true }
  }, [alta, tratarErro, versao])

  function reiniciar() {
    reiniciarDemonstracao()
    setVersao((atual) => atual + 1)
  }

  const pendentes = extracoes?.filter((item) => item.status === 'pendente').length ?? 0

  return (
    <Pagina titulo="Início">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">Olá, {nome ?? 'profissional'}</h1>
          <p className="text-base text-texto-suave">
            {pendentes > 0 ? `Você tem ${pendentes} alta(s) aguardando sua revisão.` : 'Nenhuma alta aguardando revisão.'}
          </p>
        </div>
        <Link to="/alta/novo" className="botao-primario min-h-12 px-6">Nova alta</Link>
      </div>

      {modoDemonstracao ? (
        <section aria-labelledby="titulo-roteiro" className="cartao flex flex-col gap-3 border-destaque/40 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="titulo-roteiro" className="text-lg font-semibold">Roteiro da demonstração</h2>
            <button type="button" onClick={reiniciar} className="botao-secundario">Reiniciar demonstração</button>
          </div>
          <ol className="grid gap-2 text-[0.9375rem] sm:grid-cols-2 lg:grid-cols-5">
            {ROTEIRO.map((passo, indice) => (
              <li key={passo} className="flex gap-2 rounded-lg bg-superficie p-3">
                <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full bg-marca text-xs font-bold text-white">{indice + 1}</span>
                <span>{passo}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section aria-labelledby="titulo-recentes" className="flex flex-col gap-3">
        <h2 id="titulo-recentes" className="text-xl font-semibold">Altas recentes</h2>
        {erro ? <Aviso tom="erro">{erro}</Aviso> : null}
        {!erro && extracoes === null ? <p role="status" className="text-texto-suave">Carregando…</p> : null}
        {extracoes?.length === 0 ? (
          <div className="cartao p-5 text-[0.9375rem] text-texto-suave">
            Nenhuma alta criada nesta sessão. Comece por <Link to="/alta/novo" className="font-semibold text-destaque-escuro underline underline-offset-4">Nova alta</Link>.
          </div>
        ) : null}
        {extracoes?.length ? (
          <ul className="cartao divide-y">
            {extracoes.map((item) => {
              const aprovado = item.status === 'aprovado'
              const destino = aprovado ? `/alta/extracoes/${encodeURIComponent(item.id)}/revisao-final` : `/alta/extracoes/${encodeURIComponent(item.id)}`
              return (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-semibold">{item.paciente_nome}</p>
                    <p className="text-sm text-texto-suave">
                      {item.titulo} · criada em {formatarDataHora(item.criado_em)} ·{' '}
                      {aprovado ? `${item.total_aprovadas} de ${item.total_sugestoes} itens aprovados` : `${item.total_sugestoes} sugestões`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${aprovado ? 'bg-sucesso-fundo text-sucesso' : 'bg-atencao-fundo text-atencao'}`}>
                      {aprovado ? 'Aprovada' : 'Aguardando revisão'}
                    </span>
                    <Link to={destino} className="botao-secundario min-h-10">
                      {aprovado ? 'Ver comprovante' : 'Revisar'}
                      <span className="sr-only"> alta de {item.paciente_nome}, {item.titulo}</span>
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : null}
      </section>

      <section aria-labelledby="titulo-modulos" className="flex flex-col gap-3">
        <h2 id="titulo-modulos" className="text-xl font-semibold">Módulos</h2>
        <ul className="grid gap-3 md:grid-cols-3">
          {MODULOS_PROFISSIONAL.map((modulo) => (
            <li key={modulo.nome}>
              {modulo.rota ? (
                <Link to={modulo.rota} className="cartao pressionavel foco flex h-full flex-col gap-1 p-5 hover:border-destaque">
                  <h3 className="text-lg font-semibold">{modulo.nome}</h3>
                  <span className="text-[0.9375rem] leading-snug text-texto-suave">{modulo.descricao}</span>
                  <span className="mt-auto pt-2 text-sm font-semibold text-sucesso">Disponível</span>
                </Link>
              ) : (
                <div className="cartao flex h-full flex-col gap-1 bg-superficie/50 p-5">
                  <h3 className="text-lg font-semibold">{modulo.nome}</h3>
                  <p className="text-[0.9375rem] leading-snug text-texto-suave">{modulo.descricao}</p>
                  <p className="mt-auto pt-2 text-sm font-semibold text-texto-suave">Em construção</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </Pagina>
  )
}

function InicioPaciente({ nome }: { nome?: string }) {
  return (
    <Pagina titulo="Início" largura="estreita">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">Olá{nome ? `, ${nome}` : ''}</h1>
        <p className="text-base text-texto-suave">Aqui você acompanha o plano de cuidados aprovado pela sua equipe de saúde.</p>
      </div>
      <Link to="/alta/meu-plano" className="cartao pressionavel foco flex flex-col gap-1 p-5 hover:border-destaque">
        <h2 className="text-lg font-semibold">Meu plano de cuidados</h2>
        <span className="text-[0.9375rem] text-texto-suave">Remédios, cuidados, retornos e sinais de alerta aprovados pela sua equipe.</span>
        <span className="pt-2 text-sm font-semibold text-destaque-escuro">Abrir plano →</span>
      </Link>
    </Pagina>
  )
}
