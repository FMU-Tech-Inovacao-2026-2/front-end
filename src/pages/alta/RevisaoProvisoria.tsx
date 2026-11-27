import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { Cabecalho } from '../../components/Cabecalho'
import { EtapasAlta } from './EtapasAlta'

/** Provisória: a tela de revisão e aprovação é a próxima tarefa. */
export default function RevisaoProvisoria() {
  const { id } = useParams()

  useEffect(() => {
    document.title = 'Revisão do plano · HealthIA'
  }, [])

  return (
    <div className="min-h-dvh">
      <Cabecalho />
      <main id="conteudo" className="mx-auto flex max-w-280 flex-col items-start gap-5 px-5 py-8 sm:px-6">
        <EtapasAlta atual={2} />
        <h1 className="text-3xl font-bold">Revisão: próxima tarefa</h1>
        <p className="max-w-[70ch] text-base text-texto-suave">
          A extração <code className="rounded bg-white px-1.5 py-0.5 text-marca">{id}</code> foi criada com status pendente. A tela de
          revisão e aprovação entra na próxima etapa.
        </p>
        <Link to="/alta/novo" className="font-semibold text-destaque-escuro underline underline-offset-4">
          Enviar outro sumário
        </Link>
      </main>
    </div>
  )
}
