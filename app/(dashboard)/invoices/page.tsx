import { createServerSupabaseClient } from '@/lib/supabase/server';
import { InvoicesClient } from '@/components/invoices/invoices-client';

export default async function InvoicesPage() {
  const supabase = createServerSupabaseClient();
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, deal:deals(*, brand:brands(*))')
    .order('created_at', { ascending: false });

  return <InvoicesClient invoices={invoices || []} />;
}
