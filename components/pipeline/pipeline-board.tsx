'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DealStatus, Deal } from '@/types';
import { formatCurrency, formatRelativeDate, cn, DEAL_STAGES } from '@/lib/utils';
import { Building2, Calendar, DollarSign, ExternalLink } from 'lucide-react';
import { usePanelManager } from '@/components/layout/panel-manager';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  initialColumns: (typeof DEAL_STAGES[0] & { deals: Deal[] })[];
}

export function PipelineBoard({ initialColumns }: Props) {
  const [columns, setColumns] = useState(initialColumns);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [overColumnId, setOverColumnId] = useState<DealStatus | null>(null);
  const supabase = useMemo(() => createClient(), []);
  const { openPanel } = usePanelManager();

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  // --- Sensors ---
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor);

  // --- Find which column a deal belongs to ---
  const findColumn = useCallback((dealId: string) => {
    for (const col of columns) {
      if (col.deals.some(d => d.id === dealId)) return col.id;
    }
    return null;
  }, [columns]);

  // --- Drag handlers ---
  const handleDragStart = (event: DragStartEvent) => {
    const deal = event.active.data.current?.deal as Deal | undefined;
    if (deal) setActiveDeal(deal);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setOverColumnId(null);
      return;
    }

    // "over" can be a column droppable or a sortable deal card
    const overId = String(over.id);

    // Check if it's a column ID directly
    if (DEAL_STAGES.some(s => s.id === overId)) {
      setOverColumnId(overId as DealStatus);
      return;
    }

    // Otherwise it's a deal card — find its column
    const col = findColumn(overId);
    setOverColumnId(col);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);
    setOverColumnId(null);

    if (!over) return;

    const dealId = String(active.id);
    const deal = active.data.current?.deal as Deal;
    if (!deal) return;

    const sourceColumnId = deal.status;
    const overId = String(over.id);

    // Determine target column: either directly a column or find which column the over-deal is in
    let targetColumnId: DealStatus;
    if (DEAL_STAGES.some(s => s.id === overId)) {
      targetColumnId = overId as DealStatus;
    } else {
      const col = findColumn(overId);
      if (!col) return;
      targetColumnId = col;
    }

    // Same column — handle reorder
    if (sourceColumnId === targetColumnId) {
      // Only reorder if dropped on a different deal
      if (overId !== dealId && !DEAL_STAGES.some(s => s.id === overId)) {
        setColumns(prev => prev.map(col => {
          if (col.id !== sourceColumnId) return col;
          const oldIndex = col.deals.findIndex(d => d.id === dealId);
          const newIndex = col.deals.findIndex(d => d.id === overId);
          if (oldIndex === -1 || newIndex === -1) return col;
          const reordered = arrayMove(col.deals, oldIndex, newIndex);
          // Update sort_order in background
          reordered.forEach((d, i) => {
            supabase.from('deals').update({ sort_order: i }).eq('id', d.id);
          });
          return { ...col, deals: reordered };
        }));
      }
      return;
    }

    // Cross-column move — optimistic update
    setColumns(prev => prev.map(col => {
      if (col.id === sourceColumnId) {
        return { ...col, deals: col.deals.filter(d => d.id !== dealId) };
      }
      if (col.id === targetColumnId) {
        // If dropped on a specific deal, insert near it; otherwise append
        if (!DEAL_STAGES.some(s => s.id === overId)) {
          const overIndex = col.deals.findIndex(d => d.id === overId);
          if (overIndex !== -1) {
            const newDeals = [...col.deals];
            newDeals.splice(overIndex, 0, { ...deal, status: targetColumnId });
            return { ...col, deals: newDeals };
          }
        }
        return { ...col, deals: [...col.deals, { ...deal, status: targetColumnId }] };
      }
      return col;
    }));

    // Persist to DB
    await supabase
      .from('deals')
      .update({ status: targetColumnId })
      .eq('id', dealId);
  };

  const handleDragCancel = () => {
    setActiveDeal(null);
    setOverColumnId(null);
  };

  const handleOpenDeal = useCallback((deal: Deal) => {
    openPanel({
      id: `deal-${deal.id}`,
      type: 'deal-detail',
      title: deal.title || 'Deal',
      dealId: deal.id,
    });
  }, [openPanel]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            isOver={overColumnId === column.id}
            activeDealId={activeDeal?.id ?? null}
            onOpenDeal={handleOpenDeal}
          />
        ))}
      </div>

      {/* Drag overlay — floating card */}
      <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
        {activeDeal ? (
          <div className="rotate-2 shadow-xl">
            <DealCardContent deal={activeDeal} isOverlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// --- Column with droppable zone ---

function Column({
  column,
  isOver,
  activeDealId,
  onOpenDeal,
}: {
  column: typeof DEAL_STAGES[0] & { deals: Deal[] };
  isOver: boolean;
  activeDealId: string | null;
  onOpenDeal: (deal: Deal) => void;
}) {
  const { setNodeRef } = useDroppable({ id: column.id });
  const dealIds = useMemo(() => column.deals.map(d => d.id), [column.deals]);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 w-72 flex flex-col rounded-xl transition-colors",
        isOver && "ring-2 ring-brand-300 bg-brand-50/30"
      )}
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
      <SortableContext items={dealIds} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-2.5 min-h-[200px] px-1">
          {column.deals.map((deal) => (
            <SortableDealCard
              key={deal.id}
              deal={deal}
              onOpen={onOpenDeal}
              isDraggedAway={activeDealId === deal.id}
            />
          ))}

          {column.deals.length === 0 && (
            <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400">
              Drop deals here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// --- Sortable deal card wrapper ---

function SortableDealCard({
  deal,
  onOpen,
  isDraggedAway,
}: {
  deal: Deal;
  onOpen: (deal: Deal) => void;
  isDraggedAway: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: deal.id,
    data: { deal },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // While the overlay shows the floating card, the original shows a ghost placeholder
  if (isDraggedAway) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="border-2 border-dashed border-gray-200 rounded-xl p-4 opacity-40 bg-gray-50"
      >
        <DealCardContent deal={deal} isOverlay={false} />
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <DealCardContent
        deal={deal}
        isOverlay={false}
        dragListeners={listeners}
        onOpen={onOpen}
      />
    </div>
  );
}

// --- Pure visual card content ---

function DealCardContent({
  deal,
  isOverlay,
  dragListeners,
  onOpen,
}: {
  deal: Deal;
  isOverlay: boolean;
  dragListeners?: Record<string, Function>;
  onOpen?: (deal: Deal) => void;
}) {
  return (
    <div
      {...(dragListeners || {})}
      onClick={() => {
        if (onOpen) onOpen(deal);
      }}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onOpen) {
          e.preventDefault();
          onOpen(deal);
        }
      }}
      role="button"
      tabIndex={isOverlay ? -1 : 0}
      className={cn(
        "bg-white border border-gray-100 rounded-xl p-4 shadow-card transition-all group focus:outline-none focus:ring-2 focus:ring-brand-500/20",
        isOverlay
          ? "cursor-grabbing shadow-xl"
          : "hover:shadow-card-hover cursor-grab active:cursor-grabbing"
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-sm text-midnight-800 hover:text-brand-500 transition-colors line-clamp-1">
            {deal.title}
          </span>
          {deal.brand && (
            <div className="flex items-center gap-1.5 mt-1">
              <Building2 className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500 truncate">{deal.brand.name}</span>
            </div>
          )}
        </div>
        {!isOverlay && onOpen && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(deal);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
            aria-label={`Open ${deal.title}`}
          >
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
          </button>
        )}
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
