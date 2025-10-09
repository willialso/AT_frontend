/**
 * ✅ ENHANCED TRADING HEADER
 * Demonstrates how to integrate enhanced services into existing trading interface
 * Shows real-time balance updates and enhanced error handling
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useEnhancedServices } from '../hooks/useEnhancedServices';
import { useBalance } from '../contexts/BalanceProvider'; // Existing balance provider

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.375rem 1rem;
  background: var(--bg-panel); /* ✅ FIX: Match footer color for consistency */
  border-bottom: 1px solid var(--border);
  box-shadow: 0 1px 4px var(--shadow);
  min-height: 45px;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 1000;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  height: 40px;

  img {
    height: 32px;
    width: auto;
    object-fit: contain;
    max-width: 150px;
    opacity: 1; /* ✅ FIX: Remove opacity for full visibility */
  }
`;

const BalanceContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const BalanceDisplay = styled.div<{ $status: 'sufficient' | 'low' | 'insufficient' | 'error' }>`
  padding: 0.15rem 0.3rem;
  background: ${props => {
    switch (props.$status) {
      case 'sufficient': return 'rgba(0, 212, 170, 0.15)';
      case 'low': return 'rgba(255, 193, 7, 0.15)';
      case 'insufficient': return 'rgba(255, 71, 87, 0.15)';
      case 'error': return 'rgba(108, 117, 125, 0.15)';
      default: return 'rgba(128, 128, 128, 0.15)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.$status) {
      case 'sufficient': return 'var(--green)';
      case 'low': return '#ffc107';
      case 'insufficient': return 'var(--red)';
      case 'error': return '#6c757d';
      default: return 'var(--border)';
    }
  }};
  border-radius: 3px;
  font-size: 0.6rem;
  font-weight: 600;
  color: ${props => {
    switch (props.$status) {
      case 'sufficient': return 'var(--green)';
      case 'low': return '#ffc107';
      case 'insufficient': return 'var(--red)';
      case 'error': return '#6c757d';
      default: return 'var(--text-dim)';
    }
  }};
  white-space: nowrap;
  margin-right: 0.5rem;
`;

const StatusIndicator = styled.div<{ $status: 'online' | 'offline' | 'error' }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => {
    switch (props.$status) {
      case 'online': return 'var(--green)';
      case 'offline': return 'var(--red)';
      case 'error': return '#ffc107';
      default: return 'var(--text-dim)';
    }
  }};
  margin-right: 4px;
`;

const RefreshButton = styled.button`
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.6rem;
  cursor: pointer;
  
  &:hover {
    background: var(--bg-button);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorTooltip = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  background: var(--red);
  color: white;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  white-space: nowrap;
  z-index: 1001;
  margin-top: 4px;
`;

interface EnhancedTradingHeaderProps {
  isDemoMode?: boolean;
  onDisconnect?: () => void;
}

export const EnhancedTradingHeader: React.FC<EnhancedTradingHeaderProps> = ({ 
  isDemoMode = false, 
  onDisconnect 
}) => {
  // Use both existing and enhanced services for comparison
  const { userBalance: existingBalance, refreshBalance: existingRefresh } = useBalance();
  const {
    userBalance: enhancedBalance,
    platformBalance,
    balanceError,
    balanceLastUpdated,
    isInitialized,
    isConnected,
    refreshAllBalances,
    getBalanceStatus
  } = useEnhancedServices();

  const [showError, setShowError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle balance refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAllBalances();
    } catch (error) {
      console.error('Failed to refresh balances:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Determine balance status
  const getBalanceDisplayStatus = (): 'sufficient' | 'low' | 'insufficient' | 'error' => {
    if (balanceError) return 'error';
    if (!isInitialized) return 'error';
    
    const balance = enhancedBalance || existingBalance;
    if (balance > 0.001) return 'sufficient';
    if (balance > 0.0001) return 'low';
    return 'insufficient';
  };

  // Get connection status
  const getConnectionStatus = (): 'online' | 'offline' | 'error' => {
    if (balanceError) return 'error';
    if (!isInitialized) return 'offline';
    return isConnected ? 'online' : 'offline';
  };

  // Format balance for display
  const formatBalance = (balance: number): string => {
    if (balance === 0) return '0';
    if (balance < 0.000001) return balance.toFixed(8);
    return balance.toFixed(6);
  };

  // Show error tooltip
  useEffect(() => {
    if (balanceError) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [balanceError]);

  return (
    <Header>
      <LogoContainer>
        <img src="/images/attiminlogo.png" alt="Atticus" />
      </LogoContainer>

      {!isDemoMode && (
        <BalanceContainer>
          {/* Enhanced Balance Display */}
          <div style={{ position: 'relative' }}>
            <BalanceDisplay $status={getBalanceDisplayStatus()}>
              <StatusIndicator $status={getConnectionStatus()} />
              {formatBalance(enhancedBalance || existingBalance)} BTC
              {balanceLastUpdated > 0 && (
                <span style={{ fontSize: '0.5rem', opacity: 0.7 }}>
                  {' '}({new Date(balanceLastUpdated).toLocaleTimeString()})
                </span>
              )}
            </BalanceDisplay>
            
            {showError && balanceError && (
              <ErrorTooltip>
                {balanceError}
              </ErrorTooltip>
            )}
          </div>

          {/* Platform Balance (if available) */}
          {platformBalance > 0 && (
            <BalanceDisplay $status="sufficient">
              Platform: {formatBalance(platformBalance)} BTC
            </BalanceDisplay>
          )}

          {/* Refresh Button */}
          <RefreshButton 
            onClick={handleRefresh} 
            disabled={isRefreshing || !isInitialized}
            title="Refresh balances"
          >
            {isRefreshing ? '🔄' : '🔄'}
          </RefreshButton>
        </BalanceContainer>
      )}

      {/* Disconnect Button */}
      <button
        onClick={onDisconnect}
        style={{
          background: isConnected ? 'rgba(255, 68, 68, 0.1)' : 'rgba(128, 128, 128, 0.1)',
          border: `1px solid ${isConnected ? '#ff4444' : 'var(--border)'}`,
          color: isConnected ? '#ff4444' : 'var(--text-dim)',
          padding: '0.25rem 0.5rem',
          borderRadius: '12px',
          fontSize: '0.65rem',
          cursor: 'pointer'
        }}
      >
        {isConnected ? 'Disconnect' : 'Reconnect'}
      </button>
    </Header>
  );
};
