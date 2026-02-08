import { BaseValidator } from './BaseValidator';

interface DeliverableInput {
  deliverable_type: string;
  quantity: number | string;
  items?: string[]; // Sub-items/components included in this deliverable
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

  static validateUpdateProjectInput(data: ProjectInput): void {
    // For updates, at least one field should be provided
    const hasFields = data.project_name || data.title || data.description || 
                      data.duration || data.difficulty || data.licensing || 
                      data.usage_rights || data.result || data.deliverables;

    this.throwIf(
      !hasFields,
      'At least one field must be provided for update'
    );

    // Validate specific fields if provided
    if (data.deliverables) {
      this.validateDeliverables(data.deliverables);
    }
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
    // Helper function to truncate strings to max length
    const truncate = (str: string | undefined, maxLen: number): string | undefined => {
      if (!str) return undefined;
      const trimmed = str.trim();
      return trimmed.length > maxLen ? trimmed.substring(0, maxLen) : trimmed || undefined;
    };

    return {
      project_name: truncate(data.project_name, 100) || '',
      title: truncate(data.title, 100) || '',
      description: truncate(data.description, 500),
      duration: this.validateDuration(data.duration),
      difficulty: this.validateDifficulty(data.difficulty),
      licensing: truncate(this.validateLicensing(data.licensing), 100),
      usage_rights: truncate(this.validateUsageRights(data.usage_rights), 100),
      result: truncate(data.result, 255),
      deliverables: data.deliverables?.map(d => ({
        deliverable_type: truncate(d.deliverable_type, 100) || '',
        quantity: this.validateQuantity(d.quantity),
        items: Array.isArray(d.items) 
          ? d.items.map(item => truncate(String(item), 100) || '').filter(Boolean)
          : []
      })) || []
    };
  }
}
