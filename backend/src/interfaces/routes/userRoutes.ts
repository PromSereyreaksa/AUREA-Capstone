import { Router } from 'express';
import { signUpUserController } from '../controllers/UserController';

const router = Router();

// POST /api/users - Create a new user (sign up)
router.post('/', signUpUserController);

export default router;
