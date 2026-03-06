import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';

export class GetUserInvoices {
  constructor(private invoiceRepo: IInvoiceRepository) {}

  async execute(userId: number) {
    return this.invoiceRepo.findByUserId(userId);
  }
}
