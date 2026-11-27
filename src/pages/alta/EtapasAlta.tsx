const ETAPAS = ['Paciente e sumário', 'Sugestões da IA', 'Revisão final e aceite'] as const

/** Indicador das três etapas do Alta Assistida. Etapas concluídas ganham o sinal de conferido. */
export function EtapasAlta({ atual }: { atual: 1 | 2 | 3 | 4 }) {
  return (
    <nav aria-label="Etapas do Alta Assistida" className="nao-imprimir">
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {ETAPAS.map((etapa, i) => {
          const numero = i + 1
          const ativa = numero === atual
          const feita = numero < atual
          return (
            <li key={etapa} aria-current={ativa ? 'step' : undefined} className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 ${
                  ativa ? 'bg-marca font-semibold text-white' : feita ? 'bg-destaque-fundo font-semibold text-destaque-escuro' : 'border bg-white text-texto-suave'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`grid size-5 place-items-center rounded-full text-xs font-bold ${ativa ? 'bg-white text-marca' : feita ? 'bg-destaque text-white' : 'bg-superficie'}`}
                >
                  {feita ? '✓' : numero}
                </span>
                {etapa}
                {feita ? <span className="sr-only">(concluída)</span> : null}
              </span>
              {numero < ETAPAS.length ? <span aria-hidden="true" className="hidden h-px w-5 bg-borda sm:block" /> : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
