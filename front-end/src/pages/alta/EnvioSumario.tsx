import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useApi } from '../../api/ApiProvider'
import type { Paciente } from '../../api/alta'
import { ErroApi, MENSAGEM_ERRO_GENERICO } from '../../api/erros'
import { useAuth } from '../../auth/AuthProvider'
import { Cabecalho } from '../../components/Cabecalho'
import { MensagemErro } from '../../components/MensagemErro'
import { EtapasAlta } from './EtapasAlta'

const LIMITE_TEXTO = 20_000
const formatarNumero = new Intl.NumberFormat('pt-BR')

function erroDoPaciente(pacienteId: string) {
  return pacienteId === '' ? 'Escolha o paciente.' : undefined
}

function erroDoTexto(texto: string) {
  const limpo = texto.trim()
  if (limpo === '') return 'Cole o texto do sumário de alta.'
  if (limpo.length > LIMITE_TEXTO) return `O texto passou de ${formatarNumero.format(LIMITE_TEXTO)} caracteres. Envie só o sumário de alta.`
  return undefined
}

export default function EnvioSumario() {
  const { alta } = useApi()
  const id = useId()
  const refPaciente = useRef<HTMLSelectElement>(null)
  const refTexto = useRef<HTMLTextAreaElement>(null)

  const [pacientes, setPacientes] = useState<Paciente[] | null>(null)
  const [falhaPacientes, setFalhaPacientes] = useState(false)
  const [tentativaPacientes, setTentativaPacientes] = useState(0)
  const [pacienteId, setPacienteId] = useState('')
  const [texto, setTexto] = useState('')
  const [tentou, setTentou] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)
  const navegar = useNavigate()
  const { sair } = useAuth()

  useEffect(() => {
    document.title = 'Novo plano de alta · HealthIA'
  }, [])

  // Sincroniza com o servidor: a lista de pacientes vem da API.
  useEffect(() => {
    let ignorar = false
    alta
      .listarPacientes()
      .then((lista) => {
        if (!ignorar) setPacientes(lista)
      })
      .catch(async (erro: unknown) => {
        if (ignorar) return
        if (erro instanceof ErroApi && erro.status === 401) {
          await sair()
          navegar('/entrar', { replace: true, state: { voltarPara: '/alta/novo' } })
          return
        }
        setFalhaPacientes(true)
      })
    return () => {
      ignorar = true
    }
  }, [alta, tentativaPacientes, sair, navegar])

  function tentarPacientesDeNovo() {
    setFalhaPacientes(false)
    setTentativaPacientes((n) => n + 1)
  }

  // Derivados no render: os erros só aparecem depois da primeira tentativa.
  const erroPaciente = tentou ? erroDoPaciente(pacienteId) : undefined
  const erroTexto = tentou ? erroDoTexto(texto) : undefined
  const tamanho = texto.trim().length

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (enviando) return
    setTentou(true)
    if (erroDoPaciente(pacienteId)) {
      refPaciente.current?.focus()
      return
    }
    if (erroDoTexto(texto)) {
      refTexto.current?.focus()
      return
    }
    setErroEnvio(null)
    setEnviando(true)
    try {
      const extracao = await alta.criarExtracao({ paciente_id: pacienteId, texto: texto.trim() })
      navegar(`/alta/extracoes/${encodeURIComponent(extracao.id)}`)
    } catch (erro) {
      if (erro instanceof ErroApi && erro.status === 401) {
        await sair()
        navegar('/entrar', { replace: true, state: { voltarPara: '/alta/novo' } })
        return
      }
      setEnviando(false)
      setErroEnvio(erro instanceof ErroApi ? erro.message : MENSAGEM_ERRO_GENERICO)
    }
  }

  const idPaciente = `${id}-paciente`
  const idPacienteErro = `${id}-paciente-erro`
  const idTexto = `${id}-texto`
  const idTextoErro = `${id}-texto-erro`
  const idContador = `${id}-contador`

  return (
    <div className="min-h-dvh">
      <Cabecalho />
      <main id="conteudo" className="mx-auto flex max-w-280 flex-col gap-6 px-5 py-8 sm:px-6">
        <EtapasAlta atual={1} />
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-bold">Novo plano de alta</h1>
          <p className="max-w-[70ch] text-base text-texto-suave">
            Cole o texto do sumário de alta. A IA organiza o que está escrito e você revisa antes de qualquer informação chegar
            ao paciente.
          </p>
        </div>

        <div className="flex flex-wrap items-start gap-6">
          <form noValidate onSubmit={enviar} aria-busy={enviando} className="flex min-w-0 flex-[999_1_560px] flex-col gap-5 rounded-xl border bg-white p-6">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={idPaciente} className="text-[0.9375rem] font-semibold">
                Paciente
              </label>
              <select
                id={idPaciente}
                ref={refPaciente}
                value={pacienteId}
                onChange={(e) => setPacienteId(e.target.value)}
                aria-invalid={Boolean(erroPaciente)}
                aria-describedby={erroPaciente ? idPacienteErro : undefined}
                className={`min-h-12 w-full rounded-lg bg-white px-3 text-base text-marca focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-destaque/40 ${
                  erroPaciente ? 'border-2 border-erro' : 'border border-borda-campo focus-visible:border-destaque'
                }`}
              >
                <option value="">
                  {pacientes ? 'Escolha o paciente' : falhaPacientes ? 'Lista indisponível' : 'Carregando pacientes…'}
                </option>
                {(pacientes ?? []).map((paciente) => (
                  <option key={paciente.id} value={paciente.id}>
                    {paciente.nome}
                  </option>
                ))}
              </select>
              {erroPaciente ? <MensagemErro id={idPacienteErro}>{erroPaciente}</MensagemErro> : null}
              {falhaPacientes ? (
                <div role="alert" className="entrada-aviso flex flex-wrap items-center justify-between gap-3 rounded-lg border border-erro/40 bg-erro-fundo px-3.5 py-2.5">
                  <p className="text-[0.9375rem] text-erro">Não foi possível carregar a lista de pacientes.</p>
                  <button
                    type="button"
                    onClick={tentarPacientesDeNovo}
                    className="pressionavel min-h-11 rounded-lg border border-borda-campo bg-white px-4 text-sm font-semibold text-marca hover:bg-superficie focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-destaque/40"
                  >
                    Tentar de novo
                  </button>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor={idTexto} className="text-[0.9375rem] font-semibold">
                Texto do sumário de alta
              </label>
              <textarea
                id={idTexto}
                ref={refTexto}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                rows={14}
                spellCheck={false}
                aria-invalid={Boolean(erroTexto)}
                aria-describedby={erroTexto ? `${idTextoErro} ${idContador}` : idContador}
                className={`w-full resize-y rounded-lg bg-white px-3.5 py-3 font-mono text-sm leading-relaxed text-marca focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-destaque/40 ${
                  erroTexto ? 'border-2 border-erro' : 'border border-borda-campo focus-visible:border-destaque'
                }`}
              />
              <div className="flex flex-wrap items-start justify-between gap-2">
                {erroTexto ? <MensagemErro id={idTextoErro}>{erroTexto}</MensagemErro> : <span />}
                <span id={idContador} className={`text-sm ${tamanho > LIMITE_TEXTO ? 'font-semibold text-erro' : 'text-texto-suave'}`}>
                  {formatarNumero.format(tamanho)} de {formatarNumero.format(LIMITE_TEXTO)} caracteres
                </span>
              </div>
            </div>

            {erroEnvio ? (
              <p
                role="alert"
                className="entrada-aviso flex items-start gap-2 rounded-lg border border-erro/40 bg-erro-fundo px-3.5 py-3 text-[0.9375rem] text-erro"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-px shrink-0">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v5M12 16h.01" />
                </svg>
                {erroEnvio}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center justify-end gap-3">
              {enviando ? (
                <p role="status" className="text-sm text-texto-suave">
                  Isso pode levar alguns segundos.
                </p>
              ) : null}
              <button
                type="submit"
                disabled={enviando}
                className="pressionavel inline-flex min-h-12 items-center gap-2 rounded-lg bg-marca px-6 text-base font-semibold text-white hover:bg-marca-escura focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-destaque/50 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-80"
              >
                {enviando ? 'Extraindo…' : 'Extrair plano'}
              </button>
            </div>
          </form>

          <aside aria-label="Como funciona" className="flex flex-[1_1_280px] flex-col gap-4">
            <section className="flex flex-col gap-3 rounded-xl border bg-white p-5">
              <h2 className="text-base font-semibold">O que acontece depois</h2>
              <ol className="flex list-decimal flex-col gap-2 pl-5 text-[0.9375rem] leading-snug text-texto-suave marker:font-semibold marker:text-marca">
                <li>A IA extrai medicamentos, doses, alertas, orientações e retornos.</li>
                <li>Cada item traz o trecho do sumário de onde saiu; o sistema confere se o trecho existe.</li>
                <li>Você revisa, corrige e aprova. Só então o paciente recebe o plano.</li>
              </ol>
            </section>
            <section className="flex flex-col gap-2 rounded-xl border bg-white p-5">
              <h2 className="text-base font-semibold">Limites da IA</h2>
              <p className="text-[0.9375rem] leading-snug text-texto-suave">
                Não diagnostica, não altera prescrição e não completa lacunas. O que o sumário não traz aparece como “não informado”.
              </p>
            </section>
            <p className="text-sm leading-snug text-texto-suave">
              Protótipo acadêmico: use somente sumários fictícios. Dados de saúde são dados sensíveis pela LGPD.
            </p>
          </aside>
        </div>
      </main>
    </div>
  )
}
