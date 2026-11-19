# front-end

Front-end da HealthIA: React, Vite, TypeScript e Tailwind CSS v4, com login pelo Supabase Auth.

Prontos até agora: a **tela de login**, a **logo**, o **início por perfil** e a **tela 1 do Alta Assistida** (envio do sumário de alta, em `/alta/novo`, só para profissional). A revisão do plano (tela 2) e os módulos Prescrição Assistida e Paciente Assistido entram nas próximas etapas.

## Como rodar

Precisa do Node.js 20.19 ou mais novo.

```bash
npm install
cp .env.example .env      # no Windows (PowerShell): Copy-Item .env.example .env
npm run dev
```

Abra o endereço que aparecer no terminal (normalmente http://localhost:5173).

Com `VITE_MODO_DEMONSTRACAO=true` no `.env`, o app abre sem Supabase e sem back-end, com contas e pacientes fictícios. Para o login real, veja "Ligar o Supabase"; para a API, "Ligar o back-end".

| Conta de demonstração | E-mail | Senha |
| --- | --- | --- |
| Profissional de saúde | `profissional@demo.healthia` | `demonstracao` |
| Paciente | `paciente@demo.healthia` | `demonstracao` |

Na tela de login, os botões de **Acesso de demonstração** entram direto com essas contas. Eles só aparecem no modo de demonstração.

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm test` | Testes (Vitest + Testing Library) |
| `npm run lint` | Lint (oxlint) |
| `npm run build` | Checagem de tipos e build de produção em `dist/` |
| `npm run preview` | Serve o build de produção localmente |

## Ligar o Supabase

Projeto da HealthIA: `https://etjszvlkdpedcyqckqjs.supabase.co` (chaves de assinatura ES256).

Este projeto usa só `@supabase/supabase-js`. O `@supabase/ssr` e as variáveis `NEXT_PUBLIC_` que aparecem no painel do Supabase são para Next.js; aqui o equivalente é `VITE_`.

1. No `.env`, use `VITE_MODO_DEMONSTRACAO=false` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_CHAVE_PUBLICA` (Supabase > Project Settings > API Keys > publishable key). Pode colar a URL com `/rest/v1/` no final: o app usa só a base.
2. O cadastro público está aberto por enquanto (decisão do time). Uma conta criada por fora não entra no app, porque fica sem perfil. Para fechar depois: Authentication > Sign In / Providers > "Allow new users to sign up".
3. Crie os usuários em Supabase > Authentication > Users > Add user (marque "Auto Confirm User").
4. Defina o perfil de cada usuário no **app_metadata**, pelo SQL Editor do Supabase:

```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"perfil": "profissional"}'
where email = 'medica@exemplo.com';

update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"perfil": "paciente"}'
where email = 'paciente@exemplo.com';
```

Conta sem perfil não entra: a tela mostra "Sua conta ainda não tem um perfil liberado".

### Regras de segurança

- **Só a chave pública no front-end.** Toda variável que começa com `VITE_` vai para o código que o navegador baixa. Nunca coloque a chave `service_role` aqui: com ela, qualquer pessoa lê e altera o banco inteiro.
- **O perfil vem do `app_metadata`, nunca do `user_metadata`.** O usuário consegue editar o próprio `user_metadata` e se promover a profissional; o `app_metadata` só o servidor altera.
- **A tela de login não escolhe o perfil.** O perfil vem da conta. Esconder botões no front não protege nada: o back-end (FastAPI) precisa validar o token do Supabase e conferir o perfil em toda rota.
- **O `.env` não vai para o Git** (está no `.gitignore`). O repositório é público.

## Ligar o back-end

Fora do modo de demonstração, o app chama o FastAPI no endereço de `VITE_API_URL` (por exemplo `http://localhost:8000`, sem barra no final). Toda chamada leva `Authorization: Bearer <token do Supabase>`. Os detalhes de cada rota estão no `GUIA-INTEGRACAO-API.md`.

| Tela | Chamada | Resposta esperada |
| --- | --- | --- |
| Envio do sumário | `GET /pacientes` | `[{ "id", "nome", "email" }]` (o `id` é o `sub` da conta do paciente) |
| Envio do sumário | `POST /alta/extracoes` com `{ "paciente_id", "texto" }` | `201` com `{ "id", "status": "pendente" }` |

- Erro vem no formato `{ "erro": { "codigo", "mensagem" } }`; a tela mostra a `mensagem` como está, então ela precisa ser em português e legível para o profissional.
- `401` encerra a sessão e leva para o login.
- Sem conexão, a tela mostra "Não foi possível conectar ao servidor".
- `GET /pacientes` ainda não existe no back-end; até lá, a tela avisa que a lista não carregou e oferece "Tentar de novo".
- O back-end precisa liberar a origem do front (`http://localhost:5173`) no CORS.

## Estrutura

```
src/
├── api/
│   ├── clienteHttp.ts           # fetch com token, erros no formato { erro: { codigo, mensagem } }
│   ├── erros.ts                 # ErroApi e mensagens padrão
│   ├── alta.ts                  # rotas do Alta Assistida (GET /pacientes, POST /alta/extracoes)
│   ├── demonstracao.ts          # pacientes e extração fictícios
│   ├── criarApis.ts             # escolhe demonstração ou back-end pelo .env
│   └── ApiProvider.tsx          # contexto das APIs (nos testes, versões falsas)
├── auth/
│   ├── tipos.ts                 # Perfil, Usuario e a interface ClienteAuth
│   ├── clienteSupabase.ts       # login real (carregado só quando usado)
│   ├── clienteDemonstracao.ts   # contas fictícias para a apresentação
│   ├── criarCliente.ts          # escolhe um dos dois pelo .env
│   ├── AuthProvider.tsx         # contexto com usuário, token, entrar e sair
│   └── RotaProtegida.tsx        # login obrigatório e, se pedido, perfil certo
├── components/
│   ├── Logo.tsx                 # marca e logo completa (fundo claro e escuro)
│   ├── Cabecalho.tsx            # logo, e-mail e botão Sair
│   ├── CampoTexto.tsx           # campo com rótulo e erro acessível
│   └── MensagemErro.tsx         # mensagem de erro de campo
├── pages/
│   ├── Entrar.tsx               # tela de login
│   ├── Inicio.tsx               # módulos por perfil
│   └── alta/
│       ├── EnvioSumario.tsx       # tela 1: escolher paciente e colar o sumário
│       ├── RevisaoProvisoria.tsx  # tela 2 provisória (próxima tarefa)
│       └── EtapasAlta.tsx         # indicador de etapas
├── App.tsx                      # rotas
├── index.css                    # Tailwind v4 e cores da marca (@theme)
└── main.tsx
marca/                           # logo em SVG para documentos e slides
```

## Animações

Seguem as regras das skills `animate` e `choreograph` (Emil Kowalski): só `transform` e `opacity`, curva `--ease-saida` (`cubic-bezier(0.23, 1, 0.32, 1)`), CSS puro, sem biblioteca. Estão em `src/index.css`.

| Elemento | Papel | Começa | Duração | Movimento |
| --- | --- | --- | --- | --- |
| Frase do painel, palavra por palavra | Principal | 0 ms, intervalos que diminuem | 600 ms | aparece subindo 0,4em |
| Formulário | Apoio | 120 ms | 450 ms | aparece subindo 8px, inteiro |
| Módulos e rodapé do painel | Decoração | 350 e 450 ms | 400 ms | só aparece |
| Mensagem de erro | Retorno | ao aparecer | 200 ms | aparece subindo 4px |
| Botões | Retorno | ao pressionar | 150 ms | encolhe para 97% |

- A entrada roda **uma vez por sessão**: quem sai e volta ao login não espera de novo.
- Com "reduzir movimento" ligado no sistema, tudo só aparece junto, sem deslocamento e sem atraso.
- A frase animada é lida inteira pelo leitor de tela, não palavra por palavra.
- A página de início não tem animação de entrada: é aberta muitas vezes por dia.

## Acessibilidade (WCAG 2.2 AA)

- Rótulos visíveis em todos os campos e erros ligados ao campo (`aria-describedby`), com o foco indo para o primeiro campo com erro.
- Erro de login anunciado para leitor de tela (`role="alert"`).
- Botão de mostrar senha com estado (`aria-pressed`); o navegador e o gerenciador de senhas conseguem preencher e colar.
- Contraste conferido em todas as combinações de cor; botões e campos com pelo menos 44 px de altura.
- No celular, o formulário inteiro cabe na primeira tela.
