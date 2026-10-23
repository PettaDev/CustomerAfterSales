# PROJECT_CONTEXT — BRTE / CustomerAfterSales

> Atualizado em 2026-10-15. `main` auditada: `51f85231d7a344cca78a123902c5e6a480360679`.

## Produto e arquitetura

Portal de suporte pós-venda TRANSSION (Infinix, TECNO e itel) com coleta de feedback, evidências, acompanhamento do cliente e operação TFAE/Manager.

- React 19 + TypeScript + Vite, frontend em `src/App.tsx` e `src/portal/`.
- Express + Node.js em `server/`, execução serverless na Vercel, PostgreSQL/Neon, armazenamento privado de evidências.
- Bridge local para Android, ADB, coleta de logs e vídeo. Não substituir o fluxo existente.
- Idiomas: pt-BR, en, es-419 e zh-CN; temas claro/escuro.
- Managers somente leitura; TFAEs podem alterar casos. A autorização deve continuar aplicada no backend.
- Banco e armazenamento de objetos exigem backups independentes. Nunca apagar dados de clientes para testes.

## Status de revisão 2026-10-15

A pessoa responsável aprovou o design do footer, **não** aprovou automaticamente as outras mudanças da PR #35. A PR #35 reúne footer e dashboard; não fazer merge dela apenas para publicar o footer.

**Mudança isolada nesta branch:** `fix/brte-footer-isolated-2026-10-15`.

- Footer comum em `src/App.tsx` e 9 páginas HTML estáticas (Central de Ajuda, 5 guias, pontos de apoio, privacidade e cookies).
- CSS de footer em `public/brte-site.css`; idioma no React `src/portal/portal-i18n.ts` e páginas estáticas `public/brte-site.js`.
- Rota `/guide` e `/capture` passam pelo mesmo shell para receber header/footer.
- Teste isolado `tests/brte-footer-isolated.test.mjs`.
- **Não há alterações** a `src/portal/Cases.tsx`, `src/portal/workspace.css`, `server/`, auth OTP/Resend, banco ou armazenamento.
- **Exceção operacional (sem impacto no aplicativo):** `.github/workflows/security-audit.yml` substitui o commit automático do PDF por um artefato de workflow; o PDF versionado é preservado na versão da `main`.

## Restrições e próximos passos

1. Antes de qualquer merge, comparar com a `main` **mais recente**. Se tiver mudado, reconciliar por arquivo, não sobrescrever versões funcionais.
2. Rodar CI, testes e build na branch. A implantação Preview não equivale a aceite visual.
3. Validar footer em 320/375/430/768/1280 px, claro/escuro, nos quatro idiomas, com navegação teclado e toque.
4. Não liberar produção nem mesclar sem autorização.
5. PRs #27 e #28 possuem base antiga e estão conflitantes; analisar isoladamente, nunca inserir integralmente no trabalho de footer.
6. A melhoria responsiva do Dashboard TFAE/Manager requer review próprio com dados sintéticos, papéis e estado real do sistema.
7. A entrega de e-mails OTP em Junk/Spam é pendência independente: investigar reputação e configuração do domínio, sem modificar o fluxo apenas por hipótese.

Ver também `README.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md` e `docs/BRTE_GOLIVE_AND_ACCEPTANCE_2026-10-14.md`.


## 2026-10-15 — confirmação automática de caso por e-mail (isolada)

- **Base da implementação:** `main` em `90dfefa2785b0031cb7c4011305dbceb0caee8eb` (footer aprovado). Esta branch é independente da PR #37 (rascunho de formulário + guia Termux). Não substituir/mesclar as melhorias de formulário dessa PR sem reconciliação.
- **Objetivo:** enviar automaticamente ao e-mail informado pelo cliente o protocolo `CAS-...`, código de acompanhamento privado e URL pública `/tracking` ao criar atendimento.
- **Arquitetura:** em ambos `server/app-enhanced.mjs` (produção por `api/index.mjs`) e `server/app.mjs` (fallback/testes), a notificação ocorre **depois** de `db.put`. O token só permanece em hash no banco e não está na URL; o corpo enviado ao Resend contém o token porque o cliente precisa dele para acompanhar.
- **Configuração isolada:** `CASE_EMAIL_ENABLED=false` por padrão, `CASE_EMAIL_FROM`, `CASE_TRACKING_URL`, `RESEND_API_KEY` existente. A equipe continua com `AUTH_EMAIL_FROM` e OTP inalterados.
- **Falha do e-mail:** retorna `HTTP 201` com o caso e seu token intactos, e `emailNotification: "failed"`; desligado retorna `"disabled"`, aceite pelo Resend retorna `"accepted"` (NÃO é prova de entrega na caixa de entrada). Não realizar envio assíncrono solto após a resposta em serverless.
- **Idiomas:** pt-BR, en, es-419, zh-CN; e-mail em texto simples. Controle de Idempotency-Key vinculado ao protocolo. Logs só de ID opaco/status do provedor, jamais destinatário, token ou API key.
- **UI:** a tela de sucesso mantém copiar dados e acompanhar, com aviso adequado ao status. Isso não restaura tokens perdidos de casos anteriores.
- **Testes:** `tests/customer-case-email.test.mjs` + CI, `npm run build` e análise de segurança.
- **Habilitação pós-revisão:** ler **`docs/CASE_CONFIRMATION_EMAIL_SETUP.md`** para configurar domínio verificado/Resend e Vercel, ativar flag, testar e ter rollback.
- **Gates:** não implantar em produção automaticamente. Conferir status dos checks/Preview, deliverability real e uso seguro de e-mail de teste autorizado; sem operações de escrita em Neon/Blob durante a implementação.


## 2026-10-15 — Guia Termux/Wi-Fi aprovado para produção (escopo isolado)

- **Solicitação aprovada:** publicar o cartão visual Termux já visto no Preview da PR #39 e adicionar acesso na Central de Ajuda `/ajuda/`.
- **Ponto de restauração:** `main` em `9e434987e333fe46aaeb4a3b4a1fb2484fafa4ad`. Branch isolada `feat/termux-help-production-isolated-2026-10-15`. Não mesclar a PR #39 para entregar esta melhoria: SPD/Qualcomm ainda exigem homologação física.
- **Cliente (React):** `src/portal/CustomerFlowV2.tsx` mantém o upload manual e exibe cartão opcional em `collectionMethod === "mobile"`, com três passos, instrução de uso sob orientação do suporte e botão externo `/guide`. `src/portal/mobile-collection-guide.ts` inicializa no armazenamento local apenas marca/idioma/etapa, sem dados pessoais do atendimento.
- **Guia original:** `src/App.tsx` volta a renderizar `GuideApp` existente em `/guide` e mantém `/capture` isolada. Passos e vídeos do Termux/Wi-Fi continuam no acervo original, sem recriação. O guia abre em outra aba para manter o formulário.
- **Central de Ajuda:** `public/ajuda/index.html` oferece cartão acessível (fora dos cinco artigos de sintomas), `public/brte-help-termux.js` traduz conteúdo pt-BR/en/es-419/zh-CN e inicia seleção de marca no tutorial; `public/brte-help-termux.css` trata temas e telas pequenas.
- **Testes:** `tests/termux-help-production.test.mjs`, checks preexistentes de footer/P0/navegação atualizados somente quanto à antiga rota placeholder. Não alterar as rotinas WebUSB, Bridge Windows, banco/Blob, dashboard nem OTP.
- **Aceite:** CI/testes/build/auditoria, Preview Vercel, comparação de arquivos contra a `main` atual e deploy produção. Verificar `/ajuda/` e etapa 3 em smartphone (toque, retorno à aba, anexos), guia `/guide` por marca/idioma e navegadores desktop.
- **Importante:** a PR #37 (rascunho do cliente) continua pendente; não afirmar que esse recurso foi publicado. A PR #39 continua aguardando homologação física SPD/Qualcomm, portanto não incluída neste escopo.


## 2026-10-15 — Publicação OEM WebUSB SPD e Qualcomm, isolada do guia

- **Pedido do responsável:** levar para produção a automação YLog SPD/Unisoc e a melhoria Qualcomm anteriormente homologadas somente por CI na PR #39. Hardware real ainda deve ser testado após deploy; não apresentar como compatibilidade universal.
- **Ponto de partida:** `main` em `9e950595bac1385bbc99f69efb4221413e0b0ccf` após a PR #40; o cartão Termux da etapa 3, a Central de Ajuda e o guia `/guide` estão preservados sem alterações.
- **Implementação OEM isolada:** copiar apenas `src/portal/BrowserCapture.tsx`, `src/portal/qualcomm-tranlog.ts`, `src/portal/spd-ylog.ts`, `tests/spd-ylog-webusb.test.mjs` e `docs/QA_TOOLBOX_SPD_QUALCOMM_PREVIEW_TEST.md` a partir do commit Preview `6f8ee13be8336cadd615f31e585cc8247e10835e`. Não mesclar toda a PR #39 porque ela divergiu após a PR #40.
- **SPD:** detectar SoC e YLog, abrir a tela de configuração, ativar e confirmar os quatro switches (com toques baseados em bounds da UI), START/STOP verificados e arquivos `.ylog` novos em ZIP. Se o YLog não for reconhecido, o WebUSB usa Logcat genérico. Se reconhecido mas falhar/estiver sem acesso a `/data/ylog`, exibir erro sem falso sucesso e sem apagar arquivos existentes.
- **Qualcomm:** TranLogManager permanece, com Switch nativo adicional e espera de 8 segundos antes do screenrecord. **MTK** permanece no fluxo já existente.
- **Sem mudanças** ao `src/App.tsx`, `src/portal/CustomerFlowV2.tsx`, `public/ajuda/`, `src/portal/mobile-collection-guide.ts`, Bridge, backend, Neon/Blob, OTP ou Dashboard.
- **Validar:** CI/build/auditoria no commit isolado, Preview Vercel, publicação READY no projeto `customers-guide`, smoke test real Chrome/Edge com aparelhos OEM após lançamento, e observação dos relatórios/diagnósticos de falha. Ausência de homologação física explícita é risco conhecido.
- **Rollback:** voltar para o último deploy READY da produção (commit `9e950595`) se aparelhos tiverem erros regressivos. Não remover dados do cliente para rollback. Ver roteiro `docs/QA_TOOLBOX_SPD_QUALCOMM_PREVIEW_TEST.md`.


## 2026-10-16 — Coleta de logs sem computador, seleção direta por processador

- Solicitação do responsável: produção. Sem incorporar PR #42 (dashboard) ou PR #43 (reforma anterior de guia); a nova página substitui a antiga entrada de marca/país/método apenas na rota `/guide`.
- Entrada: `src/ChipsetGuideApp.tsx` + `src/chipset-guide.css`, três escolhas MediaTek, Qualcomm e SPD/Unisoc. Somente tutorial **sem computador**, com idioma pt/en/es/zh e tema claro/escuro. `src/GuideApp.tsx` encaminha diretamente ao novo tutorial; os dados antigos de marca não direcionam mais erroneamente o cliente para DebugLoggerUI MTK.
- Conteúdo `src/guides/chipset-mobile.ts`: passos compartilhados Termux, Wireless debugging, adb pair/connect; depois fluxo separado de DebugLoggerUI (MediaTek), TranLogManager (Qualcomm) e YLog (Unisoc), com nomes de packages/log paths já presentes em `src/portal/*-logger.ts`. Sem excluir pastas ou instruir root. Android pode restringir acesso a /data/debuglogger e /data/ylog; exibido fallback `adb logcat -d` e orientação TFAE. O vídeo antigo e borrado foi retirado da nova rota, mantendo screenshots legíveis quando disponíveis; não substitui arquivo de vídeo nem reprocessa MP4.
- Privacidade `CustomerFlowV2.tsx` e `portal.css`: aviso agora é `privacy-note brte-privacy-card`, cartão com borda completa, fundo e contraste nos dois temas. Não altera dados, formulário ou envio. Responsividade preservada.
- Testes `tests/chipset-guide-production.test.mjs` incluem matriz de chipsets, ausência de roteamento por marca, não deleção, fallback e aviso visual. Teste legado `termux-help-production.test.mjs` atualizado apenas na afirmação obsoleta de GuidePage renderizado.
- **Limitantes:** sequências OEM de UI podem variar conforme firmware, paths OEM podem ser inacessíveis por ADB no próprio dispositivo. Necessário testar fisicamente o guia em cada plataforma; não confundir CI com homologação. Sem mexer na automação WebUSB, backend, Bridge, Resend, autenticação e painel TFAE.


## 2026-10-16 — Layout do /guide, navbar/footer compartilhados e preparação de vídeos (Preview)

- Feedback do responsável após PR #44 em produção: página de escolha por chipset desalinhada, espaço vazio excessivo, barra superior reduzida e footer simplificado, apesar do restante do portal usar a navbar e footer personalizados. Vídeos de cada processo ainda serão enviados pelo responsável.
- Causa: `src/App.tsx` executava `if (page === "guide") return ...` ANTES de renderizar `brte-site-header` e `brte-unified-footer`; `src/ChipsetGuideApp.tsx` tinha header/footer próprios, tema/idioma local duplicados e CSS sem o escopo do portal.
- Correção: `App.tsx` inclui o guia como rota lazy interna dentro do mesmo contêiner `.portal`, mantendo **uma** navbar/footer centralizados. Normaliza barra final em `/guide/`; usa os links de suporte, ajuda, pontos, acompanhamento, novo atendimento, idioma e tema já compartilhados. Removido header/footer duplicado do guia.
- `ChipsetGuideApp.tsx`: idioma passa a usar i18n compartilhado, sem seletor local; tema vem de `App.tsx` (`data-theme`); conteúdo técnico e seleção MediaTek/Qualcomm/SPD intactos. `chipset-guide.css` isola overrides `.portal.portal-with-guide` para competir com resets de `portal.css`, harmoniza cards e paddings, organiza grid responsivo e empurra footer para o final do viewport, com altura mínima correta.
- `src/guides/chipset-videos.ts`: manifest tipado por processador e índice da etapa. O player com controls/playsInline/preload metadata só renderiza se um vídeo **real e verificado** for configurado em `/videos/brte/<arquivo>.mp4|webm`. Não publicar mídia inexistente nem o vídeo antigo ilegível. Aguardando vídeos originais prometidos para vincular MediaTek, Qualcomm e SPD/Unisoc às etapas relevantes.
- Testes: `tests/guide-shared-chrome-video.test.mjs` valida navbar/footer únicos, roteamento, responsividade, idioma/tema compartilhados e nenhum player quebrado. Guardas legadas de `if(page === guide) return` atualizadas para o novo contrato sem relaxar os fluxos.
- **Escopo seguro:** sem alterações em coleta OEM WebUSB, rotinas Termux, texto de comandos, DB, e-mail, OTP, dashboard ou PRs #42/#43. Mudanças nesta branch `fix/guide-shared-chrome-videos-preview-2026-10-16` em Preview até avaliação visual do responsável, especialmente telas 320/375/430/768/1280, ambos os temas e os quatro idiomas.
- **Próxima etapa:** receber os MP4/WebM originais; verificar legibilidade, resolução, orientação e codec; organizar nomes/steps e publicar manifest com cada URL após upload real. Nunca prometer que vídeo está incluído antes disso.

## 2026-10-23 — Correções urgentes de produção: Manager, telefone e TFAEs

- Pedido explícito de atualização em produção. Base é a `main` após PR #45; PRs #46 (Preview Manager) e #47 (Collector) **não são mescladas** junto. Mudanças isoladas nesta branch `fix/production-manager-assign-20261023`.
- `src/portal/Cases.tsx`: na tela interna de detalhe, exibe o telefone do cliente com link `tel:` (dado já previsto no schema de caso; não exibe na tabela pública); e-mail clicável; Manager autenticado ganha controles de status e atribuição somente em casos ativos. Prioridade, moderação, notas visíveis ao cliente, sessões e uploads continuam restritos ao perfil TFAE.
- `server/app.mjs`: `PATCH /api/cases/:id` exige `requireStaff` e para Manager aceita **exatamente** uma das chaves `status` ou `owner` por chamada; outras chaves (inclusive desconhecidas) são rejeitadas 403. Casos arquivados/spam/duplicados são bloqueados (409); status validado enum; atribuições validadas por whitelist. A timeline registra `staffId`, `staffName`, `staffRole`, data. Mantém comportamentos de janela de upload conforme status.
- `server/staff.mjs`: roster de **atribuíveis** separado da allowlist de autenticação. TFAEs existentes continuam habilitados e Gustavo Petta (BR) / Tommy Alvarado (EC) são garantidos como opções sem criar login, senha, e-mail ou permissões adicionais. A API `/api/auth/staff` mantém `staff` com as contas reais e adiciona `assignees`; `/api/auth/staff-overview` mostra responsáveis operacionais, contabilizando casos. Manager Gustavo pode receber atribuições sem converter sua função de autenticação em TFAE. Atenção: vincular eventual login TFAE distinto no futuro requer coordenação.
- `src/portal/portal.css`: cards de acompanhamento usam grid `auto-fit` para ocupar largura e se ajustam em celulares, sem linha de 4 colunas vazia. Traduções PT, EN, ES, ZH atualizadas (telefone e permissão).
- `tests/manager-role.test.mjs`: verifica TFAE roster, telefone, status/owner 200, outras alterações 403, login isolado, log de atribuição e compatibilidade TFAE.
- Não altera Neon, envs Vercel, login corporativo, JWT/OTP, upload API, Collector, WebUSB nem dados de clientes. Nenhum caso real é alterado durante testes. Publicação exige CI, segurança e Preview READY antes do merge squash; conferir deploy Vercel Production READY e domínio oficial.

- Dependências: CI do dia 2026-10-23 encontrou GHSA-mrhx-c7xc-m3w5 alta no zod <4.6.6 (direto 4.1.8, transitive @vercel/cli-config 4.1.11 via @vercel/blob). Branch atualiza zod direto e usa override pontual @vercel/cli-config > zod para 4.6.6; lock com SRI verificado. Nunca desabilitar npm audit; validar lock com npm ci antes de produção. Teste distingue 400 (responsável inválido) de 403 (campo bloqueado).
