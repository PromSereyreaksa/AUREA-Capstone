import { Request, Response } from 'express';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { SignUpUser } from '../../application/use_cases/SignUpUser';
import { UserValidator } from '../../shared/validators';
import { ResponseHelper } from '../../shared/utils';
import { asyncHandler } from '../../shared/middleware';

const userRepo = new UserRepository();
const signUpUser = new SignUpUser(userRepo);

export const signUpUserController = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, role } = req.body;

  // Validate inputs using shared validators
  UserValidator.validateEmail(email);
  UserValidator.validatePassword(password);
  UserValidator.validateRole(role);

  const user = await signUpUser.execute(email, password, role);

  return ResponseHelper.created(res, { user }, 'User created successfully');
});
