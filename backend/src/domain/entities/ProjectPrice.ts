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
    public result?: string,
    public client_type?: string,          // NEW: 'startup' | 'sme' | 'corporate' | 'ngo' | 'government'
    public client_region?: string,        // NEW: 'cambodia' | 'southeast_asia' | 'global'
    public calculated_rate?: number,      // NEW: Hourly rate calculated by UREA
    public project_pdf?: string           // PDF file path in Supabase Storage (private bucket)
  ) {}
}
