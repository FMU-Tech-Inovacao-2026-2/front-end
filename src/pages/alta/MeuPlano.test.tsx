import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, test } from 'vitest'
import { Rotas } from '../../App'
import { ApiProvider } from '../../api/ApiProvider'
import type { ApiAlta } from '../../api/alta'
import { AuthProvider } from '../../auth/AuthProvider'
import type { ClienteAuth } from '../../auth/tipos'
import { criarApiAltaFalsa } from '../../test/altaFixtures'

function abrir(api: ApiAlta) {
  const auth: ClienteAuth = {
    modoDemonstracao: false,
    entrarComSenha: async () => ({ ok: false, mensagem: '' }),
    entrarDemonstracao: async () => ({ ok: false, mensagem: '' }),
    usuarioAtual: async () => ({ email: 'paciente@ficticio.test', perfil: 'paciente' }),
    tokenAtual: async () => 'token-paciente',
    sair: async () => undefined,
  }
  render(<AuthProvider cliente={auth}><ApiProvider apis={{ alta: api }}><MemoryRouter initialEntries={['/alta/meu-plano']}><Rotas /></MemoryRouter></ApiProvider></AuthProvider>)
}

describe('Plano de cuidados do paciente', () => {
  test('mostra somente o plano devolvido para a conta autenticada e sua fonte', async () => {
    const { api } = criarApiAltaFalsa()
    abrir(api)
    expect(await screen.findByRole('heading', { name: 'Meu plano de cuidados' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Furosemida 40 mg' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Medicamentos' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Cuidados e retornos' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Avisos importantes' })).toBeInTheDocument()
    expect(screen.getAllByText('De onde veio esta informação?', { selector: 'summary' })).toHaveLength(4)
  })

  test('informa quando ainda não há plano aprovado', async () => {
    const { api } = criarApiAltaFalsa({ meuPlano: async () => null })
    abrir(api)
    expect(await screen.findByRole('heading', { name: 'Ainda não há um plano aprovado' })).toBeInTheDocument()
  })
})
