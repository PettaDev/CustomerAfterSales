# BRTE — Privacidade e Política de Cookies (documento de trabalho)

**RASCUNHO INTERNO. Não publicar como política jurídica definitiva sem revisão e aprovação da empresa.**

## Controlador e contatos pendentes
- Razão social, CNPJ, endereço e país do controlador: A CONFIRMAR.
- Encarregado e canal de privacidade: A CONFIRMAR.
- Base legal por finalidade e autoridades internas responsáveis: A CONFIRMAR.
- Regras de retenção e exclusão: A CONFIRMAR.
- Suboperadores, regiões de hospedagem e transferências internacionais: A CONFIRMAR.

## Inventário inicial de dados
1. Identificação e contato: nome, e-mail, telefone e, conforme hardware/garantia, endereço.
2. Aparelho e diagnóstico: marca, modelo, build, operadora, sintoma, passos para reproduzir e histórico de atendimento.
3. Evidências opcionais: fotos, gravações, logs e ZIP. Arquivos podem conter dados pessoais e telas sensíveis.
4. Acesso interno: sessão de TFAE/Manager, datas de autenticação e trilhas de auditoria quando implementadas.

## Finalidades que devem ser avaliadas juridicamente
- Abrir, diagnosticar e acompanhar report pós-venda.
- Solicitar informações complementares e comunicar andamento.
- Reproduzir falhas de produto e encaminhar evidências para equipe técnica autorizada.
- Prevenir fraude/abuso e manter segurança de sistemas.

## Fornecedores e segurança
- Vercel: frontend e backend.
- Neon: banco PostgreSQL.
- Resend: integração de e-mail observada no painel, operação efetiva pendente de validação.
- Evidências: confirmar se Vercel Blob privado ou S3 compatível, região e conta responsável.
- Não publicar credenciais, arquivos, dados pessoais ou links assinados em páginas indexáveis.

## Cookies e tecnologias similares — inventário preliminar
| Tecnologia | Chave | Uso conhecido | Categoria proposta |
| --- | --- | --- | --- |
| Cookie HttpOnly | tfae | Autenticação dos funcionários | Necessária |
| sessionStorage | case-access | Retomar o caso no navegador da sessão | Necessária para acompanhamento |
| localStorage | aftercare-language | Preferência de idioma | Funcional |
| localStorage | transsion-guide-session-v2 | Progresso do guia de coleta | Funcional |

Esta lista não comprova ausência de cookies de terceiros; auditar o navegador real, dependências, scripts, analytics, storage e serviços externos antes de declarar o inventário completo.

## Controles de privacidade exigidos
- Clareza quanto a quem responde pelo tratamento e a quem o cliente pode recorrer.
- Antes de iniciar coleta técnica, informar que vídeos/logs podem registrar informações visíveis no dispositivo; dar controle sobre o envio.
- Minimização, acesso por papel, expiração e revogação de acesso e tokens.
- Regra de retenção com exclusão em banco, storage e fluxos derivados, ressalvadas obrigações legais aplicáveis.
- Procedimento verificável para responder acesso, correção e exclusão de dados.
- Consentimento separado quando necessário; cookies opcionais desativados até consentimento e possibilidade de rejeitar/alterar.
- Não condicionar abertura do atendimento à aceitação de cookies opcionais.

## Problemas conhecidos públicos
Não copiar ticket Jira/Quick Response bruto para páginas indexáveis. Necessário fluxo de revisão técnica e de privacidade, com identificação do que foi realmente confirmado, modelos/builds comprovados, workaround aprovado, atualização e arquivamento.

## Aprovação para go-live
- [ ] Dados legais e contato corporativo preenchidos.
- [ ] Inventário de dados e fornecedores validado.
- [ ] Política de retenção/exclusão implementada e testada.
- [ ] Inventário de cookies confirmado em produção/staging.
- [ ] Consentimento e preferências aplicados se houver cookies opcionais.
- [ ] Textos completos de Política de Privacidade e Cookies aprovados.
- [ ] Treinamento e procedimentos de atendimento aos titulares definidos.

**Não existe certificação automática de conformidade LGPD neste documento.**
