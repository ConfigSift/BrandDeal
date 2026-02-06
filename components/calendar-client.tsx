'use client';

import { useState } from 'react';
import { Deliverable, Invoice, Deal, Brand } from '@/types';
import { formatDate, formatRelativeDate, PLATFORM_CONFIG, DELIVERABLE_STATUS_CONFIG, cn } from '@/lib/utils';
import { Calendar as CalIcon, Package, Receipt, AlertCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';

type DeliverableWithDeal = Deliverable & { deal: Deal & { brand: Brand | null } };
type InvoiceWithDeal = Invoice & { deal: Deal & { brand: Brand | null } };

interface Props {
  deliverables: DeliverableWithDeal[];
  invoices: InvoiceWithDeal[];
}

type CalendarEvent = {
  id: string;
  type: 'deliverable' | 'invoice';
  title: string;
  date: string;
  brandName: string | null;
  dealId: string;
  urgency: 'overdue' | 'urgent' | 'soon' | 'ok';
  extra: string;
};

function getUrgency(dateStr: string): CalendarEvent['urgency'] {
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = diff / (1000 * 60 * 60 * 24);
  if (days < 0) return 'overdue';
  if (days < 3) return 'urgent';
  if (days < 7) return 'soon';
  return 'ok';
}

const URGENCY_COLORS = {
  overdue: 'bg-red-100 text-red-700 border-red-200',
  urgent: 'bg-orange-100 text-orange-700 border-orange-200',
  soon: 'bg-amber-100 text-amber-700 border-amber-200',
  ok: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export function CalendarClient({ deliverables, invoices }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<'list' | 'calendar'>('list');

  const events: CalendarEvent[] = [
    ...deliverables.filter(d => d.status !== 'published' && d.status !== 'approved').map(d => ({
      id: d.id,
      type: 'deliverable' as const,
      title: d.title,
      date: d.due_date!,
      brandName: d.deal?.brand?.name || null,
      dealId: d.deal_id,
      urgency: getUrgency(d.due_date!),
      extra: `${PLATFORM_CONFIG[d.platform].emoji} ${PLATFORM_CONFIG[d.platform].label}`,
    })),
    ...invoices.map(i => ({
      id: i.id,
      type: 'invoice' as const,
      title: `Invoice #${i.invoice_number}`,
      date: i.due_date!,
      brandName: i.deal?.brand?.name || null,
      dealId: i.deal_id,
      urgency: getUrgency(i.due_date!),
      extra: `$${Number(i.amount).toLocaleString()}`,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const overdueCount = events.filter(e => e.urgency === 'overdue').length;
  const upcomingCount = events.filter(e => e.urgency !== 'overdue').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-midnight-800">Calendar</h1>
          <p className="text-sm text-gray-500 mt-1">
            {overdueCount > 0 && <span className="text-red-500 font-medium">{overdueCount} overdue</span>}
            {overdueCount > 0 && upcomingCount > 0 && ' · '}
            {upcomingCount} upcoming
          </p>
        </div>
        <div className="flex gap-1 bg-surface-100 rounded-lg p-1">
          <button onClick={() => setView('list')} className={cn("px-3 py-1.5 rounded-md text-sm font-medium", view === 'list' ? 'bg-white shadow-sm' : 'text-gray-500')}>List</button>
          <button onClick={() => setView('calendar')} className={cn("px-3 py-1.5 rounded-md text-sm font-medium", view === 'calendar' ? 'bg-white shadow-sm' : 'text-gray-500')}>Calendar</button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="space-y-2">
          {events.length === 0 && (
            <div className="text-center py-16">
              <CalIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-600 mb-2">Nothing on the calendar</h3>
              <p className="text-sm text-gray-400">Deliverable deadlines and invoice due dates will appear here.</p>
            </div>
          )}
          {events.map(event => (
            <Link key={event.id} href={`/deals/${event.dealId}`}
              className={cn("flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-card-hover", URGENCY_COLORS[event.urgency])}>
              <div className="flex-shrink-0">
                {event.type === 'deliverable' ? <Package className="w-5 h-5" /> : <Receipt className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{event.title}</p>
                <p className="text-xs opacity-75">{event.brandName} · {event.extra}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-medium">{formatDate(event.date)}</p>
                <p className="text-xs opacity-75">{formatRelativeDate(event.date)}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
            <h2 className="font-display font-bold text-lg">{format(currentMonth, 'MMMM yyyy')}</h2>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="bg-gray-50 px-2 py-2 text-xs font-medium text-gray-500 text-center">{d}</div>
            ))}
            {eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }).map((day, idx) => {
              const dayEvents = events.filter(e => isSameDay(new Date(e.date), day));
              return (
                <div key={idx} className={cn("bg-white min-h-[80px] p-1", !isSameMonth(day, currentMonth) && "opacity-30", isToday(day) && "ring-2 ring-brand-500 ring-inset")}>
                  <p className={cn("text-xs font-medium mb-1 px-1", isToday(day) ? "text-brand-500" : "text-gray-500")}>{format(day, 'd')}</p>
                  {dayEvents.slice(0, 2).map(e => (
                    <div key={e.id} className={cn("text-[10px] px-1.5 py-0.5 rounded mb-0.5 truncate font-medium",
                      e.urgency === 'overdue' ? 'bg-red-100 text-red-600' : e.type === 'deliverable' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600')}>
                      {e.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && <p className="text-[10px] text-gray-400 px-1">+{dayEvents.length - 2} more</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
