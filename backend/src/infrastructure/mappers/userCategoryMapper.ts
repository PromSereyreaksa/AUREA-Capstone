import { UserCategory } from '../../domain/entities/UserCategory';

export function mapUserCategoryToDb(userCategory: UserCategory) {
  return {
    portfolio_id: userCategory.portfolio_id,
    category_id: userCategory.category_id
  };
}

export function mapUserCategoryFromDb(data: any): UserCategory {
  return new UserCategory(
    data.portfolio_id,
    data.category_id
  );
}
