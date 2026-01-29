import { Category } from '../../domain/entities/Category';

export function mapCategoryToDb(category: Category) {
  return {
    category_name: category.category_name
  };
}

export function mapCategoryFromDb(data: any): Category {
  return new Category(
    data.category_id,
    data.category_name
  );
}
