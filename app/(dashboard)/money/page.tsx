import { createServerSupabaseClient } from '@/lib/supabase/server';
import { MoneyDashboard } from '@/components/money/money-dashboard';

export default async function MoneyPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const [
    { data: dealStats },
    { data: outstandingInvoices },
    { data: monthlyRevenue },
    { data: revenueStats },
    { data: payments },
  ] = await Promise.all([
    supabase.rpc('get_deal_stats', { p_user_id: user.id }),
    supabase
      .from('outstanding_invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true }),
    supabase
      .from('monthly_revenue')
      .select('*')
      .eq('user_id', user.id)
      .order('month', { ascending: true })
      .limit(12),
    supabase
      .from('revenue_summary')
      .select('*')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('payments')
      .select('*, invoice:invoices(*, deal:deals(*, brand:brands(*)))')
      .eq('user_id', user.id)
      .order('paid_date', { ascending: false })
      .limit(20),
  ]);

  return (
    <MoneyDashboard
      dealStats={dealStats ?? {
        total_deals: 0,
        active_deals: 0,
        pipeline_value: 0,
        pending_payments: 0,
        overdue_payments: 0,
        avg_deal_value: 0,
      }}
      outstandingInvoices={outstandingInvoices ?? []}
      monthlyRevenue={monthlyRevenue ?? []}
      revenueStats={revenueStats ?? {
        total_earned_all_time: 0,
        total_earned_ytd: 0,
        avg_deal_value: 0,
      }}
      payments={payments ?? []}
    />
  );
}
