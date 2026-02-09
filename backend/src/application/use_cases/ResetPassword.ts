import { IUserRepository } from '../../domain/repositories/IUserRepository';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export interface ResetPasswordResult {
  success: boolean;
  message: string;
}

export class ResetPassword {
  constructor(private userRepo: IUserRepository) {}

  async execute(token: string, newPassword: string): Promise<ResetPasswordResult> {
    // Hash the incoming token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find the user by reset token
    const user = await this.userRepo.findByResetToken(hashedToken);

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    // Check if the token has expired
    if (user.password_reset_expires) {
      const now = new Date();
      const expirationTime = new Date(user.password_reset_expires);

      if (now > expirationTime) {
        // Clear the expired token
        await this.userRepo.clearPasswordResetToken(user.user_id);
        throw new Error('Reset token has expired. Please request a new password reset.');
      }
    } else {
      throw new Error('Invalid or expired reset token');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password 
    await this.userRepo.updatePassword(user.user_id, hashedPassword);

    return {
      success: true,
      message: 'Password has been reset successfully. You can now sign in with your new password.'
    };
  }
}
