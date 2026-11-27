import { MENSAGEM_CONEXAO, MENSAGEM_CREDENCIAIS, type ClienteAuth, type Perfil, type ResultadoLogin, type Usuario } from './tipos'

interface UsuarioApi {
  id: string
  nome: string
  email: string
  role: Perfil
}

interface ErroApi {
  erro?: { mensagem?: string }
}

interface Sessao {
  accessToken: string
  usuario: Usuario
}

const CHAVE_SESSAO = 'healthia:api:sessao'

function lerSessao(): Sessao | null {
  try {
    const bruto = sessionStorage.getItem(CHAVE_SESSAO)
    if (!bruto) return null
    const sessao = JSON.parse(bruto) as Sessao
    return sessao.accessToken && sessao.usuario?.perfil ? sessao : null
  } catch {
    return null
  }
}

function salvarSessao(sessao: Sessao | null) {
  try {
    if (sessao) sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao))
    else sessionStorage.removeItem(CHAVE_SESSAO)
  } catch {
    // Navegação privada pode bloquear sessionStorage; o token ainda funciona até recarregar.
  }
}

function paraUsuario(usuario: UsuarioApi): Usuario {
  return { email: usuario.email, nome: usuario.nome, perfil: usuario.role }
}

async function lerMensagem(resposta: Response) {
  const dados = (await resposta.json().catch(() => null)) as ErroApi | null
  return dados?.erro?.mensagem ?? MENSAGEM_CONEXAO
}

export function criarClienteBackend(urlBase: string): ClienteAuth {
  const base = urlBase.replace(/\/+$/, '')

  return {
    modoDemonstracao: false,

    async entrarComSenha(email, senha): Promise<ResultadoLogin> {
      try {
        const resposta = await fetch(`${base}/auth/login`, {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, senha }),
        })
        if (!resposta.ok) {
          const mensagem = await lerMensagem(resposta)
          return { ok: false, mensagem: resposta.status === 401 ? MENSAGEM_CREDENCIAIS : mensagem }
        }
        const dados = (await resposta.json()) as { accessToken: string; user: UsuarioApi }
        const usuario = paraUsuario(dados.user)
        salvarSessao({ accessToken: dados.accessToken, usuario })
        return { ok: true, usuario }
      } catch {
        return { ok: false, mensagem: MENSAGEM_CONEXAO }
      }
    },

    async entrarDemonstracao() {
      return { ok: false, mensagem: 'A demonstração guiada está desligada neste ambiente.' }
    },

    async usuarioAtual() {
      const sessao = lerSessao()
      if (!sessao) return null
      try {
        const resposta = await fetch(`${base}/auth/me`, {
          headers: { Accept: 'application/json', Authorization: `Bearer ${sessao.accessToken}` },
        })
        if (!resposta.ok) {
          salvarSessao(null)
          return null
        }
        const dados = (await resposta.json()) as { user: UsuarioApi }
        const usuario = paraUsuario(dados.user)
        salvarSessao({ accessToken: sessao.accessToken, usuario })
        return usuario
      } catch {
        return null
      }
    },

    async tokenAtual() {
      return lerSessao()?.accessToken ?? null
    },

    async sair() {
      salvarSessao(null)
    },
  }
}
