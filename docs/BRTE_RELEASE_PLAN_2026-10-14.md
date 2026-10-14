# BRTE — Registro de recuperação e plano de liberação

Data de referência: 14/10/2026. Somente desenvolvimento isolado, sem alteração na produção.

## Backup e identificação

- Código fonte original no commit 8bae3a182dea7ea1755be04a85a8d6277e405dbe.
- Branch de referência: backup/pre-brte-hardening-2026-10-14.
- Branch de trabalho: feat/brte-hardening-help-center-2026-10-14.
- Projeto Neon: cold-brook-36220874, branch principal br-icy-waterfall-ack8rpq1.
- Snapshot por branch Neon: backup-before-brte-hardening-2026-10-14, id br-nameless-math-aclff15l. Branch confirmada em estado ready.
- Contagens lidas no banco principal: 8 auth, 6 case, 7 event, 41 evidence, 8 rate = 70 registros.
- Não houve DELETE, TRUNCATE ou DROP. Não houve exclusão no storage.

**IMPORTANTE:** a branch Neon preserva apenas estado do banco, não equivale a backup completo de arquivos Blob/S3 nem substitui um teste de restauração integral.

## Infraestrutura pendente
A conexão Vercel reconhece a equipe gustavoteixeira0210-9521s-projects, porém leitura de projeto/deployments retorna 403/404. Sem essa integração não é possível confirmar logs, variáveis (sem ler segredos), funções, disponibilidade e release.

## Patch proposto
- Revalidação da identidade/role ativo em sessão staff.
- Endpoint de sessão de captura e conclusão de evidência não aceita escrita de Manager sem token válido de cliente.
- Testes de regressão do Manager e usuário removido.
- Central de ajuda pública com HTML estático, 5 guias gerais, busca, sitemap e link ao formulário.
- Regras de roteamento específicas para servir os arquivos HTML antes do fallback SPA.
- Headers básicos contra clickjacking.

## Bloqueadores de go-live
1. Acesso ao Vercel, estado de deploy, build, logs e API health.
2. Testes de upload real, download seguro, banco, e-mail, autenticação e fluxo E2E.
3. Verificação de conteúdo, segurança de uploads e retenção de evidências.
4. Rate limit atômico e controle de abuso; revisar código de carregamento remoto no WebUSB.
5. Concluir políticas de privacidade, cookies, operação LGPD (ver docs/LEGAL_BRTE_DRAFT.md).
6. Corrigir lint legado e torná-lo obrigatório, verificar dependências e CVEs.
7. Validar Edge + Android real e fluxos sem suporte USB.
8. Aprovação de conteúdo técnico antes de publicar Jiras/Quick Responses como problemas conhecidos.
9. Criar backup de storage, verificar recuperação integral e plano de rollback do deployment.
10. Validar páginas estáticas no ambiente Preview, inclusive resposta HTML a Googlebot.

## Limpeza do banco
O pedido de limpar para preservar não distingue descarte irrevogável dos registros atuais de criação de ambiente de homologação vazio. Por isso, não executar qualquer remoção do banco de produção até confirmar o objetivo. O caminho seguro é um banco de homologação separado, com somente dados sintéticos.

## Critério objetivo de liberação
Todos os fluxos P0 aprovados com casos fictícios; Manager não escreve; arquivos ficam privados; autenticação, estado e recuperação comprovados; release testado em Preview; rollout e rollback documentados. Nenhum passo acima está marcado como concluído sem evidência.
