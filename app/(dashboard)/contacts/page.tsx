import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ContactsClient } from '@/components/contacts-client';

export default async function ContactsPage() {
  const supabase = createServerSupabaseClient();
  const { data: contacts } = await supabase.from('contacts').select('*, brand:brands(*)').order('name');
  const { data: brands } = await supabase.from('brands').select('*').order('name');
  return <ContactsClient contacts={contacts || []} brands={brands || []} />;
}
