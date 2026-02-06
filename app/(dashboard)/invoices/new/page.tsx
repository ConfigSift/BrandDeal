'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Deal, Brand } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import Link from 'next/link';

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dealId = searchParams.get('deal_id');
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [deals, setDeals] = useState<(Deal & { brand: Brand | null })[]>([]);
  const [form, setForm] = useState({
    deal_id: dealId || '',
    due_date: '',
    custom_notes: '',
    line_items: [{ description: '', amount: '' }],
  });

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('deals').select('*, brand:brands(*)').order('title');
      if (data) setDeals(data);
    }
    load();
  }, []);

  const total = form.line_items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  const addLineItem = () => setForm(p => ({ ...p, line_items: [...p.line_items, { description: '', amount: '' }] }));
  const removeLineItem = (idx: number) => setForm(p => ({ ...p, line_items: p.line_items.filter((_, i) => i !== idx) }));
  const updateLineItem = (idx: number, field: string, value: string) => {
    setForm(p => ({ ...p, line_items: p.line_items.map((item, i) => i === idx ? { ...item, [field]: value } : item) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Generate invoice number
    const { data: invoiceNumber } = await supabase.rpc('generate_invoice_number', { p_user_id: user.id });

    const { data, error } = await supabase.from('invoices').insert({
      user_id: user.id,
      deal_id: form.deal_id,
      invoice_number: invoiceNumber || `${new Date().getFullYear()}-0001`,
      amount: total,
      due_date: form.due_date || null,
      custom_notes: form.custom_notes || null,
      line_items: form.line_items.filter(i => i.description).map(i => ({ description: i.description, amount: parseFloat(i.amount) || 0 })),
    }).select().single();

    if (data) router.push('/invoices');
    else setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/invoices" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Invoices
      </Link>
      <h1 className="text-2xl font-display font-bold text-midnight-800 mb-6">Create Invoice</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Deal *</label>
            <select value={form.deal_id} onChange={e => setForm(p => ({ ...p, deal_id: e.target.value }))} required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none">
              <option value="">Select deal...</option>
              {deals.map(d => <option key={d.id} value={d.id}>{d.title} {d.brand ? `(${d.brand.name})` : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
            <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" />
          </div>
        </div>

        {/* Line items */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Line Items</label>
          <div className="space-y-2">
            {form.line_items.map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <input type="text" placeholder="Description" value={item.description}
                  onChange={e => updateLineItem(idx, 'description', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" />
                <input type="number" step="0.01" placeholder="Amount" value={item.amount}
                  onChange={e => updateLineItem(idx, 'amount', e.target.value)}
                  className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" />
                {form.line_items.length > 1 && (
                  <button type="button" onClick={() => removeLineItem(idx)} className="p-2 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addLineItem}
            className="mt-2 text-sm text-brand-500 hover:text-brand-600 flex items-center gap-1 font-medium">
            <Plus className="w-4 h-4" /> Add line item
          </button>
        </div>

        {/* Total */}
        <div className="bg-surface-100 rounded-xl p-4 flex items-center justify-between">
          <span className="font-semibold text-midnight-800">Total</span>
          <span className="text-2xl font-bold text-midnight-800">{formatCurrency(total)}</span>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
          <textarea rows={3} value={form.custom_notes} onChange={e => setForm(p => ({ ...p, custom_notes: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
            placeholder="Payment instructions, thank you note, etc." />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-xl hover:bg-brand-600 font-semibold disabled:opacity-50">
            <Save className="w-4 h-4" /> {loading ? 'Creating...' : 'Create Invoice'}
          </button>
          <Link href="/invoices" className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm text-gray-600 font-medium">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
