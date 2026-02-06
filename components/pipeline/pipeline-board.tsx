'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DealStatus, Deal, PipelineColumn } from '@/types';
import { formatCurrency, formatRelativeDate, cn, DEAL_STAGES } from '@/lib/utils';
import { GripVertical, Building2, User, Calendar, DollarSign, MoreHorizontal, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Props {
  initialColumns: (typeof DEAL_STAGES[0] & { deals: Deal[] })[];
}

export function PipelineBoard({ initialColumns }: Props) {
  const [columns, setColumns] = useState(initialColumns);
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<DealStatus | null>(null);
  const supabase = createClient();

  const handleDragStart = (e: React.DragEvent, deal: Deal) => {
    setDraggedDeal(deal);
    e.dataTransfer.effectAllowed = 'move';
    // Add a slight delay for visual feedback
    requestAnimationFrame(() => {
      const el = document.getElementById(`deal-${deal.id}`);
      if (el) el.style.opacity = '0.5';
    });
  };

  const handleDragEnd = () => {
    if (draggedDeal) {
      const el = document.getElementById(`deal-${draggedDeal.id}`);
      if (el) el.style.opacity = '1';
    }
    setDraggedDeal(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: DealStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: DealStatus) => {
    e.preventDefault();
    if (!draggedDeal || draggedDeal.status === targetStatus) {
      setDragOverColumn(null);
      return;
    }

    // Optimistic update
    setColumns(prev => prev.map(col => {
      if (col.id === draggedDeal.status) {
        return { ...col, deals: col.deals.filter(d => d.id !== draggedDeal.id) };
      }
      if (col.id === targetStatus) {
        return { ...col, deals: [...col.deals, { ...draggedDeal, status: targetStatus }] };
      }
      return col;
    }));
    setDragOverColumn(null);

    // Update in database
    await supabase
      .from('deals')
      .update({ status: targetStatus })
      .eq('id', draggedDeal.id);
  };

  return (
    <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => (
        <div
          key={column.id}
          className={cn(
            "flex-shrink-0 w-72 flex flex-col rounded-xl transition-colors",
            dragOverColumn === column.id && "ring-2 ring-brand-300 bg-brand-50/30"
          )}
          onDragOver={(e) => handleDragOver(e, column.id)}
          onDragLeave={() => setDragOverColumn(null)}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          {/* Column header */}
          <div className="flex items-center justify-between px-3 py-3 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: column.color }} />
              <h3 className="font-semibold text-sm text-midnight-800">{column.title}</h3>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                {column.deals.length}
              </span>
            </div>
            <span className="text-xs text-gray-400 font-medium">
              {formatCurrency(column.deals.reduce((sum, d) => sum + Number(d.value), 0))}
            </span>
          </div>

          {/* Cards */}
          <div className="flex-1 space-y-2.5 min-h-[200px] px-1">
            {column.deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
            ))}

            {column.deals.length === 0 && (
              <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400">
                Drop deals here
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function DealCard({
  deal,
  onDragStart,
  onDragEnd,
}: {
  deal: Deal;
  onDragStart: (e: React.DragEvent, deal: Deal) => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      id={`deal-${deal.id}`}
      draggable
      onDragStart={(e) => onDragStart(e, deal)}
      onDragEnd={onDragEnd}
      className="bg-white border border-gray-100 rounded-xl p-4 shadow-card hover:shadow-card-hover transition-all cursor-grab active:cursor-grabbing group"
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <Link href={`/deals/${deal.id}`} className="font-semibold text-sm text-midnight-800 hover:text-brand-500 transition-colors line-clamp-1">
            {deal.title}
          </Link>
          {deal.brand && (
            <div className="flex items-center gap-1.5 mt-1">
              <Building2 className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500 truncate">{deal.brand.name}</span>
            </div>
          )}
        </div>
        <Link href={`/deals/${deal.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded">
          <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
        </Link>
      </div>

      {/* Value */}
      <div className="flex items-center gap-1.5 mb-3">
        <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
        <span className="font-bold text-sm text-midnight-800">{formatCurrency(Number(deal.value))}</span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        {deal.contact && (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-brand-100 rounded-full flex items-center justify-center">
              <span className="text-[10px] font-bold text-brand-600">{deal.contact.name[0]}</span>
            </div>
            <span className="text-xs text-gray-500 truncate max-w-[80px]">{deal.contact.name}</span>
          </div>
        )}
        {deal.delivery_deadline && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Calendar className="w-3 h-3" />
            {formatRelativeDate(deal.delivery_deadline)}
          </div>
        )}
        {deal.source === 'email' && (
          <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">Email</span>
        )}
      </div>
    </div>
  );
}
