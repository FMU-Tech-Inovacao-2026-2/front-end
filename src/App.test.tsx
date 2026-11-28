import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, test } from 'vitest'
import { Rotas } from './App'
import { ApiProvider } from './api/ApiProvider'
import { criarApiAltaDemonstracao, criarApiPacientesDemonstracao } from './api/demonstracao'
import { AuthProvider } from './auth/AuthProvider'
import { criarClienteDemonstracao } from './auth/clienteDemonstracao'

function abrirApp(caminho: string) {
  render(
    <AuthProvider cliente={criarClienteDemonstracao()}>
      <ApiProvider apis={{ alta: criarApiAltaDemonstracao(), pacientes: criarApiPacientesDemonstracao() }}>
        <MemoryRouter initialEntries={[caminho]}>
          <Rotas />
        </MemoryRouter>
      </ApiProvider>
    </AuthProvider>,
  )
  return userEvent.setup()
}

describe('Acesso às telas', () => {
  test('sem login, o início leva para a tela de login', async () => {
    sessionStorage.clear()
    abrirApp('/')

    expect(await screen.findByRole('heading', { name: 'Entrar na HealthIA' })).toBeInTheDocument()
  })

  test('o profissional abre o Alta Assistida pelo início', async () => {
    sessionStorage.clear()
    const usuario = abrirApp('/entrar')

    await usuario.click(await screen.findByRole('button', { name: 'Profissional de saúde (demonstração)' }))

    expect(await screen.findByRole('link', { name: /Alta Assistida/ })).toHaveAttribute('href', '/alta/novo')
  })

  test('o paciente vê só o próprio plano e consegue sair', async () => {
    sessionStorage.clear()
    const usuario = abrirApp('/entrar')

    await usuario.click(await screen.findByRole('button', { name: 'Paciente (demonstração)' }))
    expect(await screen.findByRole('heading', { name: 'Meu plano de cuidados' })).toBeInTheDocument()
    expect(screen.queryByText('Prescrição Assistida')).not.toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Sair' }))
    expect(await screen.findByRole('heading', { name: 'Entrar na HealthIA' })).toBeInTheDocument()
  })
})
