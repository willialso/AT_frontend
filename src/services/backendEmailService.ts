import { Principal } from '@dfinity/principal';

export interface BackendEmailService {
  sendEmailVerificationCode(email: string): Promise<string>;
  verifyEmailCode(email: string, code: string): Promise<boolean>;
  generatePrincipalFromEmail(email: string): Promise<Principal>;
}

export class BackendEmailService implements BackendEmailService {
  private backend: any;

  constructor(backend: any) {
    this.backend = backend;
  }

  /**
   * Send verification code via backend email service
   * This bypasses all browser restrictions and uses the backend SendGrid integration
   */
  async sendEmailVerificationCode(email: string): Promise<string> {
    try {
      if (!this.isValidEmail(email)) {
        throw new Error('Invalid email format');
      }

      console.log(`📧 Sending verification code to: ${email}`);
      
      // Call backend email service
      const result = await this.backend.send_email_verification_code(email);
      
      if ('ok' in result) {
        console.log(`✅ Verification code sent successfully to: ${email}`);
        console.log(`📧 Code: ${result.ok} (also check console for fallback)`);
        return result.ok;
      } else {
        console.error(`❌ Failed to send verification code: ${result.err}`);
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('❌ Backend email service error:', error);
      throw new Error(`Failed to send verification code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify email code using backend verification
   */
  async verifyEmailCode(email: string, code: string): Promise<boolean> {
    try {
      if (!this.isValidEmail(email) || !code.trim()) {
        throw new Error('Invalid email or code format');
      }

      console.log(`🔐 Verifying code for: ${email}`);
      
      // Call backend verification
      const result = await this.backend.verify_email_code(email, code);
      
      if ('ok' in result) {
        console.log(`✅ Email verification successful for: ${email}`);
        return true;
      } else {
        console.error(`❌ Email verification failed: ${result.err}`);
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('❌ Backend verification error:', error);
      throw new Error(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate deterministic Principal from email using backend
   */
  async generatePrincipalFromEmail(email: string): Promise<Principal> {
    try {
      if (!this.isValidEmail(email)) {
        throw new Error('Invalid email format');
      }

      console.log(`🔑 Generating Principal for email: ${email}`);
      
      // Call backend principal generation
      const result = await this.backend.generate_principal_from_email(email);
      
      if ('ok' in result) {
        console.log(`✅ Principal generated for: ${email}`);
        return result.ok;
      } else {
        console.error(`❌ Failed to generate Principal: ${result.err}`);
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('❌ Backend Principal generation error:', error);
      throw new Error(`Failed to generate Principal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Basic email validation
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }
}

// Export a factory function to create the service
export const createBackendEmailService = (backend: any): BackendEmailService => {
  return new BackendEmailService(backend);
};
