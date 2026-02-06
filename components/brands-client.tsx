'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Brand, Contact } from '@/types';
import { Building2, Plus, Globe, Users, FileText, Trash2 } from 'lucide-react';

interface Props {
  brands: (Brand & { contacts: Contact[] })[];
  dealCounts: Record<string, number>;
}

export function BrandsClient({ brands: initialBrands, dealCounts }: Props) {
  const [brands, setBrands] = useState(initialBrands);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', website: '', industry: '', notes: '' });
  const supabase = createClient();

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('brands').insert({
      user_id: user.id, name: form.name, website: form.website || null, industry: form.industry || null, notes: form.notes || null,
    }).select('*, contacts(*)').single();
    if (data) {
      setBrands(prev => [...prev, data]);
      setForm({ name: '', website: '', industry: '', notes: '' });
      setShowAdd(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this brand? Deals linked to it will be unlinked.')) return;
    const { error } = await supabase.from('brands').delete().eq('id', id);
    if (!error) setBrands(prev => prev.filter(b => b.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-midnight-800">Brands</h1>
          <p className="text-sm text-gray-500 mt-1">{brands.length} brands</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add Brand
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl border border-brand-200 p-5 mb-4 shadow-card space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Brand name *" autoFocus value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" />
            <input type="text" placeholder="Website" value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" />
          </div>
          <input type="text" placeholder="Industry (e.g. Fashion, Tech, Fitness)" value={form.industry} onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600">Save Brand</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {brands.map(brand => (
          <div key={brand.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-card hover:shadow-card-hover transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-brand-50 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-brand-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-midnight-800">{brand.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    {brand.website && (
                      <a href={brand.website.startsWith('http') ? brand.website : `https://${brand.website}`} target="_blank" rel="noopener"
                        className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600">
                        <Globe className="w-3 h-3" /> {brand.website}
                      </a>
                    )}
                    {brand.industry && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{brand.industry}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs text-gray-500"><Users className="w-3 h-3" /> {brand.contacts?.length || 0} contacts</div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1"><FileText className="w-3 h-3" /> {dealCounts[brand.id] || 0} deals</div>
                </div>
                <button onClick={() => handleDelete(brand.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {brands.length === 0 && !showAdd && (
          <div className="text-center py-16">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-600 mb-2">No brands yet</h3>
            <p className="text-sm text-gray-400 mb-4">Add brands you work with to organize your deals.</p>
            <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600">
              <Plus className="w-4 h-4 inline mr-1" /> Add Your First Brand
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
