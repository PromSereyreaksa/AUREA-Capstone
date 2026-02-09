import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { User } from "../../domain/entities/User";
import { supabase } from "../db/supabaseClient";
import { mapUserFromDb, mapUserToDb } from "./../mappers/userMapper";
import { DatabaseError, ConflictError } from "../../shared/errors";

export class UserRepository implements IUserRepository {
  async create(user: User): Promise<User> {
    const row = mapUserToDb(user);

    const { data, error } = await supabase
      .from("users")
      .insert([row])
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation (duplicate email)
      if (error.code === '23505') {
        throw new ConflictError('A user with this email already exists');
      }
      throw new DatabaseError(`Failed to create user: ${error.message}`);
    }
    return mapUserFromDb(data);
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to find user by email: ${error.message}`);
    }
    if (!data) return null;
    return mapUserFromDb(data);
  }

  async findById(user_id: number): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to find user by ID: ${error.message}`);
    }
    if (!data) return null;
    return mapUserFromDb(data);
  }

  async findByGoogleId(google_id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("google_id", google_id)
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to find user by Google ID: ${error.message}`);
    }
    if (!data) return null;
    return mapUserFromDb(data);
  }

  async verifyEmail(user_id: number): Promise<void> {
    const { error } = await supabase
      .from("users")
      .update({ 
        email_verified: true,
        verification_otp: null,
        verify_otp_expired: null
      })
      .eq("user_id", user_id);

    if (error) throw error;
  }

  async updateOTP(user_id: number, otp: string, expiration: Date): Promise<void> {
    // Format timestamp without timezone suffix for PostgreSQL timestamp column
    const expirationStr = expiration.toISOString().replace('T', ' ').replace('Z', '');
    
    const { error } = await supabase
      .from("users")
      .update({ 
        verification_otp: otp,
        verify_otp_expired: expirationStr
      })
      .eq("user_id", user_id);

    if (error) throw error;
  }

  async updateLastLogin(user_id: number): Promise<void> {
    const { error } = await supabase
      .from("users")
      .update({ 
        last_login_at: new Date().toISOString().replace('T', ' ').replace('Z', '')
      })
      .eq("user_id", user_id);

    if (error) {
      throw new DatabaseError(`Failed to update last login: ${error.message}`);
    }
  }

  async linkGoogleAccount(user_id: number, google_id: string): Promise<void> {
    const { error } = await supabase
      .from("users")
      .update({ 
        google_id: google_id,
        auth_provider: 'google'
      })
      .eq("user_id", user_id);

    if (error) {
      throw new DatabaseError(`Failed to link Google account: ${error.message}`);
    }
  }

  async updatePassword(user_id: number, hashedPassword: string): Promise<void> {
    const { error } = await supabase
      .from("users")
      .update({ 
        password: hashedPassword,
        password_reset_token: null,
        password_reset_expires: null
      })
      .eq("user_id", user_id);

    if (error) {
      throw new DatabaseError(`Failed to update password: ${error.message}`);
    }
  }

  async updatePasswordResetToken(user_id: number, token: string, expiration: Date): Promise<void> {
    const expirationStr = expiration.toISOString().replace('T', ' ').replace('Z', '');

    const { error } = await supabase
      .from("users")
      .update({ 
        password_reset_token: token,
        password_reset_expires: expirationStr
      })
      .eq("user_id", user_id);

    if (error) {
      throw new DatabaseError(`Failed to update password reset token: ${error.message}`);
    }
  }

  async clearPasswordResetToken(user_id: number): Promise<void> {
    const { error } = await supabase
      .from("users")
      .update({ 
        password_reset_token: null,
        password_reset_expires: null
      })
      .eq("user_id", user_id);

    if (error) {
      throw new DatabaseError(`Failed to clear password reset token: ${error.message}`);
    }
  }

  async findByResetToken(token: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("password_reset_token", token)
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to find user by reset token: ${error.message}`);
    }
    if (!data) return null;
    return mapUserFromDb(data);
  }
}
