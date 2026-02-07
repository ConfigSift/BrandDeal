import { z } from 'zod';

export const dealSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be under 200 characters'),
  brand_id: z.string().optional(),
  contact_id: z.string().optional(),
  status: z.string().default('lead'),
  value: z.string().refine(
    (v) => v === '' || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0),
    'Value must be a positive number'
  ).optional(),
  source: z.string().default('manual'),
  signed_date: z.string().optional(),
  delivery_deadline: z.string().optional(),
  next_action: z.string().max(500).optional(),
  next_action_date: z.string().optional(),
  notes: z.string().max(5000).optional(),
});

export const invoiceSchema = z.object({
  deal_id: z.string().min(1, 'A deal must be selected'),
  due_date: z.string().optional(),
  custom_notes: z.string().max(2000).optional(),
  line_items: z.array(z.object({
    description: z.string(),
    amount: z.string(),
  })).refine(
    (items) => items.some((i) => i.description.trim().length > 0),
    'At least one line item with a description is required'
  ).refine(
    (items) => {
      const total = items.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
      return total > 0;
    },
    'Total amount must be greater than $0'
  ),
});

export const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Enter a valid email').or(z.literal('')).optional(),
  phone: z.string().max(30).optional(),
  title: z.string().max(100).optional(),
  brand_id: z.string().min(1, 'A brand must be selected'),
  is_primary: z.boolean().default(false),
});

export type DealFormData = z.infer<typeof dealSchema>;
export type InvoiceFormData = z.infer<typeof invoiceSchema>;
export type ContactFormData = z.infer<typeof contactSchema>;
