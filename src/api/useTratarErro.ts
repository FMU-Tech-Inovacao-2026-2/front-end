import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthProvider'
import { ErroApi, MENSAGEM_ERRO_GENERICO } from './erros'

/**
 * Converte falhas da API em mensagem para a tela. Sessão expirada (401) encerra
 * o login e volta à tela de entrada, guardando a página para retornar depois.
 * Devolve null quando já redirecionou.
 */
export function useTratarErro() {
  const { sair } = useAuth()
  const navegar = useNavigate()
  const { pathname } = useLocation()

  return useCallback(
    async (falha: unknown, padrao = MENSAGEM_ERRO_GENERICO): Promise<string | null> => {
      if (falha instanceof ErroApi && falha.status === 401) {
        await sair()
        navegar('/entrar', { replace: true, state: { voltarPara: pathname, motivo: 'sessao_expirada' } })
        return null
      }
      return falha instanceof Error && falha.message ? falha.message : padrao
    },
    [sair, navegar, pathname],
  )
}
