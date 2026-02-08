import { BaseValidator } from './BaseValidator';

export class PdfValidator extends BaseValidator {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_MIME_TYPES = ['application/pdf'];

  static validatePdfFile(file: any): void {
    this.throwIf(!file, 'PDF file is required');
    this.throwIf(
      !this.ALLOWED_MIME_TYPES.includes(file.mimetype),
      'Only PDF files are allowed'
    );
    this.throwIf(file.size === 0, 'PDF file cannot be empty');
    this.throwIf(
      file.size > this.MAX_FILE_SIZE,
      `PDF file size cannot exceed ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`
    );
  }

  static validatePdfBuffer(buffer: Buffer): void {
    this.throwIf(!buffer || buffer.length === 0, 'PDF buffer is empty');
    
    // Check PDF magic bytes
    const pdfHeader = buffer.slice(0, 4).toString();
    this.throwIf(pdfHeader !== '%PDF', 'Invalid PDF file format');
  }
}
