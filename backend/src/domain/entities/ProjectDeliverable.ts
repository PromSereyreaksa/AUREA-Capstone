export class ProjectDeliverable {
  constructor(
    public deliverable_id: number,
    public project_id: number,
    public deliverable_type: string,
    public quantity: number
  ) {}
}
