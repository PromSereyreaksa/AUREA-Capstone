import { IProjectPriceRepository } from '../../domain/repositories/IProjectPriceRepository';
import { IProjectDeliverableRepository } from '../../domain/repositories/IProjectDeliverableRepository';
import { IPricingProfileRepository } from '../../domain/repositories/IPricingProfileRepository';
import { ClientContext } from '../../domain/entities/ClientContext';
import { PricingCalculatorService } from '../../infrastructure/services/PricingCalculatorService';
import { DifficultyMultiplier } from '../../domain/entities/DifficultyLevel';
import { LicensingMultiplier } from '../../domain/entities/LicensingLevel';
import { ForbiddenError, NotFoundError } from '../../shared/errors';

interface GetProjectPricingBreakdownInput {
  user_id: number;
  project_id: number;
}

export interface GetProjectPricingBreakdownOutput {
  project_id: number;
  base_rate: number;
  seniority_level: string;
  seniority_multiplier: number;
  client_type: string;
  client_region: string;
  context_multiplier: number;
  final_hourly_rate: number;
  duration_hours: number;
  difficulty: string;
  difficulty_multiplier: number;
  licensing: string;
  licensing_multiplier: number;
  usage_rights?: string;
  project_price: number;
  total_project_price: number;
  deliverables: Array<{
    deliverable_type: string;
    quantity: number;
    items: string[];
  }>;
}

const round2 = (value: number): number => Math.round(value * 100) / 100;

export class GetProjectPricingBreakdown {
  constructor(
    private projectPriceRepo: IProjectPriceRepository,
    private projectDeliverableRepo: IProjectDeliverableRepository,
    private pricingProfileRepo: IPricingProfileRepository
  ) {}

  async execute(input: GetProjectPricingBreakdownInput): Promise<GetProjectPricingBreakdownOutput> {
    const project = await this.projectPriceRepo.findById(input.project_id);
    if (!project) {
      throw new NotFoundError('Project');
    }

    if (project.user_id !== input.user_id) {
      throw new ForbiddenError('You do not have permission to access this project pricing breakdown');
    }

    const pricingProfile = await this.pricingProfileRepo.findByUserId(input.user_id);
    if (!pricingProfile || !pricingProfile.base_hourly_rate) {
      throw new NotFoundError('Pricing profile');
    }

    const clientType = project.client_type || 'sme';
    const clientRegion = project.client_region || 'cambodia';
    const clientContext = ClientContext.fromStrings(clientType, clientRegion);

    const rateBreakdown = PricingCalculatorService.calculateProjectRateWithBreakdown(
      pricingProfile.base_hourly_rate,
      pricingProfile.seniority_level,
      clientContext
    );

    const durationHours = project.duration || 1;
    const difficultyMultiplier = DifficultyMultiplier.getMultiplier(project.difficulty);
    const licensingMultiplier = LicensingMultiplier.getMultiplier(project.licensing);

    const projectPrice = round2(rateBreakdown.final_hourly_rate * durationHours * difficultyMultiplier);
    const totalProjectPrice = round2(projectPrice * licensingMultiplier);

    await this.projectPriceRepo.update(project.project_id, {
      calculated_rate: projectPrice,
      client_type: clientType,
      client_region: clientRegion
    });

    const deliverables = await this.projectDeliverableRepo.findByProjectId(project.project_id);

    return {
      project_id: project.project_id,
      base_rate: rateBreakdown.base_rate,
      seniority_level: rateBreakdown.seniority_level,
      seniority_multiplier: rateBreakdown.seniority_multiplier,
      client_type: clientType,
      client_region: clientRegion,
      context_multiplier: rateBreakdown.context_multiplier,
      final_hourly_rate: rateBreakdown.final_hourly_rate,
      duration_hours: durationHours,
      difficulty: project.difficulty || 'easy',
      difficulty_multiplier: difficultyMultiplier,
      licensing: project.licensing || 'one_time',
      licensing_multiplier: licensingMultiplier,
      usage_rights: project.usage_rights,
      project_price: projectPrice,
      total_project_price: totalProjectPrice,
      deliverables: deliverables.map((deliverable) => ({
        deliverable_type: deliverable.deliverable_type,
        quantity: deliverable.quantity,
        items: deliverable.items
      }))
    };
  }
}
