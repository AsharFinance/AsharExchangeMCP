# Ashar Exchange MCP Server

**[English](#english) | [Português](#português) | [中文](#中文)**

---

<a id="english"></a>

[Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for the **Ashar Exchange API** — PIX ↔ USDC/USDT exchange with platform fees (payins, payouts, transfers, wallets, customers and stats).

Inspired by the BlindPay MCP: it is a standalone HTTP wrapper that calls the public API at `https://api.ashar.finance/v2`, authenticated via the `X-Ashar-Tenant-Key` header.

## Features

- **40 tools** with the `ashar_` prefix, covering every API group:
  - **Quotes** — payin, payout and transfer quotes (with fee markup)
  - **PayIns** — PIX deposit → stablecoin, listing and querying
  - **Payouts** — stablecoin withdrawal → PIX
  - **Transfers** — wallet → blockchain transfer
  - **Wallets** — wallets and balances
  - **Bank Accounts** — PIX bank accounts
  - **Stats** — daily/monthly metrics and fee rates
  - **Customers** — customer onboarding + sub-resources (bank accounts, wallets, virtual accounts)
  - **Admin/Provisioning** — provision test tenant, list tenants and manage credentials
- **Selectable transport** — stdio (default) or Streamable HTTP via environment variable
- **Actionable errors** — HTTP code mapping (400/401/403/404/409/429/503) with hints

## Requirements

- Node.js >= 18

## Installation

```bash
cd mcp
npm install
npm run build
```

For development with hot-reload:

```bash
npm run dev
```

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `ASHAR_EXCHANGE_TENANT_KEY` | Tenant API key (`ash_proxy_...`) used in the `X-Ashar-Tenant-Key` header. Required for protected endpoints; admin endpoints work without it. | — |
| `ASHAR_EXCHANGE_BASE_URL` | API base URL | `https://api.ashar.finance/v2` |
| `ASHAR_EXCHANGE_TRANSPORT` (or `TRANSPORT`) | `stdio` or `http` | `stdio` |
| `PORT` | HTTP server port (used with the `http` transport) | `3001` |

## Usage

### stdio (default)

```json
{
  "mcpServers": {
    "ashar-exchange": {
      "command": "node",
      "args": ["/path/to/AsharExchangeMCP/dist/index.js"],
      "env": {
        "ASHAR_EXCHANGE_TENANT_KEY": "ash_proxy_..."
      }
    }
  }
}
```

### Streamable HTTP

```bash
ASHAR_EXCHANGE_TRANSPORT=http PORT=3001 node dist/index.js
```

- MCP endpoint: `http://localhost:3001/mcp`
- Health check: `http://localhost:3001/health`

## Consumption modes

There are two ways for a client to consume the Ashar Exchange MCP:

### Option 1 — Hosted service (Streamable HTTP) ⭐

Ashar runs the MCP server as a public service on the **`mcp.ashar.finance`** subdomain. The client **installs nothing** — it points its MCP client to `https://mcp.ashar.finance/mcp` and sends the tenant key.

```json
{
  "mcpServers": {
    "ashar-exchange": {
      "url": "https://mcp.ashar.finance/mcp",
      "headers": {
        "X-Ashar-Tenant-Key": "ash_proxy_..."
      }
    }
  }
}
```

- Public health check: `https://mcp.ashar.finance/health`

- Ideal for **agents/LLMs** that speak MCP without running infrastructure.
- All requests go through the Ashar server, which applies the **tenant spread/fee** and can **monitor** every operation.
- Provisioning endpoints (`ashar_provision_test_tenant`) work without a key.

### Option 2 — Self-host (stdio)

The client runs the server locally (or in its own container) and points it to Ashar's public API.

```json
{
  "mcpServers": {
    "ashar-exchange": {
      "command": "node",
      "args": ["/path/to/AsharExchangeMCP/dist/index.js"],
      "env": {
        "ASHAR_EXCHANGE_TENANT_KEY": "ash_proxy_..."
      }
    }
  }
}
```

- Ideal for **CLIs / editors / IDEs** and for clients who prefer to manage their own process.
- Still goes through the public API (`https://api.ashar.finance/v2`), keeping spread and monitoring server-side.

> Both modes **do not replace the REST API** (`/v2`). A traditional client (app/site/backend) integrates directly via REST; the MCP is the channel for AI agents.

## Deploy (hosted service)

The **`mcp.ashar.finance`** subdomain points to the `AsharExchangeMCP` service on Railway (port 3001). The build uses the [Dockerfile](Dockerfile) and the config in [railway.json](railway.json).

```bash
cd mcp
railway login
railway up        # uses the Dockerfile; runs on :3001 with ASHAR_EXCHANGE_TRANSPORT=http
```

Public routing (at the gateway):
- `mcp.ashar.finance/mcp`  → service `:3001/mcp` (no strip)
- `mcp.ashar.finance/health` → service `:3001/health`

Recommended environment variables on the service:

| Var | Value |
|-----|-------|
| `ASHAR_EXCHANGE_TRANSPORT` | `http` (default already in the Dockerfile) |
| `PORT` | `3001` (default already in the Dockerfile) |
| `ASHAR_EXCHANGE_BASE_URL` | `https://api.ashar.finance/v2` |
| `ASHAR_EXCHANGE_TENANT_KEY` | optional — default key for protected calls |

## Typical flow

1. (`ashar_provision_test_tenant`) — optional, to create a test tenant with a new key
2. `ashar_create_payin_quote` → `ashar_execute_payin` (deposit)
3. `ashar_create_payout_quote` → `ashar_execute_payout` (withdrawal)
4. `ashar_get_daily_stats` / `ashar_get_monthly_stats` / `ashar_get_fee_rates` (tracking and fees)

## Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compiles TypeScript to `dist/` |
| `npm run dev` | Runs with hot-reload (`tsx watch`) |
| `npm run start` | Runs the build (`node dist/index.js`) |
| `npm run typecheck` | Type-checks without emitting (`tsc --noEmit`) |

## License

To be defined. Contact Ashar Finance.

---

<a id="português"></a>

Servidor [Model Context Protocol (MCP)](https://modelcontextprotocol.io) para a **Ashar Exchange API** — câmbio PIX ↔ USDC/USDT com fees de plataforma (payins, payouts, transfers, wallets, customers e stats).

Inspirado no BlindPay MCP: é um wrapper HTTP autônomo que chama a API pública em `https://api.ashar.finance/v2`, autenticado via header `X-Ashar-Tenant-Key`.

## Recursos

- **40 ferramentas** com prefixo `ashar_`, cobrindo todos os grupos da API:
  - **Quotes** — cotação de payin, payout e transfer (com markup de fees)
  - **PayIns** — depósito PIX → stablecoin, listagem e consulta
  - **Payouts** — saque stablecoin → PIX
  - **Transfers** — transferência wallet → blockchain
  - **Wallets** — carteiras e saldos
  - **Bank Accounts** — contas bancárias PIX
  - **Stats** — métricas diárias/mensais e taxas de fee
  - **Customers** — customer onboarding + sub-recursos (bank accounts, wallets, virtual accounts)
  - **Admin/Provisioning** — provisionar tenant de teste, listar tenants e gerenciar credenciais
- **Transporte selecionável** — stdio (padrão) ou Streamable HTTP via variável de ambiente
- **Erros acionáveis** — mapeamento de códigos HTTP (400/401/403/404/409/429/503) com hints

## Requisitos

- Node.js >= 18

## Instalação

```bash
cd mcp
npm install
npm run build
```

Para desenvolvimento com hot-reload:

```bash
npm run dev
```

## Configuração

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `ASHAR_EXCHANGE_TENANT_KEY` | Chave de API do tenant (`ash_proxy_...`) usada no header `X-Ashar-Tenant-Key`. Obrigatória para endpoints protegidos; admin endpoints funcionam sem ela. | — |
| `ASHAR_EXCHANGE_BASE_URL` | Base URL da API | `https://api.ashar.finance/v2` |
| `ASHAR_EXCHANGE_TRANSPORT` (ou `TRANSPORT`) | `stdio` ou `http` | `stdio` |
| `PORT` | Porta do servidor HTTP (usada com transporte `http`) | `3001` |

## Uso

### stdio (padrão)

```json
{
  "mcpServers": {
    "ashar-exchange": {
      "command": "node",
      "args": ["/caminho/para/AsharExchangeMCP/dist/index.js"],
      "env": {
        "ASHAR_EXCHANGE_TENANT_KEY": "ash_proxy_..."
      }
    }
  }
}
```

### Streamable HTTP

```bash
ASHAR_EXCHANGE_TRANSPORT=http PORT=3001 node dist/index.js
```

- Endpoint MCP: `http://localhost:3001/mcp`
- Health check: `http://localhost:3001/health`

## Modos de consumo

Há duas formas de um cliente consumir o Ashar Exchange MCP:

### Opção 1 — Serviço hospedado (Streamable HTTP) ⭐

A Ashar opera o servidor MCP como um serviço público no subdomínio **`mcp.ashar.finance`**. O cliente **não instala nada** — aponta seu cliente MCP para `https://mcp.ashar.finance/mcp` e envia a chave do tenant.

```json
{
  "mcpServers": {
    "ashar-exchange": {
      "url": "https://mcp.ashar.finance/mcp",
      "headers": {
        "X-Ashar-Tenant-Key": "ash_proxy_..."
      }
    }
  }
}
```

- Health check público: `https://mcp.ashar.finance/health`

- Ideal para **agentes/LLMs** que falam MCP sem precisar rodar infra.
- Todas as requests passam pelo servidor Ashar, que aplica o **spread/fee do tenant** e pode **monitorar** cada operação.
- Endpoints de provisionamento (`ashar_provision_test_tenant`) funcionam sem chave.

### Opção 2 — Self-host (stdio)

O cliente roda o servidor localmente (ou no próprio container) e aponta para a API pública da Ashar.

```json
{
  "mcpServers": {
    "ashar-exchange": {
      "command": "node",
      "args": ["/caminho/para/AsharExchangeMCP/dist/index.js"],
      "env": {
        "ASHAR_EXCHANGE_TENANT_KEY": "ash_proxy_..."
      }
    }
  }
}
```

- Ideal para **CLI / editores / IDEs** e para clientes que preferem manter o processo por conta própria.
- Continua passando pela API pública (`https://api.ashar.finance/v2`), mantendo spread e monitoramento no servidor.

> Ambos os modos **não substituem a API REST** (`/v2`). Um cliente tradicional (app/site/backend) integra direto pela REST; o MCP é o canal para agentes de IA.

## Deploy (serviço hospedado)

O subdomínio **`mcp.ashar.finance`** aponta para o serviço `AsharExchangeMCP` no Railway (porta 3001). O build é via [Dockerfile](Dockerfile) e a config em [railway.json](railway.json).

```bash
cd mcp
railway login
railway up        # usa o Dockerfile; sobe em :3001 com ASHAR_EXCHANGE_TRANSPORT=http
```

Roteamento público (no gateway):
- `mcp.ashar.finance/mcp`  → serviço `:3001/mcp` (sem strip)
- `mcp.ashar.finance/health` → serviço `:3001/health`

Variáveis de ambiente recomendadas no serviço:

| Var | Valor |
|-----|-------|
| `ASHAR_EXCHANGE_TRANSPORT` | `http` (default já no Dockerfile) |
| `PORT` | `3001` (default já no Dockerfile) |
| `ASHAR_EXCHANGE_BASE_URL` | `https://api.ashar.finance/v2` |
| `ASHAR_EXCHANGE_TENANT_KEY` | opcional — chave default p/ chamadas protegidas |

## Fluxo típico

1. (`ashar_provision_test_tenant`) — opcional, para criar um tenant de teste com uma chave nova
2. `ashar_create_payin_quote` → `ashar_execute_payin` (depósito)
3. `ashar_create_payout_quote` → `ashar_execute_payout` (saque)
4. `ashar_get_daily_stats` / `ashar_get_monthly_stats` / `ashar_get_fee_rates` (acompanhamento e fees)

## Scripts

| Script | Descrição |
|--------|-----------|
| `npm run build` | Compila TypeScript para `dist/` |
| `npm run dev` | Executa com hot-reload (`tsx watch`) |
| `npm run start` | Executa o build (`node dist/index.js`) |
| `npm run typecheck` | Verifica tipos sem emitir (`tsc --noEmit`) |

## Licença

A definir. Contate a Ashar Finance.

---

<a id="中文"></a>

针对 **Ashar Exchange API** 的 [Model Context Protocol (MCP)](https://modelcontextprotocol.io) 服务器 —— 用于 PIX ↔ USDC/USDT 兑换，并收取平台费用（payins、payouts、transfers、wallets、customers 和 stats）。

受 BlindPay MCP 启发：它是一个独立的 HTTP 封装，调用 `https://api.ashar.finance/v2` 的公共 API，通过 `X-Ashar-Tenant-Key` 请求头进行身份验证。

## 功能特性

- **40 个工具**，均带 `ashar_` 前缀，覆盖所有 API 分组：
  - **Quotes** — payin、payout 和 transfer 报价（含费用加成）
  - **PayIns** — PIX 充值 → 稳定币，列出与查询
  - **Payouts** — 稳定币提现 → PIX
  - **Transfers** — 钱包 → 区块链转账
  - **Wallets** — 钱包与余额
  - **Bank Accounts** — PIX 银行账户
  - **Stats** — 每日/每月指标与费率
  - **Customers** — 客户入驻 + 子资源（bank accounts、wallets、virtual accounts）
  - **Admin/Provisioning** — 创建测试租户、列出租户并管理凭证
- **可选择的传输方式** — stdio（默认）或通过环境变量的 Streamable HTTP
- **可操作的错误提示** — HTTP 状态码映射（400/401/403/404/409/429/503）并附带提示

## 环境要求

- Node.js >= 18

## 安装

```bash
cd mcp
npm install
npm run build
```

开发模式（热重载）：

```bash
npm run dev
```

## 配置

| 变量 | 说明 | 默认值 |
|----------|------|--------|
| `ASHAR_EXCHANGE_TENANT_KEY` | 租户 API 密钥（`ash_proxy_...`），用于 `X-Ashar-Tenant-Key` 请求头。受保护端点必需；管理端点无需。 | — |
| `ASHAR_EXCHANGE_BASE_URL` | API 基础地址 | `https://api.ashar.finance/v2` |
| `ASHAR_EXCHANGE_TRANSPORT`（或 `TRANSPORT`） | `stdio` 或 `http` | `stdio` |
| `PORT` | HTTP 服务器端口（配合 `http` 传输方式使用） | `3001` |

## 使用方式

### stdio（默认）

```json
{
  "mcpServers": {
    "ashar-exchange": {
      "command": "node",
      "args": ["/path/to/AsharExchangeMCP/dist/index.js"],
      "env": {
        "ASHAR_EXCHANGE_TENANT_KEY": "ash_proxy_..."
      }
    }
  }
}
```

### Streamable HTTP

```bash
ASHAR_EXCHANGE_TRANSPORT=http PORT=3001 node dist/index.js
```

- MCP 端点：`http://localhost:3001/mcp`
- 健康检查：`http://localhost:3001/health`

## 消费模式

客户端可以通过两种方式使用 Ashar Exchange MCP：

### 方案一 —— 托管服务（Streamable HTTP）⭐

Ashar 在 **`mcp.ashar.finance`** 子域名上以公共服务方式运行 MCP 服务器。客户端**无需安装任何东西** —— 只需将 MCP 客户端指向 `https://mcp.ashar.finance/mcp` 并发送租户密钥。

```json
{
  "mcpServers": {
    "ashar-exchange": {
      "url": "https://mcp.ashar.finance/mcp",
      "headers": {
        "X-Ashar-Tenant-Key": "ash_proxy_..."
      }
    }
  }
}
```

- 公共健康检查：`https://mcp.ashar.finance/health`

- 适合**无需运行基础设施的 agent/LLM**，直接使用 MCP。
- 所有请求都经由 Ashar 服务器，服务器会应用**租户的 spread/fee**，并可**监控**每笔操作。
- 预置端点（`ashar_provision_test_tenant`）无需密钥即可使用。

### 方案二 —— 自托管（stdio）

客户端在本地（或自己的容器中）运行服务器，并指向 Ashar 的公共 API。

```json
{
  "mcpServers": {
    "ashar-exchange": {
      "command": "node",
      "args": ["/path/to/AsharExchangeMCP/dist/index.js"],
      "env": {
        "ASHAR_EXCHANGE_TENANT_KEY": "ash_proxy_..."
      }
    }
  }
}
```

- 适合 **CLI / 编辑器 / IDE**，以及希望自行管理进程的客户端。
- 仍然经过公共 API（`https://api.ashar.finance/v2`），spread 与监控保留在服务器端。

> 两种模式**都不替代 REST API**（`/v2`）。传统客户端（app/网站/后端）直接通过 REST 集成；MCP 是面向 AI 代理的通道。

## 部署（托管服务）

**`mcp.ashar.finance`** 子域名指向 Railway 上的 `AsharExchangeMCP` 服务（端口 3001）。构建使用 [Dockerfile](Dockerfile)，配置位于 [railway.json](railway.json)。

```bash
cd mcp
railway login
railway up        # 使用 Dockerfile；以 ASHAR_EXCHANGE_TRANSPORT=http 在 :3001 运行
```

公共路由（网关层）：
- `mcp.ashar.finance/mcp`  → 服务 `:3001/mcp`（无 strip）
- `mcp.ashar.finance/health` → 服务 `:3001/health`

服务上推荐的环境变量：

| 变量 | 值 |
|-----|-------|
| `ASHAR_EXCHANGE_TRANSPORT` | `http`（Dockerfile 中已为默认值） |
| `PORT` | `3001`（Dockerfile 中已为默认值） |
| `ASHAR_EXCHANGE_BASE_URL` | `https://api.ashar.finance/v2` |
| `ASHAR_EXCHANGE_TENANT_KEY` | 可选 —— 受保护调用的默认密钥 |

## 典型流程

1. （`ashar_provision_test_tenant`）—— 可选，用于创建一个带新密钥的测试租户
2. `ashar_create_payin_quote` → `ashar_execute_payin`（充值）
3. `ashar_create_payout_quote` → `ashar_execute_payout`（提现）
4. `ashar_get_daily_stats` / `ashar_get_monthly_stats` / `ashar_get_fee_rates`（跟踪与费用）

## 脚本

| 脚本 | 说明 |
|--------|------|
| `npm run build` | 将 TypeScript 编译到 `dist/` |
| `npm run dev` | 热重载运行（`tsx watch`） |
| `npm run start` | 运行构建产物（`node dist/index.js`） |
| `npm run typecheck` | 类型检查但不输出（`tsc --noEmit`） |

## 许可协议

待定。请联系 Ashar Finance。
