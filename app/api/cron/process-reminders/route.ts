import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  // Verify cron secret
  if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  try {
    // Step 1: Update overdue invoices
    await supabase.rpc('check_overdue_invoices');

    // Step 2: Fetch pending reminders (remind_at <= now, not sent, not dismissed)
    const { data: pending, error } = await supabase
      .from('pending_reminders')
      .select('*');

    if (error) {
      console.error('Failed to fetch pending reminders:', error);
      return NextResponse.json({ error: 'Query failed' }, { status: 500 });
    }

    if (!pending || pending.length === 0) {
      return NextResponse.json({ message: 'No pending reminders', processed: 0 });
    }

    // Step 3: Group by user_id
    const byUser: Record<string, typeof pending> = {};
    for (const reminder of pending) {
      if (!byUser[reminder.user_id]) byUser[reminder.user_id] = [];
      byUser[reminder.user_id].push(reminder);
    }

    // Step 4: Process each user's reminders
    let totalProcessed = 0;
    const userIds = Object.keys(byUser);

    for (const userId of userIds) {
      const reminders = byUser[userId];

      // Mark all as sent (they appear in-app regardless)
      const ids = reminders.map((r: any) => r.id);
      await supabase
        .from('reminders')
        .update({ sent: true, sent_at: new Date().toISOString() })
        .in('id', ids);

      totalProcessed += ids.length;
    }

    return NextResponse.json({
      message: 'Reminders processed',
      processed: totalProcessed,
      users: userIds.length,
    });
  } catch (err) {
    console.error('Process reminders cron error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
