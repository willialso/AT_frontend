import { walletService } from './src/services/walletService';

async function testWallet() {
  try {
    console.log('🔍 Testing wallet generation...');
    const result = await walletService.initializeWallet('test-principal-123');
    console.log('✅ Generated Address:', result.address);
    console.log('💰 Balance:', result.balance.toString());
    console.log('🔑 Private Key (WIF):', walletService.getPrivateKeyWIF());
    console.log('🌐 Public Key (hex):', walletService.getPublicKey()?.toString('hex'));
  } catch (error) {
    console.error('❌ Error:', error);
  }
  process.exit(0);
}

testWallet();
