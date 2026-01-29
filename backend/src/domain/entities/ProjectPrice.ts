export class ProjectPrice {
  constructor(
    public project_id: number,
    public user_id: number,
    public project_name: string,
    public title?: string,
    public description?: string,
    public duration?: number,
    public difficulty?: string,
    public licensing?: string,
    public usage_rights?: string,
    public result?: string
  ) {}
}
