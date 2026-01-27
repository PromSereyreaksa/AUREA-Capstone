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

  static validateRole(role: any): string {
    const validRoles = ['client', 'designer', 'admin'];
    this.throwIf(this.isNullOrEmpty(role), 'Role is required');
    const normalizedRole = role.toLowerCase().trim();
    this.throwIf(
      !validRoles.includes(normalizedRole),
      `Role must be one of: ${validRoles.join(', ')}`
    );
    return normalizedRole;
  }

  static validateName(name: any): string {
    this.throwIf(this.isNullOrEmpty(name), 'Name is required');
    this.throwIf(name.trim().length < 2, 'Name must be at least 2 characters long');
    return name.trim();
  }
}
