import { ValidationError } from '../errors/AppError';

export abstract class BaseValidator {
  protected static throwIf(condition: boolean, message: string): void {
    if (condition) {
      throw new ValidationError(message);
    }
  }

  protected static isNullOrEmpty(value: any): boolean {
    return value === null || value === undefined || value === '' || 
           (typeof value === 'string' && value.trim() === '');
  }

  protected static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  protected static isPositiveNumber(value: any): boolean {
    const num = Number(value);
    return !isNaN(num) && num > 0;
  }

  protected static isNonNegativeNumber(value: any): boolean {
    const num = Number(value);
    return !isNaN(num) && num >= 0;
  }

  protected static parsePositiveInt(value: any, fieldName: string): number {
    const parsed = parseInt(value);
    if (isNaN(parsed) || parsed < 1) {
      throw new ValidationError(`${fieldName} must be a positive integer`);
    }
    return parsed;
  }

  protected static parseNonNegativeInt(value: any, fieldName: string): number {
    const parsed = parseInt(value);
    if (isNaN(parsed) || parsed < 0) {
      throw new ValidationError(`${fieldName} must be a non-negative integer`);
    }
    return parsed;
  }
}
