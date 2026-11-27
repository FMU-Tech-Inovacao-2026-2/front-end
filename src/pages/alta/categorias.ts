import type { CategoriaAlta } from '../../api/alta'

export const ROTULO_CATEGORIA: Record<CategoriaAlta, string> = {
  medicamento: 'Medicamento',
  cuidado: 'Cuidado',
  alerta: 'Sinal de alerta',
  retorno: 'Retorno',
}

export const COR_CATEGORIA: Record<CategoriaAlta, string> = {
  medicamento: 'bg-marca/8 text-marca',
  cuidado: 'bg-destaque-fundo text-destaque-escuro',
  alerta: 'bg-atencao-fundo text-atencao',
  retorno: 'bg-superficie text-texto-suave',
}

export const ORDEM_CATEGORIA: CategoriaAlta[] = ['medicamento', 'cuidado', 'retorno', 'alerta']
