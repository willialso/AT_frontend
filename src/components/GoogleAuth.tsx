import React, { useState } from 'react';
import styled from 'styled-components';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

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
      console.log('🔍 Google OAuth will create ICP Principal and wallet');
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

  return (
    <AuthContainer>
      <AuthTitle>Sign in with Google</AuthTitle>
      <AuthDescription>
        Connect your Google account to access the platform.
        Your Google identity will be linked to a secure ICP Principal and wallet will be created automatically.
      </AuthDescription>
      
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        theme="outline"
        size="large"
        text="signin_with"
        shape="rectangular"
        logo_alignment="left"
        width="280"
        useOneTap={false}
      />
      
      {isConnecting && (
        <div style={{ marginTop: '1rem', color: 'var(--text-dim)' }}>
          <LoadingSpinner style={{ marginRight: '0.5rem', display: 'inline-block' }} />
          Creating ICP identity and wallet...
        </div>
      )}
    </AuthContainer>
  );
};