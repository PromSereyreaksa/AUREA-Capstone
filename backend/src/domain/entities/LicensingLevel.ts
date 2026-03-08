export class LicensingMultiplier {
  private static readonly MULTIPLIERS: Record<string, number> = {
    one_time: 1.0,
    one_time_use: 1.0,
    multi_use: 1.2,
    limited: 1.2,
    exclusive: 1.5,
    buyout: 2.0,
    royalty: 1.3
  };

  private static normalize(licensing?: string): string {
    return (licensing || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  public static getMultiplier(licensing?: string): number {
    const key = this.normalize(licensing);
    return this.MULTIPLIERS[key] || 1.0;
  }
}
