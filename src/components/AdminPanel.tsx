import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Principal } from '@dfinity/principal';
import { tradingService } from '../services/tradingService';
import { blockchainMonitor } from '../services/blockchainMonitor';
import { useCanister } from '../contexts/CanisterProvider';
import { UserTradeAnalytics } from './UserTradeAnalytics';
import { PlatformTradingSummary } from './PlatformTradingSummary';
import { AdminActionLog } from './AdminActionLog';
import { UserMetrics } from './UserMetrics';
import { PlatformLedger } from './PlatformLedger';

const AdminContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  background: var(--bg-primary);
  color: var(--text);
`;

const AdminHeader = styled.h1`
  color: var(--primary);
  margin-bottom: 2rem;
`;

const Section = styled.div`
  background: var(--bg-panel);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--border);
`;

const SectionTitle = styled.h2`
  color: var(--text);
  margin-bottom: 1rem;
  font-size: 1.25rem;
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const StatusCard = styled.div<{ $status: boolean }>`
  padding: 1rem;
  border-radius: 6px;
  background: ${props => props.$status ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 68, 68, 0.1)'};
  border: 1px solid ${props => props.$status ? '#00ff88' : '#ff4444'};
`;

const StatusLabel = styled.div`
  font-size: 0.9rem;
  opacity: 0.8;
  margin-bottom: 0.5rem;
`;

const StatusValue = styled.div<{ $status: boolean }>`
  font-weight: bold;
  color: ${props => props.$status ? '#00ff88' : '#ff4444'};
`;

const Button = styled.button`
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  margin-right: 1rem;

  &:hover {
    background: var(--primary-dark);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const WalletInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
`;

const InfoCard = styled.div`
  background: var(--bg-secondary);
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid var(--border);
`;

const InfoLabel = styled.div`
  font-size: 0.9rem;
  opacity: 0.8;
  margin-bottom: 0.5rem;
`;

const InfoValue = styled.div`
  font-weight: bold;
  font-family: monospace;
`;

interface AdminPanelProps {
  onLogout?: () => Promise<void>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const { isConnected: canisterConnected, tradingCanister } = useCanister();
  const [isInitialized, setIsInitialized] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    canister: false,
    platformWallet: false,
    liquidityPool: false
  });
  const [walletInfo, setWalletInfo] = useState<{
    address: string;
    balance: number;
    totalDeposits: number;
    totalWithdrawals: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [blockchainStatus, setBlockchainStatus] = useState<{
    isMonitoring: boolean;
    poolAddress: string;
    processedCount: number;
  }>({
    isMonitoring: false,
    poolAddress: '',
    processedCount: 0
  });
  const [poolAddress, setPoolAddress] = useState('bc1q9t8fk860xk7hgwggjf8hqdnz0zwtakne6cv5h0n85s0jhzkvxc4qmx3fn0');
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [txHash, setTxHash] = useState('');
  // ✅ REMOVED: userAddresses state - no longer needed
  const [creditUserPrincipal, setCreditUserPrincipal] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [platformLedger, setPlatformLedger] = useState<{
    balance: number;
    totalDeposits: number;
    totalWithdrawals: number;
    address: string;
  } | null>(null);

  // ✅ Initialize trading service when canister is available
  useEffect(() => {
    if (tradingCanister && !tradingService.isReady()) {
      console.log('🔧 Initializing trading service with canister...');
      tradingService.initialize(tradingCanister).catch(console.error);
    }
  }, [tradingCanister]);

  useEffect(() => {
    // Only initialize admin when canister is connected
    if (!canisterConnected || !tradingCanister) {
      console.log('⏳ Waiting for canister connection...');
      return;
    }

    // Delay initial checks to allow trading service to initialize
    const initializeAdmin = async () => {
      console.log('🚀 Initializing admin panel...');
      
      // Wait for trading service to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Retry system status check multiple times
      let retries = 0;
      const maxRetries = 3;
      
      while (retries < maxRetries) {
        try {
          await checkSystemStatus();
          const status = tradingService.getStatus();
          if (status.canister && status.platformWallet) {
            console.log('✅ Admin panel initialized successfully');
            break;
          }
        } catch (error) {
          console.log(`⚠️ Retry ${retries + 1}/${maxRetries} failed:`, error);
        }
        retries++;
        if (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      updateBlockchainStatus();
      fetchWithdrawalRequests();
      fetchPlatformLedger();
    };
    
    initializeAdmin();
  }, [canisterConnected, tradingCanister]);

  const fetchWithdrawalRequests = async () => {
    try {
      const requests = await (tradingService as any).canister?.get_all_withdrawals?.();
      if (requests) {
        setWithdrawalRequests(requests);
      }
    } catch (error) {
      console.error('Failed to fetch withdrawal requests:', error);
    }
  };

  // ✅ REMOVED: fetchUserAddresses function - no longer needed

  const updateBlockchainStatus = () => {
    const status = blockchainMonitor.getStatus();
    setBlockchainStatus(status);
  };

  const fetchPlatformLedger = async () => {
    try {
      if (!tradingCanister) {
        console.log('❌ No canister available for platform ledger');
        return;
      }
      
      console.log('📊 Fetching platform ledger data...');
      const ledgerData = await tradingCanister.get_platform_wallet();
      
      setPlatformLedger({
        balance: ledgerData.balance,
        totalDeposits: ledgerData.total_deposits,
        totalWithdrawals: ledgerData.total_withdrawals,
        address: ledgerData.address
      });
      
      console.log('✅ Platform ledger data loaded:', ledgerData);
    } catch (error) {
      console.error('❌ Failed to fetch platform ledger:', error);
    }
  };

  const checkSystemStatus = async () => {
    try {
      console.log('🔍 Checking system status...');
      console.log('🔗 Canister connected:', canisterConnected);
      console.log('🔧 Trading service ready:', tradingService.isReady());
      
      const tradingStatus = tradingService.getStatus();
      console.log('📊 Trading service status:', tradingStatus);
      
      // Update system status with canister connection info
      const status = {
        canister: canisterConnected && !!tradingCanister,
        platformWallet: tradingStatus.platformWallet,
        liquidityPool: tradingStatus.liquidityPool
      };
      
      console.log('📊 Final system status:', status);
      setSystemStatus(status);
      setIsInitialized(tradingService.isReady() && canisterConnected);

      if (canisterConnected && tradingService.isReady()) {
        const wallet = await tradingService.getPlatformWallet();
        console.log('💰 Platform wallet info:', wallet);
        setWalletInfo(wallet);
      } else {
        console.log('⏳ Skipping wallet info fetch - not ready');
        setWalletInfo(null);
      }
    } catch (error) {
      console.error('❌ Failed to check system status:', error);
      // Set default values on error
      setSystemStatus({
        canister: canisterConnected && !!tradingCanister,
        platformWallet: false,
        liquidityPool: false
      });
      setIsInitialized(false);
    }
  };

  // ✅ FIXED: Remove parameter expectation since tradingService.initialize() doesn't need one
  const handleInitialize = async () => {
    try {
      setIsLoading(true);
      // ✅ FIXED: The initialize method will be called properly via CanisterProvider
      await checkSystemStatus();
    } catch (error) {
      console.error('Initialization failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartMonitoring = async () => {
    if (!poolAddress.trim()) {
      alert('Please enter a valid Bitcoin address');
      return;
    }

    try {
      setIsLoading(true);
      await blockchainMonitor.startMonitoring(poolAddress.trim());
      updateBlockchainStatus();
      console.log('✅ Blockchain monitoring started for:', poolAddress);
    } catch (error) {
      console.error('❌ Failed to start monitoring:', error);
      alert('Failed to start blockchain monitoring');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopMonitoring = () => {
    try {
      blockchainMonitor.stopMonitoring();
      updateBlockchainStatus();
      console.log('⏹️ Blockchain monitoring stopped');
    } catch (error) {
      console.error('❌ Failed to stop monitoring:', error);
    }
  };

  const handleCreditUser = async () => {
    if (!creditUserPrincipal.trim() || !creditAmount.trim()) {
      alert('Please enter user principal and amount');
      return;
    }

    const amount = parseFloat(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setIsLoading(true);
      const result = await (tradingService as any).canister?.admin_credit_user_balance?.(
        Principal.fromText(creditUserPrincipal.trim()), 
        amount
      );
      
      if (result && 'ok' in result) {
        alert('User credited successfully: ' + result.ok);
        setCreditUserPrincipal('');
        setCreditAmount('');
        await checkSystemStatus(); // Refresh wallet info
      } else {
        alert('Failed to credit user: ' + (result?.err || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to credit user:', error);
      alert('Failed to credit user: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshData = async () => { // ✅ FIXED: Add proper function signature
    try {
      setIsLoading(true);
      await checkSystemStatus();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransfer = async () => {
    try {
      setIsLoading(true);
      const result = await tradingService.transferFromPlatformToExternal(
        'bc1qexampleaddress',
        0.001
      );
      console.log('Transfer result:', result);
      await checkSystemStatus();
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleApproveWithdrawal = async (requestId: number) => {
    try {
      setIsLoading(true);
      const result = await (tradingService as any).canister?.admin_approve_withdrawal?.(requestId);
      console.log('Approve withdrawal result:', result);
      await fetchWithdrawalRequests();
    } catch (error) {
      console.error('Approve withdrawal failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectWithdrawal = async (requestId: number) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    try {
      setIsLoading(true);
      const result = await (tradingService as any).canister?.admin_reject_withdrawal?.(requestId, rejectionReason);
      console.log('Reject withdrawal result:', result);
      setRejectionReason('');
      setSelectedRequestId(null);
      await fetchWithdrawalRequests();
    } catch (error) {
      console.error('Reject withdrawal failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkProcessed = async (requestId: number) => {
    if (!txHash.trim()) {
      alert('Please provide a transaction hash');
      return;
    }
    try {
      setIsLoading(true);
      const result = await (tradingService as any).canister?.admin_mark_withdrawal_processed?.(requestId, txHash);
      console.log('Mark processed result:', result);
      setTxHash('');
      setSelectedRequestId(null);
      await fetchWithdrawalRequests();
      await checkSystemStatus();
    } catch (error) {
      console.error('Mark processed failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminContainer>
      <AdminHeader>Admin Panel</AdminHeader>
      
      <Section>
        <SectionTitle>System Status</SectionTitle>
        <StatusGrid>
          <StatusCard $status={systemStatus.canister}>
            <StatusLabel>Backend Canister</StatusLabel>
            <StatusValue $status={systemStatus.canister}>
              {systemStatus.canister ? 'Connected' : 'Disconnected'}
            </StatusValue>
          </StatusCard>
          
          <StatusCard $status={systemStatus.platformWallet}>
            <StatusLabel>Platform Wallet</StatusLabel>
            <StatusValue $status={systemStatus.platformWallet}>
              {systemStatus.platformWallet ? 'Ready' : 'Not Ready'}
            </StatusValue>
          </StatusCard>
          
          <StatusCard $status={systemStatus.liquidityPool}>
            <StatusLabel>Liquidity Pool</StatusLabel>
            <StatusValue $status={systemStatus.liquidityPool}>
              {systemStatus.liquidityPool ? 'Active' : 'Inactive'}
            </StatusValue>
          </StatusCard>
        </StatusGrid>

        <Button 
          onClick={handleInitialize} 
          disabled={isLoading}
        >
          {isInitialized ? 'Refresh Status' : 'Initialize System'}
        </Button>

        <Button 
          onClick={handleRefreshData} // ✅ FIXED: Now properly calls function 
          disabled={isLoading}
        >
          Refresh Data
        </Button>

        <Button 
          onClick={handleTransfer} 
          disabled={isLoading}
        >
          Test Transfer
        </Button>
      </Section>

      {/* Admin Credit User Section */}
      <Section>
        <SectionTitle>Credit User Balance</SectionTitle>
        <p style={{ color: 'var(--text-dim)', marginBottom: '1rem' }}>
          Credit a user's balance for orphaned deposits or manual adjustments
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)' }}>
              User Principal:
            </label>
            <input
              type="text"
              value={creditUserPrincipal}
              onChange={(e) => setCreditUserPrincipal(e.target.value)}
              placeholder="h4esp-g4cxg-ql7rh-s4bxa-jnr33-dn6kr-vxvh7-s3ahv-mj5dq-vmf6o-mae"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text)',
                fontSize: '0.9rem'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)' }}>
              Amount (BTC):
            </label>
            <input
              type="number"
              step="0.00000001"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              placeholder="0.001"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text)',
                fontSize: '0.9rem'
              }}
            />
          </div>
          
          <Button 
            onClick={handleCreditUser} 
            disabled={isLoading}
            style={{ alignSelf: 'flex-start' }}
          >
            {isLoading ? 'Processing...' : 'Credit User Balance'}
          </Button>
        </div>
      </Section>

      {walletInfo && (
        <Section>
          <SectionTitle>Platform Wallet</SectionTitle>
          <WalletInfo>
            <InfoCard>
              <InfoLabel>Address</InfoLabel>
              <InfoValue style={{ wordBreak: 'break-all', maxWidth: '300px' }}>{walletInfo.address}</InfoValue>
            </InfoCard>
            
            <InfoCard>
              <InfoLabel>Balance</InfoLabel>
              <InfoValue>{walletInfo.balance.toFixed(8)} BTC</InfoValue>
            </InfoCard>
            
            <InfoCard>
              <InfoLabel>Total Deposits</InfoLabel>
              <InfoValue>{walletInfo.totalDeposits.toFixed(8)} BTC</InfoValue>
            </InfoCard>
            
            <InfoCard>
              <InfoLabel>Total Withdrawals</InfoLabel>
              <InfoValue>{walletInfo.totalWithdrawals.toFixed(8)} BTC</InfoValue>
            </InfoCard>
          </WalletInfo>
        </Section>
      )}

      {/* Platform Ledger Section */}
      {platformLedger && (
        <Section>
          <SectionTitle>🏦 Platform Ledger Balance</SectionTitle>
          <WalletInfo>
            <InfoCard>
              <InfoLabel>Current Balance</InfoLabel>
              <InfoValue style={{ color: '#00cc44', fontWeight: 'bold' }}>
                {platformLedger.balance.toFixed(8)} BTC
              </InfoValue>
            </InfoCard>
            
            <InfoCard>
              <InfoLabel>Total Deposits</InfoLabel>
              <InfoValue style={{ color: '#00cc44' }}>
                {platformLedger.totalDeposits.toFixed(8)} BTC
              </InfoValue>
            </InfoCard>
            
            <InfoCard>
              <InfoLabel>Total Withdrawals</InfoLabel>
              <InfoValue style={{ color: '#ff4444' }}>
                {platformLedger.totalWithdrawals.toFixed(8)} BTC
              </InfoValue>
            </InfoCard>
            
            <InfoCard>
              <InfoLabel>Platform Address</InfoLabel>
              <InfoValue style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                {platformLedger.address}
              </InfoValue>
            </InfoCard>
          </WalletInfo>
          
          <Button 
            onClick={fetchPlatformLedger}
            style={{ marginTop: '1rem' }}
          >
            🔄 Refresh Ledger
          </Button>
        </Section>
      )}

      {/* Blockchain Monitoring Section */}
      <Section>
        <SectionTitle>Blockchain Monitoring</SectionTitle>
        
        <StatusGrid>
          <StatusCard $status={blockchainStatus.isMonitoring}>
            <StatusLabel>Monitoring Status</StatusLabel>
            <StatusValue $status={blockchainStatus.isMonitoring}>
              {blockchainStatus.isMonitoring ? '🟢 Active' : '🔴 Inactive'}
            </StatusValue>
          </StatusCard>
          
          <StatusCard $status={blockchainStatus.poolAddress !== ''}>
            <StatusLabel>Pool Address</StatusLabel>
            <StatusValue $status={blockchainStatus.poolAddress !== ''}>
              {blockchainStatus.poolAddress ? 
                `${blockchainStatus.poolAddress.substring(0, 8)}...${blockchainStatus.poolAddress.substring(blockchainStatus.poolAddress.length - 8)}` : 
                'Not Set'
              }
            </StatusValue>
          </StatusCard>
          
          <StatusCard $status={blockchainStatus.processedCount > 0}>
            <StatusLabel>Processed Deposits</StatusLabel>
            <StatusValue $status={blockchainStatus.processedCount > 0}>{blockchainStatus.processedCount}</StatusValue>
          </StatusCard>
        </StatusGrid>

        <div style={{ marginBottom: '1rem' }}>
          <InfoLabel>Liquidity Pool Address</InfoLabel>
          <input
            type="text"
            value={poolAddress}
            onChange={(e) => setPoolAddress(e.target.value)}
            placeholder="Enter Bitcoin address from airgapped computer"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              background: 'var(--bg-primary)',
              color: 'var(--text)',
              fontSize: '14px',
              marginTop: '0.5rem'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Button 
            onClick={handleStartMonitoring} 
            disabled={isLoading || blockchainStatus.isMonitoring}
            style={{ 
              background: blockchainStatus.isMonitoring ? 'var(--border)' : 'var(--green)',
              color: blockchainStatus.isMonitoring ? 'var(--text-secondary)' : 'white'
            }}
          >
            {blockchainStatus.isMonitoring ? 'Monitoring Active' : 'Start Monitoring'}
          </Button>

          <Button 
            onClick={handleStopMonitoring} 
            disabled={!blockchainStatus.isMonitoring}
            style={{ 
              background: !blockchainStatus.isMonitoring ? 'var(--border)' : 'var(--red)',
              color: !blockchainStatus.isMonitoring ? 'var(--text-secondary)' : 'white'
            }}
          >
            Stop Monitoring
          </Button>

          <Button 
            onClick={updateBlockchainStatus} 
            disabled={isLoading}
          >
            Refresh Status
          </Button>
        </div>

        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          background: 'rgba(0, 123, 255, 0.1)', 
          border: '1px solid var(--primary)', 
          borderRadius: '6px',
          fontSize: '14px',
          color: 'var(--text-secondary)'
        }}>
          <strong>📋 Instructions:</strong>
          <ol style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
            <li>Generate a Bitcoin address on your airgapped computer</li>
            <li>Enter the address above</li>
            <li>Click "Start Monitoring" to begin watching for deposits</li>
            <li>Users will receive toast notifications when deposits are detected</li>
            <li>Deposits are automatically credited to user accounts</li>
          </ol>
        </div>
      </Section>

      {/* Withdrawal Queue Management */}
      <Section>
        <SectionTitle>Withdrawal Queue Management</SectionTitle>
        
        <div style={{ marginBottom: '1rem' }}>
          <Button 
            onClick={fetchWithdrawalRequests} 
            disabled={isLoading}
          >
            Refresh Withdrawals
          </Button>
        </div>

        {withdrawalRequests.length === 0 ? (
          <div style={{ 
            padding: '2rem', 
            textAlign: 'center', 
            color: 'var(--text-secondary)',
            background: 'var(--bg-secondary)',
            borderRadius: '6px',
            border: '1px solid var(--border)'
          }}>
            No withdrawal requests found
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gap: '1rem',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {withdrawalRequests.map((request) => (
              <div key={request.id} style={{
                padding: '1rem',
                background: 'var(--bg-secondary)',
                borderRadius: '6px',
                border: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <strong>Request ID: {request.id}</strong>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      User: {request.user.toString().substring(0, 8)}...
                    </div>
                  </div>
                  <div style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    background: request.status === 'Pending' ? 'rgba(255, 193, 7, 0.2)' : 
                               request.status === 'Approved' ? 'rgba(40, 167, 69, 0.2)' :
                               request.status === 'Processed' ? 'rgba(0, 123, 255, 0.2)' : 'rgba(220, 53, 69, 0.2)',
                    color: request.status === 'Pending' ? '#ffc107' : 
                           request.status === 'Approved' ? '#28a745' :
                           request.status === 'Processed' ? '#007bff' : '#dc3545'
                  }}>
                    {request.status}
                  </div>
                </div>
                
                <div style={{ marginBottom: '0.5rem' }}>
                  <div><strong>Amount:</strong> {request.amount} BTC</div>
                  <div><strong>To Address:</strong> {request.to_address}</div>
                  <div><strong>Created:</strong> {new Date(Number(request.created_at) / 1000000).toLocaleString()}</div>
                  {request.processed_at && (
                    <div><strong>Processed:</strong> {new Date(Number(request.processed_at) / 1000000).toLocaleString()}</div>
                  )}
                  {request.tx_hash && (
                    <div><strong>TX Hash:</strong> {request.tx_hash}</div>
                  )}
                  {request.rejection_reason && (
                    <div><strong>Rejection Reason:</strong> {request.rejection_reason}</div>
                  )}
                </div>

                {request.status === 'Pending' && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Button 
                      onClick={() => handleApproveWithdrawal(request.id)}
                      disabled={isLoading}
                      style={{ background: 'var(--green)', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                    >
                      Approve
                    </Button>
                    <Button 
                      onClick={() => setSelectedRequestId(request.id)}
                      disabled={isLoading}
                      style={{ background: 'var(--red)', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                    >
                      Reject
                    </Button>
                  </div>
                )}

                {request.status === 'Approved' && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="Enter transaction hash after manual processing"
                      value={txHash}
                      onChange={(e) => setTxHash(e.target.value)}
                      style={{
                        flex: 1,
                        minWidth: '200px',
                        padding: '0.5rem',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        background: 'var(--bg-primary)',
                        color: 'var(--text)',
                        fontSize: '0.8rem'
                      }}
                    />
                    <Button 
                      onClick={() => handleMarkProcessed(request.id)}
                      disabled={isLoading || !txHash.trim()}
                      style={{ background: 'var(--primary)', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                    >
                      Mark Processed
                    </Button>
                  </div>
                )}

                {selectedRequestId === request.id && (
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'var(--bg-primary)', borderRadius: '4px' }}>
                    <input
                      type="text"
                      placeholder="Enter rejection reason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text)',
                        fontSize: '0.8rem',
                        marginBottom: '0.5rem'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button 
                        onClick={() => handleRejectWithdrawal(request.id)}
                        disabled={isLoading || !rejectionReason.trim()}
                        style={{ background: 'var(--red)', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                      >
                        Confirm Reject
                      </Button>
                      <Button 
                        onClick={() => {
                          setSelectedRequestId(null);
                          setRejectionReason('');
                        }}
                        disabled={isLoading}
                        style={{ background: 'var(--border)', color: 'var(--text)', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          background: 'rgba(255, 193, 7, 0.1)', 
          border: '1px solid #ffc107', 
          borderRadius: '6px',
          fontSize: '14px',
          color: 'var(--text-secondary)'
        }}>
          <strong>📋 Withdrawal Process:</strong>
          <ol style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
            <li>Users request withdrawals (creates pending request)</li>
            <li>Admin reviews and approves/rejects requests</li>
            <li>For approved requests: Process manually from air-gapped wallet</li>
            <li>Enter transaction hash to mark as processed</li>
            <li>User balance is deducted when marked as processed</li>
          </ol>
        </div>
      </Section>

      {/* ✅ REMOVED: Redundant User Deposit Addresses section - now integrated into Live User Metrics */}

      {/* ✅ NEW: Live User Metrics */}
      <UserMetrics />

      {/* ✅ NEW: Platform Ledger (Trading PnL) */}
      <PlatformLedger />

      {/* ✅ NEW: User Trade Analytics */}
      <UserTradeAnalytics />

      {/* ✅ NEW: Platform Trading Summary */}
      <PlatformTradingSummary />

      {/* ✅ NEW: Admin Action Log */}
      <AdminActionLog />

      {/* ✅ NEW: Database Cleanup Section */}
      <Section>
        <SectionTitle>🧹 Database Cleanup</SectionTitle>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <Button 
            onClick={async () => {
              if (confirm('⚠️ This will reset ALL platform data. Are you sure?')) {
                try {
                  setIsLoading(true);
                  const result = await tradingCanister.admin_reset_platform_data();
                  alert('✅ ' + result);
                  
                  // ✅ Refresh data after successful action
                  await fetchWithdrawalRequests();
                  await fetchPlatformLedger();
                  await checkSystemStatus();
                } catch (error) {
                  console.error('Reset platform data error:', error);
                  alert('❌ Error: ' + error);
                } finally {
                  setIsLoading(false);
                }
              }
            }}
            style={{ background: '#dc3545' }}
            disabled={isLoading}
          >
            {isLoading ? '⏳ Resetting...' : '🔄 Reset Platform Data'}
          </Button>
          
          <Button 
            onClick={async () => {
              if (confirm('⚠️ This will remove all test accounts. Are you sure?')) {
                try {
                  setIsLoading(true);
                  const result = await tradingCanister.admin_clean_test_accounts();
                  alert('✅ ' + result);
                  
                  // ✅ Refresh data after successful action
                  await fetchWithdrawalRequests();
                  await checkSystemStatus();
                } catch (error) {
                  console.error('Clean test accounts error:', error);
                  alert('❌ Error: ' + error);
                } finally {
                  setIsLoading(false);
                }
              }
            }}
            style={{ background: '#fd7e14' }}
            disabled={isLoading}
          >
            {isLoading ? '⏳ Cleaning...' : '🗑️ Clean Test Accounts'}
          </Button>
          
          <Button 
            onClick={async () => {
              if (confirm('⚠️ This will reconcile balances with blockchain. Are you sure?')) {
                try {
                  setIsLoading(true);
                  const result = await tradingCanister.admin_reconcile_balances();
                  alert('✅ ' + result);
                  
                  // ✅ Refresh data after successful action
                  await fetchPlatformLedger();
                  await checkSystemStatus();
                } catch (error) {
                  console.error('Reconcile balances error:', error);
                  alert('❌ Error: ' + error);
                } finally {
                  setIsLoading(false);
                }
              }
            }}
            style={{ background: '#28a745' }}
            disabled={isLoading}
          >
            {isLoading ? '⏳ Reconciling...' : '⚖️ Reconcile Balances'}
          </Button>
        </div>
        
        <div style={{ 
          padding: '1rem', 
          background: 'rgba(255, 193, 7, 0.1)', 
          border: '1px solid #ffc107', 
          borderRadius: '6px',
          fontSize: '14px',
          color: 'var(--text-secondary)'
        }}>
          <strong>⚠️ Database Cleanup Instructions:</strong>
          <ol style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
            <li><strong>Reset Platform Data:</strong> Clears all trades and positions</li>
            <li><strong>Clean Test Accounts:</strong> Removes all users except 2 live principals</li>
            <li><strong>Reconcile Balances:</strong> Sets user balances to match actual deposits</li>
          </ol>
          <p style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>
            ⚠️ These actions are irreversible. Use with caution!
          </p>
        </div>
      </Section>

      {onLogout && (
        <Section>
          <Button onClick={onLogout}>
            Logout
          </Button>
        </Section>
      )}
    </AdminContainer>
  );
};

export default AdminPanel;
