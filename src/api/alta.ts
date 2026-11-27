import type { ClienteHttp } from './clienteHttp'
import { ErroApi } from './erros'

/** Tipos espelham o back-end (Backend/back-end/src/modules/alta/alta.model.ts). */
export type CategoriaAlta = 'medicamento' | 'cuidado' | 'alerta' | 'retorno'
export type FonteEntrada = 'base' | 'arquivo' | 'texto'
export type StatusAlta = 'pendente' | 'aprovado'

export interface Paciente {
  id: string
  nome: string
  email: string
  role?: 'paciente'
}

export interface SumarioBase {
  id: string
  titulo: string
  descricao: string
  texto: string
}

export interface SugestaoAlta {
  id: string
  categoria: CategoriaAlta
  titulo: string
  descricao: string
  trecho_origem: string
  /** Calculado pelo servidor: a citação existe no texto original. */
  origem_verificada: boolean
}

export interface EdicaoSugestaoAlta {
  id: string
  titulo: string
  descricao: string
}

export interface ExtracaoAlta {
  id: string
  paciente_id: string
  profissional_id: string
  origem?: FonteEntrada
  sumario_id?: string
  nome_arquivo?: string
  texto_original: string
  status: StatusAlta
  sugestoes: SugestaoAlta[]
  nao_informado: string[]
  criado_em: string
  itens_aprovados?: string[]
  plano_id?: string
  aprovado_em?: string
}

/** Linha da lista de extrações do profissional, sem texto clínico. */
export interface ResumoExtracao {
  id: string
  paciente_id: string
  paciente_nome: string
  origem: FonteEntrada
  titulo: string
  status: StatusAlta
  total_sugestoes: number
  total_aprovadas: number
  criado_em: string
  aprovado_em?: string
}

export interface DeclaracaoAceite {
  id: string
  texto: string
}

export interface TermoAceite {
  versao: string
  titulo: string
  resumo: string
  declaracoes: DeclaracaoAceite[]
}

/** Evidência do aceite humano gravada pelo servidor junto ao plano. */
export interface RegistroAceite {
  versao_termo: string
  declaracoes: DeclaracaoAceite[]
  profissional_id: string
  profissional_nome: string
  registrado_em: string
  hash_conteudo: string
}

export interface PlanoAlta {
  id: string
  paciente_id: string
  profissional_id: string
  extracao_id: string
  itens: SugestaoAlta[]
  criado_em: string
  aceite?: RegistroAceite
}

export type NovaExtracao =
  | { origem: 'base'; paciente_id: string; sumario_id: string }
  | { origem: 'texto'; paciente_id: string; texto: string }
  | { origem: 'arquivo'; paciente_id: string; nome_arquivo: string; texto: string }

export interface AprovacaoAlta {
  itens_aprovados: string[]
  sugestoes_editadas: EdicaoSugestaoAlta[]
  aceite: { versao_termo: string; declaracoes: string[] }
}

export interface ApiAlta {
  listarPacientes(): Promise<Paciente[]>
  listarSumarios(): Promise<SumarioBase[]>
  listarExtracoes(): Promise<ResumoExtracao[]>
  criarExtracao(dados: NovaExtracao): Promise<ExtracaoAlta>
  buscarExtracao(id: string): Promise<ExtracaoAlta>
  termoAceite(): Promise<TermoAceite>
  aprovarExtracao(id: string, aprovacao: AprovacaoAlta): Promise<PlanoAlta>
  planoDaExtracao(id: string): Promise<PlanoAlta>
  meuPlano(): Promise<PlanoAlta | null>
}

export function criarApiAlta(http: ClienteHttp): ApiAlta {
  const extracao = (id: string) => `/alta/extracoes/${encodeURIComponent(id)}`
  return {
    async listarPacientes() {
      return (await http.get<{ pacientes: Paciente[] }>('/pacientes')).pacientes
    },
    async listarSumarios() {
      return (await http.get<{ sumarios: SumarioBase[] }>('/alta/sumarios')).sumarios
    },
    async listarExtracoes() {
      return (await http.get<{ extracoes: ResumoExtracao[] }>('/alta/extracoes')).extracoes
    },
    criarExtracao: (dados) => http.post<ExtracaoAlta>('/alta/extracoes', dados),
    buscarExtracao: (id) => http.get<ExtracaoAlta>(extracao(id)),
    termoAceite: () => http.get<TermoAceite>('/alta/termo-aceite'),
    aprovarExtracao: (id, aprovacao) => http.post<PlanoAlta>(`${extracao(id)}/aprovar`, aprovacao),
    planoDaExtracao: (id) => http.get<PlanoAlta>(`${extracao(id)}/plano`),
    async meuPlano() {
      try {
        return await http.get<PlanoAlta>('/alta/planos/me')
      } catch (erro) {
        if (erro instanceof ErroApi && erro.status === 404) return null
        throw erro
      }
    },
  }
}
