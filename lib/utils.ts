import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DealStatus, DeliverableStatus, InvoiceStatus, DeliverablePlatform, ContentType } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatRelativeDate(date: string | null): string {
  if (!date) return '—';
  const now = new Date();
  const target = new Date(date);
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < -1) return `${Math.abs(diffDays)} days overdue`;
  if (diffDays === -1) return 'Yesterday';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return `${diffDays} days`;
  if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks`;
  return formatDate(date);
}

export const DEAL_STAGES: { id: DealStatus; title: string; color: string; bgColor: string }[] = [
  { id: 'lead', title: 'Lead', color: '#FFB84D', bgColor: 'bg-amber-50' },
  { id: 'negotiating', title: 'Negotiating', color: '#6C5CE7', bgColor: 'bg-brand-50' },
  { id: 'signed', title: 'Signed', color: '#00B894', bgColor: 'bg-emerald-50' },
  { id: 'delivered', title: 'Delivered', color: '#0984E3', bgColor: 'bg-blue-50' },
  { id: 'paid', title: 'Paid', color: '#00CEC9', bgColor: 'bg-teal-50' },
];

export const DELIVERABLE_STATUS_CONFIG: Record<DeliverableStatus, { label: string; color: string }> = {
  not_started: { label: 'Not Started', color: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  submitted: { label: 'Submitted', color: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700' },
  published: { label: 'Published', color: 'bg-teal-100 text-teal-700' },
};

export const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700' },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700' },
  paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700' },
};

export const PLATFORM_CONFIG: Record<DeliverablePlatform, { label: string; emoji: string }> = {
  tiktok: { label: 'TikTok', emoji: '🎵' },
  youtube: { label: 'YouTube', emoji: '📺' },
  instagram: { label: 'Instagram', emoji: '📸' },
  twitter: { label: 'Twitter/X', emoji: '🐦' },
  blog: { label: 'Blog', emoji: '📝' },
  newsletter: { label: 'Newsletter', emoji: '📧' },
  podcast: { label: 'Podcast', emoji: '🎙️' },
  snapchat: { label: 'Snapchat', emoji: '👻' },
  other: { label: 'Other', emoji: '📌' },
};

export const CONTENT_TYPE_CONFIG: Record<ContentType, { label: string }> = {
  video: { label: 'Video' },
  post: { label: 'Post' },
  story: { label: 'Story' },
  reel: { label: 'Reel' },
  short: { label: 'Short' },
  blog_post: { label: 'Blog Post' },
  newsletter_mention: { label: 'Newsletter Mention' },
  podcast_integration: { label: 'Podcast Integration' },
  event_appearance: { label: 'Event Appearance' },
  custom: { label: 'Custom' },
};

export function getStageConfig(status: DealStatus) {
  return DEAL_STAGES.find(s => s.id === status)!;
}
