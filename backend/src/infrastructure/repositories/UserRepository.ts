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
}
