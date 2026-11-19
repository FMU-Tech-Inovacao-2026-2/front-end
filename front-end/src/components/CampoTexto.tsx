import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from 'react'
import { MensagemErro } from './MensagemErro'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> {
  rotulo: string
  erro?: string
  /** Conteúdo à direita do campo, como o botão de mostrar senha. */
  acessorio?: ReactNode
  ref?: Ref<HTMLInputElement>
}

export function CampoTexto({ rotulo, erro, acessorio, ref, ...input }: Props) {
  const id = useId()
  const idErro = `${id}-erro`
  const temErro = Boolean(erro)

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[0.9375rem] font-semibold">
        {rotulo}
      </label>
      <div className="relative flex">
        <input
          {...input}
          id={id}
          ref={ref}
          aria-invalid={temErro}
          aria-describedby={temErro ? idErro : undefined}
          className={`min-h-12 w-full min-w-0 rounded-lg bg-white px-3.5 text-base text-marca placeholder:text-texto-suave focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-destaque/40 ${
            acessorio ? 'pr-24' : ''
          } ${temErro ? 'border-2 border-erro focus-visible:border-erro' : 'border border-borda-campo focus-visible:border-destaque'}`}
        />
        {acessorio}
      </div>
      {erro ? <MensagemErro id={idErro}>{erro}</MensagemErro> : null}
    </div>
  )
}
