# BRTE — Estabilização, homologação e recuperação
**Data:** 14/10/2026 · **Ambiente de desenvolvimento:** `feat/brte-full-release-candidate-2026-10-14` · **PR:** #27

## Objetivo operacional
O usuário encontra orientação no Q&A → avalia a utilidade → se não houver resolução, abre atendimento com evidências → o TFAE analisa e registra a ocorrência → o cliente acompanha o caso. Se não puder coletar sozinho, consulta um local de apoio previamente cadastrado, sem assumir que seja um centro de reparo autorizado.

## Pontos de restauração criados antes das alterações
- Git main (referência congelada): `backup/brte-main-before-full-hardening-2026-10-14` no SHA `2a1af2dceb522e8f98f726b0f2a70fe773b1aebd`.
- Git produção (código da última implantação no domínio): `backup/brte-live-deploy-5adb9fa-2026-10-14` no SHA `5adb9fa43030ecf311ede0ed4c7384dac784f862`.
- Vercel: deployment `dpl_5k8fYQTHJMgaqV1nAUDfqLN9aWR9` mantido como ponto de retorno.
- Neon: backup lógico por branch `backup-brte-before-full-hardening-2026-10-14` (`br-red-salad-accjvcw6`) criado a partir da branch `br-icy-waterfall-ack8rpq1`. Estado READY.
- Inventário base: 70 registros no DB Neon principal (8 auth, 6 case, 7 event, 41 evidence, 8 rate). Verificar contagem novamente antes de qualquer plano de exclusão.

**Limitação:** branch Neon não faz backup dos objetos Vercel Blob ou S3. Nunca anunciar recuperação integral, não apagar banco nem blobs sem inventário e restore de ponta a ponta.

## O que foi implementado na branch
- Rate limits atômicos em PostgreSQL para criação de atendimento, tentativas de acesso, OTP, evitando contagem perdida entre instâncias serverless. SQLite local permanece como fallback exclusivo fora da Vercel.
- Q&A com busca por sintomas, filtros de categoria em PT/EN/ES/ZH, resultados acessíveis, artigos SEO estáticos e feedback opcional, protegido contra repetição.
- API de métricas agregadas do Q&A restrita a equipe autorizada e painel TFAE de utilidade por artigo. Não registrar nomes, IP em claro ou conteúdo do cliente nessas avaliações.
- Localizador de lojas alimentado por `public/pontos-de-apoio/locations.json`, com filtros de estado, marca e localização e fallback estático para a loja atualmente informada. Serviços desconhecidos não são inferidos; novas lojas exigem dados oficiais.
- Correlação de erros HTTP 5xx por `X-Request-ID`, logs sem tokens, detalhes dos casos ou dados pessoais.
- Scripts locais **não destrutivos**: `npm run check:stores`, `npm run verify:preview` e `npm run retention:dry-run`.
- Testes de regressão e controles de CI atualizados.

## Critérios de publicação P0 (obrigatórios)
1. CI verde no SHA exato, `npm ci`, testes, build, auditoria de dependências produção e `npm run check:stores`.
2. Deploy de Preview READY do mesmo SHA; testar navegador Edge em desktop e mobile com temas claro/escuro e quatro idiomas.
3. Associar Vercel `customers-guide` a Neon PostgreSQL e Vercel Blob privado (ou S3 corretamente configurado), bem como login interno/Resend. Comparar **presença** das variáveis por ambiente; nunca compartilhar valores.
4. Rodar `BRTE_BASE_URL=https://... npm run verify:preview` com acesso autorizado. O check GET é não destrutivo; exige `/api/health` DB ready, storage configured, staff auth ready.
5. E2E de atendimento **fictício**: novo caso, protocolo, upload de arquivo sintético, conclusão, TFAE autorizado, evidência privada, acompanhamento e logout.
6. Realizar testes Edge + Android: um dispositivo MediaTek e, se possível, UNISOC/Qualcomm, incluindo autorização ADB, interrupção de cabo, offline e reinício.
7. Validar armazenamento privado contra MIME inconsistente, arquivos nocivos, permissão de evidências, duração de links e varredura segura. Risco de scripts de terceiros em WebUSB requer tratamento específico antes de escalonar coleta pública.
8. Políticas de Privacidade e Cookies do PR #26 ainda possuem avisos de rascunho/`noindex`. Exigem validação jurídica, contato institucional, legítimo interesse e regras de retenção executadas; não remover aviso por conveniência.
9. Confirmar backups de **banco + objetos de evidência** com restore isolado. Definir plano de incidentes e responsável por escalonamento.
10. Aprovação das lojas por Trade Marketing/After-sales quanto a endereço, horário, fotos, disponibilidade e serviços, antes de encaminhar o público presencialmente.

## Como testar sem dados reais
- Não usar nomes, números de telefone, IMEI, e-mails ou vídeo de clientes reais durante homologação.
- Isolar banco/storage Preview do ambiente Production antes de enviar arquivos de teste.
- A verificação automatizada da saúde usa somente GET, sem criar registros.
- Para análises de retenção, configurar variáveis de **proposta aprovada** e rodar `npm run retention:dry-run`. Este script calcula quantidades anônimas e **nunca** exclui nada.

## Recuperação e rollback
**Código:** reverter o merge ou publicar novamente o SHA preservado; backup Git não remove novos tickets que apareceram depois. **Vercel:** promover/reverter para `dpl_5k8fYQTHJMgaqV1nAUDfqLN9aWR9` somente após checar as configurações associadas ao deployment. **Neon:** restaurar branch ou snapshot só como parte de um procedimento coordenado; uma restauração global descuidada perde casos criados depois do backup e diverge do storage. **Blob/S3:** precisa backup independente e verificação de restauração.

Pós-rollback: testar `/api/health`, abrir página, validar endpoint de casos em modo controlado e conferir integridade/consistência das evidências.

## Fases seguintes
- **P1:** normalização de conteúdo conhecido aprovado (modelo/build, status de investigação, workaround aprovado), SEO por idioma, filtros por modelo/operadora, métricas de taxa de resolução e tempo de triagem.
- **P1:** limitação mais forte de conteúdo de uploads: identificação real, análise segura, antivírus/quarentena e retenção/revogação de tokens.
- **P2:** dashboard com tendências por modelo/build/operadora, organização nacional de lojas e sincronização validada com JIRA, respeitando RBAC e LGPD.

## Pendências exclusivamente humanas
- Gestor regional: lista de lojas **reais** com autorização para divulgar e respectivos serviços.
- Jurídico/controlador: validar responsável, DPO, transferências e prazos de retenção.
- Administrador Vercel/Neon: conectar ambiente de testes isolado com DB + storage + email, sem compartilhar segredos no chat.
- TFAE/testador: Edge + aparelho Android real e arquivos de exemplo não pessoais.
- Gestor de qualidade: confirmar os bugs autorizados para publicação e o procedimento de revisão editorial.

**Recomendação:** não promover para produção até todos os itens P0 terem evidência de aprovação. Um build READY prova compilação, não prova disponibilidade real de banco, storage nem serviço de garantia.
