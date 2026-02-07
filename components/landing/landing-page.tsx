'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Zap, Mail, Clock, Receipt, FileText, ArrowRight,
  ChevronDown, LayoutGrid, Calendar, Shield,
  Check, Menu, X,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Landing Nav
// ---------------------------------------------------------------------------

function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = useCallback((id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      scrolled ? "bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm" : "bg-transparent"
    )}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg text-midnight-800">BrandDeal</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => scrollTo('features')} className="text-sm text-gray-600 hover:text-midnight-800 transition-colors">Features</button>
          <button onClick={() => scrollTo('pricing')} className="text-sm text-gray-600 hover:text-midnight-800 transition-colors">Pricing</button>
          <Link href="/auth/login" className="text-sm text-gray-600 hover:text-midnight-800 transition-colors">Login</Link>
          <Link href="/auth/signup" className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600 transition-colors">
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-gray-600">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
          <button onClick={() => scrollTo('features')} className="block w-full text-left text-sm text-gray-600 py-2">Features</button>
          <button onClick={() => scrollTo('pricing')} className="block w-full text-left text-sm text-gray-600 py-2">Pricing</button>
          <Link href="/auth/login" className="block text-sm text-gray-600 py-2" onClick={() => setMobileOpen(false)}>Login</Link>
          <Link href="/auth/signup" className="block w-full text-center px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-semibold" onClick={() => setMobileOpen(false)}>
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Scroll-triggered fade-in
// ---------------------------------------------------------------------------

function FadeIn({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FAQ Accordion Item
// ---------------------------------------------------------------------------

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span className="font-display font-semibold text-midnight-800 pr-4">{question}</span>
        <ChevronDown className={cn("w-5 h-5 text-gray-400 flex-shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      <div className={cn(
        "overflow-hidden transition-all duration-300",
        open ? "max-h-40 pb-5" : "max-h-0"
      )}>
        <p className="font-body text-sm text-gray-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Landing Page
// ---------------------------------------------------------------------------

export function LandingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-white" style={{ scrollBehavior: 'smooth' }}>
      <LandingNav />

      {/* ---- Hero ---- */}
      <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-gradient-to-br from-brand-100/60 via-brand-50/40 to-transparent blur-3xl" />
          <div className="absolute top-20 right-0 w-96 h-96 rounded-full bg-purple-100/30 blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-midnight-800 leading-tight max-w-3xl mx-auto">
              Stop losing money on brand deals.
            </h1>
          </FadeIn>
          <FadeIn delay={100}>
            <p className="font-body text-lg sm:text-xl text-gray-500 mt-6 max-w-2xl mx-auto leading-relaxed">
              The all-in-one platform for creators to track partnerships, manage contracts, send invoices, and get paid on time.
            </p>
          </FadeIn>
          <FadeIn delay={200}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <Link
                href="/auth/signup"
                className="w-full sm:w-auto px-8 py-3.5 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-8 py-3.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                See How It Works
              </button>
            </div>
          </FadeIn>

          {/* Hero visual — stylized pipeline mockup */}
          <FadeIn delay={350}>
            <div className="mt-16 max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl shadow-gray-200/60 p-4 sm:p-6">
                <div className="flex gap-3 overflow-hidden">
                  {[
                    { label: 'Lead', color: '#FFB84D', cards: 3 },
                    { label: 'Negotiating', color: '#6C5CE7', cards: 2 },
                    { label: 'Signed', color: '#00B894', cards: 2 },
                    { label: 'Delivered', color: '#0984E3', cards: 1 },
                    { label: 'Paid', color: '#00CEC9', cards: 2 },
                  ].map((col) => (
                    <div key={col.label} className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                        <span className="text-[11px] font-semibold text-gray-700 truncate">{col.label}</span>
                      </div>
                      <div className="space-y-2">
                        {Array.from({ length: col.cards }).map((_, i) => (
                          <div key={i} className="h-14 sm:h-16 bg-gray-50 rounded-lg border border-gray-100 flex items-center px-3">
                            <div className="w-full space-y-1.5">
                              <div className="h-2 bg-gray-200 rounded w-3/4" />
                              <div className="h-1.5 bg-gray-100 rounded w-1/2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ---- Social proof ---- */}
      <section className="py-12 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="flex -space-x-2">
                {['A', 'M', 'J', 'S', 'K'].map((initial, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">
                    {initial}
                  </div>
                ))}
              </div>
              <p className="font-body text-sm text-gray-500">
                <span className="font-semibold text-midnight-800">500+ creators</span> manage their brand deals with BrandDeal OS
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ---- Pain Points ---- */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-midnight-800">Sound familiar?</h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Mail, title: 'Buried in brand emails', desc: 'Opportunities slip away because they get lost in your inbox.' },
              { icon: Clock, title: 'Missing deadlines', desc: 'Deliverables slip through the cracks without a clear system.' },
              { icon: Receipt, title: 'Chasing payments', desc: 'Invoices go unpaid for months because no one is tracking them.' },
              { icon: FileText, title: 'Contract chaos', desc: 'Key terms are buried in PDF files you can never find again.' },
            ].map((pain, i) => (
              <FadeIn key={pain.title} delay={i * 100}>
                <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg hover:border-gray-200 transition-all h-full">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center mb-4">
                    <pain.icon className="w-5 h-5 text-red-500" />
                  </div>
                  <h3 className="font-display font-semibold text-midnight-800 mb-2">{pain.title}</h3>
                  <p className="font-body text-sm text-gray-500 leading-relaxed">{pain.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Features ---- */}
      <section id="features" className="py-20 sm:py-28 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-midnight-800">
                Everything you need to run brand deals like a pro
              </h2>
              <p className="font-body text-gray-500 mt-4 max-w-xl mx-auto">
                From first contact to final payment — manage every step in one place.
              </p>
            </div>
          </FadeIn>

          <div className="space-y-20">
            {[
              {
                icon: LayoutGrid,
                title: 'Pipeline Board',
                desc: 'See every deal at a glance. Drag and drop deals from Lead to Paid. Know exactly where each partnership stands without digging through emails or spreadsheets.',
                color: 'bg-brand-50 text-brand-500',
                visual: ['Lead', 'Negotiating', 'Signed', 'Paid'],
              },
              {
                icon: Receipt,
                title: 'Smart Invoicing',
                desc: 'Generate professional invoices in seconds. Track payment status automatically. Get notified when payments are overdue so you never leave money on the table.',
                color: 'bg-emerald-50 text-emerald-500',
                visual: ['INV-001', 'INV-002', 'INV-003'],
              },
              {
                icon: Calendar,
                title: 'Deadline Calendar',
                desc: 'Never miss a deliverable again. See all your deadlines color-coded by urgency. Plan your content schedule around your brand commitments.',
                color: 'bg-blue-50 text-blue-500',
                visual: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
              },
              {
                icon: Shield,
                title: 'Contract Vault',
                desc: 'Upload contracts and keep them organized by deal. AI extracts key terms like payment amounts, deadlines, and exclusivity clauses. Coming soon.',
                color: 'bg-amber-50 text-amber-500',
                visual: ['contract.pdf', 'terms.pdf'],
              },
            ].map((feature, i) => (
              <FadeIn key={feature.title}>
                <div className={cn(
                  "flex flex-col gap-10 items-center",
                  i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                )}>
                  {/* Text */}
                  <div className="flex-1">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-5", feature.color)}>
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-display text-2xl font-bold text-midnight-800 mb-3">{feature.title}</h3>
                    <p className="font-body text-gray-500 leading-relaxed max-w-md">{feature.desc}</p>
                  </div>

                  {/* Visual placeholder */}
                  <div className="flex-1 w-full">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 rounded-full bg-red-300" />
                        <div className="w-3 h-3 rounded-full bg-yellow-300" />
                        <div className="w-3 h-3 rounded-full bg-green-300" />
                      </div>
                      <div className={cn(
                        feature.visual.length > 3 ? "flex gap-2" : "space-y-2.5"
                      )}>
                        {feature.visual.map((label, j) => (
                          <div
                            key={label}
                            className={cn(
                              "rounded-lg border border-gray-100 px-4 py-3",
                              feature.visual.length > 3 ? "flex-1 text-center" : ""
                            )}
                          >
                            <div className="text-xs font-medium text-gray-700">{label}</div>
                            <div className="h-1.5 bg-gray-100 rounded mt-2 w-3/4" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Pricing ---- */}
      <section id="pricing" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-midnight-800">
                Simple, creator-friendly pricing
              </h2>
              <p className="font-body text-gray-500 mt-4">
                Start free. Upgrade when you&apos;re ready.
              </p>

              {/* Annual toggle */}
              <div className="flex items-center justify-center gap-3 mt-8">
                <span className={cn("text-sm font-medium", !annual ? "text-midnight-800" : "text-gray-400")}>Monthly</span>
                <button
                  onClick={() => setAnnual(!annual)}
                  className={cn(
                    "relative w-12 h-7 rounded-full transition-colors",
                    annual ? "bg-brand-500" : "bg-gray-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform",
                    annual ? "left-6" : "left-1"
                  )} />
                </button>
                <span className={cn("text-sm font-medium", annual ? "text-midnight-800" : "text-gray-400")}>
                  Annual <span className="text-emerald-500 text-xs font-semibold">Save 2 months</span>
                </span>
              </div>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                name: 'Free',
                price: 0,
                annual: 0,
                desc: 'Perfect for getting started',
                features: ['3 active deals', 'Basic pipeline', 'Manual tracking', '1 invoice template'],
                cta: 'Get Started',
                highlight: false,
              },
              {
                name: 'Pro',
                price: 19,
                annual: 180,
                desc: 'For full-time creators',
                features: ['Unlimited deals', 'AI contract extraction', 'Email intake', 'Unlimited invoices', 'Calendar sync', 'Payment tracking'],
                cta: 'Start Free Trial',
                highlight: true,
              },
              {
                name: 'Elite',
                price: 39,
                annual: 360,
                desc: 'For agencies & top creators',
                features: ['Everything in Pro', 'Unlimited AI', 'Brand portal', 'Custom branding', 'Analytics dashboard', 'API access'],
                cta: 'Start Free Trial',
                highlight: false,
              },
            ].map((tier, i) => (
              <FadeIn key={tier.name} delay={i * 100}>
                <div className={cn(
                  "rounded-2xl border p-6 sm:p-8 h-full flex flex-col",
                  tier.highlight
                    ? "border-brand-500 bg-brand-50/30 shadow-lg shadow-brand-500/10 relative"
                    : "border-gray-200 bg-white"
                )}>
                  {tier.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-500 text-white text-xs font-semibold rounded-full">
                      Most Popular
                    </div>
                  )}
                  <h3 className="font-display font-bold text-midnight-800 text-lg">{tier.name}</h3>
                  <p className="font-body text-xs text-gray-500 mt-1">{tier.desc}</p>
                  <div className="mt-5 mb-6">
                    <span className="font-display text-4xl font-bold text-midnight-800">
                      ${annual ? Math.round(tier.annual / 12) : tier.price}
                    </span>
                    <span className="text-sm text-gray-400">/mo</span>
                    {annual && tier.price > 0 && (
                      <p className="text-xs text-gray-400 mt-1">${tier.annual}/year</p>
                    )}
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {tier.features.map(f => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                        <Check className={cn("w-4 h-4 flex-shrink-0", tier.highlight ? "text-brand-500" : "text-emerald-500")} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/auth/signup"
                    className={cn(
                      "w-full py-3 rounded-xl text-sm font-semibold text-center transition-colors block",
                      tier.highlight
                        ? "bg-brand-500 text-white hover:bg-brand-600"
                        : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    {tier.cta}
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ---- FAQ ---- */}
      <section className="py-20 sm:py-28 bg-gray-50/50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-midnight-800 text-center mb-12">
              Frequently asked questions
            </h2>
          </FadeIn>
          <FadeIn delay={100}>
            <div>
              <FAQItem
                question="Is there really a free tier?"
                answer="Yes! The free plan lets you manage up to 3 active deals with our full pipeline board. No credit card required. Upgrade whenever you need more."
              />
              <FAQItem
                question="Can I cancel anytime?"
                answer="Absolutely. There are no long-term contracts. You can cancel, upgrade, or downgrade your plan at any time from your settings page."
              />
              <FAQItem
                question="What platforms do you support?"
                answer="Brand Deal OS works with all major platforms — YouTube, TikTok, Instagram, Twitter/X, podcasts, blogs, newsletters, and more. Track deals across any platform you create content on."
              />
              <FAQItem
                question="Is my data secure?"
                answer="Yes. We use Supabase (built on PostgreSQL) with row-level security, so your data is only accessible to you. All connections are encrypted with TLS."
              />
              <FAQItem
                question="Do you offer refunds?"
                answer="Yes, we offer a 14-day money-back guarantee on all paid plans. If you're not happy, email us and we'll refund you — no questions asked."
              />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ---- Final CTA ---- */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="bg-gradient-to-br from-brand-500 to-purple-600 rounded-3xl px-6 py-16 sm:px-12 sm:py-20 text-center">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white max-w-2xl mx-auto leading-tight">
                Ready to stop losing money on brand deals?
              </h2>
              <p className="font-body text-white/80 mt-4 max-w-lg mx-auto">
                Join 500+ creators who manage their partnerships with Brand Deal OS.
              </p>
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 mt-10 px-8 py-4 bg-white text-brand-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors shadow-lg"
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="border-t border-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-display font-bold text-midnight-800">BrandDeal OS</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>Features</button>
              <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>Pricing</button>
              <Link href="/auth/login">Login</Link>
              <Link href="/auth/signup" className="text-brand-500 font-medium">Sign Up</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-400">&copy; 2026 Brand Deal OS. All rights reserved.</p>
            <p className="text-xs text-gray-400">Made for creators, by creators</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
