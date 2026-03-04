import { Invoice } from '../entities/Invoice';

export interface IInvoiceRepository {
  create(invoice: Invoice): Promise<Invoice>;
  findById(invoiceId: number): Promise<Invoice | null>;
  findByProjectId(projectId: number): Promise<Invoice | null>;
  findByUserId(userId: number): Promise<Invoice[]>;
  update(invoiceId: number, invoice: Partial<Invoice>): Promise<Invoice>;
  delete(invoiceId: number): Promise<void>;
}
