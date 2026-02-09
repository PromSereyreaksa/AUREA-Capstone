import { BaseValidator } from './BaseValidator';

export class UserValidator extends BaseValidator {
  static validateUserId(userId: any): number {
    this.throwIf(this.isNullOrEmpty(userId), 'user_id is required');
    return this.parsePositiveInt(userId, 'user_id');
  }

  static validateEmail(email: any): string {
    this.throwIf(this.isNullOrEmpty(email), 'Email is required');
    this.throwIf(!this.isValidEmail(email), 'Invalid email format');
    return email.toLowerCase().trim();
  }

  static validatePassword(password: any, minLength: number = 6): string {
    this.throwIf(this.isNullOrEmpty(password), 'Password is required');
    this.throwIf(
      password.length < minLength,
      `Password must be at least ${minLength} characters long`
    );
    return password;
  }

  static validateName(name: any): string {
    this.throwIf(this.isNullOrEmpty(name), 'Name is required');
    this.throwIf(name.trim().length < 2, 'Name must be at least 2 characters long');
    this.throwIf(name.trim().length > 100, 'Name must be at most 100 characters long');
    return name.trim();
  }

  static validateFirstName(firstName: any): string {
    this.throwIf(this.isNullOrEmpty(firstName), 'First name is required');
    this.throwIf(firstName.trim().length < 1, 'First name must be at least 1 character long');
    this.throwIf(firstName.trim().length > 100, 'First name must be at most 100 characters long');
    return firstName.trim();
  }

  static validateLastName(lastName: any): string {
    this.throwIf(this.isNullOrEmpty(lastName), 'Last name is required');
    this.throwIf(lastName.trim().length < 1, 'Last name must be at least 1 character long');
    this.throwIf(lastName.trim().length > 100, 'Last name must be at most 100 characters long');
    return lastName.trim();
  }

  static validateResetToken(token: any): string {
    this.throwIf(this.isNullOrEmpty(token), 'Reset token is required');
    this.throwIf(typeof token !== 'string' || token.trim().length === 0, 'Invalid reset token');
    return token.trim();
  }

  static validateNewPassword(password: any, minLength: number = 6): string {
    this.throwIf(this.isNullOrEmpty(password), 'New password is required');
    this.throwIf(
      password.length < minLength,
      `New password must be at least ${minLength} characters long`
    );
    return password;
  }

  static validateConfirmPassword(password: any, confirmPassword: any): void {
    this.throwIf(this.isNullOrEmpty(confirmPassword), 'Confirm password is required');
    this.throwIf(password !== confirmPassword, 'Passwords do not match');
  }

  static validateOTP(otp: any): string {
    this.throwIf(this.isNullOrEmpty(otp), 'OTP is required');
    const otpString = String(otp).trim();
    this.throwIf(otpString.length !== 6, 'OTP must be 6 digits');
    this.throwIf(!/^\d{6}$/.test(otpString), 'OTP must contain only numbers');
    return otpString;
  }
}
