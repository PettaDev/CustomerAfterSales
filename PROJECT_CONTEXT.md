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
