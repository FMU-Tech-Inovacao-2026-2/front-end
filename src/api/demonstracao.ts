import type {
  ApiAlta,
  DecisaoSugestao,
  ExtracaoAlta,
  NovaExtracao,
  Paciente,
  PlanoAlta,
  RegistroAceite,
  ReprovacaoRegistrada,
  ResumoExtracao,
  SugestaoAlta,
  SumarioBase,
  TermoAceite,
} from './alta'
import { ErroApi } from './erros'
import type { ApiPacientes, FichaPaciente, PacienteNaLista, SumarioPaciente } from './pacientes'

/**
 * Demonstração SEM rede: reproduz no navegador as mesmas regras do back-end em
 * GEMINI_PROVEDOR=demonstracao (catálogo fictício, respostas preparadas, verificação
 * de origem, termo de aceite obrigatório, fichário e plano liberado só após aprovação).
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

const FICHA_INICIAL: FichaPaciente = {
  id: PACIENTE_DEMONSTRACAO.id,
  nome: PACIENTE_DEMONSTRACAO.nome,
  email: PACIENTE_DEMONSTRACAO.email,
  data_nascimento: '1958-03-14',
  numero_prontuario: 'PAC-0042',
  responsavel: 'Familiar Demo (fictício)',
  criado_em: '2026-11-01T12:00:00.000Z',
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
  fichas: FichaPaciente[]
  sumarios: SumarioPaciente[]
}

const CHAVE = 'healthia:demo:alta'
const estadoInicial = (): EstadoDemonstracao => ({ extracoes: [], planos: [], fichas: [structuredClone(FICHA_INICIAL)], sumarios: [] })
let memoria: EstadoDemonstracao = estadoInicial()

function ler(): EstadoDemonstracao {
  try {
    const bruto = sessionStorage.getItem(CHAVE)
    if (bruto) memoria = { ...estadoInicial(), ...(JSON.parse(bruto) as Partial<EstadoDemonstracao>) }
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

/** Volta a demonstração ao estado inicial (botão "Reiniciar demonstração"). */
export function reiniciarDemonstracao() {
  gravar(estadoInicial())
}

const novoId = () => globalThis.crypto?.randomUUID?.() ?? `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

async function hashDoConteudo(extracaoId: string, versao: string, itens: SugestaoAlta[], reprovacoes: ReprovacaoRegistrada[]) {
  const canonico = JSON.stringify({
    extracao_id: extracaoId,
    versao_termo: versao,
    itens: itens.map(({ id, categoria, titulo, descricao, trecho_origem }) => ({ id, categoria, titulo, descricao, trecho_origem })),
    reprovacoes: reprovacoes.map(({ id, motivo, automatica }) => ({ id, motivo, automatica })),
  })
  try {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonico))
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  } catch {
    return 'indisponivel-na-demonstracao'
  }
}

const erro = (status: number, codigo: string, mensagem: string) => new ErroApi(codigo, mensagem, status)
const MOTIVO_AUTOMATICO = 'Origem não confirmada no texto original (bloqueio automático do servidor).'

function reprovacoesDe(extracao: ExtracaoAlta): ReprovacaoRegistrada[] {
  return (extracao.decisoes ?? []).filter((d) => d.decisao === 'reprovada').flatMap((d) => {
    const s = extracao.sugestoes.find((item) => item.id === d.id)
    return s ? [{ id: s.id, categoria: s.categoria, titulo: s.titulo, trecho_origem: s.trecho_origem, motivo: d.motivo ?? '', automatica: d.automatica }] : []
  })
}
const PDF_SEM_IA = 'Leitura de PDF pela IA exige a IA configurada no servidor. Na demonstração, use PDFs com texto selecionável ou um sumário da base.'

interface Entrada {
  texto: string
  sumarioId?: string
  sumarioPacienteId?: string
  nomeArquivo?: string
  transcricaoIa: boolean
}

function lerEntrada(dados: NovaExtracao, estado: EstadoDemonstracao): Entrada {
  if (dados.origem === 'base') {
    const sumario = SUMARIOS_DEMONSTRACAO.find((item) => item.id === dados.sumario_id)
    if (!sumario) throw erro(404, 'NAO_ENCONTRADO', 'Sumário de exemplo não encontrado')
    return { texto: sumario.texto, sumarioId: sumario.id, transcricaoIa: false }
  }
  if (dados.origem === 'ficha') {
    const sumario = estado.sumarios.find((item) => item.id === dados.sumario_id && item.paciente_id === dados.paciente_id)
    if (!sumario) throw erro(404, 'NAO_ENCONTRADO', 'Sumário não encontrado na ficha deste paciente')
    return { texto: sumario.texto, sumarioPacienteId: sumario.id, nomeArquivo: sumario.nome_arquivo, transcricaoIa: sumario.transcricao_ia }
  }
  if (dados.origem === 'arquivo') {
    return { texto: dados.texto.trim(), nomeArquivo: dados.nome_arquivo, transcricaoIa: dados.transcricao_ia === true }
  }
  return { texto: dados.texto.trim(), transcricaoIa: false }
}

function resumir(item: ExtracaoAlta, estado: EstadoDemonstracao): ResumoExtracao {
  return {
    id: item.id,
    paciente_id: item.paciente_id,
    paciente_nome: estado.fichas.find((f) => f.id === item.paciente_id)?.nome ?? 'Paciente',
    origem: item.origem ?? 'base',
    titulo: SUMARIOS_DEMONSTRACAO.find((s) => s.id === item.sumario_id)?.titulo
      ?? estado.sumarios.find((s) => s.id === item.sumario_paciente_id)?.titulo
      ?? item.nome_arquivo ?? 'Texto digitado',
    status: item.status,
    total_sugestoes: item.sugestoes.length,
    total_aprovadas: item.itens_aprovados?.length ?? 0,
    criado_em: item.criado_em,
    ...(item.aprovado_em ? { aprovado_em: item.aprovado_em } : {}),
  }
}

export function criarApiAltaDemonstracao(): ApiAlta {
  function buscar(id: string) {
    const extracao = ler().extracoes.find((item) => item.id === id)
    if (!extracao) throw erro(404, 'NAO_ENCONTRADO', 'Extração não encontrada. Reinicie a demonstração e comece de novo.')
    return extracao
  }

  return {
    async listarPacientes() {
      return ler().fichas.map((ficha) => ({ id: ficha.id, nome: ficha.nome, email: ficha.email, role: 'paciente' as const }))
    },
    async listarSumarios() {
      return structuredClone(SUMARIOS_DEMONSTRACAO)
    },
    async listarExtracoes() {
      const estado = ler()
      return estado.extracoes.sort((a, b) => b.criado_em.localeCompare(a.criado_em)).map((item) => resumir(item, estado))
    },
    async criarExtracao(dados) {
      const estado = ler()
      if (!estado.fichas.some((item) => item.id === dados.paciente_id)) throw erro(404, 'NAO_ENCONTRADO', 'Paciente não encontrado')
      const entrada = lerEntrada(dados, estado)
      const sumario = SUMARIOS_DEMONSTRACAO.find((item) => item.texto.trim() === entrada.texto.trim())
      const resposta = sumario ? RESPOSTAS[sumario.id] : undefined
      if (!resposta) {
        throw erro(503, 'SERVICO_INDISPONIVEL', 'Este ambiente está em modo demonstração: escolha um sumário da base. Textos livres exigem a IA configurada.')
      }
      const extracao: ExtracaoAlta = {
        id: novoId(),
        paciente_id: dados.paciente_id,
        profissional_id: PROFISSIONAL_DEMONSTRACAO.id,
        origem: dados.origem,
        ...(entrada.sumarioId ? { sumario_id: entrada.sumarioId } : {}),
        ...(entrada.sumarioPacienteId ? { sumario_paciente_id: entrada.sumarioPacienteId } : {}),
        ...(entrada.nomeArquivo ? { nome_arquivo: entrada.nomeArquivo } : {}),
        ...(entrada.transcricaoIa ? { transcricao_ia: true } : {}),
        texto_original: entrada.texto,
        status: 'pendente',
        sugestoes: resposta.sugestoes.map((item) => ({ ...item, id: novoId(), origem_verificada: origemConfere(item.trecho_origem, entrada.texto) })),
        nao_informado: [...resposta.nao_informado],
        criado_em: new Date().toISOString(),
        ia: { modelo: 'demonstracao', tokens_entrada: 0, tokens_saida: 0, duracao_ms: 0, reparos: 0 },
      }
      gravar({ ...estado, extracoes: [...estado.extracoes, extracao] })
      return structuredClone(extracao)
    },
    async buscarExtracao(id) {
      return structuredClone(buscar(id))
    },
    async termoAceite() {
      return structuredClone(TERMO_DEMONSTRACAO)
    },
    async aprovarExtracao(id, { itens_aprovados, itens_reprovados, sugestoes_editadas, aceite }) {
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
      // Mesma salvaguarda G2 do servidor: toda sugestão não aprovada precisa de motivo.
      const motivos = new Map(itens_reprovados.map((item) => [item.id, item.motivo.trim()]))
      const decisoes: DecisaoSugestao[] = []
      const reprovacoes: ReprovacaoRegistrada[] = []
      const semMotivo: string[] = []
      for (const s of extracao.sugestoes) {
        if (ids.has(s.id)) {
          decisoes.push({ id: s.id, decisao: 'aprovada', automatica: false, editada: edicoes.has(s.id) })
          continue
        }
        const automatica = !s.origem_verificada
        const motivo = motivos.get(s.id) || (automatica ? MOTIVO_AUTOMATICO : '')
        if (motivo.length < 3) { semMotivo.push(s.titulo); continue }
        decisoes.push({ id: s.id, decisao: 'reprovada', motivo, automatica, editada: false })
        reprovacoes.push({ id: s.id, categoria: s.categoria, titulo: s.titulo, trecho_origem: s.trecho_origem, motivo, automatica })
      }
      if (semMotivo.length) throw erro(400, 'DADOS_INVALIDOS', `Informe o motivo da reprovação de: ${semMotivo.join('; ')}.`)

      const agora = new Date().toISOString()
      const registro: RegistroAceite = {
        versao_termo: TERMO_DEMONSTRACAO.versao,
        declaracoes: structuredClone(TERMO_DEMONSTRACAO.declaracoes),
        profissional_id: PROFISSIONAL_DEMONSTRACAO.id,
        profissional_nome: PROFISSIONAL_DEMONSTRACAO.nome,
        registrado_em: agora,
        hash_conteudo: await hashDoConteudo(extracao.id, TERMO_DEMONSTRACAO.versao, itens, reprovacoes),
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
        ...estado,
        planos: [...estado.planos, plano],
        extracoes: estado.extracoes.map((item) =>
          item.id === extracao.id ? { ...item, status: 'aprovado', itens_aprovados: [...ids], decisoes, plano_id: plano.id, aprovado_em: agora } : item,
        ),
      })
      return structuredClone({ ...plano, reprovacoes })
    },
    async planoDaExtracao(id) {
      const extracao = buscar(id)
      const plano = ler().planos.find((item) => item.id === extracao.plano_id)
      if (!plano) throw erro(404, 'NAO_ENCONTRADO', 'Esta extração ainda não tem plano aprovado.')
      return structuredClone({ ...plano, reprovacoes: reprovacoesDe(extracao) })
    },
    async meuPlano() {
      const planos = ler().planos.filter((item) => item.paciente_id === PACIENTE_DEMONSTRACAO.id)
      return planos.length ? structuredClone(planos[planos.length - 1]) : null
    },
    async transcreverPdf() {
      throw erro(503, 'SERVICO_INDISPONIVEL', PDF_SEM_IA)
    },
  }
}

/** Fichário da demonstração, no navegador, com as mesmas validações do servidor. */
export function criarApiPacientesDemonstracao(): ApiPacientes {
  function buscar(id: string) {
    const ficha = ler().fichas.find((item) => item.id === id)
    if (!ficha) throw erro(404, 'NAO_ENCONTRADO', 'Paciente não encontrado')
    return ficha
  }
  const prontuarioEmUso = (numero: string, exceto?: string) =>
    ler().fichas.some((item) => item.numero_prontuario.toUpperCase() === numero.trim().toUpperCase() && item.id !== exceto)

  return {
    async listar(busca) {
      const termo = busca?.trim().toLocaleLowerCase('pt-BR')
      const estado = ler()
      return estado.fichas
        .filter((f) => !termo || f.nome.toLocaleLowerCase('pt-BR').includes(termo) || f.numero_prontuario.toLowerCase().includes(termo))
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
        .map((f): PacienteNaLista => {
          const sumarios = estado.sumarios.filter((s) => s.paciente_id === f.id).sort((a, b) => b.criado_em.localeCompare(a.criado_em))
          return { ...f, total_sumarios: sumarios.length, ...(sumarios[0] ? { ultimo_sumario_em: sumarios[0].criado_em } : {}) }
        })
    },
    async criar(dados) {
      const estado = ler()
      if (estado.fichas.some((item) => item.email.toLowerCase() === dados.email.trim().toLowerCase())) throw erro(409, 'CONFLITO', 'Já existe uma conta com este e-mail.')
      if (prontuarioEmUso(dados.numero_prontuario)) throw erro(409, 'CONFLITO', 'Já existe um paciente com este número de prontuário.')
      const ficha: FichaPaciente = {
        ...dados,
        id: novoId(),
        email: dados.email.trim().toLowerCase(),
        numero_prontuario: dados.numero_prontuario.trim().toUpperCase(),
        criado_em: new Date().toISOString(),
        criado_por: PROFISSIONAL_DEMONSTRACAO.id,
      }
      gravar({ ...estado, fichas: [...estado.fichas, ficha] })
      return { paciente: structuredClone(ficha), senha_provisoria: 'Sem senha na demonstração' }
    },
    async ficha(id) {
      const paciente = buscar(id)
      const estado = ler()
      const sumarios = estado.sumarios
        .filter((s) => s.paciente_id === id)
        .sort((a, b) => b.criado_em.localeCompare(a.criado_em))
        .map(({ texto, ...resto }) => ({ ...resto, caracteres: texto.length }))
      const extracoes = estado.extracoes
        .filter((e) => e.paciente_id === id)
        .sort((a, b) => b.criado_em.localeCompare(a.criado_em))
        .map((e) => resumir(e, estado))
      const planos = estado.planos.filter((p) => p.paciente_id === id)
      return { paciente: structuredClone(paciente), sumarios, extracoes, plano_vigente: planos.length ? structuredClone(planos[planos.length - 1]) : null }
    },
    async atualizar(id, dados) {
      const atual = buscar(id)
      if (dados.numero_prontuario && prontuarioEmUso(dados.numero_prontuario, id)) throw erro(409, 'CONFLITO', 'Já existe um paciente com este número de prontuário.')
      const atualizada: FichaPaciente = { ...atual, ...dados, atualizado_em: new Date().toISOString() }
      if (dados.numero_prontuario) atualizada.numero_prontuario = dados.numero_prontuario.trim().toUpperCase()
      const estado = ler()
      gravar({ ...estado, fichas: estado.fichas.map((f) => (f.id === id ? atualizada : f)) })
      return structuredClone(atualizada)
    },
    async criarSumario(pacienteId, dados) {
      buscar(pacienteId)
      const sumario: SumarioPaciente = {
        id: novoId(),
        paciente_id: pacienteId,
        titulo: dados.titulo,
        origem: dados.origem,
        ...(dados.origem !== 'texto' ? { nome_arquivo: dados.nome_arquivo } : {}),
        texto: dados.texto.trim(),
        transcricao_ia: dados.origem === 'pdf_ia',
        criado_em: new Date().toISOString(),
        criado_por: PROFISSIONAL_DEMONSTRACAO.id,
      }
      const estado = ler()
      gravar({ ...estado, sumarios: [...estado.sumarios, sumario] })
      return structuredClone(sumario)
    },
    async buscarSumario(pacienteId, sumarioId) {
      const sumario = ler().sumarios.find((s) => s.id === sumarioId && s.paciente_id === pacienteId)
      if (!sumario) throw erro(404, 'NAO_ENCONTRADO', 'Sumário não encontrado')
      return structuredClone(sumario)
    },
  }
}
