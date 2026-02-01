export enum ClientType {
  STARTUP = 'startup',
  SME = 'sme',           // Small-medium enterprise
  CORPORATE = 'corporate',
  NGO = 'ngo',
  GOVERNMENT = 'government'
}

export enum ClientRegion {
  CAMBODIA = 'cambodia',
  SOUTHEAST_ASIA = 'southeast_asia',
  GLOBAL = 'global'
}

export class ClientContext {
  constructor(
    public readonly clientType: ClientType,
    public readonly clientRegion: ClientRegion
  ) {}

  public static fromStrings(type: string, region: string): ClientContext {
    const normalizedType = type.toLowerCase();
    const normalizedRegion = region.toLowerCase();

    if (!Object.values(ClientType).includes(normalizedType as ClientType)) {
      throw new Error(`Invalid client type: ${type}. Must be one of: startup, sme, corporate, ngo, government`);
    }
    if (!Object.values(ClientRegion).includes(normalizedRegion as ClientRegion)) {
      throw new Error(`Invalid client region: ${region}. Must be one of: cambodia, southeast_asia, global`);
    }
    return new ClientContext(normalizedType as ClientType, normalizedRegion as ClientRegion);
  }

  public getContextMultiplier(): number {
    // Basic multiplier based on client type and region
    // Future enhancement: ML-based multipliers
    let multiplier = 1.0;

    // Client type adjustments
    switch (this.clientType) {
      case ClientType.STARTUP:
        multiplier *= 0.9; // Startups typically have lower budgets
        break;
      case ClientType.CORPORATE:
        multiplier *= 1.2; // Corporate clients can afford premium rates
        break;
      case ClientType.GOVERNMENT:
        multiplier *= 1.1; // Government projects often pay well but slower
        break;
      case ClientType.NGO:
        multiplier *= 0.85; // NGOs often have limited budgets
        break;
      case ClientType.SME:
        multiplier *= 1.0; // Baseline
        break;
    }

    // Region adjustments
    switch (this.clientRegion) {
      case ClientRegion.CAMBODIA:
        multiplier *= 1.0; // Baseline for local market
        break;
      case ClientRegion.SOUTHEAST_ASIA:
        multiplier *= 1.15; // Regional clients pay slightly more
        break;
      case ClientRegion.GLOBAL:
        multiplier *= 1.3; // International clients expect global rates
        break;
    }

    return multiplier;
  }

  public static getAllClientTypes(): ClientType[] {
    return Object.values(ClientType);
  }

  public static getAllRegions(): ClientRegion[] {
    return Object.values(ClientRegion);
  }
}
