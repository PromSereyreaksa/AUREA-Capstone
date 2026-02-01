import { OnboardingSession, OnboardingQuestion } from '../../domain/entities/OnboardingSession';

export function mapOnboardingSessionToDb(session: OnboardingSession) {
  return {
    session_id: session.session_id,
    user_id: session.user_id,
    status: session.status,
    current_question_index: session.current_question_index,
    questions: JSON.stringify(session.questions),
    collected_data: JSON.stringify(session.collected_data),
    started_at: session.started_at,
    completed_at: session.completed_at
  };
}

export function mapOnboardingSessionFromDb(data: any): OnboardingSession {
  // Parse JSONB fields
  const questions: OnboardingQuestion[] = typeof data.questions === 'string' 
    ? JSON.parse(data.questions) 
    : data.questions;
  
  const collectedData: Record<string, any> = typeof data.collected_data === 'string'
    ? JSON.parse(data.collected_data)
    : data.collected_data;

  return new OnboardingSession(
    data.session_id,
    data.user_id,
    data.status,
    data.current_question_index || 0,
    questions,
    collectedData,
    data.started_at,
    data.completed_at
  );
}
