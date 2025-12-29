import { getYnabClient, resolveBudgetId } from '../ynab-client.js';
import { milliunitsToDollars, dollarsToMilliunits, formatCurrency } from '../utils/milliunits.js';

export interface ReconciliationResult {
  account_name: string;
  ynab_cleared_balance: number;
  ynab_cleared_balance_formatted: string;
  actual_balance: number;
  actual_balance_formatted: string;
  difference: number;
  difference_formatted: string;
  status: 'matched' | 'discrepancy';
  message: string;
}

export async function reconciliationCheck(
  accountId: string,
  actualBalance: number,
  budgetId?: string
): Promise<ReconciliationResult> {
  const client = getYnabClient();
  const resolvedBudgetId = resolveBudgetId(budgetId);

  const response = await client.accounts.getAccountById(resolvedBudgetId, accountId);
  const account = response.data.account;

  const ynabClearedBalance = milliunitsToDollars(account.cleared_balance);
  const difference = Math.abs(ynabClearedBalance - actualBalance);

  // Use a small tolerance for floating point comparison (less than 1 cent)
  const isMatched = difference < 0.01;

  const result: ReconciliationResult = {
    account_name: account.name,
    ynab_cleared_balance: ynabClearedBalance,
    ynab_cleared_balance_formatted: formatCurrency(account.cleared_balance),
    actual_balance: actualBalance,
    actual_balance_formatted: formatCurrency(dollarsToMilliunits(actualBalance)),
    difference: ynabClearedBalance - actualBalance,
    difference_formatted: formatCurrency(dollarsToMilliunits(ynabClearedBalance - actualBalance)),
    status: isMatched ? 'matched' : 'discrepancy',
    message: '',
  };

  if (isMatched) {
    result.message = `Account "${account.name}" is balanced! YNAB cleared balance matches the actual balance.`;
  } else {
    const diffAbs = Math.abs(ynabClearedBalance - actualBalance);
    const direction = ynabClearedBalance > actualBalance ? 'higher' : 'lower';
    result.message = `Discrepancy found: YNAB cleared balance is ${formatCurrency(dollarsToMilliunits(diffAbs))} ${direction} than the actual balance. This may indicate missing or extra transactions in YNAB.`;
  }

  return result;
}
