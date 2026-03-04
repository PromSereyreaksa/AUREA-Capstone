import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { IProjectPriceRepository } from '../../domain/repositories/IProjectPriceRepository';
import { IProjectDeliverableRepository } from '../../domain/repositories/IProjectDeliverableRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IUserProfileRepository } from '../../domain/repositories/IUserProfileRepository';
import { IPricingProfileRepository } from '../../domain/repositories/IPricingProfileRepository';
import { GetInvoice } from './GetInvoice';
import { InvoicePdfService } from '../../infrastructure/services/InvoicePdfService';

export class GenerateInvoicePdf {
  private getInvoice: GetInvoice;
  private pdfService: InvoicePdfService;

  constructor(
    invoiceRepo: IInvoiceRepository,
    projectPriceRepo: IProjectPriceRepository,
    deliverableRepo: IProjectDeliverableRepository,
    userRepo: IUserRepository,
    userProfileRepo: IUserProfileRepository,
    pricingProfileRepo: IPricingProfileRepository
  ) {
    this.getInvoice = new GetInvoice(
      invoiceRepo,
      projectPriceRepo,
      deliverableRepo,
      userRepo,
      userProfileRepo,
      pricingProfileRepo
    );
    this.pdfService = new InvoicePdfService();
  }

  async execute(userId: number, invoiceId: number): Promise<{ buffer: Buffer; filename: string }> {
    // Reuse GetInvoice to get all the data
    const invoiceData = await this.getInvoice.execute(userId, invoiceId);

    // Generate the PDF
    const buffer = await this.pdfService.generatePdf(invoiceData);
    const filename = `${invoiceData.invoice.invoice_number}.pdf`;

    return { buffer, filename };
  }
}
