import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useApi } from '../../api/ApiProvider'
import type { FichaPaciente } from '../../api/pacientes'
import { useTratarErro } from '../../api/useTratarErro'
import { useAuth } from '../../auth/AuthProvider'
import { Aviso } from '../../components/Aviso'
import { Pagina } from '../../components/Pagina'
import { FormularioPaciente } from './FormularioPaciente'

export default function NovoPaciente() {
  const { pacientes } = useApi()
  const { modoDemonstracao } = useAuth()
  const tratarErro = useTratarErro()
  const navegar = useNavigate()
  const [criado, setCriado] = useState<{ paciente: FichaPaciente; senha: string } | null>(null)
  const [copiado, setCopiado] = useState(false)

  async function salvar(dados: Parameters<typeof pacientes.criar>[0]) {
    try {
      const resultado = await pacientes.criar(dados)
      setCriado({ paciente: resultado.paciente, senha: resultado.senha_provisoria })
    } catch (falha) {
      // 401 redireciona ao login; os demais erros voltam ao formulário.
      if ((await tratarErro(falha)) === null) return
      throw falha
    }
  }

  async function copiar(senha: string) {
    try {
      await navigator.clipboard.writeText(senha)
      setCopiado(true)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <Pagina titulo="Novo paciente" largura="estreita">
      <nav aria-label="Trilha" className="text-sm text-texto-suave">
        <Link to="/pacientes" className="foco rounded font-semibold text-destaque-escuro hover:underline">Pacientes</Link> / Novo paciente
      </nav>
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">{criado ? 'Paciente cadastrado' : 'Novo paciente'}</h1>
        {!criado ? <p className="text-base text-texto-suave">A ficha reúne os sumários de alta, as revisões e o plano aprovado do paciente.</p> : null}
      </header>

      {criado ? (
        <section className="flex flex-col gap-4">
          <Aviso tom="sucesso" titulo={`${criado.paciente.nome} foi cadastrado`} anunciar>
            Prontuário {criado.paciente.numero_prontuario}. A conta de acesso usa o e-mail {criado.paciente.email}.
          </Aviso>
          {modoDemonstracao ? (
            <Aviso tom="demo">Na demonstração não há senha: o acesso de paciente é feito pelo botão “Paciente” na tela de login.</Aviso>
          ) : (
            <div className="cartao flex flex-col gap-3 border-atencao-borda p-5">
              <h2 className="text-lg font-semibold">Senha provisória</h2>
              <p className="text-sm text-texto-suave">Ela aparece só agora. Entregue ao paciente por um canal seguro; ela não fica salva no sistema.</p>
              <div className="flex flex-wrap items-center gap-3">
                <code className="rounded-lg bg-superficie px-4 py-2 font-mono text-lg font-semibold select-all">{criado.senha}</code>
                <button type="button" onClick={() => void copiar(criado.senha)} className="botao-secundario">{copiado ? 'Copiada' : 'Copiar'}</button>
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => navegar(`/pacientes/${encodeURIComponent(criado.paciente.id)}`)} className="botao-primario min-h-12 px-6">Abrir ficha</button>
            <Link to="/pacientes" className="botao-secundario min-h-12">Voltar aos pacientes</Link>
          </div>
        </section>
      ) : (
        <FormularioPaciente comEmail rotuloEnviar="Cadastrar paciente" aoEnviar={salvar} aoCancelar={() => navegar('/pacientes')} />
      )}
    </Pagina>
  )
}
