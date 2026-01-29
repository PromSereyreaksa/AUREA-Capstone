import { User } from '../../domain/entities/User';


export function mapUserFromDb(data: any): User {
  return new User(
    data.user_id,
    data.email,
    data.password,
    data.role,
    data.google_id,
    data.email_verified,
    data.verification_otp,
    data.verify_otp_expired ? new Date(data.verify_otp_expired) : undefined,
    data.last_login_at ? new Date(data.last_login_at) : undefined,
    data.auth_provider
  );
}

export function mapUserToDb(user: User) {
  return {
    email: user.email,
    password: user.password,
    role: user.role,
    google_id: user.google_id,
    email_verified: user.email_verified,
    verification_otp: user.verification_otp,
    verify_otp_expired: user.verify_otp_expired?.toISOString(),
    last_login_at: user.last_login_at?.toISOString(),
    auth_provider: user.auth_provider
  };
}
