/**
 * YNAB uses "milliunits" for all amounts where 1000 = $1.00
 * Credit card charges are negative, payments/credits are positive
 */

/**
 * Convert dollars to milliunits
 * @param dollars Amount in dollars (e.g., -25.99 for a $25.99 charge)
 * @returns Amount in milliunits (e.g., -25990)
 */
export function dollarsToMilliunits(dollars: number): number {
  return Math.round(dollars * 1000);
}

/**
 * Convert milliunits to dollars
 * @param milliunits Amount in milliunits (e.g., -25990)
 * @returns Amount in dollars (e.g., -25.99)
 */
export function milliunitsToDollars(milliunits: number): number {
  return milliunits / 1000;
}

/**
 * Format milliunits as a currency string
 * @param milliunits Amount in milliunits
 * @returns Formatted string (e.g., "$25.99" or "-$25.99")
 */
export function formatCurrency(milliunits: number): string {
  const dollars = milliunitsToDollars(milliunits);
  const isNegative = dollars < 0;
  const absolute = Math.abs(dollars);
  const formatted = absolute.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  return isNegative ? `-${formatted}` : formatted;
}
