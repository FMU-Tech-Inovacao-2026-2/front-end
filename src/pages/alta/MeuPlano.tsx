import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useApi } from '../../api/ApiProvider'
import type { PlanoAlta, SugestaoAlta } from '../../api/alta'
import { useTratarErro } from '../../api/useTratarErro'
import { useAuth } from '../../auth/AuthProvider'
import { Aviso } from '../../components/Aviso'
import { Carregando, Pagina } from '../../components/Pagina'
import { formatarData, formatarDataHora } from '../../lib/formatar'

const CHAVE_CONCLUIDOS = 'healthia:plano:concluidos:'

function lerConcluidos(planoId: string): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(CHAVE_CONCLUIDOS + planoId) ?? '[]') as string[]
  } catch {
    return []
  }
}

export default function MeuPlano() {
  const { alta } = useApi()
  const { modoDemonstracao } = useAuth()
  const tratarErro = useTratarErro()
  const [plano, setPlano] = useState<PlanoAlta | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [falha, setFalha] = useState<string | null>(null)
  const [concluidos, setConcluidos] = useState<string[]>([])

  useEffect(() => {
    let ignorar = false
    alta.meuPlano()
      .then((resultado) => {
        if (ignorar) return
        setPlano(resultado)
        if (resultado) setConcluidos(lerConcluidos(resultado.id))
      })
      .catch(async (erro: unknown) => {
        const mensagem = await tratarErro(erro, 'Não foi possível carregar seu plano. Tente novamente mais tarde.')
        if (!ignorar && mensagem) setFalha(mensagem)
      })
      .finally(() => { if (!ignorar) setCarregando(false) })
    return () => { ignorar = true }
  }, [alta, tratarErro])

  function alternar(itemId: string) {
    if (!plano) return
    const novos = concluidos.includes(itemId) ? concluidos.filter((id) => id !== itemId) : [...concluidos, itemId]
    setConcluidos(novos)
    try {
      sessionStorage.setItem(CHAVE_CONCLUIDOS + plano.id, JSON.stringify(novos))
    } catch {
      // Sem armazenamento: a marcação vale até recarregar.
    }
  }

  const medicamentos = plano?.itens.filter((item) => item.categoria === 'medicamento') ?? []
  const orientacoes = plano?.itens.filter((item) => item.categoria === 'cuidado' || item.categoria === 'retorno') ?? []
  const alertas = plano?.itens.filter((item) => item.categoria === 'alerta') ?? []

  return (
    <Pagina titulo="Meu plano de cuidados" largura="estreita">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-destaque-escuro">Alta Assistida</p>
        <h1 className="text-3xl font-bold">Meu plano de cuidados</h1>
        {plano?.aceite ? (
          <p className="text-base text-texto-suave">
            Revisado e aprovado por <strong className="text-marca">{plano.aceite.profissional_nome}</strong> em {formatarDataHora(plano.aceite.registrado_em)}.
          </p>
        ) : (
          <p className="max-w-[65ch] text-base text-texto-suave">Este plano é revisado e aprovado por um profissional da sua equipe de saúde.</p>
        )}
      </header>

      {carregando ? <Carregando texto="Carregando seu plano…" /> : null}
      {!carregando && falha ? <Aviso tom="erro" anunciar>{falha}</Aviso> : null}

      {!carregando && !falha && !plano ? (
        <section className="cartao flex flex-col gap-2 p-6">
          <h2 className="text-lg font-semibold">Ainda não há um plano aprovado</h2>
          <p className="text-sm text-texto-suave">Quando sua equipe revisar e aprovar um plano, ele aparecerá aqui.</p>
          {modoDemonstracao ? (
            <p className="text-sm text-texto-suave">
              Na demonstração: saia, entre como “Profissional de saúde”, crie e aprove uma alta, e volte aqui.
            </p>
          ) : null}
        </section>
      ) : null}

      {plano ? (
        <>
          {alertas.length ? (
            <section aria-labelledby="titulo-alertas" className="rounded-xl border-2 border-atencao-borda bg-atencao-fundo p-5">
              <h2 id="titulo-alertas" className="flex items-center gap-2 text-xl font-bold text-atencao">
                <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-atencao text-sm text-white">!</span>
                Avisos importantes
              </h2>
              <p className="mt-1 text-sm text-atencao">Procure atendimento se perceber algum destes sinais.</p>
              <ul className="mt-3 flex flex-col gap-3">
                {alertas.map((item) => <ItemPlano key={item.id} item={item} />)}
              </ul>
            </section>
          ) : null}

          {medicamentos.length ? (
            <section aria-labelledby="titulo-medicamentos" className="flex flex-col gap-3">
              <CabecalhoSecao id="titulo-medicamentos" titulo="Medicamentos" total={medicamentos.length} />
              <p className="text-sm text-texto-suave">Siga a dose e o horário descritos. Não mude nada sem falar com sua equipe.</p>
              <ul className="grid gap-3">
                {medicamentos.map((item) => (
                  <ItemPlano key={item.id} item={item} concluido={concluidos.includes(item.id)} aoAlternar={() => alternar(item.id)} />
                ))}
              </ul>
            </section>
          ) : null}

          {orientacoes.length ? (
            <section aria-labelledby="titulo-orientacoes" className="flex flex-col gap-3">
              <CabecalhoSecao id="titulo-orientacoes" titulo="Cuidados e retornos" total={orientacoes.length} />
              <ul className="grid gap-3">
                {orientacoes.map((item) => (
                  <ItemPlano key={item.id} item={item} concluido={concluidos.includes(item.id)} aoAlternar={() => alternar(item.id)} />
                ))}
              </ul>
            </section>
          ) : null}

          <Aviso tom="info" titulo="Em caso de dúvida">
            Fale com sua equipe de saúde. Em emergência, ligue 192 (SAMU). As marcações de “feito” ficam só neste aparelho e não são enviadas à equipe.
          </Aviso>

          <div className="nao-imprimir flex flex-wrap gap-3">
            <button type="button" onClick={() => window.print()} className="botao-secundario">Imprimir plano</button>
            <Link to="/" className="botao-discreto">Voltar ao início</Link>
          </div>
          <p className="text-xs text-texto-suave">Plano gerado em {formatarData(plano.criado_em)}.</p>
        </>
      ) : null}
    </Pagina>
  )
}

function CabecalhoSecao({ id, titulo, total }: { id: string; titulo: string; total: number }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <h2 id={id} className="text-2xl font-bold">{titulo}</h2>
      <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold" aria-label={`${total} itens`}>{total}</span>
    </div>
  )
}

function ItemPlano({ item, concluido, aoAlternar }: { item: SugestaoAlta; concluido?: boolean; aoAlternar?: () => void }) {
  return (
    <li className={`cartao p-5 ${concluido ? 'border-sucesso/40' : ''}`}>
      <div className="flex items-start gap-3">
        {aoAlternar ? (
          <input
            type="checkbox"
            aria-label={`Marcar ${item.titulo} como feito`}
            checked={Boolean(concluido)}
            onChange={aoAlternar}
            className="foco mt-1 size-6 shrink-0 accent-destaque"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <h3 className={`text-lg font-semibold ${concluido ? 'text-texto-suave line-through' : 'text-marca'}`}>{item.titulo}</h3>
          <p className="mt-1 text-base leading-relaxed text-texto-suave">{item.descricao}</p>
          <details className="mt-3 text-sm text-texto-suave">
            <summary className="foco cursor-pointer rounded font-semibold text-destaque-escuro">De onde veio esta informação?</summary>
            <p className="mt-2">Trecho do seu sumário de alta:</p>
            <blockquote className="mt-1 rounded-lg border-l-4 border-destaque bg-superficie px-4 py-3 text-marca">“{item.trecho_origem}”</blockquote>
          </details>
        </div>
      </div>
    </li>
  )
}
