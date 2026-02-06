'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Search, Bell, LogOut, Plus } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import type { User } from '@/types';

export function TopBar({ user }: { user: User | null }) {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
      {/* Search */}
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search deals, brands, contacts..."
          className="w-full pl-10 pr-4 py-2 bg-surface-100 border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:bg-white outline-none transition-all"
        />
      </div>

      <div className="flex items-center gap-3">
        {/* New Deal button */}
        <Link
          href="/deals/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          New Deal
        </Link>

        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 bg-brand-100 text-brand-600 rounded-lg flex items-center justify-center text-sm font-bold">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
            </div>
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2 animate-scale-in">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-semibold text-midnight-800">{user?.name || 'Creator'}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <Link href="/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowMenu(false)}>
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
