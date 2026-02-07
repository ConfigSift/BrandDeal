'use client';

import { useCallback, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileSidebar } from '@/components/layout/mobile-sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { ShortcutsModal } from '@/components/layout/shortcuts-modal';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { usePanelManager } from '@/components/layout/panel-manager';
import type { User } from '@/types';

interface DashboardShellProps {
  user: User | null;
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);
  const { openPanel } = usePanelManager();

  useKeyboardShortcuts({
    onSearch: () => {
      const input = document.querySelector<HTMLInputElement>('[data-search-input]');
      input?.focus();
    },
    onNewDeal: () => {
      openPanel({ id: 'new-deal', type: 'new-deal', title: 'New Deal' });
    },
    onEscape: () => {
      // Close shortcuts modal if open
      if (showShortcuts) setShowShortcuts(false);
    },
  });

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      <Sidebar user={user} />
      <MobileSidebar isOpen={mobileMenuOpen} onClose={closeMobileMenu} user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar user={user} onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>

      {/* Keyboard shortcuts help button */}
      <button
        onClick={() => setShowShortcuts(true)}
        className="fixed bottom-6 left-6 z-40 w-8 h-8 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center text-gray-400 hover:text-brand-500 hover:border-brand-300 transition-colors text-sm font-mono"
        title="Keyboard shortcuts"
      >
        ?
      </button>

      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}
