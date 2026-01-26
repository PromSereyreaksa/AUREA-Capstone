export class Invoice {
  constructor(
    public invoice_id: number,
    public invoice_number: string,
    public project_id: number,
    public client_name?: string,
    public client_email?: string,
    public client_location?: string,
    public invoice_date?: Date
  ) {}
}
