import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useApi } from '../../api/ApiProvider'
import type { FonteEntrada, NovaExtracao, Paciente, SumarioBase } from '../../api/alta'
import { useTratarErro } from '../../api/useTratarErro'
import { useAuth } from '../../auth/AuthProvider'
import { Aviso } from '../../components/Aviso'
import { ImportarArquivo, type ArquivoLido } from '../../components/ImportarArquivo'
import { MensagemErro } from '../../components/MensagemErro'
import { Carregando, Pagina } from '../../components/Pagina'
import { formatarNumero } from '../../lib/formatar'
import { EtapasAlta } from './EtapasAlta'

const LIMITE_TEXTO = 20_000
const FONTES: { id: FonteEntrada; titulo: string; descricao: string }[] = [
  { id: 'base', titulo: 'Escolher da base', descricao: 'Sumários fictícios preparados pela equipe.' },
  { id: 'arquivo', titulo: 'Importar arquivo', descricao: '.txt ou PDF com texto selecionável.' },
  { id: 'texto', titulo: 'Digitar texto', descricao: 'Cole ou escreva o conteúdo do sumário.' },
]

const CAMPO = 'foco min-h-12 w-full rounded-lg border border-borda-campo bg-white px-3 text-base text-marca'

export default function EnvioSumario() {
  const { alta } = useApi()
  const { modoDemonstracao } = useAuth()
  const tratarErro = useTratarErro()
  const id = useId()
  const navegar = useNavigate()
  const refPaciente = useRef<HTMLSelectElement>(null)
  const refEntrada = useRef<HTMLTextAreaElement>(null)
  const refArquivo = useRef<HTMLInputElement>(null)
  const [parametros] = useSearchParams()
  const pacienteSugerido = parametros.get('paciente')

  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [sumarios, setSumarios] = useState<SumarioBase[]>([])
  const [fonte, setFonte] = useState<FonteEntrada>('base')
  const [pacienteId, setPacienteId] = useState('')
  const [sumarioId, setSumarioId] = useState('')
  const [texto, setTexto] = useState('')
  const [arquivo, setArquivo] = useState<ArquivoLido | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [tentou, setTentou] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let ignorar = false
    Promise.all([alta.listarPacientes(), alta.listarSumarios()])
      .then(([listaPacientes, listaSumarios]) => {
        if (ignorar) return
        setPacientes(listaPacientes)
        setSumarios(listaSumarios)
        setPacienteId(listaPacientes.find((p) => p.id === pacienteSugerido)?.id ?? listaPacientes[0]?.id ?? '')
        setSumarioId(listaSumarios[0]?.id ?? '')
      })
      .catch(async (falha: unknown) => {
        const mensagem = await tratarErro(falha)
        if (!ignorar && mensagem) setErro(mensagem)
      })
      .finally(() => { if (!ignorar) setCarregando(false) })
    return () => { ignorar = true }
  }, [alta, tratarErro, pacienteSugerido])

  const sumarioSelecionado = sumarios.find((sumario) => sumario.id === sumarioId)
  const ocupado = enviando

  function trocarFonte(nova: FonteEntrada) {
    setFonte(nova)
    setErro(null)
    if (nova !== fonte) {
      setTexto('')
      setArquivo(null)
    }
  }

  function validar(): string | undefined {
    if (fonte === 'base') return sumarioId ? undefined : 'Escolha um sumário da base.'
    if (fonte === 'arquivo') {
      if (!arquivo?.texto.trim()) return 'Importe um arquivo com o sumário.'
      if (!arquivo.pronto) return 'Confira a transcrição da IA e marque a confirmação antes de continuar.'
      return undefined
    }
    if (!texto.trim()) return 'Digite o texto do sumário.'
    if (texto.trim().length > LIMITE_TEXTO) return `O sumário passou de ${formatarNumero.format(LIMITE_TEXTO)} caracteres.`
    return undefined
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (ocupado) return
    setTentou(true)
    if (!pacienteId) {
      refPaciente.current?.focus()
      return
    }
    const erroEntrada = validar()
    if (erroEntrada) {
      if (fonte === 'arquivo') refArquivo.current?.focus()
      else if (fonte === 'texto') refEntrada.current?.focus()
      setErro(erroEntrada)
      return
    }

    const dados: NovaExtracao = fonte === 'base'
      ? { origem: 'base', paciente_id: pacienteId, sumario_id: sumarioId }
      : fonte === 'arquivo'
        ? { origem: 'arquivo', paciente_id: pacienteId, nome_arquivo: arquivo!.nomeArquivo, texto: arquivo!.texto.trim(), ...(arquivo!.transcricaoIa ? { transcricao_ia: true } : {}) }
        : { origem: 'texto', paciente_id: pacienteId, texto: texto.trim() }

    setErro(null)
    setEnviando(true)
    try {
      const extracao = await alta.criarExtracao(dados)
      navegar(`/alta/extracoes/${encodeURIComponent(extracao.id)}`)
    } catch (falha) {
      const mensagem = await tratarErro(falha)
      setEnviando(false)
      if (mensagem) setErro(mensagem)
    }
  }

  return (
    <Pagina titulo="Novo plano de alta">
      <EtapasAlta atual={1} />
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-destaque-escuro">Alta Assistida</p>
        <h1 className="text-3xl font-bold">Novo plano de alta</h1>
        <p className="max-w-[70ch] text-base text-texto-suave">
          Escolha o paciente e informe o sumário de alta. A IA organiza o texto em sugestões com o trecho de origem de cada uma.
          Nada chega ao paciente antes da sua revisão e do seu aceite.
        </p>
      </header>

      {modoDemonstracao ? (
        <Aviso tom="demo" titulo="Demonstração guiada">
          Sugestões preparadas no navegador para os sumários da base; nada é enviado ao back-end ou à IA. Um dos casos traz um
          erro proposital da IA para mostrar a verificação de origem. Textos digitados ou importados retornam o mesmo aviso que o
          servidor dá quando a IA não está configurada.
        </Aviso>
      ) : null}

      {carregando ? (
        <Carregando texto="Carregando pacientes e sumários fictícios…" />
      ) : (
        <form noValidate onSubmit={enviar} aria-busy={ocupado} className="cartao flex flex-col gap-6 p-5 sm:p-6">
          <div className="flex max-w-md flex-col gap-1.5">
            <label htmlFor={`${id}-paciente`} className="text-[0.9375rem] font-semibold">Paciente</label>
            <select
              id={`${id}-paciente`}
              ref={refPaciente}
              value={pacienteId}
              onChange={(evento) => setPacienteId(evento.target.value)}
              aria-invalid={Boolean(tentou && !pacienteId)}
              aria-describedby={tentou && !pacienteId ? `${id}-paciente-erro` : undefined}
              className={CAMPO}
            >
              <option value="">Escolha o paciente</option>
              {pacientes.map((paciente) => <option key={paciente.id} value={paciente.id}>{paciente.nome}</option>)}
            </select>
            {tentou && !pacienteId ? <MensagemErro id={`${id}-paciente-erro`}>Escolha o paciente.</MensagemErro> : null}
          </div>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-[0.9375rem] font-semibold">Como deseja informar o sumário?</legend>
            <div className="grid gap-3 md:grid-cols-3">
              {FONTES.map((opcao) => {
                const marcada = fonte === opcao.id
                return (
                  <label
                    key={opcao.id}
                    className={`relative flex min-h-20 cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 has-focus-visible:ring-3 has-focus-visible:ring-destaque/45 ${marcada ? 'border-destaque bg-destaque-fundo' : 'border-borda-campo bg-white hover:bg-superficie'}`}
                  >
                    <input
                      type="radio"
                      name={`${id}-fonte`}
                      value={opcao.id}
                      checked={marcada}
                      onChange={() => trocarFonte(opcao.id)}
                      className="mt-1 size-4 shrink-0 accent-destaque"
                    />
                    <span className="flex flex-col gap-0.5">
                      <span className="font-semibold">{opcao.titulo}</span>
                      <span className="text-sm text-texto-suave">{opcao.descricao}</span>
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          {fonte === 'base' ? (
            <div className="flex flex-col gap-3">
              <label htmlFor={`${id}-sumario`} className="text-[0.9375rem] font-semibold">Sumários fictícios disponíveis</label>
              <select id={`${id}-sumario`} value={sumarioId} onChange={(evento) => setSumarioId(evento.target.value)} className={`${CAMPO} max-w-xl`}>
                <option value="">Escolha um sumário</option>
                {sumarios.map((sumario) => <option key={sumario.id} value={sumario.id}>{sumario.titulo}</option>)}
              </select>
              {sumarioSelecionado ? (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-texto-suave">{sumarioSelecionado.descricao}</p>
                  <pre aria-label="Prévia do sumário" className="max-h-72 overflow-auto rounded-lg border bg-superficie p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap">{sumarioSelecionado.texto}</pre>
                </div>
              ) : null}
            </div>
          ) : fonte === 'arquivo' ? (
            <ImportarArquivo refEntrada={refArquivo} aoMudar={setArquivo} />
          ) : (
            <div className="flex flex-col gap-2">
              <label htmlFor={`${id}-texto`} className="text-[0.9375rem] font-semibold">Texto do sumário de alta</label>
              <textarea
                id={`${id}-texto`}
                ref={refEntrada}
                value={texto}
                onChange={(evento) => setTexto(evento.target.value)}
                rows={12}
                maxLength={LIMITE_TEXTO}
                aria-describedby={`${id}-contador`}
                placeholder="Cole aqui o sumário de alta fictício…"
                className="foco w-full resize-y rounded-lg border border-borda-campo bg-white px-3.5 py-3 text-[0.9375rem] leading-relaxed text-marca"
              />
              <span id={`${id}-contador`} className="text-right text-sm text-texto-suave">
                {formatarNumero.format(texto.length)} de {formatarNumero.format(LIMITE_TEXTO)} caracteres
              </span>
            </div>
          )}

          {erro ? <MensagemErro>{erro}</MensagemErro> : null}

          {enviando ? (
            <div role="status" className="flex items-start gap-3 rounded-lg bg-superficie p-4 text-sm">
              <span aria-hidden="true" className="mt-0.5 size-4 shrink-0 animate-spin rounded-full border-2 border-borda border-t-destaque motion-reduce:animate-none" />
              <span>
                <strong className="block text-marca">{modoDemonstracao ? 'Preparando as sugestões…' : 'A IA está organizando o sumário…'}</strong>
                Em seguida, o servidor confere cada citação no texto original.
              </span>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-4 border-t pt-5">
            <button type="submit" disabled={ocupado} className="botao-primario min-h-12 px-6">
              {enviando ? 'Extraindo…' : modoDemonstracao ? 'Gerar sugestões' : 'Extrair com IA'}
            </button>
            <p className="max-w-[60ch] text-sm text-texto-suave">
              Use somente sumários fictícios. O resultado fica pendente até a sua revisão e aprovação.
            </p>
          </div>
        </form>
      )}
    </Pagina>
  )
}
