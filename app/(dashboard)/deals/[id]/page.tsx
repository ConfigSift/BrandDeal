import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { DealDetailClient } from '@/components/deals/deal-detail-client';
import type { SubscriptionTier } from '@/types';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = createServerSupabaseClient();
  const { data: deal } = await supabase.from('deals').select('title').eq('id', params.id).single();
  return { title: deal ? `${deal.title} — Deal` : 'Deal' };
}

export default async function DealDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();

  const { data: { user: authUser } } = await supabase.auth.getUser();

  const { data: deal } = await supabase
    .from('deals')
    .select('*, brand:brands(*), contact:contacts(*)')
    .eq('id', params.id)
    .single();

  if (!deal) notFound();

  const [
    { data: deliverables },
    { data: contracts },
    { data: files },
    { data: invoices },
    { data: userProfile },
  ] = await Promise.all([
    supabase
      .from('deliverables')
      .select('*')
      .eq('deal_id', deal.id)
      .order('sort_order'),
    supabase
      .from('contracts')
      .select('*')
      .eq('deal_id', deal.id)
      .order('uploaded_at', { ascending: false }),
    supabase
      .from('files')
      .select('*')
      .eq('deal_id', deal.id)
      .order('uploaded_at', { ascending: false }),
    supabase
      .from('invoices')
      .select('*')
      .eq('deal_id', deal.id)
      .order('created_at', { ascending: false }),
    authUser
      ? supabase
          .from('users')
          .select('subscription_tier')
          .eq('id', authUser.id)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <DealDetailClient
      deal={deal}
      deliverables={deliverables || []}
      contracts={contracts || []}
      files={files || []}
      invoices={invoices || []}
      subscriptionTier={(userProfile?.subscription_tier as SubscriptionTier) || 'free'}
    />
  );
}
