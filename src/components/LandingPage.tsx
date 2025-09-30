import React from 'react';
import styled from 'styled-components';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

const LandingContainer = styled.div`
  min-height: 100vh;
  background: var(--bg-panel);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 2rem;
  overflow-y: auto;
  overflow-x: hidden;

  @media (max-width: 767px) {
    justify-content: flex-start;
    padding: 1rem;
    padding-top: 2rem;
    min-height: auto;
    height: auto;
  }
`;

const MainHeading = styled.h1`
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 2rem 0;
  line-height: 1.2;
  white-space: nowrap;

  @media (min-width: 768px) {
    font-size: 1.1rem;
  }
`;

const LogoContainer = styled.div`
  margin-bottom: 3rem;
  display: flex;
  justify-content: center;
  align-items: center;

  @media (max-width: 480px) {
    margin-bottom: 2rem;
  }
`;

const Logo = styled.img`
  height: 80px;
  width: auto;
  max-width: 300px;
  object-fit: contain;

  @media (min-width: 768px) {
    height: 100px;
  }

  @media (max-width: 480px) {
    height: 60px;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 3rem;

  @media (max-width: 480px) {
    margin-bottom: 2rem;
    gap: 0.6rem;
  }
`;

const OrSeparator = styled.div`
  font-size: 0.9rem;
  color: var(--text-dim);
  margin: 0.5rem 0;
  font-weight: 500;
`;

const PrimaryButton = styled.button`
  padding: 1rem 2.5rem;
  background: linear-gradient(90deg, #f4d03f 0%, #87ceeb 100%);
  color: var(--bg-primary);
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(244, 208, 63, 0.3);
  width: 100%;
  max-width: 280px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(244, 208, 63, 0.4);
  }

  @media (min-width: 768px) {
    font-size: 1.1rem;
    padding: 1.25rem 3rem;
    max-width: 320px;
  }

  @media (max-width: 480px) {
    font-size: 0.9rem;
    padding: 0.9rem 2rem;
  }
`;

const SecondaryButton = styled.button`
  padding: 0.9rem 2rem;
  background: transparent;
  color: #87ceeb;
  border: 2px solid #87ceeb;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  max-width: 280px;

  &:hover {
    background: rgba(135, 206, 235, 0.1);
    transform: translateY(-1px);
  }

  @media (min-width: 768px) {
    font-size: 1rem;
    padding: 1rem 2.5rem;
    max-width: 320px;
  }

  @media (max-width: 480px) {
    font-size: 0.85rem;
    padding: 0.8rem 1.5rem;
  }
`;

const TwitterButton = styled.button`
  padding: 0.9rem 2rem;
  background: #000000;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  max-width: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background: #1a1a1a;
    transform: translateY(-1px);
  }

  @media (min-width: 768px) {
    font-size: 1rem;
    padding: 1rem 2.5rem;
    max-width: 320px;
  }

  @media (max-width: 480px) {
    font-size: 0.85rem;
    padding: 0.8rem 1.5rem;
  }
`;


const IconWrapper = styled.span`
  font-size: 1.1rem;
`;

const DescriptionContainer = styled.div`
  margin-bottom: 3rem;
  max-width: 600px;
  padding: 0 1rem;

  @media (max-width: 480px) {
    margin-bottom: 2rem;
  }
`;

const DescriptionText = styled.p`
  font-size: 0.9rem;
  color: var(--text);
  margin: 0 0 0.8rem 0;
  line-height: 1.5;

  &:last-child {
    margin-bottom: 0;
  }

  @media (min-width: 768px) {
    font-size: 1rem;
  }

  @media (max-width: 480px) {
    font-size: 0.85rem;
    margin-bottom: 0.6rem;
  }
`;

const FeaturesContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 0 1rem;

  @media (min-width: 768px) {
    flex-direction: row;
    gap: 3rem;
  }

  @media (max-width: 480px) {
    gap: 1rem;
  }
`;

const FeatureItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

const FeatureIcon = styled.div`
  font-size: 2rem;
  color: #f4d03f;
  margin-bottom: 0.5rem;

  @media (min-width: 768px) {
    font-size: 2.5rem;
  }
`;

const FeatureWord = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);

  @media (min-width: 768px) {
    font-size: 1.1rem;
  }
`;

interface LandingPageProps {
  onGetStarted: () => void;
  onTryDemo: () => void;
  onTwitterSignIn: () => void;
  onGoogleSignIn: (credentialResponse: CredentialResponse) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onTryDemo, onTwitterSignIn, onGoogleSignIn }) => {
  // Debug environment variables
  console.log('🔍 Environment variables debug:', {
    REACT_APP_TWITTER_CLIENT_ID: import.meta.env.VITE_TWITTER_CLIENT_ID || process.env['REACT_APP_TWITTER_CLIENT_ID'],
    REACT_APP_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || process.env['REACT_APP_GOOGLE_CLIENT_ID'],
    NODE_ENV: process.env['NODE_ENV'],
    allEnvVars: Object.keys(process.env).filter(key => key.startsWith('REACT_APP_'))
  });

  // Check if Google OAuth is properly configured
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || process.env['REACT_APP_GOOGLE_CLIENT_ID'] || '255794166358-poj0rbu2bqtd663m9nsu6hfam6hd0661.apps.googleusercontent.com';
  const isGoogleConfigured = googleClientId && 
    googleClientId !== 'your-google-client-id.apps.googleusercontent.com' &&
    googleClientId.includes('.apps.googleusercontent.com');
  
  console.log('🔍 Google OAuth configuration check:', {
    googleClientId,
    isGoogleConfigured,
    hasViteEnv: !!import.meta.env.VITE_GOOGLE_CLIENT_ID,
    hasProcessEnv: !!process.env['REACT_APP_GOOGLE_CLIENT_ID']
  });

  return (
    <LandingContainer>
      <MainHeading>Trade BTC Micro Options</MainHeading>
      
      <LogoContainer>
        <Logo src="/images/attiminlogo.png" alt="Atticus" />
      </LogoContainer>

      <ButtonContainer>
        <PrimaryButton onClick={onGetStarted}>
          Connect ICP Identity
        </PrimaryButton>
        <OrSeparator>or</OrSeparator>
            <TwitterButton onClick={onTwitterSignIn}>
              <IconWrapper style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>𝕏</IconWrapper>
              Sign in with X
            </TwitterButton>
            {isGoogleConfigured ? (
              <div>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.8rem', color: '#666' }}>
                  Google OAuth Button (Debug) - isGoogleConfigured: {isGoogleConfigured.toString()}
                </div>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.8rem', color: '#666' }}>
                  Google Client ID: {googleClientId ? `${googleClientId.substring(0, 20)}...` : 'Not found'}
                </div>
                <GoogleLogin
                  onSuccess={(credentialResponse) => {
                    console.log('🔧 LandingPage: Google OAuth success callback triggered:', credentialResponse);
                    console.log('🔧 LandingPage: Calling onGoogleSignIn with:', credentialResponse);
                    try {
                      onGoogleSignIn(credentialResponse);
                    } catch (error) {
                      console.error('🔧 LandingPage: Error in onGoogleSignIn callback:', error);
                    }
                  }}
                  onError={(error) => {
                    console.error('🔧 LandingPage: Google OAuth failed:', error);
                    console.error('🔧 LandingPage: Error details:', {
                      error,
                      type: typeof error,
                      message: error?.message,
                      stack: error?.stack
                    });
                  }}
                  theme="outline"
                  size="large"
                  text="signin_with"
                  shape="rectangular"
                  logo_alignment="left"
                  width="280"
                  useOneTap={false}
                  ux_mode="popup"
                />
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#666' }}>
                  If Google button doesn't work, try refreshing the page
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <button 
                    onClick={() => {
                      console.log('🔧 Fallback Google OAuth button clicked');
                      alert('Google OAuth fallback button clicked - this would normally redirect to Google');
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#4285f4',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    🔧 Fallback Google OAuth
                  </button>
                </div>
              </div>
            ) : (
          <div style={{ 
            padding: '0.9rem 2rem', 
            background: '#f0f0f0', 
            color: '#666', 
            border: '2px solid #ddd', 
            borderRadius: '12px', 
            textAlign: 'center',
            maxWidth: '280px',
            fontSize: '0.95rem'
          }}>
            Google OAuth Not Configured
          </div>
        )}
        <OrSeparator>or</OrSeparator>
        <SecondaryButton onClick={onTryDemo}>
          Try Demo First
        </SecondaryButton>
      </ButtonContainer>

      <DescriptionContainer>
        <DescriptionText>Professional Bitcoin options trading on Internet Computer</DescriptionText>
        <DescriptionText>Fully decentralized on Internet Computer ♾️</DescriptionText>
        <DescriptionText>Your control. Your Keys and Funds.</DescriptionText>
      </DescriptionContainer>

      <FeaturesContainer>
        <FeatureItem>
          <FeatureIcon>🛡️</FeatureIcon>
          <FeatureWord>Secure</FeatureWord>
        </FeatureItem>
        <FeatureItem>
          <FeatureIcon>⚡</FeatureIcon>
          <FeatureWord>Instant</FeatureWord>
        </FeatureItem>
        <FeatureItem>
          <FeatureIcon>🎯</FeatureIcon>
          <FeatureWord>Decentralized</FeatureWord>
        </FeatureItem>
      </FeaturesContainer>
    </LandingContainer>
  );
};
