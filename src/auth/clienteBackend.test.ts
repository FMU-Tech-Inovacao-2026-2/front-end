import { afterEach, describe, expect, test, vi } from 'vitest'
import { criarClienteBackend } from './clienteBackend'

afterEach(() => {
  vi.unstubAllGlobals()
  sessionStorage.clear()
})

describe('Autenticação pelo back-end local', () => {
  test('faz login, guarda JWT de sessão e valida o perfil em /auth/me', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: 'jwt-ficticio', user: { id: 'u-001', nome: 'Dra. Demo', email: 'medica@demo.test', role: 'profissional' } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ user: { id: 'u-001', nome: 'Dra. Demo', email: 'medica@demo.test', role: 'profissional' } }), { status: 200 }))
    vi.stubGlobal('fetch', fetch)
    const cliente = criarClienteBackend('http://localhost:3000/')

    const login = await cliente.entrarComSenha('medica@demo.test', 'senha-ficticia')
    expect(login).toEqual({ ok: true, usuario: { email: 'medica@demo.test', nome: 'Dra. Demo', perfil: 'profissional' } })
    expect(await cliente.tokenAtual()).toBe('jwt-ficticio')
    expect(await cliente.usuarioAtual()).toEqual({ email: 'medica@demo.test', nome: 'Dra. Demo', perfil: 'profissional' })
    expect(new Headers(fetch.mock.calls[1][1]?.headers).get('Authorization')).toBe('Bearer jwt-ficticio')
  })

  test('remove a sessão quando o back-end rejeita um JWT expirado', async () => {
    sessionStorage.setItem('healthia:api:sessao', JSON.stringify({ accessToken: 'jwt-expirado', usuario: { email: 'p@teste', perfil: 'paciente' } }))
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 401 })))
    const cliente = criarClienteBackend('http://localhost:3000')

    expect(await cliente.usuarioAtual()).toBeNull()
    expect(await cliente.tokenAtual()).toBeNull()
  })
})
