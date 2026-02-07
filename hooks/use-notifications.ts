'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/toaster';
import type { ReminderType } from '@/types';

export interface Notification {
  id: string;
  user_id: string;
  deal_id: string | null;
  deliverable_id: string | null;
  invoice_id: string | null;
  reminder_type: ReminderType;
  title: string;
  message: string | null;
  remind_at: string;
  created_at: string;
}

const POLL_INTERVAL = 60_000; // 60 seconds
const TOAST_WINDOW = 5 * 60_000; // 5 minutes

export function useNotifications() {
  const supabase = useMemo(() => createClient(), []);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const knownIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  const fetchNotifications = useCallback(async () => {
    const { data } = await supabase
      .from('pending_reminders')
      .select('*')
      .order('remind_at', { ascending: false });

    if (!data) return;

    // Detect new reminders for toast (skip first load)
    if (!isFirstLoad.current) {
      const now = Date.now();
      for (const n of data) {
        if (!knownIds.current.has(n.id)) {
          const remindAt = new Date(n.remind_at).getTime();
          if (now - remindAt <= TOAST_WINDOW) {
            toast({
              title: n.title,
              description: n.deal_id ? 'Click the bell to view details' : undefined,
              variant: 'default',
              duration: 5000,
            });
          }
        }
      }
    }
    isFirstLoad.current = false;

    // Update known IDs
    knownIds.current = new Set(data.map((n: Notification) => n.id));
    setNotifications(data);
  }, [supabase]);

  // Initial fetch + polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const dismiss = useCallback(async (id: string) => {
    // Optimistic removal
    setNotifications(prev => prev.filter(n => n.id !== id));
    knownIds.current.delete(id);

    await supabase
      .from('reminders')
      .update({ dismissed: true, dismissed_at: new Date().toISOString() })
      .eq('id', id);
  }, [supabase]);

  const dismissAll = useCallback(async () => {
    const ids = notifications.map(n => n.id);
    setNotifications([]);
    knownIds.current.clear();

    await supabase
      .from('reminders')
      .update({ dismissed: true, dismissed_at: new Date().toISOString() })
      .in('id', ids);
  }, [supabase, notifications]);

  return {
    notifications,
    count: notifications.length,
    dismiss,
    dismissAll,
    refresh: fetchNotifications,
  };
}
