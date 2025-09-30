import React, { useState } from 'react';
import { createGlobalStyle } from 'styled-components';
import styled from 'styled-components';
import { LandingPage } from './LandingPage';
import { TradingPanel } from './TradingPanel';
import { useAuth, AuthProvider } from '../contexts/AuthProvider';
import { TradeProvider } from '../contexts/TradeContext';
import { CanisterProvider } from '../contexts/CanisterProvider';
import { BalanceProvider } from '../contexts/BalanceProvider';
// ✅ REMOVED: WebSocketProvider - now using global price feed manager
import { ToastProvider } from './ToastProvider';

const GlobalStyle = createGlobalStyle`
  :root {
    --bg-primary: #0f1419;
    --bg-panel: #1a2332;
    --accent: #f4d03f;
    --green: #00d4aa;
    --red: #ff4757;
    --text: #ffffff;
    --text-dim: #8b95a1;
    --border: #2a3441;
    --shadow: rgba(0, 0, 0, 0.3);
    --bg-button: #2a3441;
    --bg-button-hover: #3a4451;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Inter', sans-serif;
    background: var(--bg-primary);
    color: var(--text);
    overflow-x: hidden;
    overflow-y: auto;
  }

  #root {
    min-height: 100vh;
    width: 100vw;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: var(--bg-primary);
  padding: 2rem;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid transparent;
  border-top: 3px solid var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  color: var(--text-dim);
  font-size: 1rem;
  text-align: center;
  margin-bottom: 1rem;
`;

const LiquidityBadge = styled.div`
  background: rgba(0, 212, 170, 0.1);
  border: 1px solid var(--green);
  color: var(--green);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
  margin-top: 1rem;
  &::before {
    content: '🌊 ';
    margin-right: 0.5rem;
  }
`;

const AppContent: React.FC = () => {
  const { 
    isAuthenticated, 
    isLoading, 
    user,
    principal,
    signInWithICP,
    signInWithTwitter,
    signInWithGoogle,
    logout
  } = useAuth();

  // ✅ EMAIL SERVICE NOW HANDLED BY BACKEND - NO FRONTEND INITIALIZATION NEEDED
  React.useEffect(() => {
    // Email service removed - using simple architecture
  }, []);
  
  const [isDemoMode, setIsDemoMode] = useState(false);

  const handleGetStarted = async () => {
    try {
      await signInWithICP();
      setIsDemoMode(false); // Exit demo when connecting
    } catch (err) {
      console.error('ICP login failed:', err);
    }
  };

  const handleTryDemo = () => {
    setIsDemoMode(true);
  };

  const handleTwitterSignIn = async () => {
    try {
      console.log('🔧 App: handleTwitterSignIn called');
      const result = await signInWithTwitter();
      console.log('🔧 App: Twitter auth result:', result);
      
      if (result) {
        console.log('🔧 App: Twitter authentication successful');
        
        // Wait for React state to update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('🔧 App: Current auth state after Twitter login (after delay):', { isAuthenticated, user, principal });
        console.log('🔧 App: isAuthenticated value:', isAuthenticated);
        console.log('🔧 App: user value:', user);
        
        setIsDemoMode(false);
        
        // Force a re-render to check auth state
        console.log('🔧 App: Forcing re-render to check auth state...');
      } else {
        console.log('🔄 Twitter OAuth redirect initiated, user will be redirected back');
        // Don't set demo mode to false for redirect case
      }
    } catch (err) {
      console.error('🔧 App: Twitter login failed:', err);
      alert(`Twitter login failed: ${err.message || 'Unknown error'}`);
    }
  };

  const handleGoogleSignIn = async (credentialResponse: any) => {
    console.log('🔧 App: handleGoogleSignIn called with:', credentialResponse);
    
    try {
      // Simple, direct approach - no timeouts, no complex error handling
      const result = await signInWithGoogle(credentialResponse);
      
      if (result) {
        console.log('🔧 App: Google authentication successful:', result);
        setIsDemoMode(false);
        console.log('🔧 Google OAuth completed successfully');
      }
    } catch (err) {
      console.error('🔧 App: Google login failed:', err);
      alert(`Google login failed: ${err.message || 'Unknown error'}`);
    }
  };




  // ✅ STREAMLINED FLOW: Only 3 states needed
  
  // 1. Initial loading
  if (isLoading) {
    return (
      <>
        <GlobalStyle />
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Connecting to Bitcoin Options Platform...</LoadingText>
          <LiquidityBadge>Liquidity Pool Model</LiquidityBadge>
        </LoadingContainer>
      </>
    );
  }

  // 2. Landing page for unauthenticated users (not in demo mode)
  console.log('🔧 App: Render decision - isAuthenticated:', isAuthenticated, 'isDemoMode:', isDemoMode);
  if (!isAuthenticated && !isDemoMode) {
    console.log('🔧 App: Rendering LandingPage because !isAuthenticated && !isDemoMode');
    return (
      <>
        <GlobalStyle />
        <LandingPage 
          onGetStarted={handleGetStarted} 
          onTryDemo={handleTryDemo}
          onTwitterSignIn={handleTwitterSignIn}
          onGoogleSignIn={handleGoogleSignIn}
        />
      </>
    );
  }

      // 3. Main trading interface (authenticated OR demo mode)
      console.log('🚀 Rendering main trading interface!');
      console.log('🔧 App: Auth state when rendering trading interface:', { isAuthenticated, user, principal });
      return (
        <>
          <GlobalStyle />
          <ToastProvider />
          <TradingPanel 
            onLogout={async () => {
              await logout();
              setIsDemoMode(false); // Reset demo mode on logout
            }} 
            isDemoMode={isDemoMode}
            onConnectWallet={handleGetStarted}
          />
        </>
      );
};

export const App: React.FC = () => {
  return (
    <CanisterProvider>
      <AuthProvider>
        <BalanceProvider>
          <TradeProvider>
            <AppContent />
          </TradeProvider>
        </BalanceProvider>
      </AuthProvider>
    </CanisterProvider>
  );
};
