import { ErroApi, MENSAGEM_ERRO_GENERICO, MENSAGEM_SEM_CONEXAO } from './erros'

interface Opcoes {
  /** URL da API Node.js + Express. */
  urlBase: string
  /** Token de acesso da sessão atual. */
  obterToken: () => Promise<string | null>
}

export interface ClienteHttp {
  get<T>(caminho: string): Promise<T>
  post<T>(caminho: string, corpo: unknown): Promise<T>
  patch<T>(caminho: string, corpo: unknown): Promise<T>
}

interface CorpoDeErro {
  erro?: { codigo?: string; mensagem?: string; detalhes?: { campo: string; mensagem: string }[] }
}

async function lerErro(resposta: Response): Promise<ErroApi> {
  const corpo = (await resposta.json().catch(() => null)) as CorpoDeErro | null
  const codigo = corpo?.erro?.codigo ?? 'erro'
  const mensagem = corpo?.erro?.mensagem ?? MENSAGEM_ERRO_GENERICO
  return new ErroApi(codigo, mensagem, resposta.status, corpo?.erro?.detalhes ?? [])
}

/**
 * Chamadas ao back-end com o token no cabeçalho e erros já convertidos em
 * ErroApi. Quem chama decide o que fazer com cada status (ex.: 401 → login).
 */
export function criarClienteHttp({ urlBase, obterToken }: Opcoes): ClienteHttp {
  const base = urlBase.replace(/\/+$/, '')

  async function requisitar<T>(metodo: 'GET' | 'POST' | 'PATCH', caminho: string, corpo?: unknown): Promise<T> {
    const token = await obterToken()
    const cabecalhos = new Headers({ Accept: 'application/json' })
    if (token) cabecalhos.set('Authorization', `Bearer ${token}`)
    if (corpo !== undefined) cabecalhos.set('Content-Type', 'application/json')

    let resposta: Response
    try {
      resposta = await fetch(`${base}${caminho}`, {
        method: metodo,
        headers: cabecalhos,
        body: corpo === undefined ? undefined : JSON.stringify(corpo),
      })
    } catch {
      throw new ErroApi('sem_conexao', MENSAGEM_SEM_CONEXAO, 0)
    }

    if (!resposta.ok) throw await lerErro(resposta)
    return (await resposta.json()) as T
  }

  return {
    get: (caminho) => requisitar('GET', caminho),
    post: (caminho, corpo) => requisitar('POST', caminho, corpo),
    patch: (caminho, corpo) => requisitar('PATCH', caminho, corpo),
  }
}
