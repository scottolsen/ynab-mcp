import { getYnabClient, resolveBudgetId } from '../ynab-client.js';
import { dollarsToMilliunits, milliunitsToDollars, formatCurrency } from '../utils/milliunits.js';
import type { SaveTransactionWithOptionalFields, TransactionClearedStatus } from 'ynab';

export interface TransactionInput {
  date: string;
  amount: number; // in dollars
  payee_name: string;
  category_id?: string;
  memo?: string;
  cleared?: boolean;
}

export interface TransactionResult {
  id: string;
  date: string;
  amount: number;
  amount_formatted: string;
  payee_name: string | null;
  category_name: string | null;
  memo: string | null;
  cleared: string;
  approved: boolean;
}

export interface UnclearedTransaction {
  id: string;
  date: string;
  amount: number;
  amount_formatted: string;
  payee_name: string | null;
  category_name: string | null;
  memo: string | null;
}

export async function createTransaction(
  accountId: string,
  transaction: TransactionInput,
  budgetId?: string
): Promise<TransactionResult> {
  const client = getYnabClient();
  const resolvedBudgetId = resolveBudgetId(budgetId);

  const clearedStatus: TransactionClearedStatus = transaction.cleared !== false ? 'cleared' : 'uncleared';

  const saveTransaction: SaveTransactionWithOptionalFields = {
    account_id: accountId,
    date: transaction.date,
    amount: dollarsToMilliunits(transaction.amount),
    payee_name: transaction.payee_name,
    category_id: transaction.category_id || undefined,
    memo: transaction.memo || undefined,
    cleared: clearedStatus,
    approved: true,
  };

  const response = await client.transactions.createTransaction(resolvedBudgetId, {
    transaction: saveTransaction,
  });

  const created = response.data.transaction;
  if (!created) {
    throw new Error('Transaction was not created');
  }

  return {
    id: created.id,
    date: created.date,
    amount: milliunitsToDollars(created.amount),
    amount_formatted: formatCurrency(created.amount),
    payee_name: created.payee_name || null,
    category_name: created.category_name || null,
    memo: created.memo || null,
    cleared: created.cleared,
    approved: created.approved,
  };
}

export async function createTransactionsBatch(
  accountId: string,
  transactions: TransactionInput[],
  budgetId?: string
): Promise<{ created: TransactionResult[]; duplicate_import_ids: string[] }> {
  const client = getYnabClient();
  const resolvedBudgetId = resolveBudgetId(budgetId);

  const saveTransactions: SaveTransactionWithOptionalFields[] = transactions.map(tx => {
    const clearedStatus: TransactionClearedStatus = tx.cleared !== false ? 'cleared' : 'uncleared';
    return {
      account_id: accountId,
      date: tx.date,
      amount: dollarsToMilliunits(tx.amount),
      payee_name: tx.payee_name,
      category_id: tx.category_id || undefined,
      memo: tx.memo || undefined,
      cleared: clearedStatus,
      approved: true,
    };
  });

  const response = await client.transactions.createTransactions(resolvedBudgetId, {
    transactions: saveTransactions,
  });

  const created = (response.data.transactions || []).map(tx => ({
    id: tx.id,
    date: tx.date,
    amount: milliunitsToDollars(tx.amount),
    amount_formatted: formatCurrency(tx.amount),
    payee_name: tx.payee_name || null,
    category_name: tx.category_name || null,
    memo: tx.memo || null,
    cleared: tx.cleared,
    approved: tx.approved,
  }));

  return {
    created,
    duplicate_import_ids: response.data.duplicate_import_ids || [],
  };
}

export async function getUnclearedTransactions(
  accountId: string,
  budgetId?: string
): Promise<UnclearedTransaction[]> {
  const client = getYnabClient();
  const resolvedBudgetId = resolveBudgetId(budgetId);

  const response = await client.transactions.getTransactionsByAccount(
    resolvedBudgetId,
    accountId
  );

  return response.data.transactions
    .filter(tx => tx.cleared === 'uncleared')
    .map(tx => ({
      id: tx.id,
      date: tx.date,
      amount: milliunitsToDollars(tx.amount),
      amount_formatted: formatCurrency(tx.amount),
      payee_name: tx.payee_name || null,
      category_name: tx.category_name || null,
      memo: tx.memo || null,
    }));
}

export interface ClearedTransaction {
  id: string;
  date: string;
  amount: number;
  amount_formatted: string;
  payee_name: string | null;
  category_name: string | null;
  memo: string | null;
}

export async function getClearedTransactions(
  accountId: string,
  budgetId?: string,
  sinceDate?: string
): Promise<ClearedTransaction[]> {
  const client = getYnabClient();
  const resolvedBudgetId = resolveBudgetId(budgetId);

  const response = await client.transactions.getTransactionsByAccount(
    resolvedBudgetId,
    accountId,
    sinceDate
  );

  return response.data.transactions
    .filter(tx => tx.cleared === 'cleared' || tx.cleared === 'reconciled')
    .map(tx => ({
      id: tx.id,
      date: tx.date,
      amount: milliunitsToDollars(tx.amount),
      amount_formatted: formatCurrency(tx.amount),
      payee_name: tx.payee_name || null,
      category_name: tx.category_name || null,
      memo: tx.memo || null,
    }));
}

export async function clearTransaction(
  transactionId: string,
  budgetId?: string
): Promise<TransactionResult> {
  const client = getYnabClient();
  const resolvedBudgetId = resolveBudgetId(budgetId);

  const response = await client.transactions.updateTransaction(
    resolvedBudgetId,
    transactionId,
    {
      transaction: {
        cleared: 'cleared' as TransactionClearedStatus,
      },
    }
  );

  const updated = response.data.transaction;

  return {
    id: updated.id,
    date: updated.date,
    amount: milliunitsToDollars(updated.amount),
    amount_formatted: formatCurrency(updated.amount),
    payee_name: updated.payee_name || null,
    category_name: updated.category_name || null,
    memo: updated.memo || null,
    cleared: updated.cleared,
    approved: updated.approved,
  };
}

export interface TransactionUpdate {
  amount?: number; // in dollars
  date?: string;
  payee_name?: string;
  category_id?: string;
  memo?: string;
  cleared?: boolean;
}

export async function updateTransaction(
  transactionId: string,
  updates: TransactionUpdate,
  budgetId?: string
): Promise<TransactionResult> {
  const client = getYnabClient();
  const resolvedBudgetId = resolveBudgetId(budgetId);

  const transactionUpdate: Record<string, unknown> = {};

  if (updates.amount !== undefined) {
    transactionUpdate.amount = dollarsToMilliunits(updates.amount);
  }
  if (updates.date !== undefined) {
    transactionUpdate.date = updates.date;
  }
  if (updates.payee_name !== undefined) {
    transactionUpdate.payee_name = updates.payee_name;
  }
  if (updates.category_id !== undefined) {
    transactionUpdate.category_id = updates.category_id;
  }
  if (updates.memo !== undefined) {
    transactionUpdate.memo = updates.memo;
  }
  if (updates.cleared !== undefined) {
    transactionUpdate.cleared = updates.cleared ? 'cleared' : 'uncleared';
  }

  const response = await client.transactions.updateTransaction(
    resolvedBudgetId,
    transactionId,
    {
      transaction: transactionUpdate,
    }
  );

  const updated = response.data.transaction;

  return {
    id: updated.id,
    date: updated.date,
    amount: milliunitsToDollars(updated.amount),
    amount_formatted: formatCurrency(updated.amount),
    payee_name: updated.payee_name || null,
    category_name: updated.category_name || null,
    memo: updated.memo || null,
    cleared: updated.cleared,
    approved: updated.approved,
  };
}
