import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Cabecalho } from './Cabecalho'

interface Props {
  /** Título da aba do navegador, sem o sufixo " · HealthIA". */
  titulo: string
  children: ReactNode
  largura?: 'estreita' | 'larga'
}

/** Estrutura comum das telas logadas: link de pular, cabeçalho, conteúdo e rodapé. */
export function Pagina({ titulo, children, largura = 'larga' }: Props) {
  useEffect(() => {
    document.title = `${titulo} · HealthIA`
  }, [titulo])

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="foco sr-only rounded-lg bg-marca px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
      >
        Pular para o conteúdo
      </a>
      <Cabecalho />
      <main
        id="conteudo"
        tabIndex={-1}
        className={`mx-auto flex w-full flex-1 flex-col gap-6 px-4 py-8 outline-none sm:px-6 sm:py-10 ${largura === 'estreita' ? 'max-w-205' : 'max-w-300'}`}
      >
        {children}
      </main>
      <Rodape />
    </div>
  )
}

export function Rodape() {
  return (
    <footer className="nao-imprimir border-t bg-white">
      <div className="mx-auto flex max-w-300 flex-wrap items-center justify-between gap-3 px-4 py-4 text-sm text-texto-suave sm:px-6">
        <p>HealthIA · projeto acadêmico FMU 2026. Use somente dados fictícios.</p>
        <Link to="/privacidade" className="foco rounded font-semibold text-destaque-escuro underline-offset-4 hover:underline">
          Privacidade e uso de dados
        </Link>
      </div>
    </footer>
  )
}

/** Indicador de carregamento acessível, com o mesmo espaço da tela final. */
export function Carregando({ texto }: { texto: string }) {
  return (
    <div role="status" className="flex items-center gap-3 py-10 text-texto-suave">
      <span aria-hidden="true" className="size-5 animate-spin rounded-full border-2 border-borda border-t-destaque motion-reduce:animate-none" />
      {texto}
    </div>
  )
}
