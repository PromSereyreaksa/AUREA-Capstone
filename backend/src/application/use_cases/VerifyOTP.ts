import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { JwtService } from '../../infrastructure/services/JwtService';
import bcrypt from 'bcrypt';

export interface VerifyOTPResult {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    user_id: number;
    email: string;
    email_verified: boolean;
  };
}

export class VerifyOTP {
  constructor(private userRepo: IUserRepository) {}

  async execute(email: string, otp: string): Promise<VerifyOTPResult> {
    // Find user by email
    const user = await this.userRepo.findByEmail(email);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Check if already verified - return token for convenience
    if (user.email_verified) {
      const token = JwtService.generateToken({
        user_id: user.user_id,
        email: user.email
      });

      return { 
        success: true, 
        message: 'Email is already verified',
        token,
        user: {
          user_id: user.user_id,
          email: user.email,
          email_verified: true
        }
      };
    }

    // Verify OTP matches (compare hashed OTP)
    if (!user.verification_otp) {
      throw new Error('No OTP found for this user');
    }
    
    const isOTPValid = await bcrypt.compare(otp, user.verification_otp);
    if (!isOTPValid) {
      throw new Error('Invalid OTP code');
    }

    // Check if OTP has expired
    if (user.verify_otp_expired) {
      const now = new Date();
      const expirationTime = new Date(user.verify_otp_expired);
      
      // Debug logging (remove in production)
      console.log('Current time:', now.toISOString());
      console.log('OTP expires at:', expirationTime.toISOString());
      console.log('Is expired:', now > expirationTime);
      
      if (now > expirationTime) {
        throw new Error('OTP has expired. Please request a new one.');
      }
    }

    // Update user as verified
    await this.userRepo.verifyEmail(user.user_id);

    // Generate JWT token after successful verification
    const token = JwtService.generateToken({
      user_id: user.user_id,
      email: user.email
    });

    return { 
      success: true, 
      message: 'Email verified successfully',
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        email_verified: true
      }
    };
  }
}
