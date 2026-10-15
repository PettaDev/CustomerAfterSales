# BRTE — Política de Privacidade e Política de Cookies
**Versão de trabalho 1.0 · 14/10/2026 · Para revisão jurídica e operacional antes da vigência.**

## Dados institucionais informados
- Entidade/razão social informada: **Transsion Holdings AfterSales**
- CNPJ informado: **63.920.932/0001-72** (dígitos verificadores matematicamente válidos, sem confirmação cadastral de titularidade)
- Responsável pelo canal informado: **Gustavo Teixeira de Petta**
- E-mail: **gustavo.petta@transsion.com**
- Site: **https://customers-guide.vercel.app/**
- Nome da plataforma: **BRTE After-Sales / Transsion**
- Formalização da entidade controladora e designação de encarregado: **a validar**. Não presumir que responsável operacional equivale a encarregado formal.

## Documentos voltados aos clientes (PT-BR)
- `public/privacy/index.html` → `/privacy/`
- `public/cookies/index.html` → `/cookies/`
- Ambos usam o mesmo cabeçalho do BRTE, tema claro/escuro, navegação e `mailto:` para contato.
- Ambos permanecem marcados **"Documento preliminar"** e **noindex,follow**. Remover apenas após aprovação corporativa e implantação dos procedimentos descritos.

## Referências normativas usadas
- LGPD (Lei nº 13.709/2018), especialmente arts. 6º, 7º, 9º, 16, 18, 33 e 46, conforme aplicáveis.
- ANPD: Guia Orientativo Cookies e Proteção de Dados Pessoais.
- ANPD: Direitos dos titulares e Guia de Legítimo Interesse.
Links:
- https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia_orientativo_cookies_e_protecao_de_dados_pessoais
- https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1/direito-dos-titulares
- https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-lanca-guia-orientativo-sobre-legitimo-interesse

## Proposta inicial de política de retenção — NÃO CONFIGURADA NO SISTEMA
Tabela de referência para decisão empresarial, **não um prazo atualmente garantido ao público**:
| Categoria | Proposta para discussão | Riscos / decisões |
| --- | --- | --- |
| Casos fechados e histórico mínimo | 24 meses após encerramento, salvo exigência legal/garantia/litígio | Confirmar relação com garantias, CDC e necessidade |
| Evidências brutas (vídeo, logs, ZIP) | 180 dias após encerramento do caso, com possibilidade de prazo menor | Avaliar necessidade técnica e resposta ao titular |
| Artefatos temporários e links de upload | Expirar por TTL técnico e apagar arquivos não utilizados em prazo curto | Definir mecanismo de varredura seguro e restore |
| Logs operacionais não necessários ao caso | 90 dias | Revisar incidentes, auditoria e fornecedores |
| Limitação de requisições, OTP, tentativas inválidas | TTL curto compatível com antifraude, com expurgo | Rever retenção de autenticação por finalidade |
| Backups | Prazo compatível com estratégia de recuperação e descarte | Definir política para restores e exclusões propagadas |
| Conservação por lei/exercício de direitos | Até o término da hipótese de retenção aplicável | Documentar congelamentos e revogações |

**Não afirmar** na política pública que esses prazos já estão operacionais. Implementar rotinas, verificar exceções, testar exclusão de `records`, arquivos Blob/S3, logs e backups conforme política.

## Matriz de revisão antes de aprovar
- [ ] Confirmar CNPJ e denominação no cadastro oficial, endereço/sede do controlador e quem efetivamente define o tratamento.
- [ ] Nomeação ou identificação institucional do encarregado (DPO), se aplicável, e autorização para divulgar o contato.
- [ ] Mapear categoria de dados, campos, fluxo do case, logs, vídeo e compartilhamentos.
- [ ] Documentar bases legais específicas por finalidade, particularmente campos opcionais, vídeo/logs, cross-border e legítimo interesse.
- [ ] Validar Vercel, Neon, Resend e storage de evidências efetivos, suboperadores, países/regiões e contratos.
- [ ] Definir e implementar retenção, expurgo, reabertura de caso, salvaguardas jurídicas e tratamento de backups.
- [ ] Verificar privilégios de TFAE/Manager, revogação de tokens, segurança de uploads, e-mails, registros de acesso.
- [ ] Confirmar resposta a solicitações de titulares e fluxo de autenticação de identidade do solicitante.
- [ ] Inventariar cookies e Local/Session Storage no domínio real, com navegador limpo e perfil autenticado.
- [ ] Se existirem tecnologias opcionais dependentes de consentimento, implementar escolhas aceitar/rejeitar/gerenciar e bloquear scripts até decisão.
- [ ] Revisar termos para menores de idade, repasse a outras regiões e equipe de engenharia.
- [ ] Confirmar que não se usa o dado do cliente para propaganda sem base específica ou aviso adicional.
- [ ] Revisão final por jurídico/privacidade; registrar aprovador, versão, data de vigência e alteração de `noindex` para configuração pública apropriada.
- [ ] E2E e segurança validados antes de considerar as políticas suficientes para lançar o portal externo.

## Regra de lançamento
Publicar documentos preliminares em preview para revisão. Não remover aviso ou `noindex` nem afirmar adequação LGPD apenas por ter duas páginas no site.
