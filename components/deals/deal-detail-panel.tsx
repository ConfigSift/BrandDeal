'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Deal, Deliverable, Contract, FileRecord, Invoice, SubscriptionTier } from '@/types';
import { DealDetailClient } from '@/components/deals/deal-detail-client';

type DealDetailData = {
  deal: Deal;
  deliverables: Deliverable[];
  contracts: Contract[];
  files: FileRecord[];
  invoices: Invoice[];
  subscriptionTier: SubscriptionTier;
};

export function DealDetailPanel({ dealId }: { dealId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [state, setState] = useState<{
    status: 'loading' | 'ready' | 'not-found';
    data?: DealDetailData;
  }>({ status: 'loading' });

  useEffect(() => {
    let isMounted = true;
    async function loadDeal() {
      setState({ status: 'loading' });
      const { data: deal } = await supabase
        .from('deals')
        .select('*, brand:brands(*), contact:contacts(*)')
        .eq('id', dealId)
        .single();

      if (!deal) {
        if (isMounted) setState({ status: 'not-found' });
        return;
      }

      const { data: { user: authUser } } = await supabase.auth.getUser();

      const [deliverablesRes, contractsRes, filesRes, invoicesRes, userRes] = await Promise.all([
        supabase.from('deliverables').select('*').eq('deal_id', deal.id).order('sort_order'),
        supabase.from('contracts').select('*').eq('deal_id', deal.id).order('uploaded_at', { ascending: false }),
        supabase.from('files').select('*').eq('deal_id', deal.id).order('uploaded_at', { ascending: false }),
        supabase.from('invoices').select('*').eq('deal_id', deal.id).order('created_at', { ascending: false }),
        authUser
          ? supabase.from('users').select('subscription_tier').eq('id', authUser.id).single()
          : Promise.resolve({ data: null }),
      ]);

      if (isMounted) {
        setState({
          status: 'ready',
          data: {
            deal,
            deliverables: deliverablesRes.data || [],
            contracts: contractsRes.data || [],
            files: filesRes.data || [],
            invoices: invoicesRes.data || [],
            subscriptionTier: (userRes.data?.subscription_tier as SubscriptionTier) || 'free',
          },
        });
      }
    }
    loadDeal();
    return () => {
      isMounted = false;
    };
  }, [dealId, supabase]);

  if (state.status === 'loading') {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500">
        Loading deal…
      </div>
    );
  }

  if (state.status === 'not-found' || !state.data) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500">
        Deal not found.
      </div>
    );
  }

  return (
    <DealDetailClient
      deal={state.data.deal}
      deliverables={state.data.deliverables}
      contracts={state.data.contracts}
      files={state.data.files}
      invoices={state.data.invoices}
      subscriptionTier={state.data.subscriptionTier}
      variant="panel"
    />
  );
}
