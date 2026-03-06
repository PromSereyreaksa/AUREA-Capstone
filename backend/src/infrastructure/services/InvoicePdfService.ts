import PDFDocument from 'pdfkit';
import { InvoiceDetailData } from '../../application/use_cases/GetInvoice';

// Licensing multiplier mapping (normalized keys: lowercase, non-alphanumeric replaced with _)
const LICENSING_MULTIPLIERS: Record<string, number> = {
  'one_time': 1.0,
  'one_time_use': 1.0,
  'multi_use': 1.2,
  'exclusive': 1.5,
  'buyout': 2.0,
  'royalty': 1.3,
};

export class InvoicePdfService {
  /**
   * Generate a PDF invoice buffer matching the Figma design.
   *
   * Layout:
   * - Orange header bar
   * - INVOICE title + Invoice Number + Invoice Date
   * - Invoice From / Invoice To blocks
   * - Summary of Project Price table
   * - Project Price, Usage Rights, Licensing multiplier
   * - Total Project Price
   */
  async generatePdf(data: InvoiceDetailData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 40, bottom: 40, left: 60, right: 60 },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const pageWidth = doc.page.width;

        // ──────── ORANGE HEADER BAR ────────
        doc.save();
        doc.rect(0, 0, pageWidth, 8).fill('#FF8C00');
        doc.restore();

        // ──────── INVOICE TITLE ────────
        let y = 40;
        doc.font('Helvetica-Bold').fontSize(28).fillColor('#000000');
        doc.text('INVOICE', 60, y);

        // Invoice Number & Date
        y += 38;
        doc.font('Helvetica').fontSize(10).fillColor('#333333');
        doc.text(`Invoice Number`, 60, y);
        doc.text(`#${data.invoice.invoice_number}`, 170, y);
        y += 16;
        doc.text(`Invoice Date`, 60, y);

        // Format date nicely
        const invoiceDate = data.invoice.invoice_date
          ? this.formatDate(data.invoice.invoice_date)
          : this.formatDate(new Date().toISOString().slice(0, 10));
        doc.text(invoiceDate, 170, y);

        // ──────── AUREA LOGO (text placeholder) ────────
        doc.font('Helvetica-Bold').fontSize(22).fillColor('#000000');
        doc.text('AUREA', pageWidth - 60 - 80, 40, { width: 80, align: 'right' });
        doc.font('Helvetica').fontSize(8).fillColor('#666666');
        doc.text('tools', pageWidth - 60 - 80, 64, { width: 80, align: 'right' });

        // ──────── INVOICE FROM / TO ────────
        y += 40;

        // Invoice From (left)
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#000000');
        doc.text('Invoice From', 60, y);
        y += 18;
        doc.font('Helvetica').fontSize(10).fillColor('#333333');
        doc.text(data.freelancer.full_name, 60, y);
        y += 14;
        if (data.freelancer.location) {
          doc.text(data.freelancer.location, 60, y);
          y += 14;
        }
        doc.text(data.freelancer.email, 60, y);

        // Invoice To (right aligned)
        const rightX = pageWidth - 60;
        let rightY = y - (data.freelancer.location ? 46 : 32);
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#000000');
        doc.text('Invoice To', rightX - 200, rightY, { width: 200, align: 'right' });
        rightY += 18;
        doc.font('Helvetica').fontSize(10).fillColor('#333333');
        doc.text(data.invoice.client_name, rightX - 200, rightY, { width: 200, align: 'right' });
        rightY += 14;
        if (data.invoice.client_location) {
          doc.text(data.invoice.client_location, rightX - 200, rightY, { width: 200, align: 'right' });
          rightY += 14;
        }
        doc.text(data.invoice.client_email, rightX - 200, rightY, { width: 200, align: 'right' });

        // ──────── SUMMARY OF PROJECT PRICE ────────
        y += 40;
        doc.font('Helvetica-Bold').fontSize(14).fillColor('#000000');
        doc.text('Summary of Project Price', 60, y);

        y += 28;

        // Table header
        const colDescX = 60;
        const colDelivX = 260;
        const colQtyX = 410;
        const colAmtX = pageWidth - 60 - 80;

        doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333');
        doc.text('Descriptions', colDescX, y);
        doc.text('Deliverable', colDelivX, y);
        doc.text('Quantity', colQtyX, y);
        doc.text('Amount', colAmtX, y, { width: 80, align: 'right' });

        y += 6;
        doc.moveTo(colDescX, y + 12).lineTo(pageWidth - 60, y + 12).lineWidth(0.5).strokeColor('#cccccc').stroke();
        y += 20;

        // Table rows - group deliverables under project name
        const projectName = data.project.project_name || data.project.title || 'Project';

        if (data.deliverables.length > 0) {
          // First deliverable row includes the project name
          doc.font('Helvetica').fontSize(10).fillColor('#333333');
          doc.text(projectName, colDescX, y, { width: 190 });

          for (let i = 0; i < data.deliverables.length; i++) {
            const del = data.deliverables[i];
            doc.font('Helvetica').fontSize(10).fillColor('#333333');
            doc.text(del.deliverable_type, colDelivX, y);
            doc.text(String(del.quantity), colQtyX + 20, y);
            y += 20;
          }
        } else {
          // No deliverables - just show project name
          doc.font('Helvetica').fontSize(10).fillColor('#333333');
          doc.text(projectName, colDescX, y, { width: 190 });
          y += 20;
        }

        // ──────── DIVIDER ────────
        y += 8;
        doc.moveTo(colDescX, y).lineTo(pageWidth - 60, y).lineWidth(0.5).strokeColor('#cccccc').stroke();
        y += 16;

        // ──────── PROJECT PRICE ────────
        const projectPrice = data.project.calculated_rate || 0;

        doc.font('Helvetica-Bold').fontSize(11).fillColor('#000000');
        doc.text('Project Price', colDelivX, y);
        doc.font('Helvetica').fontSize(11).fillColor('#333333');
        doc.text(`$  ${this.formatCurrency(projectPrice)}`, colAmtX - 20, y, { width: 100, align: 'right' });

        y += 22;

        // Usage Rights
        if (data.project.usage_rights) {
          doc.font('Helvetica').fontSize(10).fillColor('#555555');
          doc.text(`Usage Right: ${data.project.usage_rights}`, colDelivX, y);
          y += 18;
        }

        // Licensing multiplier - normalize to lowercase, replace non-alphanumeric with _
        const licensingRaw = (data.project.licensing || '').toLowerCase();
        const licensingKey = licensingRaw
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');
        const licensingMultiplier = LICENSING_MULTIPLIERS[licensingKey] || 1.0;

        if (data.project.licensing) {
          doc.font('Helvetica').fontSize(10).fillColor('#555555');
          doc.text(`Licensing: ${data.project.licensing}`, colDelivX, y);
          doc.text(`x   ${licensingMultiplier.toFixed(1)}`, colAmtX, y, { width: 80, align: 'right' });
          y += 18;
        }

        // ──────── DIVIDER ────────
        y += 4;
        doc.moveTo(colDelivX, y).lineTo(pageWidth - 60, y).lineWidth(0.5).strokeColor('#cccccc').stroke();
        y += 16;

        // ──────── TOTAL PROJECT PRICE ────────
        const totalPrice = projectPrice * licensingMultiplier;

        doc.font('Helvetica-Bold').fontSize(14).fillColor('#000000');
        doc.text('Total Project Price', colDelivX, y);
        doc.text(`$ ${this.formatCurrency(totalPrice)}`, colAmtX - 20, y, { width: 100, align: 'right' });

        // ──────── FOOTER ────────
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Format a date string (YYYY-MM-DD) to DD/MM/YYYY
   */
  private formatDate(dateStr: string): string {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  /**
   * Format a number as currency string (e.g., 10296 → "10,296")
   */
  private formatCurrency(amount: number): string {
    return Math.round(amount).toLocaleString('en-US');
  }
}
