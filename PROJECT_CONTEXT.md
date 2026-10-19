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


## 2026-10-19 — Perfil Manager: alteração de status de atendimento (Preview, não produção)

- Reclamação confirmada no dashboard: o login Manager mostrava "Acesso de acompanhamento" e não apresentava seletor de status, embora a pessoa responsável pelo projeto precise fazer a triagem. **Causa:** `CaseDetail` limitava todos os controles a `staffProfile.role === "tfae"` e o endpoint `PATCH /api/cases/:id` usava `requireTfae`, retornando 403 a Managers.
- **Decisão de menor privilégio:** Manager autenticado pode alterar **somente** `status` de um atendimento ativo entre `received`, `reviewing`, `awaiting_customer` e `resolved`. Prioridade, owner/atribuição, notas públicas, spam/duplicado/arquivamento, uploads de evidências e sessões técnicas permanecem exclusivos de TFAE. Estado de moderação não ativo bloqueia atualização por Manager.
- **Backend:** rota PATCH passou a `requireStaff` com verificação adicional após validação Zod: o payload bruto do Manager deve conter uma única chave `status`, sem extras (inclusive desconhecidas) nem operação vazia; demais papéis conservam suas permissões. A lógica de abertura/encerramento de janela de upload ao mudar de status continua existente. Evento de histórico grava `staffId`, `staffName`, `staffRole=manager` e data, como antes.
- **Frontend:** `src/portal/Cases.tsx` adiciona `canChangeStatus` para Manager/TFAE em casos ativos, mantendo `canEdit` exclusivo de TFAE para todos os outros controles. Aviso de Manager atualizado nas quatro traduções em `portal-ui-i18n.ts` para refletir a regra real.
- **Testes:** `tests/manager-role.test.mjs` verifica Manager status 200, outros campos 403, evento atribuído ao Manager, TFAE com função plena; exigir suite CI/build/security audit e Preview Vercel.
- **Escopo:** não alterar senhas, identificação da conta, configurações da Vercel, banco ou casos reais em testes. Base `main` `6f323b01c480e83412f6ab044b3973a130961c05`. Branch `fix/manager-case-status-permission-2026-10-19`. Não mesclar PR #42 (UX/TFAE) ou #43 (guide anterior). Validar com sessão Manager no Preview e caso sintético autorizado; **produção inalterada** até aprovação.


## 2026-10-19 — Diagnóstico: Preview versus Production (PR #46)

- **GitHub:** `main` `6f323b01c480e83412f6ab044b3973a130961c05` é ancestral da PR #46 (`a398223afe24a9e05c39fd9d246100c6801a7207`); `compare main...branch` retorna `behind=0`. Só mudam autorização de status Manager, UI, traduções, testes e este contexto. Layout, navbar, footer, guias, rotas e coleta da produção já estão presentes no código do Preview.
- **Vercel:** projeto único `customers-guide`, Production READY commit `6f323b01`; Preview READY da PR #46 commit `a398223a`. As configurações do projeto, código estático e rotas são compartilhadas pelo mesmo repositório.
- **Causa raiz da diferença funcional:** inspeção dos **targets** das variáveis (sem descriptografar valores) mostra `DATABASE_URL` e conexões `DATABASE_*`/Neon **somente Production**, assim como `STAFF_USERS_JSON`, `RESEND_API_KEY` e `AUTH_EMAIL_FROM`. Em Preview faltam esses serviços. Já estão compartilhadas entre Preview/Production as flags CASE_EMAIL_*, CASE_TRACKING_URL, BLOB_* e GOOGLE_GENERATIVE_AI_API_KEY. Em Vercel sem `DATABASE_URL`, `server/store.mjs` falha explicitamente com 503. Sem `STAFF_USERS_JSON`, o login corporativo não encontra perfis.
- **Segurança:** NÃO adicionar a URL do banco de produção ao Preview, nem copiar segredos ou replicar casos reais; uma alteração de status em Preview gravaria **no caso real** caso os ambientes compartilhassem `DATABASE_URL`. Variáveis criptografadas de produção não foram reveladas e nenhum registro de cliente foi lido ou alterado.
- **Próxima decisão necessária:** definir se o Preview deve ter uma base separada com dados fictícios/anonimizados (recomendado), ou se o responsável autoriza um escopo específico para dados reais com controles adicionais. Configurar credenciais de teste e envio de e-mail não produtivo separadamente e redeploy Preview após aprovação. Até lá a paridade visual de código está garantida, mas **a paridade operacional não**.


## 2026-10-19 — Preview sintético configurado, sem dados reais

- Usuário confirmou explicitamente: **testar com casos fictícios**, não usar os atendimentos reais.
- Neon: projeto separado `brte-preview-synthetic-2026` (ID `nameless-hat-28062363`, branch `br-noisy-paper-b8o8rayg`). Criado **vazio**, sem fork/clonagem ou cópia da base real. `records` com PK e índice `records_kind_idx`. Seeds inseridos: **cinco** atendimentos fictícios com prefixo `[TESTE]`, e-mails sob domínio reservado `example.test`, status: 2 received, 1 reviewing, 1 awaiting_customer, 1 resolved. Sem arquivos pessoais, fotos, IMEIs ou casos de clientes reais.
- Vercel projeto `customers-guide`: `DATABASE_URL` e `STAFF_USERS_JSON` adicionados como variáveis **sensitive com target exclusivamente Preview**. A variável existente `DATABASE_URL` com target **Production** foi mantida intacta. Nunca registrar DSN nem hash em documentação ou commit. `RESEND_API_KEY`/ `AUTH_EMAIL_FROM` não estão configurados em Preview; o login de teste utiliza fallback de senha nativo, sem envio de códigos pelo Resend.
- Identidades de teste: `manager.preview@example.test` (role manager, name "Manager BR - TESTE") e `tfae.preview@example.test` (role tfae, name "TFAE BR - TESTE"). Apenas hashes scrypt armazenados em Vercel; **senhas jamais no GitHub, documentação ou seed SQL**. Credenciais para teste devem ser transmitidas de forma privada ao responsável e rotacionadas após homologação.
- A aplicação exibe os mesmos layouts e rotas da `main`; a única diferença de código da PR #46 é habilitar update de status por Manager, preservando outras autorizações. Futuros deployments de Preview devem manter dados sintéticos e nunca apontar ao Neon da produção.
- Antes de publicar a PR #46 em produção: testar login e alteração de status de caso sintético, conferir isolamento, CI e auditoria. Produção continua com regra antiga até aprovação.
