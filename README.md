# YNAB MCP Server

An MCP (Model Context Protocol) server for YNAB (You Need A Budget) designed to streamline credit card reconciliation workflows.

## Features

- **List budgets and accounts** - View all your YNAB budgets and accounts with balances
- **Category and payee management** - Browse categories and search payees
- **Transaction creation** - Create single or batch transactions
- **Reconciliation support** - Compare YNAB cleared balances to actual bank balances

## Installation

```bash
git clone https://github.com/scottolsen/ynab-mcp.git
cd ynab-mcp
npm install
npm run build
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `YNAB_API_TOKEN` | Yes | Your YNAB Personal Access Token |
| `YNAB_BUDGET_ID` | No | Default budget ID (uses "last-used" if not set) |

### Getting a YNAB API Token

1. Go to https://app.ynab.com/settings/developer
2. Click "New Token"
3. Copy the generated token

### Claude Code Configuration

Add to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "ynab": {
      "command": "node",
      "args": ["/path/to/ynab-mcp/dist/index.js"],
      "env": {
        "YNAB_API_TOKEN": "your-token-here",
        "YNAB_BUDGET_ID": "optional-default-budget-id"
      }
    }
  }
}
```

## Available Tools

### Budget & Account Tools

| Tool | Description |
|------|-------------|
| `list_budgets` | List all budgets for the authenticated user |
| `list_accounts` | List all accounts with balances (credit cards and checking first) |
| `get_account_balance` | Get detailed balance for a specific account |

### Category & Payee Tools

| Tool | Description |
|------|-------------|
| `list_categories` | List all category groups and categories |
| `list_payees` | List all payees |
| `search_payees` | Fuzzy search for payees by name |

### Transaction Tools

| Tool | Description |
|------|-------------|
| `create_transaction` | Create a single transaction |
| `create_transactions_batch` | Create multiple transactions at once |
| `get_uncleared_transactions` | Get all uncleared transactions for an account |
| `get_cleared_transactions` | Get cleared transactions for an account (with optional date filter) |
| `clear_transaction` | Mark a transaction as cleared |
| `update_transaction` | Update an existing transaction (amount, date, payee, category, memo, cleared) |

### Reconciliation Tools

| Tool | Description |
|------|-------------|
| `reconciliation_check` | Compare YNAB cleared balance to actual balance |

## Reconciliation Workflow

1. **Show accounts**: "Show me my accounts"
2. **Select account**: "I want to reconcile my Chase Sapphire card"
3. **Share screenshot**: Provide a screenshot of your credit card transactions
4. **Create transactions**: Claude extracts and creates transactions as cleared
5. **Verify balance**: "The actual balance is -$1,234.56"
6. **Check result**: Tool reports if balanced or shows discrepancy

### Claude Code Command

This repo includes a Claude Code command for guided reconciliation. Copy `.claude/commands/reconcile.md` to your project or run:

```
/reconcile
```

This command walks you through the full reconciliation workflow with category matching and Amazon order correlation.

## Amount Handling

- All amounts are in **dollars** (e.g., `-25.99` for a $25.99 charge)
- Credit card **charges are negative** (money you owe)
- Credit card **payments/credits are positive**
- The server automatically converts to/from YNAB's milliunit format

## Development

```bash
# Build the project
npm run build

# Watch mode for development
npm run dev

# Test with MCP Inspector
npm run inspect
```

## Testing with MCP Inspector

```bash
YNAB_API_TOKEN=your-token npx @modelcontextprotocol/inspector node dist/index.js
```

## License

MIT
