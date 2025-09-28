#!/bin/bash

echo "🚀 Deploying Atticus to ICP Mainnet with Real Bitcoin Integration"

# Check if dfx is installed
if ! command -v dfx &> /dev/null; then
    echo "❌ DFX is not installed. Please install it first."
    exit 1
fi

# Check if user is authenticated
if ! dfx identity whoami &> /dev/null; then
    echo "❌ Please authenticate with DFX first: dfx identity new <identity-name>"
    exit 1
fi

echo "✅ DFX authenticated as: $(dfx identity whoami)"

# Build the frontend
echo "📦 Building frontend for production..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

echo "✅ Frontend built successfully"

# Deploy to mainnet
echo "🌐 Deploying to ICP Mainnet..."

# Deploy backend canister first
echo "📡 Deploying backend canister..."
dfx deploy backend --network ic

if [ $? -ne 0 ]; then
    echo "❌ Backend deployment failed"
    exit 1
fi

# Deploy frontend canister
echo "🎨 Deploying frontend canister..."
dfx deploy frontend --network ic

if [ $? -ne 0 ]; then
    echo "❌ Frontend deployment failed"
    exit 1
fi

# Get canister IDs
BACKEND_ID=$(dfx canister id backend --network ic)
FRONTEND_ID=$(dfx canister id frontend --network ic)

echo ""
echo "🎉 Deployment Complete!"
echo "================================"
echo "Backend Canister ID: $BACKEND_ID"
echo "Frontend Canister ID: $FRONTEND_ID"
echo ""
echo "🌐 Live Application: https://$FRONTEND_ID.ic0.app"
echo "🌐 Custom Domain: https://atticusmini.com (after DNS setup)"
echo "📡 Backend API: https://$BACKEND_ID.ic0.app"
echo "🔧 Admin Panel: https://$FRONTEND_ID.ic0.app/admin.html"
echo "🔧 Admin Panel (Custom): https://atticusmini.com/admin.html (after DNS setup)"
echo ""
echo "🔐 Features Deployed:"
echo "  ✅ Real ICP Authentication (Internet Identity)"
echo "  ✅ Real Bitcoin Wallet Generation"
echo "  ✅ Platform Wallet for Atomic Settlements"
echo "  ✅ Live Bitcoin Options Trading"
echo "  ✅ Real-time Price Feeds"
echo "  ✅ Atomic Position Settlements"
echo ""
echo "⚠️  IMPORTANT: This is a live mainnet deployment with real Bitcoin integration!"
echo "   - Users will generate real Bitcoin addresses"
echo "   - Platform wallet holds real funds for settlements"
echo "   - All trades are executed with real Bitcoin"
echo ""
echo "🔧 Next Steps:"
echo "  1. Fund the platform wallet with Bitcoin for settlements"
echo "  2. Test with small amounts first"
echo "  3. Monitor platform balance and settlements"
echo "  4. Set up monitoring and alerts"
echo ""
echo "📊 Platform Stats:"
dfx canister call backend get_platform_stats --network ic


