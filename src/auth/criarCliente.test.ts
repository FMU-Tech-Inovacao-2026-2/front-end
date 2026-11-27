import { describe, expect, test } from 'vitest'
import { determinarModoAuth } from './criarCliente'

describe('seleção do modo de autenticação', () => {
  test('prioriza o back-end quando as flags de back-end e demo estão ativas', () => {
    expect(determinarModoAuth({ VITE_MODO_BACKEND: 'true', VITE_MODO_DEMONSTRACAO: 'true' })).toBe('backend')
  })

  test('usa demo local se backend estiver desligado', () => {
    expect(determinarModoAuth({ VITE_MODO_BACKEND: 'false', VITE_MODO_DEMONSTRACAO: 'true' })).toBe('demonstracao')
  })
})
