export class BasePrice {
  constructor(
    public base_price_id: number,
    public user_id: number,
    public base_rate_result?: number,
    public profit_margin?: number,
    public annual_rent?: number,
    public equipment_cost?: number,
    public labor_cost?: number,
    public annual_salary?: number,
    public billable_hours?: number
  ) {}
}
