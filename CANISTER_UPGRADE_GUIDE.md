# Atticus Core Canister Upgrade Guide

## Overview
The admin panel requires specific query functions that need to be deployed to the canister. The code already exists in `src/backend/atticus_core.mo` but needs to be deployed.

## Required Admin Functions
- ✅ `get_all_users()` - Returns all registered users
- ✅ `get_platform_wallet()` - Returns platform wallet data
- ✅ `get_platform_ledger()` - Returns platform ledger data  
- ✅ `get_platform_trading_summary()` - Returns trading summary

## Deployment Options

### Option 1: Automated Deployment Script (Recommended)

```bash
./deploy-atticus-core.sh
```

This script will:
1. Build the canister
2. Deploy to mainnet
3. Verify all admin functions

### Option 2: Manual Deployment

```bash
# 1. Build the canister
dfx build atticus_core --network ic

# 2. Deploy/upgrade the canister
dfx canister install atticus_core --network ic --mode upgrade --canister-id rraue-iqaaa-aaaam-qd4mq-cai

# 3. Verify deployment
dfx canister call atticus_core get_all_users --network ic
```

### Option 3: Using Canister ID

```bash
# Upgrade specific canister by ID
dfx canister install rraue-iqaaa-aaaam-qd4mq-cai --network ic --mode upgrade
```

## Pre-Deployment Checklist

- [ ] dfx installed (`dfx --version`)
- [ ] dfx identity configured with controller access
- [ ] Confirmed canister ID: `rraue-iqaaa-aaaam-qd4mq-cai`
- [ ] Backend code verified at `src/backend/atticus_core.mo`

## Verify Deployment

After deployment, test the admin functions:

```bash
# Test get_all_users
dfx canister call atticus_core get_all_users --network ic

# Test get_platform_wallet  
dfx canister call atticus_core get_platform_wallet --network ic

# Test get_platform_ledger
dfx canister call atticus_core get_platform_ledger --network ic

# Test get_platform_trading_summary
dfx canister call atticus_core get_platform_trading_summary --network ic
```

## Post-Deployment

1. Clear browser cache
2. Access admin panel: `https://atticusmini.com/?code=040617081822010316`
3. Test "List All Users" button
4. Test "Fetch Platform Data" button

## Troubleshooting

### Error: "You are not authorized"
**Solution**: Ensure your dfx identity is a controller of the canister

```bash
dfx canister info rraue-iqaaa-aaaam-qd4mq-cai --network ic
```

### Error: "Canister has no upgrade methods"
**Solution**: Use reinstall mode (WARNING: loses data)

```bash
dfx canister install atticus_core --network ic --mode reinstall
```

### Error: "Cannot find canister"
**Solution**: Check dfx.json has correct canister configuration

## Canister Information

- **Canister ID**: `rraue-iqaaa-aaaam-qd4mq-cai`
- **Code Location**: `src/backend/atticus_core.mo`
- **Network**: IC Mainnet
- **Functions**: Lines 241-271 in atticus_core.mo

## Admin Panel Features After Upgrade

✅ **Users Tab**
- List all registered users
- View balances, wins, losses, PnL
- User lookup by principal

✅ **Platform Tab**
- Platform wallet balance
- Total deposits/withdrawals
- Platform ledger (winning/losing trades)
- Trading summary (active/settled trades)

✅ **All data in BTC with 8 decimal precision**

## Notes

- The upgrade preserves existing user data and positions
- All functions are query methods (no state changes)
- Admin panel will automatically work after deployment
- No frontend changes needed

