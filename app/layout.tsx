import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'Brand Deal OS — Manage Your Creator Partnerships',
  description: 'The operating system for creator brand partnerships. Track deals, manage contracts, get paid on time.',
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
