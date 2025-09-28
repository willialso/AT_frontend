# 🚀 Production Setup Guide

## Email Service Configuration

### 1. SendGrid Setup
1. Go to [SendGrid](https://app.sendgrid.com/settings/api_keys)
2. Create a new API key with "Mail Send" permissions
3. Add the API key to your environment variables

### 2. Environment Variables
Create a `.env` file in your project root with:

```bash
# Email Service Configuration (Production)
REACT_APP_SENDGRID_API_KEY=your_sendgrid_api_key_here
REACT_APP_FROM_EMAIL=noreply@bitcoinoptions.io
REACT_APP_FROM_NAME=Bitcoin Options Platform
```

### 3. Domain Authentication (Recommended)
For production, authenticate your domain in SendGrid:
1. Go to SendGrid Settings > Sender Authentication
2. Authenticate your domain
3. Update `REACT_APP_FROM_EMAIL` to use your domain

## Bitcoin Wallet Authentication

### Production Features:
- ✅ **Real Bitcoin Address Validation**: Supports P2PKH (1...), P2SH (3...), and Bech32 (bc1...) addresses
- ✅ **Deterministic Principal Generation**: Creates consistent ICP Principal from Bitcoin address
- ✅ **Wallet Type Support**: Unisat, Xverse, OKX, Custom wallets
- ✅ **Security**: No private keys stored, only address validation

### How It Works:
1. User enters Bitcoin address
2. System validates address format and type
3. Generates deterministic ICP Principal from address hash
4. Creates user account with that Principal
5. User can trade using their Bitcoin identity

## Email Authentication

### Production Features:
- ✅ **Real Email Service**: SendGrid integration for production emails
- ✅ **Verification Codes**: 6-digit codes with 10-minute expiration
- ✅ **Professional Templates**: HTML and text email templates
- ✅ **Fallback Mode**: Console logging for development/testing

### How It Works:
1. User enters email address
2. System sends verification code via SendGrid
3. User enters code to verify ownership
4. Generates deterministic ICP Principal from email
5. Creates user account with that Principal

## Testing Production Authentication

### Email Testing:
1. Add real SendGrid API key to `.env`
2. Try email sign-in with real email address
3. Check email inbox for verification code
4. Verify account creation works

### Bitcoin Testing:
1. Try with real Bitcoin addresses:
   - Legacy: `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa` (Genesis block)
   - P2SH: `3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy`
   - Bech32: `bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4`
2. Verify address validation works
3. Confirm account creation with Bitcoin identity

## Security Considerations

### Email Security:
- ✅ Verification codes expire in 10 minutes
- ✅ Codes are single-use only
- ✅ No sensitive data in email templates
- ✅ Professional email headers and tracking disabled

### Bitcoin Security:
- ✅ No private keys stored or transmitted
- ✅ Only public addresses used
- ✅ Deterministic but secure Principal generation
- ✅ Address validation prevents injection attacks

## Monitoring & Logs

### Production Logs:
- ✅ Email service status on app startup
- ✅ Authentication success/failure tracking
- ✅ Address validation logging
- ✅ Error handling with fallbacks

### Console Output Examples:
```
✅ Email service initialized for production
✅ Verification email sent to: user@example.com
✅ Bitcoin address validated: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
✅ User authenticated via Bitcoin wallet
```

## Deployment Checklist

- [ ] SendGrid API key configured
- [ ] Domain authenticated (optional but recommended)
- [ ] Environment variables set
- [ ] Email templates tested
- [ ] Bitcoin address validation tested
- [ ] Error handling verified
- [ ] Fallback modes working
- [ ] Production logs monitoring

## Support

For production issues:
1. Check console logs for authentication status
2. Verify SendGrid API key permissions
3. Test with real email addresses and Bitcoin addresses
4. Monitor error rates and fallback usage
