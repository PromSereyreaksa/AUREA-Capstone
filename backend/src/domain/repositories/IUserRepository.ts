import { User } from '../entities/User';

export interface IUserRepository {
  create(user: User): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(user_id: number): Promise<User | null>;
  verifyEmail(user_id: number): Promise<void>;
  updateOTP(user_id: number, otp: string, expiration: Date): Promise<void>;
}
