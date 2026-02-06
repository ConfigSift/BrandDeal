'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@/types';
import { Save, Check } from 'lucide-react';

export default function SettingsPage() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: '', creator_niche: '', website_url: '', instagram_handle: '', youtube_handle: '',
    tiktok_handle: '', twitter_handle: '', timezone: 'America/New_York', reminder_email_frequency: 'daily',
  });

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
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('users').update(form).eq('id', user.id);
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

        {/* Subscription info */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-card">
          <h2 className="font-semibold text-midnight-800 mb-2">Subscription</h2>
          <p className="text-sm text-gray-500 mb-4">
            You&apos;re on the <span className="font-semibold text-brand-500 uppercase">{user?.subscription_tier || 'free'}</span> plan.
          </p>
          {user?.subscription_tier === 'free' && (
            <button className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600">
              Upgrade to Pro — $19/mo
            </button>
          )}
        </div>

        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-xl hover:bg-brand-600 font-semibold disabled:opacity-50">
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
