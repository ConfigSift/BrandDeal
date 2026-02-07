'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Search, LogOut, Plus, Building2, User, FileText, Menu } from 'lucide-react';
import { NotificationDropdown } from '@/components/notifications/notification-dropdown';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { User as UserType } from '@/types';
import { usePanelManager } from '@/components/layout/panel-manager';

interface SearchResult {
  id: string;
  type: 'deal' | 'brand' | 'contact';
  title: string;
  subtitle?: string;
  href: string;
}

interface TopBarProps {
  user: UserType | null;
  onOpenMobileMenu?: () => void;
}

export function TopBar({ user, onOpenMobileMenu }: TopBarProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { openPanel } = usePanelManager();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const term = `%${query.trim()}%`;

      const [dealsRes, brandsRes, contactsRes] = await Promise.all([
        supabase
          .from('deals')
          .select('id, title, brand:brands(name)')
          .ilike('title', term)
          .limit(5),
        supabase
          .from('brands')
          .select('id, name')
          .ilike('name', term)
          .limit(5),
        supabase
          .from('contacts')
          .select('id, name, email')
          .or(`name.ilike.${term},email.ilike.${term}`)
          .limit(5),
      ]);

      const mapped: SearchResult[] = [
        ...(dealsRes.data ?? []).map((d: any) => ({
          id: d.id,
          type: 'deal' as const,
          title: d.title,
          subtitle: d.brand?.name,
          href: `/deals/${d.id}`,
        })),
        ...(brandsRes.data ?? []).map((b: any) => ({
          id: b.id,
          type: 'brand' as const,
          title: b.name,
          href: '/brands',
        })),
        ...(contactsRes.data ?? []).map((c: any) => ({
          id: c.id,
          type: 'contact' as const,
          title: c.name,
          subtitle: c.email,
          href: '/contacts',
        })),
      ];

      setResults(mapped);
      setShowResults(true);
      setSearching(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, supabase]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowResults(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const groupedResults = {
    deals: results.filter(r => r.type === 'deal'),
    brands: results.filter(r => r.type === 'brand'),
    contacts: results.filter(r => r.type === 'contact'),
  };

  const hasResults = results.length > 0;

  const typeIcon = {
    deal: FileText,
    brand: Building2,
    contact: User,
  };

  const typeLabel = {
    deal: 'Deals',
    brand: 'Brands',
    contact: 'Contacts',
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={onOpenMobileMenu}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors md:hidden flex-shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search — hidden on xs, shown sm+ */}
        <div className="relative w-80 hidden sm:block" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search deals, brands, contacts..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => { if (results.length > 0) setShowResults(true); }}
            className="w-full pl-10 pr-4 py-2 bg-surface-100 border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:bg-white outline-none transition-all"
          />

          {/* Search results dropdown */}
          {showResults && query.trim() && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2 max-h-80 overflow-y-auto">
              {searching && (
                <p className="px-4 py-3 text-sm text-gray-400">Searching...</p>
              )}
              {!searching && !hasResults && (
                <p className="px-4 py-3 text-sm text-gray-400">No results found</p>
              )}
              {!searching && hasResults && (
                <>
                  {(['deals', 'brands', 'contacts'] as const).map(group => {
                    const items = groupedResults[group];
                    if (items.length === 0) return null;
                    return (
                      <div key={group}>
                        <p className="px-4 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">
                          {typeLabel[items[0].type]}
                        </p>
                        {items.map(item => {
                          const ItemIcon = typeIcon[item.type];
                          return (
                            <Link
                              key={item.id}
                              href={item.href}
                              onClick={() => { setShowResults(false); setQuery(''); }}
                              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <ItemIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="font-medium truncate">{item.title}</p>
                                {item.subtitle && (
                                  <p className="text-xs text-gray-400 truncate">{item.subtitle}</p>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* New Deal button */}
        <button
          type="button"
          onClick={() => openPanel({ id: 'new-deal', type: 'new-deal', title: 'New Deal' })}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">+ New Deal</span>
        </button>

        {/* Notifications */}
        <NotificationDropdown />

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
