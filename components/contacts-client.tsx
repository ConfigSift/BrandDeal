'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Contact, Brand } from '@/types';
import { Users, Plus, Mail, Phone, Building2, Trash2, Star, StarOff } from 'lucide-react';

interface Props {
  contacts: (Contact & { brand: Brand })[];
  brands: Brand[];
}

export function ContactsClient({ contacts: initial, brands }: Props) {
  const [contacts, setContacts] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', title: '', brand_id: '', is_primary: false });
  const supabase = createClient();

  const handleAdd = async () => {
    if (!form.name.trim() || !form.brand_id) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('contacts').insert({
      user_id: user.id, brand_id: form.brand_id, name: form.name, email: form.email || null,
      phone: form.phone || null, title: form.title || null, is_primary: form.is_primary,
    }).select('*, brand:brands(*)').single();
    if (data) {
      setContacts(prev => [...prev, data]);
      setForm({ name: '', email: '', phone: '', title: '', brand_id: '', is_primary: false });
      setShowAdd(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this contact?')) return;
    const { error } = await supabase.from('contacts').delete().eq('id', id);
    if (!error) setContacts(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-midnight-800">Contacts</h1>
          <p className="text-sm text-gray-500 mt-1">{contacts.length} contacts</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add Contact
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl border border-brand-200 p-5 mb-4 shadow-card space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Name *" autoFocus value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" />
            <select value={form.brand_id} onChange={e => setForm(p => ({ ...p, brand_id: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none">
              <option value="">Select brand *</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input type="email" placeholder="Email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" />
            <input type="text" placeholder="Phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" />
            <input type="text" placeholder="Title (e.g. Marketing Manager)" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600">Save Contact</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {contacts.map(contact => (
          <div key={contact.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-card flex items-center gap-4">
            <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-brand-600">{contact.name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-midnight-800">{contact.name}</h3>
                {contact.is_primary && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                {contact.title && <span className="text-xs text-gray-500">{contact.title}</span>}
                {contact.brand && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> {contact.brand.name}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {contact.email}
                </a>
              )}
              {contact.phone && (
                <span className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {contact.phone}</span>
              )}
              <button onClick={() => handleDelete(contact.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        {contacts.length === 0 && !showAdd && (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-600 mb-2">No contacts yet</h3>
            <p className="text-sm text-gray-400 mb-4">Add contact people at brands you work with.</p>
          </div>
        )}
      </div>
    </div>
  );
}
