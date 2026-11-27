import type {
  ApiAlta,
  ExtracaoAlta,
  NovaExtracao,
  Paciente,
  PlanoAlta,
  RegistroAceite,
  ResumoExtracao,
  SugestaoAlta,
  SumarioBase,
  TermoAceite,
} from './alta'
import { ErroApi } from './erros'

/**
 * Demonstração SEM rede: reproduz no navegador as mesmas regras do back-end em
 * GEMINI_PROVEDOR=demonstracao (catálogo fictício, respostas preparadas, verificação
 * de origem, termo de aceite obrigatório e plano liberado só após aprovação).
 * Mantenha sincronizado com Backend/back-end/src/modules/alta/alta.catalogo.ts e alta.termo.ts.
 * Somente conteúdo inventado.
 */
export const PACIENTE_DEMONSTRACAO: Paciente = {
  id: 'u-demo-paciente',
  nome: 'Paciente Demo (PAC-0042)',
  email: 'paciente@demo.healthia',
  role: 'paciente',
}
export const PROFISSIONAL_DEMONSTRACAO = { id: 'u-demo-profissional', nome: 'Dra. Ana Demo' }

export const SUMARIOS_DEMONSTRACAO: SumarioBase[] = [
  {
    id: 'sumario-cardiaco-01',
    titulo: 'Alta após internação cardiológica (fictício)',
    descricao: 'Caso completo com medicação, cuidados, retorno e sinal de alerta.',
    texto: `SUMÁRIO DE ALTA HOSPITALAR — CASO FICTÍCIO\n\nPaciente: Paciente Demo (identificação inventada)\n\nDiagnóstico de alta: insuficiência cardíaca descompensada.\n\nMedicações na alta:\n- Furosemida 40 mg por via oral pela manhã, durante 7 dias.\n- Enalapril 10 mg por via oral a cada 12 horas.\n\nCuidados: pesar-se todos os dias pela manhã e anotar o peso.\n\nRetorno: consulta com cardiologia em 14 dias.\n\nSinais de alerta: procurar atendimento se houver falta de ar em repouso ou inchaço que piore.`,
  },
  {
    id: 'sumario-pos-operatorio-02',
    titulo: 'Alta após procedimento (fictício)',
    descricao: 'Caso curto com analgesia, cuidado local e retorno.',
    texto: `SUMÁRIO DE ALTA — CASO FICTÍCIO\n\nPaciente: Paciente Demo (identificação inventada)\n\nMedicação: Paracetamol 750 mg por via oral a cada 8 horas se houver dor, por até 3 dias.\n\nCuidados: manter o curativo limpo e seco até a avaliação da equipe.\n\nRetorno: retornar ao ambulatório em 7 dias para revisão.`,
  },
]

type SugestaoPreparada = Omit<SugestaoAlta, 'id' | 'origem_verificada'>

/** Imitam a saída da IA, inclusive um erro proposital: uma citação que não existe no sumário. */
const RESPOSTAS: Record<string, { sugestoes: SugestaoPreparada[]; nao_informado: string[] }> = {
  'sumario-cardiaco-01': {
    sugestoes: [
      { categoria: 'medicamento', titulo: 'Furosemida 40 mg', descricao: 'Via oral pela manhã, durante 7 dias.', trecho_origem: 'Furosemida 40 mg por via oral pela manhã, durante 7 dias.' },
      { categoria: 'medicamento', titulo: 'Enalapril 10 mg', descricao: 'Via oral a cada 12 horas.', trecho_origem: 'Enalapril 10 mg por via oral a cada 12 horas.' },
      { categoria: 'medicamento', titulo: 'Enalapril 10 mg à noite', descricao: 'Sugestão com citação que não existe no sumário (erro proposital da demonstração).', trecho_origem: 'Enalapril 10 mg por via oral à noite.' },
      { categoria: 'cuidado', titulo: 'Acompanhar o peso', descricao: 'Pesar-se todos os dias pela manhã e anotar o resultado.', trecho_origem: 'pesar-se todos os dias pela manhã e anotar o peso.' },
      { categoria: 'retorno', titulo: 'Consulta com cardiologia', descricao: 'Retorno em 14 dias.', trecho_origem: 'consulta com cardiologia em 14 dias.' },
      { categoria: 'alerta', titulo: 'Falta de ar ou inchaço', descricao: 'Procurar atendimento se houver falta de ar em repouso ou inchaço que piore.', trecho_origem: 'procurar atendimento se houver falta de ar em repouso ou inchaço que piore.' },
    ],
    nao_informado: ['Horário exato da Enalapril', 'Peso de referência para comparação'],
  },
  'sumario-pos-operatorio-02': {
    sugestoes: [
      { categoria: 'medicamento', titulo: 'Paracetamol 750 mg se houver dor', descricao: 'Via oral a cada 8 horas, se houver dor, por até 3 dias.', trecho_origem: 'Paracetamol 750 mg por via oral a cada 8 horas se houver dor, por até 3 dias.' },
      { categoria: 'cuidado', titulo: 'Cuidar do curativo', descricao: 'Manter limpo e seco até a avaliação da equipe.', trecho_origem: 'manter o curativo limpo e seco até a avaliação da equipe.' },
      { categoria: 'retorno', titulo: 'Retorno ao ambulatório', descricao: 'Revisão em 7 dias.', trecho_origem: 'retornar ao ambulatório em 7 dias para revisão.' },
    ],
    nao_informado: ['Sinais de alerta para procurar atendimento'],
  },
}

export const TERMO_DEMONSTRACAO: TermoAceite = {
  versao: '2026-11-v1',
  titulo: 'Termo de aceite profissional',
  resumo:
    'As sugestões foram organizadas por inteligência artificial a partir do sumário informado. Elas só chegam ao paciente depois desta confirmação.',
  declaracoes: [
    { id: 'revisao_integral', texto: 'Revisei cada item aprovado e conferi o trecho de origem correspondente no sumário de alta.' },
    { id: 'ciente_limitacoes_ia', texto: 'Estou ciente de que a IA pode omitir, interpretar mal ou errar informações e de que as sugestões não substituem meu julgamento clínico.' },
    { id: 'decisao_profissional', texto: 'Assumo a decisão profissional sobre o conteúdo aprovado, que será disponibilizado ao paciente como orientação de alta.' },
    { id: 'finalidade_lgpd', texto: 'Uso os dados de saúde deste paciente somente para a tutela da sua saúde e a continuidade do cuidado, conforme a LGPD (Lei nº 13.709/2018, art. 11, II, "f").' },
  ],
}

/** Mesma regra do servidor: a citação precisa existir no texto original. */
function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[“”"']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('pt-BR')
}

export function origemConfere(trecho: string, textoOriginal: string) {
  const alvo = normalizar(trecho)
  return alvo.length >= 8 && normalizar(textoOriginal).includes(alvo)
}

interface EstadoDemonstracao {
  extracoes: ExtracaoAlta[]
  planos: PlanoAlta[]
}

const CHAVE = 'healthia:demo:alta'
let memoria: EstadoDemonstracao = { extracoes: [], planos: [] }

function ler(): EstadoDemonstracao {
  try {
    const bruto = sessionStorage.getItem(CHAVE)
    if (bruto) memoria = JSON.parse(bruto) as EstadoDemonstracao
  } catch {
    // Sem armazenamento: a demonstração continua em memória até recarregar.
  }
  return structuredClone(memoria)
}

function gravar(estado: EstadoDemonstracao) {
  memoria = structuredClone(estado)
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify(estado))
  } catch {
    // Idem: segue só em memória.
  }
}

/** Apaga extrações e planos da demonstração (botão "Reiniciar demonstração"). */
export function reiniciarDemonstracao() {
  gravar({ extracoes: [], planos: [] })
}

const novoId = () => globalThis.crypto?.randomUUID?.() ?? `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

async function hashDoConteudo(extracaoId: string, versao: string, itens: SugestaoAlta[]) {
  const canonico = JSON.stringify({
    extracao_id: extracaoId,
    versao_termo: versao,
    itens: itens.map(({ id, categoria, titulo, descricao, trecho_origem }) => ({ id, categoria, titulo, descricao, trecho_origem })),
  })
  try {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonico))
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  } catch {
    return 'indisponivel-na-demonstracao'
  }
}

const erro = (status: number, codigo: string, mensagem: string) => new ErroApi(codigo, mensagem, status)

function textoDaEntrada(dados: NovaExtracao) {
  if (dados.origem === 'base') {
    const sumario = SUMARIOS_DEMONSTRACAO.find((item) => item.id === dados.sumario_id)
    if (!sumario) throw erro(404, 'NAO_ENCONTRADO', 'Sumário de exemplo não encontrado')
    return { texto: sumario.texto, sumarioId: sumario.id }
  }
  return { texto: dados.texto.trim(), sumarioId: undefined }
}

export function criarApiAltaDemonstracao(): ApiAlta {
  function buscar(id: string) {
    const extracao = ler().extracoes.find((item) => item.id === id)
    if (!extracao) throw erro(404, 'NAO_ENCONTRADO', 'Extração não encontrada. Reinicie a demonstração e comece de novo.')
    return extracao
  }

  return {
    async listarPacientes() {
      return [structuredClone(PACIENTE_DEMONSTRACAO)]
    },
    async listarSumarios() {
      return structuredClone(SUMARIOS_DEMONSTRACAO)
    },
    async listarExtracoes(): Promise<ResumoExtracao[]> {
      return ler().extracoes
        .sort((a, b) => b.criado_em.localeCompare(a.criado_em))
        .map((item) => ({
          id: item.id,
          paciente_id: item.paciente_id,
          paciente_nome: PACIENTE_DEMONSTRACAO.nome,
          origem: item.origem ?? 'base',
          titulo: SUMARIOS_DEMONSTRACAO.find((s) => s.id === item.sumario_id)?.titulo ?? item.nome_arquivo ?? 'Texto digitado',
          status: item.status,
          total_sugestoes: item.sugestoes.length,
          total_aprovadas: item.itens_aprovados?.length ?? 0,
          criado_em: item.criado_em,
          ...(item.aprovado_em ? { aprovado_em: item.aprovado_em } : {}),
        }))
    },
    async criarExtracao(dados) {
      if (dados.paciente_id !== PACIENTE_DEMONSTRACAO.id) throw erro(404, 'NAO_ENCONTRADO', 'Paciente não encontrado')
      const { texto, sumarioId } = textoDaEntrada(dados)
      const sumario = SUMARIOS_DEMONSTRACAO.find((item) => item.texto.trim() === texto.trim())
      const resposta = sumario ? RESPOSTAS[sumario.id] : undefined
      if (!resposta) {
        throw erro(503, 'SERVICO_INDISPONIVEL', 'Este ambiente está em modo demonstração: escolha um sumário da base. Textos livres exigem a IA configurada.')
      }
      const extracao: ExtracaoAlta = {
        id: novoId(),
        paciente_id: PACIENTE_DEMONSTRACAO.id,
        profissional_id: PROFISSIONAL_DEMONSTRACAO.id,
        origem: dados.origem,
        ...(sumarioId ?? sumario?.id ? { sumario_id: sumarioId ?? sumario?.id } : {}),
        ...(dados.origem === 'arquivo' ? { nome_arquivo: dados.nome_arquivo } : {}),
        texto_original: texto,
        status: 'pendente',
        sugestoes: resposta.sugestoes.map((item) => ({ ...item, id: novoId(), origem_verificada: origemConfere(item.trecho_origem, texto) })),
        nao_informado: [...resposta.nao_informado],
        criado_em: new Date().toISOString(),
      }
      const estado = ler()
      gravar({ ...estado, extracoes: [...estado.extracoes, extracao] })
      return structuredClone(extracao)
    },
    async buscarExtracao(id) {
      return structuredClone(buscar(id))
    },
    async termoAceite() {
      return structuredClone(TERMO_DEMONSTRACAO)
    },
    async aprovarExtracao(id, { itens_aprovados, sugestoes_editadas, aceite }) {
      const extracao = buscar(id)
      if (extracao.status !== 'pendente') throw erro(409, 'CONFLITO', 'Esta extração já foi aprovada.')
      if (aceite.versao_termo !== TERMO_DEMONSTRACAO.versao) {
        throw erro(422, 'ACEITE_INCOMPLETO', 'O termo de aceite mudou. Recarregue a página e confirme a versão atual.')
      }
      if (TERMO_DEMONSTRACAO.declaracoes.some((item) => !aceite.declaracoes.includes(item.id))) {
        throw erro(422, 'ACEITE_INCOMPLETO', 'Confirme todas as declarações do termo de aceite antes de aprovar.')
      }
      if (itens_aprovados.length === 0) throw erro(400, 'DADOS_INVALIDOS', 'Aceite pelo menos uma sugestão.')
      const ids = new Set(itens_aprovados)
      const edicoes = new Map(sugestoes_editadas.map((item) => [item.id, item]))
      if ([...edicoes.keys()].some((idEditado) => !ids.has(idEditado))) {
        throw erro(403, 'SEM_PERMISSAO', 'Só é possível editar sugestões selecionadas para aprovação.')
      }
      const itens = extracao.sugestoes.filter((item) => ids.has(item.id)).map((item) => {
        const edicao = edicoes.get(item.id)
        return edicao ? { ...item, titulo: edicao.titulo, descricao: edicao.descricao } : item
      })
      if (itens.length !== ids.size) throw erro(404, 'NAO_ENCONTRADO', 'Uma ou mais sugestões não pertencem a esta extração.')
      if (itens.some((item) => !item.origem_verificada)) {
        throw erro(403, 'SEM_PERMISSAO', 'Há sugestões sem trecho de origem confirmado. Elas não podem ser aprovadas.')
      }

      const agora = new Date().toISOString()
      const registro: RegistroAceite = {
        versao_termo: TERMO_DEMONSTRACAO.versao,
        declaracoes: structuredClone(TERMO_DEMONSTRACAO.declaracoes),
        profissional_id: PROFISSIONAL_DEMONSTRACAO.id,
        profissional_nome: PROFISSIONAL_DEMONSTRACAO.nome,
        registrado_em: agora,
        hash_conteudo: await hashDoConteudo(extracao.id, TERMO_DEMONSTRACAO.versao, itens),
      }
      const plano: PlanoAlta = {
        id: novoId(),
        paciente_id: extracao.paciente_id,
        profissional_id: PROFISSIONAL_DEMONSTRACAO.id,
        extracao_id: extracao.id,
        itens,
        criado_em: agora,
        aceite: registro,
      }
      const estado = ler()
      gravar({
        planos: [...estado.planos, plano],
        extracoes: estado.extracoes.map((item) =>
          item.id === extracao.id ? { ...item, status: 'aprovado', itens_aprovados: [...ids], plano_id: plano.id, aprovado_em: agora } : item,
        ),
      })
      return structuredClone(plano)
    },
    async planoDaExtracao(id) {
      const extracao = buscar(id)
      const plano = ler().planos.find((item) => item.id === extracao.plano_id)
      if (!plano) throw erro(404, 'NAO_ENCONTRADO', 'Esta extração ainda não tem plano aprovado.')
      return structuredClone(plano)
    },
    async meuPlano() {
      const planos = ler().planos.filter((item) => item.paciente_id === PACIENTE_DEMONSTRACAO.id)
      return planos.length ? structuredClone(planos[planos.length - 1]) : null
    },
  }
}
