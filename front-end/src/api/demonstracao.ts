import type { ApiAlta, Paciente } from './alta'

/** Pacientes fictícios para a apresentação. Nenhum dado real. */
export const PACIENTES_DEMONSTRACAO: Paciente[] = [
  { id: '0b6f2c1e-4f7a-4c3e-9a1d-2e5b8c7d6a01', nome: 'Paciente fictício A (PAC-0042)', email: 'paciente.a@demo.healthia' },
  { id: '7c9d1e2f-3a4b-4c5d-8e6f-9a0b1c2d3e02', nome: 'Paciente fictício B (PAC-0057)', email: 'paciente.b@demo.healthia' },
  { id: 'e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a03', nome: 'Paciente fictício C (PAC-0063)', email: 'paciente.c@demo.healthia' },
]

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms))

/** API falsa usada com VITE_MODO_DEMONSTRACAO=true, enquanto o back-end não está pronto. */
export function criarApiAltaDemonstracao(atrasoMs = 800): ApiAlta {
  let contador = 0
  return {
    async listarPacientes() {
      await esperar(150)
      return PACIENTES_DEMONSTRACAO
    },
    async criarExtracao() {
      await esperar(atrasoMs)
      contador += 1
      return { id: `demonstracao-${contador}`, status: 'pendente' }
    },
  }
}
