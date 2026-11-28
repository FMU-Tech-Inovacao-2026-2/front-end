import type { ClienteHttp } from './clienteHttp'
import { ErroApi } from './erros'

/** Tipos espelham o back-end (Backend/back-end/src/modules/alta/alta.model.ts). */
export type CategoriaAlta = 'medicamento' | 'cuidado' | 'alerta' | 'retorno'
export type FonteEntrada = 'base' | 'arquivo' | 'texto' | 'ficha'
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
  sumario_paciente_id?: string
  nome_arquivo?: string
  /** Texto transcrito de PDF pela IA e conferido pelo profissional. */
  transcricao_ia?: boolean
  texto_original: string
  status: StatusAlta
  sugestoes: SugestaoAlta[]
  nao_informado: string[]
  criado_em: string
  /** Modelo e consumo da IA que gerou as sugestões. */
  ia?: UsoIA
  itens_aprovados?: string[]
  decisoes?: DecisaoSugestao[]
  plano_id?: string
  aprovado_em?: string
}

/** Consumo de uma chamada de IA, sem conteúdo clínico. */
export interface UsoIA {
  modelo: string
  tokens_entrada: number
  tokens_saida: number
  duracao_ms: number
  reparos: number
}

/** Decisão gravada pelo servidor (salvaguarda G2). */
export interface DecisaoSugestao {
  id: string
  decisao: 'aprovada' | 'reprovada'
  motivo?: string
  automatica: boolean
  editada: boolean
}

/** Reprovação mostrada só ao profissional, no comprovante. */
export interface ReprovacaoRegistrada {
  id: string
  categoria: CategoriaAlta
  titulo: string
  trecho_origem: string
  motivo: string
  automatica: boolean
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

/** Plano com as reprovações: devolvido só ao profissional (aprovação e comprovante). */
export type PlanoComReprovacoes = PlanoAlta & { reprovacoes?: ReprovacaoRegistrada[] }

export type NovaExtracao =
  | { origem: 'base'; paciente_id: string; sumario_id: string }
  | { origem: 'texto'; paciente_id: string; texto: string }
  | { origem: 'arquivo'; paciente_id: string; nome_arquivo: string; texto: string; transcricao_ia?: boolean }
  | { origem: 'ficha'; paciente_id: string; sumario_id: string }

export interface TranscricaoPdf {
  texto: string
  modelo: string
  transcricao_ia: true
}

export interface AprovacaoAlta {
  itens_aprovados: string[]
  /** Toda sugestão com origem verificada e não aprovada precisa de motivo. */
  itens_reprovados: { id: string; motivo: string }[]
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
  aprovarExtracao(id: string, aprovacao: AprovacaoAlta): Promise<PlanoComReprovacoes>
  planoDaExtracao(id: string): Promise<PlanoComReprovacoes>
  meuPlano(): Promise<PlanoAlta | null>
  /** A IA transcreve o PDF (inclusive digitalizado); o texto volta para conferência humana. */
  transcreverPdf(nomeArquivo: string, pdfBase64: string): Promise<TranscricaoPdf>
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
    aprovarExtracao: (id, aprovacao) => http.post<PlanoComReprovacoes>(`${extracao(id)}/aprovar`, aprovacao),
    planoDaExtracao: (id) => http.get<PlanoComReprovacoes>(`${extracao(id)}/plano`),
    transcreverPdf: (nome_arquivo, pdf_base64) => http.post<TranscricaoPdf>('/alta/transcricoes', { nome_arquivo, pdf_base64 }),
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
