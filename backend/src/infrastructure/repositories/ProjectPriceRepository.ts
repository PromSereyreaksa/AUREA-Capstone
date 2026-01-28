import { IProjectPriceRepository } from '../../domain/repositories/IProjectPriceRepository';
import { ProjectPrice } from '../../domain/entities/ProjectPrice';
import { supabase } from '../db/supabaseClient';
import { mapProjectPriceFromDb, mapProjectPriceToDb } from '../mappers/projectPriceMapper';
import { DatabaseError } from '../../shared/errors';

export class ProjectPriceRepository implements IProjectPriceRepository {
  async create(project: ProjectPrice): Promise<ProjectPrice> {
    const row = mapProjectPriceToDb(project);
    const { data, error } = await supabase
      .from('project_price')
      .insert([row])
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to create project: ${error.message}`);
    }
    return mapProjectPriceFromDb(data);
  }

  async findById(projectId: number): Promise<ProjectPrice | null> {
    const { data, error } = await supabase
      .from('project_price')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (error) {
      // PGRST116 = no rows found, which is expected for findById
      if (error.code === 'PGRST116') return null;
      throw new DatabaseError(`Failed to find project: ${error.message}`);
    }
    if (!data) return null;
    return mapProjectPriceFromDb(data);
  }

  async findByUserId(userId: number): Promise<ProjectPrice[]> {
    const { data, error } = await supabase
      .from('project_price')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new DatabaseError(`Failed to find projects for user: ${error.message}`);
    }
    return data ? data.map(mapProjectPriceFromDb) : [];
  }

  async update(projectId: number, project: Partial<ProjectPrice>): Promise<ProjectPrice> {
    const row = mapProjectPriceToDb(project as ProjectPrice);
    // Remove user_id from update to prevent modification
    const { user_id, ...updateData } = row;

    const { data, error } = await supabase
      .from('project_price')
      .update(updateData)
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to update project: ${error.message}`);
    }
    if (!data) {
      throw new DatabaseError('Project not found');
    }
    return mapProjectPriceFromDb(data);
  }

  async delete(projectId: number): Promise<void> {
    const { error } = await supabase
      .from('project_price')
      .delete()
      .eq('project_id', projectId);

    if (error) {
      throw new DatabaseError(`Failed to delete project: ${error.message}`);
    }
  }
}
