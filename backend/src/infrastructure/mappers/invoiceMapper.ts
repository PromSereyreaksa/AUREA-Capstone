import { Invoice } from '../../domain/entities/Invoice';

export function mapInvoiceToDb(invoice: Invoice) {
  return {
    invoice_number: invoice.invoice_number,
    project_id: invoice.project_id,
    client_name: invoice.client_name,
    client_email: invoice.client_email,
    client_location: invoice.client_location,
    invoice_date: invoice.invoice_date?.toISOString()
  };
}

export function mapInvoiceFromDb(data: any): Invoice {
  return new Invoice(
    data.invoice_id,
    data.invoice_number,
    data.project_id,
    data.client_name,
    data.client_email,
    data.client_location,
    data.invoice_date ? new Date(data.invoice_date) : undefined
  );
}
