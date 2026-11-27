import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { ClienteAuth, Perfil, ResultadoLogin, Usuario } from './tipos'

interface ValorAuth {
  usuario: Usuario | null
  carregando: boolean
  modoDemonstracao: boolean
  entrarComSenha(email: string, senha: string): Promise<ResultadoLogin>
  entrarDemonstracao(perfil: Perfil): Promise<ResultadoLogin>
  tokenAtual(): Promise<string | null>
  sair(): Promise<void>
}

const ContextoAuth = createContext<ValorAuth | null>(null)

export function AuthProvider({ cliente, children }: { cliente: ClienteAuth; children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(true)

  // Sincroniza com um sistema externo (a sessão salva): é o uso certo de um efeito.
  useEffect(() => {
    let ignorar = false
    cliente.usuarioAtual().then((atual) => {
      if (ignorar) return
      setUsuario(atual)
      setCarregando(false)
    })
    return () => {
      ignorar = true
    }
  }, [cliente])

  async function aplicar(resultado: ResultadoLogin) {
    if (resultado.ok) setUsuario(resultado.usuario)
    return resultado
  }

  const valor: ValorAuth = {
    usuario,
    carregando,
    modoDemonstracao: cliente.modoDemonstracao,
    entrarComSenha: async (email, senha) => aplicar(await cliente.entrarComSenha(email, senha)),
    entrarDemonstracao: async (perfil) => aplicar(await cliente.entrarDemonstracao(perfil)),
    tokenAtual: () => cliente.tokenAtual(),
    sair: async () => {
      await cliente.sair()
      setUsuario(null)
    },
  }

  return <ContextoAuth.Provider value={valor}>{children}</ContextoAuth.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useAuth(): ValorAuth {
  const valor = useContext(ContextoAuth)
  if (!valor) throw new Error('useAuth precisa estar dentro de <AuthProvider>.')
  return valor
}
