import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PipelineBoard } from '@/components/pipeline/pipeline-board';
import { DEAL_STAGES } from '@/lib/utils';
import { getFeatureLimit } from '@/lib/feature-gates';
import { SubscriptionTier } from '@/types';

export const metadata: Metadata = { title: 'Pipeline' };
import { DealLimitBanner } from '@/components/pipeline/deal-limit-banner';

export default async function PipelinePage() {
  const supabase = createServerSupabaseClient();

  const { data: deals } = await supabase
    .from('deals')
    .select('*, brand:brands(*), contact:contacts(*)')
    .eq('archived', false)
    .order('sort_order', { ascending: true });

  // Also fetch stats and user tier
  const { data: { user } } = await supabase.auth.getUser();
  let stats = null;
  let subscriptionTier: SubscriptionTier = 'free';
  if (user) {
    const [{ data: statsData }, { data: profile }] = await Promise.all([
      supabase.rpc('get_deal_stats', { p_user_id: user.id }),
      supabase.from('users').select('subscription_tier').eq('id', user.id).single(),
    ]);
    stats = statsData;
    if (profile?.subscription_tier) subscriptionTier = profile.subscription_tier as SubscriptionTier;
  }

  const activeDealCount = deals?.length || 0;
  const dealLimit = getFeatureLimit(subscriptionTier, 'max_active_deals') as number;

  const columns = DEAL_STAGES.map(stage => ({
    ...stage,
    deals: (deals || []).filter(d => d.status === stage.id),
  }));

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-midnight-800">Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeDealCount} active deals{stats ? ` · $${Number(stats.pipeline_value || 0).toLocaleString()} pipeline value` : ''}
          </p>
        </div>
      </div>

      {subscriptionTier === 'free' && activeDealCount >= dealLimit && (
        <DealLimitBanner used={activeDealCount} limit={dealLimit} />
      )}

      {/* Kanban Board */}
      <PipelineBoard initialColumns={columns} />
    </div>
  );
}
