'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { cn, formatCurrency, formatDate, INVOICE_STATUS_CONFIG } from '@/lib/utils';
import { DollarSign, Clock, AlertCircle, TrendingUp, ArrowUpDown, Bell, CheckCircle } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { DealStats, InvoiceStatus } from '@/types';

// --- Types for props ---

interface OutstandingInvoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: InvoiceStatus;
  due_date: string | null;
  deal_title: string;
  brand_name: string;
  days_overdue: number;
  urgency: 'overdue' | 'due_soon' | 'on_track';
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
  deals_paid: number;
}

interface RevenueStats {
  total_earned_all_time: number;
  total_earned_ytd: number;
  avg_deal_value: number;
}

interface PaymentRecord {
  id: string;
  amount: number;
  paid_date: string | null;
  payment_method: string | null;
  notes: string | null;
  invoice: {
    id: string;
    invoice_number: string;
    deal: {
      id: string;
      title: string;
      brand: { name: string } | null;
    } | null;
  } | null;
}

interface MoneyDashboardProps {
  dealStats: DealStats;
  outstandingInvoices: OutstandingInvoice[];
  monthlyRevenue: MonthlyRevenue[];
  revenueStats: RevenueStats;
  payments: PaymentRecord[];
}

// --- Sort helpers ---

type SortKey = 'invoice_number' | 'brand_name' | 'amount' | 'due_date' | 'status' | 'days_overdue';
type SortDir = 'asc' | 'desc';

function sortInvoices(invoices: OutstandingInvoice[], key: SortKey, dir: SortDir) {
  return [...invoices].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case 'invoice_number':
        cmp = a.invoice_number.localeCompare(b.invoice_number);
        break;
      case 'brand_name':
        cmp = a.brand_name.localeCompare(b.brand_name);
        break;
      case 'amount':
        cmp = a.amount - b.amount;
        break;
      case 'due_date':
        cmp = (a.due_date ?? '').localeCompare(b.due_date ?? '');
        break;
      case 'status':
        cmp = a.status.localeCompare(b.status);
        break;
      case 'days_overdue':
        cmp = a.days_overdue - b.days_overdue;
        break;
    }
    return dir === 'asc' ? cmp : -cmp;
  });
}

// --- Chart helpers ---

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatMonth(monthStr: string) {
  const d = new Date(monthStr + '-01');
  return MONTH_NAMES[d.getMonth()];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-card px-4 py-3">
      <p className="font-body text-sm text-gray-500">{label}</p>
      <p className="font-display font-bold text-midnight-800">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

// --- Main Component ---

export function MoneyDashboard({
  dealStats,
  outstandingInvoices,
  monthlyRevenue,
  revenueStats,
  payments,
}: MoneyDashboardProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [sortKey, setSortKey] = useState<SortKey>('due_date');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);

  const sortedInvoices = useMemo(
    () => sortInvoices(outstandingInvoices, sortKey, sortDir),
    [outstandingInvoices, sortKey, sortDir]
  );

  const chartData = useMemo(
    () => monthlyRevenue.map(m => ({ name: formatMonth(m.month), revenue: m.revenue })),
    [monthlyRevenue]
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleMarkPaid = async (invoice: OutstandingInvoice) => {
    setMarkingPaid(invoice.id);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMarkingPaid(null);
      return;
    }

    const { error: invoiceError } = await supabase
      .from('invoices')
      .update({ status: 'paid' })
      .eq('id', invoice.id);

    if (!invoiceError) {
      await supabase.from('payments').insert({
        invoice_id: invoice.id,
        user_id: user.id,
        amount: invoice.amount,
        paid_date: new Date().toISOString().split('T')[0],
      });
      router.refresh();
    }
    setMarkingPaid(null);
  };

  const handleSendReminder = (invoice: OutstandingInvoice) => {
    // Placeholder — future implementation
    alert(`Reminder sent for invoice ${invoice.invoice_number}`);
  };

  // --- Summary cards config ---
  const cards = [
    {
      label: 'Total Earned YTD',
      value: formatCurrency(revenueStats.total_earned_ytd),
      sub: `${formatCurrency(revenueStats.total_earned_all_time)} all-time`,
      icon: DollarSign,
      accent: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Pending Payments',
      value: formatCurrency(dealStats.pending_payments),
      sub: 'Invoices awaiting payment',
      icon: Clock,
      accent: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Overdue',
      value: formatCurrency(dealStats.overdue_payments),
      sub: `${outstandingInvoices.filter(i => i.urgency === 'overdue').length} overdue invoices`,
      icon: AlertCircle,
      accent: 'bg-red-50 text-red-600',
      valueColor: 'text-red-600',
    },
    {
      label: 'Pipeline Value',
      value: formatCurrency(dealStats.pipeline_value),
      sub: 'Signed & delivered deals',
      icon: TrendingUp,
      accent: 'bg-brand-50 text-brand-600',
    },
  ];

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <button
      onClick={() => handleSort(sortKeyName)}
      className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
    >
      {label}
      <ArrowUpDown className={cn('w-3 h-3', sortKey === sortKeyName && 'text-brand-500')} />
    </button>
  );

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-midnight-800">Money</h1>
        <p className="font-body text-gray-500 mt-1">Your financial command center</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-gray-100 p-6 shadow-card hover:shadow-card-hover transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-body text-sm text-gray-500">{card.label}</p>
                  <p className={cn('font-display text-2xl font-bold text-midnight-800', card.valueColor)}>
                    {card.value}
                  </p>
                  <p className="font-body text-xs text-gray-400">{card.sub}</p>
                </div>
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', card.accent)}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-card">
        <h2 className="font-display text-lg font-semibold text-midnight-800 mb-4">Monthly Revenue</h2>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-400 font-body text-sm">
            No revenue data yet. Completed deals will appear here.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6C5CE7" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6C5CE7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#6C5CE7"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Outstanding invoices */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-card">
        <h2 className="font-display text-lg font-semibold text-midnight-800 mb-4">Outstanding Invoices</h2>
        {sortedInvoices.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 font-body text-sm">
            No outstanding invoices. You&apos;re all caught up!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-3"><SortHeader label="Invoice #" sortKeyName="invoice_number" /></th>
                  <th className="text-left py-3 px-3"><SortHeader label="Brand" sortKeyName="brand_name" /></th>
                  <th className="text-right py-3 px-3"><SortHeader label="Amount" sortKeyName="amount" /></th>
                  <th className="text-left py-3 px-3"><SortHeader label="Due Date" sortKeyName="due_date" /></th>
                  <th className="text-left py-3 px-3"><SortHeader label="Status" sortKeyName="status" /></th>
                  <th className="text-right py-3 px-3"><SortHeader label="Days Overdue" sortKeyName="days_overdue" /></th>
                  <th className="text-right py-3 px-3">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedInvoices.map(inv => {
                  const statusCfg = INVOICE_STATUS_CONFIG[inv.status];
                  return (
                    <tr
                      key={inv.id}
                      className={cn(
                        'border-b border-gray-50 transition-colors',
                        inv.urgency === 'overdue' && 'bg-red-50/50',
                        inv.urgency === 'due_soon' && 'bg-amber-50/50'
                      )}
                    >
                      <td className="py-3 px-3 font-body text-sm font-medium text-midnight-800">
                        {inv.invoice_number}
                      </td>
                      <td className="py-3 px-3 font-body text-sm text-gray-600">{inv.brand_name}</td>
                      <td className="py-3 px-3 font-body text-sm text-midnight-800 text-right font-medium">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="py-3 px-3 font-body text-sm text-gray-600">{formatDate(inv.due_date)}</td>
                      <td className="py-3 px-3">
                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', statusCfg.color)}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-body text-sm text-right">
                        {inv.days_overdue > 0 ? (
                          <span className="text-red-600 font-medium">{inv.days_overdue}d</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {inv.urgency === 'overdue' && (
                            <button
                              onClick={() => handleSendReminder(inv)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 rounded-lg hover:bg-amber-200 transition-colors"
                            >
                              <Bell className="w-3 h-3" />
                              Remind
                            </button>
                          )}
                          <button
                            onClick={() => handleMarkPaid(inv)}
                            disabled={markingPaid === inv.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle className="w-3 h-3" />
                            {markingPaid === inv.id ? 'Saving...' : 'Mark Paid'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment history */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-card">
        <h2 className="font-display text-lg font-semibold text-midnight-800 mb-4">Payment History</h2>
        {payments.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 font-body text-sm">
            No payments recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Brand / Deal</th>
                  <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-b border-gray-50">
                    <td className="py-3 px-3 font-body text-sm text-gray-600">{formatDate(p.paid_date)}</td>
                    <td className="py-3 px-3 font-body text-sm">
                      {p.invoice?.deal ? (
                        <Link
                          href={`/deals/${p.invoice.deal.id}`}
                          className="text-brand-600 hover:text-brand-700 hover:underline font-medium"
                        >
                          {p.invoice.deal.brand?.name ? `${p.invoice.deal.brand.name} — ` : ''}
                          {p.invoice.deal.title}
                        </Link>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-body text-sm text-midnight-800 text-right font-medium">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3 px-3 font-body text-sm text-gray-500 capitalize">
                      {p.payment_method || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
