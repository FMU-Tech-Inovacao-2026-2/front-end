import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/AuthProvider'
import { Aviso } from '../components/Aviso'
import { LogoHealthIA } from '../components/Logo'
import { Rodape } from '../components/Pagina'

/**
 * Aviso de privacidade (LGPD, art. 9º: acesso facilitado às informações do tratamento).
 * Redação acadêmica: precisa de validação jurídica antes de uso com dados reais.
 */
export default function Privacidade() {
  const { usuario } = useAuth()
  useEffect(() => {
    document.title = 'Privacidade · HealthIA'
  }, [])

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-205 items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" aria-label="HealthIA, ir para o início" className="foco rounded-lg"><LogoHealthIA /></Link>
          <Link to={usuario ? '/' : '/entrar'} className="botao-secundario">{usuario ? 'Voltar ao início' : 'Entrar'}</Link>
        </div>
      </header>
      <main id="conteudo" className="mx-auto flex w-full max-w-205 flex-1 flex-col gap-6 px-4 py-10 text-[0.9375rem] leading-relaxed sm:px-6">
        <h1 className="text-3xl font-bold">Privacidade e uso de dados</h1>
        <Aviso tom="atencao" titulo="Projeto acadêmico">
          O HealthIA é um protótipo da FMU (2026). Use somente dados fictícios. Este texto descreve o funcionamento atual e precisa de
          validação jurídica antes de qualquer uso com pacientes reais.
        </Aviso>

        <Secao titulo="Quais dados o sistema trata">
          <ul className="list-disc pl-5">
            <li>Conta: nome, e-mail e perfil (profissional ou paciente).</li>
            <li>Texto do sumário de alta informado pelo profissional e as sugestões organizadas a partir dele.</li>
            <li>Registro do aceite: profissional, data e hora, versão do termo e código de integridade do conteúdo aprovado.</li>
            <li>Trilha de auditoria sem conteúdo clínico: quem fez o quê, quando e sobre quais identificadores.</li>
          </ul>
        </Secao>

        <Secao titulo="Para que os dados são usados">
          <p>
            Para organizar as orientações de alta e entregá-las ao paciente depois da revisão profissional. Dados de saúde são dados
            pessoais sensíveis (Lei nº 13.709/2018, art. 5º, II). O tratamento descrito no termo de aceite se apoia na tutela da saúde
            (art. 11, II, “f”). A adequação dessa base legal a um uso real deve ser confirmada pelo jurídico responsável.
          </p>
        </Secao>

        <Secao titulo="Como a IA participa">
          <ul className="list-disc pl-5">
            <li>A IA só organiza o que está escrito no sumário. Ela não diagnostica, não recomenda tratamento e não completa lacunas.</li>
            <li>Cada sugestão traz o trecho de origem. O servidor confere se o trecho existe no texto; se não existir, o item é bloqueado.</li>
            <li>Nada chega ao paciente sem a revisão e o aceite expresso de um profissional, que declara estar ciente de que a IA pode errar.</li>
            <li>No modo integrado, o texto do sumário é enviado ao modelo Gemini (Google) configurado no servidor. No modo demonstração, nada sai do navegador.</li>
          </ul>
        </Secao>

        <Secao titulo="Armazenamento e segurança">
          <ul className="list-disc pl-5">
            <li>Nesta versão, o servidor guarda dados em memória; eles são apagados quando o serviço reinicia.</li>
            <li>A sessão fica na aba do navegador e termina ao fechá-la ou ao sair.</li>
            <li>Respostas com dados de saúde não ficam em cache, e os registros técnicos não guardam texto clínico nem senhas.</li>
            <li>Cada rota confere no servidor o perfil de quem acessa; o paciente vê só o próprio plano.</li>
          </ul>
        </Secao>

        <Secao titulo="Direitos do titular">
          <p>
            A LGPD garante, entre outros, confirmação, acesso, correção e informação sobre compartilhamento (art. 18). Neste protótipo
            não há canal de atendimento ao titular; um uso real exige definir o controlador, o encarregado (DPO) e esse canal.
          </p>
        </Secao>
      </main>
      <Rodape />
    </div>
  )
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xl font-semibold">{titulo}</h2>
      {children}
    </section>
  )
}
