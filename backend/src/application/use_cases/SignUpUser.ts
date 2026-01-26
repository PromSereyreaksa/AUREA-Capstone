import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';

export class SignUpUser {
  constructor(private userRepo: IUserRepository) {}

  async execute(email: string, password: string, role: string): Promise<User> {
    
    const user = new User(
      0, // user_id will be set by DB
      email,
      password,
      role
    );
    return await this.userRepo.create(user);
  }
}


