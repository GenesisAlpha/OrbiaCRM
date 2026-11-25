<div align="center">

🇧🇷 Português · [🇺🇸 English](README.en.md) · [🇪🇸 Español](README.es.md)

# OrbiaCRM

**O sistema operacional de vendas com IA — CRM, atendimento e cobranças numa só mesa.**

Agentes de IA que atendem, qualificam e vendem no WhatsApp, com gestão de vendas, financeiro e módulos de cobrança integrados. Self-hosted, multi-tenant e extensível.

[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%2BAuth%2BStorage-3ecf8e?logo=supabase)](https://supabase.com)
[![Self-hosted](https://img.shields.io/badge/self--hosted-1%20comando-orange)](hostgator-setup-kit/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

[**⚡ Instalar**](#-instalar-na-sua-vps) · [**🔄 Atualizar**](#-atualizar) · [**🧭 Visão**](VISION.md) · [**🏗️ Arquitetura**](ARCHITECTURE.md) · [**📚 Documentação**](#-documentação)

</div>

---

> **Origem e licença.** Este repositório é um fork de DeskcommCRM, criado por Rafael Melgaço e distribuído sob licença **MIT** ([`LICENSE`](LICENSE)). Mantemos o aviso de copyright original e agradecemos o trabalho feito. O OrbiaCRM é a linha de produto da ORBIA, com identidade, módulos e roadmap próprios.
>
> As marcas e os módulos de cobrança podem evoluir em variantes (por exemplo, superfícies de pagamento dedicadas) sem alterar o núcleo deste CRM: **o foco do OrbiaCRM é administração e gestão de vendas**, com os pagamentos como camada adicional integrada.

---

## ✨ O que é

**OrbiaCRM** reúne numa única operação: atendimento, funil de vendas, pós-venda, agentes de IA e um módulo financeiro com contas, formas de pagamento, comandas, comissões e fidelidade. É multi-tenant: uma instalação atende várias organizações com isolamento por RLS.

O projeto herda uma base madura: Next.js 16 App Router, Supabase (Postgres + Auth + Storage + Realtime), WhatsApp via WAHA ou canal oficial da Meta, agentes de IA com RAG por tenant e um servidor MCP interno.

### Diferenciais

- 🤖 **Agentes de IA que operam o CRM** — RAG por tenant, skills executadas durante o atendimento, memória da operação, análise de sentimento, handoff IA→humano auditado, IA como assignee de primeira classe e teto de gasto por organização.
- 🔁 **Nada morre no silêncio** — follow-up que retoma conversas esfriadas, radar de risco e central de avisos para decisão humana.
- 🧠 **Agentes que se auto-aprimoram** — conversas resolvidas viram conhecimento novo; propostas de melhoria aplicáveis como versão nova, sempre com gate humano.
- 🧩 **Multi-nicho por design** — vocabulário configurável por pipeline (lead vira Cliente, Paciente ou Comprador; won vira Pago, Agendado ou Fechado).
- 💬 **WhatsApp de duas formas** — QR code (WAHA multi-número, anti-banimento) ou canal oficial da Meta.
- 👥 **Governança de atendimento** — RBAC server-side, atribuição e transferência auditadas, fila com rodízio e roteamento automático por intenção.
- 🏢 **Multi-tenant + LGPD by-design** — RLS em toda tabela tenant-aware com teste de isolamento no CI; anonimização preferida sobre delete; audit append-only.
- 💰 **Financeiro e cobranças integrados** — contas, formas de pagamento, plano de contas, comandas, comissões, fidelidade e lançamentos imutáveis com saldo derivado por soma. A régua de cobrança da instalação suporta Stripe, Asaas e Efi.
- 🖥️ **Self-hosted de verdade** — dados na sua VPS, instalação e atualização com 1 comando, sem feature travada.

### 🔌 Webhooks & Automações

Cada tenant pode criar fontes de captação (`/api/v1/webhooks/in/<token>`) que recebem leads de landing pages, formulários ou ferramentas como Zapier/n8n e entram direto no funil. Sobre esses eventos, o tenant monta automações QUANDO/SE/ENTÃO: adicionar tag, mover lead, atribuir atendente, enviar mensagem ou avisar outro sistema via webhook de saída.

Por baixo, cada evento vira uma linha em `event_log`; nenhum trigger de banco faz HTTP diretamente. A rota `/api/v1/cron/event-log-drain` drena a fila a cada minuto. O instalador configura o cron sozinho.

---

## 🖥️ O que você opera (as telas)

| Grupo | Telas |
|---|---|
| **Atendimento** | Inbox · Radar · Respostas rápidas |
| **CRM** | Kanban · Contatos · Funis |
| **Agente de IA** | Agentes · Follow-ups · Roteadores · Provedores · Conhecimento (RAG) · Memória · Skills · Casos · Alertas · Propostas · Uso e orçamento |
| **Canais** | Conexões · Nuvemshop · Webhooks |
| **Análise** | Desempenho · Evolução da IA · Audit Log |
| **Organização** | Equipe · Distribuição de atendimento · Organização · LGPD · API Tokens · Segurança · Billing |
| **Módulos** | Financeiro (contas, formas de pagamento, plano de contas, comandas, comissões, fidelidade) |

Toda tela tem porta na navegação — o CI reprova tela que só se alcança digitando a URL.

---

## 🧱 Stack

| Camada | Escolha | Por quê |
|---|---|---|
| **Frontend** | Next.js 16 App Router + React 19 + TypeScript estrito | Server Components + Route Handlers no mesmo repo |
| **Estilo** | Tailwind + shadcn/ui | Customizável sem lock-in |
| **DB** | Supabase (Postgres + RLS + `vector`) | Multi-tenant nativo, embedding para RAG |
| **Auth** | Supabase Auth via `@supabase/ssr` | Cookie SameSite=Strict, HttpOnly |
| **Realtime** | Supabase Realtime | `postgres_changes` + broadcast |
| **Storage** | Supabase Storage (URLs assinadas) | Bucket privado `whatsapp-media` |
| **WhatsApp** | WAHA Plus (NOWEB) + Meta Cloud API | QR para começar; canal oficial para escala |
| **Filas** | `event_log` + workers (cron) | Trigger de banco nunca faz HTTP |
| **Rate limit** | Upstash Redis | Serverless, free tier suficiente |
| **IA** | Vercel AI SDK — OpenRouter, Requesty, Anthropic, OpenAI e Google | Troca por parte do sistema pela tela |
| **Validação** | Zod | Input externo, env e payloads |
| **Observability** | Sentry (scrub de PII) | Telemetria opt-in na instalação |
| **Hospedagem** | VPS com Docker | App + WhatsApp + workers na sua máquina |

Detalhes: [`ARCHITECTURE.md`](ARCHITECTURE.md).

### 💰 Camada financeira já presente

O schema (`supabase/baseline.sql`) já traz:

- `financial_accounts` — onde o dinheiro fica (`cash`, `bank`, `other`), com `opening_balance_cents` e moeda;
- `payment_methods` — como o cliente paga, apontando para a conta de destino;
- `account_plans` — classificação contábil com direção `in`/`out`;
- `financial_entries` — lançamentos com valor em `_cents`, direção, status `pending`/`paid`, contra-lançamento e **imutabilidade após pagamento**;
- `sales`, `sale_items`, `commission_rules`, `commissions`, `loyalty_ledger` — provisionados pelo módulo financeiro quando instalado;
- `cobranca_planos` e `cobranca_assinaturas` — régua de cobrança da instalação, com provedores Stripe/Asaas/Efi, `checkout_url` e `checkout_expira_em`.

**Invariante:** o saldo corrente é sempre derivado por soma dos lançamentos, nunca gravado. O módulo de cobrança cobra a instalação (SaaS); pagamentos de merchants e wallets em várias moedas são uma camada adicional a integrar, não parte deste núcleo.

---

## ⚡ Instalar na sua VPS

### 1. Entre na sua VPS

```bash
ssh -p PORTA root@SEU_IP
```

### 2. Rode o instalador

```bash
git clone https://github.com/GenesisAlpha/OrbiaCRM.git
cd OrbiaCRM
bash hostgator-setup-kit/install.sh
```

Você não instala Node, pnpm nem compila nada — a imagem do app já vem pronta. O instalador é idempotente: rodar de novo não duplica cron nem recria usuário.

### O que você precisa ter em mãos

| Item | Onde conseguir |
|---|---|
| **VPS com Docker** | Qualquer VPS com Docker (4 GB de RAM recomendados) |
| **Domínio** | Registro **A** apontando para o IP da VPS |
| **Banco** | Projeto no Supabase — 3 chaves + connection string do Session pooler |
| **IA** | Chave de OpenRouter, Anthropic ou OpenAI |
| **WhatsApp** | Seu número, conectado por QR code no onboarding (ou canal oficial da Meta) |

> O instalador aceita também VPS ARM64/aarch64 e Supabase self-hosted na mesma VPS. Exporte `SUPABASE_ACCESS_TOKEN` para ele criar o projeto automaticamente.

### Primeiro acesso

Abra `https://<seu-domínio>`, entre com o admin e ligue o MFA em Configurações › Segurança se quiser — é **opcional**. No onboarding, escaneie o QR code com o WhatsApp do seu número.

---

## 🔄 Atualizar

Pela tela: o rodapé acende **"Nova versão"**; clique e a atualização faz backup do banco, aplica o `baseline.sql` (idempotente e auto-curativo) e puxa a imagem nova, com rollback automático se algo falhar.

Pelo terminal:

```bash
cd /caminho/do/OrbiaCRM
bash hostgator-setup-kit/update.sh
```

Outros comandos do kit: `backup.sh`, `restore.sh`, `reset-password.sh`, `reset-mfa.sh`, `healthcheck.sh` e `desinstalar_docker.sh`.

---

## 🧑‍💻 Desenvolvimento

> ⚠️ Para **usar** o CRM, siga o instalador. Esta seção é para quem vai mexer no código.

```bash
git clone https://github.com/GenesisAlpha/OrbiaCRM.git
cd OrbiaCRM

nvm use
npm install -g pnpm && pnpm install
cp .env.example .env.local

psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -c \
  'create extension if not exists vector with schema public;
   create extension if not exists citext with schema public;
   create extension if not exists pg_trgm with schema public;'

psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/baseline.sql
pnpm dev
```

App: <http://localhost:3000> · Health check: <http://localhost:3000/api/v1/health>

> O schema real vive em `supabase/baseline.sql`, o mesmo que o instalador aplica na VPS. As migrations antigas são stubs; `supabase db push` "passa" e deixa o banco vazio.

---

## 📁 Estrutura

```
OrbiaCRM/
├── app/                    # Next.js App Router
│   ├── (admin)/            # Rotas super-admin
│   ├── (public)/           # Login, recovery
│   ├── app/                # Rotas autenticadas
│   └── api/v1/             # API REST canônica
├── components/             # React (ui/, inbox/, kanban/, shell/, ...)
├── lib/                    # supabase/, waha/, ai/, api/, routing/, ...
├── workers/                # consumers de event_log
├── supabase/migrations/    # SQL versionado (+ baseline.sql)
├── tests/{e2e,unit,invariants,shell}/
├── docs/                   # PRDs, specs, runbooks
└── hostgator-setup-kit/    # instalação e atualização self-host
```

---

## 🧪 Testes

```bash
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm test:db
pnpm test:e2e
```

Estes checks são obrigatórios para mergear na `main`. O CI inclui isolamento RLS, build Node 22, E2E e construção das imagens Docker.

---

## 📚 Documentação

| Doc | O que tem |
|---|---|
| [`docs/white-label.md`](docs/white-label.md) | Instalar para clientes: trocar marca, uma instalação por cliente vs compartilhada, revenda |
| [`VISION.md`](VISION.md) | Visão e posicionamento do produto |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Visão de 1 página da arquitetura |
| [`CHANGELOG.md`](CHANGELOG.md) | O que mudou em cada versão |
| [`CLAUDE.md`](CLAUDE.md) | Convenções para contribuir |
| [`docs/index.md`](docs/index.md) | Índice geral da documentação |
| [`docs/specs/`](docs/specs/) | Specs técnicas (schema SQL, payloads, MCP, governança) |

---

## 🛟 Rebranding e white-label

A marca é **configuração, não edição de código**. Em `/admin/marca` trocam-se nome, cor e logo da instalação sem reiniciar nada; cada organização pode ter a própria marca dentro do sistema. As variáveis `APP_NAME`, `APP_LOGO_URL` e `APP_ACCENT_HEX` no `.env` são a semente e o piso de rollback; o banco manda depois da primeira leitura.

Dois nomes técnicos não mudam: o cabeçalho `X-Deskcomm-Signature` dos webhooks de saída e o cookie de sessão — renomeá-los derrubaria integrações existentes em silêncio. O relatório de LGPD do titular não leva marca: ele nomeia o controlador (a razão social da organização), por decisão legal.

Guia completo em [`docs/white-label.md`](docs/white-label.md).

---

## 📜 Licença

Distribuído sob a licença **MIT** — veja [`LICENSE`](LICENSE). O aviso de copyright de Rafael Melgaço é mantido conforme exigido pela licença. Você pode usar, modificar e distribuir livremente, inclusive comercialmente. O software é fornecido **"como está", sem garantias**.

---

## 🙏 Agradecimentos

- **Rafael Melgaço e a comunidade DeskcommCRM** — a base sobre a qual este fork foi construído.
- **WAHA** — engine WhatsApp.
- **Supabase** — Postgres + Auth + Storage + Realtime numa stack só.
- **Anthropic**, **OpenAI** e **OpenRouter** — provedores de IA.
- **shadcn/ui** — base de componentes.

---

<div align="center">

**OrbiaCRM** · Sistema operacional de vendas com IA, self-hosted e extensível.

</div>
