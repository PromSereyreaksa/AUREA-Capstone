import { Request, Response, NextFunction } from 'express';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { SignUpUser } from '../../application/use_cases/SignUpUser';

const userRepo = new UserRepository();
const signUpUser = new SignUpUser(userRepo);

export const signUpUserController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required.' });
    }``
    const user = await signUpUser.execute(email, password, role);
    return res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
};
