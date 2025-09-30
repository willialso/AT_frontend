import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useCanister } from '../contexts/CanisterProvider';
import { UserMetrics } from './UserMetrics';
import { PlatformLedger } from './PlatformLedger';
import { PlatformTradingSummary } from './PlatformTradingSummary';
import { UserTradeAnalytics } from './UserTradeAnalytics';
import { AdminActionLog } from './AdminActionLog';

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

export const AdminPanel: React.FC<{ onLogout?: () => Promise<void> }> = ({ onLogout }) => {
  const { isConnected, atticusService } = useCanister();
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
              <h3>Admin Features (Off-chain)</h3>
              <InfoText>• Real-time analytics and monitoring</InfoText>
              <InfoText>• Platform performance metrics</InfoText>
              <InfoText>• User activity tracking</InfoText>
              <InfoText>• Trade settlement monitoring</InfoText>
              <InfoText>• Risk management tools</InfoText>
            </InfoBox>

            <InfoBox>
              <h3>On-chain Functions</h3>
              <InfoText>• User authentication (Atticus Core)</InfoText>
              <InfoText>• Trade event recording (Atticus Core)</InfoText>
              <InfoText>• Wallet generation (Atticus Treasury)</InfoText>
              <InfoText>• Deposit processing (Atticus Treasury)</InfoText>
              <InfoText>• Withdrawal management (Atticus Treasury)</InfoText>
            </InfoBox>
          </>
        );
      case 'users':
        return <UserMetrics />;
      case 'platform':
        return (
          <>
            <PlatformLedger />
            <PlatformTradingSummary />
          </>
        );
      case 'trades':
        return <UserTradeAnalytics />;
      case 'logs':
        return <AdminActionLog />;
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
