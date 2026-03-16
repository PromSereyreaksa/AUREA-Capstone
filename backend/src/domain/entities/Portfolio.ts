export class Portfolio {
  constructor(
    public portfolio_id: number,
    public user_id: number,
    public portfolio_url?: string,  // Public URL in Supabase Storage user_portfolio bucket
    public portfolio_cover_url?: string, // Public URL for portfolio cover image
    public is_public?: boolean
  ) {}
}
