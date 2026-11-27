import { determinarModoAuth, modoDoApp, urlDaApi } from '../config'
import { criarClienteBackend } from './clienteBackend'
import { criarClienteDemonstracao } from './clienteDemonstracao'
import type { ClienteAuth } from './tipos'
import { urlBaseSupabase } from './urlSupabase'

export { determinarModoAuth }

/**
 * Escolhe a autenticação pela configuração (veja src/config.ts):
 * - backend: autentica na API Node.js + Express (JWT emitido e validado pela própria API).
 * - demonstracao: contas fictícias no navegador, sem rede.
 * - supabase: legado, ainda não integrado ao back-end.
 *
 * O Supabase é importado sob demanda, para não pesar nos outros modos.
 */
export async function criarCliente(): Promise<ClienteAuth> {
  const modo = modoDoApp()
  if (modo === 'backend') return criarClienteBackend(urlDaApi())
  if (modo === 'demonstracao') return criarClienteDemonstracao()

  const env = import.meta.env
  const url = env.VITE_SUPABASE_URL
  const chave = env.VITE_SUPABASE_CHAVE_PUBLICA
  if (!url || !chave) {
    throw new Error(
      'Configure o modo do app: VITE_MODO_BACKEND=true (API) ou VITE_MODO_DEMONSTRACAO=true. Veja o .env.example.',
    )
  }
  const { criarClienteSupabase } = await import('./clienteSupabase')
  return criarClienteSupabase(urlBaseSupabase(url), chave.trim())
}
