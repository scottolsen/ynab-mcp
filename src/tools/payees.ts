import { getYnabClient, resolveBudgetId } from '../ynab-client.js';

export interface PayeeInfo {
  id: string;
  name: string;
  transfer_account_id: string | null;
  deleted: boolean;
}

export interface PayeeSearchResult {
  id: string;
  name: string;
  score: number;
}

export async function listPayees(budgetId?: string): Promise<PayeeInfo[]> {
  const client = getYnabClient();
  const resolvedBudgetId = resolveBudgetId(budgetId);
  const response = await client.payees.getPayees(resolvedBudgetId);

  return response.data.payees
    .filter(payee => !payee.deleted)
    .map(payee => ({
      id: payee.id,
      name: payee.name,
      transfer_account_id: payee.transfer_account_id || null,
      deleted: payee.deleted,
    }));
}

function fuzzyMatch(query: string, target: string): number {
  const queryLower = query.toLowerCase();
  const targetLower = target.toLowerCase();

  // Exact match
  if (targetLower === queryLower) return 100;

  // Starts with
  if (targetLower.startsWith(queryLower)) return 90;

  // Contains
  if (targetLower.includes(queryLower)) return 70;

  // Word match
  const targetWords = targetLower.split(/\s+/);
  const queryWords = queryLower.split(/\s+/);

  let wordMatchScore = 0;
  for (const qWord of queryWords) {
    for (const tWord of targetWords) {
      if (tWord.startsWith(qWord)) {
        wordMatchScore += 50;
        break;
      } else if (tWord.includes(qWord)) {
        wordMatchScore += 30;
        break;
      }
    }
  }

  if (wordMatchScore > 0) return Math.min(wordMatchScore, 60);

  // Character-by-character fuzzy match
  let matchCount = 0;
  let targetIndex = 0;
  for (const char of queryLower) {
    const foundIndex = targetLower.indexOf(char, targetIndex);
    if (foundIndex !== -1) {
      matchCount++;
      targetIndex = foundIndex + 1;
    }
  }

  const fuzzyScore = (matchCount / queryLower.length) * 40;
  return fuzzyScore > 20 ? fuzzyScore : 0;
}

export async function searchPayees(
  query: string,
  budgetId?: string
): Promise<PayeeSearchResult[]> {
  const payees = await listPayees(budgetId);

  const scored = payees
    .map(payee => ({
      id: payee.id,
      name: payee.name,
      score: fuzzyMatch(query, payee.name),
    }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 10);
}
