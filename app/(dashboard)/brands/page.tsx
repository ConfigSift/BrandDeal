import { createServerSupabaseClient } from '@/lib/supabase/server';
import { BrandsClient } from '@/components/brands-client';

export default async function BrandsPage() {
  const supabase = createServerSupabaseClient();

  const { data: brands } = await supabase
    .from('brands')
    .select('*, contacts(*)')
    .order('name');

  // Count deals per brand
  const { data: dealCounts } = await supabase
    .from('deals')
    .select('brand_id, id')
    .not('brand_id', 'is', null);

  const brandDealCounts: Record<string, number> = {};
  dealCounts?.forEach(d => {
    brandDealCounts[d.brand_id] = (brandDealCounts[d.brand_id] || 0) + 1;
  });

  return <BrandsClient brands={brands || []} dealCounts={brandDealCounts} />;
}
