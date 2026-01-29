export class Portfolio {
  constructor(
    public portfolio_id: number,
    public user_id: number,
    public portfolio_url?: string,
    public is_public?: boolean
  ) {}
}
