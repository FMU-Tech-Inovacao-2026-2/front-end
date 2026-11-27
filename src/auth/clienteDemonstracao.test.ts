import { beforeEach, describe, expect, test } from 'vitest'
import { criarClienteDemonstracao } from './clienteDemonstracao'

describe('autenticação local de demonstração', () => {
  beforeEach(() => sessionStorage.clear())

  test('aceita a conta profissional da API como identidade simulada sem validar a senha ou chamar o back-end', async () => {
    const cliente = criarClienteDemonstracao()
    const resultado = await cliente.entrarComSenha('medica@demo.altaassistida.dev', 'senha-qualquer')

    expect(resultado).toMatchObject({ ok: true, usuario: { perfil: 'profissional' } })
    expect(cliente.modoDemonstracao).toBe(true)
    expect(await cliente.tokenAtual()).toBe('demonstracao-profissional')
  })

  test('abre o perfil paciente local quando o e-mail identifica paciente', async () => {
    const cliente = criarClienteDemonstracao()
    const resultado = await cliente.entrarComSenha('paciente@demo.altaassistida.dev', '')
    expect(resultado).toMatchObject({ ok: true, usuario: { perfil: 'paciente' } })
  })
})
