import { Principal } from '@dfinity/principal';
import { AuthClient } from '@dfinity/auth-client';
import { twitterAuth } from './twitterAuth';
import { googleAuth } from './googleAuth';
import { GoogleCredentialResponse } from '@react-oauth/google';

export type AuthMethod = 'icp' | 'twitter' | 'google';

export interface UnifiedUser {
  principal: Principal;
  authMethod: AuthMethod;
  isAuthenticated: boolean;
  // Additional data based on auth method
  twitterId?: string;
  username?: string;
  googleId?: string;
  email?: string;
  name?: string;
  avatar?: string;
}

export class UnifiedAuth {
  private user: UnifiedUser | null = null;
  private authClient: AuthClient | null = null;
  private currentAuthMethod: AuthMethod | null = null;
  private isInitialized: boolean = false;
  public shouldStartWalletGeneration: boolean = false;

  /**
   * Initialize authentication client
   */
  async initialize(): Promise<void> {
    // Prevent multiple initializations
    if (this.isInitialized) {
      console.log('✅ Unified auth already initialized, skipping...');
      return;
    }

    try {
      // Configure auth client for off-chain frontend
      this.authClient = await AuthClient.create();
      
      // Check for mobile OAuth callbacks
      console.log('🔍 Checking for mobile OAuth callbacks...');
      
      // Check Twitter OAuth callback
      const mobileTwitterCallback = await twitterAuth.checkMobileCallback();
      if (mobileTwitterCallback) {
        console.log('📱 Mobile Twitter callback user found:', mobileTwitterCallback);
        this.user = {
          principal: mobileTwitterCallback.principal,
          authMethod: 'twitter',
          isAuthenticated: true,
          twitterId: mobileTwitterCallback.twitterId,
          username: mobileTwitterCallback.username,
          name: mobileTwitterCallback.name || '',
          avatar: mobileTwitterCallback.avatar || ''
        };
        this.currentAuthMethod = 'twitter';
        console.log('✅ Mobile Twitter OAuth callback processed, user set:', this.user);
        
        // ✅ FIXED: Set a flag to indicate wallet generation should start
        this.shouldStartWalletGeneration = true;
        console.log('🏦 Mobile Twitter callback - wallet generation should start');
      } else {
        console.log('🔍 No mobile Twitter OAuth callback found');
      }
      
      // Note: Google OAuth uses popup mode via @react-oauth/google library
      
      this.isInitialized = true;
      console.log('✅ Unified auth initialized');
    } catch (error) {
      console.error('❌ Failed to initialize unified auth:', error);
      throw error;
    }
  }

  /**
   * Sign in with ICP Identity (using redirect - no popups)
   */
  async signInWithICP(): Promise<UnifiedUser | null> {
    console.log('🔧 Starting ICP Identity authentication...');
    
    try {
      if (!this.authClient) {
        await this.initialize();
      }

      // Check if already authenticated (returning from Internet Identity)
      const isAuthenticated = await this.authClient!.isAuthenticated();
      console.log('🔍 Already authenticated?', isAuthenticated);
      
      if (isAuthenticated) {
        const identity = this.authClient!.getIdentity();
        const principal = identity.getPrincipal();
        
        console.log('🔍 Principal:', principal.toString());
        console.log('🔍 Is anonymous?', principal.isAnonymous());
        
        if (!principal.isAnonymous()) {
          // Real authenticated principal
          this.user = {
            principal,
            authMethod: 'icp',
            isAuthenticated: true
          };

          this.currentAuthMethod = 'icp';

          console.log('✅ ICP Identity authentication successful');
          return this.user;
        } else {
          // Clear anonymous session
          await this.authClient!.logout();
        }
      }
      
      // Start authentication - this will redirect to Internet Identity
      console.log('🔄 Redirecting to Internet Identity...');
      
      // Trigger login - this redirects the page
      this.authClient!.login({
        identityProvider: 'https://identity.ic0.app',
        maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000), // 7 days
        onSuccess: () => {
          console.log('✅ ICP login success callback');
        }
      });
      
      // Return null since we're redirecting
      return null;
      
    } catch (error) {
      console.error('❌ ICP Identity authentication error:', error);
      throw error instanceof Error ? error : new Error('ICP Identity authentication failed');
    }
  }

  /**
   * Sign in with Twitter/X
   */
  async signInWithTwitter(): Promise<UnifiedUser> {
    try {
      const twitterUser = await twitterAuth.signInWithTwitter();

      this.user = {
        principal: twitterUser.principal,
        authMethod: 'twitter',
        isAuthenticated: true,
        twitterId: twitterUser.twitterId,
        username: twitterUser.username,
        ...(twitterUser.name && { name: twitterUser.name }),
        ...(twitterUser.email && { email: twitterUser.email }),
        ...(twitterUser.avatar && { avatar: twitterUser.avatar })
      };

      this.currentAuthMethod = 'twitter';

      console.log('✅ Twitter authentication successful:', {
        principal: twitterUser.principal.toString(),
        authMethod: 'twitter',
        twitterId: twitterUser.twitterId,
        username: twitterUser.username
      });

      return this.user!;
    } catch (error) {
      // Handle redirect case gracefully
      if (error.message && error.message.includes('Redirecting to Twitter OAuth')) {
        console.log('🔄 Twitter OAuth redirect initiated, user will be redirected back');
        // Don't throw error for redirect case, just return null
        // The callback will be handled by checkMobileCallback()
        return null as any;
      }
      
      console.error('❌ Twitter authentication failed:', error);
      throw error;
    }
  }



  /**
   * Sign in with Google using real OAuth
   */
  async signInWithGoogle(credentialResponse: GoogleCredentialResponse): Promise<UnifiedUser> {
    try {
      const googleUser = await googleAuth.signInWithGoogle(credentialResponse);

      this.user = {
        principal: googleUser.principal,
        authMethod: 'google',
        isAuthenticated: true,
        googleId: googleUser.googleId,
        email: googleUser.email,
        ...(googleUser.name && { name: googleUser.name }),
        ...(googleUser.picture && { avatar: googleUser.picture })
      };

      this.currentAuthMethod = 'google';

      console.log('✅ Google authentication successful:', {
        principal: googleUser.principal.toString(),
        authMethod: 'google',
        googleId: googleUser.googleId,
        email: googleUser.email
      });

      return this.user!;
    } catch (error) {
      console.error('❌ Google authentication failed:', error);
      throw error;
    }
  }


  /**
   * Get current user
   */
  getCurrentUser(): UnifiedUser | null {
    return this.user;
  }

  /**
   * Check if auth is initialized
   */
  isAuthInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.user?.isAuthenticated || false;
  }

  /**
   * Get current authentication method
   */
  getCurrentAuthMethod(): AuthMethod | null {
    return this.currentAuthMethod;
  }

  /**
   * Check if authenticated with ICP
   */
  isICPAuthenticated(): boolean {
    return this.currentAuthMethod === 'icp' && this.isAuthenticated();
  }

  /**
   * Check if authenticated with Twitter
   */
  isTwitterAuthenticated(): boolean {
    return this.currentAuthMethod === 'twitter' && this.isAuthenticated();
  }

  /**
   * Check if authenticated with Google
   */
  isGoogleAuthenticated(): boolean {
    return this.currentAuthMethod === 'google' && this.isAuthenticated();
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Logout from current auth method
      switch (this.currentAuthMethod) {
        case 'icp':
          if (this.authClient) {
            await this.authClient.logout();
          }
          break;
        case 'twitter':
          twitterAuth.logout();
          break;
        case 'google':
          googleAuth.logout();
          break;
      }

      // Clear user state
      this.user = null;
      this.currentAuthMethod = null;

      console.log('🔌 User logged out from all authentication methods');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Still clear state even if logout fails
      this.user = null;
      this.currentAuthMethod = null;
    }
  }

  /**
   * Check if already authenticated with ICP
   */
  async checkExistingICPAuth(): Promise<boolean> {
    if (!this.authClient) {
      return false;
    }

    try {
      const authenticated = await this.authClient.isAuthenticated();
      if (authenticated) {
        const identity = this.authClient.getIdentity();
        const principal = identity.getPrincipal();

        this.user = {
          principal,
          authMethod: 'icp',
          isAuthenticated: true
        };

        this.currentAuthMethod = 'icp';

        console.log('✅ Found existing ICP authentication:', {
          principal: principal.toString(),
          authMethod: 'icp'
        });

        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error checking ICP authentication:', error);
      return false;
    }
  }
}

// Export singleton instance
export const unifiedAuth = new UnifiedAuth();
