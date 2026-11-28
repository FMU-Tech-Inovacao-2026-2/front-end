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
  /** Motivo de cada reprovação (salvaguarda G2). */
  motivos: Record<string, string>
}

/** Motivos frequentes, oferecidos como atalho. O profissional pode escrever outro. */
export const MOTIVOS_FREQUENTES = [
  'Informação incorreta ou mal interpretada',
  'Item duplicado',
  'Não se aplica a este paciente',
  'Orientação será dada por outro meio',
]

export const MOTIVO_MINIMO = 3

const prefixo = 'healthia:alta:rascunho:'
const memoria = new Map<string, RascunhoRevisao>()

export function lerRascunho(extracaoId: string): RascunhoRevisao | null {
  try {
    const bruto = sessionStorage.getItem(prefixo + extracaoId)
    if (bruto) return { motivos: {}, ...(JSON.parse(bruto) as Partial<RascunhoRevisao>) } as RascunhoRevisao
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

/**
 * IDs aceitos, edições só dos aceitos e reprovações com motivo, no formato da API.
 * Itens sem origem confirmada não entram em `reprovados`: o servidor os reprova sozinho.
 */
export function paraAprovacao(rascunho: RascunhoRevisao, verificados: Set<string>) {
  const itens = Object.entries(rascunho.decisoes).filter(([, decisao]) => decisao === 'aceita').map(([id]) => id)
  const edicoes = Object.values(rascunho.edicoes).filter((edicao) => itens.includes(edicao.id))
  const reprovados = Object.entries(rascunho.decisoes)
    .filter(([id, decisao]) => decisao === 'reprovada' && verificados.has(id))
    .map(([id]) => ({ id, motivo: (rascunho.motivos[id] ?? '').trim() }))
  return { itens, edicoes, reprovados }
}
