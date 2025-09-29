import { Principal } from '@dfinity/principal';

export interface TwitterUser {
  principal: Principal;
  twitterId: string;
  username: string;
  name?: string;
  email?: string;
  avatar?: string;
  isAuthenticated: boolean;
}

export class TwitterAuth {
  private user: TwitterUser | null = null;

  /**
   * Check for mobile OAuth callback in URL parameters
   */
  async checkMobileCallback(): Promise<TwitterUser | null> {
    const urlParams = new URLSearchParams(window.location.search);
    const twitterAuth = urlParams.get('twitter_auth');
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    
    console.log('🔍 Checking for mobile callback, URL params:', window.location.search);
    console.log('🔍 Current URL:', window.location.href);
    console.log('🔍 Twitter OAuth params:', { twitterAuth, code, state, error });
    
    if (error) {
      console.error('❌ Twitter OAuth error:', error);
      return null;
    }
    
    // Handle both direct callback and twitter_auth parameter
    let authCode: string | null = null;
    let authState: string | null = null;
    
    if (twitterAuth) {
      try {
        const authData = JSON.parse(decodeURIComponent(twitterAuth));
        console.log('📱 Twitter OAuth callback via twitter_auth parameter:', authData);
        authCode = authData.code;
        authState = authData.state;
      } catch (error) {
        console.error('❌ Failed to parse twitter_auth parameter:', error);
        return null;
      }
    } else if (code && state) {
      console.log('📱 Twitter OAuth callback via direct parameters:', { code, state });
      authCode = code;
      authState = state;
    }
    
    if (authCode && authState) {
      try {
        // Verify state matches what we stored
        const storedState = sessionStorage.getItem('twitter_oauth_state');
        console.log('🔍 State verification:', { authState, storedState, match: authState === storedState });
        
        if (authState !== storedState) {
          console.error('❌ Twitter OAuth state mismatch');
          return null;
        }
        
        console.log('📱 Mobile Twitter OAuth callback detected:', { code: authCode, state: authState });
        
        // Clean up URL and session storage
        window.history.replaceState({}, document.title, window.location.pathname);
        sessionStorage.removeItem('twitter_oauth_state');
        sessionStorage.removeItem('twitter_oauth_code_challenge');
        
        // Handle the callback
        const result = await this.handleTwitterCallback(authCode, authState);
        console.log('✅ Twitter OAuth callback completed successfully:', result);
        return result;
      } catch (error) {
        console.error('❌ Mobile callback handling failed:', error);
        return null;
      }
    }
    
    console.log('🔍 No Twitter OAuth callback found');
    return null;
  }

  /**
   * Sign in with Twitter/X OAuth using OAuth 2.0 PKCE flow
   */
  async signInWithTwitter(): Promise<TwitterUser> {
    try {
      console.log('🐦 Starting Twitter OAuth 2.0 PKCE flow via proxy server...');
      
      // Get auth URL from our proxy server with correct redirect URI
      const redirectUri = `${window.location.origin}/twitter-callback`;
      const proxyUrl = `https://twitter-oauth-8z0l.onrender.com/twitter/auth?redirect_uri=${encodeURIComponent(redirectUri)}`;
      console.log('🔧 Twitter OAuth proxy URL:', proxyUrl);
      console.log('🔧 Twitter OAuth redirect URI:', redirectUri);
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to get auth URL: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const authData = await response.json();
      console.log('🔧 Twitter OAuth Config from proxy:', authData);

      // Detect mobile devices
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // For mobile, use redirect approach instead of popup
        console.log('📱 Mobile detected, using redirect approach for Twitter OAuth');
        
        // Store state for verification
        sessionStorage.setItem('twitter_oauth_state', authData.state);
        sessionStorage.setItem('twitter_oauth_code_challenge', authData.codeChallenge);
        
        // Redirect to Twitter OAuth (will redirect back to our app)
        window.location.href = authData.authUrl;
        
        // This will never resolve as the page will redirect
        // The callback will be handled by checkMobileCallback()
        throw new Error('Redirecting to Twitter OAuth...');
      }

      // Try popup first, fallback to redirect if blocked
      const popup = window.open(
        authData.authUrl,
        'twitter-oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        console.log('⚠️ Popup blocked, falling back to redirect approach');
        
        // Store state for verification
        sessionStorage.setItem('twitter_oauth_state', authData.state);
        sessionStorage.setItem('twitter_oauth_code_challenge', authData.codeChallenge);
        
        // Redirect to Twitter OAuth (will redirect back to our app)
        window.location.href = authData.authUrl;
        
        // This will never resolve as the page will redirect
        // The callback will be handled by checkMobileCallback()
        throw new Error('Redirecting to Twitter OAuth...');
      }

      // Wait for popup to complete OAuth
      return new Promise<TwitterUser>((resolve, reject) => {
        let isCompleted = false;
        
        const messageHandler = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;

          if (event.data.type === 'TWITTER_OAUTH_CALLBACK') {
            isCompleted = true;
            window.removeEventListener('message', messageHandler);
            clearInterval(checkClosed);
            
            // Handle the callback
            this.handleTwitterCallback(event.data.code, event.data.state)
              .then(resolve)
              .catch(reject);
          } else if (event.data.type === 'TWITTER_OAUTH_ERROR') {
            isCompleted = true;
            window.removeEventListener('message', messageHandler);
            clearInterval(checkClosed);
            reject(new Error(event.data.error));
          }
        };

        window.addEventListener('message', messageHandler);

        // Handle popup closed manually (only if not completed)
        const checkClosed = setInterval(() => {
          if (popup.closed && !isCompleted) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageHandler);
            reject(new Error('Twitter OAuth cancelled by user'));
          }
        }, 1000);
      });
      
    } catch (error) {
      console.error('❌ Twitter OAuth initiation failed:', error);
      throw error;
    }
  }

  /**
   * Handle Twitter OAuth callback (called after redirect)
   */
  async handleTwitterCallback(code: string, state: string): Promise<TwitterUser> {
    try {
      console.log('🐦 Handling Twitter OAuth callback...');
      
      // Exchange authorization code for access token via proxy server
      const tokenData = await this.exchangeCodeForToken(code, state);
      
      // Generate deterministic Principal from Twitter ID
      const principal = this.generatePrincipalFromTwitterId(tokenData.user.id);

      this.user = {
        principal,
        twitterId: tokenData.user.id,
        username: tokenData.user.username,
        name: tokenData.user.name,
        avatar: tokenData.user.profile_image_url,
        isAuthenticated: true
      };

      console.log('✅ Real Twitter authentication successful:', {
        principal: principal.toString(),
        twitterId: tokenData.user.id,
        username: tokenData.user.username
      });

      return this.user;
    } catch (error) {
      console.error('❌ Twitter OAuth callback failed:', error);
      throw error;
    }
  }


  /**
   * Exchange authorization code for access token via our proxy server
   */
  private async exchangeCodeForToken(code: string, state: string): Promise<{ access_token: string; user: any }> {
    console.log('🔄 Exchanging code for token via proxy server...', {
      codeLength: code.length,
      state
    });
    
    try {
      // Use our Node.js proxy server
      const proxyUrl = 'https://twitter-oauth-8z0l.onrender.com/twitter/token';
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          code,
          state
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Token exchange failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Token exchange failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log('✅ Token exchange successful via proxy server:', data);
      
      // Validate that we have an access_token and user data
      if (!data || !data.access_token) {
        console.error('❌ No access_token in response:', data);
        throw new Error('No access_token received from proxy server');
      }
      
      return data;
    } catch (error) {
      console.error('❌ Token exchange error:', error);
      throw error;
    }
  }


  /**
   * Generate deterministic Principal from Twitter ID (using shorter 8-byte approach)
   */
  private generatePrincipalFromTwitterId(twitterId: string): Principal {
    // Create a deterministic seed from Twitter ID
    const seed = `twitter:${twitterId}:icp-derivation-mainnet`;
    const seedHash = this.hashString(seed);
    
    // Convert hash to a shorter byte array (8 bytes for shorter Principal)
    const seedBytes = new Uint8Array(8);
    for (let i = 0; i < 8; i++) {
      seedBytes[i] = (seedHash >> (i * 8)) & 0xFF;
    }
    
    // Generate Principal from shorter bytes
    return Principal.fromUint8Array(seedBytes);
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get current Twitter user
   */
  getCurrentUser(): TwitterUser | null {
    return this.user;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.user?.isAuthenticated || false;
  }

  /**
   * Logout Twitter user
   */
  logout(): void {
    this.user = null;
    console.log('🔌 Twitter user logged out');
  }
}

// Export singleton instance
export const twitterAuth = new TwitterAuth();
