import type { ClienteAuth } from '../auth/tipos'
import { urlDaApi } from '../config'
import { criarApiAlta } from './alta'
import type { Apis } from './ApiProvider'
import { criarClienteHttp } from './clienteHttp'
import { criarApiAltaDemonstracao } from './demonstracao'

/** Demonstração: tudo no navegador, sem rede. Demais modos: API Node.js + Express. */
export function criarApis(cliente: ClienteAuth): Apis {
  if (cliente.modoDemonstracao) return { alta: criarApiAltaDemonstracao() }

  const http = criarClienteHttp({ urlBase: urlDaApi(), obterToken: () => cliente.tokenAtual() })
  return { alta: criarApiAlta(http) }
}
