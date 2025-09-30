// Import polyfills first
import './polyfills';

import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { App } from './components/App.tsx'


// Google OAuth Client ID - only use if properly configured
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || process.env['REACT_APP_GOOGLE_CLIENT_ID'] || '255794166358-poj0rbu2bqtd663m9nsu6hfam6hd0661.apps.googleusercontent.com';
const isValidGoogleClientId = GOOGLE_CLIENT_ID && 
  GOOGLE_CLIENT_ID !== 'your-google-client-id.apps.googleusercontent.com' &&
  GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com');

console.log('🔧 Google OAuth Configuration:', {
  hasClientId: !!GOOGLE_CLIENT_ID,
  isValidFormat: isValidGoogleClientId,
  clientId: GOOGLE_CLIENT_ID ? `${GOOGLE_CLIENT_ID.substring(0, 20)}...` : 'Not configured'
});

const AppWrapper: React.FC = () => {
  if (isValidGoogleClientId) {
    return (
      <GoogleOAuthProvider 
        clientId={GOOGLE_CLIENT_ID}
        onScriptLoadError={() => console.error('❌ Google OAuth script failed to load')}
        onScriptLoadSuccess={() => console.log('✅ Google OAuth script loaded successfully')}
      >
        <App />
      </GoogleOAuthProvider>
    );
  }
  
  console.warn('⚠️ Google OAuth not configured - Google sign-in will be disabled');
  return <App />;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>,
)
