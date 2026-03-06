import { BaseValidator } from './BaseValidator';

export class InvoiceValidator extends BaseValidator {

  /**
   * Validate data for creating an invoice.
   * Requires: project_id, client_name, client_email, client_location
   * Optional: invoice_date (defaults to today)
   */
  static validateCreateInvoice(data: any): {
    project_id: number;
    client_name: string;
    client_email: string;
    client_location: string;
    invoice_date?: Date;
  } {
    this.throwIf(this.isNullOrEmpty(data?.project_id), 'project_id is required');
    const project_id = this.parsePositiveInt(data.project_id, 'project_id');

    this.throwIf(this.isNullOrEmpty(data?.client_name), 'client_name is required');
    this.throwIf(typeof data.client_name !== 'string', 'client_name must be a string');
    const client_name = data.client_name.trim();
    this.throwIf(client_name.length === 0, 'client_name cannot be empty');
    this.throwIf(client_name.length > 255, 'client_name is too long (max 255 characters)');

    this.throwIf(this.isNullOrEmpty(data?.client_email), 'client_email is required');
    this.throwIf(typeof data.client_email !== 'string', 'client_email must be a string');
    const client_email = data.client_email.trim();
    this.throwIf(!this.isValidEmail(client_email), 'client_email must be a valid email address');

    this.throwIf(this.isNullOrEmpty(data?.client_location), 'client_location is required');
    this.throwIf(typeof data.client_location !== 'string', 'client_location must be a string');
    const client_location = data.client_location.trim();
    this.throwIf(client_location.length === 0, 'client_location cannot be empty');
    this.throwIf(client_location.length > 255, 'client_location is too long (max 255 characters)');

    let invoice_date: Date | undefined;
    if (data.invoice_date) {
      const parsed = new Date(data.invoice_date);
      this.throwIf(isNaN(parsed.getTime()), 'invoice_date must be a valid date');
      invoice_date = parsed;
    }

    return { project_id, client_name, client_email, client_location, invoice_date };
  }

  /**
   * Validate an invoice ID from URL params.
   */
  static validateInvoiceId(id: any): number {
    this.throwIf(this.isNullOrEmpty(id), 'invoice_id is required');
    return this.parsePositiveInt(id, 'invoice_id');
  }

  /**
   * Validate a project ID for invoice lookup.
   */
  static validateProjectId(id: any): number {
    this.throwIf(this.isNullOrEmpty(id), 'project_id is required');
    return this.parsePositiveInt(id, 'project_id');
  }

  /**
   * Validate data for updating an invoice (partial update).
   */
  static validateUpdateInvoice(data: any): {
    client_name?: string;
    client_email?: string;
    client_location?: string;
    invoice_date?: Date;
  } {
    const result: any = {};

    if (data.client_name !== undefined) {
      this.throwIf(typeof data.client_name !== 'string', 'client_name must be a string');
      const client_name = data.client_name.trim();
      this.throwIf(client_name.length === 0, 'client_name cannot be empty');
      this.throwIf(client_name.length > 255, 'client_name is too long (max 255 characters)');
      result.client_name = client_name;
    }

    if (data.client_email !== undefined) {
      this.throwIf(typeof data.client_email !== 'string', 'client_email must be a string');
      const client_email = data.client_email.trim();
      this.throwIf(!this.isValidEmail(client_email), 'client_email must be a valid email address');
      result.client_email = client_email;
    }

    if (data.client_location !== undefined) {
      this.throwIf(typeof data.client_location !== 'string', 'client_location must be a string');
      const client_location = data.client_location.trim();
      this.throwIf(client_location.length === 0, 'client_location cannot be empty');
      this.throwIf(client_location.length > 255, 'client_location is too long (max 255 characters)');
      result.client_location = client_location;
    }

    if (data.invoice_date !== undefined) {
      const parsed = new Date(data.invoice_date);
      this.throwIf(isNaN(parsed.getTime()), 'invoice_date must be a valid date');
      result.invoice_date = parsed;
    }

    this.throwIf(Object.keys(result).length === 0, 'At least one field must be provided to update');

    return result;
  }
}
