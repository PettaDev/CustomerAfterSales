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


## 2026-10-15 — recuperação de rascunho e guia de coleta no celular (PR em revisão)

- Base: `main` em `90dfefa2785b0031cb7c4011305dbceb0caee8eb` (footer unificado em produção). Escopo só do cliente, não modifica `server/`, dashboard TFAE/Manager, autenticacão OTP, Neon ou evidências.
- `src/portal/customer-draft.ts`: grava somente no **sessionStorage da aba** por até 2 horas, com número da etapa, textos do formulário, modo de coleta e triagem de hardware. Nunca grava arquivos, IMEI/número de série, consentimento ou tokens; dados de contato eventualmente digitados ficam apenas naquela aba durante o prazo. O rascunho é limpo quando um caso real é criado, ou ao clicar em Descartar.
- `src/portal/CustomerFlowV2.tsx`: restaura o formulário automaticamente se voltar/recarregar na mesma aba; informa quando anexos precisam ser selecionados de novo. Links de ajuda/pontos de apoio continuam abrindo em outra aba para não perder os objetos File que ainda estão na memória.
- `src/portal/mobile-collection-guide.ts` prepara a sessão pública do guia pelo **modelo/marca e idioma** (sem dados do cliente). A seleção "Celular" apresenta CTA para `\/guide` e instrução de voltar e anexar ZIP/vídeo.
- `src/App.tsx` passa a montar o **GuideApp preexistente** em `/guide` (com as etapas Termux, Wi‑Fi/ADB, logger, evidências), em vez da página substituta. O assistente original usa o próprio shell e ainda não tem a mesma estrutura de footer visual do portal; homologar isso separadamente.
- `tests/customer-draft-mobile-guide.test.mjs` testa vencimento, limpeza, privacidade e ligação de rotas. Testes antigos que esperavam placeholder foram ajustados, sem apagar o alcance original.
- Riscos/gates: inspeção manual em celular real da navegação entre abas, retorno/reload na etapa 3, upload manual, modo navegador, hardware e quatro idiomas. **Arquivo selecionado nunca é recuperado após reload** por restrição/privacidade do navegador. Não fazer merge/deploy automático até CI e aceite.
