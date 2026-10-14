# BRTE — Plano de homologação e melhoria contínua
Data: 2026-10-14. Alterações em desenvolvimento; não equivale a certificação de produção.

## 0. Recuperação e segurança de mudanças
- Git main base: `2a1af2dceb522e8f98f726b0f2a70fe773b1aebd`.
- Backup Git: `backup/brte-main-2026-10-14-pre-improvements`.
- Branch de trabalho: `feat/brte-support-optimization-2026-10-14`.
- Backup de banco solicitado no Neon: `backup-brte-pre-optimization-2026-10-14` (branch ID `br-rough-wave-ac4klfme`; verificar estado `ready` e testar leitura antes de qualquer operação de recuperação).
- Backups Neon não abrangem arquivos armazenados em Blob ou S3. Fazer inventário e backup separado antes de alterar evidências.
- Produção Vercel listada anteriormente: `5adb9fa43030ecf311ede0ed4c7384dac784f862`. Confirmar novamente antes de promoção.
- **Não realizar DELETE/TRUNCATE/DROP em casos de clientes** nem publicar documentos internos.

## 1. Entregas de baixo risco nesta branch
- Central de Ajuda: filtros por categoria + contador de resultados; busca permanece.
- Guias: checklists pessoais de 4 passos em cada artigo, sem coleta ou envio de respostas; CTA existente abre caso com sintoma.
- Testes automatizados guardam comportamento básico, links, privacidade do checklist e recursos de acessibilidade.

## 2. Gatilhos bloqueantes (P0)
### Backend e armazenamento
- [ ] `GET /api/health` retorna HTTP 200, `ok:true`, DB acessível, storage configurado, staff auth pronta **na produção real**.
- [ ] Criar caso fictício com dados não pessoais; guardar protocolo e token.
- [ ] Confirmar consulta ao caso por token, rejeição sem token, autorização por função.
- [ ] Testar envio de imagem/vídeo sintético, upload interrompido e nova tentativa.
- [ ] Verificar bytes, tipos de mídia, acesso privado e download por usuário autorizado.
- [ ] Rejeição de upload não permitido e tratamento de erros em UX.
- [ ] Verificar OTP do staff por e-mail e revogação de sessão; Manager sem escrita.
- [ ] Revisar dependências e rodar npm audit, lint, test e build no SHA exato da versão.
- [ ] Backup e restauração integral documentada: DB + evidências + deployment. Não presumir que restore de DB restaura Blob/S3.
- [ ] Identificar e solucionar quaisquer achados críticos/altos remanescentes no relatório de auditoria anterior.

### Coleta real por hardware
- [ ] Validar Edge desktop e Android real em versão/soc conhecidos (pelo menos MediaTek e UNISOC; Qualcomm conforme cobertura).
- [ ] Sem dispositivo, USB não autorizado, dispositivo offline, múltiplos aparelhos conectados.
- [ ] Captura normal, cancelamento, desconexão, reinício e retomada, ZIP completo.
- [ ] Gravação de vídeo e logs apenas mediante ação e ciência do cliente.
- [ ] Orientar desligar USB Debugging depois do suporte.

### Proteção de dados
- [ ] Confirmar CNPJ e identidade efetiva do controlador, responsável/DPO formal, contato público.
- [ ] Concluir inventário de cookies no domínio real para cliente e equipe interna.
- [ ] Aprovar hipóteses legais e processadores, locais de transferência internacional, política de retenção.
- [ ] Implementar exclusão verificável (DB, storage, logs e backups, observando exceções legais).
- [ ] Confirmar conteúdo definitivo das políticas no idioma efetivamente oferecido ao cliente.

## 3. Base de conhecimento e SEO (P1)
- [ ] Publicar somente problemas confirmados e aprovados; separar *em investigação*, *solução temporária* e *corrigido*, com revisão e data.
- [ ] Formular taxonomia com marca, modelo, build, operadora, país e sintomas; preservar anonimato dos clientes.
- [ ] Criar páginas localizadas por idioma com URLs estáveis e `hreflang`, se SEO internacional for aprovado.
- [ ] Submeter sitemaps ao Search Console e verificar indexação sem publicar dados privados.
- [ ] Instrumentar métricas de eficácia de forma agregada e juridicamente revisada; não enviar conteúdo de diagnóstico sem autorização.
- [ ] Não afirmar que feedback foi registrado no servidor quando apenas salvo localmente.

## 4. Rede de lojas — cadastro nacional (P1)
Campos mínimos da base oficial: `id, brand, name, type, officialAuthorization, address, neighborhood, city, state, zip, contact, hours, availableServices, lastVerifiedAt, verifiedBy, photos, accessibility`.
- [ ] Confirmar cada endereço com gerente regional e ponto de contato.
- [ ] Separar lojas comerciais, coleta de logs e assistência autorizada.
- [ ] Não exibir "reparo em garantia" até confirmação por pessoa autorizada.
- [ ] Filtro cidade/estado/CEP, mapa e instruções de ida conforme expansão real da base.
- [ ] Procedimento para revogar cadastro e informações desatualizadas.
- [ ] Obter fotos com autorização para publicação.
- [ ] Ponto atual (Galeria Pagé) permanece identificado como cadastro inicial, não centro autorizado por inferência.

## 5. Qualidade e indicadores
- Conclusão de reports: casos criados / fluxos iniciados (contagem anônima agregada, após aprovação).
- Taxa de resolução Q&A: somente se o cliente confirmar explicitamente; não inferir pelo abandono.
- Qualidade de evidências: casos com build + passos + log/artefato utilizável.
- Tempo de triagem: evento de criação até primeira decisão do TFAE.
- Taxa de erros: falhas 4xx/5xx, falhas de upload, latência e indisponibilidade.
- Definir SLA por tipo/área e responsáveis; não anunciar datas de correção sem autorização.

## 6. Promoção, rollout e rollback
1. Fazer merge do PR de idiomas/políticas (#26) somente após revisão, ou rebasear integrações sem perder mudanças.
2. Integrar este PR em preview atualizado da mesma base de código, rodar CI.
3. Validar endpoints e E2E com dados fictícios, usuários e aparelhos apropriados.
4. Backup/recovery DB + Blob e conservar deployment anterior.
5. Promover apenas SHA testado e observar erros e uploads após lançamento.
6. Se taxas de erro subirem, executar rollback ao deployment anterior e isolar writes/migrações.
7. Rollback de Vercel não reverte automaticamente dados de banco: planejar migrações reversíveis.

## 7. Dados que precisamos do dono/empresa
- Autorização e configuração do projeto Vercel (env secrets nunca enviados por chat), Neon e storage privado.
- Conta TFAE/Manager fictícia, e-mail de OTP controlado, acesso a logs de runtime.
- Android físico e Edge em máquina compatível para executar matriz ADB.
- Lista oficial de lojas/centros, contatos e serviços autorizados.
- Aprovação jurídica das políticas, retenção, transferências e consentimento.
- Confirmação de domínio corporativo e responsáveis de incidentes/monitoramento.

**Estado de aceitação:** este checklist não substitui execução comprovada. Nenhum item não verificado pode ser considerado aprovado.
