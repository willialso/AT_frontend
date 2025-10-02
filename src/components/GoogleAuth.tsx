import React, { useState } from 'react';
import styled from 'styled-components';
import { CredentialResponse } from '@react-oauth/google';

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
  onSuccess: (credentialResponse: CredentialResponse) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
}

export const GoogleAuth: React.FC<GoogleAuthProps> = ({
  onSuccess,
  onError
}) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
    try {
      setIsConnecting(true);
      onError(''); // Clear any previous errors
      
      console.log('🔍 Google OAuth credential received:', credentialResponse);
      onSuccess(credentialResponse);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google authentication failed';
      onError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleGoogleError = () => {
    onError('Google authentication failed. Please try again.');
    setIsConnecting(false);
  };

  const handleCustomGoogleAuth = async () => {
    try {
      setIsConnecting(true);
      onError(''); // Clear any previous errors
      
      console.log('🔄 Starting custom Google OAuth flow...');
      
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!googleClientId) {
        throw new Error('Google Client ID not configured');
      }
      
      // Create a custom Google OAuth URL
      const redirectUri = encodeURIComponent(window.location.origin);
      const scope = encodeURIComponent('openid email profile');
      const responseType = 'code';
      const state = Math.random().toString(36).substring(7);
      
      // Store state for verification
      sessionStorage.setItem('google_oauth_state', state);
      
      const authUrl = `https://accounts.google.com/oauth/authorize?` +
        `client_id=${googleClientId}&` +
        `redirect_uri=${redirectUri}&` +
        `scope=${scope}&` +
        `response_type=${responseType}&` +
        `state=${state}&` +
        `access_type=offline&` +
        `prompt=select_account`;
      
      console.log('🔄 Redirecting to Google OAuth:', authUrl);
      
      // Redirect to Google OAuth
      window.location.href = authUrl;
      
    } catch (error) {
      console.error('❌ Custom Google OAuth failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Google authentication failed';
      onError(errorMessage);
      setIsConnecting(false);
    }
  };

  return (
    <AuthContainer>
      <AuthTitle>Sign in with Google</AuthTitle>
      <AuthDescription>
        Connect your Google account to access the platform.
        Your Google identity will be linked to a secure ICP Principal.
      </AuthDescription>
      
      <button
        onClick={handleCustomGoogleAuth}
        disabled={isConnecting}
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
          cursor: isConnecting ? 'not-allowed' : 'pointer',
          width: '280px',
          height: '40px',
          opacity: isConnecting ? 0.6 : 1
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
          Redirecting to Google...
        </div>
      )}
    </AuthContainer>
  );
};