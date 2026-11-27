import type { ReactNode } from 'react'

type Tom = 'info' | 'atencao' | 'erro' | 'sucesso' | 'demo'

const ESTILOS: Record<Tom, string> = {
  info: 'border-destaque/30 bg-destaque-fundo text-marca',
  demo: 'border-destaque/40 bg-destaque-fundo text-marca',
  atencao: 'border-atencao-borda bg-atencao-fundo text-atencao',
  erro: 'border-erro/40 bg-erro-fundo text-erro',
  sucesso: 'border-sucesso/30 bg-sucesso-fundo text-sucesso',
}

const ICONES: Record<Tom, ReactNode> = {
  info: <path d="M12 16v-5M12 8h.01" />,
  demo: <path d="M9 7l8 5-8 5z" />,
  atencao: <path d="M12 9v4M12 17h.01" />,
  erro: <path d="M12 8v5M12 16h.01" />,
  sucesso: <path d="M8 12.5l2.5 2.5L16 9.5" />,
}

interface Props {
  tom?: Tom
  titulo?: string
  children?: ReactNode
  /** role="alert" para erros que surgem após uma ação; status para avisos neutros. */
  anunciar?: boolean
  className?: string
}

/** Caixa de aviso com ícone e cor por tom. A cor nunca é a única pista: há título e ícone. */
export function Aviso({ tom = 'info', titulo, children, anunciar = false, className = '' }: Props) {
  return (
    <div
      role={anunciar ? (tom === 'erro' ? 'alert' : 'status') : undefined}
      className={`entrada-aviso flex items-start gap-3 rounded-lg border px-4 py-3 text-[0.9375rem] leading-relaxed ${ESTILOS[tom]} ${className}`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0">
        <circle cx="12" cy="12" r="9" />
        {ICONES[tom]}
      </svg>
      <div className="min-w-0 flex-1">
        {titulo ? <p className="font-semibold">{titulo}</p> : null}
        {children ? <div className={titulo ? 'mt-0.5' : ''}>{children}</div> : null}
      </div>
    </div>
  )
}
