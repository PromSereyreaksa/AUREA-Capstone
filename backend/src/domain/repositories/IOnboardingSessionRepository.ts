import { OnboardingSession } from '../entities/OnboardingSession';

export interface IOnboardingSessionRepository {
  create(session: OnboardingSession): Promise<OnboardingSession>;
  findById(sessionId: string): Promise<OnboardingSession | null>;
  findActiveByUserId(userId: number): Promise<OnboardingSession | null>;
  update(sessionId: string, session: Partial<OnboardingSession>): Promise<OnboardingSession>;
  delete(sessionId: string): Promise<void>;
}
