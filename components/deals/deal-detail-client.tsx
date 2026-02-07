'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Deal, Deliverable, Contract, FileRecord, Invoice, DeliverableStatus, DeliverablePlatform, ContentType, Brand, Contact } from '@/types';
import { formatCurrency, formatDate, formatRelativeDate, getStageConfig, DEAL_STAGES, DELIVERABLE_STATUS_CONFIG, PLATFORM_CONFIG, CONTENT_TYPE_CONFIG, INVOICE_STATUS_CONFIG, cn } from '@/lib/utils';
import {
  ArrowLeft, Building2, User, DollarSign, Calendar, Clock, FileText,
  CheckCircle2, Circle, Upload, Plus, Trash2, ExternalLink, MoreHorizontal,
  Package, Receipt, Paperclip, StickyNote, Edit2, Save, X, Archive, AlertTriangle
} from 'lucide-react';

interface Props {
  deal: Deal;
  deliverables: Deliverable[];
  contracts: Contract[];
  files: FileRecord[];
  invoices: Invoice[];
  variant?: 'page' | 'panel';
}

export function DealDetailClient({
  deal: initialDeal,
  deliverables: initialDeliverables,
  contracts,
  files,
  invoices,
  variant = 'page',
}: Props) {
  const isPanel = variant === 'panel';
  const [deal, setDeal] = useState(initialDeal);
  const [deliverables, setDeliverables] = useState(initialDeliverables);
  const [activeTab, setActiveTab] = useState<'overview' | 'deliverables' | 'files' | 'invoices'>('overview');
  const [showAddDeliverable, setShowAddDeliverable] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const stageConfig = getStageConfig(deal.status);

  // --- Edit mode state ---
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: deal.title,
    value: deal.value,
    brand_id: deal.brand_id || '',
    contact_id: deal.contact_id || '',
    signed_date: deal.signed_date || '',
    delivery_deadline: deal.delivery_deadline || '',
    next_action: deal.next_action || '',
    next_action_date: deal.next_action_date || '',
  });
  const [brands, setBrands] = useState<Brand[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [saving, setSaving] = useState(false);

  // --- Notes state ---
  const [notes, setNotes] = useState(deal.notes || '');
  const [notesSaved, setNotesSaved] = useState(false);
  const notesSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- More menu state ---
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // --- Load brands/contacts when entering edit mode ---
  useEffect(() => {
    if (!editing) return;
    async function loadBrands() {
      const { data } = await supabase.from('brands').select('*').order('name');
      if (data) setBrands(data);
    }
    loadBrands();
  }, [editing, supabase]);

  useEffect(() => {
    if (!editing) return;
    async function loadContacts() {
      if (!editForm.brand_id) {
        setContacts([]);
        return;
      }
      const { data } = await supabase.from('contacts').select('*').eq('brand_id', editForm.brand_id).order('name');
      if (data) setContacts(data);
    }
    loadContacts();
  }, [editing, editForm.brand_id, supabase]);

  // --- Notes auto-save ---
  const saveNotes = useCallback(async (value: string) => {
    const { error } = await supabase.from('deals').update({ notes: value }).eq('id', deal.id);
    if (!error) {
      setDeal(prev => ({ ...prev, notes: value }));
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    }
  }, [supabase, deal.id]);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    if (notesSaveTimer.current) clearTimeout(notesSaveTimer.current);
    notesSaveTimer.current = setTimeout(() => saveNotes(value), 800);
  };

  useEffect(() => {
    return () => {
      if (notesSaveTimer.current) clearTimeout(notesSaveTimer.current);
    };
  }, []);

  // --- Edit mode handlers ---
  const enterEditMode = () => {
    setEditForm({
      title: deal.title,
      value: deal.value,
      brand_id: deal.brand_id || '',
      contact_id: deal.contact_id || '',
      signed_date: deal.signed_date || '',
      delivery_deadline: deal.delivery_deadline || '',
      next_action: deal.next_action || '',
      next_action_date: deal.next_action_date || '',
    });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const saveEdit = async () => {
    setSaving(true);
    const updates = {
      title: editForm.title,
      value: editForm.value,
      brand_id: editForm.brand_id || null,
      contact_id: editForm.contact_id || null,
      signed_date: editForm.signed_date || null,
      delivery_deadline: editForm.delivery_deadline || null,
      next_action: editForm.next_action || null,
      next_action_date: editForm.next_action_date || null,
    };
    const { error } = await supabase.from('deals').update(updates).eq('id', deal.id);
    if (!error) {
      const selectedBrand = brands.find(b => b.id === editForm.brand_id) || null;
      const selectedContact = contacts.find(c => c.id === editForm.contact_id) || null;
      setDeal(prev => ({
        ...prev,
        ...updates,
        brand: selectedBrand ?? prev.brand,
        contact: selectedContact ?? prev.contact,
      }));
      setEditing(false);
      router.refresh();
    }
    setSaving(false);
  };

  // --- Archive / Delete ---
  const handleArchive = async () => {
    const { error } = await supabase.from('deals').update({ archived: true }).eq('id', deal.id);
    if (!error) {
      router.push('/pipeline');
      router.refresh();
    }
  };

  const handleDelete = async () => {
    const { error } = await supabase.from('deals').delete().eq('id', deal.id);
    if (!error) {
      router.push('/pipeline');
      router.refresh();
    }
  };

  const handleStageChange = async (newStatus: string) => {
    const { error } = await supabase.from('deals').update({ status: newStatus }).eq('id', deal.id);
    if (!error) {
      setDeal(prev => ({ ...prev, status: newStatus as any }));
      router.refresh();
    }
  };

  const handleDeliverableStatusChange = async (deliverableId: string, newStatus: DeliverableStatus) => {
    const updates: any = { status: newStatus };
    if (newStatus === 'published' || newStatus === 'approved') {
      updates.completed_at = new Date().toISOString();
    }
    const { error } = await supabase.from('deliverables').update(updates).eq('id', deliverableId);
    if (!error) {
      setDeliverables(prev => prev.map(d => d.id === deliverableId ? { ...d, ...updates } : d));
    }
  };

  const handleAddDeliverable = async (data: { title: string; platform: DeliverablePlatform; content_type: ContentType; due_date: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: newDel, error } = await supabase.from('deliverables').insert({
      deal_id: deal.id,
      user_id: user.id,
      title: data.title,
      platform: data.platform,
      content_type: data.content_type,
      due_date: data.due_date || null,
    }).select().single();
    if (newDel) {
      setDeliverables(prev => [...prev, newDel]);
      setShowAddDeliverable(false);
    }
  };

  const handleDeleteDeliverable = async (id: string) => {
    const { error } = await supabase.from('deliverables').delete().eq('id', id);
    if (!error) setDeliverables(prev => prev.filter(d => d.id !== id));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const filePath = `${user.id}/${deal.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('deal-files').upload(filePath, file);
    if (uploadError) return;

    const { data: { publicUrl } } = supabase.storage.from('deal-files').getPublicUrl(filePath);
    await supabase.from('files').insert({
      deal_id: deal.id,
      user_id: user.id,
      file_url: filePath,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
    });
    router.refresh();
  };

  const inputClass = "px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none";

  const tabs = [
    { id: 'overview', label: 'Overview', icon: StickyNote },
    { id: 'deliverables', label: `Deliverables (${deliverables.length})`, icon: Package },
    { id: 'files', label: `Files (${files.length + contracts.length})`, icon: Paperclip },
    { id: 'invoices', label: `Invoices (${invoices.length})`, icon: Receipt },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back nav */}
      {!isPanel && (
        <Link href="/pipeline" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Pipeline
        </Link>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6 shadow-card">
        <div className="flex items-start justify-between mb-4">
          {editing ? (
            /* Edit mode header */
            <div className="flex-1 space-y-3 mr-4">
              <input
                type="text"
                value={editForm.title}
                onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                className={cn(inputClass, "w-full text-lg font-display font-bold")}
                placeholder="Deal title"
                autoFocus
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={editForm.brand_id}
                  onChange={e => setEditForm(p => ({ ...p, brand_id: e.target.value, contact_id: '' }))}
                  className={cn(inputClass, "w-full bg-white")}
                >
                  <option value="">No brand</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <select
                  value={editForm.contact_id}
                  onChange={e => setEditForm(p => ({ ...p, contact_id: e.target.value }))}
                  className={cn(inputClass, "w-full bg-white")}
                >
                  <option value="">No contact</option>
                  {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          ) : (
            /* Display mode header */
            <div>
              <h1 className="text-2xl font-display font-bold text-midnight-800">{deal.title}</h1>
              <div className="flex items-center gap-4 mt-2">
                {deal.brand && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Building2 className="w-4 h-4" /> {deal.brand.name}
                  </div>
                )}
                {deal.contact && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <User className="w-4 h-4" /> {deal.contact.name}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <div className="mr-2">
                  <label className="text-xs text-gray-400 block mb-1">Value</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={editForm.value}
                      onChange={e => setEditForm(p => ({ ...p, value: Number(e.target.value) }))}
                      className={cn(inputClass, "pl-9 w-36 text-right font-bold")}
                    />
                  </div>
                </div>
                <button
                  onClick={saveEdit}
                  disabled={saving || !editForm.title}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-midnight-800 mr-2">{formatCurrency(Number(deal.value))}</p>
                <button
                  onClick={enterEditMode}
                  className="p-2 text-gray-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors"
                  title="Edit deal"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {/* More menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {showMoreMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => { setShowMoreMenu(false); setShowDeleteConfirm(false); }} />
                      <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
                        <button
                          onClick={() => { handleArchive(); setShowMoreMenu(false); }}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors w-full"
                        >
                          <Archive className="w-4 h-4" />
                          Archive Deal
                        </button>
                        {!showDeleteConfirm ? (
                          <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Deal
                          </button>
                        ) : (
                          <div className="px-4 py-2 space-y-2 border-t border-gray-100 mt-1 pt-2">
                            <p className="text-xs text-red-600 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> This cannot be undone
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => { handleDelete(); setShowMoreMenu(false); }}
                                className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stage selector */}
        <div className="flex items-center gap-1 bg-surface-100 rounded-lg p-1">
          {DEAL_STAGES.map((stage) => (
            <button
              key={stage.id}
              onClick={() => handleStageChange(stage.id)}
              className={cn(
                "flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-all",
                deal.status === stage.id
                  ? "bg-white shadow-sm text-midnight-800"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              <div className="flex items-center justify-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                {stage.title}
              </div>
            </button>
          ))}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
          {editing ? (
            <>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Signed Date</label>
                <input
                  type="date"
                  value={editForm.signed_date}
                  onChange={e => setEditForm(p => ({ ...p, signed_date: e.target.value }))}
                  className={cn(inputClass, "w-full text-sm")}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Deadline</label>
                <input
                  type="date"
                  value={editForm.delivery_deadline}
                  onChange={e => setEditForm(p => ({ ...p, delivery_deadline: e.target.value }))}
                  className={cn(inputClass, "w-full text-sm")}
                />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Deliverables</p>
                <p className="text-sm font-medium py-3">{deliverables.filter(d => d.status === 'published' || d.status === 'approved').length}/{deliverables.length} done</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Next Action</label>
                <input
                  type="text"
                  value={editForm.next_action}
                  onChange={e => setEditForm(p => ({ ...p, next_action: e.target.value }))}
                  placeholder="e.g. Follow up"
                  className={cn(inputClass, "w-full text-sm")}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-xs text-gray-400 mb-1">Signed</p>
                <p className="text-sm font-medium">{formatDate(deal.signed_date)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Deadline</p>
                <p className="text-sm font-medium">{deal.delivery_deadline ? formatRelativeDate(deal.delivery_deadline) : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Deliverables</p>
                <p className="text-sm font-medium">{deliverables.filter(d => d.status === 'published' || d.status === 'approved').length}/{deliverables.length} done</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Next Action</p>
                <p className="text-sm font-medium truncate">{deal.next_action || '—'}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 mb-6 overflow-x-auto flex-nowrap">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center",
                activeTab === tab.id ? "bg-brand-50 text-brand-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-midnight-800">Notes</h3>
            {notesSaved && (
              <span className="text-xs text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Saved
              </span>
            )}
          </div>
          <textarea
            value={notes}
            onChange={e => handleNotesChange(e.target.value)}
            placeholder="Add notes about this deal..."
            rows={8}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none resize-y"
          />
        </div>
      )}

      {activeTab === 'deliverables' && (
        <div className="space-y-3">
          {deliverables.map((del) => {
            const statusConfig = DELIVERABLE_STATUS_CONFIG[del.status];
            const platformConfig = PLATFORM_CONFIG[del.platform];
            return (
              <div key={del.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-card flex items-center gap-4">
                <button
                  onClick={() => {
                    const statuses: DeliverableStatus[] = ['not_started', 'in_progress', 'submitted', 'approved', 'published'];
                    const idx = statuses.indexOf(del.status);
                    if (idx < statuses.length - 1) handleDeliverableStatusChange(del.id, statuses[idx + 1]);
                  }}
                  className="flex-shrink-0"
                >
                  {del.status === 'published' || del.status === 'approved' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 hover:text-brand-400 transition-colors" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn("font-medium text-sm", (del.status === 'published' || del.status === 'approved') && "line-through text-gray-400")}>
                    {del.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs">{platformConfig.emoji} {platformConfig.label}</span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-500">{CONTENT_TYPE_CONFIG[del.content_type].label}</span>
                    {del.due_date && (
                      <>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-500">Due {formatRelativeDate(del.due_date)}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className={cn("stage-pill text-xs", statusConfig.color)}>{statusConfig.label}</span>
                <select
                  value={del.status}
                  onChange={(e) => handleDeliverableStatusChange(del.id, e.target.value as DeliverableStatus)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="published">Published</option>
                </select>
                <button onClick={() => handleDeleteDeliverable(del.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}

          {/* Add deliverable */}
          {showAddDeliverable ? (
            <AddDeliverableForm onSubmit={handleAddDeliverable} onCancel={() => setShowAddDeliverable(false)} />
          ) : (
            <button onClick={() => setShowAddDeliverable(true)}
              className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:text-brand-500 hover:border-brand-300 transition-colors flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add Deliverable
            </button>
          )}
        </div>
      )}

      {activeTab === 'files' && (
        <div className="space-y-3">
          {[...contracts.map(c => ({ ...c, _type: 'contract' as const })), ...files.map(f => ({ ...f, _type: 'file' as const }))].map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-card flex items-center gap-4">
              <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-brand-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.file_name || 'Untitled file'}</p>
                <p className="text-xs text-gray-400">{item._type === 'contract' ? 'Contract' : 'File'} · {formatDate(item._type === 'contract' ? item.uploaded_at : item.uploaded_at)}</p>
              </div>
              {item._type === 'contract' && item.extraction_confidence !== 'none' && (
                <span className={cn("text-xs px-2 py-1 rounded-full font-medium",
                  item.extraction_confidence === 'high' ? 'bg-emerald-100 text-emerald-700' :
                  item.extraction_confidence === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                )}>
                  AI Extracted
                </span>
              )}
            </div>
          ))}

          <label className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:text-brand-500 hover:border-brand-300 transition-colors flex items-center justify-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" /> Upload File
            <input type="file" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const statusConfig = INVOICE_STATUS_CONFIG[inv.status];
            return (
              <Link key={inv.id} href={`/invoices/${inv.id}`}
                className="bg-white rounded-xl border border-gray-100 p-4 shadow-card flex items-center gap-4 hover:shadow-card-hover transition-all block">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Receipt className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Invoice #{inv.invoice_number}</p>
                  <p className="text-xs text-gray-400">Due {formatDate(inv.due_date)}</p>
                </div>
                <p className="font-bold text-sm">{formatCurrency(Number(inv.amount))}</p>
                <span className={cn("stage-pill text-xs", statusConfig.color)}>{statusConfig.label}</span>
              </Link>
            );
          })}
          <Link href={`/invoices/new?deal_id=${deal.id}`}
            className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:text-brand-500 hover:border-brand-300 transition-colors flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Create Invoice
          </Link>
        </div>
      )}
    </div>
  );
}

function AddDeliverableForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ title: '', platform: 'tiktok' as DeliverablePlatform, content_type: 'video' as ContentType, due_date: '' });

  return (
    <div className="bg-white rounded-xl border border-brand-200 p-4 shadow-card space-y-3">
      <input type="text" placeholder="Deliverable title (e.g. TikTok Review Video)" autoFocus
        value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" />
      <div className="grid grid-cols-3 gap-3">
        <select value={form.platform} onChange={e => setForm(p => ({ ...p, platform: e.target.value as DeliverablePlatform }))}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
          {Object.entries(PLATFORM_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
        </select>
        <select value={form.content_type} onChange={e => setForm(p => ({ ...p, content_type: e.target.value as ContentType }))}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
          {Object.entries(CONTENT_TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => form.title && onSubmit(form)}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600">Add</button>
        <button onClick={onCancel} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
      </div>
    </div>
  );
}
