const ETAPAS = ['Enviar sumário', 'Revisar e aprovar', 'Plano do paciente'] as const

/** Indicador das três etapas do Alta Assistida. */
export function EtapasAlta({ atual }: { atual: 1 | 2 | 3 }) {
  return (
    <nav aria-label="Etapas do Alta Assistida">
      <ol className="flex flex-wrap gap-2 text-sm">
        {ETAPAS.map((etapa, i) => {
          const numero = i + 1
          const ativa = numero === atual
          return (
            <li
              key={etapa}
              aria-current={ativa ? 'step' : undefined}
              className={
                ativa
                  ? 'rounded-full bg-marca px-3.5 py-2 font-semibold text-white'
                  : 'rounded-full border bg-white px-3.5 py-2 text-texto-suave'
              }
            >
              {numero}. {etapa}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
