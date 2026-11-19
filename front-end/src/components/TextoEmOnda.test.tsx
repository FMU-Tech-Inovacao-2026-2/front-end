import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, test } from 'vitest'
import { atrasosEmOnda } from './atrasosEmOnda'
import { TextoEmOnda } from './TextoEmOnda'

describe('Texto em onda', () => {
  beforeEach(() => sessionStorage.clear())

  test('o leitor de tela recebe a frase inteira, não palavras soltas', () => {
    render(<p><TextoEmOnda texto="Informação clínica organizada." animar /></p>)

    expect(screen.getByText('Informação clínica organizada.', { selector: 'span' })).toBeInTheDocument()
  })

  test('os intervalos entre palavras diminuem, para ler como onda e não como metrônomo', () => {
    // Intervalos 70, 60, 51 e 43 ms: cada um ~15% menor que o anterior.
    expect(atrasosEmOnda(5)).toEqual([0, 70, 130, 181, 224])
  })
})
