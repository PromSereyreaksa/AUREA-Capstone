import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { Invoice } from '../../domain/entities/Invoice';
import { supabase } from '../db/supabaseClient';
import { mapInvoiceFromDb, mapInvoiceToDb } from '../mappers/invoiceMapper';
import { DatabaseError } from '../../shared/errors';

export class InvoiceRepository implements IInvoiceRepository {
  async create(invoice: Invoice): Promise<Invoice> {
    const row = mapInvoiceToDb(invoice);
    const { data, error } = await supabase
      .from('invoice')
      .insert([row])
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation (duplicate project_id)
      if (error.code === '23505') {
        throw new DatabaseError(`An invoice already exists for this project`);
      }
      throw new DatabaseError(`Failed to create invoice: ${error.message}`);
    }
    return mapInvoiceFromDb(data);
  }

  async findById(invoiceId: number): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoice')
      .select('*')
      .eq('invoice_id', invoiceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new DatabaseError(`Failed to find invoice: ${error.message}`);
    }
    if (!data) return null;
    return mapInvoiceFromDb(data);
  }

  async findByProjectId(projectId: number): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoice')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to find invoice by project: ${error.message}`);
    }
    if (!data) return null;
    return mapInvoiceFromDb(data);
  }

  /**
   * Find all invoices for a user by joining invoice → project_price on project_id
   * and filtering by project_price.user_id.
   */
  async findByUserId(userId: number): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoice')
      .select(`
        *,
        project_price!inner(user_id)
      `)
      .eq('project_price.user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new DatabaseError(`Failed to find invoices for user: ${error.message}`);
    }
    return data ? data.map(mapInvoiceFromDb) : [];
  }

  async update(invoiceId: number, invoice: Partial<Invoice>): Promise<Invoice> {
    const updateData: Record<string, any> = {};
    if (invoice.client_name !== undefined) updateData.client_name = invoice.client_name;
    if (invoice.client_email !== undefined) updateData.client_email = invoice.client_email;
    if (invoice.client_location !== undefined) updateData.client_location = invoice.client_location;
    if (invoice.invoice_date !== undefined) updateData.invoice_date = invoice.invoice_date?.toISOString();

    const { data, error } = await supabase
      .from('invoice')
      .update(updateData)
      .eq('invoice_id', invoiceId)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to update invoice: ${error.message}`);
    }
    if (!data) {
      throw new DatabaseError('Invoice not found');
    }
    return mapInvoiceFromDb(data);
  }

  async delete(invoiceId: number): Promise<void> {
    const { error } = await supabase
      .from('invoice')
      .delete()
      .eq('invoice_id', invoiceId);

    if (error) {
      throw new DatabaseError(`Failed to delete invoice: ${error.message}`);
    }
  }
}
