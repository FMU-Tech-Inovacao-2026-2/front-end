import { useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useApi } from '../../api/ApiProvider'
import type { EdicaoSugestaoAlta, ExtracaoAlta, SugestaoAlta } from '../../api/alta'
import { useTratarErro } from '../../api/useTratarErro'
import { Aviso } from '../../components/Aviso'
import { Carregando, Pagina } from '../../components/Pagina'
import { plural } from '../../lib/formatar'
import { COR_CATEGORIA, ROTULO_CATEGORIA } from './categorias'
import { EtapasAlta } from './EtapasAlta'
import { lerRascunho, salvarRascunho, type Decisao, type RascunhoRevisao } from './rascunho'

/** Posição do trecho no texto original, sem diferenciar maiúsculas. */
function localizar(texto: string, trecho: string): [number, number] | null {
  const base = texto.toLocaleLowerCase('pt-BR')
  for (const candidato of [trecho.trim(), trecho.trim().replace(/[.;:]+$/, '')]) {
    const inicio = base.indexOf(candidato.toLocaleLowerCase('pt-BR'))
    if (candidato.length >= 8 && inicio >= 0) return [inicio, inicio + candidato.length]
  }
  return null
}

function rascunhoInicial(extracao: ExtracaoAlta): RascunhoRevisao {
  const salvo = lerRascunho(extracao.id)
  const decisoes: Record<string, Decisao> = {}
  for (const item of extracao.sugestoes) {
    // Itens sem origem confirmada nascem reprovados e não podem ser aceitos.
    if (!item.origem_verificada) decisoes[item.id] = 'reprovada'
    else if (salvo?.decisoes[item.id]) decisoes[item.id] = salvo.decisoes[item.id]
  }
  return { decisoes, edicoes: salvo?.edicoes ?? {} }
}

export default function RevisaoAlta() {
  const { id = '' } = useParams()
  const { alta } = useApi()
  const tratarErro = useTratarErro()
  const navegar = useNavigate()
  const [extracao, setExtracao] = useState<ExtracaoAlta | null>(null)
  const [rascunho, setRascunho] = useState<RascunhoRevisao>({ decisoes: {}, edicoes: {} })
  const [editando, setEditando] = useState<string | null>(null)
  const [emFoco, setEmFoco] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const refDestaque = useRef<HTMLElement>(null)

  useEffect(() => {
    let ignorar = false
    alta.buscarExtracao(id)
      .then((resultado) => {
        if (ignorar) return
        setExtracao(resultado)
        setRascunho(rascunhoInicial(resultado))
      })
      .catch(async (falha: unknown) => {
        const mensagem = await tratarErro(falha, 'Não foi possível carregar as sugestões.')
        if (!ignorar && mensagem) setErro(mensagem)
      })
      .finally(() => { if (!ignorar) setCarregando(false) })
    return () => { ignorar = true }
  }, [alta, id, tratarErro])

  useEffect(() => {
    refDestaque.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
  }, [emFoco])

  function atualizar(novo: RascunhoRevisao) {
    setRascunho(novo)
    if (extracao) salvarRascunho(extracao.id, novo)
  }

  function decidir(item: SugestaoAlta, decisao: Decisao) {
    if (decisao === 'aceita' && !item.origem_verificada) return
    atualizar({ ...rascunho, decisoes: { ...rascunho.decisoes, [item.id]: decisao } })
    setEmFoco(item.id)
  }

  function aceitarVerificadas() {
    if (!extracao) return
    const decisoes = { ...rascunho.decisoes }
    for (const item of extracao.sugestoes) if (item.origem_verificada && !decisoes[item.id]) decisoes[item.id] = 'aceita'
    atualizar({ ...rascunho, decisoes })
  }

  function editar(item: SugestaoAlta, campos: Partial<EdicaoSugestaoAlta>) {
    const atual = rascunho.edicoes[item.id] ?? { id: item.id, titulo: item.titulo, descricao: item.descricao }
    atualizar({ ...rascunho, edicoes: { ...rascunho.edicoes, [item.id]: { ...atual, ...campos } } })
  }

  function desfazerEdicao(item: SugestaoAlta) {
    const edicoes = { ...rascunho.edicoes }
    delete edicoes[item.id]
    atualizar({ ...rascunho, edicoes })
    setEditando(null)
  }

  if (carregando) {
    return <Pagina titulo="Sugestões da IA"><EtapasAlta atual={2} /><Carregando texto="Carregando sugestões para revisão…" /></Pagina>
  }

  if (!extracao) {
    return (
      <Pagina titulo="Sugestões da IA">
        <EtapasAlta atual={2} />
        <Aviso tom="erro" titulo="Não foi possível abrir esta extração" anunciar>{erro}</Aviso>
        <Link to="/alta/novo" className="botao-secundario self-start">Começar uma nova alta</Link>
      </Pagina>
    )
  }

  if (extracao.status === 'aprovado') {
    return (
      <Pagina titulo="Sugestões da IA">
        <EtapasAlta atual={4} />
        <Aviso tom="sucesso" titulo="Esta extração já foi aprovada">
          As decisões foram registradas com o aceite profissional e não podem mais ser alteradas.
        </Aviso>
        <Link to={`/alta/extracoes/${encodeURIComponent(extracao.id)}/revisao-final`} className="botao-primario self-start">
          Ver comprovante do aceite
        </Link>
      </Pagina>
    )
  }

  const sugestoes = extracao.sugestoes
  const aceitas = sugestoes.filter((item) => rascunho.decisoes[item.id] === 'aceita').length
  const reprovadas = sugestoes.filter((item) => rascunho.decisoes[item.id] === 'reprovada').length
  const pendentes = sugestoes.length - aceitas - reprovadas
  const semOrigem = sugestoes.filter((item) => !item.origem_verificada).length
  const itemEmFoco = sugestoes.find((item) => item.id === emFoco)
  const faixa = itemEmFoco ? localizar(extracao.texto_original, itemEmFoco.trecho_origem) : null

  function continuar() {
    if (pendentes > 0) {
      setErro(`Decida as ${plural(pendentes, 'sugestão restante', 'sugestões restantes')} antes de continuar.`)
      return
    }
    if (aceitas === 0) {
      setErro('Aceite pelo menos uma sugestão para gerar o plano do paciente.')
      return
    }
    const editadasIncompletas = Object.values(rascunho.edicoes).some(
      (item) => rascunho.decisoes[item.id] === 'aceita' && (!item.titulo.trim() || !item.descricao.trim()),
    )
    if (editadasIncompletas) {
      setErro('Preencha o título e a descrição de cada sugestão editada.')
      return
    }
    setErro(null)
    salvarRascunho(extracao!.id, rascunho)
    navegar(`/alta/extracoes/${encodeURIComponent(extracao!.id)}/revisao-final`)
  }

  return (
    <Pagina titulo="Sugestões da IA">
      <EtapasAlta atual={2} />
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-destaque-escuro">Alta Assistida</p>
        <h1 className="text-3xl font-bold">Sugestões da IA</h1>
        <p className="max-w-[75ch] text-base text-texto-suave">
          Decida cada sugestão: aceite, reprove ou edite. Use “Mostrar no sumário” para conferir o trecho citado no texto original.
          A IA pode errar; o que você não aceitar não chega ao paciente.
        </p>
      </header>

      {semOrigem > 0 ? (
        <Aviso tom="atencao" titulo={`${plural(semOrigem, 'sugestão tem', 'sugestões têm')} citação que não existe no sumário`}>
          O servidor não encontrou o trecho citado no texto original. Esses itens foram reprovados automaticamente e não podem ser aprovados.
        </Aviso>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <section aria-labelledby="titulo-sumario" className="cartao flex flex-col gap-3 p-5 lg:sticky lg:top-4">
          <div className="flex items-center justify-between gap-3">
            <h2 id="titulo-sumario" className="text-lg font-semibold">Sumário original</h2>
            {extracao.nome_arquivo ? <span className="truncate text-sm text-texto-suave">{extracao.nome_arquivo}</span> : null}
          </div>
          <pre className="max-h-[60vh] overflow-auto rounded-lg bg-superficie p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap">
            {faixa ? (
              <>
                {extracao.texto_original.slice(0, faixa[0])}
                <mark ref={refDestaque} className="trecho-destacado">{extracao.texto_original.slice(faixa[0], faixa[1])}</mark>
                {extracao.texto_original.slice(faixa[1])}
              </>
            ) : extracao.texto_original}
          </pre>
          <p aria-live="polite" className="text-sm text-texto-suave">
            {itemEmFoco
              ? faixa ? `Destacado: origem de “${itemEmFoco.titulo}”.` : `A origem de “${itemEmFoco.titulo}” não foi encontrada neste texto.`
              : 'Escolha “Mostrar no sumário” em uma sugestão para destacar o trecho.'}
          </p>
        </section>

        <section aria-labelledby="titulo-sugestoes" className="flex flex-col gap-4">
          <div className="cartao flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <h2 id="titulo-sugestoes" className="text-lg font-semibold">{plural(sugestoes.length, 'sugestão', 'sugestões')}</h2>
              <p className="text-sm text-texto-suave" aria-live="polite">
                <span className="font-semibold text-sucesso">{aceitas} aceita(s)</span> · <span className="font-semibold text-erro">{reprovadas} reprovada(s)</span> · {pendentes} sem decisão
              </p>
            </div>
            {pendentes > 0 ? (
              <button type="button" onClick={aceitarVerificadas} className="botao-secundario">
                Aceitar as que têm origem confirmada
              </button>
            ) : null}
          </div>

          {sugestoes.map((item) => (
            <CartaoSugestao
              key={item.id}
              item={item}
              decisao={rascunho.decisoes[item.id]}
              edicao={rascunho.edicoes[item.id]}
              editando={editando === item.id}
              emFoco={emFoco === item.id}
              aoDecidir={(decisao) => decidir(item, decisao)}
              aoEditar={(campos) => editar(item, campos)}
              aoAlternarEdicao={() => setEditando((atual) => (atual === item.id ? null : item.id))}
              aoDesfazer={() => desfazerEdicao(item)}
              aoMostrar={() => setEmFoco(item.id)}
            />
          ))}

          {extracao.nao_informado.length > 0 ? (
            <Aviso tom="atencao" titulo="Informações que não constam no sumário">
              <p>A IA não completa lacunas. Se forem necessárias, oriente o paciente por outro meio.</p>
              <ul className="mt-1 list-disc pl-5">
                {extracao.nao_informado.map((campo) => <li key={campo}>{campo}</li>)}
              </ul>
            </Aviso>
          ) : null}

          {erro ? <Aviso tom="erro" anunciar>{erro}</Aviso> : null}

          <div className="cartao flex flex-wrap items-center justify-between gap-3 p-5">
            <p className="max-w-[48ch] text-sm text-texto-suave">
              Na próxima etapa você confere a lista final e registra o aceite profissional.
            </p>
            <button type="button" onClick={continuar} className="botao-primario min-h-12 px-6">
              Ir para revisão final
            </button>
          </div>
        </section>
      </div>
    </Pagina>
  )
}

interface PropsCartao {
  item: SugestaoAlta
  decisao?: Decisao
  edicao?: EdicaoSugestaoAlta
  editando: boolean
  emFoco: boolean
  aoDecidir(decisao: Decisao): void
  aoEditar(campos: Partial<EdicaoSugestaoAlta>): void
  aoAlternarEdicao(): void
  aoDesfazer(): void
  aoMostrar(): void
}

function CartaoSugestao({ item, decisao, edicao, editando, emFoco, aoDecidir, aoEditar, aoAlternarEdicao, aoDesfazer, aoMostrar }: PropsCartao) {
  const id = useId()
  const titulo = edicao?.titulo ?? item.titulo
  const descricao = edicao?.descricao ?? item.descricao
  const editado = Boolean(edicao) && (edicao!.titulo !== item.titulo || edicao!.descricao !== item.descricao)
  const borda = decisao === 'aceita' ? 'border-sucesso/50' : decisao === 'reprovada' ? 'border-erro/30 bg-superficie/60' : 'border-borda'

  return (
    <article aria-labelledby={`${id}-titulo`} className={`cartao p-5 ${borda} ${emFoco ? 'ring-2 ring-destaque/40' : ''}`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${COR_CATEGORIA[item.categoria]}`}>{ROTULO_CATEGORIA[item.categoria]}</span>
        {item.origem_verificada ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-sucesso">✓ Origem localizada no sumário</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-erro">✕ Origem não confirmada</span>
        )}
        {editado ? <span className="rounded-full bg-marca/8 px-2.5 py-1 text-xs font-semibold text-marca">Editado por você</span> : null}
      </div>

      {editando ? (
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm font-semibold" htmlFor={`${id}-edit-titulo`}>
            Título
            <input id={`${id}-edit-titulo`} value={titulo} maxLength={180} onChange={(evento) => aoEditar({ titulo: evento.target.value })} className="foco min-h-11 rounded-lg border border-borda-campo px-3 text-base font-normal" />
          </label>
          <label className="grid gap-1 text-sm font-semibold" htmlFor={`${id}-edit-descricao`}>
            Descrição
            <textarea id={`${id}-edit-descricao`} value={descricao} rows={3} maxLength={1000} onChange={(evento) => aoEditar({ descricao: evento.target.value })} className="foco resize-y rounded-lg border border-borda-campo px-3 py-2 text-base font-normal" />
          </label>
          <p className="text-xs text-texto-suave">A citação de origem não muda com a edição; ela continua ligada ao item no plano.</p>
        </div>
      ) : (
        <>
          <h3 id={`${id}-titulo`} className="text-lg font-semibold">{titulo}</h3>
          <p className="mt-1 text-[0.9375rem] text-texto-suave">{descricao}</p>
        </>
      )}

      <div className="mt-4 rounded-lg border-l-4 border-destaque bg-superficie px-4 py-3">
        <p className="mb-1 text-xs font-semibold tracking-wide text-texto-suave uppercase">Trecho de origem</p>
        <blockquote className="text-sm leading-relaxed text-marca">“{item.trecho_origem}”</blockquote>
        <button type="button" onClick={aoMostrar} className="botao-discreto mt-1 -ml-3 min-h-9 text-sm">
          Mostrar no sumário
        </button>
      </div>

      {!item.origem_verificada ? (
        <p className="mt-3 text-sm text-erro">Este trecho não existe no sumário. O item foi reprovado e não pode ser aprovado.</p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label={`Decisão sobre ${titulo}`}>
        <button
          type="button"
          disabled={!item.origem_verificada}
          aria-pressed={decisao === 'aceita'}
          onClick={() => aoDecidir('aceita')}
          className={`botao border ${decisao === 'aceita' ? 'border-sucesso bg-sucesso-fundo text-sucesso' : 'border-borda-campo bg-white text-marca hover:bg-superficie'}`}
        >
          Aceitar
        </button>
        <button
          type="button"
          aria-pressed={decisao === 'reprovada'}
          onClick={() => aoDecidir('reprovada')}
          className={`botao border ${decisao === 'reprovada' ? 'border-erro/50 bg-erro-fundo text-erro' : 'border-borda-campo bg-white text-marca hover:bg-superficie'}`}
        >
          Reprovar
        </button>
        {item.origem_verificada ? (
          <button type="button" onClick={aoAlternarEdicao} aria-expanded={editando} className="botao-discreto">
            {editando ? 'Concluir edição' : 'Editar'}
          </button>
        ) : null}
        {editado && !editando ? (
          <button type="button" onClick={aoDesfazer} className="botao-discreto text-texto-suave">Desfazer edição</button>
        ) : null}
      </div>
    </article>
  )
}
