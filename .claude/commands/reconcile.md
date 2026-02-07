# Credit Card Reconciliation

Help me reconcile my credit card by entering transactions from screenshots.

**Read `.claude/reconcile-local.md` first** for personal merchant mappings (gitignored).

## Instructions

1. **Load previous session state**: Read `.claude/reconcile-state.md` (if it exists). After asking which account, display the last session info for that account:
   - Date of last reconciliation
   - Ending cleared balance
   - Last Amazon item added
   - Last statement item entered (most recent by date)
   - If no previous session exists for that account, say so

2. **Ask which account** to reconcile (e.g., "Prime (A)", "Venture X", "Scott Sapphire")

3. **Wait for screenshots** - I'll provide:
   - Credit card statement screenshots showing transactions
   - Amazon order screenshots (optional) to help identify purchases

4. **Extract and match transactions**:
   - Extract date, amount, and payee from credit card screenshots
   - Match Amazon charges to order details when screenshots provided
   - For unmatched Amazon charges (wife's account), use memo "????" and category "Clothing"
   - Include refunds (positive amounts) with memo "Refund ????"

5. **Assign categories** based on item type:
   - Home Maintenance: tools, home improvement, security cameras, cleaning supplies
   - Health & Body: supplements, vitamins, fitness
   - Medical: medicine, first aid
   - Fun Money: entertainment, books, pet supplies
   - Xmas: gifts during holiday season
   - Software Subscriptions: Apple Digital Services, streaming
   - Side Work: work equipment purchases
   - Wish List: default for unidentified purchases

6. **Present a table for review** showing all transactions with:
   - Date, Amount, Payee, Memo, Category
   - Group by: Matched, Unmatched (????), Refunds, Non-Amazon (Apple, etc.)
   - Ask for any category changes before entering

7. **Clear matching uncleared transactions**: For each existing uncleared transaction in YNAB that matches a charge on the credit card statement (by amount), use `clear_transaction` to mark it as cleared. This ensures previously-entered transactions get reconciled along with the new ones.

8. **Enter new transactions** as cleared using the YNAB MCP tools (batch create)

9. **Verify balance**: Fetch the account balance and confirm the YNAB **cleared balance** matches the credit card's online balance. If it doesn't match, investigate the discrepancy (missing transactions, incorrect amounts, uncleared items) and resolve before proceeding. Do NOT save session state until the balances match.

10. **Save session state**: Write/update `.claude/reconcile-state.md` with this session's results. Update only the section for the current account (preserve other accounts). Use this format:

```markdown
# Reconciliation State

## Last Session Per Account

### {Account Name}
- **Date**: {YYYY-MM-DD}
- **Ending Cleared Balance**: -${amount}
- **Last Amazon Item Added**: "{memo/payee}" ({date}, -${amount}) or N/A if none
- **Last Statement Item**: "{payee}" ({date}, -${amount})
```

## Important Notes
- Use the default budget (configured via `YNAB_BUDGET_ID` env var)
- All transactions should be entered as **cleared**
- Credit card charges are **negative** amounts
- Refunds/credits are **positive** amounts
- **Credit card payments**: Include them with:
  - Payee: "Payment: Checking"
  - Category: "Credit Card Payments: {account name}" (e.g., "Credit Card Payments: Freedom (A)")
  - Amount: **positive** (reduces the balance owed)
- **Check for duplicates**: Always fetch uncleared transactions from YNAB first. Skip entering any that already exist, but **clear** the ones that match statement charges using `clear_transaction`
