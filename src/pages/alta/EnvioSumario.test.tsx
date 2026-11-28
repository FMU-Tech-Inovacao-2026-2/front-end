import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { Rotas } from '../../App'
import { ApiProvider } from '../../api/ApiProvider'
import type { ApiAlta } from '../../api/alta'
import { criarApiAltaDemonstracao } from '../../api/demonstracao'
import { AuthProvider } from '../../auth/AuthProvider'
import type { ClienteAuth, Perfil } from '../../auth/tipos'
import { criarApiAltaFalsa, criarApisFalsas, PACIENTE_TESTE } from '../../test/altaFixtures'

function loginFalso(perfil: Perfil, modoDemonstracao = false): ClienteAuth {
  return {
    modoDemonstracao,
    entrarComSenha: async () => ({ ok: false, mensagem: 'não usado' }),
    entrarDemonstracao: async () => ({ ok: false, mensagem: 'não usado' }),
    usuarioAtual: async () => ({ email: `${perfil}@exemplo.test`, perfil }),
    tokenAtual: async () => 'token-teste',
    sair: async () => undefined,
  }
}

function abrir(api: ApiAlta, { perfil = 'profissional', demo = false, caminho = '/alta/novo' }: { perfil?: Perfil; demo?: boolean; caminho?: string } = {}) {
  const usuario = userEvent.setup()
  render(
    <AuthProvider cliente={loginFalso(perfil, demo)}>
      <ApiProvider apis={criarApisFalsas(api)}>
        <MemoryRouter initialEntries={[caminho]}><Rotas /></MemoryRouter>
      </ApiProvider>
    </AuthProvider>,
  )
  return usuario
}

afterEach(() => vi.unstubAllGlobals())

describe('Entrada do Alta Assistida', () => {
  test('oferece sumário da base, importação de arquivo e texto digitado', async () => {
    const { api } = criarApiAltaFalsa()
    abrir(api)

    expect(await screen.findByLabelText('Sumários fictícios disponíveis')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Importar arquivo/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Digitar texto/ })).toBeInTheDocument()
  })

  test('envia da base ao back-end e abre a etapa de sugestões da IA', async () => {
    const { api, chamadas } = criarApiAltaFalsa()
    const usuario = abrir(api)

    await usuario.click(await screen.findByRole('button', { name: 'Extrair com IA' }))

    expect(await screen.findByRole('heading', { name: 'Sugestões da IA' })).toBeInTheDocument()
    expect(screen.getByText('Furosemida 40 mg')).toBeInTheDocument()
    expect(chamadas).toEqual([{ origem: 'base', paciente_id: PACIENTE_TESTE.id, sumario_id: 'sumario-teste' }])
  })

  test('lê arquivo TXT e envia seu texto como entrada de arquivo', async () => {
    const { api, chamadas } = criarApiAltaFalsa()
    const usuario = abrir(api)
    const arquivo = new File(['Sumário fictício importado'], 'alta-ficticia.txt', { type: 'text/plain' })

    await usuario.click(await screen.findByRole('radio', { name: /Importar arquivo/ }))
    await usuario.upload(screen.getByLabelText('Arquivo do sumário (.txt ou PDF)'), arquivo)
    expect(await screen.findByText('Arquivo lido: alta-ficticia.txt')).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Extrair com IA' }))

    expect(await screen.findByRole('heading', { name: 'Sugestões da IA' })).toBeInTheDocument()
    expect(chamadas).toEqual([{ origem: 'arquivo', paciente_id: PACIENTE_TESTE.id, nome_arquivo: 'alta-ficticia.txt', texto: 'Sumário fictício importado' }])
  })

  test('texto vazio no modo API não chama o back-end', async () => {
    const { api, chamadas } = criarApiAltaFalsa()
    const usuario = abrir(api)
    await usuario.click(await screen.findByRole('radio', { name: /Digitar texto/ }))
    await usuario.click(screen.getByRole('button', { name: 'Extrair com IA' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Digite o texto do sumário.')
    expect(chamadas).toHaveLength(0)
  })

  test('texto digitado é enviado como texto e não é modificado', async () => {
    const { api, chamadas } = criarApiAltaFalsa()
    const usuario = abrir(api)
    await usuario.click(await screen.findByRole('radio', { name: /Digitar texto/ }))
    await usuario.type(screen.getByLabelText('Texto do sumário de alta'), '  Sumário fictício colado.  ')
    await usuario.click(screen.getByRole('button', { name: 'Extrair com IA' }))

    expect(await screen.findByRole('heading', { name: 'Sugestões da IA' })).toBeInTheDocument()
    expect(chamadas).toEqual([{ origem: 'texto', paciente_id: PACIENTE_TESTE.id, texto: 'Sumário fictício colado.' }])
  })

  test('demonstração percorre o fluxo completo com as mesmas travas do servidor e sem fetch', async () => {
    sessionStorage.clear()
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const apiDemo = criarApiAltaDemonstracao()
    const usuario = abrir(apiDemo, { demo: true })

    expect(await screen.findByText('Demonstração guiada')).toBeInTheDocument()
    await usuario.click(await screen.findByRole('button', { name: 'Gerar sugestões' }))
    expect(await screen.findByRole('heading', { name: 'Sugestões da IA' })).toBeInTheDocument()

    // O erro proposital da IA aparece bloqueado.
    expect(screen.getByText('1 sugestão tem citação que não existe no sumário')).toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'Enalapril 10 mg à noite' })).toHaveTextContent('Origem não confirmada')
    await usuario.click(screen.getByRole('button', { name: 'Aceitar as que têm origem confirmada' }))
    await usuario.click(screen.getByRole('button', { name: 'Ir para revisão final' }))

    expect(await screen.findByRole('heading', { name: 'Revisão final e aceite profissional' })).toBeInTheDocument()
    for (const caixa of screen.getAllByRole('checkbox')) await usuario.click(caixa)
    await usuario.click(screen.getByRole('button', { name: 'Aprovar e liberar para o paciente' }))

    expect(await screen.findByRole('heading', { name: 'Plano aprovado' })).toBeInTheDocument()
    const plano = await apiDemo.meuPlano()
    expect(plano?.itens).toHaveLength(5)
    expect(plano?.itens.every((item) => item.origem_verificada)).toBe(true)
    expect(plano?.aceite?.declaracoes).toHaveLength(4)
    expect(fetch).not.toHaveBeenCalled()
  })

  test('demonstração recusa texto livre como o servidor sem IA configurada', async () => {
    sessionStorage.clear()
    const usuario = abrir(criarApiAltaDemonstracao(), { demo: true })
    await usuario.click(await screen.findByRole('radio', { name: /Digitar texto/ }))
    await usuario.type(screen.getByLabelText('Texto do sumário de alta'), 'Texto fictício qualquer.')
    await usuario.click(screen.getByRole('button', { name: 'Gerar sugestões' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('escolha um sumário da base')
  })
})
