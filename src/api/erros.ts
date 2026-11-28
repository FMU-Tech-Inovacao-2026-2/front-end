/** Erro devolvido pela API no formato { "erro": { "codigo", "mensagem" } }. */
export interface DetalheErro {
  campo: string
  mensagem: string
}

export class ErroApi extends Error {
  readonly codigo: string
  readonly status: number
  /** Erros por campo devolvidos pela validação do servidor (DADOS_INVALIDOS). */
  readonly detalhes: DetalheErro[]

  constructor(codigo: string, mensagem: string, status: number, detalhes: DetalheErro[] = []) {
    super(mensagem)
    this.name = 'ErroApi'
    this.codigo = codigo
    this.status = status
    this.detalhes = detalhes
  }
}

export const MENSAGEM_SEM_CONEXAO = 'Não foi possível conectar ao servidor. Verifique sua internet e tente de novo.'
export const MENSAGEM_ERRO_GENERICO = 'Algo deu errado. Tente de novo em instantes.'
