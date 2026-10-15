# PROJECT_CONTEXT — BRTE Portal / CustomerAfterSales

> **Última atualização:** 2026-10-15 (America/Sao_Paulo)  
> **Objetivo:** transferir o contexto técnico entre conversas/agentes sem reimplementar funcionalidades estáveis.  
> **Projeto:** [PettaDev/CustomerAfterSales](https://github.com/PettaDev/CustomerAfterSales) · branch de referência: `main` · SHA auditado: `51f85231d7a344cca78a123902c5e6a480360679`.  
> **Condição:** este registro documenta o estado **observado**, não equivale a homologação completa.

## 1. Propósito e fluxos

BRTE / Customer After-Sales é um portal multilíngue de atendimento técnico pós-venda para dispositivos TRANSSION (Infinix, TECNO, itel), com triagem software/hardware, coleta de evidências, acompanhamento do caso e operação interna TFAE/Manager.

1. **Cliente:** seleciona marca/dispositivo e tipo de problema, descreve a ocorrência, escolhe coleta manual ou assistida, envia evidências e informações/consentimento, obtém protocolo e código privado para acompanhar o caso.
2. **Software:** arquivo manual no próprio celular ou coleta pelo navegador/PC quando compatível; captura avançada pode envolver logs, ADB e vídeo.
3. **Hardware:** coleta separada de fotos/vídeos, checagens de segurança, dados opcionais de garantia e encaminhamento adequado; não prometer aprovação de garantia.
4. **TFAE:** autentica-se, acompanha fila, assume/atribui casos, faz triagem, atualiza status/prioridade, solicita informações, avalia evidências.
5. **Manager:** visualiza casos/equipe/histórico sem permissão de escrita operacional.
6. **Conteúdo público:** Central de Ajuda, guias, pontos de apoio, políticas e acompanhamento.

## 2. Stack e arquitetura existentes — preservar

- **Frontend:** React 19 + TypeScript + Vite, React Router, i18next, CSS existente e temas das marcas.
- **Backend:** Node.js (documentação e CI usam 24) + Express 5, adaptador serverless via `api/index.mjs`, aplicativo em `server/app.mjs`.
- **Banco:** PostgreSQL/Neon em produção; desenvolvimento pode usar SQLite/local. Armazenamento inicial flexível em `records(id, kind, data)`, com migrações SQL versionadas. Não presumir que uma branch Neon é a mesma usada em produção.
- **Evidências:** objeto privado via Vercel Blob ou S3 compatível, conforme ambiente; upload/download autenticados; os arquivos **não** são protegidos por backups do banco.
- **Bridge local:** `bridge/core.mjs` e `bridge/server.mjs`, ADB/scrcpy/logger por plataforma; USB é acessado localmente, nunca por uma API cloud diretamente.
- **Idiomas dos fluxos ativos:** pt-BR, en, es-419, zh-CN. O repositório contém ainda traduções/recursos para outros idiomas nos guias legados.
- **Theme:** preferência claro/escuro no cliente; marca não deve determinar o logger técnico. Ver `docs/DECISIONS.md` para ADRs.

### Mapa de código

| Objetivo | Arquivo(s) principal(is) |
| --- | --- |
| Entrada/roteamento e navegação | `src/App.tsx`, `src/main.tsx` |
| Atendimento ao cliente | `src/portal/CustomerFlowV2.tsx`, `HardwareCollection.tsx`, `TrackedBrowserCapture.tsx` |
| TFAE, Manager, login OTP e tracking | `src/portal/Cases.tsx`, `src/portal/api.ts` |
| Textos traduzidos | `src/portal/portal-ui-i18n.ts`, `portal-i18n.ts`, `src/locales/` |
| Estilos frontend | `src/portal/portal.css`, `public/brte-site.css`, `public/brte-help-improvements.css` |
| Backend HTTP / autorização | `server/app.mjs`, `server/security.mjs`, `server/staff.mjs` |
| OTP e provedor de e-mail | `server/email.mjs`; endpoints de auth em `server/app.mjs` |
| Persistência / uploads | `server/store.mjs`, `server/storage.mjs`, `sql/`, `migrations/` |
| Bridge | `bridge/core.mjs`, `bridge/server.mjs`, `docs/SUPPORT_BRIDGE.md` |
| Ajuda estática e pontos de apoio | `public/ajuda/`, `public/pontos-de-apoio/` |
| Testes e CI | `tests/*.test.mjs`, `.github/workflows/ci.yml`, `package.json` |

## 3. Implementado versus validado

**Já existe no código:** separação software/hardware, fluxo de cadastro, upload e token do cliente, rastreamento, dashboard TFAE/Manager, validações de permissão server-side, autenticação por código de e-mail, opção de sessão confiável, traduções ativas, Bridge, controles de abuso atômicos e testes automatizados.

**Não confundir com homologação E2E:** a existência de endpoints/testes e um deployment `READY` não demonstra que o envio real de OTP, WebUSB + Android físico, uploads completos, recovery e fluxos de usuários estejam aprovados na produção.

## 4. Estado verificado em 2026-10-15

- `main` examinada em `51f85231d7a344cca78a123902c5e6a480360679`.
- Último commit integra **ajustes de contraste claro/escuro no site** e **UX verídica do OTP**: mensagem de “verifique seu e-mail” (sem garantia falsa de entrega), cooldown de reenvio, identificador opaco do e-mail aceito pelo Resend nos logs sem imprimir destinatário/código/chave, e testes de regressão em `tests/sitewide-contrast-otp-delivery.test.mjs`.
- Commit anterior `810c625a18d656218926e524689e64078fde61d4` incluiu ajustes no fluxo OTP/limites e testes; conferir o diff antes de qualquer alteração nessas áreas.
- A listagem Vercel informou o deployment de **produção** `dpl_Af5R4NzPvg9fv4Zn3HUCmXXHptNF` como `READY`, com SHA `51f85231...` no projeto `customers-guide`. `READY` refere-se ao deploy/build, **não** a aceite de runtime.
- O acesso a detalhes do projeto/deployment e a consultas de logs/erros Vercel retornou **403/404** pela integração disponível. A saúde do endpoint público `/api/health` e a entrega efetiva de OTP **não foram reverificadas nesta sessão**.
- O contexto da sessão anterior relatou banco Neon/Blob e staff configurados e `/api/health` com `ok:true`, porém esses fatos precisam ser reconfirmados no ambiente real e não devem substituir nova evidência de aceite.
- Domínio personalizado informado pelo responsável: `brteportal.com.br`; DNS, HTTPS, vínculo com deployment e comportamento do domínio **não verificados nesta sessão**.
- PRs **#27** e **#28** permanecem abertos, `mergeable:false` na inspeção: são trabalhos de estabilização e da Central de Ajuda que podem estar desatualizados frente à `main`; revisar/rebasear sem sobrescrever mudanças integradas. Não realizar merge automático.
- CI presente com `npm ci`, `npm run lint:ci`, audit de dependências, `npm test`, `npm run build`. **GitHub Actions confirmou `success`** para o SHA `51f85231...`: [execução do CI](https://github.com/PettaDev/CustomerAfterSales/actions/runs/38703616284). **Nenhuma execução local de teste/build foi realizada nesta sessão**, pois o ambiente disponível não conseguiu acessar o clone remoto.

## 5. Próxima tarefa a continuar: validar contraste e OTP em produção/Preview

### P0 — entrega do OTP/Resend (ainda pendente)

1. Inspecionar a versão implantada e os nomes/configuração **sem expor segredos**: `STAFF_USERS_JSON`, `RESEND_API_KEY`, `AUTH_EMAIL_FROM`, `AUTH_ALLOW_PASSWORD_FALLBACK` e projeto/ambiente corretos.
2. Em conta de teste **autorizada** e caixa de e-mail controlada, pedir um OTP só uma vez. Registrar horário, ambiente, resposta HTTP, comportamento do cooldown e ID opaco devolvido nos logs do backend (sem registrar código/endereço).
3. Correlacionar esse ID na Resend Events/Logs: **accepted/sent** não é sinônimo de **delivered**; verificar `delivered`, `bounced`, `complained`, supressões e domínio remetente.
4. Validar recebimento em inbox/spam, expiração do código, invalidação após uso, limite de tentativas, “reenviar” após cooldown, acessos de TFAE/Manager e logout.
5. Se falhar, coletar metadados sanitizados e corrigir **a menor unidade responsável** (`server/email.mjs`, rota auth ou painel), com teste de regressão. Não enfraquecer rate limits nem habilitar credencial de contingência para contornar problemas.
6. No momento, consultar logs está bloqueado por permissões da integração; requer acesso operacional apropriado no Vercel/Resend ou evidências compartilhadas sem conteúdo sensível.

### P0 — auditoria visual real (ainda pendente)

- Inspecionar **claro e escuro** e transições após seleção de marca/idioma em: home, formulário software, formulário hardware, escolha de coleta, tutorial, tracking, dashboard TFAE/Manager, login OTP, ajuda, pontos de apoio e políticas.
- Executar em 320/375/430 px e desktop, incluindo Edge/Chrome, teclado/foco e textos longos de pt-BR/en/es-419/zh-CN.
- Verificar contraste WCAG AA no **estilo computado**, foco visível, disabled/hover, indicadores/status, modais e tabelas. Testes atuais verificam pares CSS selecionados; não provam todas as telas renderizadas.
- Criar correções CSS/componentes **pontuais** com regressões. Não substituir toda a interface.

### Outras pendências e gates de release

- E2E sintético de caso, protocolo/token, segurança por função, upload/retry/download privado e permissões Manager.
- Testar USB/ADB/Bridge/scrcpy no hardware real (incluindo falhas/desconexões e plataformas SoC).
- Plano completo de backup/restore de **DB + Blob/S3 + deployment**, com evidência de recuperação sem perder cliente.
- LGPD: aprovação de políticas, controlador, retenção/eliminação, processos de incidentes, dados em logs/arquivos.
- Homologar base oficial de lojas e serviços antes de sugerir assistência autorizada.
- Revisar PRs #27/#28, vulnerabilidades, regressões, performance, métricas privadas e hardening contra arquivos maliciosos antes de expansão nacional por QR Code.

## 6. Invariantes de segurança e manutenção (obrigatórios)

- **Nunca** executar `DROP`, `TRUNCATE`, `DELETE` em dados de clientes nem apagar evidências por conveniência. Não resetar banco.
- Antes de modificar backend persistente, banco, permissões ou uploads, identificar **projeto Neon/branch/ambiente corretos**, snapshot de banco validado, inventário e backup de arquivos independente, SHA do código, deployment anterior e rollback real.
- Não alterar produção nem mesclar `main` automaticamente. Usar branch isolada/PR com CI e aceite.
- Não sobrescrever rotas, fluxos, CSS de temas ou componentes funcionais sem reproduzir bug e medir regressões.
- Nunca incluir `.env`, tokens, IMEIs, OTPs, logs privados ou e-mails pessoais em commits, relatórios, mensagens públicas ou testes.
- Sempre distinguir `implementado`, `testado automaticamente`, `validado em Preview` e `homologado em produção`.

## 7. Registro desta retomada

- Contexto documentado na branch `docs/project-context-2026-10-15`, proposto no [PR #34](https://github.com/PettaDev/CustomerAfterSales/pull/34) (**draft**). Nenhuma alteração de código, base de dados ou produção.
- Alterações do PR devem ser revisadas antes do merge na `main`; merge/promoção **não** são autorizados implicitamente por este registro.

## 8. Rotina de continuação entre conversas

1. Ler primeiro este arquivo, depois `README.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/BRTE_GOLIVE_AND_ACCEPTANCE_2026-10-14.md` e os commits recentes.
2. Consultar `main`, PRs abertos, branch de trabalho, SHA e deployment atual. Não confiar apenas na data deste arquivo: se SHA mudou, revalidar.
3. Registrar tarefa atual, hipótese, arquivos relevantes, comportamento observado, comandos/testes, riscos de dados e eventual bloqueio.
4. Criar branch de trabalho a partir da base validada; fazer alterações mínimas; rodar `npm ci`, `npm run lint:ci`, `npm test`, `npm run build` e auditoria antes de propor merge.
5. Atualizar **PROJECT_CONTEXT.md** em toda conclusão/mudança arquitetural ou antes de encerrar a conversa, com data, SHA, resultado, nova pendência e link para o PR/deploy. Não descrever como concluído algo sem evidência.

### Referências

- [Architecture](docs/ARCHITECTURE.md) · [Decisions](docs/DECISIONS.md) · [Production acceptance](docs/BRTE_GOLIVE_AND_ACCEPTANCE_2026-10-14.md)
- [Neon production bootstrap](docs/BRTE_NEON_PRODUCTION_BOOTSTRAP_2026-10-15.md) · [Atomic limits](docs/BRTE_P0_ATOMIC_RATE_LIMITS_2026-10-15.md)
- [UX audit](docs/UX_PRODUCTION_AUDIT.md) · [Release plan](docs/BRTE_RELEASE_PLAN_2026-10-14.md)
- [PR #27](https://github.com/PettaDev/CustomerAfterSales/pull/27) · [PR #28](https://github.com/PettaDev/CustomerAfterSales/pull/28)
