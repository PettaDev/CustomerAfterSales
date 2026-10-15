# BRTE — ativar e-mail automático de confirmação de caso

**Implementação:** PR dedicada (sem alterações em Neon/Blob nem no login TFAE/Manager). **Padrão: desligado**. Confirmação só é solicitada ao provedor **após** o caso existir no banco. O e-mail contém protocolo + código privado. O servidor nunca grava o código em texto puro no banco: o acesso segue pelo hash existente.

## Quando voltar: configurar com segurança

1. Acesse [Resend → Domains](https://resend.com/domains). Confirme que o subdomínio remetente do BRTE (por exemplo, `mail.brteportal.com.br`) está **Verified**, com os registros SPF/DKIM correspondentes ativos. Consulte DMARC do domínio e o histórico de e-mails em Junk/Spam; configurar o recurso **não garante Inbox**. Escolha um endereço remetente sob esse domínio, por exemplo `BRTE <atendimento@mail.brteportal.com.br>`. Não é necessário criar uma caixa de entrada se apenas enviar e não receber respostas; se precisar responder, configure uma caixa real e o suporte adequadamente.
2. Na Vercel → Projeto `customers-guide` → **Settings → Environment Variables**, configure **Production**:
   - `CASE_EMAIL_FROM` = `BRTE <atendimento@mail.brteportal.com.br>` (use um remetente verificado)
   - `CASE_TRACKING_URL` = `https://brteportal.com.br/tracking`
   - `CASE_EMAIL_ENABLED` = `false` durante o primeiro deploy/teste de fumaça sem e-mail; somente mude para `true` quando estiver pronto.
   - `RESEND_API_KEY` já é usada pelo OTP da equipe: verifique se a credencial está configurada em Production e autorizada a enviar pelo domínio escolhido. **Nunca exponha a chave aqui, em prints ou no repositório.**
   - **Não** modifique `AUTH_EMAIL_FROM` nem `AUTH_ALLOW_PASSWORD_FALLBACK` para esta funcionalidade. São controles independentes do login interno.
3. Guarde uma conta de e-mail de teste sob seu controle. Execute a mudança de variáveis para `CASE_EMAIL_ENABLED=true` apenas após revisar/aprovar a PR, confirmar o deploy e preparar o teste. Alterações de variáveis na Vercel **exigem novo deployment** para alcançarem as funções em execução; faça Redeploy da mesma versão e confirme que o deployment de produção está READY.
4. Crie **um caso de teste autorizado** pelo formulário público com dados fictícios e seu e-mail controlado. Confirme: (a) aparece `CAS-...`, token de acompanhamento e mensagem adequada, (b) o e-mail chega, possivelmente na pasta Spam/Outros, (c) protocolo e código do e-mail abrem `/tracking`, (d) não são enviadas informações sensíveis desnecessárias.
5. Na [Resend → Emails](https://resend.com/emails), confira eventos `delivered`, `bounced`, `complained`, `suppressed`. **Accepted/Sent é apenas aceite do provedor, não entrega em Inbox**. A função imprime somente ID opaco do envio, status HTTP e provedor nos logs; nunca código, destinatário ou API key.
6. Teste uma falha controlada usando Preview isolado, se necessário. Se o e-mail falhar, o atendimento deve continuar com `HTTP 201`, protocolo e código visíveis para copiar. Não há endpoint de reenvio público porque o token permanece apenas em hash no banco, e o reenvio exigiria um fluxo separado de verificação de identidade.
7. Valide TFAE/Manager, criação de casos de hardware/software, anexos, tradução pt-BR/en/es-419/zh-CN, dispositivos móveis e o domínio principal antes de liberar. Guarde o SHA aprovado/deployment anterior para rollback.

## Controles de segurança e comportamento

- **OFF por padrão**. Requer `CASE_EMAIL_ENABLED=true`, `CASE_EMAIL_FROM`, `RESEND_API_KEY` e URL HTTPS válida.
- A senha/código de cliente é privada e está no **corpo do e-mail** (não na URL); lembre ao cliente de não encaminhar. Nunca a inclua em assunto, link, log, analytics ou webhook.
- O corpo do e-mail é **apenas texto** e contém somente dados mínimos. Um cadastro ilegítimo com o e-mail de terceiro poderia disparar uma confirmação; já existem limites atômicos de criação de casos/IP e dados do cliente no app-enhanced. Monitore abuso.
- O e-mail é solicitado uma vez por criação de caso; o cabeçalho de idempotência usa o ID de caso para reduzir duplicatas se uma solicitação for repetida.
- Resend indisponível: status `failed` no HTTP 201 e na tela; caso **não é revertido**. Ausência de configuração: status `disabled`; sucesso de API de envio: `accepted` (não significa entrega).
- O e-mail pode ser aceito antes do término do upload de evidências porque a criação do caso antecede os uploads. Informe ao cliente para permanecer na página enquanto os anexos são enviados.
- Não inclua dados reais ou código de cliente em capturas de tela, tickets públicos ou mensagens a outros funcionários.

## Como desligar rapidamente

Na Vercel, altere `CASE_EMAIL_ENABLED=false` e faça novo deployment/redeploy de produção. O fluxo de criação de caso e o OTP da equipe continuam disponíveis. **Não** exclua o caso nem os arquivos do Neon/Blob para corrigir problemas de e-mail.

## Arquivos da mudança

- `server/case-email.mjs`: conteúdo, configuração, integração Resend e falha sem bloqueio.
- `server/app-enhanced.mjs` e `server/app.mjs`: chamam envio após `db.put` e retornam o status sem incluir a língua de envio no registro persistido.
- `src/portal/CustomerFlowV2.tsx`, `src/portal/portal-i18n.ts`: confirmação no fluxo e mensagens traduzidas.
- `tests/customer-case-email.test.mjs`: testes de padrão desativado, quatro idiomas, privacidade, idempotência, falha e persistência.
- `.env.example` e `PROJECT_CONTEXT.md`: guia de ativação e continuidade.

**Não publicar em produção sem autorização**, CI e teste controlado do remetente.
