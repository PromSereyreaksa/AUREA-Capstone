import { Request, Response } from 'express';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { SignUpUser } from '../../application/use_cases/SignUpUser';
import { SignUpWithGoogle } from '../../application/use_cases/SignUpWithGoogle';
import { VerifyOTP } from '../../application/use_cases/VerifyOTP';
import { ResendOTP } from '../../application/use_cases/ResendOTP';
import { EmailService } from '../../infrastructure/services/EmailService';
import { UserValidator } from '../../shared/validators/UserValidator';
import { ResponseHelper } from '../../shared/utils';
import { asyncHandler } from '../../shared/middleware';

const userRepo = new UserRepository();
const emailService = new EmailService();
const signUpUser = new SignUpUser(userRepo, emailService);
const signUpWithGoogle = new SignUpWithGoogle(userRepo);
const verifyOTP = new VerifyOTP(userRepo);
const resendOTP = new ResendOTP(userRepo, emailService);

export const signUpUserController = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, role } = req.body;

  // Validate inputs using shared validators
  UserValidator.validateEmail(email);
  UserValidator.validatePassword(password);
  UserValidator.validateRole(role);

  const user = await signUpUser.execute(email, password, role);

  return ResponseHelper.created(res, { 
    user: {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      email_verified: user.email_verified,
      created_at: user.created_at
    },
    
    otp: user.verification_otp
  }, 'User registered successfully. Please verify your email.');
});

export const verifyOTPController = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  // Validate inputs
  UserValidator.validateEmail(email);
  UserValidator.validateOTP(otp);

  const result = await verifyOTP.execute(email, otp);

  return ResponseHelper.success(res, result, 'OTP verified successfully');
});

export const resendOTPController = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  // Validate input
  UserValidator.validateEmail(email);

  const result = await resendOTP.execute(email);

  return ResponseHelper.success(res, result, 'OTP resent successfully');
});

export const googleAuthController = asyncHandler(async (req: Request, res: Response) => {
  const { google_id, email, name, avatar_url, role } = req.body;

  // Validate required fields
  if (!google_id || !email) {
    return ResponseHelper.error(res, 'Google ID and email are required', 400);
  }

  // Validate role if provided
  if (role) {
    UserValidator.validateRole(role);
  }

  const result = await signUpWithGoogle.execute(
    { google_id, email, name, avatar_url },
    role || 'designer'
  );

  return ResponseHelper.success(res, {
    user: {
      user_id: result.user.user_id,
      email: result.user.email,
      role: result.user.role,
      email_verified: result.user.email_verified,
      auth_provider: result.user.auth_provider,
      created_at: result.user.created_at,
      last_login_at: result.user.last_login_at
    },
    token: result.token
  }, 'Google authentication successful');
});

export const getCurrentUserController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.user_id;

  if (!userId) {
    return ResponseHelper.error(res, 'Unauthorized', 401);
  }

  const user = await userRepo.findById(userId);

  if (!user) {
    return ResponseHelper.error(res, 'User not found', 404);
  }

  return ResponseHelper.success(res, {
    user: {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      email_verified: user.email_verified,
      auth_provider: user.auth_provider,
      created_at: user.created_at,
      last_login_at: user.last_login_at
    }
  });
});
