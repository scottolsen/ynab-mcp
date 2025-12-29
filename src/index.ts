#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

function formatError(error: unknown): string {
  // YNAB ResponseError has an 'error' property that contains the actual error details
  const ynabError = error as { error?: { detail?: string; name?: string; id?: string } };
  if (ynabError?.error?.detail) {
    return ynabError.error.detail;
  }
  if (ynabError?.error?.name) {
    return ynabError.error.name;
  }
  if (error instanceof Error) {
    // Check if message is an object (YNAB sometimes does this)
    if (typeof error.message === 'object') {
      return JSON.stringify(error.message);
    }
    return error.message;
  }
  if (typeof error === 'object' && error !== null) {
    return JSON.stringify(error);
  }
  return String(error);
}

import { listBudgets } from './tools/budgets.js';
import { listAccounts, getAccountBalance } from './tools/accounts.js';
import { listCategories } from './tools/categories.js';
import { listPayees, searchPayees } from './tools/payees.js';
import {
  createTransaction,
  createTransactionsBatch,
  getUnclearedTransactions,
  getClearedTransactions,
  clearTransaction,
  updateTransaction,
} from './tools/transactions.js';
import { reconciliationCheck } from './tools/reconciliation.js';

const server = new McpServer({
  name: 'ynab-mcp',
  version: '1.0.0',
});

// Tool: list_budgets
server.tool(
  'list_budgets',
  'List all budgets for the authenticated YNAB user. Use this to find budget IDs for other operations.',
  async () => {
    try {
      const budgets = await listBudgets();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(budgets, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error listing budgets: ${formatError(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: list_accounts
server.tool(
  'list_accounts',
  'List all accounts with their balances. Returns credit cards and checking accounts first. Balances are shown in dollars.',
  {
    budget_id: z
      .string()
      .optional()
      .describe('Budget ID (uses default or last-used if not provided)'),
  },
  async ({ budget_id }) => {
    try {
      const accounts = await listAccounts(budget_id);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(accounts, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error listing accounts: ${formatError(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: get_account_balance
server.tool(
  'get_account_balance',
  'Get detailed balance information for a specific account including cleared, uncleared, and total balances in dollars.',
  {
    budget_id: z
      .string()
      .optional()
      .describe('Budget ID (uses default or last-used if not provided)'),
    account_id: z.string().describe('The account ID to get balance for'),
  },
  async ({ budget_id, account_id }) => {
    try {
      const balance = await getAccountBalance(account_id, budget_id);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(balance, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error getting account balance: ${formatError(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: list_categories
server.tool(
  'list_categories',
  'List all category groups and their categories. Useful for categorizing new transactions.',
  {
    budget_id: z
      .string()
      .optional()
      .describe('Budget ID (uses default or last-used if not provided)'),
  },
  async ({ budget_id }) => {
    try {
      const categories = await listCategories(budget_id);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(categories, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error listing categories: ${formatError(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: list_payees
server.tool(
  'list_payees',
  'List all payees in the budget.',
  {
    budget_id: z
      .string()
      .optional()
      .describe('Budget ID (uses default or last-used if not provided)'),
  },
  async ({ budget_id }) => {
    try {
      const payees = await listPayees(budget_id);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(payees, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error listing payees: ${formatError(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: search_payees
server.tool(
  'search_payees',
  'Fuzzy search for payees by name. Returns up to 10 best matches with relevance scores.',
  {
    budget_id: z
      .string()
      .optional()
      .describe('Budget ID (uses default or last-used if not provided)'),
    query: z.string().describe('Search query to match against payee names'),
  },
  async ({ budget_id, query }) => {
    try {
      const results = await searchPayees(query, budget_id);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error searching payees: ${formatError(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: create_transaction
server.tool(
  'create_transaction',
  'Create a single transaction. Amounts are in dollars (negative for charges, positive for credits). Defaults to cleared status for reconciliation workflow.',
  {
    budget_id: z
      .string()
      .optional()
      .describe('Budget ID (uses default or last-used if not provided)'),
    account_id: z.string().describe('The account ID to create the transaction in'),
    date: z.string().describe('Transaction date in ISO format (YYYY-MM-DD)'),
    amount: z
      .number()
      .describe(
        'Amount in dollars (negative for charges like -25.99, positive for credits)'
      ),
    payee_name: z.string().describe('Name of the payee'),
    category_id: z.string().optional().describe('Category ID for the transaction'),
    memo: z.string().optional().describe('Optional memo/note'),
    cleared: z
      .boolean()
      .optional()
      .describe('Whether transaction is cleared (defaults to true for reconciliation)'),
  },
  async ({ budget_id, account_id, date, amount, payee_name, category_id, memo, cleared }) => {
    try {
      const result = await createTransaction(
        account_id,
        { date, amount, payee_name, category_id, memo, cleared },
        budget_id
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error creating transaction: ${formatError(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: create_transactions_batch
server.tool(
  'create_transactions_batch',
  'Create multiple transactions at once. All transactions go to the same account. Amounts are in dollars. Ideal for bulk reconciliation from credit card statements.',
  {
    budget_id: z
      .string()
      .optional()
      .describe('Budget ID (uses default or last-used if not provided)'),
    account_id: z.string().describe('The account ID to create transactions in'),
    transactions: z
      .array(
        z.object({
          date: z.string().describe('Transaction date in ISO format (YYYY-MM-DD)'),
          amount: z.number().describe('Amount in dollars (negative for charges)'),
          payee_name: z.string().describe('Name of the payee'),
          category_id: z.string().optional().describe('Category ID'),
          memo: z.string().optional().describe('Optional memo/note'),
          cleared: z.boolean().optional().describe('Whether cleared (defaults to true)'),
        })
      )
      .describe('Array of transactions to create'),
  },
  async ({ budget_id, account_id, transactions }) => {
    try {
      const result = await createTransactionsBatch(account_id, transactions, budget_id);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                created_count: result.created.length,
                transactions: result.created,
                duplicate_import_ids: result.duplicate_import_ids,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error creating transactions: ${formatError(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: get_uncleared_transactions
server.tool(
  'get_uncleared_transactions',
  'Get all uncleared transactions for an account. Useful for seeing what might need to be cleared during reconciliation.',
  {
    budget_id: z
      .string()
      .optional()
      .describe('Budget ID (uses default or last-used if not provided)'),
    account_id: z.string().describe('The account ID to get uncleared transactions for'),
  },
  async ({ budget_id, account_id }) => {
    try {
      const transactions = await getUnclearedTransactions(account_id, budget_id);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                count: transactions.length,
                transactions,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error getting uncleared transactions: ${formatError(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: get_cleared_transactions
server.tool(
  'get_cleared_transactions',
  'Get all cleared transactions for an account. Useful for reconciliation to compare against statement.',
  {
    budget_id: z
      .string()
      .optional()
      .describe('Budget ID (uses default or last-used if not provided)'),
    account_id: z.string().describe('The account ID to get cleared transactions for'),
    since_date: z
      .string()
      .optional()
      .describe('Only return transactions on or after this date (YYYY-MM-DD)'),
  },
  async ({ budget_id, account_id, since_date }) => {
    try {
      const transactions = await getClearedTransactions(account_id, budget_id, since_date);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                count: transactions.length,
                transactions,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error getting cleared transactions: ${formatError(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: clear_transaction
server.tool(
  'clear_transaction',
  'Mark a transaction as cleared.',
  {
    budget_id: z
      .string()
      .optional()
      .describe('Budget ID (uses default or last-used if not provided)'),
    transaction_id: z.string().describe('The transaction ID to mark as cleared'),
  },
  async ({ budget_id, transaction_id }) => {
    try {
      const result = await clearTransaction(transaction_id, budget_id);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error clearing transaction: ${formatError(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: update_transaction
server.tool(
  'update_transaction',
  'Update an existing transaction. Can modify amount, date, payee, category, memo, or cleared status.',
  {
    budget_id: z
      .string()
      .optional()
      .describe('Budget ID (uses default or last-used if not provided)'),
    transaction_id: z.string().describe('The transaction ID to update'),
    amount: z
      .number()
      .optional()
      .describe('New amount in dollars (negative for charges, positive for credits)'),
    date: z.string().optional().describe('New date in ISO format (YYYY-MM-DD)'),
    payee_name: z.string().optional().describe('New payee name'),
    category_id: z.string().optional().describe('New category ID'),
    memo: z.string().optional().describe('New memo/note'),
    cleared: z.boolean().optional().describe('Whether transaction is cleared'),
  },
  async ({ budget_id, transaction_id, amount, date, payee_name, category_id, memo, cleared }) => {
    try {
      const result = await updateTransaction(
        transaction_id,
        { amount, date, payee_name, category_id, memo, cleared },
        budget_id
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error updating transaction: ${formatError(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: reconciliation_check
server.tool(
  'reconciliation_check',
  'Compare YNAB cleared balance to actual balance from your bank/card statement. Reports if they match or shows the discrepancy.',
  {
    budget_id: z
      .string()
      .optional()
      .describe('Budget ID (uses default or last-used if not provided)'),
    account_id: z.string().describe('The account ID to check'),
    actual_balance: z
      .number()
      .describe(
        'The actual balance from your bank/card in dollars (e.g., -1234.56 for credit card debt)'
      ),
  },
  async ({ budget_id, account_id, actual_balance }) => {
    try {
      const result = await reconciliationCheck(account_id, actual_balance, budget_id);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error checking reconciliation: ${formatError(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('YNAB MCP Server started');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
