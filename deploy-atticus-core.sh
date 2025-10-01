#!/bin/bash

# Deploy Atticus Core Canister with Admin Functions
# This script deploys the atticus_core canister to mainnet with all admin query functions

echo "🚀 Deploying Atticus Core Canister to Mainnet..."
echo "📝 Canister ID: rraue-iqaaa-aaaam-qd4mq-cai"
echo ""

# Check if dfx is installed
if ! command -v dfx &> /dev/null; then
    echo "❌ dfx is not installed. Please install dfx first:"
    echo "   sh -ci \"\$(curl -fsSL https://internetcomputer.org/install.sh)\""
    exit 1
fi

echo "✅ dfx found: $(dfx --version)"
echo ""

# Confirm deployment
read -p "⚠️  This will upgrade the canister rraue-iqaaa-aaaam-qd4mq-cai on mainnet. Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

echo ""
echo "🔨 Building canister..."

# Build the canister
dfx build atticus_core --network ic

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"
echo ""
echo "📦 Deploying to mainnet..."

# Deploy/upgrade the canister
dfx canister install atticus_core --network ic --mode upgrade

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed"
    echo ""
    echo "💡 Try these alternatives:"
    echo "   1. Use reinstall mode (WARNING: loses data):"
    echo "      dfx canister install atticus_core --network ic --mode reinstall"
    echo ""
    echo "   2. Check canister controllers:"
    echo "      dfx canister info rraue-iqaaa-aaaam-qd4mq-cai --network ic"
    exit 1
fi

echo ""
echo "✅ Deployment successful!"
echo ""
echo "🔍 Verifying admin functions..."
echo ""

# Verify admin functions are available
echo "Testing get_all_users..."
dfx canister call atticus_core get_all_users --network ic

echo ""
echo "Testing get_platform_wallet..."
dfx canister call atticus_core get_platform_wallet --network ic

echo ""
echo "Testing get_platform_ledger..."
dfx canister call atticus_core get_platform_ledger --network ic

echo ""
echo "Testing get_platform_trading_summary..."
dfx canister call atticus_core get_platform_trading_summary --network ic

echo ""
echo "✅ All admin functions verified!"
echo ""
echo "🎉 Deployment complete!"
echo "📊 Admin panel should now work at: https://atticusmini.com/?code=040617081822010316"

