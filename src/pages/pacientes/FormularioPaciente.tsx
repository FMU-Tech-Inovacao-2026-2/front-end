import { useId, useRef, useState, type FormEvent } from 'react'
import type { DadosPaciente } from '../../api/pacientes'
import { ErroApi } from '../../api/erros'
import { Aviso } from '../../components/Aviso'
import { CampoTexto } from '../../components/CampoTexto'

type Campos = Record<keyof DadosPaciente, string>
const VAZIO: Campos = { nome: '', email: '', data_nascimento: '', numero_prontuario: '', telefone: '', responsavel: '', observacoes: '' }
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validar(campos: Campos, comEmail: boolean): Partial<Campos> {
  const erros: Partial<Campos> = {}
  if (campos.nome.trim().length < 3) erros.nome = 'Informe o nome completo.'
  if (comEmail && !EMAIL.test(campos.email.trim())) erros.email = 'Informe um e-mail válido, como nome@exemplo.com.'
  if (!campos.data_nascimento) erros.data_nascimento = 'Informe a data de nascimento.'
  else if (campos.data_nascimento > new Date().toISOString().slice(0, 10)) erros.data_nascimento = 'A data não pode estar no futuro.'
  if (!campos.numero_prontuario.trim()) erros.numero_prontuario = 'Informe o número do prontuário.'
  else if (!/^[A-Za-z0-9._/-]+$/.test(campos.numero_prontuario.trim())) erros.numero_prontuario = 'Use letras, números, ponto, hífen ou barra.'
  return erros
}

interface Props {
  inicial?: Partial<DadosPaciente>
  /** No cadastro, o e-mail cria a conta de acesso. Na edição, ele não muda. */
  comEmail: boolean
  rotuloEnviar: string
  aoEnviar(dados: DadosPaciente): Promise<void>
  aoCancelar?: () => void
}

/** Cadastro e edição da ficha. Coleta só o necessário (LGPD: minimização). */
export function FormularioPaciente({ inicial, comEmail, rotuloEnviar, aoEnviar, aoCancelar }: Props) {
  const id = useId()
  const [campos, setCampos] = useState<Campos>({ ...VAZIO, ...Object.fromEntries(Object.entries(inicial ?? {}).map(([k, v]) => [k, v ?? ''])) })
  const [tentou, setTentou] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [errosServidor, setErrosServidor] = useState<Partial<Campos>>({})
  const [erro, setErro] = useState<string | null>(null)
  const refForm = useRef<HTMLFormElement>(null)

  const errosLocais = tentou ? validar(campos, comEmail) : {}
  const erros = { ...errosServidor, ...errosLocais }
  const alterar = (campo: keyof Campos) => (valor: string) => {
    setCampos((atuais) => ({ ...atuais, [campo]: valor }))
    setErrosServidor((atuais) => ({ ...atuais, [campo]: undefined }))
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (enviando) return
    setTentou(true)
    const encontrados = validar(campos, comEmail)
    if (Object.keys(encontrados).length) {
      // Leva o foco ao primeiro campo com erro, depois que a tela marca os erros.
      requestAnimationFrame(() => refForm.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    setErro(null)
    setEnviando(true)
    try {
      await aoEnviar({
        nome: campos.nome.trim(),
        email: campos.email.trim(),
        data_nascimento: campos.data_nascimento,
        numero_prontuario: campos.numero_prontuario.trim(),
        ...(campos.telefone.trim() ? { telefone: campos.telefone.trim() } : {}),
        ...(campos.responsavel.trim() ? { responsavel: campos.responsavel.trim() } : {}),
        ...(campos.observacoes.trim() ? { observacoes: campos.observacoes.trim() } : {}),
      })
    } catch (falha) {
      if (falha instanceof ErroApi && falha.detalhes.length) {
        setErrosServidor(Object.fromEntries(falha.detalhes.map((d) => [d.campo, d.mensagem])) as Partial<Campos>)
      }
      setErro(falha instanceof Error ? falha.message : 'Não foi possível salvar.')
    } finally {
      setEnviando(false)
    }
  }

  const campo = (nome: keyof Campos) => ({
    value: campos[nome],
    onChange: (evento: { target: { value: string } }) => alterar(nome)(evento.target.value),
    erro: erros[nome],
  })

  return (
    <form ref={refForm} noValidate onSubmit={enviar} aria-busy={enviando} className="cartao flex flex-col gap-5 p-5 sm:p-6">
      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="mb-3 text-lg font-semibold">Identificação</legend>
        <div className="md:col-span-2"><CampoTexto rotulo="Nome completo" autoComplete="off" {...campo('nome')} /></div>
        <CampoTexto rotulo="Data de nascimento" type="date" max={new Date().toISOString().slice(0, 10)} {...campo('data_nascimento')} />
        <CampoTexto rotulo="Número do prontuário" autoComplete="off" autoCapitalize="characters" placeholder="Ex.: PAC-0100" {...campo('numero_prontuario')} />
      </fieldset>

      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="mb-3 text-lg font-semibold">Contato</legend>
        {comEmail ? (
          <div className="md:col-span-2">
            <CampoTexto rotulo="E-mail de acesso do paciente" type="email" inputMode="email" autoComplete="off" autoCapitalize="none" {...campo('email')} />
            <p className="mt-1 text-sm text-texto-suave">Cria a conta para o paciente ver o plano aprovado. Uma senha provisória será exibida uma única vez.</p>
          </div>
        ) : null}
        <CampoTexto rotulo="Telefone (opcional)" type="tel" inputMode="tel" autoComplete="off" {...campo('telefone')} />
        <CampoTexto rotulo="Responsável ou acompanhante (opcional)" autoComplete="off" {...campo('responsavel')} />
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-observacoes`} className="text-[0.9375rem] font-semibold">Observações administrativas (opcional)</label>
        <textarea
          id={`${id}-observacoes`}
          value={campos.observacoes}
          onChange={(evento) => alterar('observacoes')(evento.target.value)}
          rows={3}
          maxLength={1000}
          aria-describedby={`${id}-observacoes-ajuda`}
          className="foco resize-y rounded-lg border border-borda-campo bg-white px-3.5 py-3 text-base"
        />
        <p id={`${id}-observacoes-ajuda`} className="text-sm text-texto-suave">Não registre diagnósticos aqui. A IA não lê este campo.</p>
      </div>

      <Aviso tom="atencao">Use somente dados fictícios. Não cadastre CPF, endereço nem dados de pacientes reais.</Aviso>
      {erro ? <Aviso tom="erro" anunciar>{erro}</Aviso> : null}

      <div className="flex flex-wrap gap-3 border-t pt-5">
        <button type="submit" disabled={enviando} className="botao-primario min-h-12 px-6">{enviando ? 'Salvando…' : rotuloEnviar}</button>
        {aoCancelar ? <button type="button" onClick={aoCancelar} className="botao-secundario min-h-12">Cancelar</button> : null}
      </div>
    </form>
  )
}
