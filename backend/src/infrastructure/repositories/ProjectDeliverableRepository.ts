import { IProjectDeliverableRepository } from '../../domain/repositories/IProjectDeliverableRepository';
import { ProjectDeliverable } from '../../domain/entities/ProjectDeliverable';
import { supabase } from '../db/supabaseClient';
import { mapProjectDeliverableFromDb, mapProjectDeliverableToDb } from '../mappers/projectDeliverableMapper';

export class ProjectDeliverableRepository implements IProjectDeliverableRepository {
  async create(deliverable: ProjectDeliverable): Promise<ProjectDeliverable> {
    const row = mapProjectDeliverableToDb(deliverable);
    const { data, error } = await supabase
      .from('project_deliverable')
      .insert([row])
      .select()
      .single();

    if (error) throw error;
    return mapProjectDeliverableFromDb(data);
  }

  async findByProjectId(projectId: number): Promise<ProjectDeliverable[]> {
    const { data, error } = await supabase
      .from('project_deliverable')
      .select('*')
      .eq('project_id', projectId);

    if (error) throw error;
    return data ? data.map(mapProjectDeliverableFromDb) : [];
  }
}
