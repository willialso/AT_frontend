# 🚀 Admin Console Quick Reference

## Access the Console
```
http://your-domain.com/admin.html
```

## Three Main Tabs

### 👥 USERS TAB
**What You See:**
- List of all users who have traded
- Per-user trade summaries
- Win/loss statistics
- Volume and PnL metrics

**Actions:**
- 🔍 Search by user principal
- 🔄 Refresh data
- 📥 Export users to CSV

**Key Metrics per User:**
```
Total Trades    → How many trades total
Calls/Puts      → Breakdown by option type
Wins/Losses     → Number of winning vs losing trades
Win Rate %      → Success percentage
Net PnL (BTC)   → User's total profit/loss
Volume (USD)    → Total amount wagered
```

---

### 📈 TRADES TAB
**Two Sections:**

#### Section 1: Platform Summary
**Aggregate metrics for selected time period:**
```
Unique Users               → How many different users traded
Total Bets                 → Count of all bets placed
Call/Put Split             → Breakdown by option type
Strike Offset Breakdown    → Bets by 2.5%, 5%, 10%, 15%
Expiry Breakdown           → Bets by 5s, 10s, 15s
User Wins/Losses           → Count from user perspective
Atticus Net Gain/Loss      → Platform P&L in USD
Platform Win Rate          → When users lose, platform wins
```

#### Section 2: Individual Bets
**Detailed table with every bet:**
```
Trade ID              → Unique identifier
User                  → Who placed the bet (truncated principal)
Timestamp             → When bet was placed
Type                  → Call or Put
Strike Price          → Target BTC price
Expiry                → Time to expiration
Entry Price           → BTC price at trade open
Settlement Price      → BTC price at trade close
Price Δ (Delta)       → Settlement - Entry price
Outcome               → Win/Loss/Active
Atticus G/L           → Platform gain or loss
```

**Actions:**
- 📅 Filter by date range
- 🔄 Refresh data
- 📥 Export bets to CSV
- 📥 Export platform summary to CSV
- ⏮️⏭️ Paginate through results (50 per page)

---

### 🏦 PLATFORM TAB
**Two Key Balances:**

#### 💎 Liquidity Balance (Cash on Hand)
```
Source:     Real Bitcoin blockchain
Represents: Actual BTC in platform wallet
Changes:    Only with deposits/withdrawals
Updates:    Live from Blockstream API
```

#### 📊 Ledger Balance (Accounting)
```
Source:     Platform ledger calculations
Represents: Net trading profit/loss
Starts at:  $0.00 USD
Credits:    When users lose (platform gains)
Debits:     When users win (platform pays)
Formula:    total_winning_trades - total_losing_trades
```

**Why Separate?**
- **Liquidity** = Can we pay winners? (actual cash)
- **Ledger** = Are we profitable? (accounting)

**Actions:**
- 🔄 Refresh platform data
- View detailed wallet metrics
- View detailed ledger metrics

---

## 📊 Understanding the Metrics

### From User Perspective:
- **Win** = User made profit (platform lost)
- **Loss** = User lost premium (platform gained)
- **Net PnL** = User's total profit/loss

### From Platform Perspective (Atticus):
- **Gain** = User lost, platform keeps premium (positive)
- **Loss** = User won, platform paid out (negative)
- **Net G/L** = Sum of all gains and losses

### Financial Formulas:
```javascript
// User PnL
if (win) {
  userPnl = payout - premium;  // Positive
} else {
  userPnl = -premium;  // Negative
}

// Platform G/L (opposite of user)
if (userWin) {
  platformGL = -(payout - premium);  // Negative (loss)
} else {
  platformGL = premium;  // Positive (gain)
}
```

---

## 📥 CSV Export Features

### Users CSV Contains:
```
- User Principal
- Total Trades
- Active/Settled Trades
- Call/Put Counts
- Win/Loss Counts
- Win Rate %
- Total Win Amount (BTC)
- Total Loss Amount (BTC)
- Net PnL (BTC)
- Total Volume (USD)
```

### Bets CSV Contains:
```
- Trade ID
- User ID (full principal)
- Timestamp (milliseconds)
- Date/Time (ISO format)
- Bet Type (Call/Put)
- Strike Price
- Strike Offset
- Expiry
- Entry Price
- Settlement Price
- Price Delta
- Outcome (Win/Loss/Active)
- Premium Paid (USD)
- Payout Received (USD)
- User Profit (USD)
- Atticus Gain/Loss (USD)
```

### Platform CSV Contains:
```
- Time period
- User metrics
- Trade counts
- Type breakdown
- Strike offset breakdown
- Expiry breakdown
- Outcomes
- Financial metrics
```

---

## 🔍 How to Find Specific Information

### "How much has user X made/lost?"
1. Go to **Users** tab
2. Search for user principal in search box
3. Look at "Net PnL (BTC)" column

### "How many trades in the last 24 hours?"
1. Go to **Trades** tab
2. Set start date to 24 hours ago
3. Set end date to now
4. Look at "Total Bets" in platform summary

### "Which strike offset is most popular?"
1. Go to **Trades** tab
2. Look at "Bets by Strike Offset" section
3. See which has highest count

### "What is our actual blockchain balance?"
1. Go to **Platform** tab
2. Look at "Liquidity Balance" section
3. See "Blockchain Balance (Live)"

### "Are we profitable from trading?"
1. Go to **Platform** tab
2. Look at "Ledger Balance" section
3. Check "Net PnL" (positive = profitable)

### "Export all bet data for analysis"
1. Go to **Trades** tab
2. (Optional) Set date range
3. Click "📥 Export Bets CSV"
4. Open file in Excel/Google Sheets

---

## 💡 Pro Tips

### Performance
- Date filtering happens client-side (instant)
- Refresh only when you need latest data
- Pagination keeps UI responsive

### Data Analysis
- Export CSVs for deeper analysis
- Use Excel pivot tables for custom views
- Combine user and bet data for insights

### Monitoring
- Check liquidity balance regularly
- Compare ledger to liquidity for reconciliation
- Monitor platform win rate trends

### Troubleshooting
- If data looks stale, click Refresh
- If blockchain balance shows "Loading...", wait 5-10 seconds
- If search returns nothing, check spelling of principal

---

## 🎯 Common Tasks

### Daily Admin Checklist
```
☐ Check liquidity balance (Platform tab)
☐ Review ledger net PnL (Platform tab)
☐ Check total bets today (Trades tab + date filter)
☐ Verify platform win rate (Trades tab)
☐ Review any unusual user activity (Users tab)
```

### Weekly Admin Checklist
```
☐ Export weekly bets CSV for records
☐ Review user growth (unique users count)
☐ Check strike offset distribution
☐ Analyze expiry preferences
☐ Review top winning/losing users
```

### Monthly Admin Checklist
```
☐ Export full month data
☐ Compare month-over-month metrics
☐ Reconcile liquidity vs ledger
☐ Analyze profitability trends
☐ Review platform efficiency
```

---

## ⚠️ Important Notes

### What This Console DOES:
✅ Display comprehensive analytics  
✅ Export data for external analysis  
✅ Filter and search through data  
✅ Show real-time blockchain balance  
✅ Calculate aggregate metrics  

### What This Console DOES NOT DO:
❌ Modify any trading data  
❌ Execute trades or withdrawals  
❌ Change user balances  
❌ Affect platform functionality  
❌ Store any data (all from canister)  

### Data Safety
- All operations are READ-ONLY
- No risk to platform or users
- Data source is always the canister
- Calculations done client-side
- No persistence of admin data

---

## 📞 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "Loading..." forever | Refresh browser, check ICP connection |
| Empty data | Check if there are any trades in system |
| Blockchain balance "N/A" | API temporarily unavailable, try again |
| Search finds nothing | Verify principal ID spelling |
| CSV won't download | Check browser download permissions |
| Page slow to load | Reduce date range or wait for data fetch |

---

## 📚 Additional Resources

- Full Documentation: `ADMIN_CONSOLE_IMPROVEMENTS.md`
- Architecture Details: `VISUAL_ARCHITECTURE.md`
- Trading Platform Docs: `README.md`

---

**Last Updated:** October 12, 2025  
**Version:** 1.0  
**Questions?** Review the full documentation file for detailed explanations.

