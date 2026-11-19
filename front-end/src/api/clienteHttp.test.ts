import { afterEach, describe, expect, test, vi } from 'vitest'
import { criarClienteHttp } from './clienteHttp'
import { ErroApi } from './erros'

function responder(status: number, corpo: unknown) {
  return vi.fn(async () => new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } }))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Cliente HTTP da API', () => {
  test('envia o token no cabeçalho e o corpo em JSON', async () => {
    const fetchFalso = responder(200, { id: 'abc' })
    vi.stubGlobal('fetch', fetchFalso)
    const http = criarClienteHttp({ urlBase: 'http://api.teste/', obterToken: async () => 'token-123' })

    const resposta = await http.post<{ id: string }>('/alta/extracoes', { texto: 'x' })

    expect(resposta).toEqual({ id: 'abc' })
    const [url, init] = fetchFalso.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('http://api.teste/alta/extracoes')
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer token-123')
    expect(init.body).toBe('{"texto":"x"}')
  })

  test('erro no formato da API vira ErroApi com código, mensagem e status', async () => {
    vi.stubGlobal('fetch', responder(403, { erro: { codigo: 'sem_permissao', mensagem: 'Seu perfil não tem acesso a esta função.' } }))
    const http = criarClienteHttp({ urlBase: 'http://api.teste', obterToken: async () => 't' })

    const erro = await http.get('/pacientes').catch((e: unknown) => e)

    expect(erro).toBeInstanceOf(ErroApi)
    expect(erro).toMatchObject({ status: 403, codigo: 'sem_permissao', message: 'Seu perfil não tem acesso a esta função.' })
  })

  test('sem conexão com a API, avisa em português', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    const http = criarClienteHttp({ urlBase: 'http://api.teste', obterToken: async () => 't' })

    const erro = await http.get('/pacientes').catch((e: unknown) => e)

    expect(erro).toMatchObject({ codigo: 'sem_conexao', message: 'Não foi possível conectar ao servidor. Verifique sua internet e tente de novo.' })
  })
})
