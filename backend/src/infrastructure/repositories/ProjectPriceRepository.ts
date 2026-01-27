import { IProjectPriceRepository } from '../../domain/repositories/IProjectPriceRepository';
import { ProjectPrice } from '../../domain/entities/ProjectPrice';
import { supabase } from '../db/supabaseClient';
import { mapProjectPriceFromDb, mapProjectPriceToDb } from '../mappers/projectPriceMapper';

export class ProjectPriceRepository implements IProjectPriceRepository {
  async create(project: ProjectPrice): Promise<ProjectPrice> {
    const row = mapProjectPriceToDb(project);
    const { data, error } = await supabase
      .from('project_price')
      .insert([row])
      .select()
      .single();

    if (error) throw error;
    return mapProjectPriceFromDb(data);
  }

  async findById(projectId: number): Promise<ProjectPrice | null> {
    const { data, error } = await supabase
      .from('project_price')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (error || !data) return null;
    return mapProjectPriceFromDb(data);
  }

  async findByUserId(userId: number): Promise<ProjectPrice[]> {
    const { data, error } = await supabase
      .from('project_price')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data ? data.map(mapProjectPriceFromDb) : [];
  }
}
