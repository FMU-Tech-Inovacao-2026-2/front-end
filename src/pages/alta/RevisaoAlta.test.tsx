import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { Rotas } from '../../App'
import { ApiProvider } from '../../api/ApiProvider'
import type { ApiAlta } from '../../api/alta'
import { AuthProvider } from '../../auth/AuthProvider'
import type { ClienteAuth } from '../../auth/tipos'
import { criarApiAltaFalsa, criarApisFalsas, EXTRACAO_TESTE, PLANO_TESTE, TERMO_TESTE } from '../../test/altaFixtures'

function abrir(api: ApiAlta, caminho = '/alta/extracoes/extracao-teste') {
  const auth: ClienteAuth = {
    modoDemonstracao: false,
    entrarComSenha: async () => ({ ok: false, mensagem: '' }),
    entrarDemonstracao: async () => ({ ok: false, mensagem: '' }),
    usuarioAtual: async () => ({ email: 'medica@ficticio.test', perfil: 'profissional', nome: 'Dra. Fictícia' }),
    tokenAtual: async () => 'token',
    sair: async () => undefined,
  }
  render(<AuthProvider cliente={auth}><ApiProvider apis={criarApisFalsas(api)}><MemoryRouter initialEntries={[caminho]}><Rotas /></MemoryRouter></ApiProvider></AuthProvider>)
}

function cartao(titulo: string) {
  return screen.getByRole('article', { name: titulo })
}

beforeEach(() => sessionStorage.clear())

describe('Sugestões e aceite humano', () => {
  test('exige decisão em cada item, permite editar e envia o aceite com todas as declarações', async () => {
    const usuario = userEvent.setup()
    const aprovar = vi.fn(async () => PLANO_TESTE)
    const { api } = criarApiAltaFalsa({ aprovarExtracao: aprovar })
    abrir(api)

    expect(await screen.findByRole('heading', { name: 'Sugestões da IA' })).toBeInTheDocument()
    expect(screen.getAllByText('Trecho de origem')).toHaveLength(4)

    // Sem decidir, não avança.
    await usuario.click(screen.getByRole('button', { name: 'Ir para revisão final' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Decida as 4 sugestões restantes')

    await usuario.click(screen.getByRole('button', { name: 'Aceitar as que têm origem confirmada' }))
    await usuario.click(within(cartao('Manter o curativo limpo e seco')).getByRole('button', { name: 'Reprovar' }))
    // Salvaguarda G2: reprovar sem motivo não avança.
    await usuario.click(screen.getByRole('button', { name: 'Ir para revisão final' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Informe o motivo da reprovação de: Manter o curativo limpo e seco')
    await usuario.click(within(cartao('Manter o curativo limpo e seco')).getByRole('button', { name: 'Item duplicado' }))
    await usuario.click(within(cartao('Furosemida 40 mg')).getByRole('button', { name: 'Editar' }))
    await usuario.clear(screen.getByLabelText('Título'))
    await usuario.type(screen.getByLabelText('Título'), 'Medicamento revisado')
    await usuario.click(screen.getByRole('button', { name: 'Concluir edição' }))
    await usuario.click(screen.getByRole('button', { name: 'Ir para revisão final' }))

    expect(await screen.findByRole('heading', { name: 'Revisão final e aceite profissional' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Itens selecionados (3)' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Medicamento revisado' })).toBeInTheDocument()
    const botao = screen.getByRole('button', { name: 'Aprovar e liberar para o paciente' })
    expect(botao).toBeDisabled()
    await usuario.click(screen.getByRole('checkbox', { name: TERMO_TESTE.declaracoes[0].texto }))
    expect(botao).toBeDisabled()
    await usuario.click(screen.getByRole('checkbox', { name: TERMO_TESTE.declaracoes[1].texto }))
    expect(botao).toBeEnabled()
    await usuario.click(botao)

    expect(await screen.findByText('Aceite registrado')).toBeInTheDocument()
    expect(screen.getByText(PLANO_TESTE.aceite!.hash_conteudo)).toBeInTheDocument()
    expect(aprovar).toHaveBeenCalledWith(EXTRACAO_TESTE.id, {
      itens_aprovados: ['sugestao-teste', 'sugestao-retorno', 'sugestao-alerta'],
      sugestoes_editadas: [{ id: 'sugestao-teste', titulo: 'Medicamento revisado', descricao: 'Via oral pela manhã por 7 dias.' }],
      itens_reprovados: [{ id: 'sugestao-cuidado', motivo: 'Item duplicado' }],
      aceite: { versao_termo: TERMO_TESTE.versao, declaracoes: ['revisao_integral', 'ciente_limitacoes_ia'] },
    })
  })

  test('sugestão sem origem confirmada nasce reprovada e não pode ser aceita', async () => {
    const semOrigem = { ...EXTRACAO_TESTE, sugestoes: [{ ...EXTRACAO_TESTE.sugestoes[0], origem_verificada: false }] }
    const { api } = criarApiAltaFalsa({ buscarExtracao: async () => semOrigem })
    abrir(api)

    expect(await screen.findByText('✕ Origem não confirmada')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aceitar' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Reprovar' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('revisão final aberta sem decisões não aprova nada por padrão', async () => {
    const aprovar = vi.fn(async () => PLANO_TESTE)
    const { api } = criarApiAltaFalsa({ aprovarExtracao: aprovar })
    abrir(api, '/alta/extracoes/extracao-teste/revisao-final')

    expect(await screen.findByText('Nenhuma sugestão aceita nesta revisão')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Aprovar e liberar para o paciente' })).not.toBeInTheDocument()
    expect(aprovar).not.toHaveBeenCalled()
  })

  test('extração já aprovada mostra o comprovante do aceite', async () => {
    const { api } = criarApiAltaFalsa({ buscarExtracao: async () => ({ ...EXTRACAO_TESTE, status: 'aprovado', plano_id: PLANO_TESTE.id }) })
    abrir(api, '/alta/extracoes/extracao-teste/revisao-final')

    expect(await screen.findByRole('heading', { name: 'Comprovante do aceite' })).toBeInTheDocument()
    const comprovante = screen.getByRole('region', { name: 'Comprovante do aceite' })
    expect(within(comprovante).getByText('Dra. Fictícia')).toBeInTheDocument()
    expect(within(comprovante).getByText(TERMO_TESTE.versao)).toBeInTheDocument()
  })
})
