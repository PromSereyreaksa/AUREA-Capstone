import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { IProjectPriceRepository } from '../../domain/repositories/IProjectPriceRepository';
import { NotFoundError, ForbiddenError } from '../../shared/errors';

export class DeleteInvoice {
  constructor(
    private invoiceRepo: IInvoiceRepository,
    private projectPriceRepo: IProjectPriceRepository
  ) {}

  async execute(userId: number, invoiceId: number): Promise<void> {
    // Fetch the invoice
    const invoice = await this.invoiceRepo.findById(invoiceId);
    if (!invoice) {
      throw new NotFoundError('Invoice');
    }

    // Verify ownership through the project
    const project = await this.projectPriceRepo.findById(invoice.project_id);
    if (!project) {
      throw new NotFoundError('Project');
    }

    if (project.user_id !== userId) {
      throw new ForbiddenError('You do not have permission to delete this invoice');
    }

    await this.invoiceRepo.delete(invoiceId);
  }
}
