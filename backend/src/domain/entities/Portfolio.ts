export class Portfolio {
  constructor(
    public portfolio_id: number,
    public user_id: number,
    public portfolio_url?: string,  // Public URL in Supabase Storage user_portfolio bucket
    public is_public?: boolean
  ) {}
}
