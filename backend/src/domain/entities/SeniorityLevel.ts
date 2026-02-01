export enum SeniorityLevel {
  JUNIOR = 'junior',
  MID = 'mid',
  SENIOR = 'senior',
  EXPERT = 'expert'
}

export class SeniorityMultiplier {
  private static readonly MULTIPLIERS: Record<SeniorityLevel, number> = {
    [SeniorityLevel.JUNIOR]: 0.8,
    [SeniorityLevel.MID]: 1.0,
    [SeniorityLevel.SENIOR]: 1.3,
    [SeniorityLevel.EXPERT]: 1.5
  };

  public static getMultiplier(level: SeniorityLevel): number {
    return this.MULTIPLIERS[level];
  }

  public static validate(level: string): SeniorityLevel {
    const normalizedLevel = level.toLowerCase();
    if (!Object.values(SeniorityLevel).includes(normalizedLevel as SeniorityLevel)) {
      throw new Error(`Invalid seniority level: ${level}. Must be one of: junior, mid, senior, expert`);
    }
    return normalizedLevel as SeniorityLevel;
  }

  public static fromExperience(years: number): SeniorityLevel {
    if (years < 2) return SeniorityLevel.JUNIOR;
    if (years < 5) return SeniorityLevel.MID;
    if (years < 10) return SeniorityLevel.SENIOR;
    return SeniorityLevel.EXPERT;
  }

  public static getAllLevels(): SeniorityLevel[] {
    return Object.values(SeniorityLevel);
  }
}
