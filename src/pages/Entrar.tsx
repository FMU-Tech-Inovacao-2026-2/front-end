import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthProvider'
import type { Perfil, ResultadoLogin } from '../auth/tipos'
import { CampoTexto } from '../components/CampoTexto'
import { LogoHealthIA } from '../components/Logo'
import { TextoEmOnda } from '../components/TextoEmOnda'
import { useEntradaUmaVez } from '../components/useEntradaUmaVez'

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MODULOS = ['Alta Assistida', 'Prescrição Assistida', 'Paciente Assistido']

function erroDoEmail(email: string) {
  if (email.trim() === '') return 'Digite seu e-mail.'
  if (!EMAIL_VALIDO.test(email.trim())) return 'Digite um e-mail válido, como nome@exemplo.com.'
  return undefined
}

function erroDaSenha(senha: string) {
  return senha === '' ? 'Digite sua senha.' : undefined
}

export default function Entrar() {
  const auth = useAuth()
  const navegar = useNavigate()
  const local = useLocation()
  const estado = local.state as { voltarPara?: string; motivo?: string } | null
  const voltarPara = estado?.voltarPara ?? '/'
  const sessaoExpirada = estado?.motivo === 'sessao_expirada'

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [senhaVisivel, setSenhaVisivel] = useState(false)
  const [tentou, setTentou] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erroLogin, setErroLogin] = useState<string | null>(null)
  const refEmail = useRef<HTMLInputElement>(null)
  const refSenha = useRef<HTMLInputElement>(null)

  // Coreografia da entrada (skill choreograph): a frase do painel é a líder, em onda;
  // o formulário entra inteiro logo depois; módulos e rodapé só aparecem. Uma vez por sessão.
  const animarEntrada = useEntradaUmaVez('login')
  function entrada(classe: string, atrasoMs: number): { className: string; style?: CSSProperties } {
    if (!animarEntrada) return { className: '' }
    return { className: classe, style: { '--atraso': `${atrasoMs}ms` } as CSSProperties }
  }
  const entradaModulos = entrada('entrada-suave', 350)
  const entradaRodape = entrada('entrada-suave', 450)
  const entradaFormulario = entrada('entrada-bloco', 120)

  useEffect(() => {
    document.title = 'Entrar · HealthIA'
  }, [])

  // Erros derivados no render: só aparecem depois da primeira tentativa.
  const erroEmail = tentou ? erroDoEmail(email) : undefined
  const erroSenha = tentou ? erroDaSenha(senha) : undefined

  if (!auth.carregando && auth.usuario) return <Navigate to={voltarPara} replace />

  function concluir(resultado: ResultadoLogin) {
    if (resultado.ok) {
      navegar(voltarPara, { replace: true })
      return
    }
    setEnviando(false)
    setErroLogin(resultado.mensagem)
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (enviando) return
    setTentou(true)
    if (erroDoEmail(email)) {
      refEmail.current?.focus()
      return
    }
    if (erroDaSenha(senha)) {
      refSenha.current?.focus()
      return
    }
    setErroLogin(null)
    setEnviando(true)
    concluir(await auth.entrarComSenha(email.trim(), senha))
  }

  async function entrarDemonstracao(perfil: Perfil) {
    if (enviando) return
    setErroLogin(null)
    setEnviando(true)
    concluir(await auth.entrarDemonstracao(perfil))
  }

  return (
    <div className="flex min-h-dvh flex-wrap" data-entrada={animarEntrada ? 'animada' : 'estatica'}>
      <section
        aria-label="Sobre a HealthIA"
        className="flex min-w-0 flex-[5_1_420px] flex-col justify-between gap-4 bg-marca px-6 py-6 text-white sm:gap-8 sm:px-10 sm:py-10"
      >
        <LogoHealthIA fundo="escuro" tamanho="lg" />
        <div className="flex flex-col gap-5">
          <p className="max-w-[22ch] text-lg leading-snug font-semibold sm:max-w-[18ch] sm:text-3xl sm:leading-tight">
            <TextoEmOnda texto="Informação clínica organizada, conferida e aprovada por quem cuida." animar={animarEntrada} />
          </p>
          <ul
            className={`hidden flex-wrap gap-2 sm:flex ${entradaModulos.className}`}
            style={entradaModulos.style}
            aria-label="Módulos da plataforma"
          >
            {MODULOS.map((modulo) => (
              <li key={modulo} className="rounded-full bg-marca-suave px-3 py-1.5 text-sm text-texto-sobre-marca">
                {modulo}
              </li>
            ))}
          </ul>
        </div>
        <p
          className={`hidden max-w-[46ch] text-sm leading-relaxed text-texto-sobre-marca-suave sm:block ${entradaRodape.className}`}
          style={entradaRodape.style}
        >
          A IA só organiza o que já está escrito. Cada item aponta para a origem, e nada segue sem a aprovação de um
          profissional de saúde.
        </p>
      </section>

      <main id="conteudo" className="flex min-w-0 flex-[6_1_420px] items-center justify-center px-6 py-8 sm:py-10">
        <div className={`flex w-full max-w-100 flex-col gap-6 ${entradaFormulario.className}`} style={entradaFormulario.style}>
          <form noValidate onSubmit={enviar} aria-busy={enviando} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <h1 className="text-[1.75rem] leading-tight font-bold">Entrar na HealthIA</h1>
              <p className="text-base leading-normal text-texto-suave">
                Use o e-mail e a senha do seu cadastro. Seu perfil, profissional ou paciente, vem da sua conta.
              </p>
            </div>

            {sessaoExpirada && !erroLogin ? (
              <p role="status" className="entrada-aviso rounded-lg border border-atencao-borda bg-atencao-fundo px-3.5 py-3 text-[0.9375rem] text-atencao">
                Sua sessão expirou. Entre de novo para continuar de onde parou.
              </p>
            ) : null}

            <CampoTexto
              ref={refEmail}
              rotulo="E-mail"
              type="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="nome@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              erro={erroEmail}
            />

            <CampoTexto
              ref={refSenha}
              rotulo="Senha"
              type={senhaVisivel ? 'text' : 'password'}
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              erro={erroSenha}
              acessorio={
                <button
                  type="button"
                  aria-label="Mostrar senha"
                  aria-pressed={senhaVisivel}
                  onClick={() => setSenhaVisivel((visivel) => !visivel)}
                  className="absolute inset-y-1 right-1 inline-flex min-w-11 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-destaque-escuro hover:bg-destaque-fundo focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-destaque/40"
                >
                  <IconeOlho aberto={!senhaVisivel} />
                  Mostrar
                </button>
              }
            />

            {erroLogin ? (
              <p
                role="alert"
                className="entrada-aviso flex items-start gap-2 rounded-lg border border-erro/40 bg-erro-fundo px-3.5 py-3 text-[0.9375rem] text-erro"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-px shrink-0">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v5M12 16h.01" />
                </svg>
                {erroLogin}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={enviando}
              className="pressionavel min-h-12.5 rounded-lg bg-marca text-base font-semibold text-white hover:bg-marca-escura focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-destaque/50 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-80"
            >
              {enviando ? 'Entrando…' : 'Entrar'}
            </button>

            <p className="text-sm leading-normal text-texto-suave">
              Esqueceu a senha? Fale com o administrador da sua unidade.{' '}
              <Link to="/privacidade" className="foco rounded font-semibold text-destaque-escuro underline underline-offset-4">
                Privacidade e uso de dados
              </Link>
            </p>
          </form>

          {auth.modoDemonstracao ? (
            <section aria-labelledby="titulo-demonstracao" className="flex flex-col gap-3">
              <h2 id="titulo-demonstracao" className="flex items-center gap-3 text-sm font-semibold text-texto-suave">
                <span aria-hidden="true" className="h-px flex-1 bg-borda" />
                Acesso de demonstração
                <span aria-hidden="true" className="h-px flex-1 bg-borda" />
              </h2>
              <p className="text-sm text-texto-suave">Entre com um clique. Tudo roda no navegador, com dados fictícios, sem IA e sem servidor. Comece como profissional para criar e aprovar uma alta; depois entre como paciente para ver o plano.</p>
              <div className="grid grid-cols-2 gap-2.5">
                <BotaoDemonstracao rotulo="Profissional de saúde" onClick={() => entrarDemonstracao('profissional')} />
                <BotaoDemonstracao rotulo="Paciente" onClick={() => entrarDemonstracao('paciente')} />
              </div>
              <p className="text-[0.8125rem] leading-normal text-texto-suave">
                Contas fictícias para a apresentação. Não acessam dados reais.
              </p>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  )
}

function BotaoDemonstracao({ rotulo, onClick }: { rotulo: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pressionavel min-h-12 rounded-lg border border-borda-campo bg-white px-2.5 py-1.5 text-[0.9375rem] font-semibold text-marca hover:border-destaque hover:bg-destaque-fundo focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-destaque/40"
    >
      {rotulo}{' '}
      <span className="sr-only">(demonstração)</span>
    </button>
  )
}

function IconeOlho({ aberto }: { aberto: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {aberto ? null : <path d="M4 4l16 16" />}
    </svg>
  )
}
