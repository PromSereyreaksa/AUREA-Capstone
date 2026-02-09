import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { EmailService } from '../../infrastructure/services/EmailService';
import crypto from 'crypto';

export interface ForgotPasswordResult {
  success: boolean;
  message: string;
}

export class ForgotPassword {
  constructor(
    private userRepo: IUserRepository,
    private emailService: EmailService
  ) {}

  // Generate a secure random token for password reset
  private generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Token expires in 1 hour
  private getTokenExpiration(): Date {
    const expiration = new Date();
    expiration.setHours(expiration.getHours() + 1);
    return expiration;
  }

  async execute(email: string): Promise<ForgotPasswordResult> {
    // Find user by email
    const user = await this.userRepo.findByEmail(email);

    if (!user) {
      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      };
    }

    // Check if user signed up with Google only
    if (user.auth_provider === 'google' && !user.password) {
      return {
        success: false,
        message: 'This account uses Google sign-in. Please sign in with Google instead.'
      };
    }

    // Generate reset token and expiration
    const resetToken = this.generateResetToken();
    const tokenExpiration = this.getTokenExpiration();

    // Store the hashed token in the database
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    await this.userRepo.updatePasswordResetToken(user.user_id, hashedToken, tokenExpiration);

    // Build the reset link — the raw (unhashed) token goes in the URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Send the password reset email
    try {
      await this.emailService.sendPasswordResetEmail(email, resetLink);
    } catch (error: any) {
      console.error('[ForgotPassword] Failed to send reset email:', {
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        error: error.message
      });
      // Clear the token since email failed
      await this.userRepo.clearPasswordResetToken(user.user_id);
      throw new Error('Failed to send password reset email. Please try again.');
    }

    return {
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    };
  }
}