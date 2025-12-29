import { getYnabClient, resolveBudgetId } from '../ynab-client.js';

export interface CategoryInfo {
  id: string;
  name: string;
  hidden: boolean;
  deleted: boolean;
}

export interface CategoryGroup {
  id: string;
  name: string;
  hidden: boolean;
  deleted: boolean;
  categories: CategoryInfo[];
}

export async function listCategories(budgetId?: string): Promise<CategoryGroup[]> {
  const client = getYnabClient();
  const resolvedBudgetId = resolveBudgetId(budgetId);
  const response = await client.categories.getCategories(resolvedBudgetId);

  return response.data.category_groups
    .filter(group => !group.deleted && !group.hidden)
    .map(group => ({
      id: group.id,
      name: group.name,
      hidden: group.hidden,
      deleted: group.deleted,
      categories: group.categories
        .filter(cat => !cat.deleted && !cat.hidden)
        .map(cat => ({
          id: cat.id,
          name: cat.name,
          hidden: cat.hidden,
          deleted: cat.deleted,
        })),
    }));
}
