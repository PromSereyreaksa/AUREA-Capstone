import { IOnboardingSessionRepository } from '../../domain/repositories/IOnboardingSessionRepository';
import { GeminiService } from '../../infrastructure/services/GeminiService';

interface AnswerQuestionInput {
  session_id: string;
  user_answer: string;
}

interface AnswerQuestionOutput {
  is_valid: boolean;
  next_question?: string;
  validation_error?: string;
  onboarding_complete?: boolean;
  progress: { current: number; total: number; percentage: number };
  extracted_value?: any;
}

export class AnswerOnboardingQuestion {
  constructor(
    private onboardingSessionRepo: IOnboardingSessionRepository,
    private geminiService: GeminiService
  ) {}

  async execute(input: AnswerQuestionInput): Promise<AnswerQuestionOutput> {
    // 1. Fetch session
    const session = await this.onboardingSessionRepo.findById(input.session_id);
    
    if (!session) {
      throw new Error('Onboarding session not found');
    }

    if (session.status !== 'in_progress') {
      throw new Error(`Session is ${session.status}. Cannot answer questions.`);
    }

    const currentQuestion = session.getCurrentQuestion();
    
    if (!currentQuestion) {
      return {
        is_valid: true,
        onboarding_complete: true,
        progress: session.getProgress()
      };
    }

    // 2. Validate answer using AI
    const validation = await this.validateAnswer(
      currentQuestion.question_key,
      currentQuestion.expected_type,
      input.user_answer,
      currentQuestion.validation_rules
    );

    if (!validation.valid) {
      return {
        is_valid: false,
        validation_error: validation.error,
        next_question: currentQuestion.question_text, // Ask same question again
        progress: session.getProgress()
      };
    }

    // 3. Store answer
    session.answerCurrentQuestion(validation.extractedValue);
    
    // 4. Move to next question
    const hasMore = session.moveToNextQuestion();
    
    if (!hasMore || session.isComplete()) {
      // Mark session as completed
      session.markCompleted();
      await this.onboardingSessionRepo.update(session.session_id, session);
      
      return {
        is_valid: true,
        onboarding_complete: true,
        progress: session.getProgress(),
        extracted_value: validation.extractedValue
      };
    }

    // 5. Save progress and return next question
    await this.onboardingSessionRepo.update(session.session_id, session);
    
    const nextQuestion = session.getCurrentQuestion();
    
    return {
      is_valid: true,
      next_question: nextQuestion ? nextQuestion.question_text : undefined,
      onboarding_complete: false,
      progress: session.getProgress(),
      extracted_value: validation.extractedValue
    };
  }

  private async validateAnswer(
    questionKey: string,
    expectedType: 'number' | 'string' | 'array',
    userAnswer: string,
    validationRules?: any
  ): Promise<{ valid: boolean; extractedValue?: any; error?: string }> {
    try {
      // Try AI-powered validation first
      const aiValidation = await this.geminiService.validateOnboardingAnswer(
        questionKey,
        userAnswer,
        expectedType,
        validationRules
      );
      
      if (aiValidation.is_valid) {
        // Apply additional validation rules if specified
        if (validationRules) {
          const ruleValidation = this.applyValidationRules(
            aiValidation.normalized_value,
            validationRules
          );
          if (!ruleValidation.valid) {
            return ruleValidation;
          }
        }
        return { valid: true, extractedValue: aiValidation.normalized_value };
      }
      
      return { valid: false, error: aiValidation.feedback || 'Invalid answer' };
    } catch (error: any) {
      // Fallback to basic validation if AI fails
      console.warn('AI validation failed, using fallback:', error.message);
      return this.basicValidation(expectedType, userAnswer, validationRules);
    }
  }

  private basicValidation(
    expectedType: 'number' | 'string' | 'array',
    userAnswer: string,
    validationRules?: any
  ): { valid: boolean; extractedValue?: any; error?: string } {
    try {
      if (expectedType === 'number') {
        // Extract number from string (e.g., "$200" -> 200, "two hundred" -> fallback to error)
        const cleanedAnswer = userAnswer.replace(/[^0-9.-]/g, '');
        const num = parseFloat(cleanedAnswer);
        
        if (isNaN(num)) {
          return {
            valid: false,
            error: 'Please provide a valid number. For example, "200" or "15.5"'
          };
        }

        if (validationRules) {
          const ruleValidation = this.applyValidationRules(num, validationRules);
          if (!ruleValidation.valid) {
            return ruleValidation;
          }
        }

        return { valid: true, extractedValue: num };
      }

      if (expectedType === 'string') {
        const trimmed = userAnswer.trim();
        if (validationRules?.required && trimmed.length === 0) {
          return {
            valid: false,
            error: 'This field is required. Please provide an answer.'
          };
        }
        
        if (validationRules?.pattern) {
          const regex = new RegExp(validationRules.pattern, 'i');
          if (!regex.test(trimmed)) {
            return {
              valid: false,
              error: `Answer must match pattern: ${validationRules.pattern}`
            };
          }
        }

        return { valid: true, extractedValue: trimmed };
      }

      if (expectedType === 'array') {
        // Split by comma, semicolon, or newline
        const items = userAnswer
          .split(/[,;\n]/)
          .map(item => item.trim())
          .filter(item => item.length > 0);
        
        if (validationRules?.required && items.length === 0) {
          return {
            valid: false,
            error: 'Please provide at least one item.'
          };
        }

        return { valid: true, extractedValue: items };
      }

      return {
        valid: false,
        error: 'Unexpected validation error. Please try again.'
      };
    } catch (error: any) {
      console.error(`[AnswerOnboarding] Validation error for type '${expectedType}':`, error.message);
      return {
        valid: false,
        error: 'Validation error. Please try again with a different format.'
      };
    }
  }

  private applyValidationRules(
    value: any,
    rules: any
  ): { valid: boolean; error?: string } {
    if (rules.required && (value === null || value === undefined || value === '')) {
      return {
        valid: false,
        error: 'This field is required.'
      };
    }

    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        return {
          valid: false,
          error: `Value must be at least ${rules.min}.`
        };
      }
      if (rules.max !== undefined && value > rules.max) {
        return {
          valid: false,
          error: `Value must be at most ${rules.max}.`
        };
      }
    }

    return { valid: true };
  }
}
