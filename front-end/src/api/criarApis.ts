import type { ClienteAuth } from '../auth/tipos'
import { criarApiAlta } from './alta'
import type { Apis } from './ApiProvider'
import { criarClienteHttp } from './clienteHttp'
import { criarApiAltaDemonstracao } from './demonstracao'

/** Escolhe as APIs pelo .env: fictícias no modo de demonstração, o back-end de verdade fora dele. */
export function criarApis(cliente: ClienteAuth): Apis {
  if (cliente.modoDemonstracao) return { alta: criarApiAltaDemonstracao() }

  const urlBase = import.meta.env.VITE_API_URL?.trim()
  if (!urlBase) {
    throw new Error('Falta VITE_API_URL no .env (endereço do back-end, por exemplo http://localhost:8000).')
  }
  const http = criarClienteHttp({ urlBase, obterToken: () => cliente.tokenAtual() })
  return { alta: criarApiAlta(http) }
}
