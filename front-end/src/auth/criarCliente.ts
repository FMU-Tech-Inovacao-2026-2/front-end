import { criarClienteDemonstracao } from './clienteDemonstracao'
import type { ClienteAuth } from './tipos'
import { urlBaseSupabase } from './urlSupabase'

/**
 * Escolhe a autenticação pelas variáveis do .env:
 * - VITE_MODO_DEMONSTRACAO=true usa contas fictícias (apresentação).
 * - Senão, usa o Supabase com VITE_SUPABASE_URL e VITE_SUPABASE_CHAVE_PUBLICA.
 *
 * O Supabase é importado sob demanda, para não pesar no modo de demonstração.
 */
export async function criarCliente(): Promise<ClienteAuth> {
  const env = import.meta.env
  if (env.VITE_MODO_DEMONSTRACAO === 'true') return criarClienteDemonstracao()

  const url = env.VITE_SUPABASE_URL
  const chave = env.VITE_SUPABASE_CHAVE_PUBLICA
  if (!url || !chave) {
    throw new Error(
      'Configure VITE_SUPABASE_URL e VITE_SUPABASE_CHAVE_PUBLICA no .env, ou use VITE_MODO_DEMONSTRACAO=true. Veja o .env.example.',
    )
  }
  const { criarClienteSupabase } = await import('./clienteSupabase')
  return criarClienteSupabase(urlBaseSupabase(url), chave.trim())
}
