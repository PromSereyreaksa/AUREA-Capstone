import { Router } from 'express';
import { signUpUserController } from '../controllers/UserController';

const router = Router();

// POST /api/users/signUpUser - Create a new user (sign up)
router.post('/signup', signUpUserController);

export default router;
