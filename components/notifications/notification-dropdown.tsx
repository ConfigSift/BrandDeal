'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications, type Notification } from '@/hooks/use-notifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell, Package, Receipt, MessageCircle, AlertCircle,
  CheckCircle2, X,
} from 'lucide-react';
import type { ReminderType } from '@/types';

const TYPE_CONFIG: Record<ReminderType, {
  icon: typeof Bell;
  color: string;
  accent: string;
}> = {
  deliverable_due: {
    icon: Package,
    color: 'text-amber-600',
    accent: 'bg-amber-50',
  },
  payment_due: {
    icon: Receipt,
    color: 'text-red-600',
    accent: 'bg-red-50',
  },
  invoice_overdue: {
    icon: Receipt,
    color: 'text-red-600',
    accent: 'bg-red-50',
  },
  follow_up: {
    icon: MessageCircle,
    color: 'text-blue-600',
    accent: 'bg-blue-50',
  },
  stale_lead: {
    icon: AlertCircle,
    color: 'text-gray-500',
    accent: 'bg-gray-50',
  },
};

export function NotificationDropdown() {
  const { notifications, count, dismiss, dismissAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const handleNotificationClick = (n: Notification) => {
    dismiss(n.id);
    setOpen(false);
    if (n.deal_id) {
      router.push(`/deals/${n.deal_id}`);
    }
  };

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dismiss(id);
  };

  const handleMarkAllRead = () => {
    dismissAll();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button with badge */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Mobile: backdrop */}
          <div className="fixed inset-0 z-40 sm:hidden" onClick={() => setOpen(false)} />

          <div className={cn(
            "absolute top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden",
            // Desktop: fixed width, right-aligned
            "hidden sm:block right-0 w-96",
          )}>
            <DropdownContent
              notifications={notifications}
              onClickNotification={handleNotificationClick}
              onDismiss={handleDismiss}
              onMarkAllRead={handleMarkAllRead}
            />
          </div>

          {/* Mobile: full-width panel */}
          <div className={cn(
            "fixed left-2 right-2 top-16 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden",
            "sm:hidden",
          )}>
            <DropdownContent
              notifications={notifications}
              onClickNotification={handleNotificationClick}
              onDismiss={handleDismiss}
              onMarkAllRead={handleMarkAllRead}
            />
          </div>
        </>
      )}
    </div>
  );
}

function DropdownContent({
  notifications,
  onClickNotification,
  onDismiss,
  onMarkAllRead,
}: {
  notifications: Notification[];
  onClickNotification: (n: Notification) => void;
  onDismiss: (e: React.MouseEvent, id: string) => void;
  onMarkAllRead: () => void;
}) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="font-display font-semibold text-sm text-midnight-800">Notifications</h3>
        {notifications.length > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-xs text-brand-500 hover:text-brand-600 font-medium transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="font-body text-sm text-gray-500">All caught up!</p>
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onClick={() => onClickNotification(n)}
              onDismiss={(e) => onDismiss(e, n.id)}
            />
          ))
        )}
      </div>
    </>
  );
}

function NotificationItem({
  notification,
  onClick,
  onDismiss,
}: {
  notification: Notification;
  onClick: () => void;
  onDismiss: (e: React.MouseEvent) => void;
}) {
  const config = TYPE_CONFIG[notification.reminder_type] || TYPE_CONFIG.follow_up;
  const Icon = config.icon;

  let timeAgo: string;
  try {
    timeAgo = formatDistanceToNow(new Date(notification.remind_at), { addSuffix: true });
  } catch {
    timeAgo = '';
  }

  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-b-0 group"
    >
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", config.accent)}>
        <Icon className={cn("w-4 h-4", config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-midnight-800 line-clamp-1">{notification.title}</p>
        {notification.message && (
          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{notification.message}</p>
        )}
        <p className="text-[11px] text-gray-400 mt-1">{timeAgo}</p>
      </div>
      <button
        onClick={onDismiss}
        className="p-1 text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 mt-0.5"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </button>
  );
}
