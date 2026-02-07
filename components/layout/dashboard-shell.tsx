'use client';

import { useCallback, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileSidebar } from '@/components/layout/mobile-sidebar';
import { TopBar } from '@/components/layout/top-bar';
import type { User } from '@/types';

interface DashboardShellProps {
  user: User | null;
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

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
    </div>
  );
}
