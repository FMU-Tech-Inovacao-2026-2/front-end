/**
 * Atraso de cada palavra, em ms. Os intervalos começam em 70 ms e ficam ~15%
 * menores a cada palavra (mínimo de 20 ms): a frase entra como uma onda, não
 * no ritmo fixo de um metrônomo.
 */
export function atrasosEmOnda(quantidade: number, inicial = 0): number[] {
  const atrasos: number[] = []
  let atual = inicial
  for (let i = 0; i < quantidade; i++) {
    atrasos.push(atual)
    atual += Math.max(20, Math.round(70 * 0.85 ** i))
  }
  return atrasos
}
