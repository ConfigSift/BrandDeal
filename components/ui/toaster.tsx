'use client';

import { useEffect, useState } from 'react';

type Toast = {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error';
};

const listeners = new Set<(toasts: Toast[]) => void>();
let memoryState: Toast[] = [];

function emit() {
  listeners.forEach((listener) => listener([...memoryState]));
}

export function toast({
  title,
  description,
  variant = 'success',
  duration = 3000,
}: {
  title: string;
  description?: string;
  variant?: Toast['variant'];
  duration?: number;
}) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  memoryState = [...memoryState, { id, title, description, variant }];
  emit();
  if (duration > 0) {
    window.setTimeout(() => {
      memoryState = memoryState.filter((toastItem) => toastItem.id !== id);
      emit();
    }, duration);
  }
}

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
    <div className="fixed bottom-6 right-6 z-[60] space-y-2">
      {toasts.map((toastItem) => (
        <div
          key={toastItem.id}
          className="min-w-[260px] max-w-[320px] rounded-xl border border-gray-100 bg-white shadow-lg px-4 py-3 text-sm"
          role="status"
          aria-live="polite"
        >
          <div className="font-semibold text-midnight-800">{toastItem.title}</div>
          {toastItem.description && (
            <div className="text-xs text-gray-500 mt-1">{toastItem.description}</div>
          )}
        </div>
      ))}
    </div>
  );
}
