import { describe, expect, test } from 'vitest'
import { urlBaseSupabase } from './urlSupabase'

describe('URL do Supabase', () => {
  test('aceita a URL da API REST copiada do painel e devolve só a base', () => {
    expect(urlBaseSupabase('https://etjszvlkdpedcyqckqjs.supabase.co/rest/v1/')).toBe(
      'https://etjszvlkdpedcyqckqjs.supabase.co',
    )
  })

  test('tira a barra do final', () => {
    expect(urlBaseSupabase('https://etjszvlkdpedcyqckqjs.supabase.co/')).toBe('https://etjszvlkdpedcyqckqjs.supabase.co')
  })

  test('recusa um endereço que não é URL', () => {
    expect(() => urlBaseSupabase('etjszvlkdpedcyqckqjs')).toThrow('VITE_SUPABASE_URL')
  })
})
