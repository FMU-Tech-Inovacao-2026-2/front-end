import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, test } from 'vitest'
import { Rotas } from '../../App'
import type { ApiAlta, NovaExtracao } from '../../api/alta'
import { ApiProvider } from '../../api/ApiProvider'
import { ErroApi } from '../../api/erros'
import { AuthProvider } from '../../auth/AuthProvider'
import type { ClienteAuth, Perfil } from '../../auth/tipos'

const PACIENTE_A = { id: '11111111-1111-4111-8111-111111111111', nome: 'Paciente fictício A', email: 'a@demo' }

/** Login falso já entrado com o perfil pedido. */
function loginFalso(perfil: Perfil): ClienteAuth & { saiu: boolean } {
  let logado = true
  const cliente = {
    saiu: false,
    modoDemonstracao: false,
    entrarComSenha: async () => ({ ok: false as const, mensagem: 'não usado' }),
    entrarDemonstracao: async () => ({ ok: false as const, mensagem: 'não usado' }),
    usuarioAtual: async () => (logado ? { email: `${perfil}@exemplo.com`, perfil } : null),
    tokenAtual: async () => (logado ? 'token' : null),
    sair: async () => {
      logado = false
      cliente.saiu = true
    },
  }
  return cliente
}

/** API falsa: guarda o que recebeu e responde o que o teste mandar. */
function apiFalsa(resposta: () => Promise<{ id: string; status: 'pendente' }> = async () => ({ id: 'ext-1', status: 'pendente' })) {
  const chamadas: NovaExtracao[] = []
  const api: ApiAlta = {
    listarPacientes: async () => [PACIENTE_A],
    criarExtracao: async (dados) => {
      chamadas.push(dados)
      return resposta()
    },
  }
  return { api, chamadas }
}

function abrir(caminho: string, perfil: Perfil = 'profissional', api: ApiAlta = apiFalsa().api) {
  const login = loginFalso(perfil)
  render(
    <AuthProvider cliente={login}>
      <ApiProvider apis={{ alta: api }}>
        <MemoryRouter initialEntries={[caminho]}>
          <Rotas />
        </MemoryRouter>
      </ApiProvider>
    </AuthProvider>,
  )
  return { usuario: userEvent.setup(), login }
}

describe('Envio do sumário de alta', () => {
  test('enviar vazio mostra os erros de paciente e de texto e leva o foco ao primeiro', async () => {
    const { usuario } = abrir('/alta/novo')

    await usuario.click(await screen.findByRole('button', { name: 'Extrair plano' }))

    expect(screen.getByLabelText('Paciente')).toHaveAccessibleDescription('Escolha o paciente.')
    expect(screen.getByLabelText('Texto do sumário de alta')).toHaveAccessibleDescription(
      expect.stringContaining('Cole o texto do sumário de alta.'),
    )
    expect(screen.getByLabelText('Paciente')).toHaveFocus()
  })

  test('texto só com espaços é recusado e não chama a API', async () => {
    const { api, chamadas } = apiFalsa()
    const { usuario } = abrir('/alta/novo', 'profissional', api)

    await usuario.selectOptions(await screen.findByLabelText('Paciente'), await screen.findByRole('option', { name: 'Paciente fictício A' }))
    await usuario.type(screen.getByLabelText('Texto do sumário de alta'), '     ')
    await usuario.click(screen.getByRole('button', { name: 'Extrair plano' }))

    expect(screen.getByLabelText('Texto do sumário de alta')).toHaveFocus()
    expect(screen.getByLabelText('Texto do sumário de alta')).toHaveAccessibleDescription(
      expect.stringContaining('Cole o texto do sumário de alta.'),
    )
    expect(chamadas).toHaveLength(0)
  })

  test('envio válido manda o texto sem espaços nas pontas e abre a extração', async () => {
    const { api, chamadas } = apiFalsa()
    const { usuario } = abrir('/alta/novo', 'profissional', api)

    await usuario.selectOptions(await screen.findByLabelText('Paciente'), await screen.findByRole('option', { name: 'Paciente fictício A' }))
    await usuario.type(screen.getByLabelText('Texto do sumário de alta'), '  Furosemida 40 mg VO 1x/dia.  ')
    await usuario.click(screen.getByRole('button', { name: 'Extrair plano' }))

    expect(await screen.findByRole('heading', { name: 'Revisão: próxima tarefa' })).toBeInTheDocument()
    expect(chamadas).toEqual([{ paciente_id: PACIENTE_A.id, texto: 'Furosemida 40 mg VO 1x/dia.' }])
  })

  async function preencherEEnviar(usuario: ReturnType<typeof userEvent.setup>) {
    await usuario.selectOptions(await screen.findByLabelText('Paciente'), await screen.findByRole('option', { name: 'Paciente fictício A' }))
    await usuario.type(screen.getByLabelText('Texto do sumário de alta'), 'Sumário fictício')
    await usuario.click(screen.getByRole('button', { name: 'Extrair plano' }))
  }

  test('erro da API mostra a mensagem recebida e deixa tentar de novo', async () => {
    const { api } = apiFalsa(async () => {
      throw new ErroApi('ia_indisponivel', 'A IA não respondeu. Tente de novo em instantes.', 502)
    })
    const { usuario } = abrir('/alta/novo', 'profissional', api)

    await preencherEEnviar(usuario)

    expect(await screen.findByRole('alert')).toHaveTextContent('A IA não respondeu. Tente de novo em instantes.')
    expect(screen.getByRole('button', { name: 'Extrair plano' })).toBeEnabled()
  })

  test('resposta 401 encerra a sessão e leva para o login', async () => {
    const { api } = apiFalsa(async () => {
      throw new ErroApi('sessao_expirada', 'Sua sessão expirou. Entre de novo.', 401)
    })
    const { usuario, login } = abrir('/alta/novo', 'profissional', api)

    await preencherEEnviar(usuario)

    expect(await screen.findByRole('heading', { name: 'Entrar na HealthIA' })).toBeInTheDocument()
    expect(login.saiu).toBe(true)
  })

  test('se a lista de pacientes não carregar, avisa e oferece tentar de novo', async () => {
    let tentativas = 0
    const api: ApiAlta = {
      listarPacientes: async () => {
        tentativas += 1
        if (tentativas === 1) throw new ErroApi('nao_encontrado', 'Recurso não encontrado.', 404)
        return [PACIENTE_A]
      },
      criarExtracao: async () => ({ id: 'ext-1', status: 'pendente' }),
    }
    const { usuario } = abrir('/alta/novo', 'profissional', api)

    expect(await screen.findByText('Não foi possível carregar a lista de pacientes.')).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Tentar de novo' }))

    expect(await screen.findByRole('option', { name: 'Paciente fictício A' })).toBeInTheDocument()
  })

  test('paciente logado não acessa a tela de envio', async () => {
    abrir('/alta/novo', 'paciente')

    expect(await screen.findByRole('heading', { name: 'Seu perfil não tem acesso a esta função' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Extrair plano' })).not.toBeInTheDocument()
  })
})
