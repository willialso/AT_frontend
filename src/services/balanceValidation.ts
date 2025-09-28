import { Decimal } from 'decimal.js';

/**
 * Balance Validation Service
 * Handles all balance-related calculations and validations for trading
 */
export class BalanceValidationService {
  // Minimum balance required for any trade (in BTC)
  private static readonly MINIMUM_BALANCE = new Decimal('0.00001'); // 1,000 sats
  
  // Minimum trade amount (in USD)
  private static readonly MINIMUM_TRADE_AMOUNT = 1; // $1 USD minimum
  
  // Maximum trade amount (in USD) 
  private static readonly MAXIMUM_TRADE_AMOUNT = 1000; // $1,000 USD maximum

  /**
   * Validate if user has sufficient balance for a trade
   */
  static validateTradeBalance(
    userBalance: Decimal,
    contractCount: number,
    btcPrice: number
  ): { 
    valid: boolean; 
    error?: string; 
    requiredBalance: Decimal;
    tradeCostUSD: number;
    tradeCostBTC: Decimal;
  } {
    // Calculate trade cost
    const tradeCostUSD = contractCount; // $1 per contract
    const tradeCostBTC = new Decimal(tradeCostUSD).div(btcPrice);
    
    // Check minimum balance
    if (userBalance.lessThan(this.MINIMUM_BALANCE)) {
      return {
        valid: false,
        error: `Minimum balance required: ${this.MINIMUM_BALANCE.toFixed(8)} BTC`,
        requiredBalance: this.MINIMUM_BALANCE,
        tradeCostUSD,
        tradeCostBTC
      };
    }
    
    // Check if user has sufficient balance for trade
    if (userBalance.lessThan(tradeCostBTC)) {
      return {
        valid: false,
        error: `Insufficient balance. Required: ${tradeCostBTC.toFixed(8)} BTC ($${tradeCostUSD} USD)`,
        requiredBalance: tradeCostBTC,
        tradeCostUSD,
        tradeCostBTC
      };
    }
    
    // Check trade amount limits
    if (tradeCostUSD < this.MINIMUM_TRADE_AMOUNT) {
      return {
        valid: false,
        error: `Minimum trade amount: $${this.MINIMUM_TRADE_AMOUNT} USD`,
        requiredBalance: tradeCostBTC,
        tradeCostUSD,
        tradeCostBTC
      };
    }
    
    if (tradeCostUSD > this.MAXIMUM_TRADE_AMOUNT) {
      return {
        valid: false,
        error: `Maximum trade amount: $${this.MAXIMUM_TRADE_AMOUNT} USD`,
        requiredBalance: tradeCostBTC,
        tradeCostUSD,
        tradeCostBTC
      };
    }
    
    return {
      valid: true,
      requiredBalance: tradeCostBTC,
      tradeCostUSD,
      tradeCostBTC
    };
  }

  /**
   * Convert BTC to USD
   */
  static convertBTCToUSD(btcAmount: Decimal, btcPrice: number): number {
    return btcAmount.mul(btcPrice).toNumber();
  }

  /**
   * Check if balance is low (less than $10 USD)
   */
  static isLowBalance(balance: Decimal, btcPrice: number): boolean {
    const usdValue = this.convertBTCToUSD(balance, btcPrice);
    return usdValue < 10;
  }

  /**
   * Get balance status for UI display
   */
  static getBalanceStatus(
    userBalance: Decimal, 
    requiredBalance: Decimal, 
    btcPrice: number
  ): {
    status: 'sufficient' | 'insufficient' | 'low' | 'critical';
    message: string;
    color: string;
  } {
    const usdBalance = this.convertBTCToUSD(userBalance, btcPrice);
    const usdRequired = this.convertBTCToUSD(requiredBalance, btcPrice);
    
    if (userBalance.lessThan(requiredBalance)) {
      return {
        status: 'insufficient',
        message: `Insufficient balance. Need $${usdRequired.toFixed(2)} more.`,
        color: '#ff4444'
      };
    }
    
    if (this.isLowBalance(userBalance, btcPrice)) {
      return {
        status: 'low',
        message: `Low balance: $${usdBalance.toFixed(2)} remaining.`,
        color: '#ffa500'
      };
    }
    
    if (usdBalance < 11) {
      return {
        status: 'critical',
        message: `Critical balance: $${usdBalance.toFixed(2)} remaining.`,
        color: '#ff6b6b'
      };
    }
    
    return {
      status: 'sufficient',
      message: `Balance: $${usdBalance.toFixed(2)} available.`,
      color: '#00aa33'
    };
  }
}
