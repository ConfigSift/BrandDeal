'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn, formatCurrency } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  Mail, MailOpen, ArrowLeft, Plus, Link2, X, Search,
  Building2, User, DollarSign, Calendar, Package,
  Paperclip, ExternalLink, ChevronDown, Sparkles, Archive,
} from 'lucide-react';
import { usePanelManager } from '@/components/layout/panel-manager';
import { toast } from '@/components/ui/toaster';
import type { Email } from '@/types';

type FilterType = 'all' | 'unprocessed' | 'processed';

interface ExistingDeal {
  id: string;
  title: string;
  brandName: string | null;
}

interface InboxClientProps {
  initialEmails: Email[];
  existingDeals: ExistingDeal[];
}

export function InboxClient({ initialEmails, existingDeals }: InboxClientProps) {
  const [emails, setEmails] = useState<Email[]>(initialEmails);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [linkingDealId, setLinkingDealId] = useState<string | null>(null);
  const [showLinkDropdown, setShowLinkDropdown] = useState(false);
  const [dealSearch, setDealSearch] = useState('');
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { openPanel } = usePanelManager();

  const filteredEmails = useMemo(() => {
    let list = emails;
    if (filter === 'unprocessed') list = list.filter(e => !e.processed);
    if (filter === 'processed') list = list.filter(e => e.processed);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e =>
        (e.subject || '').toLowerCase().includes(q) ||
        (e.from_name || '').toLowerCase().includes(q) ||
        e.from_email.toLowerCase().includes(q) ||
        (e.parsed_brand_name || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [emails, filter, searchQuery]);

  const selectedEmail = useMemo(
    () => emails.find(e => e.id === selectedId) ?? null,
    [emails, selectedId]
  );

  const unprocessedCount = useMemo(
    () => emails.filter(e => !e.processed).length,
    [emails]
  );

  const filteredDeals = useMemo(() => {
    if (!dealSearch.trim()) return existingDeals.slice(0, 10);
    const q = dealSearch.toLowerCase();
    return existingDeals.filter(d =>
      d.title.toLowerCase().includes(q) || (d.brandName || '').toLowerCase().includes(q)
    ).slice(0, 10);
  }, [existingDeals, dealSearch]);

  const handleDismiss = useCallback(async (emailId: string) => {
    setEmails(prev => prev.map(e =>
      e.id === emailId ? { ...e, processed: true } : e
    ));
    if (selectedId === emailId) setSelectedId(null);

    await supabase
      .from('emails')
      .update({ processed: true })
      .eq('id', emailId);

    toast({ title: 'Email dismissed' });
  }, [supabase, selectedId]);

  const handleCreateDeal = useCallback(async (email: Email) => {
    // Create brand if parsed
    let brandId: string | null = null;
    if (email.parsed_brand_name) {
      const { data: existingBrand } = await supabase
        .from('brands')
        .select('id')
        .ilike('name', email.parsed_brand_name)
        .limit(1)
        .single();

      if (existingBrand) {
        brandId = existingBrand.id;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: newBrand } = await supabase
          .from('brands')
          .insert({
            user_id: user.id,
            name: email.parsed_brand_name,
          })
          .select('id')
          .single();
        brandId = newBrand?.id ?? null;
      }
    }

    // Create contact if parsed
    let contactId: string | null = null;
    if (email.parsed_contact_name && brandId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: newContact } = await supabase
        .from('contacts')
        .insert({
          user_id: user.id,
          brand_id: brandId,
          name: email.parsed_contact_name,
          email: email.from_email,
        })
        .select('id')
        .single();
      contactId = newContact?.id ?? null;
    }

    // Get deadline from parsed dates
    let deadline: string | null = null;
    if (email.parsed_dates && Array.isArray(email.parsed_dates)) {
      const deadlineDate = email.parsed_dates.find(
        (d: any) => d.label === 'deadline'
      );
      if (deadlineDate) deadline = deadlineDate.date;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: deal, error } = await supabase
      .from('deals')
      .insert({
        user_id: user.id,
        brand_id: brandId,
        contact_id: contactId,
        title: email.subject || `Deal from ${email.parsed_brand_name || email.from_email}`,
        status: 'lead',
        value: email.parsed_budget || 0,
        currency: 'USD',
        source: 'email' as const,
        delivery_deadline: deadline,
        notes: `Created from email: ${email.subject}\nFrom: ${email.from_name || email.from_email}`,
        sort_order: 0,
        archived: false,
      })
      .select('id')
      .single();

    if (error || !deal) {
      toast({ title: 'Failed to create deal', variant: 'error' });
      return;
    }

    // Mark email as processed and linked
    await supabase
      .from('emails')
      .update({ processed: true, linked_to_deal: true, deal_id: deal.id })
      .eq('id', email.id);

    setEmails(prev => prev.map(e =>
      e.id === email.id ? { ...e, processed: true, linked_to_deal: true, deal_id: deal.id } : e
    ));

    toast({ title: 'Deal created', description: 'Opening deal details...' });
    router.refresh();
    router.push(`/deals/${deal.id}`);
  }, [supabase, router]);

  const handleLinkToDeal = useCallback(async (emailId: string, dealId: string) => {
    await supabase
      .from('emails')
      .update({ processed: true, linked_to_deal: true, deal_id: dealId })
      .eq('id', emailId);

    setEmails(prev => prev.map(e =>
      e.id === emailId ? { ...e, processed: true, linked_to_deal: true, deal_id: dealId } : e
    ));

    setShowLinkDropdown(false);
    setLinkingDealId(null);
    setDealSearch('');
    toast({ title: 'Email linked to deal' });
    router.refresh();
  }, [supabase, router]);

  return (
    <div className="h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-display font-bold text-midnight-800">Inbox</h1>
          {unprocessedCount > 0 && (
            <span className="px-2.5 py-0.5 bg-brand-100 text-brand-700 rounded-full text-xs font-semibold">
              {unprocessedCount} new
            </span>
          )}
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex gap-0 h-[calc(100%-3rem)] bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
        {/* Left panel — email list */}
        <div className={cn(
          "w-full md:w-96 border-r border-gray-100 flex flex-col flex-shrink-0",
          selectedId && "hidden md:flex"
        )}>
          {/* Filters + Search */}
          <div className="p-3 border-b border-gray-100 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search emails..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-100 border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:bg-white outline-none transition-all"
              />
            </div>
            <div className="flex gap-1">
              {([
                { key: 'all', label: 'All' },
                { key: 'unprocessed', label: 'New' },
                { key: 'processed', label: 'Processed' },
              ] as const).map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    filter === f.key
                      ? "bg-brand-50 text-brand-600"
                      : "text-gray-500 hover:bg-gray-50"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Email list */}
          <div className="flex-1 overflow-y-auto">
            {filteredEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-4">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                  <Mail className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">No emails found</p>
              </div>
            ) : (
              filteredEmails.map(email => (
                <button
                  key={email.id}
                  onClick={() => setSelectedId(email.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-gray-50 transition-colors group",
                    selectedId === email.id
                      ? "bg-brand-50/50"
                      : "hover:bg-gray-50",
                    !email.processed && "border-l-2 border-l-brand-500"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      {email.processed ? (
                        <MailOpen className="w-4 h-4 text-gray-300" />
                      ) : (
                        <Mail className="w-4 h-4 text-brand-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn(
                          "text-sm truncate",
                          !email.processed ? "font-semibold text-midnight-800" : "font-medium text-gray-600"
                        )}>
                          {email.from_name || email.from_email}
                        </p>
                        <span className="text-[11px] text-gray-400 flex-shrink-0">
                          {formatTimeAgo(email.received_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 truncate mt-0.5">
                        {email.subject || '(no subject)'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {email.parsed_brand_name && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded text-[10px] font-medium">
                            <Building2 className="w-3 h-3" />
                            {email.parsed_brand_name}
                          </span>
                        )}
                        {email.parsed_budget && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-medium">
                            <DollarSign className="w-3 h-3" />
                            {formatCurrency(email.parsed_budget)}
                          </span>
                        )}
                        {email.linked_to_deal && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-medium">
                            <Link2 className="w-3 h-3" />
                            Linked
                          </span>
                        )}
                        {email.attachments && email.attachments.length > 0 && (
                          <Paperclip className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right panel — email detail */}
        <div className={cn(
          "flex-1 flex flex-col min-w-0",
          !selectedId && "hidden md:flex"
        )}>
          {!selectedEmail ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm text-gray-400">Select an email to view</p>
            </div>
          ) : (
            <>
              {/* Detail header */}
              <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  {/* Back button — mobile */}
                  <button
                    onClick={() => setSelectedId(null)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 md:hidden"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-display font-semibold text-midnight-800 truncate">
                      {selectedEmail.subject || '(no subject)'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      From: <span className="font-medium text-gray-700">{selectedEmail.from_name || selectedEmail.from_email}</span>
                      {selectedEmail.from_name && (
                        <span className="text-gray-400"> &lt;{selectedEmail.from_email}&gt;</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                {!selectedEmail.processed ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleCreateDeal(selectedEmail)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors text-sm font-semibold"
                    >
                      <Plus className="w-4 h-4" />
                      Create Deal
                    </button>

                    <div className="relative">
                      <button
                        onClick={() => {
                          setShowLinkDropdown(!showLinkDropdown);
                          setLinkingDealId(selectedEmail.id);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                      >
                        <Link2 className="w-4 h-4" />
                        Link to Existing
                        <ChevronDown className="w-3 h-3" />
                      </button>

                      {showLinkDropdown && linkingDealId === selectedEmail.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowLinkDropdown(false)} />
                          <div className="absolute left-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
                            <div className="px-3 pb-2">
                              <input
                                type="text"
                                placeholder="Search deals..."
                                value={dealSearch}
                                onChange={e => setDealSearch(e.target.value)}
                                className="w-full px-3 py-2 bg-surface-100 border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:bg-white outline-none"
                                autoFocus
                              />
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                              {filteredDeals.length === 0 ? (
                                <p className="px-4 py-3 text-sm text-gray-400">No deals found</p>
                              ) : (
                                filteredDeals.map(deal => (
                                  <button
                                    key={deal.id}
                                    onClick={() => handleLinkToDeal(selectedEmail.id, deal.id)}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                                  >
                                    <p className="font-medium text-gray-700 truncate">{deal.title}</p>
                                    {deal.brandName && (
                                      <p className="text-xs text-gray-400 truncate">{deal.brandName}</p>
                                    )}
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => handleDismiss(selectedEmail.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Archive className="w-4 h-4" />
                      Dismiss
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                      {selectedEmail.linked_to_deal ? (
                        <>
                          <Link2 className="w-3 h-3" />
                          Linked to deal
                        </>
                      ) : (
                        <>
                          <Archive className="w-3 h-3" />
                          Dismissed
                        </>
                      )}
                    </span>
                    {selectedEmail.deal_id && (
                      <button
                        onClick={() => router.push(`/deals/${selectedEmail.deal_id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-brand-600 hover:bg-brand-50 rounded-lg text-xs font-medium transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Deal
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Parsed data cards */}
              {hasParsedData(selectedEmail) && (
                <div className="px-4 sm:px-6 py-3 border-b border-gray-100 bg-surface-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-brand-500" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Parsed Data</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {selectedEmail.parsed_brand_name && (
                      <div className="px-3 py-2 bg-white rounded-lg border border-gray-100">
                        <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                          <Building2 className="w-3 h-3" />
                          <span className="text-[10px] font-medium uppercase">Brand</span>
                        </div>
                        <p className="text-sm font-medium text-midnight-800 truncate">
                          {selectedEmail.parsed_brand_name}
                        </p>
                      </div>
                    )}
                    {selectedEmail.parsed_contact_name && (
                      <div className="px-3 py-2 bg-white rounded-lg border border-gray-100">
                        <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                          <User className="w-3 h-3" />
                          <span className="text-[10px] font-medium uppercase">Contact</span>
                        </div>
                        <p className="text-sm font-medium text-midnight-800 truncate">
                          {selectedEmail.parsed_contact_name}
                        </p>
                      </div>
                    )}
                    {selectedEmail.parsed_budget && (
                      <div className="px-3 py-2 bg-white rounded-lg border border-gray-100">
                        <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                          <DollarSign className="w-3 h-3" />
                          <span className="text-[10px] font-medium uppercase">Budget</span>
                        </div>
                        <p className="text-sm font-medium text-emerald-600">
                          {formatCurrency(selectedEmail.parsed_budget)}
                        </p>
                      </div>
                    )}
                    {selectedEmail.parsed_deliverables && Array.isArray(selectedEmail.parsed_deliverables) && selectedEmail.parsed_deliverables.length > 0 && (
                      <div className="px-3 py-2 bg-white rounded-lg border border-gray-100">
                        <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                          <Package className="w-3 h-3" />
                          <span className="text-[10px] font-medium uppercase">Deliverables</span>
                        </div>
                        <p className="text-sm font-medium text-midnight-800 truncate">
                          {(selectedEmail.parsed_deliverables as any[]).map((d: any) => d.platform).join(', ')}
                        </p>
                      </div>
                    )}
                    {selectedEmail.parsed_dates && Array.isArray(selectedEmail.parsed_dates) && selectedEmail.parsed_dates.length > 0 && (
                      <div className="px-3 py-2 bg-white rounded-lg border border-gray-100">
                        <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                          <Calendar className="w-3 h-3" />
                          <span className="text-[10px] font-medium uppercase">
                            {(selectedEmail.parsed_dates as any[])[0]?.label || 'Date'}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-midnight-800">
                          {(selectedEmail.parsed_dates as any[])[0]?.date}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                <div className="px-4 sm:px-6 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Paperclip className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Attachments ({selectedEmail.attachments.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmail.attachments.map((att, i) => (
                      <a
                        key={i}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate max-w-[200px]">{att.filename}</span>
                        <span className="text-xs text-gray-400">
                          {formatBytes(att.size)}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Email body */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap break-words">
                  {selectedEmail.body_text || '(empty body)'}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function hasParsedData(email: Email): boolean {
  return !!(
    email.parsed_brand_name ||
    email.parsed_contact_name ||
    email.parsed_budget ||
    (email.parsed_deliverables && Array.isArray(email.parsed_deliverables) && email.parsed_deliverables.length > 0) ||
    (email.parsed_dates && Array.isArray(email.parsed_dates) && email.parsed_dates.length > 0)
  );
}

function formatTimeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: false })
      .replace('about ', '')
      .replace('less than a minute', 'now');
  } catch {
    return '';
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}
