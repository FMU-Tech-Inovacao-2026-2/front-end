import { useEffect, useState } from 'react'

/**
 * true só na primeira vez que a tela aparece na sessão do navegador.
 * Quem sai e volta ao login não precisa assistir à entrada de novo.
 */
export function useEntradaUmaVez(chave: string): boolean {
  const chaveCompleta = `healthia:entrada-vista:${chave}`
  const [animar] = useState(() => {
    try {
      return sessionStorage.getItem(chaveCompleta) !== '1'
    } catch {
      return true
    }
  })

  // Grava depois de montar: a leitura acima continua pura (StrictMode chama o inicializador duas vezes).
  useEffect(() => {
    try {
      sessionStorage.setItem(chaveCompleta, '1')
    } catch {
      // Sem armazenamento: a entrada roda a cada carregamento, sem prejuízo.
    }
  }, [chaveCompleta])

  return animar
}
