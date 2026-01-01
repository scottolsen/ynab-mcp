# Credit Card Reconciliation

Help me reconcile my credit card by entering transactions from screenshots.

**Read `.claude/reconcile-local.md` first** for personal merchant mappings (gitignored).

## Instructions

1. **Ask which account** to reconcile (e.g., "Prime (A)", "Venture X", "Scott Sapphire")

2. **Wait for screenshots** - I'll provide:
   - Credit card statement screenshots showing transactions
   - Amazon order screenshots (optional) to help identify purchases

3. **Extract and match transactions**:
   - Extract date, amount, and payee from credit card screenshots
   - Match Amazon charges to order details when screenshots provided
   - For unmatched Amazon charges (wife's account), use memo "????" and category "Clothing"
   - Include refunds (positive amounts) with memo "Refund ????"

4. **Assign categories** based on item type:
   - Home Maintenance: tools, home improvement, security cameras, cleaning supplies
   - Health & Body: supplements, vitamins, fitness
   - Medical: medicine, first aid
   - Fun Money: entertainment, books, pet supplies
   - Xmas: gifts during holiday season
   - Software Subscriptions: Apple Digital Services, streaming
   - Side Work: work equipment purchases
   - Wish List: default for unidentified purchases

5. **Present a table for review** showing all transactions with:
   - Date, Amount, Payee, Memo, Category
   - Group by: Matched, Unmatched (????), Refunds, Non-Amazon (Apple, etc.)
   - Ask for any category changes before entering

6. **Enter all transactions** as cleared using the YNAB MCP tools

7. **Check final balance** and report the cleared balance for reconciliation

## Important Notes
- Use the default budget (configured via `YNAB_BUDGET_ID` env var)
- All transactions should be entered as **cleared**
- Credit card charges are **negative** amounts
- Refunds/credits are **positive** amounts
- **Credit card payments**: Include them with:
  - Payee: "Payment: Checking"
  - Category: "Credit Card Payments: {account name}" (e.g., "Credit Card Payments: Freedom (A)")
  - Amount: **positive** (reduces the balance owed)
- **Check for duplicates**: Always fetch uncleared transactions from YNAB first and skip any that are already entered
