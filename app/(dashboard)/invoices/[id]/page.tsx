import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { formatCurrency, formatDate, INVOICE_STATUS_CONFIG, cn } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft, Receipt, Building2, DollarSign, Calendar } from 'lucide-react';

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, deal:deals(*, brand:brands(*), contact:contacts(*))')
    .eq('id', params.id)
    .single();

  if (!invoice) notFound();
  const config = INVOICE_STATUS_CONFIG[invoice.status as keyof typeof INVOICE_STATUS_CONFIG];

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/invoices" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Invoices
      </Link>

      <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-card">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold text-midnight-800">Invoice #{invoice.invoice_number}</h1>
            <p className="text-sm text-gray-500 mt-1">{invoice.deal?.brand?.name || 'Unknown Brand'} · {invoice.deal?.title}</p>
          </div>
          <span className={cn("stage-pill text-sm px-4 py-1.5", config.color)}>{config.label}</span>
        </div>

        {/* Details */}
        <div className="grid grid-cols-3 gap-6 mb-8 pb-8 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 mb-1">Amount</p>
            <p className="text-xl font-bold text-midnight-800">{formatCurrency(Number(invoice.amount))}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Sent Date</p>
            <p className="text-sm font-medium">{formatDate(invoice.sent_date)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Due Date</p>
            <p className="text-sm font-medium">{formatDate(invoice.due_date)}</p>
          </div>
        </div>

        {/* Line Items */}
        {invoice.line_items && (invoice.line_items as any[]).length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold text-midnight-800 mb-3">Line Items</h3>
            <div className="space-y-2">
              {(invoice.line_items as any[]).map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-600">{item.description}</span>
                  <span className="text-sm font-semibold">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between py-3 font-bold">
                <span>Total</span>
                <span className="text-lg">{formatCurrency(Number(invoice.amount))}</span>
              </div>
            </div>
          </div>
        )}

        {invoice.custom_notes && (
          <div>
            <h3 className="font-semibold text-midnight-800 mb-2">Notes</h3>
            <p className="text-sm text-gray-600">{invoice.custom_notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
