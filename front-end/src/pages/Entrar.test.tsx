import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, test } from 'vitest'
import { AuthProvider } from '../auth/AuthProvider'
import type { ClienteAuth, Perfil, ResultadoLogin } from '../auth/tipos'
import Entrar from './Entrar'

/** Versão falsa da fronteira com o Supabase: aceita uma conta e recusa o resto. */
function clienteFalso(opcoes: { modoDemonstracao?: boolean; resposta?: ResultadoLogin } = {}): ClienteAuth {
  return {
    modoDemonstracao: opcoes.modoDemonstracao ?? false,
    async entrarComSenha(email, senha) {
      if (opcoes.resposta) return opcoes.resposta
      if (email === 'medica@exemplo.com' && senha === 'senha-certa') {
        return { ok: true, usuario: { email, perfil: 'profissional' } }
      }
      return { ok: false, mensagem: 'E-mail ou senha incorretos.' }
    },
    async entrarDemonstracao(perfil: Perfil) {
      return { ok: true, usuario: { email: `${perfil}@demo.healthia`, perfil } }
    },
    async usuarioAtual() {
      return null
    },
    async tokenAtual() {
      return null
    },
    async sair() {},
  }
}

function abrirTelaDeLogin(cliente: ClienteAuth = clienteFalso()) {
  render(
    <AuthProvider cliente={cliente}>
      <MemoryRouter initialEntries={['/entrar']}>
        <Routes>
          <Route path="/entrar" element={<Entrar />} />
          <Route path="/" element={<h1>Início</h1>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
  return userEvent.setup()
}

describe('Tela de login', () => {
  test('ao entrar com os campos vazios, pede e-mail e senha', async () => {
    const usuario = abrirTelaDeLogin()

    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByLabelText('E-mail')).toHaveAccessibleDescription('Digite seu e-mail.')
    expect(screen.getByLabelText('Senha')).toHaveAccessibleDescription('Digite sua senha.')
  })

  test('leva o foco para o primeiro campo com erro', async () => {
    const usuario = abrirTelaDeLogin()

    await usuario.type(screen.getByLabelText('E-mail'), 'medica@exemplo.com')
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByLabelText('Senha')).toHaveFocus()
  })

  test('com e-mail e senha corretos, entra e abre o início', async () => {
    const usuario = abrirTelaDeLogin()

    await usuario.type(screen.getByLabelText('E-mail'), 'medica@exemplo.com')
    await usuario.type(screen.getByLabelText('Senha'), 'senha-certa')
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('heading', { name: 'Início' })).toBeInTheDocument()
  })

  test('com a senha errada, avisa e continua na tela de login', async () => {
    const usuario = abrirTelaDeLogin()

    await usuario.type(screen.getByLabelText('E-mail'), 'medica@exemplo.com')
    await usuario.type(screen.getByLabelText('Senha'), 'outra-senha')
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.')
  })

  test('conta sem perfil liberado recebe a mensagem do servidor de autenticação', async () => {
    const mensagem = 'Sua conta ainda não tem um perfil liberado. Fale com o administrador da sua unidade.'
    const usuario = abrirTelaDeLogin(clienteFalso({ resposta: { ok: false, mensagem } }))

    await usuario.type(screen.getByLabelText('E-mail'), 'nova@exemplo.com')
    await usuario.type(screen.getByLabelText('Senha'), 'qualquer')
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(mensagem)
  })

  test('o botão Mostrar exibe a senha digitada', async () => {
    const usuario = abrirTelaDeLogin()
    await usuario.type(screen.getByLabelText('Senha'), 'senha-certa')

    await usuario.click(screen.getByRole('button', { name: 'Mostrar senha' }))

    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Mostrar senha' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('fora do modo de demonstração, não há acessos de demonstração', () => {
    abrirTelaDeLogin(clienteFalso({ modoDemonstracao: false }))

    expect(screen.queryByRole('button', { name: /demonstração/i })).not.toBeInTheDocument()
  })

  test('a animação de entrada roda só na primeira vez da sessão', () => {
    sessionStorage.clear()
    abrirTelaDeLogin()
    expect(document.querySelector('[data-entrada="animada"]')).not.toBeNull()
    cleanup()

    abrirTelaDeLogin()
    expect(document.querySelector('[data-entrada="animada"]')).toBeNull()
  })

  test('no modo de demonstração, entra como paciente com um clique', async () => {
    const usuario = abrirTelaDeLogin(clienteFalso({ modoDemonstracao: true }))

    await usuario.click(screen.getByRole('button', { name: 'Paciente (demonstração)' }))

    expect(await screen.findByRole('heading', { name: 'Início' })).toBeInTheDocument()
  })
})
