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
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  console.log('🎉 ========== REACT-OAUTH GOOGLE LOGIN SUCCESS ==========');
                  console.log('🔧 Credential response:', credentialResponse);
                  
                  try {
                    console.log('🔧 Calling onGoogleSignIn immediately...');
                    onGoogleSignIn(credentialResponse);
                    console.log('✅ onGoogleSignIn called successfully');
                  } catch (error) {
                    console.error('❌ Google OAuth callback error:', error);
                  }
                }}
                onError={(error) => {
                  console.error('❌ Google OAuth failed via react-oauth:', error);
                }}
                theme="outline"
                size="large"
                text="signin_with"
                shape="rectangular"
                logo_alignment="left"
                width="280"
                useOneTap={false}
                auto_select={false}
                cancel_on_tap_outside={true}
                ux_mode="redirect"
                redirect_uri={window.location.origin}
              />
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
