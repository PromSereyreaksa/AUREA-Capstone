import { pricingClient } from "../../../shared/api/pricingClient";
import type { InvoiceItem } from "../../../shared/api/pricingClient";

export interface InvoiceClientPayload {
  clientName: string;
  clientEmail: string;
  clientLocation: string;
}

export class InvoiceService {
  async createOrGetProjectInvoice(
    projectId: number,
    payload: InvoiceClientPayload,
  ): Promise<InvoiceItem> {
    try {
      const created = await pricingClient.createInvoice({
        project_id: projectId,
        client_name: payload.clientName.trim(),
        client_email: payload.clientEmail.trim(),
        client_location: payload.clientLocation.trim(),
        invoice_date: new Date().toISOString().slice(0, 10),
      });
      return created.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create invoice";
      if (!message.toLowerCase().includes("already exists")) {
        throw error;
      }
      const invoices = await pricingClient.listInvoices();
      const existing = invoices.data.find((item) => item.project_id === projectId);
      if (!existing) {
        throw new Error("Invoice already exists, but it could not be loaded.");
      }
      return existing;
    }
  }

  async downloadInvoicePdf(invoiceId: number, invoiceNumber?: string): Promise<void> {
    const blob = await pricingClient.downloadInvoicePdf(invoiceId);
    const fileName = `${invoiceNumber || `invoice-${invoiceId}`}.pdf`;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
}

export const invoiceService = new InvoiceService();
