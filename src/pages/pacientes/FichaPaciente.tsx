import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useApi } from '../../api/ApiProvider'
import type { FichaCompleta, ResumoSumario, SumarioPaciente } from '../../api/pacientes'
import { useTratarErro } from '../../api/useTratarErro'
import { Aviso } from '../../components/Aviso'
import { Carregando, Pagina } from '../../components/Pagina'
import { formatarData, formatarDataCivil, formatarDataHora, formatarNumero, idade, plural } from '../../lib/formatar'
import { COR_CATEGORIA, ROTULO_CATEGORIA } from '../alta/categorias'
import { FormularioPaciente } from './FormularioPaciente'

const ROTULO_ORIGEM: Record<ResumoSumario['origem'], string> = {
  texto: 'Texto digitado',
  arquivo: 'Arquivo',
  pdf_ia: 'PDF transcrito pela IA',
}

/** Ficha do paciente: dados, sumários, altas e plano vigente. */
export default function FichaPaciente() {
  const { id = '' } = useParams()
  const { pacientes, alta } = useApi()
  const tratarErro = useTratarErro()
  const navegar = useNavigate()
  const [ficha, setFicha] = useState<FichaCompleta | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [editando, setEditando] = useState(false)
  const [aberto, setAberto] = useState<SumarioPaciente | null>(null)
  const [gerando, setGerando] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    try {
      setFicha(await pacientes.ficha(id))
      setErro(null)
    } catch (falha) {
      const mensagem = await tratarErro(falha, 'Não foi possível carregar a ficha.')
      if (mensagem) setErro(mensagem)
    }
  }, [pacientes, id, tratarErro])

  useEffect(() => { void carregar() }, [carregar])

  async function verSumario(sumarioId: string) {
    if (aberto?.id === sumarioId) { setAberto(null); return }
    try {
      setAberto(await pacientes.buscarSumario(id, sumarioId))
    } catch (falha) {
      const mensagem = await tratarErro(falha)
      if (mensagem) setErro(mensagem)
    }
  }

  async function gerarPlano(sumarioId: string) {
    if (gerando) return
    setGerando(sumarioId)
    setErro(null)
    try {
      const extracao = await alta.criarExtracao({ origem: 'ficha', paciente_id: id, sumario_id: sumarioId })
      navegar(`/alta/extracoes/${encodeURIComponent(extracao.id)}`)
    } catch (falha) {
      const mensagem = await tratarErro(falha, 'Não foi possível gerar as sugestões.')
      setGerando(null)
      if (mensagem) setErro(mensagem)
    }
  }

  if (!ficha) {
    return (
      <Pagina titulo="Ficha do paciente">
        {erro ? (
          <>
            <Aviso tom="erro" titulo="Não foi possível abrir a ficha" anunciar>{erro}</Aviso>
            <Link to="/pacientes" className="botao-secundario self-start">Voltar aos pacientes</Link>
          </>
        ) : <Carregando texto="Carregando ficha…" />}
      </Pagina>
    )
  }

  const { paciente, sumarios, extracoes, plano_vigente: plano } = ficha
  const anos = idade(paciente.data_nascimento)

  return (
    <Pagina titulo={paciente.nome}>
      <nav aria-label="Trilha" className="text-sm text-texto-suave">
        <Link to="/pacientes" className="foco rounded font-semibold text-destaque-escuro hover:underline">Pacientes</Link> / {paciente.nome}
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">{paciente.nome}</h1>
          <p className="text-base text-texto-suave">
            Prontuário <span className="font-mono font-semibold text-marca">{paciente.numero_prontuario}</span> · nascimento {formatarDataCivil(paciente.data_nascimento)}
            {anos !== null ? ` (${anos} anos)` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to={`/pacientes/${encodeURIComponent(id)}/sumarios/novo`} className="botao-primario min-h-12 px-6">Adicionar sumário</Link>
          <Link to={`/alta/novo?paciente=${encodeURIComponent(id)}`} className="botao-secundario min-h-12">Nova alta rápida</Link>
        </div>
      </header>

      {erro ? <Aviso tom="erro" anunciar>{erro}</Aviso> : null}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <section aria-labelledby="titulo-dados" className="cartao flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 id="titulo-dados" className="text-lg font-semibold">Dados cadastrais</h2>
            {!editando ? <button type="button" onClick={() => setEditando(true)} className="botao-discreto -mr-3">Editar</button> : null}
          </div>
          {editando ? (
            <FormularioPaciente
              comEmail={false}
              inicial={paciente}
              rotuloEnviar="Salvar alterações"
              aoCancelar={() => setEditando(false)}
              aoEnviar={async ({ email: _email, ...dados }) => {
                void _email
                await pacientes.atualizar(id, dados)
                setEditando(false)
                await carregar()
              }}
            />
          ) : (
            <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
              <dt className="text-texto-suave">E-mail de acesso</dt><dd className="font-semibold break-all">{paciente.email}</dd>
              <dt className="text-texto-suave">Telefone</dt><dd className="font-semibold">{paciente.telefone ?? '—'}</dd>
              <dt className="text-texto-suave">Responsável</dt><dd className="font-semibold">{paciente.responsavel ?? '—'}</dd>
              <dt className="text-texto-suave">Observações</dt><dd className="whitespace-pre-wrap">{paciente.observacoes ?? '—'}</dd>
              <dt className="text-texto-suave">Cadastrado em</dt><dd>{formatarData(paciente.criado_em)}</dd>
              {paciente.atualizado_em ? <><dt className="text-texto-suave">Atualizado em</dt><dd>{formatarDataHora(paciente.atualizado_em)}</dd></> : null}
            </dl>
          )}
        </section>

        <div className="flex flex-col gap-6">
          <section aria-labelledby="titulo-plano" className="cartao flex flex-col gap-3 p-5">
            <h2 id="titulo-plano" className="text-lg font-semibold">Plano de cuidados vigente</h2>
            {plano ? (
              <>
                <p className="text-sm text-texto-suave">
                  Aprovado {plano.aceite ? `por ${plano.aceite.profissional_nome} em ${formatarDataHora(plano.aceite.registrado_em)}` : `em ${formatarDataHora(plano.criado_em)}`} · {plural(plano.itens.length, 'item', 'itens')}
                </p>
                <ul className="flex flex-wrap gap-2">
                  {plano.itens.map((item) => (
                    <li key={item.id} className={`rounded-full px-3 py-1 text-sm font-semibold ${COR_CATEGORIA[item.categoria]}`}>
                      <span className="sr-only">{ROTULO_CATEGORIA[item.categoria]}: </span>{item.titulo}
                    </li>
                  ))}
                </ul>
                <Link to={`/alta/extracoes/${encodeURIComponent(plano.extracao_id)}/revisao-final`} className="botao-discreto -ml-3 self-start">Ver comprovante do aceite</Link>
              </>
            ) : <p className="text-sm text-texto-suave">Nenhum plano aprovado ainda.</p>}
          </section>

          <section aria-labelledby="titulo-sumarios" className="cartao flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 id="titulo-sumarios" className="text-lg font-semibold">Sumários de alta ({sumarios.length})</h2>
              <Link to={`/pacientes/${encodeURIComponent(id)}/sumarios/novo`} className="botao-discreto -mr-3">Adicionar</Link>
            </div>
            {sumarios.length === 0 ? (
              <p className="text-sm text-texto-suave">Adicione um sumário digitado, um TXT ou um PDF. PDFs digitalizados podem ser transcritos pela IA.</p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {sumarios.map((sumario) => (
                  <li key={sumario.id} className="flex flex-col gap-3 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold">{sumario.titulo}</h3>
                        <p className="text-sm text-texto-suave">
                          {ROTULO_ORIGEM[sumario.origem]}{sumario.nome_arquivo ? ` · ${sumario.nome_arquivo}` : ''} · {formatarNumero.format(sumario.caracteres)} caracteres · {formatarDataHora(sumario.criado_em)}
                        </p>
                        {sumario.transcricao_ia ? <p className="mt-1 text-xs font-semibold text-atencao">Transcrição da IA conferida pelo profissional</p> : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => void verSumario(sumario.id)} aria-expanded={aberto?.id === sumario.id} className="botao-secundario min-h-10">
                          {aberto?.id === sumario.id ? 'Ocultar texto' : 'Ver texto'}
                        </button>
                        <button type="button" onClick={() => void gerarPlano(sumario.id)} disabled={gerando !== null} className="botao-primario min-h-10">
                          {gerando === sumario.id ? 'Gerando…' : 'Gerar plano de alta'}
                        </button>
                      </div>
                    </div>
                    {aberto?.id === sumario.id ? (
                      <pre className="max-h-72 overflow-auto rounded-lg bg-superficie p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap">{aberto.texto}</pre>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="titulo-altas" className="cartao flex flex-col gap-3 p-5">
            <h2 id="titulo-altas" className="text-lg font-semibold">Histórico de altas</h2>
            {extracoes.length === 0 ? <p className="text-sm text-texto-suave">Nenhuma alta criada por você para este paciente.</p> : (
              <ul className="divide-y rounded-lg border">
                {extracoes.map((item) => {
                  const aprovado = item.status === 'aprovado'
                  const destino = `/alta/extracoes/${encodeURIComponent(item.id)}${aprovado ? '/revisao-final' : ''}`
                  return (
                    <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="font-semibold">{item.titulo}</p>
                        <p className="text-sm text-texto-suave">{formatarDataHora(item.criado_em)} · {aprovado ? `${item.total_aprovadas} de ${item.total_sugestoes} itens aprovados` : `${item.total_sugestoes} sugestões`}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${aprovado ? 'bg-sucesso-fundo text-sucesso' : 'bg-atencao-fundo text-atencao'}`}>{aprovado ? 'Aprovada' : 'Aguardando revisão'}</span>
                        <Link to={destino} className="botao-secundario min-h-10">{aprovado ? 'Comprovante' : 'Revisar'}<span className="sr-only">: {item.titulo}</span></Link>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </Pagina>
  )
}
