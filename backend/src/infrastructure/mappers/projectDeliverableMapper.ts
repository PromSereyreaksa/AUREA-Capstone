import { ProjectDeliverable } from '../../domain/entities/ProjectDeliverable';

export function mapProjectDeliverableToDb(deliverable: ProjectDeliverable) {
  return {
    project_id: deliverable.project_id,
    deliverable_type: deliverable.deliverable_type,
    quantity: deliverable.quantity
  };
}

export function mapProjectDeliverableFromDb(data: any): ProjectDeliverable {
  return new ProjectDeliverable(
    data.deliverable_id,
    data.project_id,
    data.deliverable_type,
    data.quantity
  );
}
