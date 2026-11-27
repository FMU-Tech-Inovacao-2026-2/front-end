import type { EdicaoSugestaoAlta } from '../../api/alta'

export type Decisao = 'aceita' | 'reprovada'

/**
 * Decisões do profissional sobre cada sugestão, guardadas por extração na aba
 * atual. Sobrevive a recarregar a página e evita que a revisão final aprove
 * algo diferente do que foi decidido. Guarda só IDs e as edições feitas.
 */
export interface RascunhoRevisao {
  decisoes: Record<string, Decisao>
  edicoes: Record<string, EdicaoSugestaoAlta>
}

const prefixo = 'healthia:alta:rascunho:'
const memoria = new Map<string, RascunhoRevisao>()

export function lerRascunho(extracaoId: string): RascunhoRevisao | null {
  try {
    const bruto = sessionStorage.getItem(prefixo + extracaoId)
    if (bruto) return JSON.parse(bruto) as RascunhoRevisao
  } catch {
    // Sem armazenamento: usa a cópia em memória.
  }
  return memoria.get(extracaoId) ?? null
}

export function salvarRascunho(extracaoId: string, rascunho: RascunhoRevisao) {
  memoria.set(extracaoId, rascunho)
  try {
    sessionStorage.setItem(prefixo + extracaoId, JSON.stringify(rascunho))
  } catch {
    // Idem.
  }
}

export function limparRascunho(extracaoId: string) {
  memoria.delete(extracaoId)
  try {
    sessionStorage.removeItem(prefixo + extracaoId)
  } catch {
    // Idem.
  }
}

/** IDs aceitos e edições só dos itens aceitos, no formato da API. */
export function paraAprovacao(rascunho: RascunhoRevisao) {
  const itens = Object.entries(rascunho.decisoes).filter(([, decisao]) => decisao === 'aceita').map(([id]) => id)
  const edicoes = Object.values(rascunho.edicoes).filter((edicao) => itens.includes(edicao.id))
  return { itens, edicoes }
}
