import { PricingProfile } from '../entities/PricingProfile';

export interface IPricingProfileRepository {
  create(profile: PricingProfile): Promise<PricingProfile>;
  findByUserId(userId: number): Promise<PricingProfile | null>;
  update(profileId: number, profile: Partial<PricingProfile>): Promise<PricingProfile>;
  delete(profileId: number): Promise<void>;
}
