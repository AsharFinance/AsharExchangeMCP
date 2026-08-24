# Ashar Exchange MCP Server

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
