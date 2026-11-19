import type { ClienteHttp } from './clienteHttp'

export interface Paciente {
  /** Id da conta do paciente no Supabase (o `sub` do token dele). */
  id: string
  nome: string
  email: string
}

export interface NovaExtracao {
  paciente_id: string
  texto: string
}

/** Resposta mínima que esta tela usa; o formato completo está em docs/contrato-api.md. */
export interface ExtracaoCriada {
  id: string
  status: 'pendente'
}

export interface ApiAlta {
  listarPacientes(): Promise<Paciente[]>
  criarExtracao(dados: NovaExtracao): Promise<ExtracaoCriada>
}

export function criarApiAlta(http: ClienteHttp): ApiAlta {
  return {
    listarPacientes: () => http.get<Paciente[]>('/pacientes'),
    criarExtracao: (dados) => http.post<ExtracaoCriada>('/alta/extracoes', dados),
  }
}
