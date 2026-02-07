import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { InboxClient } from '@/components/inbox/inbox-client';

export default async function InboxPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const [
    { data: emails },
    { data: deals },
  ] = await Promise.all([
    supabase
      .from('emails')
      .select('*')
      .eq('user_id', user.id)
      .order('received_at', { ascending: false }),
    supabase
      .from('deals')
      .select('id, title, brand:brands(name)')
      .eq('user_id', user.id)
      .eq('archived', false)
      .order('created_at', { ascending: false }),
  ]);

  return (
    <InboxClient
      initialEmails={emails ?? []}
      existingDeals={(deals ?? []).map((d: any) => ({
        id: d.id,
        title: d.title,
        brandName: d.brand?.name || null,
      }))}
    />
  );
}
