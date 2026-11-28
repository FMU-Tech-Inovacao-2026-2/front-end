import { useEffect, useId, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useApi } from '../../api/ApiProvider'
import type { ExtracaoAlta, PlanoComReprovacoes, ReprovacaoRegistrada, SugestaoAlta, TermoAceite } from '../../api/alta'
import { ErroApi } from '../../api/erros'
import { useTratarErro } from '../../api/useTratarErro'
import { useAuth } from '../../auth/AuthProvider'
import { Aviso } from '../../components/Aviso'
import { Carregando, Pagina } from '../../components/Pagina'
import { formatarDataHora, plural } from '../../lib/formatar'
import { COR_CATEGORIA, ORDEM_CATEGORIA, ROTULO_CATEGORIA } from './categorias'
import { EtapasAlta } from './EtapasAlta'
import { lerRascunho, limparRascunho, paraAprovacao } from './rascunho'

export default function AceiteFinal() {
  const { id = '' } = useParams()
  const { alta } = useApi()
  const { usuario, modoDemonstracao } = useAuth()
  const tratarErro = useTratarErro()
  const idForm = useId()

  const [extracao, setExtracao] = useState<ExtracaoAlta | null>(null)
  const [termo, setTermo] = useState<TermoAceite | null>(null)
  const [plano, setPlano] = useState<PlanoComReprovacoes | null>(null)
  const [marcadas, setMarcadas] = useState<string[]>([])
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let ignorar = false
    async function carregar() {
      const encontrada = await alta.buscarExtracao(id)
      if (encontrada.status === 'aprovado') {
        const aprovado = await alta.planoDaExtracao(id)
        if (!ignorar) { setExtracao(encontrada); setPlano(aprovado) }
        return
      }
      const termoAtual = await alta.termoAceite()
      if (!ignorar) { setExtracao(encontrada); setTermo(termoAtual) }
    }
    carregar()
      .catch(async (falha: unknown) => {
        const mensagem = await tratarErro(falha, 'Não foi possível carregar a revisão final.')
        if (!ignorar && mensagem) setErro(mensagem)
      })
      .finally(() => { if (!ignorar) setCarregando(false) })
    return () => { ignorar = true }
  }, [alta, id, tratarErro])

  if (carregando) {
    return <Pagina titulo="Revisão final"><EtapasAlta atual={3} /><Carregando texto="Carregando revisão final e termo de aceite…" /></Pagina>
  }

  if (plano) return <Comprovante plano={plano} modoDemonstracao={modoDemonstracao} />

  if (!extracao || !termo) {
    return (
      <Pagina titulo="Revisão final">
        <EtapasAlta atual={3} />
        <Aviso tom="erro" titulo="Não foi possível abrir a revisão final" anunciar>{erro}</Aviso>
        <Link to="/" className="botao-secundario self-start">Voltar ao início</Link>
      </Pagina>
    )
  }

  const rascunho = lerRascunho(extracao.id)
  const verificados = new Set(extracao.sugestoes.filter((item) => item.origem_verificada).map((item) => item.id))
  const { itens: idsAceitos, edicoes, reprovados } = rascunho ? paraAprovacao(rascunho, verificados) : { itens: [] as string[], edicoes: [], reprovados: [] }
  const motivoPorId = new Map(reprovados.map((item) => [item.id, item.motivo]))
  const listaReprovadas = extracao.sugestoes
    .filter((item) => !idsAceitos.includes(item.id))
    .map((item) => ({ ...item, motivo: motivoPorId.get(item.id) ?? (item.origem_verificada ? '' : 'Origem não confirmada (bloqueio automático do servidor).') }))
  const voltarParaRevisao = `/alta/extracoes/${encodeURIComponent(extracao.id)}`

  // Sem decisões registradas (ex.: link aberto direto), não há o que aprovar: nada é presumido.
  if (idsAceitos.length === 0) {
    return (
      <Pagina titulo="Revisão final">
        <EtapasAlta atual={3} />
        <h1 className="text-3xl font-bold">Revisão final e aceite profissional</h1>
        <Aviso tom="atencao" titulo="Nenhuma sugestão aceita nesta revisão">
          Volte à etapa anterior e decida cada sugestão. A aprovação só considera os itens que você aceitou explicitamente.
        </Aviso>
        <Link to={voltarParaRevisao} className="botao-primario self-start">Voltar às sugestões</Link>
      </Pagina>
    )
  }

  const edicoesPorId = new Map(edicoes.map((item) => [item.id, item]))
  const itensFinais: (SugestaoAlta & { editado: boolean })[] = extracao.sugestoes
    .filter((item) => idsAceitos.includes(item.id))
    .map((item) => {
      const edicao = edicoesPorId.get(item.id)
      const editado = Boolean(edicao) && (edicao!.titulo !== item.titulo || edicao!.descricao !== item.descricao)
      return edicao ? { ...item, titulo: edicao.titulo, descricao: edicao.descricao, editado } : { ...item, editado: false }
    })
  const todasMarcadas = termo.declaracoes.every((declaracao) => marcadas.includes(declaracao.id))
  const termoAtual = termo

  function alternar(declaracaoId: string) {
    setMarcadas((atuais) => (atuais.includes(declaracaoId) ? atuais.filter((item) => item !== declaracaoId) : [...atuais, declaracaoId]))
  }

  async function aprovar() {
    if (!extracao || enviando) return
    if (!todasMarcadas) {
      setErro('Confirme todas as declarações do termo de aceite antes de aprovar.')
      return
    }
    setErro(null)
    setEnviando(true)
    try {
      const resultado = await alta.aprovarExtracao(extracao.id, {
        itens_aprovados: itensFinais.map((item) => item.id),
        sugestoes_editadas: edicoes.filter((item) => itensFinais.some((final) => final.id === item.id && final.editado)),
        itens_reprovados: reprovados,
        aceite: { versao_termo: termoAtual.versao, declaracoes: marcadas },
      })
      limparRascunho(extracao.id)
      setPlano(resultado)
    } catch (falha) {
      if (falha instanceof ErroApi && falha.codigo === 'ACEITE_INCOMPLETO') {
        // O termo pode ter mudado no servidor: recarrega e pede nova confirmação.
        const novo = await alta.termoAceite().catch(() => null)
        if (novo) { setTermo(novo); setMarcadas([]) }
      }
      const mensagem = await tratarErro(falha, 'Não foi possível aprovar o plano.')
      if (mensagem) setErro(mensagem)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Pagina titulo="Revisão final">
      <EtapasAlta atual={3} />
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-destaque-escuro">Alta Assistida</p>
        <h1 className="text-3xl font-bold">Revisão final e aceite profissional</h1>
        <p className="max-w-[75ch] text-base text-texto-suave">
          Confira exatamente o que o paciente vai receber. A aprovação registra seu nome, a data, a versão do termo e um código de
          integridade do conteúdo aprovado.
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <section aria-labelledby="titulo-itens" className="cartao flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 id="titulo-itens" className="text-xl font-semibold">Itens selecionados ({itensFinais.length})</h2>
            <Link to={voltarParaRevisao} className="botao-discreto -mr-3">Alterar decisões</Link>
          </div>
          <p className="text-sm text-texto-suave">
            {listaReprovadas.length > 0 ? `${plural(listaReprovadas.length, 'sugestão reprovada fica', 'sugestões reprovadas ficam')} só no comprovante, com o motivo.` : 'Todas as sugestões foram aceitas.'}
          </p>
          {ORDEM_CATEGORIA.map((categoria) => {
            const doGrupo = itensFinais.filter((item) => item.categoria === categoria)
            if (!doGrupo.length) return null
            return (
              <div key={categoria} className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold tracking-wide text-texto-suave uppercase">{ROTULO_CATEGORIA[categoria]}</h3>
                <ul className="grid gap-2">
                  {doGrupo.map((item) => (
                    <li key={item.id} className="rounded-lg border bg-superficie p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold">{item.titulo}</h4>
                        {item.editado ? <span className="rounded-full bg-marca/8 px-2 py-0.5 text-xs font-semibold">Editado por você</span> : null}
                      </div>
                      <p className="mt-1 text-sm text-texto-suave">{item.descricao}</p>
                      <blockquote className="mt-2 border-l-4 border-destaque pl-3 text-sm text-marca">“{item.trecho_origem}”</blockquote>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
          {listaReprovadas.length > 0 ? <ListaReprovacoes itens={listaReprovadas} /> : null}
        </section>

        <section aria-labelledby="titulo-termo" className="cartao flex flex-col gap-4 p-5 lg:sticky lg:top-4">
          <div>
            <h2 id="titulo-termo" className="text-xl font-semibold">{termo.titulo}</h2>
            <p className="mt-1 text-xs text-texto-suave">Versão {termo.versao}</p>
          </div>
          <p className="text-[0.9375rem] leading-relaxed">{termo.resumo}</p>

          <fieldset className="flex flex-col gap-3" aria-describedby={`${idForm}-ajuda`}>
            <legend className="mb-1 text-[0.9375rem] font-semibold">Declaro que:</legend>
            {termo.declaracoes.map((declaracao) => (
              <label key={declaracao.id} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm leading-relaxed has-checked:border-sucesso/50 has-checked:bg-sucesso-fundo">
                <input
                  type="checkbox"
                  checked={marcadas.includes(declaracao.id)}
                  onChange={() => alternar(declaracao.id)}
                  className="foco mt-0.5 size-5 shrink-0 accent-destaque"
                />
                <span>{declaracao.texto}</span>
              </label>
            ))}
          </fieldset>
          <p id={`${idForm}-ajuda`} className="text-xs text-texto-suave">
            Todas as declarações são obrigatórias. {marcadas.length} de {termo.declaracoes.length} confirmadas.
          </p>

          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-lg bg-superficie p-3 text-sm">
            <dt className="text-texto-suave">Responsável</dt>
            <dd className="font-semibold">{usuario?.nome ?? usuario?.email ?? 'Profissional autenticado'}</dd>
            <dt className="text-texto-suave">Itens</dt>
            <dd className="font-semibold">{plural(itensFinais.length, 'item aprovado', 'itens aprovados')}</dd>
          </dl>

          {erro ? <Aviso tom="erro" anunciar>{erro}</Aviso> : null}

          <button type="button" onClick={() => void aprovar()} disabled={enviando || !todasMarcadas} className="botao-primario min-h-12 w-full">
            {enviando ? 'Registrando aceite…' : 'Aprovar e liberar para o paciente'}
          </button>
          <p className="text-xs leading-relaxed text-texto-suave">
            Texto acadêmico do termo; exige validação jurídica antes de uso com pacientes reais.
            {modoDemonstracao ? ' Na demonstração, o aceite fica só neste navegador.' : ''}
          </p>
        </section>
      </div>
    </Pagina>
  )
}

/** Reprovações e motivos (salvaguarda G2). Visível só ao profissional. */
function ListaReprovacoes({ itens }: { itens: Array<Pick<ReprovacaoRegistrada, 'id' | 'categoria' | 'titulo' | 'motivo'> & { automatica?: boolean }> }) {
  return (
    <div className="flex flex-col gap-2 border-t pt-4">
      <h3 className="text-sm font-semibold tracking-wide text-texto-suave uppercase">Reprovadas ({itens.length})</h3>
      <ul className="grid gap-2">
        {itens.map((item) => (
          <li key={item.id} className="rounded-lg border border-erro/20 bg-erro-fundo/40 p-3 text-sm">
            <p><span className="font-semibold">{item.titulo}</span> <span className="text-texto-suave">· {ROTULO_CATEGORIA[item.categoria]}</span></p>
            <p className="mt-1 text-texto-suave">Motivo: {item.motivo || '—'}{item.automatica ? ' (automático)' : ''}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Comprovante({ plano, modoDemonstracao }: { plano: PlanoComReprovacoes; modoDemonstracao: boolean }) {
  const aceite = plano.aceite
  return (
    <Pagina titulo="Plano aprovado">
      <EtapasAlta atual={4} />
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-destaque-escuro">Alta Assistida</p>
        <h1 className="text-3xl font-bold">Plano aprovado</h1>
      </header>
      <Aviso tom="sucesso" titulo="Aceite registrado" anunciar>
        O plano já está disponível para o paciente. Guarde este comprovante, se necessário.
      </Aviso>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section aria-labelledby="titulo-comprovante" className="cartao flex flex-col gap-4 p-5">
          <h2 id="titulo-comprovante" className="text-xl font-semibold">Comprovante do aceite</h2>
          {aceite ? (
            <>
              <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
                <dt className="text-texto-suave">Profissional</dt>
                <dd className="font-semibold">{aceite.profissional_nome}</dd>
                <dt className="text-texto-suave">Data e hora</dt>
                <dd className="font-semibold">{formatarDataHora(aceite.registrado_em)}</dd>
                <dt className="text-texto-suave">Versão do termo</dt>
                <dd className="font-semibold">{aceite.versao_termo}</dd>
                <dt className="text-texto-suave">Itens aprovados</dt>
                <dd className="font-semibold">{plano.itens.length}</dd>
                <dt className="text-texto-suave">Integridade (SHA-256)</dt>
                <dd className="font-mono text-xs break-all">{aceite.hash_conteudo}</dd>
              </dl>
              <div>
                <h3 className="text-sm font-semibold">Declarações confirmadas</h3>
                <ul className="mt-2 flex flex-col gap-2 text-sm text-texto-suave">
                  {aceite.declaracoes.map((declaracao) => (
                    <li key={declaracao.id} className="flex gap-2"><span aria-hidden="true" className="text-sucesso">✓</span>{declaracao.texto}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p className="text-sm text-texto-suave">Registro do aceite indisponível nesta resposta.</p>
          )}
        </section>

        <section aria-labelledby="titulo-plano" className="cartao flex flex-col gap-3 p-5">
          <h2 id="titulo-plano" className="text-xl font-semibold">O que o paciente recebe</h2>
          <ul className="grid gap-2">
            {plano.itens.map((item) => (
              <li key={item.id} className="rounded-lg border bg-superficie p-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${COR_CATEGORIA[item.categoria]}`}>{ROTULO_CATEGORIA[item.categoria]}</span>
                <h3 className="mt-1.5 font-semibold">{item.titulo}</h3>
                <p className="text-sm text-texto-suave">{item.descricao}</p>
              </li>
            ))}
          </ul>
          {plano.reprovacoes?.length ? <ListaReprovacoes itens={plano.reprovacoes} /> : null}
        </section>
      </div>

      {modoDemonstracao ? (
        <Aviso tom="demo" titulo="Próximo passo da demonstração">
          Clique em Sair e entre como “Paciente” para ver este plano como o paciente vê.
        </Aviso>
      ) : null}

      <div className="nao-imprimir flex flex-wrap gap-3">
        <button type="button" onClick={() => window.print()} className="botao-secundario">Imprimir comprovante</button>
        <Link to="/alta/novo" className="botao-secundario">Nova alta</Link>
        <Link to="/" className="botao-primario">Voltar ao início</Link>
      </div>
    </Pagina>
  )
}
