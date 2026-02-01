import { supabase } from '../db/supabaseClient';
import { IOnboardingSessionRepository } from '../../domain/repositories/IOnboardingSessionRepository';
import { OnboardingSession } from '../../domain/entities/OnboardingSession';
import { mapOnboardingSessionToDb, mapOnboardingSessionFromDb } from '../mappers/onboardingSessionMapper';

export class OnboardingSessionRepository implements IOnboardingSessionRepository {
  private tableName = 'onboarding_sessions';

  async create(session: OnboardingSession): Promise<OnboardingSession> {
    const dbData = mapOnboardingSessionToDb(session);

    const { data, error } = await supabase
      .from(this.tableName)
      .insert(dbData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create onboarding session: ${error.message}`);
    }

    return mapOnboardingSessionFromDb(data);
  }

  async findById(sessionId: string): Promise<OnboardingSession | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      throw new Error(`Failed to find onboarding session: ${error.message}`);
    }

    return data ? mapOnboardingSessionFromDb(data) : null;
  }

  async findActiveByUserId(userId: number): Promise<OnboardingSession | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      throw new Error(`Failed to find active onboarding session: ${error.message}`);
    }

    return data ? mapOnboardingSessionFromDb(data) : null;
  }

  async update(sessionId: string, session: Partial<OnboardingSession>): Promise<OnboardingSession> {
    const updateData: any = {};

    if (session.status !== undefined) {
      updateData.status = session.status;
    }
    if (session.current_question_index !== undefined) {
      updateData.current_question_index = session.current_question_index;
    }
    if (session.questions !== undefined) {
      updateData.questions = JSON.stringify(session.questions);
    }
    if (session.collected_data !== undefined) {
      updateData.collected_data = JSON.stringify(session.collected_data);
    }
    if (session.completed_at !== undefined) {
      updateData.completed_at = session.completed_at;
    }

    const { data, error } = await supabase
      .from(this.tableName)
      .update(updateData)
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update onboarding session: ${error.message}`);
    }

    return mapOnboardingSessionFromDb(data);
  }

  async delete(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('session_id', sessionId);

    if (error) {
      throw new Error(`Failed to delete onboarding session: ${error.message}`);
    }
  }
}
