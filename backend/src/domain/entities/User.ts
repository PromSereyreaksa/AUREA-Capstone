export class User {
  constructor(
    public user_id: number,
    public email: string,
    public password: string,
    public google_id?: string,
    public email_verified?: boolean,
    public verification_otp?: string,
    public verify_otp_expired?: Date,
    public created_at?: Date,
    public last_login_at?: Date,
    public auth_provider?: string,
    public first_name?: string,
    public last_name?: string,
    public password_reset_token?: string,
    public password_reset_expires?: Date
  ) {}
}
