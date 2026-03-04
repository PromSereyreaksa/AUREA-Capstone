import { Request, Response } from 'express';
import { InvoiceValidator } from '../../shared/validators/InvoiceValidator';
import { CreateInvoice } from '../../application/use_cases/CreateInvoice';
import { GetInvoice } from '../../application/use_cases/GetInvoice';
import { GetUserInvoices } from '../../application/use_cases/GetUserInvoices';
import { DeleteInvoice } from '../../application/use_cases/DeleteInvoice';
import { GenerateInvoicePdf } from '../../application/use_cases/GenerateInvoicePdf';
import { InvoiceRepository } from '../../infrastructure/repositories/InvoiceRepository';
import { ProjectPriceRepository } from '../../infrastructure/repositories/ProjectPriceRepository';
import { ProjectDeliverableRepository } from '../../infrastructure/repositories/ProjectDeliverableRepository';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { UserProfileRepository } from '../../infrastructure/repositories/UserProfileRepository';
import { PricingProfileRepository } from '../../infrastructure/repositories/PricingProfileRepository';
import { ResponseHelper } from '../../shared/utils/responseHelper';
import { UnauthorizedError } from '../../shared/errors';

// Extend Express Request to include user from auth middleware
interface AuthenticatedRequest extends Request {
  user?: { user_id: number; email: string };
}

export class InvoiceController {
  private invoiceRepo: InvoiceRepository;
  private projectPriceRepo: ProjectPriceRepository;
  private deliverableRepo: ProjectDeliverableRepository;
  private userRepo: UserRepository;
  private userProfileRepo: UserProfileRepository;
  private pricingProfileRepo: PricingProfileRepository;

  constructor() {
    this.invoiceRepo = new InvoiceRepository();
    this.projectPriceRepo = new ProjectPriceRepository();
    this.deliverableRepo = new ProjectDeliverableRepository();
    this.userRepo = new UserRepository();
    this.userProfileRepo = new UserProfileRepository();
    this.pricingProfileRepo = new PricingProfileRepository();
  }

  /**
   * POST / — Create a new invoice for a project
   */
  async createInvoice(req: AuthenticatedRequest, res: Response): Promise<void> {
    const validatedData = InvoiceValidator.validateCreateInvoice(req.body);
    const userId = req.user?.user_id;
    if (!userId) throw new UnauthorizedError('Authentication required');

    const useCase = new CreateInvoice(this.invoiceRepo, this.projectPriceRepo);
    const invoice = await useCase.execute(userId, validatedData);

    ResponseHelper.created(res, invoice, 'Invoice created successfully');
  }

  /**
   * GET / — List all invoices for the authenticated user
   */
  async getUserInvoices(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.user_id;
    if (!userId) throw new UnauthorizedError('Authentication required');

    const useCase = new GetUserInvoices(this.invoiceRepo);
    const invoices = await useCase.execute(userId);

    ResponseHelper.success(res, invoices, 'Invoices retrieved successfully');
  }

  /**
   * GET /:invoiceId — Get a single invoice with full detail (project, deliverables, freelancer info)
   */
  async getInvoice(req: AuthenticatedRequest, res: Response): Promise<void> {
    const invoiceId = InvoiceValidator.validateInvoiceId(req.params.invoiceId);
    const userId = req.user?.user_id;
    if (!userId) throw new UnauthorizedError('Authentication required');

    const useCase = new GetInvoice(
      this.invoiceRepo,
      this.projectPriceRepo,
      this.deliverableRepo,
      this.userRepo,
      this.userProfileRepo,
      this.pricingProfileRepo
    );
    const invoiceData = await useCase.execute(userId, invoiceId);

    ResponseHelper.success(res, invoiceData, 'Invoice retrieved successfully');
  }

  /**
   * DELETE /:invoiceId — Delete an invoice
   */
  async deleteInvoice(req: AuthenticatedRequest, res: Response): Promise<void> {
    const invoiceId = InvoiceValidator.validateInvoiceId(req.params.invoiceId);
    const userId = req.user?.user_id;
    if (!userId) throw new UnauthorizedError('Authentication required');

    const useCase = new DeleteInvoice(this.invoiceRepo, this.projectPriceRepo);
    await useCase.execute(userId, invoiceId);

    ResponseHelper.noContent(res);
  }

  /**
   * GET /:invoiceId/pdf — Download invoice as PDF
   */
  async downloadInvoicePdf(req: AuthenticatedRequest, res: Response): Promise<void> {
    const invoiceId = InvoiceValidator.validateInvoiceId(req.params.invoiceId);
    const userId = req.user?.user_id;
    if (!userId) throw new UnauthorizedError('Authentication required');

    const useCase = new GenerateInvoicePdf(
      this.invoiceRepo,
      this.projectPriceRepo,
      this.deliverableRepo,
      this.userRepo,
      this.userProfileRepo,
      this.pricingProfileRepo
    );
    const { buffer, filename } = await useCase.execute(userId, invoiceId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length.toString(),
    });
    res.send(buffer);
  }
}
