export class VariableCosts {
  constructor(
    public readonly materials: number,     // Stock photos, fonts, plugins (monthly estimate)
    public readonly outsourcing: number,   // Freelance help (monthly estimate)
    public readonly marketing: number      // Client acquisition costs (monthly estimate)
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.materials < 0 || this.outsourcing < 0 || this.marketing < 0) {
      throw new Error('All variable costs must be non-negative');
    }
  }

  public total(): number {
    return this.materials + this.outsourcing + this.marketing;
  }

  public static fromDb(data: {
    materials: number;
    outsourcing: number;
    marketing: number;
  }): VariableCosts {
    return new VariableCosts(
      data.materials || 0,
      data.outsourcing || 0,
      data.marketing || 0
    );
  }

  public toDb(): {
    variable_cost_materials: number;
    variable_cost_outsourcing: number;
    variable_cost_marketing: number;
  } {
    return {
      variable_cost_materials: this.materials,
      variable_cost_outsourcing: this.outsourcing,
      variable_cost_marketing: this.marketing
    };
  }
}
