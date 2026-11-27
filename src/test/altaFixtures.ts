import type { ApiAlta, ExtracaoAlta, Paciente, PlanoAlta, SumarioBase, TermoAceite } from '../api/alta'

export const PACIENTE_TESTE: Paciente = { id: 'u-002', nome: 'Paciente Fictício', email: 'paciente@demo.healthia', role: 'paciente' }
export const SUMARIO_TESTE: SumarioBase = {
  id: 'sumario-teste',
  titulo: 'Sumário fictício de teste',
  descricao: 'Massa inventada para testes automatizados.',
  texto: 'Furosemida 40 mg por via oral pela manhã, durante 7 dias. Cuidados: manter o curativo limpo e seco até avaliação da equipe. Retorno: consulta em 7 dias. Sinais de alerta: procurar atendimento diante de piora.',
}
export const EXTRACAO_TESTE: ExtracaoAlta = {
  id: 'extracao-teste',
  paciente_id: PACIENTE_TESTE.id,
  profissional_id: 'u-001',
  texto_original: SUMARIO_TESTE.texto,
  status: 'pendente',
  sugestoes: [{
    id: 'sugestao-teste', categoria: 'medicamento', titulo: 'Furosemida 40 mg',
    descricao: 'Via oral pela manhã por 7 dias.', trecho_origem: 'Furosemida 40 mg por via oral pela manhã, durante 7 dias.', origem_verificada: true,
  }, {
    id: 'sugestao-cuidado', categoria: 'cuidado', titulo: 'Manter o curativo limpo e seco',
    descricao: 'Manter até avaliação da equipe.', trecho_origem: 'manter o curativo limpo e seco até avaliação da equipe.', origem_verificada: true,
  }, {
    id: 'sugestao-retorno', categoria: 'retorno', titulo: 'Consulta de retorno',
    descricao: 'Consulta em 7 dias.', trecho_origem: 'consulta em 7 dias.', origem_verificada: true,
  }, {
    id: 'sugestao-alerta', categoria: 'alerta', titulo: 'Sinal de alerta',
    descricao: 'Procurar atendimento diante de piora.', trecho_origem: 'procurar atendimento diante de piora.', origem_verificada: true,
  }],
  nao_informado: ['Horário exato'],
  criado_em: '2026-11-27T12:00:00.000Z',
}
export const TERMO_TESTE: TermoAceite = {
  versao: 'teste-v1',
  titulo: 'Termo de aceite profissional',
  resumo: 'Resumo fictício do termo.',
  declaracoes: [
    { id: 'revisao_integral', texto: 'Revisei cada item aprovado.' },
    { id: 'ciente_limitacoes_ia', texto: 'Estou ciente de que a IA pode errar.' },
  ],
}
export const PLANO_TESTE: PlanoAlta = {
  id: 'plano-teste', paciente_id: PACIENTE_TESTE.id, profissional_id: 'u-001',
  extracao_id: EXTRACAO_TESTE.id, itens: EXTRACAO_TESTE.sugestoes, criado_em: '2026-11-27T12:00:00.000Z',
  aceite: {
    versao_termo: TERMO_TESTE.versao,
    declaracoes: TERMO_TESTE.declaracoes,
    profissional_id: 'u-001',
    profissional_nome: 'Dra. Fictícia',
    registrado_em: '2026-11-27T12:00:00.000Z',
    hash_conteudo: 'a'.repeat(64),
  },
}

export function criarApiAltaFalsa(overrides: Partial<ApiAlta> = {}) {
  const chamadas: Parameters<ApiAlta['criarExtracao']>[0][] = []
  const api: ApiAlta = {
    listarPacientes: async () => [PACIENTE_TESTE],
    listarSumarios: async () => [SUMARIO_TESTE],
    listarExtracoes: async () => [],
    criarExtracao: async (dados) => { chamadas.push(dados); return EXTRACAO_TESTE },
    buscarExtracao: async () => EXTRACAO_TESTE,
    termoAceite: async () => TERMO_TESTE,
    aprovarExtracao: async () => PLANO_TESTE,
    planoDaExtracao: async () => PLANO_TESTE,
    meuPlano: async () => PLANO_TESTE,
    ...overrides,
  }
  return { api, chamadas }
}
