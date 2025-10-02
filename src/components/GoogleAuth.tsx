import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const AuthContainer = styled.div`
  text-align: center;
  padding: 2rem 0;
`;

const AuthTitle = styled.h3`
  color: var(--text);
  margin-bottom: 1rem;
  font-size: 1.25rem;
  font-weight: 600;
`;

const AuthDescription = styled.p`
  color: var(--text-dim);
  margin-bottom: 2rem;
  line-height: 1.5;
`;

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

interface GoogleAuthProps {
  onSuccess: (credentialResponse: any) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
}

// Declare Google Identity Services types
declare global {
  interface Window {
    google: any;
  }
}

export const GoogleAuth: React.FC<GoogleAuthProps> = ({
  onSuccess,
  onError
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  // Load Google Identity Services script
  useEffect(() => {
    const loadGoogleScript = () => {
      if (window.google) {
        setIsGoogleLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('✅ Google Identity Services loaded');
        setIsGoogleLoaded(true);
      };
      script.onerror = () => {
        console.error('❌ Failed to load Google Identity Services');
        onError('Failed to load Google authentication. Please refresh the page.');
      };
      document.head.appendChild(script);
    };

    loadGoogleScript();
  }, [onError]);

  const handleGoogleSignIn = () => {
    if (!isGoogleLoaded || !window.google) {
      onError('Google authentication not ready. Please wait and try again.');
      return;
    }

    try {
      setIsConnecting(true);
      onError(''); // Clear any previous errors

      console.log('🔄 Starting direct Google OAuth flow...');

      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!googleClientId) {
        throw new Error('Google Client ID not configured');
      }

      // Initialize Google Identity Services
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCallback,
        auto_select: false,
        cancel_on_tap_outside: true
      });

      // Show the Google sign-in popup
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('Google sign-in was not displayed or skipped');
          setIsConnecting(false);
        }
      });

    } catch (error) {
      console.error('❌ Google sign-in failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Google authentication failed';
      onError(errorMessage);
      setIsConnecting(false);
    }
  };

  const handleGoogleCallback = (response: any) => {
    try {
      console.log('🔍 Google OAuth credential received:', response);
      console.log('🔍 Google OAuth will create ICP Principal and wallet');
      
      // Create a credential response object that matches the expected format
      const credentialResponse = {
        credential: response.credential
      };
      
      onSuccess(credentialResponse);
    } catch (error) {
      console.error('❌ Google callback failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Google authentication failed';
      onError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <AuthContainer>
      <AuthTitle>Sign in with Google</AuthTitle>
      <AuthDescription>
        Connect your Google account to access the platform.
        Your Google identity will be linked to a secure ICP Principal and wallet will be created automatically.
      </AuthDescription>
      
      <button
        onClick={handleGoogleSignIn}
        disabled={isConnecting || !isGoogleLoaded}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '12px 24px',
          background: '#fff',
          border: '1px solid #dadce0',
          borderRadius: '4px',
          color: '#3c4043',
          fontSize: '14px',
          fontWeight: '500',
          cursor: (isConnecting || !isGoogleLoaded) ? 'not-allowed' : 'pointer',
          width: '280px',
          height: '40px',
          opacity: (isConnecting || !isGoogleLoaded) ? 0.6 : 1,
          margin: '0 auto'
        }}
      >
        {isConnecting ? (
          <>
            <LoadingSpinner style={{ marginRight: '0.5rem', display: 'inline-block' }} />
            Connecting...
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </>
        )}
      </button>
      
      {isConnecting && (
        <div style={{ marginTop: '1rem', color: 'var(--text-dim)' }}>
          <LoadingSpinner style={{ marginRight: '0.5rem', display: 'inline-block' }} />
          Creating ICP identity and wallet...
        </div>
      )}
      
      {!isGoogleLoaded && (
        <div style={{ marginTop: '1rem', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
          Loading Google authentication...
        </div>
      )}
    </AuthContainer>
  );
};