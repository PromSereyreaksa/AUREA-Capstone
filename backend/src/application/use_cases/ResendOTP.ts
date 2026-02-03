import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { EmailService } from '../../infrastructure/services/EmailService';

export interface ResendOTPResult {
  success: boolean;
  message: string;
  otp?: string;
}

export class ResendOTP {
  constructor(
    private userRepo: IUserRepository,
    private emailService: EmailService
  ) {}

  // Generate 6-digit OTP
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Get OTP expiration time (15 minutes from now)
  private getOTPExpiration(): Date {
    const expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + 15);
    return expiration;
  }

  async execute(email: string): Promise<ResendOTPResult> {
    // Find user by email
    const user = await this.userRepo.findByEmail(email);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Check if already verified
    if (user.email_verified) {
      return { success: false, message: 'Email is already verified' };
    }

    // Generate new OTP
    const newOTP = this.generateOTP();
    const otpExpiration = this.getOTPExpiration();

    // Update user with new OTP
    await this.userRepo.updateOTP(user.user_id, newOTP, otpExpiration);

    // Send OTP email
    try {
      await this.emailService.sendOTPEmail(email, newOTP);
    } catch (error: any) {
      console.error('[ResendOTP] Failed to send OTP email:', {
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email for privacy
        error: error.message
      });
      throw new Error('Failed to send verification email. Please try again.');
    }

    return { 
      success: true, 
      message: 'New OTP sent to your email',
      otp: newOTP  // For testing only - remove in production!
    };
  }
}
