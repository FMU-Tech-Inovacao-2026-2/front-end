import { perfilValido, type ClienteAuth, type Perfil, type Usuario } from './tipos'

/**
 * Contas fictícias para a apresentação, sem rede e sem dados reais.
 * Ative com VITE_MODO_DEMONSTRACAO=true (ou modo "demonstracao" no /config.js).
 */
export const CONTAS_DEMONSTRACAO: Record<Perfil, Usuario> = {
  profissional: { email: 'profissional@demo.healthia', perfil: 'profissional', nome: 'Dra. Ana Demo' },
  paciente: { email: 'paciente@demo.healthia', perfil: 'paciente', nome: 'Paciente Demo' },
}
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
      // A demonstração é offline: os campos não autenticam nem consultam a API.
      // O e-mail só escolhe qual perfil fictício abrir; senha é ignorada.
      void senha
      const perfil: Perfil = email.toLowerCase().includes('paciente') ? 'paciente' : 'profissional'
      const conta = CONTAS_DEMONSTRACAO[perfil]
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
