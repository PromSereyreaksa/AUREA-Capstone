import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';
import { JwtService, JwtPayload } from '../../infrastructure/services/JwtService';

interface GoogleUserData {
  google_id: string;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

export class SignUpWithGoogle {
  constructor(private userRepo: IUserRepository) {}

  async execute(googleUserData: GoogleUserData): Promise<{ user: User; token: string }> {
    const { google_id, email, name, first_name, last_name } = googleUserData;

    // Parse name into first_name / last_name if not explicitly provided
    let parsedFirstName = first_name;
    let parsedLastName = last_name;
    if (!parsedFirstName && !parsedLastName && name) {
      const nameParts = name.trim().split(/\s+/);
      parsedFirstName = nameParts[0];
      parsedLastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined;
    }

    // Check if user already exists by Google ID
    let user = await this.userRepo.findByGoogleId(google_id);

    if (user) {
      // User exists, update last login and return
      await this.userRepo.updateLastLogin(user.user_id);
      const token = this.generateToken(user);
      return { user, token };
    }

    // Check if user exists by email (might have signed up with email/password before)
    user = await this.userRepo.findByEmail(email);

    if (user) {
      // Link Google account to existing user
      await this.userRepo.linkGoogleAccount(user.user_id, google_id);
      await this.userRepo.updateLastLogin(user.user_id);
      
      // Refresh user data
      user = await this.userRepo.findById(user.user_id);
      if (!user) throw new Error('User not found after linking');
      
      const token = this.generateToken(user);
      return { user, token };
    }

    // Create new user with Google
    const newUser = new User(
      0,                    // user_id (will be assigned by DB)
      email,
      '',                   // no password for Google users
      google_id,            // google_id
      true,                 // email_verified (Google emails are verified)
      undefined,            // verification_otp (not needed)
      undefined,            // verify_otp_expired (not needed)
      new Date(),           // created_at
      new Date(),           // last_login_at
      'google',             // auth_provider
      parsedFirstName,      // first_name
      parsedLastName        // last_name
    );

    const createdUser = await this.userRepo.create(newUser);
    const token = this.generateToken(createdUser);

    return { user: createdUser, token };
  }

  private generateToken(user: User): string {
    const payload: JwtPayload = {
      user_id: user.user_id,
      email: user.email
    };
    return JwtService.generateToken(payload);
  }
}
