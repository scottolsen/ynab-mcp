import { getYnabClient } from '../ynab-client.js';

export interface BudgetSummary {
  id: string;
  name: string;
  last_modified_on: string;
  first_month: string;
  last_month: string;
}

export async function listBudgets(): Promise<BudgetSummary[]> {
  const client = getYnabClient();
  const response = await client.budgets.getBudgets();

  return response.data.budgets.map(budget => ({
    id: budget.id,
    name: budget.name,
    last_modified_on: budget.last_modified_on || '',
    first_month: budget.first_month || '',
    last_month: budget.last_month || '',
  }));
}
