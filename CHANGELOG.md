# Changelog — front-end

Todas as mudanças relevantes deste repositório. Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Datas em DD/MM/AAAA.

## [Não publicado]

### Adicionado
- Motivo obrigatório ao reprovar uma sugestão (salvaguarda G2), com atalhos para motivos frequentes; a revisão não avança sem motivo.
- Revisão final e comprovante listam as reprovações e os motivos (o paciente não as vê).
- A revisão mostra o modelo de IA, o tempo de geração e as correções de formato feitas.
- Aviso claro quando a IA não encontra itens para o plano, com atalho para revisar o sumário.
- Demonstração aplica a mesma regra G2 e grava `decisoes` e `reprovacoes`.
- Fichário de pacientes: lista com busca (`/pacientes`), cadastro (`/pacientes/novo`), ficha (`/pacientes/:id`) e novo sumário (`/pacientes/:id/sumarios/novo`).
- Ficha com dados cadastrais editáveis, plano vigente, sumários (ver texto, gerar plano de alta) e histórico de altas.
- Exibição única da senha provisória do paciente, com botão de copiar.
- Componente `ImportarArquivo`: lê TXT e PDF no navegador e, para PDF digitalizado ou desorganizado, pede a transcrição à IA, exige conferência e confirmação e permite abrir o PDF original.
- "Nova alta rápida" com paciente pré-selecionado (`/alta/novo?paciente=`).
- Erros de campo do servidor exibidos no formulário (`ErroApi.detalhes`).
- Demonstração com fichário próprio no navegador.
- Menu "Pacientes" e cartão "Fichário de pacientes" no início.
- `CHANGELOG.md`.

### Alterado
- `Apis` passa a ter `pacientes` além de `alta`; o cliente HTTP ganhou `patch`.
- A importação de arquivo da nova alta usa o mesmo componente da ficha.

## [1.0.0] — 27/11/2026

### Adicionado
- Integração completa com a API: termo de aceite, aprovação com declarações, comprovante, altas recentes e plano do paciente.
- Revisão com sumário lado a lado, destaque do trecho de origem e decisão explícita por item.
- Demonstração com as mesmas regras da API, roteiro e reinício.
- Página de privacidade, layout comum, avisos acessíveis e tratamento de sessão expirada.
- Imagem nginx sem privilégios com `config.js` em tempo de execução e CSP; CI e deploy no Cloud Run.
