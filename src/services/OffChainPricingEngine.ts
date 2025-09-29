/**
 * ✅ OFF-CHAIN PRICING ENGINE
 * Following odin.fun pattern: All pricing logic moved from backend to frontend
 * This eliminates the need for a price oracle canister and provides instant calculations
 */

export interface PriceData {
  current: number;
  timestamp: number;
  isValid: boolean;
  change: {
    amount: number;
    percentage: number;
  };
  source: string;
  volume: number;
  high: number;
  low: number;
}

export interface SettlementResult {
  outcome: 'win' | 'loss';
  payout: number;
  profit: number;
  finalPrice: number;
}

export interface TradeData {
  optionType: 'call' | 'put';
  strikeOffset: number;
  expiry: string;
  contractCount: number;
  userPrincipal: string;
}

export class OffChainPricingEngine {
  private wsConnection: WebSocket | null = null;
  private currentPrice: number = 0;
  private priceHistory: Array<{ timestamp: number; price: number }> = [];
  private listeners: Array<(priceData: PriceData) => void> = [];
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  constructor() {
    this.connectToPriceFeed();
  }

  /**
   * ✅ CONNECT TO REAL-TIME PRICE FEED
   * Using Coinbase WebSocket for live Bitcoin prices
   */
  private connectToPriceFeed(): void {
    try {
      console.log('🔌 Connecting to Coinbase WebSocket feed...');
      
      this.wsConnection = new WebSocket('wss://ws-feed.exchange.coinbase.com');
      
      this.wsConnection.onopen = () => {
        console.log('✅ Connected to Coinbase WebSocket');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Subscribe to BTC-USD ticker
        this.wsConnection?.send(JSON.stringify({
          type: 'subscribe',
          product_ids: ['BTC-USD'],
          channels: ['ticker']
        }));
      };

      this.wsConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'ticker' && data.product_id === 'BTC-USD') {
            this.handlePriceUpdate(data);
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      this.wsConnection.onclose = () => {
        console.log('🔌 WebSocket connection closed');
        this.isConnected = false;
        this.handleReconnect();
      };

      this.wsConnection.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.isConnected = false;
      };

    } catch (error) {
      console.error('❌ Failed to connect to price feed:', error);
      this.handleReconnect();
    }
  }

  /**
   * ✅ HANDLE PRICE UPDATES
   * Process real-time price data and notify listeners
   */
  private handlePriceUpdate(data: any): void {
    const currentPrice = parseFloat(data.price);
    
    if (currentPrice > 0) {
      const timestamp = Date.now();
      const previousPrice = this.currentPrice;
      this.currentPrice = currentPrice;
      
      // Store price history
      this.priceHistory.push({ timestamp, price: currentPrice });
      
      // Keep only last 1000 prices to prevent memory issues
      if (this.priceHistory.length > 1000) {
        this.priceHistory = this.priceHistory.slice(-1000);
      }
      
      const priceChange = {
        amount: previousPrice > 0 ? currentPrice - previousPrice : 0,
        percentage: previousPrice > 0 ? ((currentPrice - previousPrice) / previousPrice) * 100 : 0
      };

      const priceData: PriceData = {
        current: currentPrice,
        timestamp,
        isValid: true,
        change: priceChange,
        source: 'coinbase_websocket',
        volume: parseFloat(data.last_size || '0'),
        high: parseFloat(data.high_24h || currentPrice.toString()),
        low: parseFloat(data.low_24h || currentPrice.toString())
      };

      // Notify all listeners
      this.listeners.forEach(callback => {
        try {
          callback(priceData);
        } catch (error) {
          console.error('❌ Error in price update callback:', error);
        }
      });

      // Log significant price changes
      const priceDifference = Math.abs(currentPrice - previousPrice);
      if (priceDifference >= 0.01) {
        console.log(`📊 Price update: $${previousPrice.toFixed(2)} → $${currentPrice.toFixed(2)}`);
      }
    }
  }

  /**
   * ✅ HANDLE RECONNECTION
   * Automatic reconnection with exponential backoff
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connectToPriceFeed();
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached. Price feed unavailable.');
    }
  }

  /**
   * ✅ ADD PRICE LISTENER
   * Subscribe to real-time price updates
   * This replaces WebSocketProvider and PriceFeedManager
   */
  public addPriceListener(callback: (priceData: PriceData) => void): void {
    this.listeners.push(callback);
  }

  /**
   * ✅ REMOVE PRICE LISTENER
   * Unsubscribe from price updates
   */
  public removePriceListener(callback: (priceData: PriceData) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  /**
   * ✅ GET CURRENT PRICE
   * Get the latest Bitcoin price
   */
  public getCurrentPrice(): number {
    return this.currentPrice;
  }

  /**
   * ✅ GET PRICE HISTORY
   * Get historical price data
   */
  public getPriceHistory(minutes: number = 60): Array<{ timestamp: number; price: number }> {
    const cutoffTime = Date.now() - (minutes * 60 * 1000);
    return this.priceHistory.filter(entry => entry.timestamp >= cutoffTime);
  }

  /**
   * ✅ CALCULATE STRIKE PRICE
   * Calculate strike price based on current price and offset
   */
  public calculateStrikePrice(currentPrice: number, offset: number, optionType: 'call' | 'put'): number {
    if (optionType === 'call') {
      return currentPrice + offset;
    } else {
      return currentPrice - offset;
    }
  }

  /**
   * ✅ CALCULATE PREMIUM
   * Calculate premium cost for trade
   */
  public calculatePremium(contractCount: number): number {
    return contractCount; // $1 per contract
  }

  /**
   * ✅ CALCULATE SETTLEMENT (OFF-CHAIN)
   * Fast, accurate settlement using proper payout tables
   * This replaces the slow backend settlement with instant off-chain calculation
   */
  public calculateSettlement(
    optionType: 'call' | 'put',
    strikeOffset: number,
    expiry: string,
    finalPrice: number,
    entryPrice: number
  ): SettlementResult {
    // Calculate strike price from entry price and offset
    const strikePrice = optionType === 'call' 
      ? entryPrice + strikeOffset 
      : entryPrice - strikeOffset;
    
    // Determine win/loss
    const isWin = optionType === 'call' 
      ? finalPrice > strikePrice 
      : finalPrice < strikePrice;
    
    const isTie = Math.abs(finalPrice - strikePrice) < 0.005; // 0.5 cent tolerance
    
    let outcome: 'win' | 'loss' | 'tie' = 'loss';
    let payout = 0;
    let profit = -1.0; // Default to losing the $1 entry premium
    
    if (isTie) {
      outcome = 'tie';
      payout = 1.0; // Refund entry cost
      profit = 0.0; // No profit/loss
    } else if (isWin) {
      outcome = 'win';
      
      // ✅ USE CORRECT PAYOUT TABLES (matching backend)
      const PAYOUT_TABLE: Record<string, Record<number, number>> = {
        '5s': { 2.5: 3.33, 5: 4.00, 10: 10.00, 15: 20.00 },
        '10s': { 2.5: 2.86, 5: 3.33, 10: 6.67, 15: 13.33 },
        '15s': { 2.5: 2.50, 5: 2.86, 10: 5.00, 15: 10.00 }
      };
      
      // Get payout from table
      const tablePayout = PAYOUT_TABLE[expiry]?.[strikeOffset] || 0;
      payout = tablePayout;
      profit = payout - 1.0; // Net profit = total payout - entry cost
    } else {
      outcome = 'loss';
      payout = 0;
      profit = -1.0; // Lose the entry premium
    }
    
    console.log('🎯 Off-chain settlement calculation:', {
      optionType,
      strikeOffset,
      expiry,
      entryPrice,
      strikePrice,
      finalPrice,
      isWin,
      isTie,
      outcome,
      payout,
      profit
    });
    
    return {
      outcome,
      payout,
      profit,
      finalPrice
    };
  }

  /**
   * ✅ CALCULATE TRADE COST
   * Calculate total cost for trade
   */
  public calculateTradeCost(contractCount: number, btcPrice: number): number {
    const premiumUSD = this.calculatePremium(contractCount);
    return premiumUSD / btcPrice; // Convert to BTC
  }

  /**
   * ✅ VALIDATE TRADE
   * Validate trade parameters
   */
  public validateTrade(tradeData: TradeData, userBalance: number, btcPrice: number): {
    valid: boolean;
    error?: string;
    tradeCost: number;
  } {
    const tradeCost = this.calculateTradeCost(tradeData.contractCount, btcPrice);
    
    if (tradeCost > userBalance) {
      return {
        valid: false,
        error: `Insufficient balance. Required: ${tradeCost.toFixed(8)} BTC`,
        tradeCost
      };
    }
    
    if (tradeData.contractCount < 1 || tradeData.contractCount > 1000) {
      return {
        valid: false,
        error: 'Contract count must be between 1 and 1000',
        tradeCost
      };
    }
    
    if (tradeData.strikeOffset < 0.01 || tradeData.strikeOffset > 1000) {
      return {
        valid: false,
        error: 'Strike offset must be between $0.01 and $1000',
        tradeCost
      };
    }
    
    return {
      valid: true,
      tradeCost
    };
  }

  /**
   * ✅ GET CONNECTION STATUS
   * Check if price feed is connected
   */
  public isPriceFeedConnected(): boolean {
    return this.isConnected;
  }

  /**
   * ✅ RECORD SETTLEMENT (BACKEND)
   * Send settlement result to backend for recording only
   * Backend just stores the result - no complex calculations
   */
  public async recordSettlement(
    positionId: number,
    settlementResult: SettlementResult,
    backendCanister: any
  ): Promise<void> {
    try {
      console.log('📝 Recording settlement to backend:', {
        positionId,
        settlementResult
      });
      
      // Simple backend call to record the result
      const result = await backendCanister.recordSettlement(
        BigInt(positionId),
        settlementResult.outcome,
        Math.round(settlementResult.payout * 100), // Convert to cents
        Math.round(settlementResult.profit * 100), // Convert to cents
        Math.round(settlementResult.finalPrice * 100) // Convert to cents
      );
      
      if ('ok' in result) {
        console.log('✅ Settlement recorded successfully');
      } else {
        console.error('❌ Failed to record settlement:', result.err);
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('❌ Error recording settlement:', error);
      throw error;
    }
  }

  /**
   * ✅ DISCONNECT
   * Clean up WebSocket connection
   */
  public disconnect(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    this.isConnected = false;
    this.listeners = [];
  }
}

// ✅ SINGLETON INSTANCE
export const pricingEngine = new OffChainPricingEngine();
