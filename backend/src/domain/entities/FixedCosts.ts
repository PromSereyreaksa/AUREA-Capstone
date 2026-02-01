export class FixedCosts {
  constructor(
    public readonly rent: number,          // Office/workspace rent (monthly)
    public readonly equipment: number,     // Computers, software licenses (monthly)
    public readonly insurance: number,     // Health, liability insurance (monthly)
    public readonly utilities: number,     // Internet, electricity (monthly)
    public readonly taxes: number          // Business registration, taxes (monthly)
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.rent < 0 || this.equipment < 0 || this.insurance < 0 || 
        this.utilities < 0 || this.taxes < 0) {
      throw new Error('All fixed costs must be non-negative');
    }
  }

  public total(): number {
    return this.rent + this.equipment + this.insurance + this.utilities + this.taxes;
  }

  public static fromDb(data: {
    rent: number;
    equipment: number;
    insurance: number;
    utilities: number;
    taxes: number;
  }): FixedCosts {
    return new FixedCosts(
      data.rent || 0,
      data.equipment || 0,
      data.insurance || 0,
      data.utilities || 0,
      data.taxes || 0
    );
  }

  public toDb(): {
    fixed_cost_rent: number;
    fixed_cost_equipment: number;
    fixed_cost_insurance: number;
    fixed_cost_utilities: number;
    fixed_cost_taxes: number;
  } {
    return {
      fixed_cost_rent: this.rent,
      fixed_cost_equipment: this.equipment,
      fixed_cost_insurance: this.insurance,
      fixed_cost_utilities: this.utilities,
      fixed_cost_taxes: this.taxes
    };
  }
}
