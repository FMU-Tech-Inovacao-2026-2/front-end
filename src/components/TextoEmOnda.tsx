import type { CSSProperties } from 'react'
import { atrasosEmOnda } from './atrasosEmOnda'

interface Props {
  texto: string
  animar: boolean
  /** Atraso antes da primeira palavra, em ms. */
  atrasoInicial?: number
}

/**
 * Revela uma frase palavra por palavra. O leitor de tela recebe a frase
 * inteira de uma vez; as palavras animadas ficam escondidas dele.
 */
export function TextoEmOnda({ texto, animar, atrasoInicial = 0 }: Props) {
  if (!animar) return <>{texto}</>

  const palavras = texto.split(' ')
  const atrasos = atrasosEmOnda(palavras.length, atrasoInicial)

  return (
    <>
      <span className="sr-only">{texto}</span>
      <span aria-hidden="true">
        {palavras.map((palavra, i) => (
          <span key={i}>
            <span className="entrada-palavra" style={{ '--atraso': `${atrasos[i]}ms` } as CSSProperties}>
              {palavra}
            </span>
            {i < palavras.length - 1 ? ' ' : null}
          </span>
        ))}
      </span>
    </>
  )
}
