# Domain Setup Guide for atticusmini.com

## Option 1: Custom Domain with ICP (Recommended)

### Step 1: Configure DNS Records in Porkbun
1. Login to your Porkbun account
2. Go to DNS management for `atticusmini.com`
3. Add these DNS records:

```
Type: ALIAS
Name: @ (or leave blank for root domain)
Value: tf6rq-nqaaa-aaaam-qd4cq-cai.ic0.app
TTL: 600

Type: CNAME
Name: www
Value: tf6rq-nqaaa-aaaam-qd4cq-cai.ic0.app
TTL: 600

Type: CNAME
Name: admin
Value: tf6rq-nqaaa-aaaam-qd4cq-cai.ic0.app
TTL: 600
```

### Step 2: Update Frontend Configuration
The platform will automatically work with your domain once DNS propagates (5-15 minutes).

### Step 3: Access URLs After Setup
- **Main Platform**: https://atticusmini.com
- **Admin Panel**: https://atticusmini.com/admin.html?code=ADMIN2024
- **Alternative**: https://admin.atticusmini.com (if you set up subdomain)

## Option 2: Direct ICP URLs (Current)
- **Main Platform**: https://tf6rq-nqaaa-aaaam-qd4cq-cai.ic0.app
- **Admin Panel**: https://tf6rq-nqaaa-aaaam-qd4cq-cai.ic0.app/admin.html?code=ADMIN2024

## Backend Connection Confirmation
✅ **Backend Canister**: `tl44y-waaaa-aaaam-qd4dq-cai`  
✅ **Price Oracle**: `tm52m-3yaaa-aaaam-qd4da-cai`  
✅ **Network**: ICP Mainnet (`https://ic0.app`)  
✅ **Authentication**: Internet Identity (`https://identity.ic0.app`)  

## Admin Panel Access
1. **URL**: https://atticusmini.com/admin.html?code=ADMIN2024 (after domain setup)
2. **Authentication**: Uses Internet Identity (same as main platform)
3. **Security**: Requires admin access code in URL parameters
4. **Features**: 
   - Platform wallet balance monitoring
   - Platform ledger balance tracking
   - User balance crediting
   - System status monitoring
   - Withdrawal queue management

## Security Notes
- All connections use HTTPS
- Backend canisters are deployed on ICP mainnet
- Real Bitcoin integration enabled
- No mock data or fallbacks (as requested)
