import { MENSAGEM_CREDENCIAIS, perfilValido, type ClienteAuth, type Perfil, type Usuario } from './tipos'

/**
 * Contas fictícias para a apresentação, sem Supabase e sem dados reais.
 * Ative com VITE_MODO_DEMONSTRACAO=true. Não use em produção.
 */
export const CONTAS_DEMONSTRACAO: Record<Perfil, Usuario> = {
  profissional: { email: 'profissional@demo.healthia', perfil: 'profissional' },
  paciente: { email: 'paciente@demo.healthia', perfil: 'paciente' },
}
export const SENHA_DEMONSTRACAO = 'demonstracao'

const CHAVE = 'healthia:demo:perfil'

function lerPerfilSalvo(): Perfil | null {
  try {
    return perfilValido(sessionStorage.getItem(CHAVE))
  } catch {
    return null
  }
}

function salvarPerfil(perfil: Perfil | null) {
  try {
    if (perfil) sessionStorage.setItem(CHAVE, perfil)
    else sessionStorage.removeItem(CHAVE)
  } catch {
    // Sem armazenamento (aba anônima ou bloqueio): a sessão dura só até recarregar.
  }
}

export function criarClienteDemonstracao(): ClienteAuth {
  return {
    modoDemonstracao: true,

    async entrarComSenha(email, senha) {
      const conta = Object.values(CONTAS_DEMONSTRACAO).find(
        (c) => c.email === email.trim().toLowerCase(),
      )
      if (!conta || senha !== SENHA_DEMONSTRACAO) return { ok: false, mensagem: MENSAGEM_CREDENCIAIS }
      salvarPerfil(conta.perfil)
      return { ok: true, usuario: conta }
    },

    async entrarDemonstracao(perfil) {
      salvarPerfil(perfil)
      return { ok: true, usuario: CONTAS_DEMONSTRACAO[perfil] }
    },

    async usuarioAtual() {
      const perfil = lerPerfilSalvo()
      return perfil ? CONTAS_DEMONSTRACAO[perfil] : null
    },

    async tokenAtual() {
      const perfil = lerPerfilSalvo()
      return perfil ? `demonstracao-${perfil}` : null
    },

    async sair() {
      salvarPerfil(null)
    },
  }
}
