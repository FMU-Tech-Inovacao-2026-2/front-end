import type { ClienteAuth } from '../auth/tipos'
import { urlDaApi } from '../config'
import { criarApiAlta } from './alta'
import type { Apis } from './ApiProvider'
import { criarClienteHttp } from './clienteHttp'
import { criarApiAltaDemonstracao, criarApiPacientesDemonstracao } from './demonstracao'
import { criarApiPacientes } from './pacientes'

/** Demonstração: tudo no navegador, sem rede. Demais modos: API Node.js + Express. */
export function criarApis(cliente: ClienteAuth): Apis {
  if (cliente.modoDemonstracao) return { alta: criarApiAltaDemonstracao(), pacientes: criarApiPacientesDemonstracao() }

  const http = criarClienteHttp({ urlBase: urlDaApi(), obterToken: () => cliente.tokenAtual() })
  return { alta: criarApiAlta(http), pacientes: criarApiPacientes(http) }
}
