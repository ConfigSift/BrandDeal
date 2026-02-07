import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { PanelProvider } from '@/components/layout/panel-manager';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  const pathname = headers().get('x-pathname') || '';
  const isOnboarding = pathname.startsWith('/onboarding');

  // Redirect to onboarding if not completed (unless already there)
  if (profile && !profile.onboarding_completed && !isOnboarding) {
    redirect('/onboarding');
  }

  // Onboarding uses a minimal layout — no sidebar/topbar
  if (isOnboarding) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
        {children}
      </div>
    );
  }

  return (
    <PanelProvider>
      <DashboardShell user={profile}>
        {children}
      </DashboardShell>
    </PanelProvider>
  );
}
