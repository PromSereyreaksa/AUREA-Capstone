import { Router } from 'express';
import {
  createProfileController,
  getProfileController,
  getUserProfileByIdController,
  updateProfileController,
  deleteProfileController,
  uploadAvatarController,
  deleteAvatarController,
} from '../controllers/ProfileController';
import { authMiddleware } from '../../shared/middleware/authMiddleware';
import { avatarUpload } from '../../shared/middleware/uploadMiddleware';

// Profile routes for user profile CRUD operations
const profileRouter = Router();

// Profile CRUD routes
profileRouter.post('/', authMiddleware, createProfileController);
profileRouter.get('/', authMiddleware, getProfileController);
profileRouter.get('/:userId', getUserProfileByIdController);
profileRouter.put('/', authMiddleware, updateProfileController);
profileRouter.delete('/', authMiddleware, deleteProfileController);

// Avatar upload/delete routes
profileRouter.post('/avatar', authMiddleware, avatarUpload.single('avatar'), uploadAvatarController);
profileRouter.delete('/avatar', authMiddleware, deleteAvatarController);

export default profileRouter;
