import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { DealDetailClient } from '@/components/deals/deal-detail-client';

export default async function DealDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();

  const { data: deal } = await supabase
    .from('deals')
    .select('*, brand:brands(*), contact:contacts(*)')
    .eq('id', params.id)
    .single();

  if (!deal) notFound();

  const { data: deliverables } = await supabase
    .from('deliverables')
    .select('*')
    .eq('deal_id', deal.id)
    .order('sort_order');

  const { data: contracts } = await supabase
    .from('contracts')
    .select('*')
    .eq('deal_id', deal.id)
    .order('uploaded_at', { ascending: false });

  const { data: files } = await supabase
    .from('files')
    .select('*')
    .eq('deal_id', deal.id)
    .order('uploaded_at', { ascending: false });

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('deal_id', deal.id)
    .order('created_at', { ascending: false });

  return (
    <DealDetailClient
      deal={deal}
      deliverables={deliverables || []}
      contracts={contracts || []}
      files={files || []}
      invoices={invoices || []}
    />
  );
}
