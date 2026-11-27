import { createClient, isAuthApiError, type User } from '@supabase/supabase-js'
import {
  MENSAGEM_CONEXAO,
  MENSAGEM_CREDENCIAIS,
  MENSAGEM_SEM_PERFIL,
  perfilValido,
  type ClienteAuth,
  type Usuario,
} from './tipos'

/**
 * O perfil vem de app_metadata, que só o servidor (service_role ou painel do
 * Supabase) consegue gravar. Nunca use user_metadata para isso: o próprio
 * usuário consegue alterar user_metadata e se promover a profissional.
 */
function paraUsuario(user: User): Usuario | null {
  const perfil = perfilValido(user.app_metadata?.perfil)
  if (!perfil || !user.email) return null
  return { email: user.email, perfil }
}

export function criarClienteSupabase(url: string, chavePublica: string): ClienteAuth {
  const supabase = createClient(url, chavePublica)

  return {
    modoDemonstracao: false,

    async entrarComSenha(email, senha) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
        if (error) {
          const credenciais = isAuthApiError(error) && error.code === 'invalid_credentials'
          return { ok: false, mensagem: credenciais ? MENSAGEM_CREDENCIAIS : MENSAGEM_CONEXAO }
        }
        const usuario = paraUsuario(data.user)
        if (!usuario) {
          await supabase.auth.signOut()
          return { ok: false, mensagem: MENSAGEM_SEM_PERFIL }
        }
        return { ok: true, usuario }
      } catch {
        return { ok: false, mensagem: MENSAGEM_CONEXAO }
      }
    },

    async entrarDemonstracao() {
      return { ok: false, mensagem: 'O acesso de demonstração está desligado neste ambiente.' }
    },

    async usuarioAtual() {
      // getUser confere o token com o servidor; getSession só lê o que está salvo no navegador.
      const { data, error } = await supabase.auth.getUser()
      if (error || !data.user) return null
      return paraUsuario(data.user)
    },

    async tokenAtual() {
      // O supabase-js renova o token sozinho; o back-end valida a assinatura.
      const { data } = await supabase.auth.getSession()
      return data.session?.access_token ?? null
    },

    async sair() {
      await supabase.auth.signOut()
    },
  }
}
