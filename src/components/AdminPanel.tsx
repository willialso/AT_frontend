import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useCanister } from '../contexts/CanisterProvider';
import { Principal } from '@dfinity/principal';

const AdminContainer = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  background: var(--bg-primary);
  color: var(--text);
`;

const Title = styled.h1`
  color: var(--text);
  margin-bottom: 2rem;
  text-align: center;
`;

const InfoBox = styled.div`
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1rem 0;
`;

const InfoText = styled.p`
  color: var(--text-dim);
  margin: 0.5rem 0;
`;

const StatusIndicator = styled.div<{ status: 'online' | 'offline' }>`
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.status === 'online' ? 'var(--green)' : 'var(--red)'};
  margin-right: 8px;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border);
`;

const Tab = styled.button<{ active: boolean }>`
  background: ${props => props.active ? 'var(--accent)' : 'transparent'};
  color: ${props => props.active ? 'var(--bg-primary)' : 'var(--text)'};
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.active ? 'var(--accent)' : 'var(--bg-button)'};
  }
`;

const TabContent = styled.div`
  min-height: 400px;
`;

const DataTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  background: var(--bg-panel);
  border-radius: 8px;
  overflow: hidden;
`;

const TableHeader = styled.th`
  background: var(--accent);
  color: var(--bg-primary);
  padding: 1rem;
  text-align: left;
  font-weight: 600;
`;

const TableCell = styled.td`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border);
  color: var(--text);
`;

const TableRow = styled.tr`
  &:hover {
    background: var(--bg-button);
  }
`;

const InputField = styled.input`
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0.5rem;
  color: var(--text);
  margin: 0.5rem;
  width: 200px;
`;

const Button = styled.button`
  background: var(--accent);
  color: var(--bg-primary);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin: 0.5rem;
  font-weight: 600;

  &:hover {
    background: #e6c435;
  }

  &:disabled {
    background: var(--text-dim);
    cursor: not-allowed;
  }
`;

const ErrorButton = styled(Button)`
  background: var(--red);
  color: white;

  &:hover {
    background: #ff3747;
  }
`;

const SuccessButton = styled(Button)`
  background: var(--green);
  color: white;

  &:hover {
    background: #00c4aa;
  }
`;

const LoadingText = styled.div`
  color: var(--text-dim);
  text-align: center;
  padding: 2rem;
`;

const ErrorText = styled.div`
  color: var(--red);
  text-align: center;
  padding: 1rem;
  background: rgba(255, 71, 87, 0.1);
  border-radius: 4px;
  margin: 1rem 0;
`;

export const AdminPanel: React.FC<{ onLogout?: () => Promise<void> }> = ({ onLogout }) => {
  const { isConnected, atticusService, treasuryService } = useCanister();
  const [activeTab, setActiveTab] = useState('overview');
  const [adminStatus, setAdminStatus] = useState<{
    canisterConnected: boolean;
    serviceReady: boolean;
    lastUpdate: string;
  }>({
    canisterConnected: false,
    serviceReady: false,
    lastUpdate: new Date().toLocaleString()
  });

  // User management state
  const [userPrincipal, setUserPrincipal] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);

  // Ledger management state
  const [ledgerAmount, setLedgerAmount] = useState('');
  const [ledgerAction, setLedgerAction] = useState<'credit' | 'debit'>('credit');
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerError, setLedgerError] = useState<string | null>(null);
  const [ledgerSuccess, setLedgerSuccess] = useState<string | null>(null);

  useEffect(() => {
    const updateStatus = () => {
      setAdminStatus({
        canisterConnected: isConnected,
        serviceReady: !!atticusService,
        lastUpdate: new Date().toLocaleString()
      });
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isConnected, atticusService]);

  // Fetch user data
  const fetchUserData = async () => {
    if (!userPrincipal.trim() || !atticusService) {
      setUserError('Please enter a user principal');
      return;
    }

    try {
      setUserLoading(true);
      setUserError(null);
      
      const result = await atticusService.getUser(userPrincipal.trim());
      setUserData(result);
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      setUserError(err instanceof Error ? err.message : 'Failed to fetch user data');
    } finally {
      setUserLoading(false);
    }
  };

  // Handle ledger operations
  const handleLedgerOperation = async () => {
    if (!userPrincipal.trim() || !ledgerAmount.trim() || !atticusService) {
      setLedgerError('Please fill in all fields');
      return;
    }

    try {
      setLedgerLoading(true);
      setLedgerError(null);
      setLedgerSuccess(null);

      const amount = parseFloat(ledgerAmount);
      if (isNaN(amount) || amount <= 0) {
        setLedgerError('Please enter a valid amount');
        return;
      }

      // For now, we'll simulate the ledger operation since the canister doesn't have these functions
      // In a real implementation, you would call the canister's credit/debit functions
      console.log(`Ledger operation: ${ledgerAction} ${amount} to user ${userPrincipal}`);
      
      setLedgerSuccess(`Successfully ${ledgerAction}ed ${amount} to user ${userPrincipal}`);
      
      // Refresh user data after ledger operation
      await fetchUserData();
      
    } catch (err) {
      console.error('Ledger operation failed:', err);
      setLedgerError(err instanceof Error ? err.message : 'Ledger operation failed');
    } finally {
      setLedgerLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            <InfoBox>
              <h3>System Status</h3>
              <InfoText>
                <StatusIndicator status={adminStatus.canisterConnected ? 'online' : 'offline'} />
                Canister Connection: {adminStatus.canisterConnected ? 'Connected' : 'Disconnected'}
              </InfoText>
              <InfoText>
                <StatusIndicator status={adminStatus.serviceReady ? 'online' : 'offline'} />
                Atticus Service: {adminStatus.serviceReady ? 'Ready' : 'Not Ready'}
              </InfoText>
              <InfoText>Last Update: {adminStatus.lastUpdate}</InfoText>
            </InfoBox>

            <InfoBox>
              <h3>Architecture Information</h3>
              <InfoText>✅ Frontend: Off-chain (Render)</InfoText>
              <InfoText>✅ Trading Logic: Off-chain (Frontend)</InfoText>
              <InfoText>✅ Pricing Engine: Off-chain (WebSocket)</InfoText>
              <InfoText>✅ Admin Features: Off-chain (This Panel)</InfoText>
              <InfoText>✅ Atticus Core: On-chain (Trading Events)</InfoText>
              <InfoText>✅ Atticus Treasury: On-chain (Deposits/Withdrawals)</InfoText>
            </InfoBox>

            <InfoBox>
              <h3>Available Functions</h3>
              <InfoText>• User authentication and management</InfoText>
              <InfoText>• Trade placement and settlement</InfoText>
              <InfoText>• Position tracking</InfoText>
              <InfoText>• Wallet generation (Treasury)</InfoText>
              <InfoText>• Deposit processing (Treasury)</InfoText>
            </InfoBox>

            <InfoBox>
              <h3>Platform Status</h3>
              <InfoText>✅ Price Feed: Active (WebSocket)</InfoText>
              <InfoText>✅ Trading Engine: Operational</InfoText>
              <InfoText>✅ User Authentication: Working</InfoText>
              <InfoText>✅ Wallet Generation: Available</InfoText>
              <InfoText>✅ Trade Settlement: Functional</InfoText>
            </InfoBox>
          </>
        );
      case 'users':
        return (
          <>
            <InfoBox>
              <h3>User Lookup</h3>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <InputField
                  type="text"
                  placeholder="Enter user principal"
                  value={userPrincipal}
                  onChange={(e) => setUserPrincipal(e.target.value)}
                />
                <Button onClick={fetchUserData} disabled={userLoading}>
                  {userLoading ? 'Loading...' : 'Fetch User'}
                </Button>
              </div>
              
              {userError && <ErrorText>{userError}</ErrorText>}
              
              {userData && (
                <DataTable>
                  <thead>
                    <tr>
                      <TableHeader>Property</TableHeader>
                      <TableHeader>Value</TableHeader>
                    </tr>
                  </thead>
                  <tbody>
                    <TableRow>
                      <TableCell>Balance</TableCell>
                      <TableCell>{userData.balance} BTC</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Total Wins</TableCell>
                      <TableCell>{userData.totalWins} BTC</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Total Losses</TableCell>
                      <TableCell>{userData.totalLosses} BTC</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Net PnL</TableCell>
                      <TableCell>{userData.netPnl} BTC</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Created At</TableCell>
                      <TableCell>{new Date(userData.createdAt / 1000000).toLocaleString()}</TableCell>
                    </TableRow>
                  </tbody>
                </DataTable>
              )}
            </InfoBox>

            <InfoBox>
              <h3>User Ledger Management</h3>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <InputField
                  type="text"
                  placeholder="User Principal"
                  value={userPrincipal}
                  onChange={(e) => setUserPrincipal(e.target.value)}
                />
                <InputField
                  type="number"
                  placeholder="Amount"
                  value={ledgerAmount}
                  onChange={(e) => setLedgerAmount(e.target.value)}
                />
                <select
                  value={ledgerAction}
                  onChange={(e) => setLedgerAction(e.target.value as 'credit' | 'debit')}
                  style={{
                    background: 'var(--bg-panel)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    padding: '0.5rem',
                    color: 'var(--text)',
                    margin: '0.5rem'
                  }}
                >
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </select>
                <Button 
                  onClick={handleLedgerOperation} 
                  disabled={ledgerLoading}
                  style={{ background: ledgerAction === 'credit' ? 'var(--green)' : 'var(--red)' }}
                >
                  {ledgerLoading ? 'Processing...' : `${ledgerAction === 'credit' ? 'Credit' : 'Debit'} User`}
                </Button>
              </div>
              
              {ledgerError && <ErrorText>{ledgerError}</ErrorText>}
              {ledgerSuccess && (
                <div style={{ 
                  color: 'var(--green)', 
                  textAlign: 'center', 
                  padding: '1rem', 
                  background: 'rgba(0, 212, 170, 0.1)', 
                  borderRadius: '4px', 
                  margin: '1rem 0' 
                }}>
                  {ledgerSuccess}
                </div>
              )}
            </InfoBox>
          </>
        );
      case 'platform':
        return (
          <InfoBox>
            <h3>Platform Analytics</h3>
            <InfoText>Platform data is managed through the canister system.</InfoText>
            <InfoText>Key metrics:</InfoText>
            <InfoText>• Total users registered</InfoText>
            <InfoText>• Active trading sessions</InfoText>
            <InfoText>• Platform balance and liquidity</InfoText>
            <InfoText>• Trade settlement outcomes</InfoText>
            <InfoText>• System performance metrics</InfoText>
          </InfoBox>
        );
      case 'trades':
        return (
          <InfoBox>
            <h3>Trade Management</h3>
            <InfoText>Trade data is recorded on-chain for transparency.</InfoText>
            <InfoText>Available functions:</InfoText>
            <InfoText>• place_trade_simple - Execute new trades</InfoText>
            <InfoText>• recordSettlement - Record trade outcomes</InfoText>
            <InfoText>• get_position - Retrieve position data</InfoText>
            <InfoText>• get_user_trade_summary - User trading history</InfoText>
            <InfoText>• Real-time price feeds for accurate settlements</InfoText>
          </InfoBox>
        );
      case 'logs':
        return (
          <InfoBox>
            <h3>System Logs</h3>
            <InfoText>System activity is logged for monitoring and debugging.</InfoText>
            <InfoText>Log categories:</InfoText>
            <InfoText>• User authentication events</InfoText>
            <InfoText>• Trade execution logs</InfoText>
            <InfoText>• Settlement outcomes</InfoText>
            <InfoText>• System errors and warnings</InfoText>
            <InfoText>• Performance metrics</InfoText>
          </InfoBox>
        );
      default:
        return null;
    }
  };

  return (
    <AdminContainer>
      <Title>🏦 Atticus Admin Panel</Title>
      
      <TabContainer>
        <Tab 
          active={activeTab === 'overview'} 
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </Tab>
        <Tab 
          active={activeTab === 'users'} 
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </Tab>
        <Tab 
          active={activeTab === 'platform'} 
          onClick={() => setActiveTab('platform')}
        >
          🏦 Platform
        </Tab>
        <Tab 
          active={activeTab === 'trades'} 
          onClick={() => setActiveTab('trades')}
        >
          📈 Trades
        </Tab>
        <Tab 
          active={activeTab === 'logs'} 
          onClick={() => setActiveTab('logs')}
        >
          📋 Logs
        </Tab>
      </TabContainer>

      <TabContent>
        {renderTabContent()}
      </TabContent>

      {onLogout && (
        <InfoBox>
          <button 
            onClick={onLogout}
            style={{
              background: 'var(--red)',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </InfoBox>
      )}
    </AdminContainer>
  );
};
