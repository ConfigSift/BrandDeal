'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutGrid, Users, Building2, Receipt,
  Calendar, Settings, Zap, CreditCard, ChevronLeft
} from 'lucide-react';
import { useState } from 'react';
import type { User } from '@/types';

const NAV_ITEMS = [
  { href: '/pipeline', label: 'Pipeline', icon: LayoutGrid },
  { href: '/brands', label: 'Brands', icon: Building2 },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/invoices', label: 'Invoices', icon: Receipt },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
];

const BOTTOM_ITEMS = [
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ user }: { user: User | null }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      "hidden md:flex flex-col bg-white border-r border-gray-100 transition-all duration-300 relative",
      collapsed ? "w-[72px]" : "w-64"
    )}>
      {/* Logo */}
      <div className={cn("flex items-center gap-3 px-5 h-16 border-b border-gray-100", collapsed && "justify-center px-0")}>
        <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && <span className="font-display font-bold text-midnight-800 text-lg">BrandDeal</span>}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors z-10"
      >
        <ChevronLeft className={cn("w-3.5 h-3.5 text-gray-500 transition-transform", collapsed && "rotate-180")} />
      </button>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/pipeline' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-brand-50 text-brand-600"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
                collapsed && "justify-center px-0"
              )}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-brand-500" : "text-gray-400")} />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom nav */}
      <div className="py-4 px-3 border-t border-gray-100 space-y-1">
        {/* Subscription badge */}
        {!collapsed && user && (
          <div className="px-3 py-2.5 mb-2">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                {user.subscription_tier} plan
              </span>
            </div>
          </div>
        )}
        {BOTTOM_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive ? "bg-brand-50 text-brand-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
                collapsed && "justify-center px-0"
              )}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-brand-500" : "text-gray-400")} />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
