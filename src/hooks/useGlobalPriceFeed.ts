import { useState, useEffect, useCallback } from 'react';
import { priceFeedManager, PriceData, PriceUpdateCallback } from '../services/priceFeedManager';

/**
 * Hook to access the global price feed manager
 * This hook provides a bridge between the React component lifecycle and the global singleton
 */
export const useGlobalPriceFeed = () => {
  const [priceData, setPriceData] = useState<PriceData>(priceFeedManager.getPriceData());
  const [isConnected, setIsConnected] = useState<boolean>(priceFeedManager.isConnected());

  useEffect(() => {
    const callback: PriceUpdateCallback = (data: PriceData) => {
      setPriceData(data);
      setIsConnected(priceFeedManager.isConnected());
    };

    // Subscribe to price updates
    const unsubscribe = priceFeedManager.subscribe(callback);

    // Update connection state
    setIsConnected(priceFeedManager.isConnected());

    return unsubscribe;
  }, []);

  const getConnectionState = useCallback(() => {
    return priceFeedManager.getConnectionState();
  }, []);

  const isReady = useCallback(() => {
    return priceFeedManager.isConnected() && priceData.isValid;
  }, [priceData.isValid]);

  return {
    priceData,
    isConnected,
    getConnectionState,
    isReady
  };
};

/**
 * Hook to get current price with change information
 */
export const useCurrentPrice = () => {
  const { priceData, isConnected } = useGlobalPriceFeed();
  
  return {
    current: priceData.current,
    change: priceData.change,
    isConnected,
    isValid: priceData.isValid
  };
};

/**
 * Hook to get price with formatted change
 */
export const usePriceWithChange = () => {
  const { priceData, isConnected } = useGlobalPriceFeed();
  
  const formatChange = (change: { amount: number; percentage: number }) => {
    const sign = change.amount >= 0 ? '+' : '';
    return {
      amount: `${sign}${change.amount.toFixed(2)}`,
      percentage: `${sign}${change.percentage.toFixed(2)}%`,
      isPositive: change.amount >= 0
    };
  };

  return {
    current: priceData.current,
    change: formatChange(priceData.change),
    isConnected,
    isValid: priceData.isValid,
    source: priceData.source
  };
};

/**
 * Hook for synchronized price data (used by TradingPanel)
 */
export const useSynchronizedPrice = () => {
  const { priceData, isConnected } = useGlobalPriceFeed();
  
  // Return price data in the format expected by TradingPanel
  return {
    priceState: {
      current: priceData.current,
      timestamp: priceData.timestamp,
      change: priceData.change,
      source: priceData.source,
      isValid: priceData.isValid,
      volume: priceData.volume || 0,
      high: priceData.high || priceData.current,
      low: priceData.low || priceData.current
    },
    isConnected
  };
};