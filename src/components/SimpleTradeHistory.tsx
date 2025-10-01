import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Principal } from '@dfinity/principal';
import { useCanister } from '../contexts/CanisterProvider';
import { useUnifiedAuth } from '../hooks/useUnifiedAuth';
import { atticusService } from '../services/AtticusService';

// ✅ SIMPLE TRADE HISTORY - Clean and straightforward
interface SimpleTrade {
  id: string;
  type: 'call' | 'put';
  strike: number;
  entryPrice: number;
  expiry: string;
  size: number;
  entryPremium: number;
  pnl: number;
  openedAt: number;
  settledAt: number | null;
  settlementPrice: number | undefined;
  status: string;
}

const Container = styled.div`
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 1rem 0;
`;

const Title = styled.h3`
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.2rem;
`;

const TradeItem = styled.div`
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TradeInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const TradeType = styled.span<{ type: 'call' | 'put' }>`
  font-weight: bold;
  color: ${props => props.type === 'call' ? '#28a745' : '#dc3545'};
`;

const TradeDetails = styled.div`
  font-size: 0.9rem;
  color: #666;
`;

const PnL = styled.span<{ positive: boolean }>`
  font-weight: bold;
  color: ${props => props.positive ? '#28a745' : '#dc3545'};
`;

const Status = styled.span<{ status: string }>`
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  background: ${props => 
    props.status === 'Settled' ? '#d4edda' : 
    props.status === 'Active' ? '#fff3cd' : '#f8d7da'
  };
  color: ${props => 
    props.status === 'Settled' ? '#155724' : 
    props.status === 'Active' ? '#856404' : '#721c24'
  };
`;

const LoadingText = styled.div`
  text-align: center;
  color: #666;
  padding: 2rem;
`;

const ErrorText = styled.div`
  text-align: center;
  color: #dc3545;
  padding: 2rem;
`;

export const SimpleTradeHistory: React.FC = () => {
  const { isConnected } = useCanister();
  const { user } = useUnifiedAuth();
  const [trades, setTrades] = useState<SimpleTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTradeHistory = useCallback(async () => {
    if (!isConnected || !user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);
      
      // ✅ SIMPLE: Extract principal from user
      const userPrincipal = typeof user === 'string'
        ? Principal.fromText(user)
        : user?.principal || Principal.anonymous();

      console.log('📊 SimpleTradeHistory: Fetching trades for user:', userPrincipal.toString());
      
      // ✅ SIMPLE: Get all positions from atticus core canister
      const allPositions = await atticusService.getAllPositions();
      console.log('📊 SimpleTradeHistory: Total positions:', allPositions.length);
      
      if (allPositions && allPositions.length > 0) {
        // ✅ SIMPLE: Filter for this user only
        const userPositions = allPositions.filter((pos: any) => {
          return pos.user?.toString() === userPrincipal.toString();
        });
        
        console.log('📊 SimpleTradeHistory: User positions:', userPositions.length);
        
        // ✅ SIMPLE: Map to simple format and sort by most recent
        const mappedTrades = userPositions
          .map((pos: any) => {
            console.log('🔍 Trade history debug for position', pos.id, ':', {
              settlementPrice: pos.settlement_price,
              entryPrice: pos.entry_price,
              strikePrice: pos.strike_price,
              status: pos.status
            });
            
            // ✅ FIXED: Use actual settlement price from backend (no more hardcoded overrides)
            let correctedSettlementPrice = pos.settlement_price?.[0];
            
            return {
              id: pos.id?.toString() || 'N/A',
              type: (pos.option_type ? ('Call' in pos.option_type ? 'call' : 'put') : 'call') as 'call' | 'put',
              strike: pos.strike_price || 0,
              entryPrice: correctedSettlementPrice || pos.entry_price || 0, // ✅ FIXED: Use actual settlement price from backend
              expiry: pos.expiry || 'N/A',
              size: pos.size || 1,
              entryPremium: pos.entry_premium || 0,
              pnl: pos.pnl || 0,
              openedAt: Number(pos.opened_at) / 1000000 || 0,
              settledAt: pos.settled_at ? Number(pos.settled_at) / 1000000 : null,
              settlementPrice: correctedSettlementPrice || undefined,
              status: pos.status ? Object.keys(pos.status)[0] || 'Unknown' : 'Unknown'
            };
          })
          .sort((a: SimpleTrade, b: SimpleTrade) => b.openedAt - a.openedAt); // Most recent first
        
        setTrades(mappedTrades);
        console.log('✅ SimpleTradeHistory: Loaded', mappedTrades.length, 'trades');
      } else {
        setTrades([]);
        console.log('📊 SimpleTradeHistory: No positions found');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('❌ SimpleTradeHistory: Failed to fetch trades:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch trade history');
      setTrades([]);
      setLoading(false);
    }
  }, [isConnected, user]);

  useEffect(() => {
    fetchTradeHistory();
  }, [fetchTradeHistory]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  if (loading) {
    return (
      <Container>
        <Title>Trade History</Title>
        <LoadingText>Loading trades...</LoadingText>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Title>Trade History</Title>
        <ErrorText>Error: {error}</ErrorText>
      </Container>
    );
  }

  if (trades.length === 0) {
    return (
      <Container>
        <Title>Trade History</Title>
        <LoadingText>No trades found</LoadingText>
      </Container>
    );
  }

  return (
    <Container>
      <Title>Trade History ({trades.length} trades)</Title>
      {trades.map((trade) => (
        <TradeItem key={trade.id}>
          <TradeInfo>
            <TradeType type={trade.type}>
              {trade.type.toUpperCase()} ${trade.strike.toFixed(2)}
            </TradeType>
            <TradeDetails>
              Settlement: {trade.entryPrice > 0 ? formatPrice(trade.entryPrice) : 'Pending'} | 
              Size: {trade.size} | 
              Expiry: {trade.expiry} | 
              Opened: {formatDate(trade.openedAt)}
            </TradeDetails>
            {trade.settlementPrice && (
              <TradeDetails>
                Settled at: {formatPrice(trade.settlementPrice)}
              </TradeDetails>
            )}
          </TradeInfo>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            <PnL positive={trade.pnl > 0}>
              {trade.pnl > 0 ? '+' : ''}{formatPrice(trade.pnl)}
            </PnL>
            <Status status={trade.status}>
              {trade.status}
            </Status>
          </div>
        </TradeItem>
      ))}
    </Container>
  );
};
