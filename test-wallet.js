# In your project directory, create a test file
echo 'import { walletService } from "./src/services/walletService";

async function testWallet() {
  try {
    const result = await walletService.initializeWallet("test-principal-123");
    console.log("Generated Address:", result.address);
    console.log("Balance:", result.balance.toString());
    console.log("Private Key WIF:", walletService.getPrivateKeyWIF());
  } catch (error) {
    console.error("Error:", error);
  }
}

testWallet();' > test-wallet.js

# Run the test
node test-wallet.js
