import { ProjectPrice } from '../../domain/entities/ProjectPrice';

export function mapProjectPriceToDb(project: ProjectPrice) {
  const result: any = {
    user_id: project.user_id,
    project_name: project.project_name,
    title: project.title,
    description: project.description,
    duration: project.duration,
    difficulty: project.difficulty,
    licensing: project.licensing,
    usage_rights: project.usage_rights,
    result: project.result
  };

  // Add new pricing fields if present
  if (project.client_type !== undefined) {
    result.client_type = project.client_type;
  }
  if (project.client_region !== undefined) {
    result.client_region = project.client_region;
  }
  if (project.calculated_rate !== undefined) {
    result.calculated_rate = project.calculated_rate;
  }

  return result;
}

export function mapProjectPriceFromDb(data: any): ProjectPrice {
  return new ProjectPrice(
    data.project_id,
    data.user_id,
    data.project_name,
    data.title,
    data.description,
    data.duration,
    data.difficulty,
    data.licensing,
    data.usage_rights,
    data.result,
    data.client_type,
    data.client_region,
    data.calculated_rate
  );
}
