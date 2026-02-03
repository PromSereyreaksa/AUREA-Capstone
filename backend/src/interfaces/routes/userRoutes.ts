import { Router } from 'express';
import { signUpUserController, verifyOTPController, resendOTPController, getCurrentUserController, googleAuthController } from '../controllers/UserController';
import { authMiddleware } from '../../shared/middleware/authMiddleware';

const router = Router();

// Public routes (no auth required)
// POST /api/users/signup - Create a new user (sign up)
router.post('/signup', signUpUserController);

// POST /api/users/google - Authenticate with Google OAuth
router.post('/google', googleAuthController);

// POST /api/users/verify-otp - Verify email with OTP (returns JWT token)
router.post('/verify-otp', verifyOTPController);

// POST /api/users/resend-otp - Resend OTP code
router.post('/resend-otp', resendOTPController);

// Protected routes (auth required)
// GET /api/users/me - Get current authenticated user
router.get('/me', authMiddleware, getCurrentUserController);

export default router;
