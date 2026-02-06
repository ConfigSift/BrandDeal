'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Deal, Deliverable, Contract, FileRecord, Invoice, DeliverableStatus, DeliverablePlatform, ContentType } from '@/types';
import { formatCurrency, formatDate, formatRelativeDate, getStageConfig, DEAL_STAGES, DELIVERABLE_STATUS_CONFIG, PLATFORM_CONFIG, CONTENT_TYPE_CONFIG, INVOICE_STATUS_CONFIG, cn } from '@/lib/utils';
import {
  ArrowLeft, Building2, User, DollarSign, Calendar, Clock, FileText,
  CheckCircle2, Circle, Upload, Plus, Trash2, ExternalLink, MoreHorizontal,
  Package, Receipt, Paperclip, StickyNote, Edit2, Save, X
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
  const supabase = createClient();
  const router = useRouter();
  const stageConfig = getStageConfig(deal.status);

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
          <div className="text-right">
            <p className="text-2xl font-bold text-midnight-800">{formatCurrency(Number(deal.value))}</p>
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
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
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
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 mb-6">
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
          <h3 className="font-semibold text-midnight-800 mb-3">Notes</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{deal.notes || 'No notes yet.'}</p>
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
