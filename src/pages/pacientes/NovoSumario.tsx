import { useEffect, useId, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useApi } from '../../api/ApiProvider'
import type { FichaPaciente, NovoSumario as DadosSumario } from '../../api/pacientes'
import { useTratarErro } from '../../api/useTratarErro'
import { Aviso } from '../../components/Aviso'
import { CampoTexto } from '../../components/CampoTexto'
import { ImportarArquivo, type ArquivoLido } from '../../components/ImportarArquivo'
import { MensagemErro } from '../../components/MensagemErro'
import { Carregando, Pagina } from '../../components/Pagina'
import { formatarNumero } from '../../lib/formatar'

const LIMITE_TEXTO = 20_000

/** Adiciona um sumário de alta à ficha: texto digitado, TXT, PDF com texto ou PDF transcrito pela IA. */
export default function NovoSumario() {
  const { id = '' } = useParams()
  const { pacientes } = useApi()
  const tratarErro = useTratarErro()
  const navegar = useNavigate()
  const idCampo = useId()
  const [paciente, setPaciente] = useState<FichaPaciente | null>(null)
  const [modo, setModo] = useState<'arquivo' | 'texto'>('arquivo')
  const [titulo, setTitulo] = useState('')
  const [texto, setTexto] = useState('')
  const [arquivo, setArquivo] = useState<ArquivoLido | null>(null)
  const [tentou, setTentou] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let ignorar = false
    pacientes.ficha(id)
      .then((ficha) => { if (!ignorar) setPaciente(ficha.paciente) })
      .catch(async (falha: unknown) => {
        const mensagem = await tratarErro(falha, 'Paciente não encontrado.')
        if (!ignorar && mensagem) setErro(mensagem)
      })
    return () => { ignorar = true }
  }, [pacientes, id, tratarErro])

  const erroTitulo = tentou && titulo.trim().length < 3 ? 'Dê um título ao sumário, como “Alta da cardiologia”.' : undefined

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (enviando) return
    setTentou(true)
    if (titulo.trim().length < 3) return
    let dados: DadosSumario
    if (modo === 'texto') {
      if (!texto.trim()) { setErro('Digite o texto do sumário.'); return }
      dados = { origem: 'texto', titulo: titulo.trim(), texto: texto.trim() }
    } else {
      if (!arquivo?.texto.trim()) { setErro('Importe um arquivo com o sumário.'); return }
      if (!arquivo.pronto) { setErro('Confira a transcrição da IA e marque a confirmação antes de salvar.'); return }
      dados = arquivo.transcricaoIa
        ? { origem: 'pdf_ia', titulo: titulo.trim(), nome_arquivo: arquivo.nomeArquivo, texto: arquivo.texto.trim(), transcricao_conferida: true }
        : { origem: 'arquivo', titulo: titulo.trim(), nome_arquivo: arquivo.nomeArquivo, texto: arquivo.texto.trim() }
    }
    setErro(null)
    setEnviando(true)
    try {
      await pacientes.criarSumario(id, dados)
      navegar(`/pacientes/${encodeURIComponent(id)}`)
    } catch (falha) {
      const mensagem = await tratarErro(falha, 'Não foi possível salvar o sumário.')
      setEnviando(false)
      if (mensagem) setErro(mensagem)
    }
  }

  if (!paciente) {
    return (
      <Pagina titulo="Novo sumário" largura="estreita">
        {erro ? <Aviso tom="erro" anunciar>{erro}</Aviso> : <Carregando texto="Carregando ficha…" />}
      </Pagina>
    )
  }

  return (
    <Pagina titulo="Novo sumário" largura="estreita">
      <nav aria-label="Trilha" className="text-sm text-texto-suave">
        <Link to="/pacientes" className="foco rounded font-semibold text-destaque-escuro hover:underline">Pacientes</Link>
        {' / '}
        <Link to={`/pacientes/${encodeURIComponent(id)}`} className="foco rounded font-semibold text-destaque-escuro hover:underline">{paciente.nome}</Link>
        {' / '}Novo sumário
      </nav>
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">Adicionar sumário de alta</h1>
        <p className="text-base text-texto-suave">O sumário fica na ficha de {paciente.nome}. Depois, use “Gerar plano de alta” para a IA organizar as sugestões.</p>
      </header>

      <form noValidate onSubmit={salvar} aria-busy={enviando} className="cartao flex flex-col gap-5 p-5 sm:p-6">
        <CampoTexto rotulo="Título do sumário" value={titulo} onChange={(evento) => setTitulo(evento.target.value)} erro={erroTitulo} maxLength={160} placeholder="Ex.: Alta da cardiologia — novembro" />

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-[0.9375rem] font-semibold">Como deseja informar?</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {([['arquivo', 'Importar arquivo', 'TXT ou PDF; PDF digitalizado pode ser lido pela IA.'], ['texto', 'Digitar texto', 'Cole ou escreva o conteúdo.']] as const).map(([valor, rotulo, descricao]) => (
              <label key={valor} className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 has-focus-visible:ring-3 has-focus-visible:ring-destaque/45 ${modo === valor ? 'border-destaque bg-destaque-fundo' : 'border-borda-campo bg-white hover:bg-superficie'}`}>
                <input type="radio" name={`${idCampo}-modo`} checked={modo === valor} onChange={() => { setModo(valor); setErro(null) }} className="mt-1 size-4 accent-destaque" />
                <span className="flex flex-col gap-0.5"><span className="font-semibold">{rotulo}</span><span className="text-sm text-texto-suave">{descricao}</span></span>
              </label>
            ))}
          </div>
        </fieldset>

        {modo === 'arquivo' ? (
          <ImportarArquivo aoMudar={setArquivo} />
        ) : (
          <div className="flex flex-col gap-2">
            <label htmlFor={`${idCampo}-texto`} className="text-[0.9375rem] font-semibold">Texto do sumário de alta</label>
            <textarea id={`${idCampo}-texto`} value={texto} onChange={(evento) => setTexto(evento.target.value)} rows={12} maxLength={LIMITE_TEXTO} className="foco w-full resize-y rounded-lg border border-borda-campo bg-white px-3.5 py-3 text-[0.9375rem] leading-relaxed" />
            <span className="text-right text-sm text-texto-suave">{formatarNumero.format(texto.length)} de {formatarNumero.format(LIMITE_TEXTO)} caracteres</span>
          </div>
        )}

        {erro ? <MensagemErro>{erro}</MensagemErro> : null}

        <div className="flex flex-wrap gap-3 border-t pt-5">
          <button type="submit" disabled={enviando} className="botao-primario min-h-12 px-6">{enviando ? 'Salvando…' : 'Salvar na ficha'}</button>
          <Link to={`/pacientes/${encodeURIComponent(id)}`} className="botao-secundario min-h-12">Cancelar</Link>
        </div>
      </form>
    </Pagina>
  )
}
