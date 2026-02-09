import { Router } from 'express';
import {
  createProfileController,
  getProfileController,
  getUserProfileByIdController,
  updateProfileController,
  deleteProfileController,
} from '../controllers/ProfileController';
import { authMiddleware } from '../../shared/middleware/authMiddleware';

// Profile routes for user profile CRUD operations
const profileRouter = Router();

profileRouter.post('/', authMiddleware, createProfileController);
profileRouter.get('/', authMiddleware, getProfileController);
profileRouter.get('/:userId', getUserProfileByIdController);
profileRouter.put('/', authMiddleware, updateProfileController);
profileRouter.delete('/', authMiddleware, deleteProfileController);

export default profileRouter;
