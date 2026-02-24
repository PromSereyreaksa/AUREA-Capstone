// Fee Estimator Types

export interface FeeEstimatorState {
  mode: 'project-based' | 'hourly' | null;
  step: number;
  projectInfo: ProjectInformation;
  deliverables: DeliverableItem[];
  timeComplexity: TimeComplexity;
  isAuthenticated: boolean;
  pdfExtracted: boolean;
}

export interface ProjectInformation {
  name: string;
  description: string;
  uploadMethod: 'pdf' | 'manual' | null;
  pdfFile?: File;
}

export interface DeliverableItem {
  id: string;
  type: string;
  quantity: number;
  isCustom?: boolean;
}

export interface TimeComplexity {
  duration: number; // in hours
  difficulty: 'easy' | 'medium' | 'hard' | 'complex' | null;
  difficultyMultiplier: number;
  licensing: {
    commercialRights: 'personal' | 'small-business' | 'large-corporation' | 'full-commercial' | 'other';
    projectLicensing: 'one-time' | 'limited' | 'exclusive';
    customLicensing?: string;
  };
}

export interface ProgressStep {
  id: number;
  title: string;
  subtitle: string;
  completed: boolean;
  active: boolean;
}