import { Request, Response } from 'express';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { UserProfileRepository } from '../../infrastructure/repositories/UserProfileRepository';
import { SignUpUser } from '../../application/use_cases/SignUpUser';
import { SignInUser } from '../../application/use_cases/SignInUser';
import { SignUpWithGoogle } from '../../application/use_cases/SignUpWithGoogle';
import { VerifyOTP } from '../../application/use_cases/VerifyOTP';
import { ResendOTP } from '../../application/use_cases/ResendOTP';
import { ForgotPassword } from '../../application/use_cases/ForgotPassword';
import { ResetPassword } from '../../application/use_cases/ResetPassword';
import { EmailService } from '../../infrastructure/services/EmailService';
import { UserValidator } from '../../shared/validators/UserValidator';
import { ResponseHelper } from '../../shared/utils';
import { asyncHandler } from '../../shared/middleware';

const userRepo = new UserRepository();
const userProfileRepo = new UserProfileRepository();
const emailService = new EmailService();
const signUpUser = new SignUpUser(userRepo, emailService, userProfileRepo);
const signInUser = new SignInUser(userRepo);
const signUpWithGoogle = new SignUpWithGoogle(userRepo);
const verifyOTP = new VerifyOTP(userRepo);
const resendOTP = new ResendOTP(userRepo, emailService);
const forgotPassword = new ForgotPassword(userRepo, emailService);
const resetPassword = new ResetPassword(userRepo);

export const signUpUserController = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, first_name, last_name } = req.body;

  // Validate inputs using shared validators
  UserValidator.validateEmail(email);
  UserValidator.validatePassword(password);
  UserValidator.validateFirstName(first_name);
  UserValidator.validateLastName(last_name);

  const user = await signUpUser.execute(email, password, first_name.trim(), last_name.trim());

  return ResponseHelper.created(res, { 
    user: {
      user_id: user.user_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      email_verified: user.email_verified,
      created_at: user.created_at
    },
    // Return plain OTP for testing/development
    otp: (user as any).plain_otp
  }, 'User registered successfully. Please verify your email.');
});

export const signInUserController = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validate inputs
  UserValidator.validateEmail(email);
  UserValidator.validatePassword(password);

  const result = await signInUser.execute(email, password);

  return ResponseHelper.success(res, {
    user: result.user,
    token: result.token
  }, 'Sign in successful');
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
  const { google_id, email, name, first_name, last_name, avatar_url } = req.body;

  // Validate required fields
  if (!google_id || !email) {
    return ResponseHelper.error(res, 'Google ID and email are required', 400);
  }

  const result = await signUpWithGoogle.execute(
    { google_id, email, name, first_name, last_name, avatar_url }
  );

  return ResponseHelper.success(res, {
    user: {
      user_id: result.user.user_id,
      email: result.user.email,
      first_name: result.user.first_name,
      last_name: result.user.last_name,
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
      first_name: user.first_name,
      last_name: user.last_name,
      email_verified: user.email_verified,
      auth_provider: user.auth_provider,
      created_at: user.created_at,
      last_login_at: user.last_login_at
    }
  });
});

export const forgotPasswordController = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  // Validate email
  UserValidator.validateEmail(email);

  const result = await forgotPassword.execute(email);

  return ResponseHelper.success(res, result, result.message);
});

export const resetPasswordController = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  // Validate inputs
  UserValidator.validateResetToken(token);
  UserValidator.validatePassword(newPassword);

  const result = await resetPassword.execute(token, newPassword);

  return ResponseHelper.success(res, result, result.message);
});
