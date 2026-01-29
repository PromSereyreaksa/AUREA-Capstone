import { ProjectPrice } from '../../domain/entities/ProjectPrice';

export function mapProjectPriceToDb(project: ProjectPrice) {
  return {
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
    data.result
  );
}
