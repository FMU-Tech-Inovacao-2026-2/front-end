# HealthIA — front-end

Aplicação web em React, Vite, TypeScript e Tailwind CSS. O fluxo executável é o módulo **Alta Assistida**. Requer Node.js 20.19 ou superior.

## Instalação e execução

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Abra `http://localhost:5173`. Não versione o `.env.local`. Reinicie o Vite sempre que mudar as variáveis.

## Fluxo

**Fichário de pacientes** (menu "Pacientes")

- Busque por nome ou prontuário e cadastre pacientes. O cadastro mostra uma senha provisória uma única vez.
- A ficha reúne dados cadastrais (editáveis), plano vigente, sumários de alta e histórico de altas.
- Em "Adicionar sumário", digite o texto ou importe TXT/PDF. PDF com texto é lido no navegador. PDF digitalizado (ou com texto desorganizado) pode ser transcrito pela IA: o texto aparece para conferência, com link para abrir o PDF original, e só é aceito depois que você confirma que conferiu.
- Em cada sumário, "Gerar plano de alta" leva direto à revisão das sugestões.

**Profissional — Alta Assistida**

1. **Paciente e sumário**: escolha o paciente e um sumário da base, importe TXT/PDF ou digite o texto.
2. **Sugestões da IA**: a tela mostra o modelo e o tempo de geração. O sumário aparece ao lado das sugestões. “Mostrar no sumário” destaca o trecho citado. Cada item precisa de uma decisão explícita: aceitar, reprovar ou editar. Reprovar exige um motivo (há atalhos para os mais comuns). Itens com citação inexistente chegam reprovados e não podem ser aceitos.
3. **Revisão final e aceite**: lista do que o paciente vai receber e termo de aceite carregado do servidor. Todas as declarações são obrigatórias, inclusive a ciência de que a IA pode errar e a finalidade conforme a LGPD.
4. **Comprovante**: profissional, data e hora, versão do termo, declarações, reprovações com motivo e hash SHA-256 do conteúdo. Pode ser impresso e reaberto pelo início.

As decisões ficam salvas por extração na aba (`sessionStorage`). Ao recarregar a página nada se perde, e a revisão final nunca presume itens aprovados.

**Paciente**: vê o plano aprovado, com sinais de alerta em destaque, quem aprovou e quando, a origem de cada item e a opção de imprimir.

A página `/privacidade` descreve, em linguagem simples, o tratamento de dados.

## Modos de execução

### Demonstração

`VITE_MODO_DEMONSTRACAO=true` (padrão do `.env.example`). Tudo roda no navegador, com dados fictícios, sem IA e sem servidor. A demonstração reproduz as regras do back-end: o mesmo catálogo, o mesmo termo, a verificação de origem e um erro proposital da IA. Textos livres recebem o mesmo aviso que a API dá sem IA configurada.

Na tela de login, entre com um clique como “Profissional de saúde” ou “Paciente”. O início do profissional traz o roteiro da apresentação e o botão “Reiniciar demonstração”. O plano aprovado como profissional aparece para o paciente na mesma aba.

### Integração com o back-end

Inicie a API conforme `Backend/back-end/README.md` e configure o `.env.local`:

```dotenv
VITE_MODO_BACKEND=true
VITE_API_URL=http://localhost:3000
```

`VITE_MODO_BACKEND=true` tem prioridade sobre a demonstração. O login é validado pela API; use as contas fictícias do README do back-end. Sessão expirada (401) volta ao login e retorna à página onde o usuário estava.

## Produção

A imagem (`Dockerfile`) compila o app e o serve com nginx sem privilégios na porta 8080. A mesma imagem atende qualquer ambiente: na inicialização, `docker/15-healthia-config.envsh` gera o `/config.js` a partir de:

| Variável | Valor |
| --- | --- |
| `HEALTHIA_API_URL` | URL pública da API, ex.: `https://healthia-api-xxxx.a.run.app` |
| `HEALTHIA_MODO` | `backend` (padrão quando há URL) ou `demonstracao` |

O nginx envia CSP (com `connect-src` limitado à API), HSTS, `X-Frame-Options`, `nosniff` e `Referrer-Policy`. Arquivos com hash ficam em cache; `index.html` e `config.js` não.

```powershell
docker build -t healthia-web .
docker run -p 8080:8080 -e HEALTHIA_API_URL=http://localhost:3000 healthia-web
```

O deploy no Cloud Run é feito por `.github/workflows/deploy.yml`. O passo a passo está em `PitchInicial/pitchInicial/docs/deploy.md`.

## CI

`.github/workflows/ci.yml` roda em cada push e pull request: `lint`, `test`, `build` (com checagem de tipos) e build da imagem, conferindo `config.js` e a CSP.

## Comandos de desenvolvimento

```powershell
npm test
npm run build
npm run lint
```

## Limites e segurança

- Use exclusivamente dados fictícios.
- A API guarda dados em memória; eles desaparecem ao reiniciar o servidor.
- PDF sem camada de texto requer transcrição ou OCR fora desta aplicação.
- Sugestões só chegam ao paciente após revisão e aceite de um profissional. A IA organiza o texto; não diagnostica nem recomenda tratamento.
- Restrições de tela por perfil melhoram a experiência, mas a autorização é feita pelo back-end em cada rota.

O contrato de rotas e payloads está em `PitchInicial/pitchInicial/docs/contrato-api.md`. Arquitetura e LGPD estão em `docs/arquitetura.md` e `docs/dados-e-seguranca.md` no mesmo repositório. Mudanças por versão: `CHANGELOG.md`.
