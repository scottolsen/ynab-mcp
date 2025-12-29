import * as ynab from 'ynab';

let client: ynab.API | null = null;

export function getYnabClient(): ynab.API {
  if (!client) {
    const token = process.env.YNAB_API_TOKEN;
    if (!token) {
      throw new Error('YNAB_API_TOKEN environment variable is required');
    }
    client = new ynab.API(token);
  }
  return client;
}

export function getDefaultBudgetId(): string {
  return process.env.YNAB_BUDGET_ID || 'last-used';
}

export function resolveBudgetId(budgetId?: string): string {
  return budgetId || getDefaultBudgetId();
}
