#!/usr/bin/env python3
from __future__ import annotations

import os
import tempfile
from pathlib import Path
from xml.sax.saxutils import escape

import matplotlib.pyplot as plt
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    Image,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

PROJECT = "CustomerAfterSales"
TITLE = f"Relatório de Auditoria de Segurança — {PROJECT}"
DATE = "15/09/2026"
AUDITED_SHA = "6426c528bd3a2b1ef4cc86790a1a86b8cf338990"
OUT = Path(__file__).with_name("relatorio-auditoria-seguranca.pdf")

PALETTE = {
    "critical": "#B91C1C",
    "high": "#EA580C",
    "medium": "#D97706",
    "low": "#2563EB",
    "strength": "#059669",
    "ink": "#0F172A",
    "muted": "#475569",
    "line": "#CBD5E1",
    "panel": "#F8FAFC",
    "navy": "#0B1F33",
}

FINDINGS = [
    {
        "id": "F-00",
        "category": "Dependências / supply chain",
        "severity": "Alta",
        "fileline": "package.json:22,24; package-lock.json",
        "title": "Dependências de produção possuem vulnerabilidades conhecidas, incluindo undici de severidade alta",
        "description": (
            "O workflow dedicado executou npm audit --omit=dev contra o lockfile real e encontrou 5 vulnerabilidades de produção "
            "(2 baixas, 2 moderadas e 1 alta). O relatório identifica undici <=6.27.0 com advisories de exaustão de recursos, "
            "request/response smuggling e outros problemas, além de @ai-sdk/provider-utils vulnerável a consumo descontrolado de recursos. "
            "A árvore vulnerável é alcançada pelas versões atuais de ai 6.0.0 e @ai-sdk/google 3.0.103."
        ),
        "exploit": (
            "Os pacotes vulneráveis estão instalados como dependências de produção. O assistente usa a AI SDK quando a chave Google está configurada. "
            "A explorabilidade exata varia por advisory e pelo caminho de código utilizado, mas o lockfile de produção satisfaz as faixas afetadas "
            "confirmadas pelo npm audit; portanto a cadeia deve ser atualizada antes de ampliar exposição."
        ),
        "snippet": "\"@ai-sdk/google\": \"3.0.103\",\n\"ai\": \"6.0.0\"\n\n# npm audit --omit=dev\n5 vulnerabilities (2 low, 2 moderate, 1 high)\nundici <=6.27.0 - Severity: high",
        "condition": "Os pacotes afetados estão presentes no lockfile de produção; exploração específica depende do advisory/caminho utilizado. O fluxo de IA só é ativo quando a chave do provedor está configurada.",
    },
    {
        "id": "F-01",
        "category": "Abuso / disponibilidade",
        "severity": "Alta",
        "fileline": "server/app.mjs:215-230; 289-320",
        "title": "Criação pública de casos e emissão de uploads de até 1 GiB sem quota de abuso",
        "description": (
            "POST /api/cases é público e entrega um token válido para o novo caso. Com esse token, "
            "POST /api/cases/:id/evidence pode emitir repetidamente URLs assinadas para arquivos de até 1 GiB. "
            "Não existe limite de casos por IP, quantidade de evidências por caso, orçamento total de bytes por caso "
            "nem reserva de quota antes da emissão da URL."
        ),
        "exploit": (
            "Um cliente automatizado pode omitir o header Origin, criar muitos casos e solicitar uploads grandes em sequência. "
            "Isso permite consumir banco, operações de storage e capacidade/cota do Blob/S3. No plano gratuito, o impacto "
            "principal é indisponibilidade por esgotamento de quota; em plano pago, também pode gerar custo."
        ),
        "snippet": "app.post(\"/api/cases\", async (req, res) => { ...\n  res.status(201).json({ case: safeCase(c), accessToken: t });\n});\n\napp.post(\"/api/cases/:id/evidence\", async (req, res) => {\n  const c = await access(req, req.params.id);\n  ...\n  size: z.number().int().positive().max(1024 * 1024 * 1024),\n  ...\n  const url = await uploadURL(e);\n});",
        "condition": "Explorável quando a API estiver publicamente acessível, como no deployment Vercel atual.",
    },
    {
        "id": "F-02",
        "category": "Integridade de evidência",
        "severity": "Alta",
        "fileline": "server/storage.mjs:34-75; server/app.mjs:346-353",
        "title": "URL de upload continua reutilizável e permite sobrescrever evidência após a conclusão",
        "description": (
            "A URL assinada usa um caminho/chave determinístico. No Vercel Blob, allowOverwrite está explicitamente true; "
            "a URL fica válida por 15 minutos. No backend, o fluxo /complete verifica o tamanho uma única vez e marca a "
            "evidência como uploaded=true, mas não revoga a URL já emitida. Em S3, o PutObject assinado usa a mesma Key e "
            "também pode ser reutilizado durante a validade."
        ),
        "exploit": (
            "O próprio titular legítimo do token do caso pode concluir uma evidência e, enquanto a URL PUT ainda estiver "
            "válida, reenviar conteúdo para a mesma chave. A base continua indicando que o arquivo já foi validado, quebrando "
            "a imutabilidade e a cadeia de custódia do material analisado pelo TFAE."
        ),
        "snippet": "const { presignedUrl } = await presignUrl(signedToken, {\n  pathname,\n  operation,\n  access: \"private\",\n  ...\n  addRandomSuffix: false,\n  allowOverwrite: true,\n});\n\napp.post(\"/api/evidence/:id/complete\", async (req, res) => {\n  ...\n  await verifyUpload(e);\n  await db.put(\"evidence\", e.id, { ...rest, uploaded: true });\n});",
        "condition": "Explorável enquanto a URL assinada original permanecer válida; depende de posse legítima do token do caso/URL de upload.",
    },
    {
        "id": "F-03",
        "category": "Abuso / API externa",
        "severity": "Média",
        "fileline": "server/app.mjs:72-74; server/assistant.mjs:3-31",
        "title": "Endpoint público de IA sem rate limit pode consumir quota do provedor",
        "description": (
            "POST /api/chat não exige autenticação nem aplica rate limiting próprio. Quando GOOGLE_GENERATIVE_AI_API_KEY está "
            "configurada, cada chamada válida chega ao generateText do provedor Google, com até 700 tokens de saída e timeout de 25 s."
        ),
        "exploit": (
            "Um script pode chamar o endpoint diretamente sem Origin e gerar carga/concorrência e consumo de quota. A proteção de Origin "
            "é um controle de navegador/CSRF, não um mecanismo de autenticação para clientes HTTP arbitrários."
        ),
        "snippet": "app.post(\"/api/chat\", async (req, res) =>\n  res.json({ reply: await reply(req.body) }),\n);\n\nconst { text } = await generateText({\n  model: google(process.env.GEMINI_MODEL || \"gemini-3.5-flash-lite\"),\n  maxOutputTokens: 700,\n  abortSignal: AbortSignal.timeout(25000),\n  ...\n});",
        "condition": "Somente explorável quando GOOGLE_GENERATIVE_AI_API_KEY estiver configurada e o assistente estiver habilitado.",
    },
    {
        "id": "F-04",
        "category": "Supply chain / frontend",
        "severity": "Média",
        "fileline": "src/portal/BrowserCapture.tsx:42; 53-55",
        "title": "Bibliotecas ADB sensíveis são executadas por import remoto de CDN em runtime",
        "description": (
            "O fluxo WebUSB/WebADB usa import dinâmico de três módulos JavaScript hospedados no jsDelivr. As versões estão fixadas, "
            "mas os bytes executados não fazem parte do bundle/lockfile entregue pela aplicação e o import() remoto não utiliza SRI."
        ),
        "exploit": (
            "Comprometimento da cadeia npm/CDN, resolução maliciosa ou entrega indevida daquele recurso faria JavaScript externo executar "
            "na origem do Aftercare, justamente na tela que possui acesso a WebUSB/ADB e dados do caso."
        ),
        "snippet": "const remoteImport = (url: string): Promise<any> => import(/* @vite-ignore */ url);\n...\nremoteImport(\"https://cdn.jsdelivr.net/npm/@yume-chan/adb@2.1.0/+esm\"),\nremoteImport(\"https://cdn.jsdelivr.net/npm/@yume-chan/adb-daemon-webusb@2.1.0/+esm\"),\nremoteImport(\"https://cdn.jsdelivr.net/npm/@yume-chan/adb-credential-web@2.1.0/+esm\"),",
        "condition": "Exige comprometimento/falha na cadeia externa; não há evidência de comprometimento atual.",
    },
    {
        "id": "F-05",
        "category": "Autenticação / cookie",
        "severity": "Média",
        "fileline": "server/app.mjs:164-171",
        "title": "Flag Secure do cookie TFAE depende de VERCEL, não do modo de produção/HTTPS",
        "description": (
            "O cookie de sessão TFAE usa httpOnly e SameSite=Strict, porém a flag Secure é definida por !!process.env.VERCEL. "
            "O projeto também suporta execução própria via npm start/server/index.mjs, onde uma implantação HTTPS pode estar em produção "
            "sem a variável VERCEL."
        ),
        "exploit": (
            "Em uma implantação self-hosted HTTPS com VERCEL ausente, o navegador aceitará o cookie sem Secure. Se a mesma origem puder "
            "ser alcançada por HTTP, o cookie pode ser transmitido sem TLS e expor a sessão."
        ),
        "snippet": ".cookie(\"tfae\", t, {\n  httpOnly: true,\n  secure: !!process.env.VERCEL,\n  sameSite: \"strict\",\n  maxAge: 8 * 3600000,\n  path: \"/\",\n})",
        "condition": "Não é explorável no deployment Vercel atual, pois VERCEL é definido. Risco condicional para self-hosting/ambientes futuros.",
    },
    {
        "id": "F-06",
        "category": "Exposição de informação",
        "severity": "Baixa",
        "fileline": "server/app.mjs:79-109",
        "title": "Health check público expõe detalhes desnecessários de infraestrutura",
        "description": (
            "GET /api/health retorna publicamente estado do banco, latência do banco, estado do storage, presença de autenticação staff e "
            "tempo de resposta. O erro textual do banco é ocultado em production, o que é correto, mas os demais sinais permanecem públicos."
        ),
        "exploit": (
            "Um atacante pode usar o endpoint para reconhecimento e para detectar períodos de cold start/degradação, facilitando a escolha do "
            "momento de abuso. O impacto isolado é baixo porque não há segredo, credencial nem dado de cliente no retorno."
        ),
        "snippet": "res.status(ok ? 200 : 503).json({\n  ok,\n  database,\n  databaseLatencyMs,\n  storage,\n  staff: !!process.env.STAFF_PASSWORD_HASH,\n  responseTimeMs: Date.now() - started,\n  ...\n});",
        "condition": "Explorável sempre que /api/health estiver público.",
    },
]

STRENGTHS = [
    ("Isolamento do cliente por token de caso", "server/app.mjs:31-55, 245-258, 289-320, 346-366", "O backend não confia no ID do caso sozinho: access() exige o hash do token do caso ou uma sessão staff válida. Evidências e sessões derivam o caseId e voltam a aplicar access()."),
    ("Gate privilegiado no servidor", "server/app.mjs:233-243, 260-287; src/portal/Cases.tsx:194-250", "A UI esconde controles de status/prioridade/owner/note com staff &&, mas o endpoint PATCH correspondente também usa requireStaff. A listagem global de casos também é staff-only."),
    ("Queries parametrizadas", "server/store.mjs:55-186", "PostgreSQL usa tagged templates do pacote postgres e SQLite usa placeholders. Não foi encontrado SQL construído por concatenação de input do usuário."),
    ("Sem IDOR verificado nos handlers por ID", "server/app.mjs; bridge/server.mjs", "Todos os handlers de case/evidence/session por ID possuem posse/autorização equivalente. O bridge aplica middleware global de Host/Origin/Bearer antes das rotas."),
    ("Proteção de segredos no repositório atual", ".gitignore; .env.example; docs/production-setup.md", ".env é ignorado; .env.example contém placeholders vazios; documentação orienta variáveis de ambiente. Scanner dedicado verifica histórico e bundle por formatos de credencial de alta confiança."),
    ("Renderização React sem HTML bruto", "src/portal/Cases.tsx; src/components/LogAssistant.tsx; src/components/GuideBlockRenderer.tsx", "Dados de cliente e respostas de IA são interpolados em JSX e escapados pelo React. Não foram encontrados dangerouslySetInnerHTML, innerHTML, eval ou new Function."),
    ("URLs do guia não são input de cliente", "src/guides/index.ts; src/components/GuideBlockRenderer.tsx", "href/src/iframe do guia vêm de JSON local importado no build por import.meta.glob, não de campos do caso ou mensagens do usuário."),
    ("Storage privado e URLs curtas", "server/storage.mjs:34-113", "Vercel Blob usa access=private e downloads expiram em 2 minutos; S3 usa presigned URLs. O backend verifica o tamanho no fluxo de conclusão."),
    ("Sessão staff robusta no Vercel", "server/security.mjs; server/app.mjs:145-176", "Senha usa scrypt com salt; tokens têm 32 bytes aleatórios, são armazenados por hash, comparação é timing-safe e o cookie atual é httpOnly, SameSite=Strict e Secure no Vercel."),
    ("Bridge local com fronteira forte", "bridge/server.mjs:1-35; bridge/core.mjs", "Bridge escuta somente 127.0.0.1, valida Host/Origin e exige bearer aleatório. ADB usa execFile/spawn com arrays; serial é validado; PIDs são verificados antes de kill."),
]

ISSUES = [
    {
        "n": 1,
        "title": "[Segurança] Atualizar dependências de produção vulneráveis da AI SDK/undici",
        "labels": "security, severity:high",
        "body": """## Descrição do problema
O `npm audit --omit=dev` executado contra o lockfile real encontrou 5 vulnerabilidades de produção (2 baixas, 2 moderadas e 1 alta). A falha alta afeta `undici <=6.27.0`; também há `@ai-sdk/provider-utils` vulnerável a consumo descontrolado de recursos. As versões atuais `ai@6.0.0` e `@ai-sdk/google@3.0.103` alcançam a árvore afetada.

## Evidência
- `package.json:22,24`
- `package-lock.json`
- Workflow `Security Audit`: `npm audit --omit=dev`

```json
"@ai-sdk/google": "3.0.103",
"ai": "6.0.0"
```

O audit reporta `undici <=6.27.0` como severidade alta e a cadeia `@ai-sdk/provider-utils` como moderada.

## Impacto
Dependendo do advisory e do caminho exercitado, a aplicação pode ficar exposta a exaustão de recursos/DoS e outras classes reportadas para a versão transitiva do cliente HTTP. O risco aumenta quando o assistente está habilitado e recebe tráfego público.

## Sugestão de correção
Atualizar `@ai-sdk/google`, `ai` e dependências transitivas para versões fora das faixas vulneráveis, evitando aplicar `npm audit fix --force` diretamente em produção sem revisar mudanças de versão. Rodar regressão do assistente, testes e novo `npm audit`.

## Critérios de aceite
- [ ] `npm audit --omit=dev` não reporta vulnerabilidade alta na árvore de produção.
- [ ] `undici` resolvido está fora da faixa vulnerável indicada pelo advisory.
- [ ] `@ai-sdk/provider-utils` está em versão corrigida.
- [ ] Fluxo `/api/chat` continua funcional quando habilitado.
- [ ] `npm test` e `npm run build` passam após a atualização.
""",
    },
    {
        "n": 2,
        "title": "[Segurança] Adicionar proteção de abuso, rate limit e quotas aos endpoints públicos",
        "labels": "security, severity:high",
        "body": """## Descrição do problema
Os endpoints públicos de criação de casos e registro de evidências permitem que qualquer cliente crie um caso, receba um token válido e emita URLs assinadas para arquivos de até 1 GiB, sem quota por IP/caso ou orçamento total de bytes. O endpoint `/api/chat`, quando a chave do Gemini está configurada, também não possui rate limit.

Isso permite automação para esgotar quota de banco/storage e, quando o assistente estiver habilitado, consumir quota/custo do provedor de IA.

## Evidência
- `server/app.mjs:215-230`: criação pública de caso e retorno de `accessToken`.
- `server/app.mjs:289-320`: registro de evidência com tamanho de até 1 GiB e emissão de URL assinada.
- `server/app.mjs:72-74` + `server/assistant.mjs:3-31`: `/api/chat` chama o modelo sem rate limit.

Trecho:
```js
app.post("/api/cases", async (req, res) => {
  ...
  res.status(201).json({ case: safeCase(c), accessToken: t });
});

size: z.number().int().positive().max(1024 * 1024 * 1024)
```

## Impacto
- Esgotamento de quota e indisponibilidade do piloto.
- Crescimento artificial do banco.
- Consumo de operações/armazenamento Blob/S3.
- Consumo de quota/custo de Gemini quando habilitado.

## Sugestão de correção
Aplicar rate limiting server-side/edge por IP e por sessão; limitar casos criados por janela; definir quantidade e soma máxima de bytes por caso; reservar quota antes de gerar URL assinada; adicionar orçamento/concurrency cap para `/api/chat`; considerar challenge anti-bot em criação anônima.

## Critérios de aceite
- [ ] `/api/cases` possui limite verificável por IP/janela.
- [ ] `/api/cases/:id/evidence` recusa quando quantidade ou soma de bytes do caso exceder a quota.
- [ ] A geração da URL assinada ocorre somente após reserva de quota.
- [ ] `/api/chat` possui rate limit e limite de concorrência quando habilitado.
- [ ] Testes automatizados cobrem respostas 429/413/limite de quota.
- [ ] Métricas/logs permitem identificar abuso sem registrar tokens/segredos.
""",
    },
    {
        "n": 3,
        "title": "[Segurança] Tornar evidências imutáveis após a conclusão do upload",
        "labels": "security, severity:high",
        "body": """## Descrição do problema
A URL de upload é emitida para uma chave determinística e permanece válida depois que `/api/evidence/:id/complete` marca a evidência como concluída. No Vercel Blob, `allowOverwrite: true` está explícito; no S3, o mesmo `PutObject` assinado pode sobrescrever a mesma Key durante sua validade.

Assim, uma URL PUT ainda válida pode substituir os bytes após a verificação do backend, enquanto o banco continua marcando o objeto como `uploaded: true`.

## Evidência
- `server/storage.mjs:34-75`
- `server/app.mjs:346-353`

Trecho:
```js
addRandomSuffix: false,
allowOverwrite: true,
...
await verifyUpload(e);
await db.put("evidence", e.id, { ...rest, uploaded: true });
```

## Impacto
Quebra de integridade/cadeia de custódia: o arquivo revisado pelo TFAE pode não ser o mesmo arquivo verificado no momento da conclusão.

## Sugestão de correção
Usar chave única e imutável por tentativa/versão; desabilitar overwrite quando suportado; reduzir TTL; gravar hash criptográfico e/ou versão/ETag no complete; validar essa identidade no download; para S3/R2 considerar versionamento/condições de escrita.

## Critérios de aceite
- [ ] Uma URL antiga não consegue alterar uma evidência concluída.
- [ ] Cada upload possui chave/versão única.
- [ ] O backend persiste hash/ETag/version id no complete.
- [ ] Download valida ou referencia exatamente a versão concluída.
- [ ] Teste automatizado tenta reusar a URL após complete e confirma que o conteúdo final não muda.
""",
    },
    {
        "n": 4,
        "title": "[Segurança] Remover imports ADB de CDN do caminho WebUSB",
        "labels": "security, severity:medium",
        "body": """## Descrição do problema
O BrowserCapture executa em runtime três módulos ADB vindos do jsDelivr por `import()` remoto. As versões estão fixas, porém os bytes executados não são parte do artefato Vite/lockfile e não há SRI aplicável ao import dinâmico.

Uma falha/comprometimento da cadeia npm/CDN permitiria executar JavaScript de terceiro na origem do Aftercare, na mesma tela que controla WebUSB/ADB.

## Evidência
`src/portal/BrowserCapture.tsx:42,53-55`

```ts
const remoteImport = (url: string): Promise<any> => import(/* @vite-ignore */ url);
remoteImport("https://cdn.jsdelivr.net/npm/@yume-chan/adb@2.1.0/+esm")
```

## Impacto
Comprometimento de supply chain com acesso ao contexto do portal, dados disponíveis no browser e operações WebUSB autorizadas pelo usuário.

## Sugestão de correção
Adicionar os pacotes `@yume-chan/*` ao `package.json`, travar hashes no `package-lock.json` e empacotar com Vite. Aplicar CSP restritiva depois de remover a dependência de script remoto.

## Critérios de aceite
- [ ] Nenhum `import()` de código executável ADB aponta para CDN.
- [ ] Dependências ADB estão no `package.json` e `package-lock.json`.
- [ ] Build offline reproduz o bundle sem baixar JavaScript em runtime.
- [ ] Fluxo WebUSB continua funcionando nos dispositivos MTK/QTI validados.
- [ ] CSP pode bloquear `script-src` de terceiros sem quebrar a coleta.
""",
    },
    {
        "n": 5,
        "title": "[Segurança] Definir Secure do cookie TFAE por política de produção, não por VERCEL",
        "labels": "security, severity:medium",
        "body": """## Descrição do problema
O cookie `tfae` usa `secure: !!process.env.VERCEL`. Isso é seguro no deployment Vercel atual, mas o projeto suporta execução self-hosted via `npm start`. Uma implantação HTTPS fora da Vercel pode entrar em produção com `VERCEL` ausente e criar cookie sem `Secure`.

## Evidência
`server/app.mjs:164-171`

```js
.cookie("tfae", t, {
  httpOnly: true,
  secure: !!process.env.VERCEL,
  sameSite: "strict",
  ...
})
```

## Impacto
Em ambiente self-hosted vulnerável, a sessão staff pode ser transmitida por HTTP se a origem também responder sem TLS.

## Sugestão de correção
Basear a flag em uma política explícita: `NODE_ENV === 'production'` ou `COOKIE_SECURE=true`, com default seguro e validação de startup em produção.

## Critérios de aceite
- [ ] Todo ambiente de produção cria cookie TFAE com `Secure`.
- [ ] Startup falha ou alerta de forma bloqueante se produção estiver configurada sem cookie seguro.
- [ ] Teste automatizado cobre Vercel e self-hosted production.
- [ ] `httpOnly` e `SameSite=Strict` permanecem ativos.
""",
    },
    {
        "n": 6,
        "title": "[Segurança] Reduzir detalhes expostos pelo health check público",
        "labels": "security, severity:low",
        "body": """## Descrição do problema
`GET /api/health` retorna estado e latência do banco, estado do storage, presença de configuração staff e tempo de resposta. O erro textual de banco já é corretamente ocultado em produção, mas os demais sinais facilitam reconhecimento operacional.

## Evidência
`server/app.mjs:79-109`

```js
res.status(ok ? 200 : 503).json({
  ok,
  database,
  databaseLatencyMs,
  storage,
  staff: !!process.env.STAFF_PASSWORD_HASH,
  responseTimeMs: Date.now() - started,
});
```

## Impacto
Reconhecimento de dependências e detecção de cold start/degradação. Impacto baixo isoladamente; não há credenciais nem dados de cliente.

## Sugestão de correção
Manter um liveness público mínimo (`{ ok: true }`) e mover readiness detalhado para endpoint protegido/observabilidade interna.

## Critérios de aceite
- [ ] Health público não informa banco/storage/staff/latência detalhada.
- [ ] Readiness detalhado continua disponível para operação autenticada ou monitor interno.
- [ ] Nenhuma mensagem de exceção interna aparece em produção.
""",
    },
]


def setup_fonts():
    candidates = [
        ("/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf", "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf"),
        ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
        ("/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf", "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf"),
    ]
    for regular, bold in candidates:
        if os.path.exists(regular) and os.path.exists(bold):
            pdfmetrics.registerFont(TTFont("AuditSans", regular))
            pdfmetrics.registerFont(TTFont("AuditSans-Bold", bold))
            return "AuditSans", "AuditSans-Bold"
    return "Helvetica", "Helvetica-Bold"

REGULAR, BOLD = setup_fonts()

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="CoverTitle", fontName=BOLD, fontSize=25, leading=31, textColor=colors.HexColor(PALETTE["navy"]), alignment=TA_LEFT, spaceAfter=14))
styles.add(ParagraphStyle(name="CoverSub", fontName=REGULAR, fontSize=11, leading=17, textColor=colors.HexColor(PALETTE["muted"]), spaceAfter=8))
styles.add(ParagraphStyle(name="H1x", fontName=BOLD, fontSize=17, leading=22, textColor=colors.HexColor(PALETTE["navy"]), spaceBefore=10, spaceAfter=9))
styles.add(ParagraphStyle(name="H2x", fontName=BOLD, fontSize=12.5, leading=16, textColor=colors.HexColor(PALETTE["ink"]), spaceBefore=8, spaceAfter=5))
styles.add(ParagraphStyle(name="Bodyx", fontName=REGULAR, fontSize=9.6, leading=14, textColor=colors.HexColor(PALETTE["ink"]), spaceAfter=6))
styles.add(ParagraphStyle(name="Smallx", fontName=REGULAR, fontSize=8.2, leading=11.5, textColor=colors.HexColor(PALETTE["muted"]), spaceAfter=4))
styles.add(ParagraphStyle(name="Callout", fontName=REGULAR, fontSize=9.3, leading=13.2, textColor=colors.HexColor(PALETTE["ink"]), backColor=colors.HexColor("#F1F5F9"), borderColor=colors.HexColor(PALETTE["line"]), borderWidth=0.7, borderPadding=8, spaceBefore=5, spaceAfter=8))
styles.add(ParagraphStyle(name="AuditCode", fontName="Courier", fontSize=7.2, leading=9.5, textColor=colors.HexColor("#E2E8F0"), backColor=colors.HexColor("#0F172A"), borderPadding=7, spaceBefore=4, spaceAfter=7))
styles.add(ParagraphStyle(name="IssueMono", fontName="Courier", fontSize=7.4, leading=10.2, textColor=colors.HexColor(PALETTE["ink"]), leftIndent=9, rightIndent=9, spaceAfter=1.5))


def p(text, style="Bodyx"):
    return Paragraph(escape(text).replace("\n", "<br/>") , styles[style])


def header_footer(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setStrokeColor(colors.HexColor("#E2E8F0"))
    canvas.setLineWidth(0.5)
    canvas.line(2*cm, h-1.25*cm, w-2*cm, h-1.25*cm)
    canvas.setFont(REGULAR, 7.5)
    canvas.setFillColor(colors.HexColor(PALETTE["muted"]))
    canvas.drawString(2*cm, h-1.0*cm, "Relatório de Auditoria de Segurança - CustomerAfterSales")
    canvas.drawRightString(w-2*cm, 1.0*cm, f"Página {doc.page}")
    canvas.restoreState()


def build_charts(tmpdir: Path):
    sev = {"Crítica": 0, "Alta": 3, "Média": 3, "Baixa": 1}
    colors_sev = [PALETTE["critical"], PALETTE["high"], PALETTE["medium"], PALETTE["low"]]
    vals = list(sev.values())
    labels = list(sev.keys())
    fig, ax = plt.subplots(figsize=(5.5, 3.4))
    nz_vals = [v for v in vals if v]
    nz_labels = [labels[i] for i,v in enumerate(vals) if v]
    nz_colors = [colors_sev[i] for i,v in enumerate(vals) if v]
    ax.pie(nz_vals, labels=nz_labels, colors=nz_colors, startangle=90, wedgeprops=dict(width=0.38, edgecolor="white"), autopct=lambda x: f"{x:.0f}%")
    ax.text(0, 0.06, str(sum(vals)), ha="center", va="center", fontsize=22, fontweight="bold")
    ax.text(0, -0.16, "achados", ha="center", va="center", fontsize=10)
    ax.set_title("Achados por severidade", fontsize=12, fontweight="bold")
    fig.tight_layout()
    donut = tmpdir / "severity.png"
    fig.savefig(donut, dpi=170, bbox_inches="tight", transparent=False)
    plt.close(fig)

    cats = ["Dependências /\nsupply chain", "Abuso /\ndisponibilidade", "Integridade\nde evidência", "Abuso /\nAPI externa", "Supply chain /\nfrontend", "Autenticação /\ncookie", "Exposição de\ninformação"]
    counts = [1,1,1,1,1,1,1]
    fig, ax = plt.subplots(figsize=(7.4, 3.5))
    ax.bar(cats, counts, color=[PALETTE["high"], PALETTE["high"], PALETTE["high"], PALETTE["medium"], PALETTE["medium"], PALETTE["medium"], PALETTE["low"]])
    ax.set_title("Achados por categoria", fontsize=12, fontweight="bold")
    ax.set_ylim(0, 1.3)
    ax.set_yticks([0,1])
    ax.grid(axis="y", alpha=0.2)
    ax.tick_params(axis="x", labelsize=7.5)
    fig.tight_layout()
    bars = tmpdir / "categories.png"
    fig.savefig(bars, dpi=170, bbox_inches="tight")
    plt.close(fig)
    return donut, bars


def severity_color(sev):
    return {
        "Crítica": PALETTE["critical"],
        "Alta": PALETTE["high"],
        "Média": PALETTE["medium"],
        "Baixa": PALETTE["low"],
    }[sev]


def issue_block(issue):
    out = []
    out.append(Paragraph(f"--- ISSUE {issue['n']} ---", ParagraphStyle(name=f"issuehead{issue['n']}", parent=styles["H2x"], textColor=colors.HexColor(PALETTE["navy"]), spaceBefore=10)))
    raw = f"# {issue['title']}\nLabels sugeridas: {issue['labels']}\n\n{issue['body'].strip()}"
    for line in raw.splitlines():
        if not line:
            out.append(Spacer(1, 3))
            continue
        out.append(Paragraph(escape(line), styles["IssueMono"]))
    out.append(Paragraph(f"--- FIM ISSUE {issue['n']} ---", styles["H2x"]))
    out.append(Spacer(1, 7))
    return out


def build_pdf():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="aftercare-security-") as td:
        tmp = Path(td)
        donut, bars = build_charts(tmp)

        doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=2*cm, rightMargin=2*cm, topMargin=1.65*cm, bottomMargin=1.55*cm, title=TITLE, author="OpenAI - auditoria assistida para Gustavo Petta")
        frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
        doc.addPageTemplates(PageTemplate(id="audit", frames=[frame], onPage=header_footer))

        story = []
        story += [Spacer(1, 1.0*cm), Paragraph(TITLE, styles["CoverTitle"]), p(f"Data: {DATE}", "CoverSub"), p(f"Escopo: repositório PettaDev/CustomerAfterSales, commit main {AUDITED_SHA}", "CoverSub"), p("Abrangência: frontend React/Vite, API Express, persistência PostgreSQL/SQLite, storage, Support Bridge, autenticação, CI/CD, deploy Vercel, histórico Git e bundle de frontend.", "CoverSub"), Spacer(1, 0.7*cm)]
        story.append(Paragraph("Nota metodológica", styles["H2x"]))
        story.append(p("A auditoria foi adaptada à stack detectada. 'Banco sem tranca' foi mapeado para o mecanismo real de isolamento por token de caso + sessão staff, pois o projeto não usa Supabase/RLS nem modelo multi-tenant por organização. 'Permissão no navegador' foi cruzada entre gates React e os endpoints Express. IDOR foi percorrido handler por handler. Segredos foram verificados no código/configuração, histórico Git e bundle por formatos de credencial de alta confiança. XSS foi revisado procurando sinks de HTML/JS e a origem de URLs renderizadas."))
        story.append(p("Limite metodológico: esta é uma auditoria de código e testes automatizados do repositório. Não substitui pentest externo autenticado nem análise de infraestrutura de terceiros. Achados condicionais são explicitamente marcados.", "Callout"))
        story.append(PageBreak())

        story.append(Paragraph("1. Stack detectada", styles["H1x"]))
        stack_rows = [
            ["Camada", "Tecnologia detectada"],
            ["Linguagens", "TypeScript/TSX no frontend; JavaScript ESM (.mjs) no backend e bridge; Node.js >=22"],
            ["Frontend", "React 19, Vite 7, React Router DOM, i18next, Framer Motion, Lucide, Tailwind/PostCSS"],
            ["Backend", "Express 5 + Zod"],
            ["Banco", "PostgreSQL (Neon em produção) via pacote postgres; fallback local node:sqlite. Sem ORM/query builder."],
            ["Auth staff", "STAFF_EMAIL + hash scrypt; sessão aleatória de 32 bytes em cookie tfae, token armazenado por SHA-256"],
            ["Auth cliente", "Token aleatório de 32 bytes por caso; apenas accessHash é persistido; bearer token acompanha operações do caso"],
            ["Storage", "Vercel Blob privado ou S3-compatible via AWS SDK; URLs assinadas; disco local no desenvolvimento"],
            ["Bridge", "Express local em 127.0.0.1:43127 com Host/Origin + bearer aleatório"],
            ["Deploy/CI", "vercel.json + GitHub Actions; não há Dockerfile, Helm ou Terraform no repositório auditado"],
        ]
        t = Table([[Paragraph(f"<b>{escape(str(c))}</b>" if r==0 else escape(str(c)), styles["Smallx"]) for c in row] for r,row in enumerate(stack_rows)], colWidths=[4.1*cm, 12.1*cm], repeatRows=1)
        t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),colors.HexColor(PALETTE["navy"])),("TEXTCOLOR",(0,0),(-1,0),colors.white),("GRID",(0,0),(-1,-1),0.4,colors.HexColor(PALETTE["line"])),("VALIGN",(0,0),(-1,-1),"TOP"),("LEFTPADDING",(0,0),(-1,-1),6),("RIGHTPADDING",(0,0),(-1,-1),6),("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5)]))
        story += [t, Spacer(1, 10)]

        story.append(Paragraph("2. Resumo executivo", styles["H1x"]))
        story.append(p("Foram confirmados 7 achados acionáveis: 3 de severidade alta, 3 média e 1 baixa. Nenhum achado crítico foi verificado. Nas cinco categorias obrigatórias, não foi confirmada falha de isolamento/IDOR, gate privilegiado apenas no browser, segredo hardcoded ou XSS direto. Os riscos centrais encontrados são abuso de endpoints públicos, integridade de evidências após o complete e dependência de JavaScript ADB de CDN em runtime."))
        story.append(Table([[Image(str(donut), width=7.5*cm, height=4.6*cm), Image(str(bars), width=8.7*cm, height=4.1*cm)]], colWidths=[7.7*cm, 8.7*cm], style=TableStyle([("VALIGN",(0,0),(-1,-1),"MIDDLE"),("BOX",(0,0),(-1,-1),0.4,colors.HexColor(PALETTE["line"])),("INNERGRID",(0,0),(-1,-1),0.4,colors.HexColor(PALETTE["line"]))])))
        story += [Spacer(1, 10)]
        sev_table = [["Severidade", "Quantidade"], ["Crítica", "0"], ["Alta", "3"], ["Média", "3"], ["Baixa", "1"]]
        st = Table([[Paragraph(escape(c), styles["Smallx"]) for c in row] for row in sev_table], colWidths=[5*cm,3*cm])
        styles_list=[("BACKGROUND",(0,0),(-1,0),colors.HexColor(PALETTE["navy"])),("TEXTCOLOR",(0,0),(-1,0),colors.white),("GRID",(0,0),(-1,-1),0.4,colors.HexColor(PALETTE["line"]))]
        for i,(sev,_) in enumerate(sev_table[1:], start=1):
            styles_list.append(("TEXTCOLOR",(0,i),(0,i),colors.HexColor(severity_color(sev))))
        st.setStyle(TableStyle(styles_list)); story.append(st)
        story.append(PageBreak())

        story.append(Paragraph("3. Mapeamento das cinco categorias obrigatórias", styles["H1x"]))
        mappings = [
            ("1. Banco sem tranca", "Não há RLS/Supabase nem tenants por organização. O isolamento do cliente é token por caso em access(); staff é um workspace global. A listagem global só existe para staff. Resultado: nenhum bypass de isolamento confirmado."),
            ("2. Permissão definida no navegador", "O frontend usa staff && para controles privilegiados, mas o backend aplica requireStaff em listagem e PATCH. Resultado: nenhum gate somente visual confirmado."),
            ("3. IDOR", "Todos os handlers Express por ID foram percorridos: case, evidence, upload, complete, download e session. Todos verificam case token/staff ou token específico de upload. Bridge possui middleware global antes das rotas. Resultado: nenhum IDOR confirmado."),
            ("4. Chaves expostas", ".env é ignorado, .env.example contém placeholders vazios e não há histórico de .env. O scanner de formatos de credencial cobre histórico Git e dist/. Resultado: nenhum segredo hardcoded confirmado."),
            ("5. Inputs sem tratamento (XSS)", "Não foram encontrados dangerouslySetInnerHTML, innerHTML, eval ou new Function. Dados de cliente/IA são JSX escapado. URLs do guia vêm de JSON local versionado. Não há biblioteca de sanitização, mas também não há sink de HTML bruto que a exija hoje. Resultado: nenhum XSS direto confirmado."),
        ]
        for title, text in mappings:
            story.append(Paragraph(title, styles["H2x"])); story.append(p(text))

        story.append(Paragraph("4. Pontos fortes verificados", styles["H1x"]))
        for title, evidence, desc in STRENGTHS:
            story.append(Paragraph(f"<font color='{PALETTE['strength']}'>●</font> {escape(title)}", styles["H2x"]))
            story.append(p(f"Evidência: {evidence}", "Smallx")); story.append(p(desc))

        story.append(PageBreak())
        story.append(Paragraph("5. Pontos fracos e achados detalhados", styles["H1x"]))
        story.append(p("Somente itens confirmados no código real são listados abaixo. Condições necessárias à exploração aparecem em cada achado."))
        for f in FINDINGS:
            finding_flow = []
            finding_flow.append(Paragraph(f"{f['id']} - {escape(f['title'])}", styles["H2x"]))
            badge = Table([[Paragraph(f"<b>{f['severity']}</b>", styles["Smallx"]), Paragraph(escape(f["fileline"]), styles["Smallx"]) ]], colWidths=[2.3*cm, 13.9*cm])
            badge.setStyle(TableStyle([("BACKGROUND",(0,0),(0,0),colors.HexColor(severity_color(f["severity"]))),("TEXTCOLOR",(0,0),(0,0),colors.white),("BOX",(0,0),(-1,-1),0.4,colors.HexColor(PALETTE["line"])),("VALIGN",(0,0),(-1,-1),"MIDDLE")]))
            finding_flow.append(badge)
            finding_flow.append(p(f["description"]))
            finding_flow.append(Paragraph("Por que é explorável", styles["H2x"]))
            finding_flow.append(p(f["exploit"]))
            finding_flow.append(Paragraph("Condição de explorabilidade", styles["H2x"]))
            finding_flow.append(p(f["condition"], "Callout"))
            finding_flow.append(Paragraph("Trecho relevante", styles["H2x"]))
            finding_flow.append(Paragraph(escape(f["snippet"]).replace("\n","<br/>").replace(" ","&nbsp;"), styles["AuditCode"]))
            finding_flow.append(Spacer(1, 6))
            story.append(KeepTogether(finding_flow))

        story.append(PageBreak())
        story.append(Paragraph("6. Tabela consolidada de achados", styles["H1x"]))
        data = [["Severidade", "Arquivo:linha", "Descrição"]]
        for f in FINDINGS:
            data.append([f["severity"], f["fileline"], f["title"]])
        tab = Table([[Paragraph(escape(str(c)), styles["Smallx"]) for c in row] for row in data], colWidths=[2.2*cm, 5.1*cm, 9.0*cm], repeatRows=1)
        ts=[("BACKGROUND",(0,0),(-1,0),colors.HexColor(PALETTE["navy"])),("TEXTCOLOR",(0,0),(-1,0),colors.white),("GRID",(0,0),(-1,-1),0.4,colors.HexColor(PALETTE["line"])),("VALIGN",(0,0),(-1,-1),"TOP"),("LEFTPADDING",(0,0),(-1,-1),5),("RIGHTPADDING",(0,0),(-1,-1),5),("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5)]
        for i,f in enumerate(FINDINGS, start=1):
            ts += [("BACKGROUND",(0,i),(0,i),colors.HexColor(severity_color(f["severity"]))),("TEXTCOLOR",(0,i),(0,i),colors.white)]
        tab.setStyle(TableStyle(ts)); story.append(tab)

        story.append(Paragraph("7. Testes gerais e evidências de cobertura", styles["H1x"]))
        test_rows = [
            ["Verificação", "Resultado"],
            ["CI main no commit auditado", "SUCCESS"],
            ["npm test no main", "12/12 testes passaram; 0 falhas"],
            ["Build TypeScript + Vite", "SUCCESS"],
            ["Lint", "64 erros e 2 warnings ainda existem; etapa está continue-on-error e portanto não bloqueia release"],
            ["Teste adicional de auditoria", "Executado no workflow: 13/13 testes passaram; inclui autorização por objeto, cross-case, staff e Origin"],
            ["npm audit produção", "Encontrou 5 vulnerabilidades no lockfile de produção: 2 baixas, 2 moderadas e 1 alta; a alta envolve undici <=6.27.0"],
            ["Secret scan", "PASS: nenhum formato de credencial de alta confiança encontrado no histórico Git completo ou em dist/"],
        ]
        tt = Table([[Paragraph(escape(c), styles["Smallx"]) for c in row] for row in test_rows], colWidths=[5.3*cm, 11.0*cm], repeatRows=1)
        tt.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),colors.HexColor(PALETTE["navy"])),("TEXTCOLOR",(0,0),(-1,0),colors.white),("GRID",(0,0),(-1,-1),0.4,colors.HexColor(PALETTE["line"])),("VALIGN",(0,0),(-1,-1),"TOP")]))
        story.append(tt)
        story.append(p("Observação importante: o lint atual contém dívida técnica pré-existente e, por estar configurado com continue-on-error, um workflow verde não significa lint limpo. Recomenda-se tornar lint bloqueante após corrigir a dívida.", "Callout"))

        story.append(Paragraph("8. Recomendações priorizadas", styles["H1x"]))
        recs = [
            ("P1", "Atualizar dependências vulneráveis de produção", "Atualizar AI SDK/Google SDK e a cadeia undici/provider-utils para versões corrigidas; validar npm audit, testes e comportamento do assistente."),
            ("P2", "Bloquear abuso de storage/DB", "Rate limit, quotas por caso/IP, soma de bytes, reserva de quota e testes 429/limite."),
            ("P3", "Garantir imutabilidade da evidência", "Chaves/versões únicas, sem overwrite após complete, persistir hash/ETag/version e validar identidade."),
            ("P4", "Trazer Tango/WebADB para o bundle", "Remover import remoto do jsDelivr e fixar dependências no package-lock; depois adotar CSP mais restritiva."),
            ("P5", "Rate limit do assistente", "Aplicar orçamento e concorrência; desabilitar endpoint quando a feature não estiver ativa."),
            ("P6", "Endurecer cookie para self-hosting", "Secure por política explícita de produção e teste de configuração."),
            ("P7", "Minimizar health público", "Separar liveness público de readiness detalhado protegido."),
            ("P8", "Pagar dívida de lint", "Corrigir 64 erros/2 warnings e remover continue-on-error para que regressões futuras bloqueiem merge."),
        ]
        for pri,title,desc in recs:
            story.append(Paragraph(f"<b>{pri}</b> - {escape(title)}", styles["H2x"])); story.append(p(desc))

        story.append(PageBreak())
        story.append(Paragraph("9. ISSUES PARA O GITHUB", styles["H1x"]))
        story.append(p("Os blocos abaixo estão em Markdown completo, prontos para copiar e colar. Achados de abuso relacionados foram agrupados para reduzir spam de issues."))
        for issue in ISSUES:
            story.extend(issue_block(issue))

        story.append(HRFlowable(width="100%", thickness=0.7, color=colors.HexColor(PALETTE["line"]), spaceBefore=10, spaceAfter=8))
        story.append(p(f"Fim do relatório. Base auditada: {AUDITED_SHA}. Gerador: docs/security-audit/generate_report.py.", "Smallx"))
        doc.build(story)


if __name__ == "__main__":
    build_pdf()
    print(OUT)
