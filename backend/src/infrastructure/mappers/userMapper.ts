import { User } from '../../domain/entities/User';

// Helper to format date for PostgreSQL timestamp (without timezone suffix)
function toPostgresTimestamp(date: Date | undefined): string | undefined {
  if (!date) return undefined;
  // Format: YYYY-MM-DD HH:MM:SS
  return date.toISOString().replace('T', ' ').replace('Z', '');
}

// Helper to parse timestamp from PostgreSQL (append Z to treat as UTC)
function fromPostgresTimestamp(value: any): Date | undefined {
  if (!value) return undefined;
  // If it doesn't end with Z, append it to treat as UTC
  const dateStr = String(value).endsWith('Z') ? value : value + 'Z';
  return new Date(dateStr);
}

export function mapUserFromDb(data: any): User {
  return new User(
    data.user_id,
    data.email,
    data.password,
    data.google_id,
    data.email_verified,
    data.verification_otp,
    fromPostgresTimestamp(data.verify_otp_expired),
    fromPostgresTimestamp(data.created_at),
    fromPostgresTimestamp(data.last_login_at),
    data.auth_provider,
    data.first_name,
    data.last_name,
    data.password_reset_token,
    fromPostgresTimestamp(data.password_reset_expires)
  );
}

export function mapUserToDb(user: User) {
  return {
    email: user.email,
    password: user.password,
    google_id: user.google_id,
    email_verified: user.email_verified,
    verification_otp: user.verification_otp,
    verify_otp_expired: toPostgresTimestamp(user.verify_otp_expired),
    created_at: toPostgresTimestamp(user.created_at),
    last_login_at: toPostgresTimestamp(user.last_login_at),
    auth_provider: user.auth_provider,
    first_name: user.first_name,
    last_name: user.last_name,
    password_reset_token: user.password_reset_token,
    password_reset_expires: toPostgresTimestamp(user.password_reset_expires)
  };
}
