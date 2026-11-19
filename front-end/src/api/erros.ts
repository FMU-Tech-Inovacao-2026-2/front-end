/** Erro devolvido pela API no formato { "erro": { "codigo", "mensagem" } }. */
export class ErroApi extends Error {
  readonly codigo: string
  readonly status: number

  constructor(codigo: string, mensagem: string, status: number) {
    super(mensagem)
    this.name = 'ErroApi'
    this.codigo = codigo
    this.status = status
  }
}

export const MENSAGEM_SEM_CONEXAO = 'Não foi possível conectar ao servidor. Verifique sua internet e tente de novo.'
export const MENSAGEM_ERRO_GENERICO = 'Algo deu errado. Tente de novo em instantes.'
