export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  COMPLEX = 'complex'
}

export class DifficultyMultiplier {
  private static readonly MULTIPLIERS: Record<DifficultyLevel, number> = {
    [DifficultyLevel.EASY]: 1.0,
    [DifficultyLevel.MEDIUM]: 1.5,
    [DifficultyLevel.HARD]: 2.0,
    [DifficultyLevel.COMPLEX]: 2.5
  };

  private static normalize(level?: string): DifficultyLevel {
    const normalized = (level || '').toLowerCase().trim();
    if (!normalized) return DifficultyLevel.EASY;

    if (!Object.values(DifficultyLevel).includes(normalized as DifficultyLevel)) {
      return DifficultyLevel.EASY;
    }

    return normalized as DifficultyLevel;
  }

  public static getMultiplier(level?: string): number {
    const normalized = this.normalize(level);
    return this.MULTIPLIERS[normalized];
  }

  public static getAllLevels(): DifficultyLevel[] {
    return Object.values(DifficultyLevel);
  }
}
