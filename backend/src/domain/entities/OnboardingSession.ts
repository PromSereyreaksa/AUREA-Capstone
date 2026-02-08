export interface OnboardingQuestion {
  question_key: string;       // e.g., 'fixed_costs_rent'
  question_text: string;
  expected_type: 'number' | 'string' | 'array';
  answered: boolean;
  answer?: any;
  validation_rules?: {
    min?: number;
    max?: number;
    required?: boolean;
    pattern?: string;
  };
}

export class OnboardingSession {
  constructor(
    public session_id: string,                  // UUID
    public user_id: number,
    public status: 'in_progress' | 'completed' | 'abandoned',
    public current_question_index: number,
    public questions: OnboardingQuestion[],
    public collected_data: Record<string, any>, // Temporary storage
    public started_at: Date,
    public completed_at?: Date
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.session_id || this.session_id.length === 0) {
      throw new Error('Session ID is required');
    }
    if (this.user_id <= 0) {
      throw new Error('Invalid user_id');
    }
    if (!['in_progress', 'completed', 'abandoned'].includes(this.status)) {
      throw new Error('Invalid status');
    }
    if (this.current_question_index < 0) {
      throw new Error('Question index cannot be negative');
    }
  }

  public getCurrentQuestion(): OnboardingQuestion | null {
    if (this.current_question_index >= this.questions.length) {
      return null;
    }
    return this.questions[this.current_question_index];
  }

  public answerCurrentQuestion(answer: any): void {
    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion) {
      throw new Error('No current question to answer');
    }

    currentQuestion.answer = answer;
    currentQuestion.answered = true;
    this.collected_data[currentQuestion.question_key] = answer;
  }

  public moveToNextQuestion(): boolean {
    this.current_question_index++;
    return this.current_question_index < this.questions.length;
  }

  public isComplete(): boolean {
    return this.questions.every(q => q.answered);
  }

  public markCompleted(): void {
    this.status = 'completed';
    this.completed_at = new Date();
  }

  public markAbandoned(): void {
    this.status = 'abandoned';
  }

  public getProgress(): { current: number; total: number; percentage: number } {
    const answeredCount = this.questions.filter(q => q.answered).length;
    return {
      current: answeredCount,
      total: this.questions.length,
      percentage: Math.round((answeredCount / this.questions.length) * 100)
    };
  }

  public static createDefaultQuestions(): OnboardingQuestion[] {
    return [
      {
        question_key: 'fixed_costs_rent',
        question_text: "Let's calculate your sustainable hourly rate! First, what's your monthly rent or workspace cost in USD?",
        expected_type: 'number',
        answered: false,
        validation_rules: { min: 0, required: true }
      },
      {
        question_key: 'fixed_costs_equipment',
        question_text: 'How much do you spend monthly on equipment, software, and tools (e.g., Adobe subscription, laptop maintenance)?',
        expected_type: 'number',
        answered: false,
        validation_rules: { min: 0, required: true }
      },
      {
        question_key: 'fixed_costs_utilities_insurance_taxes',
        question_text: 'What about insurance, utilities, and taxes per month? (Combined amount)',
        expected_type: 'number',
        answered: false,
        validation_rules: { min: 0, required: true }
      },
      {
        question_key: 'variable_costs_materials',
        question_text: 'How much do you spend monthly on materials like stock photos, fonts, or plugins?',
        expected_type: 'number',
        answered: false,
        validation_rules: { min: 0, required: true }
      },
      {
        question_key: 'desired_income',
        question_text: "What's your desired monthly take-home income (after all costs)?",
        expected_type: 'number',
        answered: false,
        validation_rules: { min: 1, required: true }
      },
      {
        question_key: 'billable_hours',
        question_text: 'How many hours per month can you realistically bill to clients? (Most freelancers bill 80-120 hours/month)',
        expected_type: 'number',
        answered: false,
        validation_rules: { min: 40, max: 200, required: true }
      },
      {
        question_key: 'profit_margin',
        question_text: 'What profit margin do you want? (e.g., 15% for sustainability, enter as decimal like 0.15)',
        expected_type: 'number',
        answered: false,
        validation_rules: { min: 0.05, max: 0.50, required: true }
      },
      {
        question_key: 'experience_years',
        question_text: 'How many years of experience do you have in graphic design?',
        expected_type: 'number',
        answered: false,
        validation_rules: { min: 0, max: 50, required: true }
      },
      {
        question_key: 'skills',
        question_text: 'What services do you offer? (e.g., logo design, branding, web design - comma separated)',
        expected_type: 'string',
        answered: false,
        validation_rules: { required: true }
      },
      {
        question_key: 'seniority_level',
        question_text: 'Finally, how would you describe your skill level: junior, mid, senior, or expert?',
        expected_type: 'string',
        answered: false,
        validation_rules: { required: true, pattern: 'junior|mid|senior|expert' }
      }
    ];
  }
}
