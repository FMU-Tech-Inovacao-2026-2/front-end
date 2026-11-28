import { useEffect, useId, useState, type Ref } from 'react'
import { useApi } from '../api/ApiProvider'
import { useTratarErro } from '../api/useTratarErro'
import { lerArquivoSumario } from '../pages/alta/lerArquivoSumario'
import { Aviso } from './Aviso'
import { MensagemErro } from './MensagemErro'

export interface ArquivoLido {
  texto: string
  nomeArquivo: string
  /** true quando a IA transcreveu o PDF. */
  transcricaoIa: boolean
  /** false enquanto uma transcrição da IA não foi conferida pelo profissional. */
  pronto: boolean
}

const LIMITE_PDF = 10 * 1024 * 1024
const VAZIO: ArquivoLido = { texto: '', nomeArquivo: '', transcricaoIa: false, pronto: false }

function paraBase64(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onload = () => resolve(String(leitor.result).replace(/^data:[^,]*,/, ''))
    leitor.onerror = () => reject(new Error('Não foi possível ler o arquivo.'))
    leitor.readAsDataURL(arquivo)
  })
}

const ehPdf = (arquivo: File) => arquivo.type === 'application/pdf' || arquivo.name.toLowerCase().endsWith('.pdf')

interface Props {
  aoMudar(arquivo: ArquivoLido): void
  refEntrada?: Ref<HTMLInputElement>
}

/**
 * Importa TXT ou PDF. O texto é lido no navegador sempre que possível. Para PDF
 * digitalizado (sem texto) ou mal formatado, a IA transcreve no servidor, e o
 * profissional precisa conferir e confirmar a transcrição antes de usá-la.
 */
export function ImportarArquivo({ aoMudar, refEntrada }: Props) {
  const { alta } = useApi()
  const tratarErro = useTratarErro()
  const id = useId()
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [lido, setLido] = useState<ArquivoLido>(VAZIO)
  const [conferido, setConferido] = useState(false)
  const [estado, setEstado] = useState<'ocioso' | 'lendo' | 'transcrevendo'>('ocioso')
  const [semTexto, setSemTexto] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [urlPdf, setUrlPdf] = useState<string | null>(null)

  useEffect(() => () => { if (urlPdf) URL.revokeObjectURL(urlPdf) }, [urlPdf])

  function publicar(novo: ArquivoLido) {
    setLido(novo)
    aoMudar(novo)
  }

  async function escolher(escolhido?: File) {
    setErro(null)
    setSemTexto(false)
    setConferido(false)
    publicar(VAZIO)
    setArquivo(escolhido ?? null)
    setUrlPdf(escolhido && ehPdf(escolhido) ? URL.createObjectURL(escolhido) : null)
    if (!escolhido) return
    setEstado('lendo')
    try {
      const texto = await lerArquivoSumario(escolhido)
      publicar({ texto, nomeArquivo: escolhido.name, transcricaoIa: false, pronto: true })
    } catch (falha) {
      const mensagem = falha instanceof Error ? falha.message : 'Não foi possível ler esse arquivo.'
      if (ehPdf(escolhido) && /texto selecionável/i.test(mensagem)) setSemTexto(true)
      else setErro(mensagem)
    } finally {
      setEstado('ocioso')
    }
  }

  async function transcrever() {
    if (!arquivo) return
    if (arquivo.size > LIMITE_PDF) {
      setErro('O PDF deve ter no máximo 10 MB.')
      return
    }
    setErro(null)
    setEstado('transcrevendo')
    try {
      const resultado = await alta.transcreverPdf(arquivo.name, await paraBase64(arquivo))
      setSemTexto(false)
      setConferido(false)
      publicar({ texto: resultado.texto, nomeArquivo: arquivo.name, transcricaoIa: true, pronto: false })
    } catch (falha) {
      const mensagem = await tratarErro(falha, 'Não foi possível transcrever o PDF agora.')
      if (mensagem) setErro(mensagem)
    } finally {
      setEstado('ocioso')
    }
  }

  function editarTranscricao(texto: string) {
    setConferido(false)
    publicar({ ...lido, texto, pronto: false })
  }

  function confirmar(marcado: boolean) {
    setConferido(marcado)
    publicar({ ...lido, pronto: marcado && lido.texto.trim().length > 0 })
  }

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor={`${id}-arquivo`} className="text-[0.9375rem] font-semibold">Arquivo do sumário (.txt ou PDF)</label>
      <input
        id={`${id}-arquivo`}
        ref={refEntrada}
        type="file"
        accept=".txt,.pdf,text/plain,application/pdf"
        aria-describedby={`${id}-ajuda`}
        onChange={(evento) => void escolher(evento.target.files?.[0])}
        className="foco min-h-12 max-w-xl rounded-lg border border-dashed border-borda-campo bg-white p-2 text-sm file:mr-3 file:min-h-9 file:rounded-md file:border-0 file:bg-marca file:px-3 file:font-semibold file:text-white"
      />
      <p id={`${id}-ajuda`} className="text-sm text-texto-suave">
        O texto é lido no seu navegador. Se o PDF for digitalizado ou o texto sair desorganizado, a IA pode transcrevê-lo; nesse
        caso, o arquivo é enviado ao servidor e você confere a transcrição antes de usar.
      </p>

      {estado === 'lendo' ? <p role="status" className="text-sm text-texto-suave">Lendo arquivo…</p> : null}
      {estado === 'transcrevendo' ? (
        <p role="status" className="flex items-center gap-2 text-sm text-texto-suave">
          <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-borda border-t-destaque motion-reduce:animate-none" />
          A IA está transcrevendo o PDF. Isso pode levar até um minuto…
        </p>
      ) : null}
      {erro ? <MensagemErro>{erro}</MensagemErro> : null}

      {semTexto ? (
        <Aviso tom="atencao" titulo="Este PDF não tem texto selecionável">
          <p>Provavelmente é um documento digitalizado. A IA pode transcrevê-lo para você conferir.</p>
          <button type="button" onClick={() => void transcrever()} disabled={estado !== 'ocioso'} className="botao-primario mt-2">
            Transcrever com IA
          </button>
        </Aviso>
      ) : null}

      {lido.texto && !lido.transcricaoIa ? (
        <>
          <p className="text-sm font-semibold text-sucesso">Arquivo lido: {lido.nomeArquivo}</p>
          <pre aria-label="Texto lido do arquivo" className="max-h-72 overflow-auto rounded-lg border bg-superficie p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap">{lido.texto}</pre>
          {arquivo && ehPdf(arquivo) ? (
            <button type="button" onClick={() => void transcrever()} disabled={estado !== 'ocioso'} className="botao-discreto self-start">
              O texto saiu desorganizado? Transcrever com IA
            </button>
          ) : null}
        </>
      ) : null}

      {lido.transcricaoIa ? (
        <div className="flex flex-col gap-3 rounded-lg border-2 border-atencao-borda bg-atencao-fundo/50 p-4">
          <Aviso tom="atencao" titulo="Transcrição feita pela IA: confira antes de usar">
            Compare com o PDF original. A IA pode trocar números, doses ou palavras. Corrija o texto abaixo se necessário. As
            sugestões e as citações serão conferidas contra este texto.
          </Aviso>
          {urlPdf ? (
            <a href={urlPdf} target="_blank" rel="noreferrer" className="botao-secundario self-start">Abrir o PDF original</a>
          ) : null}
          <label htmlFor={`${id}-transcricao`} className="text-[0.9375rem] font-semibold">Texto transcrito de {lido.nomeArquivo}</label>
          <textarea
            id={`${id}-transcricao`}
            value={lido.texto}
            onChange={(evento) => editarTranscricao(evento.target.value)}
            rows={12}
            maxLength={20_000}
            className="foco w-full resize-y rounded-lg border border-borda-campo bg-white px-3.5 py-3 text-[0.9375rem] leading-relaxed text-marca"
          />
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
            <input type="checkbox" checked={conferido} onChange={(evento) => confirmar(evento.target.checked)} className="foco mt-0.5 size-5 shrink-0 accent-destaque" />
            <span>Conferi a transcrição com o PDF original e corrigi o que era necessário.</span>
          </label>
        </div>
      ) : null}
    </div>
  )
}
