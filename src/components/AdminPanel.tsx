import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useCanister } from '../contexts/CanisterProvider';

const AdminContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
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

export const AdminPanel: React.FC<{ onLogout?: () => Promise<void> }> = ({ onLogout }) => {
  const { isConnected, atticusService } = useCanister();
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

  return (
    <AdminContainer>
      <Title>Atticus Admin Panel</Title>
      
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
