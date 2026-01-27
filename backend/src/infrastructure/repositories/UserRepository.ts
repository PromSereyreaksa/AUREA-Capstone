import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { User } from "../../domain/entities/User";
import { supabase } from "../db/supabaseClient";
import { mapUserFromDb, mapUserToDb } from "./../mappers/userMapper";

export class UserRepository implements IUserRepository {
  async create(user: User): Promise<User> {
    const row = mapUserToDb(user);

    const { data, error } = await supabase
      .from("users")
      .insert([row])
      .select()
      .single();

    if (error) throw error;
    return mapUserFromDb(data);
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error || !data) return null;
    return mapUserFromDb(data);
  }

  async findById(user_id: number): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle();

    if (error || !data) return null;
    return mapUserFromDb(data);
  }
}
