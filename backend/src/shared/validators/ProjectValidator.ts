import { BaseValidator } from './BaseValidator';

interface DeliverableInput {
  deliverable_type: string;
  quantity: number | string;
}

interface ProjectInput {
  project_name?: string;
  title?: string;
  description?: string;
  duration?: number | string;
  difficulty?: string;
  licensing?: string;
  usage_rights?: string;
  result?: string;
  deliverables?: DeliverableInput[];
}

export class ProjectValidator extends BaseValidator {
  private static readonly VALID_DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Complex'];
  private static readonly VALID_LICENSING = ['One-Time Used', 'Limited Used', 'Exclusive License', 'Commercial', 'MIT', 'Apache 2.0'];

  static validateProjectId(projectId: any): number {
    this.throwIf(this.isNullOrEmpty(projectId), 'project_id is required');
    return this.parsePositiveInt(projectId, 'project_id');
  }

  static validateManualProjectInput(data: ProjectInput): void {
    this.throwIf(
      this.isNullOrEmpty(data.project_name),
      'project_name is required'
    );

    this.throwIf(
      this.isNullOrEmpty(data.title),
      'title is required'
    );

    this.throwIf(
      !Array.isArray(data.deliverables) || data.deliverables.length === 0,
      'At least one deliverable is required'
    );

    this.validateDeliverables(data.deliverables!);
  }

  static validateDeliverables(deliverables: DeliverableInput[]): void {
    deliverables.forEach((d, index) => {
      this.throwIf(
        this.isNullOrEmpty(d.deliverable_type),
        `Deliverable ${index + 1}: deliverable_type is required`
      );

      this.throwIf(
        !this.isPositiveNumber(d.quantity),
        `Deliverable ${index + 1}: quantity must be a positive number`
      );
    });
  }

  static validateDuration(duration: any): number | undefined {
    if (this.isNullOrEmpty(duration)) return undefined;
    return this.parsePositiveInt(duration, 'duration');
  }

  static validateDifficulty(difficulty: any): string | undefined {
    if (this.isNullOrEmpty(difficulty)) return undefined;
    const normalized = difficulty.trim();
    // Allow any difficulty, but log warning if not standard
    if (!this.VALID_DIFFICULTIES.includes(normalized)) {
      console.warn(`Non-standard difficulty: ${normalized}`);
    }
    return normalized;
  }

  static validateLicensing(licensing: any): string | undefined {
    if (this.isNullOrEmpty(licensing)) return undefined;
    return licensing.trim();
  }

  static validateUsageRights(usageRights: any): string | undefined {
    if (this.isNullOrEmpty(usageRights)) return undefined;
    return usageRights.trim();
  }

  static validateQuantity(quantity: any): number {
    return this.parsePositiveInt(quantity, 'quantity');
  }

  static sanitizeProjectData(data: ProjectInput) {
    return {
      project_name: data.project_name?.trim() || '',
      title: data.title?.trim() || '',
      description: data.description?.trim() || undefined,
      duration: this.validateDuration(data.duration),
      difficulty: this.validateDifficulty(data.difficulty),
      licensing: this.validateLicensing(data.licensing),
      usage_rights: this.validateUsageRights(data.usage_rights),
      result: data.result?.trim() || undefined,
      deliverables: data.deliverables?.map(d => ({
        deliverable_type: d.deliverable_type.trim(),
        quantity: this.validateQuantity(d.quantity)
      })) || []
    };
  }
}
