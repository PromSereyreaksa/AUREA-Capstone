import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify connection configuration
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('[EmailService] Configuration error:', error.message);
      } else {
        console.log('[EmailService] Ready to send messages');
      }
    });
  }

  async sendOTPEmail(to: string, otp: string): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@aurea.com',
      to,
      subject: 'Verify Your Email - AUREA Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .otp-box {
              background-color: #fff;
              border: 2px solid #4CAF50;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
            }
            .otp-code {
              font-size: 32px;
              font-weight: bold;
              color: #4CAF50;
              letter-spacing: 5px;
              margin: 10px 0;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Email Verification</h2>
              <p>Welcome to AUREA Platform!</p>
            </div>
            
            <p>Thank you for registering. Please use the following One-Time Password (OTP) to verify your email address:</p>
            
            <div class="otp-box">
              <p style="margin: 0; font-size: 14px; color: #666;">Your OTP Code:</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">This code will expire in 15 minutes</p>
            </div>
            
            <p>If you didn't request this verification, please ignore this email.</p>
            
            <div class="footer">
              <p>© 2026 AUREA Platform. All rights reserved.</p>
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to AUREA Platform!
        
        Your verification code is: ${otp}
        
        This code will expire in 15 minutes.
        
        If you didn't request this verification, please ignore this email.
        
        © 2026 AUREA Platform
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`[EmailService] OTP email sent successfully to ${to.replace(/(.{2}).*(@.*)/, '$1***$2')}`);
    } catch (error: any) {
      console.error('[EmailService] Error sending OTP email:', {
        recipient: to.replace(/(.{2}).*(@.*)/, '$1***$2'),
        error: error.message
      });
      throw new Error('Failed to send verification email');
    }
  }

  async sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@aurea.com',
      to,
      subject: 'Reset Your Password - AUREA Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #4CAF50; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Password Reset Request</h2>
            <p>You requested to reset your password. Click the button below to proceed:</p>
            <a href="${resetLink}" class="button">Reset Password</a>
            <p>If you didn't request this, please ignore this email.</p>
            <p>This link will expire in 1 hour.</p>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`[EmailService] Password reset email sent to ${to.replace(/(.{2}).*(@.*)/, '$1***$2')}`);
    } catch (error: any) {
      console.error('[EmailService] Error sending password reset email:', {
        recipient: to.replace(/(.{2}).*(@.*)/, '$1***$2'),
        error: error.message
      });
      throw new Error('Failed to send password reset email');
    }
  }
}
