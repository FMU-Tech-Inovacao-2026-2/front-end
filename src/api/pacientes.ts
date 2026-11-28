import type { PlanoAlta, ResumoExtracao } from './alta'
import type { ClienteHttp } from './clienteHttp'

/** Tipos espelham o back-end (Backend/back-end/src/modules/pacientes/paciente.model.ts). */
export interface FichaPaciente {
  id: string
  nome: string
  email: string
  /** AAAA-MM-DD */
  data_nascimento: string
  numero_prontuario: string
  telefone?: string
  responsavel?: string
  observacoes?: string
  criado_em: string
  criado_por?: string
  atualizado_em?: string
}

export interface PacienteNaLista extends FichaPaciente {
  total_sumarios: number
  ultimo_sumario_em?: string
}

export type OrigemSumario = 'texto' | 'arquivo' | 'pdf_ia'

export interface SumarioPaciente {
  id: string
  paciente_id: string
  titulo: string
  origem: OrigemSumario
  nome_arquivo?: string
  texto: string
  transcricao_ia: boolean
  criado_em: string
  criado_por: string
}

export type ResumoSumario = Omit<SumarioPaciente, 'texto'> & { caracteres: number }

export interface FichaCompleta {
  paciente: FichaPaciente
  sumarios: ResumoSumario[]
  extracoes: ResumoExtracao[]
  plano_vigente: PlanoAlta | null
}

export interface DadosPaciente {
  nome: string
  email: string
  data_nascimento: string
  numero_prontuario: string
  telefone?: string
  responsavel?: string
  observacoes?: string
}

export type NovoSumario =
  | { origem: 'texto'; titulo: string; texto: string }
  | { origem: 'arquivo'; titulo: string; nome_arquivo: string; texto: string }
  | { origem: 'pdf_ia'; titulo: string; nome_arquivo: string; texto: string; transcricao_conferida: true }

export interface ApiPacientes {
  listar(busca?: string): Promise<PacienteNaLista[]>
  /** Cria a ficha e a conta de acesso; a senha provisória vem uma única vez. */
  criar(dados: DadosPaciente): Promise<{ paciente: FichaPaciente; senha_provisoria: string }>
  ficha(id: string): Promise<FichaCompleta>
  atualizar(id: string, dados: Partial<Omit<DadosPaciente, 'email'>>): Promise<FichaPaciente>
  criarSumario(pacienteId: string, dados: NovoSumario): Promise<SumarioPaciente>
  buscarSumario(pacienteId: string, sumarioId: string): Promise<SumarioPaciente>
}

export function criarApiPacientes(http: ClienteHttp): ApiPacientes {
  const base = (id: string) => `/pacientes/${encodeURIComponent(id)}`
  return {
    async listar(busca) {
      const consulta = busca?.trim() ? `?busca=${encodeURIComponent(busca.trim())}` : ''
      return (await http.get<{ pacientes: PacienteNaLista[] }>(`/pacientes${consulta}`)).pacientes
    },
    criar: (dados) => http.post('/pacientes', dados),
    ficha: (id) => http.get<FichaCompleta>(base(id)),
    async atualizar(id, dados) {
      return (await http.patch<{ paciente: FichaPaciente }>(base(id), dados)).paciente
    },
    criarSumario: (id, dados) => http.post<SumarioPaciente>(`${base(id)}/sumarios`, dados),
    buscarSumario: (id, sumarioId) => http.get<SumarioPaciente>(`${base(id)}/sumarios/${encodeURIComponent(sumarioId)}`),
  }
}
