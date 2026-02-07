'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn, formatCurrency } from '@/lib/utils';
import {
  X, DollarSign, Package, FileText, CheckCircle2, Shield,
  Clock, AlertTriangle, Sparkles, Calendar, Download, Save,
  Plus, ExternalLink,
} from 'lucide-react';
import { toast } from '@/components/ui/toaster';
import type { Contract, Deal } from '@/types';

interface ContractReviewProps {
  contract: Contract;
  deal: Deal;
  onClose: () => void;
  onSaved: () => void;
}

interface FieldConfidence {
  level: 'high' | 'medium' | 'low' | 'none';
}

function getFieldConfidence(value: any): FieldConfidence {
  if (value === null || value === undefined) return { level: 'none' };
  if (typeof value === 'string' && value.trim() === '') return { level: 'none' };
  if (typeof value === 'number') return { level: 'high' };
  if (typeof value === 'boolean') return { level: 'high' };
  if (typeof value === 'string') {
    // Dates in YYYY-MM-DD format → high
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return { level: 'high' };
    // Short structured strings → high
    if (value.length < 50) return { level: 'high' };
    // Longer free-text descriptions → medium
    return { level: 'medium' };
  }
  if (Array.isArray(value) && value.length > 0) return { level: 'high' };
  return { level: 'medium' };
}

const CONFIDENCE_DOT: Record<string, string> = {
  high: 'bg-emerald-400',
  medium: 'bg-amber-400',
  low: 'bg-red-400',
  none: 'bg-gray-300',
};

const CONFIDENCE_LABEL: Record<string, string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
  none: 'Not found',
};

function ConfidenceDot({ level }: { level: string }) {
  return (
    <span
      className={cn('inline-block w-2 h-2 rounded-full flex-shrink-0', CONFIDENCE_DOT[level] || CONFIDENCE_DOT.none)}
      title={CONFIDENCE_LABEL[level] || 'Unknown'}
    />
  );
}

export function ContractReview({ contract, deal, onClose, onSaved }: ContractReviewProps) {
  const data = contract.extracted_data || {};
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [creatingDeliverables, setCreatingDeliverables] = useState(false);

  // Editable state — deep clone of extracted data
  const [editData, setEditData] = useState<any>(() => JSON.parse(JSON.stringify(data)));

  const updateField = useCallback((path: string, value: any) => {
    setEditData((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  }, []);

  const updateDeliverable = useCallback((index: number, field: string, value: any) => {
    setEditData((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next.deliverables?.[index]) return next;
      next.deliverables[index][field] = value;
      return next;
    });
  }, []);

  // Generate signed URL for PDF viewer
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  useState(() => {
    supabase.storage
      .from('deal-files')
      .createSignedUrl(contract.file_url, 3600)
      .then(({ data }) => {
        if (data?.signedUrl) setPdfUrl(data.signedUrl);
      });
  });

  const handleApproveAndSave = async () => {
    setSaving(true);

    // Save extracted_data edits to contract
    await supabase
      .from('contracts')
      .update({ extracted_data: editData, reviewed: true })
      .eq('id', contract.id);

    // Auto-populate deal fields (don't overwrite existing values)
    const dealUpdates: Record<string, any> = {};

    if (editData.payment?.total_amount && (!deal.value || deal.value === 0)) {
      dealUpdates.value = editData.payment.total_amount;
    }

    if (editData.dates?.contract_start && !deal.signed_date) {
      dealUpdates.signed_date = editData.dates.contract_start;
    }

    // Set delivery_deadline to latest deliverable due_date
    if (!deal.delivery_deadline && editData.deliverables?.length > 0) {
      const dueDates = editData.deliverables
        .map((d: any) => d.due_date)
        .filter((d: any) => d && /^\d{4}-\d{2}-\d{2}$/.test(d))
        .sort()
        .reverse();
      if (dueDates.length > 0) {
        dealUpdates.delivery_deadline = dueDates[0];
      }
    }

    if (Object.keys(dealUpdates).length > 0) {
      await supabase.from('deals').update(dealUpdates).eq('id', deal.id);
    }

    setSaving(false);
    toast({ title: 'Contract reviewed & saved', description: 'Deal fields updated from extraction.' });
    router.refresh();
    onSaved();
  };

  const handleAutoCreateDeliverables = async () => {
    if (!editData.deliverables?.length) return;
    setCreatingDeliverables(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setCreatingDeliverables(false);
      return;
    }

    const inserts = editData.deliverables.map((d: any, i: number) => ({
      deal_id: deal.id,
      user_id: user.id,
      title: d.description || `${d.platform} ${d.content_type}`,
      platform: normalizePlatform(d.platform),
      content_type: normalizeContentType(d.content_type),
      due_date: d.due_date || null,
      status: 'not_started',
      sort_order: i,
    }));

    const { error } = await supabase.from('deliverables').insert(inserts);

    setCreatingDeliverables(false);
    if (!error) {
      toast({ title: `${inserts.length} deliverable(s) created` });
      router.refresh();
    } else {
      toast({ title: 'Failed to create deliverables', variant: 'error' });
    }
  };

  const payment = editData.payment || {};
  const usageRights = editData.usage_rights || {};
  const approval = editData.approval || {};
  const exclusivity = editData.exclusivity || {};
  const termination = editData.termination || {};
  const specialTerms = editData.special_terms || {};
  const dates = editData.dates || {};
  const deliverables = editData.deliverables || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-brand-500" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-midnight-800">
                Contract Review
              </h2>
              <p className="text-xs text-gray-400">
                {contract.file_name} — Confidence:{' '}
                <span className={cn(
                  'font-semibold',
                  contract.extraction_confidence === 'high' ? 'text-emerald-600' :
                  contract.extraction_confidence === 'medium' ? 'text-amber-600' : 'text-red-600'
                )}>
                  {contract.extraction_confidence}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body — two columns */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left column — Extracted Data (scrollable) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 border-r border-gray-100">

            {/* Payment */}
            <Section icon={DollarSign} title="Payment" color="text-emerald-600" accent="bg-emerald-50">
              <FieldRow
                label="Total Amount"
                value={payment.total_amount}
                type="number"
                onChange={v => updateField('payment.total_amount', v ? Number(v) : null)}
              />
              <FieldRow
                label="Currency"
                value={payment.currency}
                onChange={v => updateField('payment.currency', v)}
              />
              <FieldRow
                label="Schedule"
                value={payment.schedule}
                onChange={v => updateField('payment.schedule', v)}
              />
              <FieldRow
                label="Method"
                value={payment.method}
                onChange={v => updateField('payment.method', v)}
              />
            </Section>

            {/* Deliverables */}
            <Section icon={Package} title="Deliverables" color="text-blue-600" accent="bg-blue-50">
              {deliverables.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Not found in contract</p>
              ) : (
                <div className="space-y-3">
                  {deliverables.map((del: any, idx: number) => (
                    <div key={idx} className="bg-surface-50 rounded-lg p-3 space-y-2 border border-gray-100">
                      <div className="flex items-center gap-2">
                        <ConfidenceDot level={getFieldConfidence(del.platform).level} />
                        <span className="text-xs font-medium text-gray-500 uppercase">#{idx + 1}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-400 uppercase">Platform</label>
                          <select
                            value={del.platform || 'other'}
                            onChange={e => updateDeliverable(idx, 'platform', e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
                          >
                            {['tiktok', 'youtube', 'instagram', 'twitter', 'blog', 'podcast', 'other'].map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 uppercase">Type</label>
                          <select
                            value={del.content_type || 'other'}
                            onChange={e => updateDeliverable(idx, 'content_type', e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
                          >
                            {['video', 'post', 'story', 'reel', 'short', 'blog_post', 'other'].map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-400 uppercase">Quantity</label>
                          <input
                            type="number"
                            min={1}
                            value={del.quantity || 1}
                            onChange={e => updateDeliverable(idx, 'quantity', Number(e.target.value))}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 uppercase">Due Date</label>
                          <input
                            type="date"
                            value={del.due_date || ''}
                            onChange={e => updateDeliverable(idx, 'due_date', e.target.value || null)}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 uppercase">Description</label>
                        <input
                          type="text"
                          value={del.description || ''}
                          onChange={e => updateDeliverable(idx, 'description', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Usage Rights */}
            <Section icon={Shield} title="Usage Rights" color="text-purple-600" accent="bg-purple-50">
              <FieldRow
                label="Duration"
                value={usageRights.duration}
                onChange={v => updateField('usage_rights.duration', v)}
              />
              <FieldRow
                label="Exclusivity"
                value={usageRights.exclusivity}
                type="boolean"
                onChange={v => updateField('usage_rights.exclusivity', v === 'true')}
              />
              <FieldRow
                label="Platforms"
                value={usageRights.platforms?.join(', ')}
                onChange={v => updateField('usage_rights.platforms', v.split(',').map((s: string) => s.trim()).filter(Boolean))}
              />
              <FieldRow
                label="Paid Ads Allowed"
                value={usageRights.paid_ads_allowed}
                type="boolean"
                onChange={v => updateField('usage_rights.paid_ads_allowed', v === 'true')}
              />
              <FieldRow
                label="Whitelisting"
                value={usageRights.whitelisting_allowed}
                type="boolean"
                onChange={v => updateField('usage_rights.whitelisting_allowed', v === 'true')}
              />
            </Section>

            {/* Approval */}
            <Section icon={CheckCircle2} title="Approval" color="text-teal-600" accent="bg-teal-50">
              <FieldRow
                label="Process"
                value={approval.process}
                onChange={v => updateField('approval.process', v)}
              />
              <FieldRow
                label="Timeline"
                value={approval.timeline}
                onChange={v => updateField('approval.timeline', v)}
              />
            </Section>

            {/* Exclusivity */}
            <Section icon={AlertTriangle} title="Exclusivity" color="text-orange-600" accent="bg-orange-50">
              <FieldRow
                label="Restricted Brands"
                value={exclusivity.restricted_brands}
                onChange={v => updateField('exclusivity.restricted_brands', v)}
              />
              <FieldRow
                label="Duration"
                value={exclusivity.duration}
                onChange={v => updateField('exclusivity.duration', v)}
              />
            </Section>

            {/* Termination */}
            <Section icon={AlertTriangle} title="Termination" color="text-red-600" accent="bg-red-50">
              <FieldRow
                label="Notice Period"
                value={termination.notice_period}
                onChange={v => updateField('termination.notice_period', v)}
              />
              <FieldRow
                label="Kill Fee"
                value={termination.kill_fee}
                type="number"
                onChange={v => updateField('termination.kill_fee', v ? Number(v) : null)}
              />
            </Section>

            {/* Special Terms */}
            <Section icon={FileText} title="Special Terms" color="text-gray-600" accent="bg-gray-50">
              <FieldRow
                label="Performance Bonus"
                value={specialTerms.performance_bonus}
                onChange={v => updateField('special_terms.performance_bonus', v)}
              />
              <FieldRow
                label="Affiliate Code"
                value={specialTerms.affiliate_code}
                onChange={v => updateField('special_terms.affiliate_code', v)}
              />
              <FieldRow
                label="Discount Code"
                value={specialTerms.discount_code}
                onChange={v => updateField('special_terms.discount_code', v)}
              />
              <FieldRow
                label="Other Notes"
                value={specialTerms.notes}
                onChange={v => updateField('special_terms.notes', v)}
              />
            </Section>

            {/* Key Dates */}
            <Section icon={Calendar} title="Key Dates" color="text-indigo-600" accent="bg-indigo-50">
              <FieldRow
                label="Contract Start"
                value={dates.contract_start}
                type="date"
                onChange={v => updateField('dates.contract_start', v || null)}
              />
              <FieldRow
                label="Contract End"
                value={dates.contract_end}
                type="date"
                onChange={v => updateField('dates.contract_end', v || null)}
              />
              <FieldRow
                label="Signing Deadline"
                value={dates.signing_deadline}
                type="date"
                onChange={v => updateField('dates.signing_deadline', v || null)}
              />
            </Section>
          </div>

          {/* Right column — PDF viewer */}
          <div className="w-full md:w-[45%] flex flex-col bg-surface-50 flex-shrink-0">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Original Contract</span>
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PDF
                </a>
              )}
            </div>
            <div className="flex-1 min-h-[300px]">
              {pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full border-0"
                  title="Contract PDF"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-gray-400">Loading PDF...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            {deliverables.length > 0 && (
              <button
                onClick={handleAutoCreateDeliverables}
                disabled={creatingDeliverables}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {creatingDeliverables ? 'Creating...' : `Auto-Create ${deliverables.length} Deliverable(s)`}
              </button>
            )}
            <button
              onClick={handleApproveAndSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Approve & Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- Helper components --- */

function Section({
  icon: Icon,
  title,
  color,
  accent,
  children,
}: {
  icon: typeof DollarSign;
  title: string;
  color: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', accent)}>
          <Icon className={cn('w-4 h-4', color)} />
        </div>
        <h3 className="font-semibold text-sm text-midnight-800">{title}</h3>
      </div>
      <div className="space-y-2 pl-9">{children}</div>
    </div>
  );
}

function FieldRow({
  label,
  value,
  type = 'text',
  onChange,
}: {
  label: string;
  value: any;
  type?: 'text' | 'number' | 'date' | 'boolean';
  onChange: (v: string) => void;
}) {
  const confidence = getFieldConfidence(value);
  const displayValue = value === null || value === undefined ? '' : String(value);
  const isNotFound = confidence.level === 'none';

  return (
    <div className="flex items-center gap-2">
      <ConfidenceDot level={confidence.level} />
      <span className="text-xs text-gray-500 w-28 flex-shrink-0">{label}</span>
      {type === 'boolean' ? (
        <select
          value={displayValue}
          onChange={e => onChange(e.target.value)}
          className={cn(
            'flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white',
            isNotFound && 'text-gray-400'
          )}
        >
          <option value="">—</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      ) : (
        <input
          type={type}
          value={displayValue}
          onChange={e => onChange(e.target.value)}
          placeholder={isNotFound ? 'Not found in contract' : ''}
          className={cn(
            'flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm',
            isNotFound && 'text-gray-400 italic'
          )}
        />
      )}
    </div>
  );
}

/* --- Normalizers --- */

function normalizePlatform(platform: string): string {
  const valid = ['tiktok', 'youtube', 'instagram', 'twitter', 'blog', 'newsletter', 'podcast', 'snapchat', 'other'];
  const lower = (platform || '').toLowerCase();
  return valid.includes(lower) ? lower : 'other';
}

function normalizeContentType(type: string): string {
  const valid = ['video', 'post', 'story', 'reel', 'short', 'blog_post', 'newsletter_mention', 'podcast_integration', 'event_appearance', 'custom'];
  const lower = (type || '').toLowerCase();
  if (valid.includes(lower)) return lower;
  if (lower === 'other') return 'custom';
  return 'custom';
}
