import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { useSynchronizedPrice } from '../hooks/useGlobalPriceFeed';
import { OptionsTradeForm } from './OptionsTradeForm';
import { PriceChart } from './PriceChart';
import { TimerDisplay } from './TimerDisplay';
import { SimpleTradeHistory } from './SimpleTradeHistory';
import { WalletConnection } from './WalletConnection';
import { OnboardingModal } from './OnboardingModal';
import { ErrorBoundary } from './ErrorBoundary';
import { useCanister } from '../contexts/CanisterProvider';
import { useBalance } from '../contexts/BalanceProvider';
// import { tradingService, TradeRequest } from '../services/tradingService'; // ✅ REMOVED: Using AtticusService instead
import { pricingEngine } from '../services/OffChainPricingEngine'; // ✅ NEW: Off-chain settlement
// import { useAuth } from '../hooks/useAuth'; // ✅ REMOVED: Using useUnifiedAuth
import { useAuth } from '../contexts/AuthProvider';
import { useOnboarding } from '../hooks/useOnboarding';

const TradingContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-primary);
  color: var(--text);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  overflow-y: auto; /* ✅ FIX: Allow vertical scrolling for whole app */
  overflow-x: hidden;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.375rem 1rem; /* ✅ FIX: Reduced padding for tighter UI */
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 1px 4px var(--shadow);
  min-height: 45px; /* ✅ FIX: Reduced height */
  flex-shrink: 0;
  position: sticky; /* ✅ FIX: Make header sticky for better navigation */
  top: 0;
  z-index: 1000; /* ✅ FIX: Ensure header stays above other content */

  @media (min-width: 768px) {
    padding: 0.5rem 1.5rem; /* ✅ FIX: Reduced desktop padding */
  }
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
    opacity: 0.9;
  }

  @media (min-width: 768px) {
    height: 45px;
    
    img {
      height: 36px;
      max-width: 180px;
    }
  }
`;

const Logo = styled.img`
  height: 2rem;
  width: auto;
  margin: 0;

  @media (max-width: 768px) {
    height: 1.75rem;
  }
`;

const DisconnectButton = styled.button<{ connected: boolean; isDemoMode?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.25rem; /* ✅ FIXED: Reduced gap */
  padding: 0.25rem 0.5rem; /* ✅ FIXED: Much smaller padding for mobile */
  background: ${props => {
    if (props.isDemoMode) return 'rgba(0, 212, 170, 0.1)'; // Green for demo
    return props.connected ? 'rgba(255, 68, 68, 0.1)' : 'rgba(128, 128, 128, 0.1)';
  }};
  border: 1px solid ${props => {
    if (props.isDemoMode) return '#00d4aa'; // Green border for demo
    return props.connected ? '#ff4444' : 'var(--border)';
  }};
  color: ${props => {
    if (props.isDemoMode) return '#00d4aa'; // Green text for demo
    return props.connected ? '#ff4444' : 'var(--text-dim)';
  }};
  border-radius: 12px; /* ✅ FIXED: Smaller border radius */
  font-size: 0.65rem; /* ✅ FIXED: Smaller font size */
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  /* ✅ FIXED: Mobile-specific sizing */
  @media (max-width: 480px) {
    padding: 0.2rem 0.4rem;
    font-size: 0.6rem;
    gap: 0.2rem;
  }

  &:before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => {
      if (props.isDemoMode) return '#00d4aa'; // Green dot for demo
      return props.connected ? '#ff4444' : '#666';
    }};
    animation: ${props => (props.connected || props.isDemoMode) ? 'pulse 2s infinite' : 'none'};
  }

  &:hover {
    background: ${props => {
      if (props.isDemoMode) return 'rgba(0, 212, 170, 0.2)'; // Green hover for demo
      return props.connected ? 'rgba(255, 68, 68, 0.2)' : 'rgba(128, 128, 128, 0.2)';
    }};
    transform: translateY(-1px);
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.7;
      transform: scale(1.1);
    }
  }
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
  overflow: visible; /* ✅ FIX: Allow content to flow naturally */
  flex-direction: column; /* ✅ FIX: Stack on mobile by default */
  padding-bottom: 60px; /* ✅ FIX: Add bottom padding for mobile footer */

  @media (min-width: 768px) {
    flex-direction: row; /* Side-by-side on desktop */
    padding-bottom: 0; /* Remove bottom padding on desktop */
  }
`;

const ChartSection = styled.div`
  flex-shrink: 0; /* ✅ FIX: Don't shrink on mobile */
  height: 450px;
  display: flex;
  flex-direction: column;
  padding: 0.25rem;
  margin-top: 0.5rem; /* ✅ FIX: Reduced margin to bring options section closer */
  position: relative;

  @media (min-width: 768px) {
    flex: 1; /* Take available space on desktop */
    height: auto;
    min-height: 400px;
    max-height: 500px; /* ✅ FIX: Prevent chart from expanding beyond this height */
    max-width: calc(100vw - 450px); /* ✅ FIX: Account for sidebar width (400px + padding) */
    padding: 0.5rem;
    margin-top: 1rem; /* Reduced desktop margin too */
    overflow: hidden; /* ✅ FIX: Prevent content overflow */
  }
`;

const TradingSidebar = styled.div`
  width: 100%; /* ✅ FIX: Full width on mobile */
  background: var(--bg-panel);
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  flex: 1; /* ✅ FIX: Take remaining space on mobile */
  min-height: 0;
  max-height: none;

  @media (min-width: 768px) {
    width: 400px; /* Fixed width on desktop */
    border-top: none;
    border-left: 1px solid var(--border);
    flex-shrink: 0; /* Don't shrink on desktop */
  }
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;

  @media (max-width: 767px) {
    display: none; /* Hide tabs on mobile - they'll be in footer */
  }
`;

const Tab = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 0.75rem; /* ✅ FIX: Reduced padding for tighter UI */
  background: ${props => props.active ? 'var(--bg-primary)' : 'transparent'};
  border: none;
  color: ${props => props.active ? 'var(--text)' : 'var(--text-dim)'};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background: var(--bg-primary);
    color: var(--text);
  }

  ${props => props.active && `
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--accent);
    }
  `}
`;

const TabContent = styled.div`
  flex: 1;
  overflow-y: auto;
  min-height: 0;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: var(--bg-primary);
  }

  &::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--accent);
  }
`;

const MobileFooter = styled.div`
  display: none; /* Hidden by default */
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: var(--bg-panel);
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;

  @media (max-width: 767px) {
    display: flex; /* Show on mobile */
  }
`;

const MobileTab = styled.button<{ active: boolean; disabled?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: ${props => props.disabled ? 'var(--text-dim)' : (props.active ? 'var(--accent)' : 'var(--text-dim)')};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  min-width: 60px;
  opacity: ${props => props.disabled ? 0.5 : 1};

  &:hover {
    color: ${props => props.disabled ? 'var(--text-dim)' : 'var(--text)'};
  }

  svg {
    width: 20px;
    height: 20px;
    margin-bottom: 0.25rem;
  }

  span {
    font-size: 0.75rem;
    font-weight: 500;
  }
`;

// Help Content Component
const HelpContainer = styled.div`
  padding: 1.5rem;
  color: var(--text);
`;

const HelpTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 1rem;
  text-align: center;
`;

const HelpList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem 0;
`;

const HelpItem = styled.li`
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border);
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--text);

  &:last-child {
    border-bottom: none;
  }

  &::before {
    content: '•';
    color: var(--accent);
    font-weight: bold;
    margin-right: 0.5rem;
  }
`;

const TelegramButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #0088cc, #006699);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;

  &:hover {
    background: linear-gradient(135deg, #006699, #004466);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 136, 204, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

const HelpContent: React.FC = () => {
  const handleTelegramClick = () => {
    // Open Telegram support link
    window.open('https://t.me/+xGLyFQ1-J1ljNDUx', '_blank');
  };

  return (
    <HelpContainer>
      <HelpTitle>How to Trade</HelpTitle>
      <HelpList>
        <HelpItem>Choose Call if you think price will go up</HelpItem>
        <HelpItem>Choose Put if you think price will go down</HelpItem>
        <HelpItem>Select strike price and expiry time</HelpItem>
        <HelpItem>Each contract costs $1 USD</HelpItem>
        <HelpItem>Trades settle automatically at expiry</HelpItem>
      </HelpList>
      <TelegramButton onClick={handleTelegramClick}>
        📱 Contact Support on Telegram
      </TelegramButton>
    </HelpContainer>
  );
};

interface TradingPanelProps {
  onLogout?: () => void;
  isDemoMode?: boolean;
  onConnectWallet?: () => void;
  shouldOpenHelp?: boolean;
  onHelpOpened?: () => void;
}

interface TradeData {
  id: string;
  positionId: number; // ✅ ADDED: Store actual backend position ID for settlement
  entryPrice: number;
  strikeOffset: number; // ✅ FIXED: Use strike offset instead of strike price
  startTime: number;
  expiry: string;
  type: 'call' | 'put';
  amount: number;
}

export const TradingPanel: React.FC<TradingPanelProps> = ({ onLogout, isDemoMode = false, onConnectWallet, shouldOpenHelp, onHelpOpened }) => {
  const { priceState, isConnected: priceConnected } = useSynchronizedPrice();
  const { isConnected: canisterConnected, atticusService, treasuryService } = useCanister();
  const { user } = useAuth();
  const { refreshBalance } = useBalance();
  const { showOnboarding, handleClose, handleDontShowAgain } = useOnboarding(isDemoMode);

  const [activeTab, setActiveTab] = useState<'trade' | 'positions' | 'wallet' | 'help'>('trade');
  const [optionType, setOptionType] = useState<'call' | 'put' | null>(null);
  const [strikeOffset, setStrikeOffset] = useState(0);
  const [selectedExpiry, setSelectedExpiry] = useState('5s');
  
  // ✅ OPTIMIZED TRADE STATE: Single consolidated state object
  const [tradeState, setTradeState] = useState<{
    isActive: boolean;
    isInProgress: boolean;
    data: TradeData | null;
    entryPrice: number | undefined;
    countdown: number;
    statusMessage: string | null;
    result: { message: string; type: 'success' | 'error' } | null;
    settlementResult: { outcome: 'win' | 'loss' | 'tie'; profit: number; payout: number } | null;
  }>({
    isActive: false,
    isInProgress: false,
    data: null,
    entryPrice: undefined,
    countdown: 0,
    statusMessage: null,
    result: null,
    settlementResult: null
  });

  // ✅ FIXED: Initialize trading service when canister is available (or in demo mode)
  useEffect(() => {
    if (isDemoMode) {
      console.log('🎮 Demo mode: Using demo trading service');
    } else if (atticusService) {
      console.log('✅ Atticus service available:', atticusService);
    }
  }, [atticusService, isDemoMode]);

  useEffect(() => {
    setOptionType(null);
    setStrikeOffset(0);
    setTradeState(prev => ({
      ...prev,
      isActive: false,
      entryPrice: undefined
    }));
  }, []);

  // Handle opening help tab from popup
  useEffect(() => {
    if (shouldOpenHelp) {
      setActiveTab('help');
      onHelpOpened?.();
    }
  }, [shouldOpenHelp, onHelpOpened]);

  // ✅ FIXED: Use refs to store current values and prevent stale closures
  const tradeStateRef = useRef(tradeState);
  const priceStateRef = useRef(priceState);
  
  // Update refs when values change
  tradeStateRef.current = tradeState;
  priceStateRef.current = priceState;

  const handleAutoSettlement = useCallback(async () => {
    const currentTradeData = tradeStateRef.current.data;
    const currentPrice = priceStateRef.current.current;
    
    if (!currentTradeData) {
      console.log('⚠️ No active trade to settle');
      return;
    }

    console.log('🔄 Auto-settling trade:', currentTradeData.id, 'at price:', currentPrice);

    try {
      // ✅ FIXED: Use actual position ID from backend instead of custom trade ID
      // The backend stores positions with numeric IDs, so we use the positionId directly
      const positionId = currentTradeData.positionId;
      console.log('🔄 Calling settlement with positionId:', positionId);
      console.log('🔄 Trade details:', {
        positionId: currentTradeData.positionId,
        type: currentTradeData.type,
        strikeOffset: currentTradeData.strikeOffset,
        expiry: currentTradeData.expiry,
        amount: currentTradeData.amount,
        entryPrice: currentTradeData.entryPrice
      });
      
      // ✅ SIMPLIFIED: Backend gets final price from price oracle, not frontend
      // ✅ DEMO: Pass trade data for realistic demo outcomes
      console.log('🎮 Demo settlement - passing trade data:', {
        optionType: currentTradeData.type,
        strikeOffset: currentTradeData.strikeOffset,
        finalPrice: currentPrice,
        isCall: currentTradeData.type === 'call'
      });
      
      // ✅ NEW: Use off-chain settlement (fast, accurate, uniform)
      const result = await pricingEngine.calculateSettlement(
        currentTradeData.type,
        currentTradeData.strikeOffset,
        currentTradeData.expiry,
        currentPrice,
        currentTradeData.entryPrice,
        currentTradeData.amount // ✅ FIXED: Pass contract count
      );
      
      // ✅ RECORD: Send result to backend for storage only
      try {
        await pricingEngine.recordSettlement(
          positionId,
          result,
          atticusService,
          user?.principal.toString() // Pass user principal
        );
        console.log('✅ Settlement recorded to backend');
      } catch (error) {
        console.error('❌ Failed to record settlement:', error);
        // Continue with UI update even if backend recording fails
      }

      console.log('✅ Settlement result:', result);
      console.log('🔍 Toast calculation - result.profit:', result.profit);
      console.log('🔍 Toast calculation - result.outcome:', result.outcome);

      // ✅ OPTIMIZED: Single state update for settlement result
      setTradeState(prev => ({
        ...prev,
        settlementResult: {
          outcome: result.outcome,
          profit: result.profit || 0,
          payout: result.payout || 0
        },
        result: {
          message: result.outcome === 'win' 
            ? `WIN! +$${(result.profit || 0).toFixed(2)}` 
            : `LOSS -$${Math.abs(result.profit || 0).toFixed(2)}`,
          type: result.outcome === 'win' ? 'success' : 'error'
        }
      }));
      
      console.log('🔍 Final toast message:', result.outcome === 'win' 
        ? `WIN! +$${(result.profit || 0).toFixed(2)}` 
        : `LOSS -$${Math.abs(result.profit || 0).toFixed(2)}`);

      // Auto-clear trade result after 3 seconds using requestAnimationFrame
      const clearResult = () => {
        setTradeState(prev => ({ ...prev, result: null }));
      };
      requestAnimationFrame(() => {
        setTimeout(clearResult, 3000);
      });

      // ✅ FIXED: Trade cleanup without clearing result (let timeout handle it)
      setTradeState(prev => ({
        ...prev,
        isActive: false,
        isInProgress: false,
        data: null,
        entryPrice: undefined,
        countdown: 0,
        statusMessage: null,
        settlementResult: null
        // ✅ KEEP: result stays visible until timeout clears it
      }));
      
      // Reset form state
      setOptionType(null);
      setStrikeOffset(0);

      // ✅ NEW: Refresh balance after settlement with delay
      if (!isDemoMode) {
        try {
          console.log('🔄 Attempting to refresh balance after settlement...');
          // Add small delay to ensure backend has processed the settlement
          setTimeout(async () => {
            try {
              await refreshBalance();
              console.log('✅ Balance refreshed after settlement (delayed)');
            } catch (error) {
              console.warn('⚠️ Failed to refresh balance after settlement (delayed):', error);
            }
          }, 1000); // 1 second delay
          
          // Also try immediate refresh
          await refreshBalance();
          console.log('✅ Balance refreshed after settlement (immediate)');
        } catch (error) {
          console.warn('⚠️ Failed to refresh balance after settlement:', error);
        }
      }

      if (result.outcome === 'win') {
        console.log(`🎉 WIN! Profit: $${result.profit?.toFixed(2)}`);
      } else if (result.outcome === 'loss') {
        console.log(`💸 LOSS: -$${Math.abs(result.profit || 0).toFixed(2)}`);
      } else {
        console.log(`🔄 TIE: Refunded $${result.payout?.toFixed(2)}`);
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Auto-settlement failed:', errorMessage);

      // ✅ CRITICAL: Always clean up trade state even if settlement fails
      setTradeState({
        isActive: false,
        isInProgress: false,
        data: null,
        entryPrice: undefined,
        countdown: 0,
        statusMessage: null,
        result: null,
        settlementResult: null
      });
      setOptionType(null);
      setStrikeOffset(0);
      
      // Error will be handled by settlement result state
    }
  }, []); // ✅ FIXED: Remove dependencies to prevent timer resets

  // ✅ REMOVED: Timer logic moved to separate TimerDisplay component to prevent re-renders

  // ✅ REMOVED: No need to update countdown state - it's calculated on demand

  // ✅ REMOVED: useMemo to prevent unnecessary re-renders - use priceState directly

  const handleOptionTypeSelect = (type: 'call' | 'put') => {
    setOptionType(type);
    // ✅ OPTIMIZED: Removed unnecessary trade state reset to prevent re-renders
  };

  const handleStrikeOffsetSelect = (offset: number) => {
    setStrikeOffset(offset);
    // ✅ OPTIMIZED: Removed unnecessary trade state reset to prevent re-renders
  };

  const handleExpirySelect = (expiry: string) => {
    console.log('🕐 Expiry selected:', expiry);
    setSelectedExpiry(expiry);
    // ✅ OPTIMIZED: Removed unnecessary trade state reset to prevent re-renders
  };

  // ✅ COMPLETELY FIXED: Use trading service instead of direct canister calls
  const handleTradeStart = async (contracts: number, overrideParams?: {
    optionType?: 'call' | 'put';
    strikeOffset?: number;
    expiry?: string;
  }) => {
    // ✅ DEBUG: Log what TradingPanel receives
    console.log('🔍 TradingPanel: handleTradeStart called with contracts =', contracts);
    console.log('🔍 TradingPanel: typeof contracts =', typeof contracts);
    console.log('🔍 TradingPanel: overrideParams =', overrideParams);
    
    // ✅ FIX: Use override params if provided, otherwise use state
    const finalOptionType = overrideParams?.optionType || optionType;
    const finalStrikeOffset = overrideParams?.strikeOffset || strikeOffset;
    const finalExpiry = overrideParams?.expiry || selectedExpiry;

    // ✅ DEBUG: Log final parameters for verification
    console.log('🎯 TradingPanel Final Params:', {
      overrideParams,
      finalOptionType,
      finalStrikeOffset,
      finalExpiry,
      stateOptionType: optionType,
      stateStrikeOffset: strikeOffset,
      stateExpiry: selectedExpiry
    });
    
    if (!priceState.isValid || !finalOptionType) {
      console.error('Cannot start trade: missing price data or option type', {
        priceStateIsValid: priceState.isValid,
        finalOptionType: finalOptionType,
        optionType: optionType,
        overrideParams: overrideParams,
        priceState: priceState
      });
      return;
    }

    if (tradeState.isInProgress) {
      console.log('Trade already in progress, ignoring request');
      return;
    }

    // ✅ CRITICAL: Capture price at the exact moment trade starts for perfect synchronization
    const tradeStartPrice = priceState.current;
    console.log('🎯 Trade started at price:', tradeStartPrice);

    try {
      setTradeState(prev => ({
        ...prev,
        isInProgress: true,
        statusMessage: 'Preparing trade...'
      }));
      
      // ✅ FIXED: Check if we have the necessary services (skip in demo mode)
      if (!isDemoMode && !atticusService) {
        console.error('Atticus service not available');
        setTradeState(prev => ({
          ...prev,
          isInProgress: false,
          statusMessage: 'Trading service not available'
        }));
        return;
      }

      if (!isDemoMode && !user) {
        console.error('User not authenticated');
        return;
      }

      // ✅ SINGLE CALCULATION: Calculate once and reuse
      const strikePrice = finalOptionType === 'call'
        ? tradeStartPrice + finalStrikeOffset
        : tradeStartPrice - finalStrikeOffset;

      console.log('🎯 Strike price calculation:', {
        tradeStartPrice,
        finalStrikeOffset,
        finalOptionType,
        calculatedStrikePrice: strikePrice
      });

      // ✅ FIXED: 1 contract = 1 USD worth of BTC, not 1 BTC

      const tradeRequest: TradeRequest = {
        optionType: finalOptionType,
        strikeOffset: finalStrikeOffset, // ✅ FIXED: Use strike offset instead of strike price
        expiry: finalExpiry,  // ✅ Use final expiry
        size: contracts  // ✅ FIXED: Pass actual contract count (1, 2, 3, etc.)
      };

      console.log('🕐 Trade request with expiry:', finalExpiry);

      console.log('🔍 Debug - Calling pricingEngine.placeTrade with:', {
        userPrincipal: isDemoMode ? 'demo-user' : user?.principal.toString(),
        userObject: user,
        userPrincipalFromUser: user?.principal?.toString(),
        tradeRequest,
        isDemoMode
      });

      // ✅ ASYNC TRADE PROCESSING: Run trade in parallel with price updates
      console.log('🚀 Starting async trade processing...');
      setTradeState(prev => ({ ...prev, statusMessage: 'Executing trade...' }));
      
      // ✅ NEW: Use off-chain trade placement (faster, more accurate)
      const tradePromise = pricingEngine.placeTrade(
        isDemoMode ? 'demo-user' : user!.principal.toString(),
        finalOptionType,
        finalStrikeOffset,
        finalExpiry,
        contracts,
        atticusService,
        isDemoMode
      );
      
      // Run trade in parallel with price monitoring
      const [tradeResult] = await Promise.allSettled([tradePromise]);
      
      if (tradeResult.status === 'rejected') {
        throw new Error(tradeResult.reason?.message || 'Trade execution failed');
      }
      
      const result = tradeResult.value;

      if (!result.success) {
        throw new Error(result.error || 'Trade execution failed');
      }

      const orderId = result.positionId;

      // ✅ FIXED: Capture real entry price for accurate off-chain calculations
      const tradeData: TradeData = {
        id: orderId.toString(),
        positionId: orderId, // ✅ ADDED: Store actual backend position ID
        entryPrice: tradeStartPrice, // ✅ FIXED: Use actual captured price, not 0!
        strikeOffset: finalStrikeOffset, // ✅ FIXED: Use strike offset instead of strike price
        startTime: Date.now(),
        expiry: finalExpiry,  // ✅ Use final expiry
        type: finalOptionType,
        amount: contracts
      };

      // ✅ DEBUG: Log trade data creation for verification
      console.log('🎯 Trade Data Created:', {
        tradeData,
        finalOptionType,
        finalStrikeOffset,
        finalExpiry,
        strikePrice: finalOptionType === 'call' ? tradeStartPrice + finalStrikeOffset : tradeStartPrice - finalStrikeOffset
      });

      // ✅ OPTIMIZED: Single state update with captured price for perfect synchronization
      setTradeState({
        isActive: true,
        isInProgress: false,
        data: tradeData,
        entryPrice: tradeStartPrice, // ✅ PERFECT SYNC: Entry line shows captured BTC price at trade start
        countdown: 0,
        statusMessage: 'Trade successful!',
        result: {
          message: `Trade started: ${finalOptionType.toUpperCase()}`,
          type: 'success'
        },
        settlementResult: null
      });

      // Clear status message after 3 seconds using requestAnimationFrame
      const clearStatus = () => {
        setTradeState(prev => ({ ...prev, statusMessage: null }));
      };
      requestAnimationFrame(() => {
        setTimeout(clearStatus, 3000);
      });

      // ✅ REMOVED: Balance refresh during trade to prevent oscillation
      // Balance will be refreshed after trade completion

      // Auto-clear trade start message after 2 seconds using requestAnimationFrame
      const clearStartMessage = () => {
        setTradeState(prev => ({ ...prev, result: null }));
      };
      requestAnimationFrame(() => {
        setTimeout(clearStartMessage, 2000);
      });

      // Auto-scroll to show chart on mobile
      if (window.innerWidth <= 767) {
        // ✅ FIX: Scroll to chart section to make it visible after trade
        const chartSection = document.querySelector('[data-chart-section]');
        if (chartSection) {
          chartSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          // Fallback: scroll to show chart area (header height + some padding)
          window.scrollTo({ top: 100, behavior: 'smooth' });
        }
      }

      console.log('🚀 Trade started via trading service! Order ID:', orderId);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Failed to start trade:', errorMessage);
      
      // ✅ CRITICAL: Always reset trade state on error
      setTradeState({
        isActive: false,
        isInProgress: false,
        data: null,
        entryPrice: undefined,
        countdown: 0,
        statusMessage: `Trade failed: ${errorMessage}`,
        result: null,
        settlementResult: null
      });
      
      // Clear status message after 5 seconds using requestAnimationFrame
      const clearErrorStatus = () => {
        setTradeState(prev => ({ ...prev, statusMessage: null }));
      };
      requestAnimationFrame(() => {
        setTimeout(clearErrorStatus, 5000);
      });
    }
  };

  const handleTradeClose = async () => {
    try {
      console.log('🔄 Manually closing trade...');
      
      // ✅ COMPLETE: Reset all trade-related state
      setTradeState({
        isActive: false,
        isInProgress: false,
        data: null,
        entryPrice: undefined,
        countdown: 0,
        statusMessage: null,
        result: null,
        settlementResult: null
      });
      setOptionType(null);
      setStrikeOffset(0);
      
      console.log('✅ Trade manually closed and state reset');
    } catch (error) {
      console.error('❌ Failed to close trade:', error);
    }
  };

  const handleDisconnectClick = () => {
    if (isDemoMode) {
      // ✅ FIX: In demo mode, go back to landing page by logging out
      onLogout?.();
    } else if (isFullyConnected) {
      if (tradeState.isActive) {
        handleTradeClose();
      }
      onLogout?.();
    } else if (onConnectWallet) {
      // If not connected, try to connect
      onConnectWallet();
    }
  };

  const isFullyConnected = isDemoMode ? true : (priceConnected && canisterConnected);

  // ✅ FIXED: Use actual trade data when trade is active, otherwise use state
  const chartProps = {
    priceData: priceState,
    isConnected: priceConnected,
    optionType: tradeState.isActive && tradeState.data ? tradeState.data.type : optionType,
    strikeOffset: tradeState.isActive && tradeState.data ? tradeState.data.strikeOffset : strikeOffset,
    isTradeActive: tradeState.isActive,
    ...(tradeState.entryPrice !== undefined && { entryPrice: tradeState.entryPrice })
  };

  // ✅ DEBUG: Log chart props to track data flow
  console.log('🎯 Chart Props Debug:', {
    optionType: chartProps.optionType,
    strikeOffset: chartProps.strikeOffset,
    isTradeActive: chartProps.isTradeActive,
    tradeData: tradeState.data,
    stateOptionType: optionType,
    stateStrikeOffset: strikeOffset
  });

  // ✅ REMOVED: Unused activeTradeData variable that was causing build error

  const { userBalance } = useBalance();

  return (
    <TradingContainer>
      <Header>
        <LogoContainer>
          <Logo src="/images/attiminlogo.png" alt="Atticus" />
        </LogoContainer>
        {!isDemoMode && (
          <div style={{
            padding: '0.15rem 0.3rem', /* ✅ FIXED: Smaller padding */
            background: userBalance > 0 ? 'rgba(0, 212, 170, 0.15)' : 'rgba(255, 71, 87, 0.15)',
            border: `1px solid ${userBalance > 0 ? 'var(--green)' : 'var(--red)'}`,
            borderRadius: '3px', /* ✅ FIXED: Smaller border radius */
            fontSize: '0.6rem', /* ✅ FIXED: Smaller font size */
            fontWeight: '600',
            color: userBalance > 0 ? 'var(--green)' : 'var(--red)',
            whiteSpace: 'nowrap',
            marginRight: '0.5rem' /* ✅ FIXED: Add margin to prevent overlap */
          }}>
            {userBalance > 0 ? userBalance.toFixed(6) : '0'} BTC {/* ✅ FIXED: 6 decimals for more precision */}
          </div>
        )}
        <DisconnectButton
          connected={isFullyConnected}
          isDemoMode={isDemoMode}
          onClick={handleDisconnectClick}
        >
          {isDemoMode ? 'Connect' : (isFullyConnected ? 'Disconnect' : 'Reconnect')}
        </DisconnectButton>
      </Header>

      <MainContent>
        <ChartSection data-chart-section>
          <ErrorBoundary fallback={<div>Chart temporarily unavailable</div>}>
            <PriceChart {...chartProps} />
          </ErrorBoundary>
          
          {/* ✅ FIXED: Timer moved outside chart to prevent re-renders */}
          <TimerDisplay 
            isActive={tradeState.isActive} 
            expiry={selectedExpiry} 
            onExpiry={handleAutoSettlement} 
          />
        </ChartSection>


        {/* Trade Status Container - Between Chart and Options */}
        {tradeState.result && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '0.75rem 1rem',
            margin: '0.5rem 0',
            background: tradeState.result.type === 'success' ? '#00aa33' : '#ff4444',
            color: 'white',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            textAlign: 'center',
            minHeight: '2.5rem'
          }}>
            {tradeState.result.message}
          </div>
        )}

        <TradingSidebar>
          <TabContainer>
            <Tab
              active={activeTab === 'trade'}
              onClick={() => setActiveTab('trade')}
            >
              Trade
            </Tab>
            <Tab
              active={activeTab === 'positions'}
              onClick={() => setActiveTab('positions')}
            >
              History
            </Tab>
            <Tab
              active={activeTab === 'wallet'}
              onClick={() => setActiveTab('wallet')}
            >
              Wallet
            </Tab>
            <Tab
              active={activeTab === 'help'}
              onClick={() => setActiveTab('help')}
            >
              Help
            </Tab>
          </TabContainer>

          <TabContent>
            {activeTab === 'trade' && (
              <ErrorBoundary fallback={<div>Trading form unavailable</div>}>
                <OptionsTradeForm
                  currentPrice={priceState.current}
                  optionType={optionType}
                  strikeOffset={strikeOffset}
                  isTradeActive={tradeState.isActive}
                  isTradeInProgress={tradeState.isInProgress}
                  onOptionTypeSelect={handleOptionTypeSelect}
                  onStrikeOffsetSelect={handleStrikeOffsetSelect}
                  onExpirySelect={handleExpirySelect}
                  onTradeStart={handleTradeStart}
                  onTradeClose={handleTradeClose}
                  isConnected={isFullyConnected}
                  activeTrade={tradeState.data}
                  entryPrice={tradeState.entryPrice}
                  settlementResult={tradeState.settlementResult}
                  isDemoMode={isDemoMode}
                  tradeStatusMessage={tradeState.statusMessage}
                  onConnectWallet={onConnectWallet}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'positions' && (
              <ErrorBoundary fallback={<div>Trade history unavailable</div>}>
                <SimpleTradeHistory />
              </ErrorBoundary>
            )}

            {activeTab === 'wallet' && (
              <ErrorBoundary fallback={<div>Wallet unavailable</div>}>
                <WalletConnection />
              </ErrorBoundary>
            )}

            {activeTab === 'help' && (
              <ErrorBoundary fallback={<div>Help unavailable</div>}>
                <HelpContent />
              </ErrorBoundary>
            )}
          </TabContent>
        </TradingSidebar>
      </MainContent>

      {/* Mobile Footer */}
      <MobileFooter>
        <MobileTab
          active={activeTab === 'trade'}
          onClick={() => setActiveTab('trade')}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span>Trade</span>
        </MobileTab>
        <MobileTab
          active={activeTab === 'positions'}
          disabled={isDemoMode}
          onClick={() => !isDemoMode && setActiveTab('positions')}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
          <span>History</span>
        </MobileTab>
        <MobileTab
          active={activeTab === 'wallet'}
          disabled={isDemoMode}
          onClick={() => {
            console.log('🔍 Wallet tab clicked:', { isDemoMode, user: !!user });
            if (!isDemoMode) {
              setActiveTab('wallet');
            }
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
          </svg>
          <span>Wallet</span>
        </MobileTab>
        <MobileTab
          active={activeTab === 'help'}
          onClick={() => setActiveTab('help')}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
          </svg>
          <span>Help</span>
        </MobileTab>
      </MobileFooter>

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={handleClose}
        onDontShowAgain={handleDontShowAgain}
      />
    </TradingContainer>
  );
};

export default TradingPanel;
