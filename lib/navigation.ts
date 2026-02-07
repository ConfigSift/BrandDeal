import {
  LayoutGrid, Users, Building2, Receipt, DollarSign,
  Calendar, Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/pipeline', label: 'Pipeline', icon: LayoutGrid },
  { href: '/brands', label: 'Brands', icon: Building2 },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/invoices', label: 'Invoices', icon: Receipt },
  { href: '/money', label: 'Money', icon: DollarSign },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
];

export const BOTTOM_ITEMS: NavItem[] = [
  { href: '/settings', label: 'Settings', icon: Settings },
];
