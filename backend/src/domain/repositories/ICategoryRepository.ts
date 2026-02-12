import { Category } from '../entities/Category';

export interface ICategoryRepository {
  findByNameLike(name: string): Promise<Category | null>;
  findAll(): Promise<Category[]>;
}
