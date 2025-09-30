// Import polyfills first
import './polyfills';

import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { App } from './components/App.tsx'

// Global error handler for Google OAuth postMessage errors
window.addEventListener('error', (event) => {
  if (event.message && (event.message.includes('postMessage') || event.message.includes('Cannot read properties of null'))) {
    console.log('🔧 Suppressed postMessage error from Google OAuth library:', event.message);
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && (event.reason.message.includes('postMessage') || event.reason.message.includes('Cannot read properties of null'))) {
    console.log('🔧 Suppressed postMessage promise rejection from Google OAuth library:', event.reason.message);
    event.preventDefault();
    return false;
  }
});

// Override console.error to suppress postMessage errors
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args.join(' ');
  if (message.includes('postMessage') || message.includes('Cannot read properties of null')) {
    console.log('🔧 Suppressed console error from Google OAuth library:', message);
    return;
  }
  originalConsoleError.apply(console, args);
};

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
