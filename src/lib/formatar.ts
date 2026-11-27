const FUSO = 'America/Sao_Paulo'

const data = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: FUSO })
const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: FUSO })

/** "27/11/2026" (DD/MM/AAAA, horário de Brasília). */
export function formatarData(iso: string): string {
  const valor = new Date(iso)
  return Number.isNaN(valor.getTime()) ? '—' : data.format(valor)
}

/** "27/11/2026 às 14:05" (horário de Brasília). */
export function formatarDataHora(iso: string): string {
  const valor = new Date(iso)
  return Number.isNaN(valor.getTime()) ? '—' : `${data.format(valor)} às ${hora.format(valor)}`
}

export const formatarNumero = new Intl.NumberFormat('pt-BR')

/** "1 sugestão" / "3 sugestões". */
export function plural(quantidade: number, singular: string, pluralTexto: string) {
  return `${formatarNumero.format(quantidade)} ${quantidade === 1 ? singular : pluralTexto}`
}
