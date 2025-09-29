import { Principal } from '@dfinity/principal';
import { GoogleCredentialResponse } from '@react-oauth/google';

export interface GoogleUser {
  principal: Principal; // ICP Principal required for backend compatibility
  googleId: string;
  email: string;
  name?: string;
  picture?: string;
  isAuthenticated: boolean;
}

export class GoogleAuth {
  private user: GoogleUser | null = null;

  /**
   * Sign in with Google OAuth using real Google API
   */
  async signInWithGoogle(credentialResponse: GoogleCredentialResponse): Promise<GoogleUser> {
    try {
      console.log('🔍 Starting real Google OAuth flow...');
      console.log('🔧 Google OAuth credential response:', credentialResponse);
      
      if (!credentialResponse.credential) {
        console.error('❌ No credential received from Google');
        throw new Error('No credential received from Google');
      }

      // Decode the JWT token to get user info
      console.log('🔧 Decoding JWT token...');
      const userInfo = this.decodeJWT(credentialResponse.credential);
      console.log('🔧 Decoded user info:', userInfo);
      
      if (!userInfo.sub || !userInfo.email) {
        console.error('❌ Invalid Google credential data:', userInfo);
        throw new Error('Invalid Google credential data');
      }

      // Generate deterministic Principal from Google ID and email
      console.log('🔧 GoogleAuth: Generating Principal from:', { googleId: userInfo.sub, email: userInfo.email });
      const principal = this.generatePrincipalFromGoogleData(userInfo.sub, userInfo.email);
      console.log('🔧 GoogleAuth: Generated Principal:', principal.toString());

      this.user = {
        principal,
        googleId: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name || undefined,
        picture: userInfo.picture || undefined,
        isAuthenticated: true
      };

      console.log('✅ Real Google authentication successful:', {
        principal: principal.toString(),
        googleId: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name
      });

      return this.user;
    } catch (error) {
      console.error('❌ Google authentication failed:', error);
      // Provide more specific error messages
      if (error.message.includes('Invalid JWT token')) {
        throw new Error('Google OAuth token is invalid or expired. Please try again.');
      } else if (error.message.includes('No credential received')) {
        throw new Error('Google OAuth was cancelled or failed. Please try again.');
      } else {
        throw new Error(`Google authentication failed: ${error.message}`);
      }
    }
  }

  /**
   * Decode JWT token to extract user information
   */
  private decodeJWT(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT token format');
      }
      
      const base64Url = parts[1];
      if (!base64Url) {
        throw new Error('Invalid JWT token format');
      }
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('❌ Failed to decode JWT token:', error);
      throw new Error('Invalid JWT token');
    }
  }

  /**
   * Generate a valid ICP Principal from Google OAuth data
   * Backend requires Principal for wallet creation and user management
   */
  private generatePrincipalFromGoogleData(googleId: string, email: string): Principal {
    // Create a deterministic seed from Google ID and email
    const seed = `google:${googleId}:${email}:icp-derivation-mainnet`;
    const seedHash = this.hashString(seed);
    
    // Convert hash to a shorter byte array (8 bytes for shorter Principal)
    const seedBytes = new Uint8Array(8);
    for (let i = 0; i < 8; i++) {
      seedBytes[i] = (seedHash >> (i * 8)) & 0xFF;
    }
    
    // Generate Principal from shorter bytes - this should create a valid, shorter Principal
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
   * Get current Google user
   */
  getCurrentUser(): GoogleUser | null {
    return this.user;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.user?.isAuthenticated || false;
  }

  /**
   * Logout Google user
   */
  logout(): void {
    this.user = null;
    console.log('🔌 Google user logged out');
  }
}

// Export singleton instance
export const googleAuth = new GoogleAuth();
