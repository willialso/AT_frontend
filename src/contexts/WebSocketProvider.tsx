import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
// ✅ REMOVED: useCanister import - not needed for clean price feed

export interface SynchronizedPriceState {
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

interface WebSocketContextType {
  priceState: SynchronizedPriceState;
  isConnected: boolean;
  error: string | null;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [priceState, setPriceState] = useState<SynchronizedPriceState>({
    current: 0,
    timestamp: Date.now(),
    isValid: false,
    change: { amount: 0, percentage: 0 },
    source: 'connecting'
  });

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceFeedHealth, setPriceFeedHealth] = useState({
    lastUpdate: Date.now(),
    updateCount: 0,
    isHealthy: true
  });
  
  // ✅ REMOVED: Oracle canister dependency - keeping feed completely clean
  // ✅ REMOVED: Backend sync status no longer needed
  
  // ✅ SINGLE WEBSOCKET: Centralized connection management
  const wsRef = useRef<WebSocket | null>(null);
  const connectionStateRef = useRef<'disconnected' | 'connecting' | 'connected' | 'reconnecting'>('disconnected');
  const lastPriceRef = useRef(0);
  const reconnectAttempts = useRef(0);
  // ✅ REMOVED: maxReconnectAttempts - allow infinite reconnection for continuous feed
  // ✅ REMOVED: heartbeatIntervalRef no longer needed
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // ✅ REMOVED: lastPongRef - heartbeat monitoring removed
  // ✅ REMOVED: lastOracleUpdateRef - oracle updates removed from main feed
  const isInitializedRef = useRef(false);
  
  // ✅ REMOVED: Price oracle dependency no longer needed

  // ✅ REMOVED: Backend sync no longer needed - using frontend prices directly

  // ✅ REMOVED: Heartbeat monitoring - not needed for continuous feed

  // ✅ CLEANUP: Proper connection cleanup
  const disconnect = useCallback(() => {
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    connectionStateRef.current = 'disconnected';
    setIsConnected(false);
  }, []);

  // ✅ RECONNECT: Continuous reconnection for stable feed
  const scheduleReconnect = useCallback(() => {
    if (connectionStateRef.current === 'reconnecting') return;
    
    connectionStateRef.current = 'reconnecting';
    
    // Gentle backoff with maximum delay cap for continuous operation
    const baseDelay = Math.min(2000 * Math.pow(1.5, reconnectAttempts.current), 30000); // Max 30 seconds
    const jitter = Math.random() * 1000;
    const delay = baseDelay + jitter;
    
    console.log(`🔄 Scheduling reconnect attempt ${reconnectAttempts.current + 1} in ${Math.round(delay)}ms`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttempts.current++;
      connect();
    }, delay);
  }, []);

  // ✅ CONNECT: Simplified connection logic for continuous feed
  const connect = useCallback(() => {
    // Only prevent connection if WebSocket is actually open
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('⚠️ WebSocket already open, skipping...');
      return;
    }

    connectionStateRef.current = 'connecting';
    setError(null);
    
    // Clean up any existing connection first
    disconnect();

    try {
      // ✅ WORKING ENDPOINT: Use Coinbase Exchange WebSocket (currently working)
      const ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');
      wsRef.current = ws;
      
      // Set connection timeout
      connectionTimeoutRef.current = setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
          console.warn('⚠️ Connection timeout, closing and retrying...');
          wsRef.current.close();
        }
      }, 10000); // 10 second timeout
      
      ws.onopen = () => {
        console.log('✅ Connected to Coinbase Exchange WebSocket');
        connectionStateRef.current = 'connected';
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        // ✅ REMOVED: Heartbeat monitoring not needed
        
        // Clear connection timeout
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        
        // ✅ REMOVED: Heartbeat monitoring not needed
        
        // Subscribe to BTC-USD ticker
        ws.send(JSON.stringify({
          type: 'subscribe',
          channels: [{ 
            name: 'ticker', 
            product_ids: ['BTC-USD'] 
          }]
        }));
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle ticker data from Coinbase Pro
          if (data.type === 'ticker' && data.product_id === 'BTC-USD') {
            const price = parseFloat(data.price);
            
            if (price > 0) {
              const timestamp = Date.now();
              
              // ✅ REMOVED: Heartbeat monitoring not needed
              
              // ✅ FIXED: Calculate proper price change for accurate display
              if (price !== lastPriceRef.current) { // Update on any price change
                const previousPrice = lastPriceRef.current;
                lastPriceRef.current = price; // Update reference
                
                // ✅ NEW: Update price feed health monitoring
                setPriceFeedHealth(prev => ({
                  lastUpdate: timestamp,
                  updateCount: prev.updateCount + 1,
                  isHealthy: true
                }));
                
                setPriceState({
                  current: price,
                  timestamp,
                  isValid: true,
                  change: {
                    amount: previousPrice > 0 ? price - previousPrice : 0,
                    percentage: previousPrice > 0 ? ((price - previousPrice) / previousPrice) * 100 : 0
                  },
                  source: 'coinbase_exchange_live',
                  volume: 0, // Simplified - no volume calculations
                  high: price, // Simplified - use current price
                  low: price   // Simplified - use current price
                });
                
                // ✅ CRITICAL: Update price oracle with current price for accurate trade settlements
                // Note: Price oracle updates will be handled by the trading service
              }
            }
          }
        } catch (err) {
          console.error('❌ Error parsing WebSocket data:', err);
        }
      };
      
      ws.onclose = (event) => {
        console.log(`🔌 WebSocket closed: ${event.code} - ${event.reason}`);
        connectionStateRef.current = 'disconnected';
        setIsConnected(false);
        
        // Only reconnect if it wasn't a clean close
        if (event.code !== 1000) {
          scheduleReconnect(); // Always try to reconnect for continuous feed
        }
      };
      
      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setError('WebSocket connection failed');
        connectionStateRef.current = 'disconnected';
        setIsConnected(false);
        
        // Schedule reconnection on error
        scheduleReconnect(); // Always try to reconnect for continuous feed
      };
    } catch (err) {
      console.error('❌ Failed to create WebSocket connection:', err);
      setError('Failed to establish WebSocket connection');
      connectionStateRef.current = 'disconnected';
      setIsConnected(false);
      
      // Schedule reconnection on creation failure
      scheduleReconnect(); // Always try to reconnect for continuous feed
    }
  }, [disconnect, scheduleReconnect]);

  // ✅ INITIALIZE: Single initialization with stable references
  const connectRef = useRef(connect);
  connectRef.current = connect;
  
  const disconnectRef = useRef(disconnect);
  disconnectRef.current = disconnect;

  // ✅ NEW: Price feed health monitoring
  useEffect(() => {
    const healthCheck = setInterval(() => {
      const timeSinceLastUpdate = Date.now() - priceFeedHealth.lastUpdate;
      if (timeSinceLastUpdate > 30000) { // 30 seconds without updates
        console.warn('⚠️ Price feed appears frozen - no updates in 30s');
        setPriceFeedHealth(prev => ({ ...prev, isHealthy: false }));
      }
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(healthCheck);
  }, [priceFeedHealth.lastUpdate]);

  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      connectRef.current();
    }
    
    return () => {
      // Cleanup on unmount
      disconnectRef.current();
    };
  }, []); // ✅ FIXED: No dependencies to prevent re-initialization

  const contextValue: WebSocketContextType = {
    priceState,
    isConnected,
    error,
    reconnect: connect
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

/**
 * Hook to use WebSocket context
 */
export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

/**
 * Hook for backward compatibility with existing code
 */
export const useSynchronizedPrice = () => {
  const { priceState, isConnected, error, reconnect } = useWebSocket();
  return { 
    priceState, 
    isConnected, 
    error,
    reconnect 
  };
};
