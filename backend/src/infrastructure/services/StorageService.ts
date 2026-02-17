import { supabase } from '../db/supabaseClient';
import { DatabaseError } from '../../shared/errors';
import * as crypto from 'crypto';
import * as path from 'path';

export class StorageService {
  private readonly AVATAR_BUCKET = 'avatars';
  private readonly PROJECT_PDF_BUCKET = 'project_pdf';
  private readonly PORTFOLIO_PDF_BUCKET = 'user_portfolio';
  private readonly MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB
  
  /**
   * Upload avatar to Supabase Storage (public bucket)
   * @param userId - User ID for folder organization
   * @param file - Multer file object
   * @returns Public URL of uploaded avatar
   */
  async uploadAvatar(userId: number, file: Express.Multer.File): Promise<string> {
    // Validate file size
    if (file.size > this.MAX_AVATAR_SIZE) {
      throw new DatabaseError('File size exceeds 5MB limit');
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new DatabaseError('Only JPEG, PNG, and WebP images are allowed');
    }

    // Generate unique filename with user folder structure
    const fileExt = path.extname(file.originalname);
    const fileName = `${userId}/${crypto.randomUUID()}${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(this.AVATAR_BUCKET)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false, // Don't overwrite existing files
        cacheControl: '3600', // Cache for 1 hour
      });

    if (error) {
      throw new DatabaseError(`Failed to upload avatar: ${error.message}`);
    }

    // Get public URL (permanent, no expiration)
    const { data: publicUrlData } = supabase.storage
      .from(this.AVATAR_BUCKET)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  }

  /**
   * Delete avatar from Supabase Storage
   * @param avatarUrl - Full URL of the avatar to delete
   */
  async deleteAvatar(avatarUrl: string): Promise<void> {
    if (!avatarUrl) return;

    try {
      // Extract path from URL
      // URL format: https://xxx.supabase.co/storage/v1/object/public/avatars/userId/filename.jpg
      const url = new URL(avatarUrl);
      const pathSegments = url.pathname.split('/');
      const bucketIndex = pathSegments.indexOf(this.AVATAR_BUCKET);
      
      if (bucketIndex === -1) {
        throw new Error('Invalid avatar URL format');
      }

      // Get the path after the bucket name
      const filePath = pathSegments.slice(bucketIndex + 1).join('/');

      // Delete from storage
      const { error } = await supabase.storage
        .from(this.AVATAR_BUCKET)
        .remove([filePath]);

      if (error) {
        console.error(`Failed to delete avatar: ${error.message}`);
        // Don't throw - avatar deletion is not critical
      }
    } catch (err) {
      console.error('Error deleting avatar:', err);
      // Don't throw - avatar deletion is not critical
    }
  }

  /**
   * Update avatar - deletes old one and uploads new one
   * @param userId - User ID
   * @param newFile - New avatar file
   * @param oldAvatarUrl - Optional old avatar URL to delete
   * @returns Public URL of new avatar
   */
  async updateAvatar(
    userId: number, 
    newFile: Express.Multer.File, 
    oldAvatarUrl?: string
  ): Promise<string> {
    // Delete old avatar if exists
    if (oldAvatarUrl) {
      await this.deleteAvatar(oldAvatarUrl);
    }

    // Upload new avatar
    return this.uploadAvatar(userId, newFile);
  }

  // ========================================
  // PROJECT PDF METHODS (Private Bucket)
  // ========================================

  /**
   * Upload project PDF to Supabase Storage (private bucket)
   * @param userId - User ID for folder organization
   * @param projectId - Project ID for file naming
   * @param pdfBuffer - PDF file buffer
   * @param originalName - Original filename
   * @returns File path in storage (NOT a public URL - use getProjectPdfSignedUrl to access)
   */
  async uploadProjectPdf(
    userId: number,
    projectId: number,
    pdfBuffer: Buffer,
    originalName: string
  ): Promise<string> {
    // Validate file size
    if (pdfBuffer.length > this.MAX_PDF_SIZE) {
      throw new DatabaseError('PDF file size exceeds 10MB limit');
    }

    // Generate unique filename with user/project folder structure
    const fileExt = path.extname(originalName) || '.pdf';
    const fileName = `${userId}/${projectId}/${crypto.randomUUID()}${fileExt}`;

    // Upload to Supabase Storage (private bucket)
    const { data, error } = await supabase.storage
      .from(this.PROJECT_PDF_BUCKET)
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
        cacheControl: '3600',
      });

    if (error) {
      throw new DatabaseError(`Failed to upload project PDF: ${error.message}`);
    }

    // Return just the file path (not a public URL since bucket is private)
    return data.path;
  }

  /**
   * Get a signed URL for accessing a private project PDF
   * @param filePath - File path in storage
   * @param expiresIn - URL expiration time in seconds (default: 1 hour)
   * @returns Signed URL to access the PDF
   */
  async getProjectPdfSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    if (!filePath) {
      throw new DatabaseError('File path is required');
    }

    const { data, error } = await supabase.storage
      .from(this.PROJECT_PDF_BUCKET)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw new DatabaseError(`Failed to generate signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  /**
   * Delete project PDF from Supabase Storage
   * @param filePath - File path in storage
   */
  async deleteProjectPdf(filePath: string): Promise<void> {
    if (!filePath) return;

    try {
      const { error } = await supabase.storage
        .from(this.PROJECT_PDF_BUCKET)
        .remove([filePath]);

      if (error) {
        console.error(`Failed to delete project PDF: ${error.message}`);
      }
    } catch (err) {
      console.error('Error deleting project PDF:', err);
    }
  }

  // ========================================
  // PORTFOLIO PDF METHODS (Public Bucket)
  // ========================================

  /**
   * Upload portfolio PDF to Supabase Storage (public bucket)
   * @param userId - User ID for folder organization
   * @param pdfBuffer - PDF file buffer
   * @param originalName - Original filename
   * @returns Public URL of uploaded PDF
   */
  async uploadPortfolioPdf(
    userId: number,
    pdfBuffer: Buffer,
    originalName: string
  ): Promise<string> {
    // Validate file size
    if (pdfBuffer.length > this.MAX_PDF_SIZE) {
      throw new DatabaseError('PDF file size exceeds 10MB limit');
    }

    // Generate unique filename with user folder structure
    const fileExt = path.extname(originalName) || '.pdf';
    const fileName = `${userId}/${crypto.randomUUID()}${fileExt}`;

    // Upload to Supabase Storage (public bucket)
    const { data, error } = await supabase.storage
      .from(this.PORTFOLIO_PDF_BUCKET)
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
        cacheControl: '3600',
      });

    if (error) {
      throw new DatabaseError(`Failed to upload portfolio PDF: ${error.message}`);
    }

    // Get public URL (permanent, no expiration)
    const { data: publicUrlData } = supabase.storage
      .from(this.PORTFOLIO_PDF_BUCKET)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  }

  /**
   * Delete portfolio PDF from Supabase Storage
   * @param portfolioUrl - Full URL of the portfolio PDF to delete
   */
  async deletePortfolioPdf(portfolioUrl: string): Promise<void> {
    if (!portfolioUrl) return;

    try {
      // Extract path from URL
      const url = new URL(portfolioUrl);
      const pathSegments = url.pathname.split('/');
      const bucketIndex = pathSegments.indexOf(this.PORTFOLIO_PDF_BUCKET);
      
      if (bucketIndex === -1) {
        throw new Error('Invalid portfolio URL format');
      }

      // Get the path after the bucket name
      const filePath = pathSegments.slice(bucketIndex + 1).join('/');

      const { error } = await supabase.storage
        .from(this.PORTFOLIO_PDF_BUCKET)
        .remove([filePath]);

      if (error) {
        console.error(`Failed to delete portfolio PDF: ${error.message}`);
      }
    } catch (err) {
      console.error('Error deleting portfolio PDF:', err);
    }
  }

  /**
   * Update portfolio PDF - deletes old one and uploads new one
   * @param userId - User ID
   * @param pdfBuffer - New PDF buffer
   * @param originalName - Original filename
   * @param oldPdfUrl - Optional old PDF URL to delete
   * @returns Public URL of new PDF
   */
  async updatePortfolioPdf(
    userId: number,
    pdfBuffer: Buffer,
    originalName: string,
    oldPdfUrl?: string
  ): Promise<string> {
    // Delete old PDF if exists
    if (oldPdfUrl) {
      await this.deletePortfolioPdf(oldPdfUrl);
    }

    // Upload new PDF
    return this.uploadPortfolioPdf(userId, pdfBuffer, originalName);
  }
}
