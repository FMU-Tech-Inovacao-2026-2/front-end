/**
 * Devolve só a base do projeto (https://<ref>.supabase.co). Aceita também a
 * URL da API REST copiada do painel (…/rest/v1/) e barras no final.
 */
export function urlBaseSupabase(valor: string): string {
  let url: URL
  try {
    url = new URL(valor.trim())
  } catch {
    throw new Error(`VITE_SUPABASE_URL não é uma URL válida: "${valor}". Use https://<ref>.supabase.co`)
  }
  return url.origin
}
