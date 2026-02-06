import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CalendarClient } from '@/components/calendar-client';

export default async function CalendarPage() {
  const supabase = createServerSupabaseClient();

  const { data: deliverables } = await supabase
    .from('deliverables')
    .select('*, deal:deals(*, brand:brands(*))')
    .not('due_date', 'is', null)
    .order('due_date');

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, deal:deals(*, brand:brands(*))')
    .not('due_date', 'is', null)
    .in('status', ['sent', 'overdue'])
    .order('due_date');

  return <CalendarClient deliverables={deliverables || []} invoices={invoices || []} />;
}
