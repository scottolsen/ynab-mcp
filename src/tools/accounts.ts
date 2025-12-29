import { getYnabClient, resolveBudgetId } from '../ynab-client.js';
import { milliunitsToDollars, formatCurrency } from '../utils/milliunits.js';

export interface AccountSummary {
  id: string;
  name: string;
  type: string;
  on_budget: boolean;
  closed: boolean;
  balance: number;
  balance_formatted: string;
  cleared_balance: number;
  cleared_balance_formatted: string;
  uncleared_balance: number;
  uncleared_balance_formatted: string;
}

export interface AccountBalance {
  account_id: string;
  account_name: string;
  cleared_balance: number;
  cleared_balance_formatted: string;
  uncleared_balance: number;
  uncleared_balance_formatted: string;
  total_balance: number;
  total_balance_formatted: string;
}

export async function listAccounts(budgetId?: string): Promise<AccountSummary[]> {
  const client = getYnabClient();
  const resolvedBudgetId = resolveBudgetId(budgetId);
  const response = await client.accounts.getAccounts(resolvedBudgetId);

  // Filter to show primarily credit card and checking accounts, but include all for completeness
  const priorityTypes = ['creditCard', 'checking', 'savings'];

  return response.data.accounts
    .filter(account => !account.deleted)
    .sort((a, b) => {
      // Sort priority types first
      const aPriority = priorityTypes.includes(a.type) ? 0 : 1;
      const bPriority = priorityTypes.includes(b.type) ? 0 : 1;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return a.name.localeCompare(b.name);
    })
    .map(account => ({
      id: account.id,
      name: account.name,
      type: account.type,
      on_budget: account.on_budget,
      closed: account.closed,
      balance: milliunitsToDollars(account.balance),
      balance_formatted: formatCurrency(account.balance),
      cleared_balance: milliunitsToDollars(account.cleared_balance),
      cleared_balance_formatted: formatCurrency(account.cleared_balance),
      uncleared_balance: milliunitsToDollars(account.uncleared_balance),
      uncleared_balance_formatted: formatCurrency(account.uncleared_balance),
    }));
}

export async function getAccountBalance(
  accountId: string,
  budgetId?: string
): Promise<AccountBalance> {
  const client = getYnabClient();
  const resolvedBudgetId = resolveBudgetId(budgetId);
  const response = await client.accounts.getAccountById(resolvedBudgetId, accountId);
  const account = response.data.account;

  return {
    account_id: account.id,
    account_name: account.name,
    cleared_balance: milliunitsToDollars(account.cleared_balance),
    cleared_balance_formatted: formatCurrency(account.cleared_balance),
    uncleared_balance: milliunitsToDollars(account.uncleared_balance),
    uncleared_balance_formatted: formatCurrency(account.uncleared_balance),
    total_balance: milliunitsToDollars(account.balance),
    total_balance_formatted: formatCurrency(account.balance),
  };
}
