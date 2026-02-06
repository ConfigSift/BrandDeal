'use client';

import Link from 'next/link';
import { Invoice, Deal, Brand } from '@/types';
import { formatCurrency, formatDate, INVOICE_STATUS_CONFIG, cn } from '@/lib/utils';
import { Receipt, Plus, FileText } from 'lucide-react';

interface Props {
  invoices: (Invoice & { deal: Deal & { brand: Brand | null } })[];
}

export function InvoicesClient({ invoices }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-midnight-800">Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">{invoices.length} invoices</p>
        </div>
        <Link href="/invoices/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors text-sm font-semibold">
          <Plus className="w-4 h-4" /> New Invoice
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {(['draft', 'sent', 'overdue', 'paid'] as const).map(status => {
          const config = INVOICE_STATUS_CONFIG[status];
          const filtered = invoices.filter(i => i.status === status);
          const total = filtered.reduce((sum, i) => sum + Number(i.amount), 0);
          return (
            <div key={status} className="bg-white rounded-xl border border-gray-100 p-4 shadow-card">
              <span className={cn("stage-pill text-xs mb-2", config.color)}>{config.label}</span>
              <p className="text-2xl font-bold text-midnight-800 mt-2">{formatCurrency(total)}</p>
              <p className="text-xs text-gray-400">{filtered.length} invoices</p>
            </div>
          );
        })}
      </div>

      {/* Invoice list */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Invoice</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Brand / Deal</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Amount</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Due Date</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => {
              const config = INVOICE_STATUS_CONFIG[inv.status];
              return (
                <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <Link href={`/invoices/${inv.id}`} className="font-medium text-sm text-midnight-800 hover:text-brand-500">
                      #{inv.invoice_number}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-midnight-800">{inv.deal?.brand?.name || '—'}</p>
                    <p className="text-xs text-gray-400">{inv.deal?.title}</p>
                  </td>
                  <td className="px-5 py-4 font-semibold text-sm">{formatCurrency(Number(inv.amount))}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{formatDate(inv.due_date)}</td>
                  <td className="px-5 py-4"><span className={cn("stage-pill text-xs", config.color)}>{config.label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {invoices.length === 0 && (
          <div className="text-center py-16">
            <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-600 mb-2">No invoices yet</h3>
            <p className="text-sm text-gray-400">Create your first invoice from a deal.</p>
          </div>
        )}
      </div>
    </div>
  );
}
