import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthProvider';
import { useCanister } from '../contexts/CanisterProvider';
import { useBalance } from '../contexts/BalanceProvider';
import { Tooltip } from './Tooltip';
import { bestOddsPredictor, TradeRecommendation } from '../services/BestOddsPredictor';

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

// ✅ FIX 3: CSV formatting utility
const formatNumberCSV = (num: number): string => {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// ✅ FIX 2: Scrollable form container
const TradeFormContainer = styled.div`
  position: relative;
`;

const TradeForm = styled.div`
  padding: 0.75rem; /* ✅ FIX: Reduced padding for tighter UI */
  display: flex;
  flex-direction: column;
  gap: 0.5rem; /* ✅ FIX: Reduced gap for tighter spacing */
  
  /* ✅ FIX 2: Enhanced scrolling support */
  max-height: none;
  overflow-y: auto;
  
  @media (max-height: 700px) {
    padding: 0.5rem; /* ✅ FIX: Further reduced padding on small screens */
    gap: 0.375rem; /* ✅ FIX: Further reduced gap on small screens */
  }
`;

const TradeFormOverlay = styled.div<{ isActive: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${props => props.isActive ? 'rgba(0, 0, 0, 0.1)' : 'transparent'};
  pointer-events: ${props => props.isActive ? 'auto' : 'none'};
  z-index: 200;
  transition: all 0.2s ease;
  border-radius: 8px;
  backdrop-filter: none; /* ✅ FIXED: Remove blur for clean appearance */
  display: ${props => props.isActive ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
`;

const StatusMessage = styled.div`
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  text-align: center;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  small {
    display: block;
    margin-top: 0.5rem;
    opacity: 0.8;
    font-weight: 400;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.375rem; /* ✅ FIX: Reduced gap for tighter spacing */
`;

const StrikeButtonGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem; /* ✅ FIX: Reduced gap for tighter spacing */
`;

const StrikeButton = styled.button<{ active: boolean; disabled?: boolean }>`
  padding: 0.625rem 0.875rem; /* ✅ FIX: Reduced padding for tighter UI */
  border: ${(props: { active: boolean; disabled?: boolean }) => {
    if (props.disabled) return '2px solid rgba(128, 128, 128, 0.5)';
    return props.active ? '2px solid #ffffff' : '2px solid transparent';
  }};
  background: #8a2be2;
  color: #ffffff;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  box-shadow: none;
  backdrop-filter: none;
  transform: none;

  &:hover {
    background: ${(props: { active: boolean; disabled?: boolean }) => {
      if (props.disabled) return 'rgba(128, 128, 128, 0.3)';
      return '#9d3ce8';
    }};
    transform: none;
    box-shadow: none;
  }

  &:active {
    transform: ${props => props.disabled ? 'none' : 'translateY(2px)'};
    box-shadow: ${props => props.disabled 
      ? 'inset 0 2px 4px rgba(0, 0, 0, 0.3)' 
      : 'inset 0 2px 4px rgba(0, 0, 0, 0.4)'
    };
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ExpiryButtonGroup = styled.div`
  display: flex;
  gap: 0.375rem; /* ✅ FIX: Reduced gap for tighter spacing */
`;

const ExpiryButton = styled.button<{ active: boolean; disabled?: boolean }>`
  flex: 1;
  padding: 0.625rem 0.875rem; /* ✅ FIX: Reduced padding for tighter UI */
  border: ${(props: { active: boolean; disabled?: boolean }) => {
    if (props.disabled) return '2px solid rgba(128, 128, 128, 0.5)';
    return props.active ? '2px solid #ffffff' : '2px solid transparent';
  }};
  background: #ffd700;
  color: #ffffff;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  box-shadow: none;
  backdrop-filter: none;
  transform: none;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);

  &:hover {
    background: ${(props: { active: boolean; disabled?: boolean }) => {
      if (props.disabled) return 'rgba(128, 128, 128, 0.3)';
      return '#ffed4e';
    }};
    transform: none;
    box-shadow: none;
  }

  &:active {
    transform: ${props => props.disabled ? 'none' : 'translateY(2px)'};
    box-shadow: ${props => props.disabled 
      ? 'inset 0 2px 4px rgba(0, 0, 0, 0.3)' 
      : 'inset 0 2px 4px rgba(0, 0, 0, 0.4)'
    };
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    color: #666666;
  }
`;

const OptionButton = styled.button<{ active: boolean; variant: 'call' | 'put'; disabled?: boolean }>`
  flex: 1;
  padding: 0.625rem 0.875rem; /* ✅ FIX: Reduced padding for tighter UI */
  border: ${(props: { active: boolean; disabled?: boolean }) => {
    if (props.disabled) return '2px solid rgba(128, 128, 128, 0.5)';
    return props.active ? '2px solid #ffffff' : '2px solid transparent';
  }};
  background: ${(props: { active: boolean; variant: 'call' | 'put'; disabled?: boolean }) => {
    if (props.disabled) return 'rgba(128, 128, 128, 0.3)';
    return props.variant === 'call' ? '#00aa33' : '#ff4444';
  }};
  color: #ffffff;
  border-radius: 8px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  font-weight: 700;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  box-shadow: none;
  backdrop-filter: none;
  transform: none;

  &:hover {
    background: ${(props: { active: boolean; variant: 'call' | 'put'; disabled?: boolean }) => {
      if (props.disabled) return 'rgba(128, 128, 128, 0.3)';
      return props.variant === 'call' ? '#00cc44' : '#ff6666';
    }};
    transform: none;
    box-shadow: none;
  }

  &:active {
    transform: ${props => props.disabled ? 'none' : 'translateY(2px)'};
    box-shadow: ${props => props.disabled 
      ? 'inset 0 2px 4px rgba(0, 0, 0, 0.3)' 
      : 'inset 0 2px 4px rgba(0, 0, 0, 0.4)'
    };
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem; /* ✅ FIX: Reduced gap for tighter spacing */
  margin-top: 8px; /* ✅ ADD: Slight padding between sections */
`;

const LabelWithTooltip = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-dim);
`;

const Input = styled.input`
  padding: 0.75rem; /* ✅ FIX: Reduced padding for tighter UI */
  background: var(--bg-primary);
  border: 2px solid var(--border);
  color: var(--text);
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--accent);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SummaryBox = styled.div`
  background: var(--bg-primary);
  border: 2px solid var(--border);
  border-radius: 8px;
  padding: 0.875rem; /* ✅ FIX: Reduced padding for tighter UI */
  margin-top: 0.375rem; /* ✅ FIX: Reduced margin for tighter spacing */
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.375rem; /* ✅ FIX: Reduced margin for tighter spacing */
  font-size: 0.875rem;

  &:last-child {
    margin-bottom: 0;
    font-weight: 600;
    padding-top: 0.375rem; /* ✅ FIX: Reduced padding for tighter spacing */
    border-top: 1px solid var(--border);
  }
`;

const TradeButton = styled.button<{ disabled: boolean; isTradeInProgress?: boolean }>`
  padding: 1rem; /* ✅ FIX: Reduced padding for tighter UI */
  background: ${(props: { disabled: boolean; isTradeInProgress?: boolean }) => {
    if (props.disabled) return 'rgba(128, 128, 128, 0.3)';
    if (props.isTradeInProgress) return 'rgba(128, 128, 128, 0.5)'; // Greyed when in progress
    return '#4682B4'; // Deeper shade of light blue
  }};
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1rem;
  cursor: ${(props: { disabled: boolean }) => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  box-shadow: ${(props: { disabled: boolean; isTradeInProgress?: boolean }) => {
    if (props.disabled) return 'inset 0 2px 4px rgba(0, 0, 0, 0.3)';
    return props.isTradeInProgress 
      ? 'inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)' 
      : '0 4px 8px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)';
  }};
  transform: none;

  &:hover {
    background: ${(props: { disabled: boolean; isTradeInProgress?: boolean }) => {
      if (props.disabled) return 'rgba(128, 128, 128, 0.3)';
      if (props.isTradeInProgress) return 'rgba(128, 128, 128, 0.6)'; // Slightly darker grey on hover when in progress
      return '#5A9FD4'; // Slightly darker deeper blue on hover
    }};
    transform: ${(props: { disabled: boolean; isTradeInProgress?: boolean }) => {
      if (props.disabled || props.isTradeInProgress) return 'none';
      return 'translateY(-1px)';
    }};
    box-shadow: ${props => props.disabled 
      ? 'inset 0 2px 4px rgba(0, 0, 0, 0.3)' 
      : '0 6px 12px rgba(0, 0, 0, 0.4), 0 3px 6px rgba(0, 0, 0, 0.3)'
    };
  }

  &:active {
    transform: ${(props: { disabled: boolean }) => props.disabled ? 'none' : 'translateY(2px)'};
    box-shadow: ${props => props.disabled 
      ? 'inset 0 2px 4px rgba(0, 0, 0, 0.3)' 
      : 'inset 0 2px 4px rgba(0, 0, 0, 0.4)'
    };
  }

  @media (max-width: 768px) {
    padding: 0.875rem;
    font-size: 0.95rem;
    margin-bottom: 1rem;
    position: sticky;
    bottom: 60px; /* ✅ FIX: Position above mobile footer (60px height) */
    z-index: 100;
    margin-bottom: 1.5rem; /* ✅ FIX: Extra spacing above footer */
    background: ${(props: { disabled: boolean; isTradeInProgress?: boolean }) => {
      if (props.disabled) return 'rgba(128, 128, 128, 0.3)';
      if (props.isTradeInProgress) return 'rgba(128, 128, 128, 0.5)';
      return '#4682B4';
    }};
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.3);
  }
`;

const BalanceWarning = styled.div`
  background: rgba(255, 68, 68, 0.1);
  border: 1px solid #ff4444;
  color: #ff4444;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  text-align: center;
  margin-bottom: 1rem;
  line-height: 1.4;
`;

const BalanceStatus = styled.div<{ status: 'sufficient' | 'insufficient' | 'low' | 'critical' }>`
  background: ${props => {
    switch (props.status) {
      case 'sufficient': return 'rgba(0, 170, 51, 0.1)';
      case 'low': return 'rgba(255, 165, 0, 0.1)';
      case 'critical': return 'rgba(255, 107, 107, 0.1)';
      case 'insufficient': return 'rgba(255, 68, 68, 0.1)';
      default: return 'rgba(139, 149, 161, 0.1)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.status) {
      case 'sufficient': return '#00aa33';
      case 'low': return '#ffa500';
      case 'critical': return '#ff6b6b';
      case 'insufficient': return '#ff4444';
      default: return '#8b95a1';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'sufficient': return '#00aa33';
      case 'low': return '#ffa500';
      case 'critical': return '#ff6b6b';
      case 'insufficient': return '#ff4444';
      default: return '#8b95a1';
    }
  }};
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.875rem;
  text-align: center;
  margin-bottom: 0.75rem;
`;

const PriceInfo = styled.div`
  font-size: 0.75rem;
  color: var(--text-dim);
  text-align: center;
  margin-top: 0.5rem;
`;

// ✅ BEST ODDS BUTTON
const BestOddsButton = styled.button`
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: linear-gradient(135deg, #218838, #1ea085);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
    transform: none;
  }
`;

// ✅ RECOMMENDATION MODAL
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  text-align: center;
  margin-bottom: 1rem;
`;

const ModalTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.2rem;
`;

const WinRateDisplay = styled.div<{ confidence: string }>`
  font-size: 2rem;
  font-weight: bold;
  color: ${props => 
    props.confidence === 'high' ? '#28a745' : 
    props.confidence === 'medium' ? '#ffc107' : '#dc3545'
  };
  text-align: center;
  margin: 1rem 0;
`;

const RecommendationDetails = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailLabel = styled.span`
  font-weight: 500;
  color: #666;
`;

const DetailValue = styled.span`
  font-weight: bold;
  color: #333;
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
`;

const ModalButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  
  ${props => props.variant === 'primary' ? `
    background: #007bff;
    color: white;
    
    &:hover {
      background: #0056b3;
    }
  ` : `
    background: #6c757d;
    color: white;
    
    &:hover {
      background: #545b62;
    }
  `}
`;

interface OptionsTradeFormProps {
  currentPrice: number;
  optionType?: 'call' | 'put' | null;
  strikeOffset?: number;
  isTradeActive?: boolean;
  isTradeInProgress?: boolean;
  onOptionTypeSelect?: (type: 'call' | 'put') => void;
  onStrikeOffsetSelect?: (offset: number) => void;
  onExpirySelect?: (expiry: string) => void;
  onTradeStart?: (contracts: number, overrideParams?: {
    optionType?: 'call' | 'put';
    strikeOffset?: number;
    expiry?: string;
  }) => Promise<void>;
  onTradeClose?: () => Promise<void>;
  isConnected?: boolean;
  activeTrade?: {
    id: string;
    entryPrice: number;
    strikeOffset: number;  // ✅ FIXED: Use strike offset instead of strike price
    startTime: number;
    expiry: string;
    type: 'call' | 'put';
    amount: number;
  } | null;
  entryPrice?: number | undefined;
  settlementResult?: {
    outcome: 'win' | 'loss' | 'tie';
    profit: number;
    payout: number;
  } | null;
  tradeCountdown?: number | undefined;
  isDemoMode?: boolean;
  tradeStatusMessage?: string | null;
  onConnectWallet?: () => void;
}

export const OptionsTradeForm: React.FC<OptionsTradeFormProps> = ({
  currentPrice,
  optionType,
  strikeOffset = 0,
  isTradeActive = false,
  isTradeInProgress = false,
  onOptionTypeSelect,
  onStrikeOffsetSelect,
  onExpirySelect,
  onTradeStart,
  onTradeClose: _onTradeClose,
  isConnected = false,
  activeTrade: _activeTrade,
  settlementResult: _settlementResult,
  tradeCountdown: _tradeCountdown,
  isDemoMode = false,
  onConnectWallet
}) => {
  const { user } = useAuth();
  const { tradingCanister } = useCanister();
  const { userBalance, validateTradeBalance, getBalanceInUSD, getBalanceStatus } = useBalance();

  const [localFormData, setLocalFormData] = useState({
    expiry: '',
    contracts: '1'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ✅ BEST ODDS STATE
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [currentRecommendation, setCurrentRecommendation] = useState<TradeRecommendation | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setLocalFormData({
      expiry: '',
      contracts: '1'
    });
  }, []);

  // ✅ UPDATE PRICE DATA FOR BEST ODDS ANALYSIS
  useEffect(() => {
    if (currentPrice > 0) {
      bestOddsPredictor.updatePrice(currentPrice);
    }
  }, [currentPrice]);

  const expiryOptions = [
    { value: '5s', label: '5s' },
    { value: '10s', label: '10s' },
    { value: '15s', label: '15s' }
  ];

  const strikeOffsets = [2.50, 5.00, 10.00, 15.00];

  // ✅ BACKEND PAYOUT TABLES - Updated for new strike ranges
  const PROFIT_TABLE = {
    '5s': { 2.5: 3.33, 5: 4.00, 10: 10.00, 15: 20.00 },
    '10s': { 2.5: 2.86, 5: 3.33, 10: 6.67, 15: 13.33 },
    '15s': { 2.5: 2.50, 5: 2.86, 10: 5.00, 15: 10.00 }
  };

  // BONUS_TABLE removed - no longer needed since net gain line was removed

  const calculateStrikePrice = (offset: number): number => {
    if (!optionType || !currentPrice) return 0;
    return optionType === 'call' ? currentPrice + offset : currentPrice - offset;
  };




  const handleOptionTypeSelect = (type: 'call' | 'put') => {
    onOptionTypeSelect?.(type);
  };

  const handleStrikeOffsetSelect = (offset: number) => {
    onStrikeOffsetSelect?.(offset);
  };

  const handleExpirySelect = (expiry: string) => {
    setLocalFormData(prev => ({ ...prev, expiry }));
    onExpirySelect?.(expiry);
  };

  const handleTradeStart = async () => {
    // Prevent any action if trade is in progress or already submitting
    if (isSubmitting || isTradeInProgress || !canTrade) {
      console.log('Cannot start trade: button disabled or trade in progress');
      return;
    }

    if (!optionType || !strikeOffset || !localFormData.expiry || !localFormData.contracts) {
      return;
    }

    // In demo mode, skip user and canister checks
    if (!isDemoMode) {
      if (!user || !tradingCanister) {
        return;
      }

      if (!isConnected) {
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const contracts = parseInt(localFormData.contracts);
      
      // ✅ DEBUG: Log the exact contract count being passed
      console.log('🔍 OptionsTradeForm: localFormData.contracts =', localFormData.contracts);
      console.log('🔍 OptionsTradeForm: parseInt result =', contracts);
      console.log('🔍 OptionsTradeForm: calling onTradeStart with contracts =', contracts);
      
      // ✅ FIXED: Only call parent's onTradeStart, no duplicate canister calls
      if (onTradeStart) {
        await onTradeStart(contracts);
        // Trade success will be handled by parent component
      } else {
        throw new Error('Trade start handler not available');
      }

    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      console.error('❌ Trade start failed:', errorMessage);
      // Error will be handled by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ BEST ODDS HANDLERS
  const handleBestOddsClick = async () => {
    setIsAnalyzing(true);
    try {
      const recommendation = bestOddsPredictor.getBestRecommendation();
      setCurrentRecommendation(recommendation);
      setShowRecommendation(true);
    } catch (error) {
      console.error('Best odds analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExecuteRecommendation = async () => {
    if (!currentRecommendation || !onTradeStart) {
      return;
    }

    console.log('🔍 Best Odds: Starting execution with recommendation:', currentRecommendation);

    // ✅ FIX: Pass recommendation data directly to handleTradeStart
    const overrideParams = {
      optionType: currentRecommendation.optionType,
      strikeOffset: currentRecommendation.strikeOffset,
      expiry: currentRecommendation.expiry
    };
    
    // Close modal
    setShowRecommendation(false);
    
    // Execute trade with 1 contract and override parameters
    const contractCount = 1;
    setIsSubmitting(true);
    try {
      await onTradeStart(contractCount, overrideParams);
    } catch (error) {
      console.error('Recommended trade failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseRecommendation = () => {
    setShowRecommendation(false);
    setCurrentRecommendation(null);
  };


  const isFormValid = !!(optionType && strikeOffset > 0 && localFormData.expiry && localFormData.contracts);
  
  // ✅ NEW: Calculate trade validation
  const contractCount = parseInt(localFormData.contracts) || 0;
  const tradeValidation = isDemoMode ? { 
    isValid: true,
    valid: true, 
    requiredBalance: 0, 
    requiredAmount: 0,
    tradeCostUSD: 0, 
    tradeCostBTC: 0,
    error: undefined 
  } : validateTradeBalance(contractCount, currentPrice);
  
  const canTrade = isFormValid && 
    (isDemoMode || isConnected) && 
    !isSubmitting && 
    !isTradeInProgress &&
    (tradeValidation.isValid || tradeValidation.valid); // ✅ Check both properties for compatibility
  
  // Debug trade button state
  console.log('🔍 Trade button state:', {
    isFormValid,
    isDemoMode,
    isConnected,
    isSubmitting,
    isTradeInProgress,
    tradeValidationIsValid: tradeValidation.isValid,
    tradeValidationValid: tradeValidation.valid,
    canTrade,
    userBalance,
    contractCount,
    currentPrice
  });

  return (
    <TradeFormContainer>
      <TradeForm>

      {/* ✅ ZERO BALANCE WARNING */}
      {!isDemoMode && userBalance <= 0 && (
        <div style={{
          background: 'rgba(244, 208, 63, 0.1)',
          border: '2px solid var(--accent)',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ color: 'var(--accent)', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
            💰 No Balance Available
          </div>
          <div style={{ color: 'var(--text)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
            You need to deposit BTC to start trading
          </div>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            Tap "Wallet" in the menu below to deposit BTC
          </div>
        </div>
      )}

      <FormGroup>
        <LabelWithTooltip>
          <Tooltip content="Pick 'Put' if you think price will go down. 'Call' if you think price will go up." position="right">
            Option Type
          </Tooltip>
        </LabelWithTooltip>
        <ButtonGroup>
          <OptionButton
            type="button"
            active={optionType === 'call'}
            variant="call"
            onClick={() => handleOptionTypeSelect('call')}
          >
            CALL
          </OptionButton>
          <OptionButton
            type="button"
            active={optionType === 'put'}
            variant="put"
            onClick={() => handleOptionTypeSelect('put')}
          >
            PUT
          </OptionButton>
        </ButtonGroup>
      </FormGroup>

      <FormGroup>
        <LabelWithTooltip>
          <Tooltip content="Choose how far from current price your option will activate. Higher strike = higher reward but lower chance." position="right">
            Strike Price
          </Tooltip>
        </LabelWithTooltip>
        <StrikeButtonGroup>
          {strikeOffsets.map(offset => {
            const strikePx = calculateStrikePrice(offset);
            const isActive = strikeOffset === offset;
            
            return (
              <StrikeButton
                key={offset}
                type="button"
                active={isActive}
                disabled={!optionType}
                onClick={() => handleStrikeOffsetSelect(offset)}
              >
                <div>{optionType === 'call' ? `+$${offset.toFixed(2)}` : `-$${offset.toFixed(2)}`}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                  {/* ✅ FIX 3: Consistent CSV formatting */}
                  ${formatNumberCSV(strikePx)}
                </div>
              </StrikeButton>
            );
          })}
        </StrikeButtonGroup>
      </FormGroup>

      <FormGroup>
        <LabelWithTooltip>
          <Tooltip content="How long your option lasts before expiring. Shorter expiry = higher reward but less time to win." position="right">
            Expiry
          </Tooltip>
        </LabelWithTooltip>
        <ExpiryButtonGroup>
          {expiryOptions.map(expiry => (
            <ExpiryButton
              key={expiry.value}
              type="button"
              active={localFormData.expiry === expiry.value}
              onClick={() => handleExpirySelect(expiry.value)}
            >
              {expiry.label}
            </ExpiryButton>
          ))}
        </ExpiryButtonGroup>
      </FormGroup>

      <FormGroup>
        <LabelWithTooltip>
          <Tooltip content="Number of contracts to trade. Each contract costs $1 USD. More contracts = higher potential profit/loss." position="right">
            Contracts
          </Tooltip>
        </LabelWithTooltip>
        <Input
          type="number"
          value={localFormData.contracts}
          onChange={e => setLocalFormData(prev => ({ ...prev, contracts: e.target.value }))}
          placeholder="1"
          min="1"
          max="10"
          step="1"
          // ✅ OPTIMIZED: Removed disabled logic - overlay handles interaction blocking
        />
      </FormGroup>

      {isFormValid && (
        <SummaryBox>
          <SummaryRow>
            <span>Option Type:</span>
            <span style={{ color: optionType === 'call' ? '#00aa33' : '#ff4444' }}>
              {optionType?.toUpperCase()}
            </span>
          </SummaryRow>
          <SummaryRow>
            <span>Strike Price:</span>
            <span>${formatNumberCSV(
              isTradeActive && _activeTrade 
                ? calculateStrikePrice(_activeTrade.strikeOffset)  // ✅ FIXED: Calculate from strike offset
                : calculateStrikePrice(strikeOffset)  // Use live calculation when not active
            )}</span>
          </SummaryRow>
          <SummaryRow>
            <span>Expiry:</span>
            <span>{localFormData.expiry}</span>
          </SummaryRow>
          <SummaryRow>
            <span>Contracts:</span>
            <span>{formatNumberCSV(parseFloat(localFormData.contracts || '1'))}</span>
          </SummaryRow>
          <SummaryRow>
            <span>Cost:</span>
            <span style={{ color: '#ff4444' }}>
              ${formatNumberCSV(parseFloat(localFormData.contracts || '1') * 1)} USD
            </span>
          </SummaryRow>
          <SummaryRow>
            <span>Total Return:</span>
            <span style={{ color: '#00aa33' }}>
              {optionType && strikeOffset > 0 && localFormData.expiry ? 
                `$${formatNumberCSV((PROFIT_TABLE[localFormData.expiry as keyof typeof PROFIT_TABLE]?.[strikeOffset as keyof typeof PROFIT_TABLE['5s']] || 0) * parseFloat(localFormData.contracts || '1'))}` 
                : '-'
              }
            </span>
          </SummaryRow>
          {/* Net Gain line removed as requested */}
        </SummaryBox>
      )}

      {/* ✅ BEST ODDS BUTTON */}
      <BestOddsButton
        type="button"
        onClick={handleBestOddsClick}
        disabled={isAnalyzing || isSubmitting || isTradeInProgress}
      >
        {isAnalyzing ? (
          <>
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid transparent',
              borderTop: '2px solid currentColor',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            Analyzing...
          </>
        ) : (
          <>
            🎯 Best Odds
          </>
        )}
      </BestOddsButton>

      {/* ✅ NEW: Balance Status Display */}
      {!isDemoMode && userBalance > 0 && tradeValidation && tradeValidation.requiredBalance !== undefined && (
        <BalanceStatus status={getBalanceStatus(typeof tradeValidation.requiredBalance === 'number' ? tradeValidation.requiredBalance : (tradeValidation.requiredBalance as any)?.toNumber?.() || 0, currentPrice).status}>
          {getBalanceStatus(typeof tradeValidation.requiredBalance === 'number' ? tradeValidation.requiredBalance : (tradeValidation.requiredBalance as any)?.toNumber?.() || 0, currentPrice).message}
          <br />
          <small>Balance: {userBalance.toFixed(8)} BTC (${getBalanceInUSD(currentPrice).toFixed(2)} USD)</small>
        </BalanceStatus>
      )}

      {/* ✅ NEW: Balance Warning */}
      {!isDemoMode && tradeValidation && !tradeValidation.valid && tradeValidation.error && (
        <BalanceWarning>
          ⚠️ {tradeValidation.error}
          <br />
          <small>Current Balance: {userBalance.toFixed(8)} BTC (${getBalanceInUSD(currentPrice).toFixed(2)} USD)</small>
        </BalanceWarning>
      )}

      <TradeButton
        type="button"
        disabled={!canTrade}
        isTradeInProgress={isTradeInProgress}
        onClick={handleTradeStart}
      >
        {isSubmitting || isTradeInProgress ? (
          <>
            Starting Trade...
            <div style={{
              display: 'inline-block',
              width: '16px',
              height: '16px',
              border: '2px solid transparent',
              borderTop: '2px solid currentColor',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginLeft: '0.5rem'
            }} />
          </>
        ) : isTradeActive ? (
          'Trade Active'
        ) : (
          'Start Trade'
        )}
      </TradeButton>

      <PriceInfo>
        Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'} | 
        Trade Type: ⚡ Instant Execution
      </PriceInfo>
      </TradeForm>
      <TradeFormOverlay 
        isActive={isSubmitting || isTradeActive}
        onClick={() => {
          // Prevent interaction while showing status
        }}
      >
        {(isSubmitting || isTradeActive) && (
          <StatusMessage>
            {isTradeActive ? (
              <>
                ⚡ Trade in Progress
                <small>Please wait for completion</small>
              </>
            ) : (
              <>
                ⏳ Processing Trade
                <small>Please wait...</small>
              </>
            )}
          </StatusMessage>
        )}
      </TradeFormOverlay>

      {/* ✅ BEST ODDS RECOMMENDATION MODAL */}
      {showRecommendation && currentRecommendation && (
        <ModalOverlay onClick={handleCloseRecommendation}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>🎯 Best Odds Recommendation</ModalTitle>
            </ModalHeader>
            
            <WinRateDisplay confidence={currentRecommendation.confidence}>
              {(currentRecommendation.winRate * 100).toFixed(1)}% Win Rate
            </WinRateDisplay>
            
            <RecommendationDetails>
              <DetailRow>
                <DetailLabel>Option Type:</DetailLabel>
                <DetailValue>{currentRecommendation.optionType.toUpperCase()}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>Expiry:</DetailLabel>
                <DetailValue>{currentRecommendation.expiry}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>Strike Offset:</DetailLabel>
                <DetailValue>${currentRecommendation.strikeOffset.toFixed(2)}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>Confidence:</DetailLabel>
                <DetailValue style={{ 
                  color: currentRecommendation.confidence === 'high' ? '#28a745' : 
                         currentRecommendation.confidence === 'medium' ? '#ffc107' : '#dc3545'
                }}>
                  {currentRecommendation.confidence.toUpperCase()}
                </DetailValue>
              </DetailRow>
            </RecommendationDetails>
            
            <div style={{ 
              fontSize: '0.9rem', 
              color: '#666', 
              textAlign: 'center', 
              margin: '1rem 0',
              fontStyle: 'italic'
            }}>
              {currentRecommendation.reasoning}
            </div>
            
            <ModalButtons>
              <ModalButton variant="secondary" onClick={handleCloseRecommendation}>
                Cancel
              </ModalButton>
              <ModalButton variant="primary" onClick={handleExecuteRecommendation}>
                Trade Now
              </ModalButton>
            </ModalButtons>
          </ModalContent>
        </ModalOverlay>
      )}
    </TradeFormContainer>
  );
};

export default OptionsTradeForm;
