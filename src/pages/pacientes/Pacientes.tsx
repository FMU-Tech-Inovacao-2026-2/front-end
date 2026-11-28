import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router'
import { useApi } from '../../api/ApiProvider'
import type { PacienteNaLista } from '../../api/pacientes'
import { useTratarErro } from '../../api/useTratarErro'
import { Aviso } from '../../components/Aviso'
import { Carregando, Pagina } from '../../components/Pagina'
import { formatarData, formatarDataCivil, idade, plural } from '../../lib/formatar'

/** Fichário: lista de pacientes com busca por nome ou prontuário. */
export default function Pacientes() {
  const { pacientes: api } = useApi()
  const tratarErro = useTratarErro()
  const id = useId()
  const [busca, setBusca] = useState('')
  const [termo, setTermo] = useState('')
  const [lista, setLista] = useState<PacienteNaLista[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  // Espera a pessoa parar de digitar antes de consultar.
  useEffect(() => {
    const espera = setTimeout(() => setTermo(busca), 250)
    return () => clearTimeout(espera)
  }, [busca])

  useEffect(() => {
    let ignorar = false
    api.listar(termo)
      .then((resultado) => { if (!ignorar) { setLista(resultado); setErro(null) } })
      .catch(async (falha: unknown) => {
        const mensagem = await tratarErro(falha, 'Não foi possível carregar os pacientes.')
        if (!ignorar && mensagem) setErro(mensagem)
      })
    return () => { ignorar = true }
  }, [api, termo, tratarErro])

  return (
    <Pagina titulo="Pacientes">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-destaque-escuro">Fichário</p>
          <h1 className="text-3xl font-bold">Pacientes</h1>
          <p className="text-base text-texto-suave">Cadastro, sumários de alta e histórico de cada paciente.</p>
        </div>
        <Link to="/pacientes/novo" className="botao-primario min-h-12 px-6">Novo paciente</Link>
      </div>

      <div className="flex max-w-md flex-col gap-1.5">
        <label htmlFor={`${id}-busca`} className="text-[0.9375rem] font-semibold">Buscar por nome ou prontuário</label>
        <input
          id={`${id}-busca`}
          type="search"
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          placeholder="Ex.: Maria ou PAC-0042"
          className="foco min-h-12 rounded-lg border border-borda-campo bg-white px-3 text-base"
        />
      </div>

      {erro ? <Aviso tom="erro" anunciar>{erro}</Aviso> : null}
      {!erro && lista === null ? <Carregando texto="Carregando pacientes…" /> : null}

      {lista?.length === 0 ? (
        <div className="cartao p-6 text-texto-suave">
          {termo ? `Nenhum paciente encontrado para “${termo}”.` : 'Nenhum paciente cadastrado.'}{' '}
          <Link to="/pacientes/novo" className="font-semibold text-destaque-escuro underline underline-offset-4">Cadastrar paciente</Link>
        </div>
      ) : null}

      {lista?.length ? (
        <>
          <p className="text-sm text-texto-suave" aria-live="polite">{plural(lista.length, 'paciente', 'pacientes')}</p>
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {lista.map((paciente) => {
              const anos = idade(paciente.data_nascimento)
              return (
                <li key={paciente.id}>
                  <Link to={`/pacientes/${encodeURIComponent(paciente.id)}`} className="cartao pressionavel foco flex h-full flex-col gap-2 p-5 hover:border-destaque">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-lg font-semibold">{paciente.nome}</h2>
                      <span className="shrink-0 rounded-full bg-superficie px-2.5 py-1 font-mono text-xs font-semibold">{paciente.numero_prontuario}</span>
                    </div>
                    <p className="text-sm text-texto-suave">
                      Nascimento {formatarDataCivil(paciente.data_nascimento)}{anos !== null ? ` · ${anos} anos` : ''}
                    </p>
                    <p className="mt-auto pt-1 text-sm text-texto-suave">
                      {paciente.total_sumarios
                        ? `${plural(paciente.total_sumarios, 'sumário', 'sumários')} · último em ${formatarData(paciente.ultimo_sumario_em!)}`
                        : 'Sem sumários na ficha'}
                    </p>
                  </Link>
                </li>
              )
            })}
          </ul>
        </>
      ) : null}
    </Pagina>
  )
}
