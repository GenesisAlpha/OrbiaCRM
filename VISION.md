# 🧭 Visão — OrbiaCRM

> **O sistema operacional de vendas com agentes de IA, open source, nativo no WhatsApp.**
> Este documento é a fonte da verdade do posicionamento do projeto. Tudo que for público (README, site, docs, descrições) deriva daqui.

---

## OrbiaCRM: o nome e a linha de produto

**OrbiaCRM** é o CRM da **ORBIA**. O nome diz onde o produto vive: na administração e na gestão de vendas da operação comercial.

O "CRM" é a categoria de entrada, não o teto. O OrbiaCRM é **mais que um CRM**: é o sistema onde a venda acontece. Os pagamentos entram como **módulo adicional**, com várias marcas-superfície possíveis, sem virar o centro da identidade do produto.

## De onde viemos, pra onde vamos

O OrbiaCRM é um fork do DeskcommCRM, criado por Rafael Melgaço e distribuído sob licença **MIT**. A base nasceu em 2026 como um CRM operacional para **e-commerce brasileiro** — WhatsApp via WAHA, integração Nuvemshop, LGPD nativa. Na linha Orbia, a operação comercial continua no centro: **clínicas, infoprodutos, imobiliárias, agências e prestadores de serviço** — qualquer negócio que vende conversando.

Os pedidos de feature dessa comunidade empurraram o produto na direção que hoje é a nossa identidade: **agentes de IA cada vez mais capazes, integrados ao sistema via MCP, operando o CRM de verdade**. O e-commerce continua sendo um caso de uso de primeira classe (foi nosso berço e a integração Nuvemshop prova isso) — mas ele é **um** vertical, não **o** produto.

**A linha Orbia, em uma frase:** um CRM da ORBIA para **administração e gestão de vendas**, com agentes de IA, WhatsApp e pagamentos como camada adicional — para qualquer negócio que vende conversando.

## O que acreditamos sobre agentes de IA

1. **Agente que opera, não chatbot que enfeita.** Nosso agente lê contexto real (histórico, perfil, pedido), consulta a base de conhecimento do tenant (RAG por organização), responde, qualifica, move o lead no funil — e é **assignee de primeira classe** no sistema, com as mesmas regras de governança de um atendente humano.

2. **Agentes que se auto-aprimoram.** O sistema é desenhado como um flywheel: conversas resolvidas viram conhecimento novo na base RAG; handoffs pro humano marcam onde o agente ainda não alcança; métricas e budget por tenant fecham o loop. Cada dia de operação torna o agente melhor — com **gate humano** nas decisões que importam. Essa é a aposta central do roadmap.

3. **MCP como sistema nervoso.** O CRM inteiro é exposto como tools MCP — primeiro para os agentes internos, depois como contrato público. Um negócio deve poder plugar o agente que quiser (Claude, o que vier) e ele **opera** o OrbiaCRM: cria lead, responde cliente, agenda, consulta pedido. O CRM vira infraestrutura para agentes.

4. **Humano no comando.** Handoff auditado, escopo por papel (RBAC), fila com posição, budget de IA por organização. Autonomia do agente cresce na medida em que a governança prova que ele acerta.

## Os pilares do produto

| Pilar | O que significa na prática |
|---|---|
| **Agentes de IA nativos** | RAG por tenant, análise de sentimento, handoff IA→humano auditado, IA como assignee, budget por org |
| **CRM automatizado pela IA** | O agente move leads, aplica tags, dispara automações QUANDO/SE/ENTÃO — o funil anda sozinho |
| **Ferramentas de apoio ao comercial** | Inbox em tempo real, kanban com fractional indexing, customer 360, métricas por atendente, roteamento automático |
| **WhatsApp-native** | WAHA multi-número, anti-banimento, mídia, STOP detection — o canal onde o Brasil vende |
| **Multi-nicho por design** | `vocabulary` configurável por pipeline (lead = Cliente/Paciente/Comprador; won = Pago/Agendado/Fechado) — o mesmo core serve e-commerce, clínica, imobiliária, infoproduto |
| **Self-hosted de verdade** | Seus dados na sua VPS, kit de instalação com 1 comando, `baseline.sql` auto-curativo, atualização com 1 script |
| **Compliance nativo** | Multi-tenant com RLS testada em CI, LGPD by-design (redact, data_request, anonimização), audit append-only |

## Posicionamento

**Categoria de entrada (âncora):** a alternativa **open source e self-hosted** às plataformas fechadas de atendimento, CRM e gestão de vendas (Kommo, Octadesk, Intercom, Zendesk).

**Categoria própria (bandeira):** **CRM da ORBIA para administração e gestão de vendas, com agentes de IA**. Os incumbentes vendem assinatura de chat com bot acoplado; nós entregamos um sistema onde o agente de IA é operador nativo, o código é seu e os pagamentos são um módulo à parte, com várias marcas-superfície possíveis.

**Uma frase (pt-br):**
> OrbiaCRM é o CRM da ORBIA para administração e gestão de vendas, com agentes de IA nativos e WhatsApp — self-hosted, multi-tenant, com pagamentos como módulo adicional, para qualquer negócio que vende conversando.

**One-liner (en):**
> OrbiaCRM: the ORBIA CRM for sales management and administration, with native AI agents and WhatsApp — self-hosted, with payments as an optional module and multiple surface brands.

**Público:** negócios brasileiros (e além) que vendem pelo WhatsApp — e-commerce, clínicas, imobiliárias, infoprodutores, agências, serviços — e a comunidade dev/self-hosted que instala pra si ou pra clientes.

## Modelo do projeto (sem letra miúda)

- **O software é 100% open source (MIT), completo, sem versão paga.** Nós não vendemos assinatura; quem instala pode cobrar os próprios clientes ([ADR-0004](docs/adr/0004-cobranca-do-revendedor.md)). Não existe feature travada.
- **A monetização é por infraestrutura:** o projeto é desenvolvido em parceria com a **HostGator** — o caminho recomendado de produção é a VPS deles (datacenter em São Paulo), instalada pelo `hostgator-setup-kit` com 1 comando. Assinar pelo link de parceiro apoia o projeto e sai mais barato pra quem assina.
- **O caminho genérico nunca é sabotado:** `docker compose` e o kit self-host funcionam em qualquer VPS. A parceria é o caminho recomendado, nunca o único. (Regra de ouro do open source sustentável: percepção de pegadinha mata a marca.)

## Princípios de comunicação

1. **Keyword primeiro, jargão depois.** Em todo título público: "open source", "AI agents", "WhatsApp", "CRM", "self-hosted" antes de qualquer nome interno de subsistema.
2. **Mostrar, não descrever.** Screenshot/GIF do produto no primeiro scroll de qualquer página.
3. **Âncora explícita.** "Alternativa open source a X" aparece no About do GitHub, no README e no site — é assim que a demanda dos incumbentes nos encontra (busca e LLMs).
4. **E-commerce é exemplo, não definição.** Ao citar casos de uso, sempre em lista multi-nicho ("e-commerce, clínicas, imobiliárias..."). Pagamentos são camada adicional, nunca a definição do produto.
5. **Transparência de modelo.** Parceria HostGator e telemetria declaradas em linguagem humana no README, nunca escondidas.

## Norte de 3 anos

Ser a resposta padrão — do Google, do ChatGPT, do Reddit e do dev brasileiro — para a pergunta **"qual o melhor CRM open source com agentes de IA e WhatsApp para gestão de vendas?"**; com milhares de instâncias self-hosted rodando, um ecossistema de agentes plugados via MCP público, e um flywheel de auto-aprimoramento que faça cada instância vender melhor a cada mês de operação.

---

*Última revisão: 2026-11-25 — rebrand para OrbiaCRM: CRM da ORBIA focado em administração e gestão de vendas, pagamentos como módulo adicional. Revisões anteriores: 2026-09-29 (quem instala pode cobrar os próprios clientes, ADR-0004) e 2026-07-19 (reposicionamento e-commerce → multi-nicho / AI Sales OS).*

*Crédito obrigatório: fork de DeskcommCRM, criado por Rafael Melgaço, sob licença MIT.*
