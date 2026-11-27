/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  /** Chave pública (publishable/anon). Nunca a service_role: tudo que começa com VITE_ vai para o navegador. */
  readonly VITE_SUPABASE_CHAVE_PUBLICA?: string
  readonly VITE_MODO_DEMONSTRACAO?: string
  /** Endereço do back-end FastAPI, sem barra no final. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
