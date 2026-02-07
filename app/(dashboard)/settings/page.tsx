'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, NotificationPreferences } from '@/types';
import { Save, Check, Copy, Mail, RefreshCw, Bell, CreditCard, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PricingModal } from '@/components/billing/pricing-modal';
import { toast } from '@/components/ui/toaster';

export default function SettingsPage() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatingAddress, setGeneratingAddress] = useState(false);
  const [form, setForm] = useState({
    name: '', creator_niche: '', website_url: '', instagram_handle: '', youtube_handle: '',
    tiktok_handle: '', twitter_handle: '', timezone: 'America/New_York', reminder_email_frequency: 'daily',
  });
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({
    deliverables: true,
    invoices: true,
    stale_leads: true,
    inbox: true,
  });
  const [showPricing, setShowPricing] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      const { data } = await supabase.from('users').select('*').eq('id', authUser.id).single();
      if (data) {
        setUser(data);
        setForm({
          name: data.name || '', creator_niche: data.creator_niche || '', website_url: data.website_url || '',
          instagram_handle: data.instagram_handle || '', youtube_handle: data.youtube_handle || '',
          tiktok_handle: data.tiktok_handle || '', twitter_handle: data.twitter_handle || '',
          timezone: data.timezone || 'America/New_York', reminder_email_frequency: data.reminder_email_frequency || 'daily',
        });
        if (data.notification_preferences) {
          setNotifPrefs({
            deliverables: data.notification_preferences.deliverables ?? true,
            invoices: data.notification_preferences.invoices ?? true,
            stale_leads: data.notification_preferences.stale_leads ?? true,
            inbox: data.notification_preferences.inbox ?? true,
          });
        }
      }
    }
    load();
  }, []);

  // Detect successful checkout return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast({ title: 'Welcome to your new plan!', description: 'Your features are now unlocked.' });
      // Clean up URL
      window.history.replaceState({}, '', '/settings');
      // Reload user data to reflect new tier
      const refreshUser = async () => {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;
        const { data } = await supabase.from('users').select('*').eq('id', authUser.id).single();
        if (data) setUser(data);
      };
      refreshUser();
    }
  }, []);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      // ignore
    }
    setPortalLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('users')
      .update({ ...form, notification_preferences: notifPrefs })
      .eq('id', user.id);
    setSaving(false);
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-midnight-800 mb-6">Settings</h1>

      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-card">
          <h2 className="font-semibold text-midnight-800 mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Display Name</label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Creator Niche</label>
              <input type="text" value={form.creator_niche} onChange={e => setForm(p => ({ ...p, creator_niche: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                placeholder="e.g. Tech Reviews, Fitness, Lifestyle" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
              <input type="url" value={form.website_url} onChange={e => setForm(p => ({ ...p, website_url: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                placeholder="https://yourwebsite.com" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-card">
          <h2 className="font-semibold text-midnight-800 mb-4">Social Handles</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'instagram_handle', label: 'Instagram', placeholder: '@yourhandle' },
              { key: 'youtube_handle', label: 'YouTube', placeholder: '@yourchannel' },
              { key: 'tiktok_handle', label: 'TikTok', placeholder: '@yourhandle' },
              { key: 'twitter_handle', label: 'Twitter/X', placeholder: '@yourhandle' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
                <input type="text" value={(form as any)[field.key]} onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                  placeholder={field.placeholder} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-card">
          <h2 className="font-semibold text-midnight-800 mb-4">Preferences</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Timezone</label>
              <select value={form.timezone} onChange={e => setForm(p => ({ ...p, timezone: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none">
                {['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo'].map(tz => (
                  <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Reminder Emails</label>
              <select value={form.reminder_email_frequency} onChange={e => setForm(p => ({ ...p, reminder_email_frequency: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none">
                <option value="daily">Daily Digest</option>
                <option value="weekly">Weekly Digest</option>
                <option value="off">Off</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-5 h-5 text-brand-500" />
            <h2 className="font-semibold text-midnight-800">Notification Types</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Choose which types of reminders to include in your email digest.
          </p>
          <div className="space-y-3">
            {([
              { key: 'deliverables' as const, label: 'Deliverable deadlines', description: 'Get notified when content is due soon or overdue' },
              { key: 'invoices' as const, label: 'Invoice & payment reminders', description: 'Track pending and overdue payments' },
              { key: 'stale_leads' as const, label: 'Stale lead follow-ups', description: 'Deals stuck in Lead or Negotiating for too long' },
              { key: 'inbox' as const, label: 'New inbox emails', description: 'Unprocessed brand emails waiting for review' },
            ]).map(item => (
              <label key={item.key} className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={notifPrefs[item.key]}
                  onChange={e => setNotifPrefs(p => ({ ...p, [item.key]: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20"
                />
                <div>
                  <p className="text-sm font-medium text-gray-700 group-hover:text-midnight-800 transition-colors">
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-400">{item.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Email Forwarding */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-5 h-5 text-brand-500" />
            <h2 className="font-semibold text-midnight-800">Email Forwarding</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Forward brand emails to this address and they&apos;ll appear in your Inbox for quick deal creation.
          </p>

          {user?.forwarding_address ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-3 bg-surface-100 border border-gray-200 rounded-xl text-sm font-mono text-gray-700 select-all">
                {user.forwarding_address}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(user.forwarding_address!);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex-shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
              </button>
            </div>
          ) : (
            <button
              disabled={generatingAddress}
              onClick={async () => {
                if (!user) return;
                setGeneratingAddress(true);
                const slug = user.email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
                const address = `${slug}+${Math.random().toString(36).slice(2, 8)}@inbound.branddealos.com`;
                await supabase.from('users').update({ forwarding_address: address }).eq('id', user.id);
                setUser({ ...user, forwarding_address: address });
                setGeneratingAddress(false);
              }}
              className="inline-flex items-center gap-2 px-4 py-3 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors text-sm font-semibold disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${generatingAddress ? 'animate-spin' : ''}`} />
              Generate Forwarding Address
            </button>
          )}
        </div>

        {/* Subscription info */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-5 h-5 text-brand-500" />
            <h2 className="font-semibold text-midnight-800">Subscription</h2>
          </div>

          <div className="flex items-center gap-2 mt-3 mb-4">
            <span className={cn(
              'px-2.5 py-1 rounded-full text-xs font-semibold uppercase',
              user?.subscription_tier === 'elite' ? 'bg-amber-100 text-amber-700' :
              user?.subscription_tier === 'pro' ? 'bg-brand-100 text-brand-700' :
              'bg-gray-100 text-gray-600'
            )}>
              {user?.subscription_tier || 'free'} plan
            </span>
            {(user?.subscription_tier === 'pro' || user?.subscription_tier === 'elite') && (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <Check className="w-3 h-3" /> Active
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {user?.subscription_tier === 'free' ? (
              <button
                onClick={() => setShowPricing(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors"
              >
                Upgrade Plan
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowPricing(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Change Plan
                </button>
                <button
                  onClick={openPortal}
                  disabled={portalLoading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <ExternalLink className="w-4 h-4" />
                  {portalLoading ? 'Opening...' : 'Manage Billing'}
                </button>
              </>
            )}
          </div>
        </div>

        {showPricing && (
          <PricingModal
            currentTier={user?.subscription_tier || 'free'}
            onClose={() => setShowPricing(false)}
          />
        )}

        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-xl hover:bg-brand-600 font-semibold disabled:opacity-50">
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
