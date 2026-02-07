'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, Zap, Building2, FileText, Rocket, SkipForward } from 'lucide-react';

const NICHES = [
  'Tech', 'Lifestyle', 'Fitness', 'Beauty', 'Gaming',
  'Food', 'Travel', 'Fashion', 'Education', 'Other',
];

const PLATFORMS = [
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'blog', label: 'Blog' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'other', label: 'Other' },
];

const STEPS = [
  { icon: Zap, label: 'Profile' },
  { icon: Building2, label: 'Brand' },
  { icon: FileText, label: 'Deal' },
  { icon: Rocket, label: 'Done' },
];

const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all";
const labelClass = "block text-sm font-medium text-midnight-800 mb-1.5";

interface OnboardingWizardProps {
  userId: string;
  userName: string;
}

export function OnboardingWizard({ userId, userName }: OnboardingWizardProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1 — Profile
  const [profile, setProfile] = useState({
    name: userName,
    niche: '',
    platform: '',
  });

  // Step 2 — Brand
  const [brand, setBrand] = useState({
    name: '',
    website: '',
    contact_name: '',
    contact_email: '',
  });
  const [createdBrandId, setCreatedBrandId] = useState<string | null>(null);
  const [createdBrandName, setCreatedBrandName] = useState('');

  // Step 3 — Deal
  const [deal, setDeal] = useState({
    title: '',
    value: '',
    status: 'lead' as const,
    delivery_deadline: '',
  });
  const [createdDealTitle, setCreatedDealTitle] = useState('');

  // --- Step handlers ---

  const handleProfileNext = async () => {
    if (!profile.name.trim()) return;
    setSaving(true);
    await supabase.from('users').update({
      name: profile.name.trim(),
      creator_niche: profile.niche || null,
    }).eq('id', userId);
    setSaving(false);
    setStep(1);
  };

  const handleBrandNext = async () => {
    if (!brand.name.trim()) return;
    setSaving(true);

    const { data: newBrand } = await supabase.from('brands').insert({
      user_id: userId,
      name: brand.name.trim(),
      website: brand.website.trim() || null,
    }).select().single();

    if (newBrand) {
      setCreatedBrandId(newBrand.id);
      setCreatedBrandName(newBrand.name);

      // Create contact if provided
      if (brand.contact_name.trim()) {
        await supabase.from('contacts').insert({
          brand_id: newBrand.id,
          user_id: userId,
          name: brand.contact_name.trim(),
          email: brand.contact_email.trim() || null,
          is_primary: true,
        });
      }
    }

    setSaving(false);
    setStep(2);
  };

  const handleBrandSkip = () => {
    setStep(2);
  };

  const handleDealNext = async () => {
    if (!deal.title.trim()) return;
    setSaving(true);

    const { data: newDeal } = await supabase.from('deals').insert({
      user_id: userId,
      brand_id: createdBrandId,
      title: deal.title.trim(),
      value: Number(deal.value) || 0,
      status: deal.status,
      delivery_deadline: deal.delivery_deadline || null,
      source: 'manual',
    }).select().single();

    if (newDeal) {
      setCreatedDealTitle(newDeal.title);
    }

    setSaving(false);
    setStep(3);
  };

  const handleDealSkip = () => {
    setStep(3);
  };

  const handleFinish = async () => {
    setSaving(true);
    await supabase.from('users').update({
      onboarding_completed: true,
    }).eq('id', userId);
    router.push('/pipeline');
    router.refresh();
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-3 mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all",
              i < step ? "bg-brand-500 text-white" :
              i === step ? "bg-brand-500 text-white ring-4 ring-brand-100" :
              "bg-gray-200 text-gray-400"
            )}>
              <s.icon className="w-4 h-4" />
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                "w-8 h-0.5 transition-colors",
                i < step ? "bg-brand-500" : "bg-gray-200"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step card with slide animation */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        {/* Step 1 — Profile */}
        {step === 0 && (
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-7 h-7 text-brand-500" />
              </div>
              <h1 className="font-display text-2xl font-bold text-midnight-800">
                Welcome to Brand Deal OS
              </h1>
              <p className="font-body text-gray-500 mt-2">
                Let&apos;s get you set up in under 2 minutes.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Display name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                  placeholder="Your name"
                  className={inputClass}
                  autoFocus
                />
              </div>
              <div>
                <label className={labelClass}>Creator niche</label>
                <select
                  value={profile.niche}
                  onChange={e => setProfile(p => ({ ...p, niche: e.target.value }))}
                  className={cn(inputClass, "bg-white")}
                >
                  <option value="">Select a niche</option>
                  {NICHES.map(n => <option key={n} value={n.toLowerCase()}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Primary platform</label>
                <select
                  value={profile.platform}
                  onChange={e => setProfile(p => ({ ...p, platform: e.target.value }))}
                  className={cn(inputClass, "bg-white")}
                >
                  <option value="">Select a platform</option>
                  {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>

            <button
              onClick={handleProfileNext}
              disabled={saving || !profile.name.trim()}
              className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Next'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2 — Brand */}
        {step === 1 && (
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-7 h-7 text-emerald-500" />
              </div>
              <h1 className="font-display text-2xl font-bold text-midnight-800">
                Who&apos;s your first brand partner?
              </h1>
              <p className="font-body text-gray-500 mt-2">
                Add a brand you&apos;re working with or talking to.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Brand name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={brand.name}
                  onChange={e => setBrand(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Nike, Adobe, Skillshare"
                  className={inputClass}
                  autoFocus
                />
              </div>
              <div>
                <label className={labelClass}>Website</label>
                <input
                  type="url"
                  value={brand.website}
                  onChange={e => setBrand(p => ({ ...p, website: e.target.value }))}
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Contact name</label>
                  <input
                    type="text"
                    value={brand.contact_name}
                    onChange={e => setBrand(p => ({ ...p, contact_name: e.target.value }))}
                    placeholder="Jane Smith"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Contact email</label>
                  <input
                    type="email"
                    value={brand.contact_email}
                    onChange={e => setBrand(p => ({ ...p, contact_email: e.target.value }))}
                    placeholder="jane@brand.com"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(0)}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleBrandSkip}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <SkipForward className="w-4 h-4" />
                Skip
              </button>
              <button
                onClick={handleBrandNext}
                disabled={saving || !brand.name.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Next'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Deal */}
        {step === 2 && (
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7 text-blue-500" />
              </div>
              <h1 className="font-display text-2xl font-bold text-midnight-800">
                Set up your first deal
              </h1>
              <p className="font-body text-gray-500 mt-2">
                {createdBrandName
                  ? `Create a deal with ${createdBrandName}.`
                  : 'Add the details for your first brand deal.'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Deal title <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={deal.title}
                  onChange={e => setDeal(p => ({ ...p, title: e.target.value }))}
                  placeholder={createdBrandName ? `${createdBrandName} Sponsorship` : 'e.g. Nike Summer Campaign'}
                  className={inputClass}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Deal value ($)</label>
                  <input
                    type="number"
                    value={deal.value}
                    onChange={e => setDeal(p => ({ ...p, value: e.target.value }))}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Stage</label>
                  <select
                    value={deal.status}
                    onChange={e => setDeal(p => ({ ...p, status: e.target.value as any }))}
                    className={cn(inputClass, "bg-white")}
                  >
                    <option value="lead">Lead</option>
                    <option value="negotiating">Negotiating</option>
                    <option value="signed">Signed</option>
                    <option value="delivered">Delivered</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Delivery deadline</label>
                <input
                  type="date"
                  value={deal.delivery_deadline}
                  onChange={e => setDeal(p => ({ ...p, delivery_deadline: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleDealSkip}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <SkipForward className="w-4 h-4" />
                Skip
              </button>
              <button
                onClick={handleDealNext}
                disabled={saving || !deal.title.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Next'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Success */}
        {step === 3 && (
          <div className="p-8 text-center">
            {/* Confetti animation */}
            <div className="relative mb-6">
              <div className="confetti-container">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="confetti-piece"
                    style={{
                      '--x': `${Math.random() * 100}%`,
                      '--delay': `${Math.random() * 0.5}s`,
                      '--color': ['#6C5CE7', '#00B894', '#FFB84D', '#0984E3', '#FF6B6B'][i % 5],
                    } as React.CSSProperties}
                  />
                ))}
              </div>
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto relative z-10">
                <Rocket className="w-8 h-8 text-emerald-500" />
              </div>
            </div>

            <h1 className="font-display text-2xl font-bold text-midnight-800">
              You&apos;re ready to go!
            </h1>
            <p className="font-body text-gray-500 mt-2 max-w-sm mx-auto">
              {createdDealTitle
                ? `Your pipeline is set up with "${createdDealTitle}". Start tracking your brand deals.`
                : 'Your workspace is ready. Start adding brand deals to your pipeline.'}
            </p>

            <button
              onClick={handleFinish}
              disabled={saving}
              className="mt-8 inline-flex items-center justify-center gap-2 px-8 py-3 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50"
            >
              {saving ? 'Finishing...' : 'Go to Pipeline'}
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Confetti CSS */}
            <style jsx>{`
              .confetti-container {
                position: absolute;
                inset: 0;
                overflow: visible;
                pointer-events: none;
              }
              .confetti-piece {
                position: absolute;
                width: 8px;
                height: 8px;
                left: var(--x);
                top: 50%;
                background: var(--color);
                border-radius: 2px;
                opacity: 0;
                animation: confetti-fall 1.5s ease-out var(--delay) forwards;
              }
              @keyframes confetti-fall {
                0% {
                  opacity: 1;
                  transform: translate(0, 0) rotate(0deg) scale(1);
                }
                100% {
                  opacity: 0;
                  transform: translate(
                    calc((var(--x) - 50%) * 0.5),
                    -80px
                  ) rotate(720deg) scale(0.5);
                }
              }
            `}</style>
          </div>
        )}
      </div>

      {/* Step label */}
      <p className="text-center text-xs text-gray-400 mt-4 font-body">
        Step {step + 1} of {STEPS.length}
        {step < STEPS.length - 1 && ` — ${STEPS[step].label}`}
      </p>
    </div>
  );
}
