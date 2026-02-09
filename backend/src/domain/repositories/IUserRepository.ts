import { User } from '../entities/User';

export interface IUserRepository {
  create(user: User): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(user_id: number): Promise<User | null>;
  findByGoogleId(google_id: string): Promise<User | null>;
  verifyEmail(user_id: number): Promise<void>;
  updateOTP(user_id: number, otp: string, expiration: Date): Promise<void>;
  updateLastLogin(user_id: number): Promise<void>;
  linkGoogleAccount(user_id: number, google_id: string): Promise<void>;
  updatePassword(user_id: number, hashedPassword: string): Promise<void>;
  updatePasswordResetToken(user_id: number, token: string, expiration: Date): Promise<void>;
  clearPasswordResetToken(user_id: number): Promise<void>;
  findByResetToken(token: string): Promise<User | null>;
}
