-- Migration: Add onboarding_sessions table
-- Purpose: Store AI-driven onboarding conversation state
-- Date: 2026-01-29

CREATE TABLE IF NOT EXISTS onboarding_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Session state
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  current_question_index INTEGER DEFAULT 0 CHECK (current_question_index >= 0),
  
  -- Questions and answers (stored as JSONB for flexibility)
  questions JSONB NOT NULL DEFAULT '[]',
  collected_data JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  -- Constraints
  CHECK (
    (status = 'completed' AND completed_at IS NOT NULL) OR
    (status IN ('in_progress', 'abandoned'))
  )
);

-- Indexes for faster queries
CREATE INDEX idx_onboarding_user ON onboarding_sessions(user_id);
CREATE INDEX idx_onboarding_status ON onboarding_sessions(status);
CREATE INDEX idx_onboarding_started ON onboarding_sessions(started_at DESC);

-- Index for finding active sessions
CREATE INDEX idx_onboarding_user_active ON onboarding_sessions(user_id, status) WHERE status = 'in_progress';

-- Comments for documentation
COMMENT ON TABLE onboarding_sessions IS 'Stores AI-driven pricing onboarding conversation state for resumable sessions';
COMMENT ON COLUMN onboarding_sessions.questions IS 'Array of OnboardingQuestion objects with question text, type, and answers';
COMMENT ON COLUMN onboarding_sessions.collected_data IS 'Key-value pairs of answered questions for easy access';
COMMENT ON COLUMN onboarding_sessions.status IS 'Session lifecycle: in_progress (active), completed (finished), abandoned (user left)';
