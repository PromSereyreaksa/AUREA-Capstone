import { BasePrice } from '../../domain/entities/BasePrice';

export function mapBasePriceToDb(basePrice: BasePrice) {
  return {
    user_id: basePrice.user_id,
    base_rate_result: basePrice.base_rate_result,
    profit_margin: basePrice.profit_margin,
    annual_rent: basePrice.annual_rent,
    equipment_cost: basePrice.equipment_cost,
    labor_cost: basePrice.labor_cost,
    annual_salary: basePrice.annual_salary,
    billable_hours: basePrice.billable_hours
  };
}

export function mapBasePriceFromDb(data: any): BasePrice {
  return new BasePrice(
    data.base_price_id,
    data.user_id,
    data.base_rate_result,
    data.profit_margin,
    data.annual_rent,
    data.equipment_cost,
    data.labor_cost,
    data.annual_salary,
    data.billable_hours
  );
}
