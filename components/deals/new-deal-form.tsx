'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Brand, Contact, DealStatus, DealSource } from '@/types';
import { DEAL_STAGES, cn } from '@/lib/utils';

type NewDealFormProps = {
  variant?: 'page' | 'panel';
  onSuccess?: (dealId: string) => void;
  onCancel?: () => void;
  className?: string;
};

export function NewDealForm({
  variant = 'page',
  onSuccess,
  onCancel,
  className,
}: NewDealFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const isPanel = variant === 'panel';
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showNewBrand, setShowNewBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');

  const [form, setForm] = useState({
    title: '',
    brand_id: '',
    contact_id: '',
    status: 'lead' as DealStatus,
    value: '',
    source: 'manual' as DealSource,
    signed_date: '',
    delivery_deadline: '',
    next_action: '',
    next_action_date: '',
    notes: '',
  });

  useEffect(() => {
    async function loadData() {
      const { data: b } = await supabase.from('brands').select('*').order('name');
      if (b) setBrands(b);
    }
    loadData();
  }, [supabase]);

  useEffect(() => {
    async function loadContacts() {
      if (!form.brand_id) {
        setContacts([]);
        return;
      }
      const { data: c } = await supabase
        .from('contacts')
        .select('*')
        .eq('brand_id', form.brand_id)
        .order('name');
      if (c) setContacts(c);
    }
    loadContacts();
  }, [form.brand_id, supabase]);

  const handleCreateBrand = async () => {
    if (!newBrandName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('brands')
      .insert({ user_id: user.id, name: newBrandName.trim() })
      .select()
      .single();
    if (data) {
      setBrands((prev) => [...prev, data]);
      setForm((prev) => ({ ...prev, brand_id: data.id }));
      setShowNewBrand(false);
      setNewBrandName('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('deals')
      .insert({
        user_id: user.id,
        title: form.title,
        brand_id: form.brand_id || null,
        contact_id: form.contact_id || null,
        status: form.status,
        value: parseFloat(form.value) || 0,
        source: form.source,
        signed_date: form.signed_date || null,
        delivery_deadline: form.delivery_deadline || null,
        next_action: form.next_action || null,
        next_action_date: form.next_action_date || null,
        notes: form.notes || null,
      })
      .select()
      .single();

    if (data) {
      if (onSuccess) {
        onSuccess(data.id);
      } else {
        router.push(`/deals/${data.id}`);
      }
    } else {
      setLoading(false);
    }
  };

  return (
    <div className={cn(isPanel ? "w-full" : "max-w-2xl mx-auto", className)}>
      {!isPanel && (
        <Link href="/pipeline" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Pipeline
        </Link>
      )}

      {!isPanel && (
        <h1 className="text-2xl font-display font-bold text-midnight-800 mb-6">Create New Deal</h1>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Deal Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Deal Title *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-sm"
            placeholder="e.g. Nike Summer Campaign 2026"
          />
        </div>

        {/* Brand */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Brand</label>
          {!showNewBrand ? (
            <div className="flex gap-2">
              <select
                value={form.brand_id}
                onChange={(e) => setForm((p) => ({ ...p, brand_id: e.target.value, contact_id: '' }))}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-sm bg-white"
              >
                <option value="">Select brand...</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewBrand(true)}
                className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm text-gray-600 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> New
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-sm"
                placeholder="Brand name"
                autoFocus
              />
              <button
                type="button"
                onClick={handleCreateBrand}
                className="px-4 py-3 bg-brand-500 text-white rounded-xl hover:bg-brand-600 text-sm font-medium"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewBrand(false);
                  setNewBrandName('');
                }}
                className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm text-gray-600"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Contact */}
        {form.brand_id && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Person</label>
            <select
              value={form.contact_id}
              onChange={(e) => setForm((p) => ({ ...p, contact_id: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-sm bg-white"
            >
              <option value="">Select contact...</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.title ? `(${c.title})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Two columns */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Deal Value ($)</label>
            <input
              type="number"
              step="0.01"
              value={form.value}
              onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-sm"
              placeholder="5000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Stage</label>
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as DealStatus }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-sm bg-white"
            >
              {DEAL_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Signed Date</label>
            <input
              type="date"
              value={form.signed_date}
              onChange={(e) => setForm((p) => ({ ...p, signed_date: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Deadline</label>
            <input
              type="date"
              value={form.delivery_deadline}
              onChange={(e) => setForm((p) => ({ ...p, delivery_deadline: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-sm"
            />
          </div>
        </div>

        {/* Next Action */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Next Action</label>
            <input
              type="text"
              value={form.next_action}
              onChange={(e) => setForm((p) => ({ ...p, next_action: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-sm"
              placeholder="Follow up on proposal"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Action Date</label>
            <input
              type="date"
              value={form.next_action_date}
              onChange={(e) => setForm((p) => ({ ...p, next_action_date: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-sm"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-sm resize-none"
            placeholder="Any additional notes about this deal..."
          />
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors font-semibold disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Creating...' : 'Create Deal'}
          </button>
          {isPanel ? (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm text-gray-600 font-medium"
            >
              Cancel
            </button>
          ) : (
            <Link
              href="/pipeline"
              className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm text-gray-600 font-medium"
            >
              Cancel
            </Link>
          )}
        </div>
      </form>
    </div>
  );
}
