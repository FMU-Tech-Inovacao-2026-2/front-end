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

/** "1958-03-14" → "14/03/1958", sem conversão de fuso (é uma data de calendário). */
export function formatarDataCivil(aaaaMmDd: string): string {
  const [ano, mes, dia] = aaaaMmDd.split('-')
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : '—'
}

/** Idade em anos completos a partir de uma data AAAA-MM-DD. */
export function idade(aaaaMmDd: string, hoje = new Date()): number | null {
  const [ano, mes, dia] = aaaaMmDd.split('-').map(Number)
  if (!ano || !mes || !dia) return null
  let anos = hoje.getFullYear() - ano
  if (hoje.getMonth() + 1 < mes || (hoje.getMonth() + 1 === mes && hoje.getDate() < dia)) anos -= 1
  return anos >= 0 ? anos : null
}

export const formatarNumero = new Intl.NumberFormat('pt-BR')

/** "1 sugestão" / "3 sugestões". */
export function plural(quantidade: number, singular: string, pluralTexto: string) {
  return `${formatarNumero.format(quantidade)} ${quantidade === 1 ? singular : pluralTexto}`
}
