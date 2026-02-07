import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: {
    default: 'Brand Deal OS — Manage Your Creator Brand Partnerships',
    template: '%s | Brand Deal OS',
  },
  description: 'The all-in-one platform for creators to track brand deals, manage contracts, send invoices, and get paid on time.',
  keywords: ['creator tools', 'brand deals', 'influencer management', 'invoice generator', 'content creator'],
  openGraph: {
    title: 'Brand Deal OS',
    description: 'Stop losing money on brand deals.',
    url: 'https://branddealos.com',
    siteName: 'Brand Deal OS',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brand Deal OS',
    description: 'Stop losing money on brand deals.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
