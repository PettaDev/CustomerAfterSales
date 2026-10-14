# Modelo de cadastro e verificação de pontos de apoio BRTE

Cada unidade deve ser aprovada por responsável regional antes de divulgação. Não confundir loja comercial, apoio à coleta de logs e assistência técnica.

## Dados por local
- **Identificador público seguro (slug):**
- **Marca(s):** Infinix / TECNO / itel
- **Nome comercial oficial:**
- **CNPJ/entidade operadora da loja (interno, não publicar por padrão):**
- **Estado (UF) / cidade / bairro:**
- **CEP / rua / número / complemento / andar / loja:**
- **Contato oficial (telefone/WhatsApp, consentimento para publicar):**
- **Horários de funcionamento verificados:**
- **Fotos autorizadas para publicação (fachada, interior, balcão):**
- **Pessoa que confirmou endereço e data da conferência:**
- **Tipo da unidade:** varejo / apoio na coleta / centro autorizado
- **Serviços confirmados:** orientação / upload assistido / coleta ADB / reparo / garantia
- **Restrição de serviço:** por modelo, região, tipo de caso ou agendamento
- **Autorização formal de publicação:** responsável / data / referência interna
- **Data da próxima revisão de dados:**

## Regras de publicação
- Endereço recebido **não implica** disponibilidade de atendimento, coleta ou garantia.
- Não publicar telefone pessoal de colaborador sem autorização.
- Serviços de garantia e reparo exigem comprovação de credenciamento.
- Manter `officialServiceCenter=false` até confirmação por After-Sales e documentação oficial.
- O campo `photo` aceita somente caminho local no repositório `/store-photos/`. Evitar URLs externas sem autorização.
- A primeira loja em Galeria Pagé é **cadastro inicial**; serviços e horário ainda precisam ser verificados.

## Atualização técnica
Editar `public/pontos-de-apoio/locations.json` com registro completo e executar `npm run check:stores`, `npm test` e `npm run build`. Solicitar revisão do responsável regional no PR antes de publicar. Os filtros e cartões são alimentados por esse arquivo.
