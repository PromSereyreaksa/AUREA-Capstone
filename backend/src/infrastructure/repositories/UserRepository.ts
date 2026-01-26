import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';
import { supabase } from '../db/supabaseClient';

export class UserRepository implements IUserRepository {
  async create(user: User): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email: user.email,
          password: user.password,
          role: user.role,
          google_id: user.google_id,
          email_verified: user.email_verified,
          verification_otp: user.verification_otp,
          verify_otp_expired: user.verify_otp_expired,
          created_at: user.created_at,
          last_login_at: user.last_login_at,
          auth_provider: user.auth_provider
        }
      ])
      .select()
      .single();
    if (error) throw error;
    return new User(
      data.user_id,
      data.email,
      data.password,
      data.role,
      data.google_id,
      data.email_verified,
      data.verification_otp,
      data.verify_otp_expired ? new Date(data.verify_otp_expired) : undefined,
      data.created_at ? new Date(data.created_at) : undefined,
      data.last_login_at ? new Date(data.last_login_at) : undefined,
      data.auth_provider
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    if (error || !data) return null;
    return new User(
      data.user_id,
      data.email,
      data.password,
      data.role,
      data.google_id,
      data.email_verified,
      data.verification_otp,
      data.verify_otp_expired ? new Date(data.verify_otp_expired) : undefined,
      data.created_at ? new Date(data.created_at) : undefined,
      data.last_login_at ? new Date(data.last_login_at) : undefined,
      data.auth_provider
    );
  }

  async findById(user_id: number): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user_id)
      .single();
    if (error || !data) return null;
    return new User(
      data.user_id,
      data.email,
      data.password,
      data.role,
      data.google_id,
      data.email_verified,
      data.verification_otp,
      data.verify_otp_expired ? new Date(data.verify_otp_expired) : undefined,
      data.created_at ? new Date(data.created_at) : undefined,
      data.last_login_at ? new Date(data.last_login_at) : undefined,
      data.auth_provider
    );
  }
}
