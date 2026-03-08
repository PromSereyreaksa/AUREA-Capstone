import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { IProjectPriceRepository } from '../../domain/repositories/IProjectPriceRepository';
import { IProjectDeliverableRepository } from '../../domain/repositories/IProjectDeliverableRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IUserProfileRepository } from '../../domain/repositories/IUserProfileRepository';
import { IPricingProfileRepository } from '../../domain/repositories/IPricingProfileRepository';
import { PricingCalculatorService } from '../../infrastructure/services/PricingCalculatorService';
import { ClientContext } from '../../domain/entities/ClientContext';
import { DifficultyMultiplier } from '../../domain/entities/DifficultyLevel';
import { LicensingMultiplier } from '../../domain/entities/LicensingLevel';
import { NotFoundError, ForbiddenError } from '../../shared/errors';

export interface InvoiceDetailData {
  invoice: {
    invoice_id: number;
    invoice_number: string;
    project_id: number;
    client_name: string;
    client_email: string;
    client_location: string;
    invoice_date: string;
    created_at?: string;
  };
  freelancer: {
    full_name: string;
    email: string;
    location: string;
  };
  project: {
    project_name: string;
    title?: string;
    description?: string;
    duration?: number;
    difficulty?: string;
    licensing?: string;
    usage_rights?: string;
    calculated_rate?: number;
    difficulty_multiplier?: number;
    licensing_multiplier?: number;
    total_project_price?: number;
  };
  deliverables: Array<{
    deliverable_type: string;
    quantity: number;
    items: string[];
  }>;
}

export class GetInvoice {
  constructor(
    private invoiceRepo: IInvoiceRepository,
    private projectPriceRepo: IProjectPriceRepository,
    private deliverableRepo: IProjectDeliverableRepository,
    private userRepo: IUserRepository,
    private userProfileRepo: IUserProfileRepository,
    private pricingProfileRepo: IPricingProfileRepository
  ) {}

  async execute(userId: number, invoiceId: number): Promise<InvoiceDetailData> {
    // Fetch the invoice
    const invoice = await this.invoiceRepo.findById(invoiceId);
    if (!invoice) {
      throw new NotFoundError('Invoice');
    }

    // Fetch the project to verify ownership
    const project = await this.projectPriceRepo.findById(invoice.project_id);
    if (!project) {
      throw new NotFoundError('Project');
    }

    if (project.user_id !== userId) {
      throw new ForbiddenError('You do not have permission to view this invoice');
    }

    // Fetch deliverables for the project
    const deliverables = await this.deliverableRepo.findByProjectId(invoice.project_id);

    // Fetch freelancer (user) info
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Fetch user profile for location
    const profile = await this.userProfileRepo.findByUserId(userId);

    // Calculate project rate if not already set
    let calculatedRate = project.calculated_rate;
    const difficultyMultiplier = DifficultyMultiplier.getMultiplier(project.difficulty);
    const licensingMultiplier = LicensingMultiplier.getMultiplier(project.licensing);

    if (!calculatedRate) {
      // Try to calculate from pricing profile
      const pricingProfile = await this.pricingProfileRepo.findByUserId(userId);
      if (pricingProfile && pricingProfile.base_hourly_rate) {
        // Create client context for multipliers
        const clientType = project.client_type || 'sme';
        const clientRegion = project.client_region || 'cambodia';
        const clientContext = ClientContext.fromStrings(clientType, clientRegion);

        // Calculate with multipliers
        const calculation = PricingCalculatorService.calculateProjectRateWithBreakdown(
          pricingProfile.base_hourly_rate,
          pricingProfile.seniority_level,
          clientContext
        );

        // Duration is stored in hours
        const durationHours = project.duration || 1;
        const projectPrice = calculation.final_hourly_rate * durationHours * difficultyMultiplier;
        calculatedRate = Math.round(projectPrice * 100) / 100;
      }
    }

    const totalProjectPrice = Math.round((calculatedRate || 0) * licensingMultiplier * 100) / 100;

    const freelancerName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'N/A';

    return {
      invoice: {
        invoice_id: invoice.invoice_id,
        invoice_number: invoice.invoice_number,
        project_id: invoice.project_id,
        client_name: invoice.client_name || '',
        client_email: invoice.client_email || '',
        client_location: invoice.client_location || '',
        invoice_date: invoice.invoice_date?.toISOString().slice(0, 10) || '',
        created_at: invoice.created_at?.toISOString(),
      },
      freelancer: {
        full_name: freelancerName,
        email: user.email,
        location: profile?.location || '',
      },
      project: {
        project_name: project.project_name,
        title: project.title,
        description: project.description,
        duration: project.duration,
        difficulty: project.difficulty,
        licensing: project.licensing,
        usage_rights: project.usage_rights,
        calculated_rate: calculatedRate,
        difficulty_multiplier: difficultyMultiplier,
        licensing_multiplier: licensingMultiplier,
        total_project_price: totalProjectPrice,
      },
      deliverables: deliverables.map((d) => ({
        deliverable_type: d.deliverable_type,
        quantity: d.quantity,
        items: d.items,
      })),
    };
  }
}
