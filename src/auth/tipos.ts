export type Perfil = 'profissional' | 'paciente'

export interface Usuario {
  email: string
  perfil: Perfil
  nome?: string
}

export type ResultadoLogin =
  | { ok: true; usuario: Usuario }
  | { ok: false; mensagem: string }

/**
 * Fronteira com o serviço de autenticação. A tela de login e o restante do
 * app só conhecem esta interface, o que permite trocar o Supabase por uma
 * versão de demonstração (ou por uma versão falsa nos testes).
 */
export interface ClienteAuth {
  /** true quando o app roda com contas fictícias, sem Supabase. */
  readonly modoDemonstracao: boolean
  entrarComSenha(email: string, senha: string): Promise<ResultadoLogin>
  entrarDemonstracao(perfil: Perfil): Promise<ResultadoLogin>
  usuarioAtual(): Promise<Usuario | null>
  /** Token de acesso para mandar ao back-end (Authorization: Bearer). */
  tokenAtual(): Promise<string | null>
  sair(): Promise<void>
}

export const MENSAGEM_SEM_PERFIL =
  'Sua conta ainda não tem um perfil liberado. Fale com o administrador da sua unidade.'
export const MENSAGEM_CREDENCIAIS = 'E-mail ou senha incorretos.'
export const MENSAGEM_CONEXAO = 'Não foi possível conectar. Verifique sua internet e tente de novo.'

export function perfilValido(valor: unknown): Perfil | null {
  return valor === 'profissional' || valor === 'paciente' ? valor : null
}
