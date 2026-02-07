import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const MoneyDashboard = dynamic(
  () => import('@/components/money/money-dashboard').then(m => m.MoneyDashboard),
  {
    ssr: false,
    loading: () => <MoneyLoadingSkeleton />,
  }
);

function MoneyLoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 shadow-card">
            <div className="h-3 w-20 bg-gray-100 rounded mb-3" />
            <div className="h-7 w-28 bg-gray-200 rounded-lg" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-card">
        <div className="h-64 bg-gray-50 rounded-xl" />
      </div>
    </div>
  );
}

export const metadata: Metadata = { title: 'Money Dashboard' };

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
