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
  // Check if Google OAuth is properly configured
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || process.env['REACT_APP_GOOGLE_CLIENT_ID'] || '255794166358-poj0rbu2bqtd663m9nsu6hfam6hd0661.apps.googleusercontent.com';
  const isGoogleConfigured = googleClientId && 
    googleClientId !== 'your-google-client-id.apps.googleusercontent.com' &&
    googleClientId.includes('.apps.googleusercontent.com');

  // Initialize Google OAuth once when component mounts
  React.useEffect(() => {
    if (isGoogleConfigured && window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response: any) => {
          console.log('🔧 Google OAuth callback triggered:', response);
          try {
            onGoogleSignIn(response);
          } catch (error) {
            console.error('Google OAuth callback error:', error);
          }
        }
      });
    }
  }, [isGoogleConfigured, googleClientId, onGoogleSignIn]);
  

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
              <button 
                onClick={() => {
                  if (window.google && window.google.accounts && window.google.accounts.id) {
                    window.google.accounts.id.prompt();
                  } else {
                    alert('Google OAuth library not loaded');
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 24px',
                  background: 'white',
                  border: '1px solid #dadce0',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#3c4043',
                  width: '280px',
                  height: '40px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease',
                  fontFamily: 'Roboto, sans-serif'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '12px' }}>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>
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
