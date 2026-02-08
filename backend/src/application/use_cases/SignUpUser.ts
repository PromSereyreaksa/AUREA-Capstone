import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';
import bcrypt from 'bcrypt';
import { EmailService } from '../../infrastructure/services/EmailService';

export class SignUpUser {
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

  async execute(email: string, password: string, role: string): Promise<User> {
    // Check if email already exists
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password with bcrypt (salt rounds = 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP for email verification
    const otp = this.generateOTP();
    const otpExpiration = this.getOTPExpiration();

    const user = new User(
      0,
      email,
      hashedPassword,
      role,
      undefined,           // google_id
      false,               // email_verified (default: false)
      otp,                 // verification_otp
      otpExpiration,       // verify_otp_expired
      new Date(),          // created_at
      undefined,           // last_login_at
      'email'              // auth_provider
    );

    const createdUser = await this.userRepo.create(user);

    // Send OTP email
    try {
      await this.emailService.sendOTPEmail(email, otp);
    } catch (error: any) {
      console.error('[SignUpUser] Failed to send OTP email:', {
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email for privacy
        error: error.message
      });
      // Don't throw error - user is already created, they can resend OTP
    }

    return createdUser;
  }
}


