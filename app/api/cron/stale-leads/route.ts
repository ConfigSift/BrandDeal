import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  try {
    let created = 0;

    // --- Stale leads: in 'lead' stage for 7+ days with no activity ---
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: staleLeads } = await supabase
      .from('deals')
      .select('id, title, user_id, updated_at, brand:brands(name)')
      .eq('status', 'lead')
      .eq('archived', false)
      .lt('updated_at', sevenDaysAgo);

    if (staleLeads && staleLeads.length > 0) {
      for (const deal of staleLeads) {
        // Check if a stale_lead reminder already exists for this deal (not dismissed)
        const { data: existing } = await supabase
          .from('reminders')
          .select('id')
          .eq('deal_id', deal.id)
          .eq('reminder_type', 'stale_lead')
          .eq('dismissed', false)
          .limit(1);

        if (existing && existing.length > 0) continue;

        const daysSinceUpdate = Math.floor(
          (Date.now() - new Date(deal.updated_at).getTime()) / (24 * 60 * 60 * 1000)
        );
        const brandName = (deal.brand as any)?.name || 'this brand';

        await supabase.from('reminders').insert({
          user_id: deal.user_id,
          deal_id: deal.id,
          reminder_type: 'stale_lead',
          title: `Follow up with ${brandName}?`,
          message: `Your deal "${deal.title}" has been in the Lead stage for ${daysSinceUpdate} days with no activity.`,
          remind_at: new Date().toISOString(),
          sent: false,
          dismissed: false,
        });

        created++;
      }
    }

    // --- Stuck negotiations: in 'negotiating' for 14+ days ---
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const { data: stuckDeals } = await supabase
      .from('deals')
      .select('id, title, user_id, updated_at, brand:brands(name)')
      .eq('status', 'negotiating')
      .eq('archived', false)
      .lt('updated_at', fourteenDaysAgo);

    if (stuckDeals && stuckDeals.length > 0) {
      for (const deal of stuckDeals) {
        const { data: existing } = await supabase
          .from('reminders')
          .select('id')
          .eq('deal_id', deal.id)
          .eq('reminder_type', 'follow_up')
          .eq('dismissed', false)
          .limit(1);

        if (existing && existing.length > 0) continue;

        const daysSinceUpdate = Math.floor(
          (Date.now() - new Date(deal.updated_at).getTime()) / (24 * 60 * 60 * 1000)
        );
        const brandName = (deal.brand as any)?.name || 'this brand';

        await supabase.from('reminders').insert({
          user_id: deal.user_id,
          deal_id: deal.id,
          reminder_type: 'follow_up',
          title: `Negotiation stalled with ${brandName}`,
          message: `Your deal "${deal.title}" has been in Negotiating for ${daysSinceUpdate} days. Time to follow up?`,
          remind_at: new Date().toISOString(),
          sent: false,
          dismissed: false,
        });

        created++;
      }
    }

    return NextResponse.json({
      message: 'Stale lead check complete',
      reminders_created: created,
      stale_leads_found: staleLeads?.length || 0,
      stuck_negotiations_found: stuckDeals?.length || 0,
    });
  } catch (err) {
    console.error('Stale leads cron error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
