/**
 * Configuração do app. Em produção (contêiner), o arquivo /config.js é gerado na
 * inicialização a partir das variáveis do ambiente, então a mesma imagem serve
 * para qualquer ambiente. Em desenvolvimento, valem as variáveis VITE_ do .env.
 */
export type ModoApp = 'backend' | 'demonstracao' | 'supabase'

interface ConfiguracaoExecucao {
  modo?: string
  apiUrl?: string
}

declare global {
  interface Window {
    __HEALTHIA_CONFIG__?: ConfiguracaoExecucao
  }
}

type EnvModo = Pick<ImportMetaEnv, 'VITE_MODO_BACKEND' | 'VITE_MODO_DEMONSTRACAO'>

/** O modo de integração explícito prevalece quando as duas flags estão ativas. */
export function determinarModoAuth(env: EnvModo): ModoApp {
  if (env.VITE_MODO_BACKEND === 'true') return 'backend'
  if (env.VITE_MODO_DEMONSTRACAO === 'true') return 'demonstracao'
  return 'supabase'
}

function modoValido(valor: unknown): ModoApp | null {
  return valor === 'backend' || valor === 'demonstracao' || valor === 'supabase' ? valor : null
}

function lerExecucao(): ConfiguracaoExecucao {
  return typeof window === 'undefined' ? {} : window.__HEALTHIA_CONFIG__ ?? {}
}

export function modoDoApp(): ModoApp {
  return modoValido(lerExecucao().modo?.trim()) ?? determinarModoAuth(import.meta.env)
}

export function urlDaApi(): string {
  const valor = lerExecucao().apiUrl?.trim() || import.meta.env.VITE_API_URL?.trim() || 'http://localhost:3000'
  return valor.replace(/\/+$/, '')
}
