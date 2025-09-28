/**
 * Global Price Feed Manager - Simplified Coinbase Ticker Feed
 * This singleton ensures the price feed is never affected by React re-renders
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
  volume?: number;
  high?: number;
  low?: number;
}

export type PriceUpdateCallback = (data: PriceData) => void;

class PriceFeedManager {
  private static instance: PriceFeedManager;
  private ws: WebSocket | null = null;
  private priceData: PriceData = {
    current: 0,
    timestamp: Date.now(),
    isValid: false,
    change: { amount: 0, percentage: 0 },
    source: 'disconnected'
  };
  private listeners: Set<PriceUpdateCallback> = new Set();
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private lastPrice = 0;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private lastUpdateTime = Date.now();

  private constructor() {
    this.startHealthMonitoring();
    this.connect();
  }

  static getInstance(): PriceFeedManager {
    if (!PriceFeedManager.instance) {
      PriceFeedManager.instance = new PriceFeedManager();
    }
    return PriceFeedManager.instance;
  }

  /**
   * Get current price data
   */
  getPriceData(): PriceData {
    return { ...this.priceData };
  }

  /**
   * Subscribe to price updates
   */
  subscribe(callback: PriceUpdateCallback): () => void {
    this.listeners.add(callback);
    
    // Immediately send current data to new subscriber
    if (this.priceData.isValid) {
      try {
        callback(this.priceData);
      } catch (error) {
        console.error('Error in initial price callback:', error);
      }
    }
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Get connection state
   */
  getConnectionState(): string {
    return this.connectionState;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionState === 'connected';
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastUpdate = now - this.lastUpdateTime;
      
      if (timeSinceLastUpdate > 30000) { // 30 seconds
        console.warn('⚠️ No price updates received in 30 seconds');
        this.handleConnectionError('No updates received');
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Handle connection errors
   */
  private handleConnectionError(_errorMsg: string): void {
    if (this.connectionState === 'connected') {
      this.connectionState = 'reconnecting';
      this.reconnect();
    }
  }

  /**
   * Reconnect with exponential backoff
   */
  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.connectionState = 'disconnected';
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Connect to WebSocket
   */
  private connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.connectionState = 'connecting';
      console.log('🔌 Connecting to Coinbase WebSocket...');
      
      const ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');
      this.ws = ws;

      ws.onopen = () => {
        console.log('✅ Connected to Coinbase WebSocket');
        this.connectionState = 'connected';
        this.reconnectAttempts = 0;
        
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }

        // ✅ SIMPLIFIED: Subscribe to ticker channel for direct price updates
        ws.send(JSON.stringify({
          type: 'subscribe',
          product_ids: ['BTC-USD'],
          channels: ['ticker']
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'ticker' && data.product_id === 'BTC-USD') {
            // ✅ SIMPLIFIED: Direct price from ticker channel
            const currentPrice = parseFloat(data.price);
            
            if (currentPrice > 0) {
              const timestamp = Date.now();
              this.lastUpdateTime = timestamp;
              
              // ✅ OPTIMAL: No filtering - always update price data for fresh information
              const previousPrice = this.lastPrice;
              this.lastPrice = currentPrice;
              
              const priceChange = {
                amount: previousPrice > 0 ? currentPrice - previousPrice : 0,
                percentage: previousPrice > 0 ? ((currentPrice - previousPrice) / previousPrice) * 100 : 0
              };

              this.priceData = {
                current: currentPrice,
                timestamp,
                isValid: true,
                change: priceChange,
                source: 'coinbase_ticker',
                volume: parseFloat(data.last_size || '0'),
                high: parseFloat(data.high_24h || currentPrice.toString()),
                low: parseFloat(data.low_24h || currentPrice.toString())
              };

              // ✅ OPTIMIZED: Only log significant changes to reduce console spam
              const priceDifference = Math.abs(currentPrice - previousPrice);
              if (priceDifference >= 0.01) { // Only log changes >= $0.01
                console.log(`📊 Price update: $${previousPrice.toFixed(2)} → $${currentPrice.toFixed(2)} (volume: ${data.last_size || '0'})`);
              }

              // ✅ CRITICAL: Always notify listeners for fresh price data
              this.listeners.forEach(callback => {
                try {
                  callback(this.priceData);
                } catch (error) {
                  console.error('Error in price update callback:', error);
                }
              });
            }
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket data:', error);
        }
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket connection closed');
        this.connectionState = 'disconnected';
        this.handleConnectionError('Connection closed');
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.handleConnectionError('WebSocket error');
      };

      // Connection timeout
      this.connectionTimeout = setTimeout(() => {
        console.error('❌ WebSocket connection timeout');
        ws.close();
        this.handleConnectionError('Connection timeout');
      }, 10000);

    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      this.handleConnectionError('Failed to connect');
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.listeners.clear();
  }
}

// Create and export singleton instance
export const priceFeedManager = PriceFeedManager.getInstance();

// Make it globally available for debugging
if (typeof window !== 'undefined') {
  (window as any).priceFeedManager = priceFeedManager;
}