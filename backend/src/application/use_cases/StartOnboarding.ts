import { IOnboardingSessionRepository } from '../../domain/repositories/IOnboardingSessionRepository';
import { OnboardingSession } from '../../domain/entities/OnboardingSession';
import { randomUUID } from 'crypto';

export class StartOnboarding {
  constructor(
    private onboardingSessionRepo: IOnboardingSessionRepository
  ) {}

  async execute(userId: number): Promise<{
    session_id: string;
    first_question: string;
    progress: { current: number; total: number; percentage: number };
  }> {
    // Check if user already has an active session
    const existingSession = await this.onboardingSessionRepo.findActiveByUserId(userId);
    
    if (existingSession) {
      const currentQuestion = existingSession.getCurrentQuestion();
      return {
        session_id: existingSession.session_id,
        first_question: currentQuestion ? currentQuestion.question_text : 'Session completed',
        progress: existingSession.getProgress()
      };
    }

    // Create new onboarding session with default questions
    const newSession = new OnboardingSession(
      randomUUID(),
      userId,
      'in_progress',
      0,
      OnboardingSession.createDefaultQuestions(),
      {},
      new Date()
    );

    const savedSession = await this.onboardingSessionRepo.create(newSession);
    const firstQuestion = savedSession.getCurrentQuestion();

    if (!firstQuestion) {
      throw new Error('Failed to create onboarding session with questions');
    }

    return {
      session_id: savedSession.session_id,
      first_question: firstQuestion.question_text,
      progress: savedSession.getProgress()
    };
  }
}
