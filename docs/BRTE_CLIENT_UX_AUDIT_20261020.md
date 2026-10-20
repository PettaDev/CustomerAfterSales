# Auditoria de experiência do cliente — BRTE Portal

**Data:** 20/10/2026
**Escopo:** portal público, abertura de casos, coleta WebUSB/Collector, confirmação, acompanhamento, Q&A, pontos de apoio, privacidade e dispositivos móveis.
**Referências:** `main` 6f323b01 (produção), PR #47 / branch feat/collector-mobile-download-20261020 / commit 8aad0ae8 (Preview).
**Tipo:** auditoria estática de código + análise de screenshot fornecido. **Não** equivale a testes reais de usabilidade, performance, WCAG ou aparelho físico. Não foram manipulados casos de clientes nem alterada produção.

## Síntese

A identidade visual e a estrutura em quatro etapas já são boas bases. Os maiores problemas são barreiras de conversão **antes de abrir o atendimento** e confiança nas páginas institucionais. A meta é **permitir reportar primeiro, coletar evidências depois quando necessário**, sem destruir as automações WebUSB/Collector.

## P0 — Bloqueadores de conclusão/conformidade

### P0-01 — Evidência obrigatória impede criar casos quando o cliente não consegue coletar
- **Confirmação:** `CustomerFlowV2.tsx`, função `advance`, exige `files.length > 0` para software e hardware na etapa 3. A API `server/app-enhanced.mjs` aceita a criação sem evidência; a obrigatoriedade é imposta pelo frontend.
- **Impacto:** aparelhos que não ligam/travam, clientes sem computador, sem APK liberado ou sem capacidade de gravar não conseguem reportar o problema.
- **Solução proposta:** na etapa Coleta, oferecer **Enviar evidência agora** e **Não consigo coletar / Enviar relato mesmo assim**. Criar caso com consentimento e campos essenciais, indicar evidência pendente no dashboard e permitir solicitação posterior pelo TFAE. Nunca encerrar a janela de upload inadvertidamente.
- **Aceitação:** caso sintético de hardware sem foto e software sem ZIP gera protocolo; TFAE vê registro pendente; cliente consegue acompanhar e adicionar quando solicitado. Manter limites de arquivo e antispam.

### P0-02 — Caminho Collector ainda não utilizável pelo cliente final
- **Confirmação:** PR #47 integra `/collector`, mas `APK_RELEASE_READY=false`. Link na Central de Ajuda leva à página; não há APK oficial validado.
- **Impacto:** opção principal de clientes sem PC desemboca em download indisponível; voltar ao formulário exige selecionar um arquivo.
- **Solução:** não ativar APK até verificar assinatura/package/versão/SHA-256/instalação; oferecer upload comum de vídeo/foto e a opção enviar relato sem arquivo. Avisar objetivamente que o Collector ainda não foi liberado.
- **Aceitação:** nenhum botão quebrado; abrir caso possível sem APK; release só após checklist real e homologação OEM específica.

### P0-03 — Documentos jurídicos do portal ainda não aprovados
- **Confirmação:** `public/privacy/index.html` e `public/cookies/index.html` exibem rótulos de documento preliminar, hipóteses de tratamento e retenção pendentes. A página de privacidade usa noindex.
- **Impacto:** usuários que vão enviar vídeos/logs e dados pessoais podem desconfiar e desistir; não há garantia de política institucional finalizada.
- **Solução:** aprovação com jurídico/DPO e responsáveis pelos dados, inventário de terceiros e retenção efetiva. Após validação, atualizar conteúdo/índice e revisar linguagem em idiomas aceitos. Não remover avisos sem regularização.
- **Aceitação:** páginas completas e aprovadas, contatos institucionais válidos, acesso fácil junto ao consentimento e explicação concreta de logs/captura.

## P1 — Fricção, compreensão e confiança

### P1-01 — Cabeçalho visual ocupa grande parte da primeira dobra
- **Confirmação:** screenshot 20/10 e `portal.css` com `.customer-wrap` + `.intro` generosos; título em desktop cresce até 54px.
- **Impacto:** seleção de marca/modelo e botão para avançar ficam abaixo da dobra; primeira ação demora a aparecer.
- **Solução:** compactar a altura da área introdutória, reforçar uma frase de valor, mostrar `4 etapas · você pode pedir ajuda mesmo sem logs`, trazer o primeiro campo e CTA para o primeiro viewport; manter design e hierarquia.
- **Aceitação:** nos 360x800, 390x844, 768x1024, 1366x768 e 1920x1080, primeiro campo é evidente sem scroll excessivo; sem cortes/overflows.

### P1-02 — Software vs hardware exige autodiagnóstico
- **Confirmação:** escolha binária em `CustomerFlowV2.tsx`; nenhum botão “Não sei”.
- **Impacto:** sintomas como aquecimento, travamento e câmera podem ter causas mistas e forçar escolha incorreta.
- **Solução:** opção “Não sei / Quero que avaliem” com triagem neutra e esclarecimento de exemplos; mapear no backend sem perder compatibilidade com `software|hardware`.
- **Aceitação:** caso sem classificação técnica não fica bloqueado; TFAE recebe contexto suficiente.

### P1-03 — Campos obrigatórios para situações simples
- **Confirmação:** nome, e-mail e telefone obrigatórios; no software também “O que deveria acontecer?” obrigatório. Backend enhanced exige telefone mínimo 6; hardware exige endereço na criação.
- **Impacto:** digitação excessiva, campos difíceis para usuários leigos e desistência no smartphone.
- **Solução:** usar e-mail como contato obrigatório e telefone opcional **após** revisar comunicação operacional e API; “comportamento esperado” opcional, com exemplos; pedir endereço para hardware somente quando necessário à logística/garantia.
- **Aceitação:** caso software criado apenas com contato mínimo aprovado e descrição curta; validações de backend sincronizadas com frontend; fluxo hardware ainda atende necessidades legais e de reparo.

### P1-04 — Rascunho incompleto e recuperação limitada
- **Confirmação:** `mobile-collector-draft.ts` salva somente após escolher software/método móvel, no sessionStorage por 4 horas; nenhum rascunho generalizado nas etapas anteriores ou hardware. Arquivos corretamente não são salvos.
- **Impacto:** Android pode encerrar aba ao alternar para aplicativo e perder progresso.
- **Solução:** avaliar rascunho de campos **não sensíveis** desde etapas iniciais para ambos fluxos, sem copiar ZIP, token, IMEI, endereço completo nem consentimento. Explicar que arquivos exigem nova seleção.
- **Aceitação:** atualizar/reabrir aba dentro da sessão restaura campos e etapa; rascunho expira e é apagado após sucesso; navegadores com storage bloqueado não impedem envio.

### P1-05 — Caso criado, upload falhou: mensagem insuficiente
- **Confirmação:** em `submit()`, a API cria caso e define `result` **antes** de fazer upload. Se evidência falhar, a tela continua no passo de contato com erro e apenas uma faixa contendo protocolo durante o fluxo.
- **Impacto:** usuário pode pensar que o atendimento não foi aberto e tentar registrar novamente; credenciais podem não ficar acessíveis com clareza.
- **Solução:** página de confirmação parcial “Seu atendimento foi aberto; X arquivos ainda não enviados”, cópia de protocolo/código, botão “Tentar novamente” ou “Abrir acompanhamento” e lista de anexos pendentes. Não duplicar o caso.
- **Aceitação:** simular upload falho e confirmar um único caso no banco, recuperação do acesso e reenvio controlado.

### P1-06 — Janela inicial de evidências de apenas 2 horas
- **Confirmação:** `INITIAL_UPLOAD_WINDOW_MS = 2h` no `server/app.mjs` e `app-enhanced.mjs`; janela maior quando equipe solicita.
- **Impacto:** cliente sem PC pode precisar instalar, parear, aprender, gerar ZIP e só retornar horas depois.
- **Solução:** mostrar prazo restante e permitir solicitação de extensão quando necessário; avaliar aumento da janela inicial sem enfraquecer rate limits, expiração e moderação.
- **Aceitação:** prazo mostrado no acompanhamento; caso vencido informa próxima ação, sem criar beco sem saída.

### P1-07 — Acompanhamento exige protocolo longo + código separado
- **Confirmação:** `Cases.tsx` utiliza dois campos, incluindo protocolo UUID; e-mail é solicitado, não garante entrega (texto já informa isso).
- **Impacto:** credenciais são difíceis de copiar/digitar e recuperação depende do e-mail recebido ou da mesma sessão.
- **Solução:** apresentação com botão de copiar ambos, salvamento seguro, link contextual que não exponha token em URLs públicas, opção de reenvio/recuperação após verificação de identidade. Evitar alegar entrega garantida.
- **Aceitação:** cliente retoma caso em dispositivo diferente por caminho seguro; sem vazamento de token por URL/referrer/logs.

### P1-08 — Ponto de apoio ainda tem serviços não confirmados
- **Confirmação:** `public/pontos-de-apoio/locations.json` contém um único local e campos `hours`, `phone`, `repairAuthorized`, `logCollectionAvailable` indefinidos; página avisa necessidade de confirmação.
- **Impacto:** cliente pode visitar local que não presta o serviço esperado.
- **Solução:** contato de confirmação ativo, data de última verificação e serviços disponíveis apenas após validação; manter aviso e não inventar autorização/horários.
- **Aceitação:** local em destaque com indicação clara de status verificado/não verificado; caminhos alternativos online.

## P2 — Refinamento visual e clareza

### P2-01 — Texto muito pequeno em metadados
- **Evidência estática:** `portal.css` contém múltiplos tamanhos de 10–12px para componentes/etapas; o screenshot mostra rótulos finos/pequenos.
- **Solução:** tipografia fluida, corpo 16px, ajuda 14px+, foco visível e contraste mínimo WCAG AA. Confirmar com axe/Lighthouse e revisão manual (não executados nesta auditoria).

### P2-02 — Reforçar clareza sobre suporte oficial e o que acontece após envio
- **Atual:** CTA “Novo atendimento” existe, mas jornada pouco informa prazos, responsável, e-mail, custo e escopo.
- **Solução:** “Conte o problema; não precisa saber termos técnicos”, etapa de revisão antes do envio, explicação breve “Recebemos → TFAE avalia → Você acompanha pelo protocolo”. Publicar prazo **somente** se houver SLA realmente validado.

### P2-03 — Acessibilidade e mobile precisam de testes reais
- **Atual:** CSS possui breakpoints e aria-labels, mas isso não prova qualidade de navegação por teclado, leitor de tela, zoom 200% ou troca de apps em Android.
- **Solução:** testar 320/360/390/430/768/1280, light/dark, PT/EN/ES/ZH, VoiceOver/TalkBack, teclado, erro de validação, upload grande em 4G, perda de conexão, reabertura de aba e Safari iOS (onde Collector Android não deve ser recomendado como instalável).
- **Aceitação:** zero bloqueios funcionais P0, sem overflow horizontal, textos legíveis e ações possíveis em toque.

### P2-04 — Central de Ajuda pode contextualizar a abertura do caso
- **Atual:** artigos de problemas existem e passam parâmetros para o novo atendimento; novo destaque Collector em PR #47.
- **Solução:** para cada artigo, botão “Não resolveu? Reportar este problema” preenchendo categoria/resumo, com opção de anexar captura simples e sem obrigar coleta.
- **Aceitação:** transição Q&A→form preserva contexto e não descarta os dados digitados.

## Proposta de execução

**Fase 1 — conversão e confiança (P0):** relato sem evidência, fallback enquanto Collector indisponível, validar política de privacidade com responsáveis. O primeiro conjunto é funcional; documentos exigem aprovação institucional.

**Fase 2 — jornada e recuperação (P1):** mensagem de sucesso parcial, pré-qualificação simples, revisão do formulário, prazo de evidências e recuperação segura.

**Fase 3 — refinamento (P2):** primeira dobra, tipografia/contraste, perguntas contextuais, mobile/accessibility e testes moderados com usuários reais.

## Métricas para instrumentar com privacidade

- Funil por etapa sem PII em analytics: início, conclusão etapa, desistência, upload iniciado/completo/falho, caso criado, caso pendente de evidência.
- Métrica prioritária: **proporção de visitantes que conseguem abrir atendimento**; acompanhar tempo mediano até protocolo e tickets duplicados por falha de upload.
- Avaliar antes/depois, não prometer aumentos percentuais sem dados. Não transmitir conteúdos de campos ou evidências às métricas.

## Regra para execução

Toda implementação deve permanecer em branch/Preview isolado. Testar contra dados sintéticos, preservar WebUSB, backend, autenticação, TFAE, coleta OEM e o checklist de APK da PR #47. Não publicar mudanças em produção sem autorização. Relatório de revisão, não declaração de conformidade com LGPD, WCAG ou testes reais em aparelho.
