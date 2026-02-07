'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastVariant = 'default' | 'success' | 'error' | 'warning';

type Toast = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  removing?: boolean;
};

const MAX_VISIBLE = 3;
const listeners = new Set<(toasts: Toast[]) => void>();
let memoryState: Toast[] = [];

function emit() {
  listeners.forEach((listener) => listener([...memoryState]));
}

function dismiss(id: string) {
  memoryState = memoryState.map((t) =>
    t.id === id ? { ...t, removing: true } : t
  );
  emit();
  setTimeout(() => {
    memoryState = memoryState.filter((t) => t.id !== id);
    emit();
  }, 200);
}

export function toast({
  title,
  description,
  variant = 'success',
  duration = 5000,
}: {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  memoryState = [...memoryState, { id, title, description, variant }];
  // Trim to max visible
  if (memoryState.length > MAX_VISIBLE) {
    memoryState = memoryState.slice(-MAX_VISIBLE);
  }
  emit();
  if (duration > 0) {
    window.setTimeout(() => dismiss(id), duration);
  }
}

const VARIANT_STYLES: Record<ToastVariant, { icon: typeof Info; border: string; iconColor: string }> = {
  default: { icon: Info, border: 'border-gray-200', iconColor: 'text-brand-500' },
  success: { icon: CheckCircle2, border: 'border-emerald-200', iconColor: 'text-emerald-500' },
  error: { icon: AlertCircle, border: 'border-red-200', iconColor: 'text-red-500' },
  warning: { icon: AlertTriangle, border: 'border-amber-200', iconColor: 'text-amber-500' },
};

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>(memoryState);

  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col-reverse gap-2">
      {toasts.map((toastItem) => {
        const config = VARIANT_STYLES[toastItem.variant];
        const Icon = config.icon;

        return (
          <div
            key={toastItem.id}
            className={cn(
              'min-w-[280px] max-w-[360px] rounded-xl border bg-white shadow-lg px-4 py-3 text-sm flex items-start gap-3 transition-all duration-200',
              config.border,
              toastItem.removing
                ? 'opacity-0 translate-x-4'
                : 'opacity-100 translate-x-0 animate-slide-in-right'
            )}
            role="status"
            aria-live="polite"
          >
            <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.iconColor)} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-midnight-800">{toastItem.title}</div>
              {toastItem.description && (
                <div className="text-xs text-gray-500 mt-0.5">{toastItem.description}</div>
              )}
            </div>
            <button
              onClick={() => dismiss(toastItem.id)}
              className="flex-shrink-0 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
