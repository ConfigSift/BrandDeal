import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendDigest, type DigestSection, type DigestItem } from '@/lib/email';

interface NotificationPreferences {
  deliverables: boolean;
  invoices: boolean;
  stale_leads: boolean;
  inbox: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  deliverables: true,
  invoices: true,
  stale_leads: true,
  inbox: true,
};

export async function GET(request: NextRequest) {
  if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  const isMonday = now.getUTCDay() === 1;

  try {
    // Fetch users who want digests
    // Daily users always get one. Weekly users only on Mondays.
    const frequencyFilter = isMonday ? ['daily', 'weekly'] : ['daily'];

    const { data: users } = await supabase
      .from('users')
      .select('id, email, name, reminder_email_frequency, notification_preferences')
      .in('reminder_email_frequency', frequencyFilter);

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users eligible for digest', sent: 0 });
    }

    let sent = 0;
    let skipped = 0;

    for (const user of users) {
      const prefs: NotificationPreferences = {
        ...DEFAULT_PREFS,
        ...(user.notification_preferences as NotificationPreferences || {}),
      };

      const isWeekly = user.reminder_email_frequency === 'weekly';
      const lookbackMs = isWeekly ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      const since = new Date(Date.now() - lookbackMs).toISOString();

      const sections: DigestSection[] = [];

      // --- Action Items (recent reminders) ---
      const { data: recentReminders } = await supabase
        .from('reminders')
        .select('*, deal:deals(title, brand:brands(name))')
        .eq('user_id', user.id)
        .eq('dismissed', false)
        .gte('sent_at', since)
        .order('remind_at', { ascending: false })
        .limit(20);

      if (recentReminders && recentReminders.length > 0) {
        const actionItems: DigestItem[] = [];

        for (const r of recentReminders) {
          // Apply notification preference filters
          if (r.reminder_type === 'deliverable_due' && !prefs.deliverables) continue;
          if ((r.reminder_type === 'invoice_overdue' || r.reminder_type === 'payment_due') && !prefs.invoices) continue;
          if ((r.reminder_type === 'stale_lead' || r.reminder_type === 'follow_up') && !prefs.stale_leads) continue;

          const tag = getTagForReminderType(r.reminder_type);
          const href = r.deal_id ? `/deals/${r.deal_id}` : '/pipeline';
          actionItems.push({ text: r.title, tag, href });
        }

        if (actionItems.length > 0) {
          sections.push({ title: 'Action Items', emoji: '\uD83D\uDD14', items: actionItems });
        }
      }

      // --- Upcoming Deliverables (next 7 days) ---
      if (prefs.deliverables) {
        const sevenDaysOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const { data: upcomingDels } = await supabase
          .from('deliverables')
          .select('title, due_date, platform, deal:deals(title, brand:brands(name))')
          .eq('user_id', user.id)
          .in('status', ['not_started', 'in_progress', 'submitted'])
          .not('due_date', 'is', null)
          .lte('due_date', sevenDaysOut)
          .gte('due_date', new Date().toISOString().split('T')[0])
          .order('due_date')
          .limit(10);

        if (upcomingDels && upcomingDels.length > 0) {
          const delItems: DigestItem[] = upcomingDels.map(d => {
            const brandName = (d.deal as any)?.brand?.name || '';
            const dueStr = d.due_date
              ? new Date(d.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : '';
            const forBrand = brandName ? ` for ${brandName}` : '';
            return {
              text: `${d.title}${forBrand} — due ${dueStr}`,
              tag: 'info' as const,
              href: undefined,
            };
          });

          sections.push({ title: 'Upcoming Deliverables', emoji: '\uD83D\uDCE6', items: delItems });
        }
      }

      // --- Payment Status ---
      if (prefs.invoices) {
        const { data: pendingInvoices } = await supabase
          .from('invoices')
          .select('amount, status, invoice_number')
          .eq('user_id', user.id)
          .in('status', ['sent', 'overdue']);

        if (pendingInvoices && pendingInvoices.length > 0) {
          const paymentItems: DigestItem[] = [];

          const sentInvoices = pendingInvoices.filter(i => i.status === 'sent');
          const overdueInvoices = pendingInvoices.filter(i => i.status === 'overdue');

          if (sentInvoices.length > 0) {
            const total = sentInvoices.reduce((sum, i) => sum + Number(i.amount), 0);
            paymentItems.push({
              text: `$${total.toLocaleString()} pending across ${sentInvoices.length} invoice(s)`,
              tag: 'info',
              href: '/invoices',
            });
          }

          if (overdueInvoices.length > 0) {
            const total = overdueInvoices.reduce((sum, i) => sum + Number(i.amount), 0);
            paymentItems.push({
              text: `$${total.toLocaleString()} overdue (${overdueInvoices.length} invoice(s))`,
              tag: 'overdue',
              href: '/invoices',
            });
          }

          if (paymentItems.length > 0) {
            sections.push({ title: 'Payment Status', emoji: '\uD83D\uDCB0', items: paymentItems });
          }
        }
      }

      // --- Inbox ---
      if (prefs.inbox) {
        const { count: unprocessedEmails } = await supabase
          .from('emails')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('processed', false);

        if (unprocessedEmails && unprocessedEmails > 0) {
          sections.push({
            title: 'Inbox',
            emoji: '\uD83D\uDCEC',
            items: [{
              text: `${unprocessedEmails} new brand email(s) to review`,
              tag: 'new',
              href: '/inbox',
            }],
          });
        }
      }

      // Skip if nothing to report
      if (sections.length === 0) {
        skipped++;
        continue;
      }

      // Build and send digest
      const periodLabel = isWeekly ? 'Weekly' : 'Daily';
      const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const subject = `Your Brand Deal OS ${periodLabel} Digest — ${dateStr}`;

      const success = await sendDigest(user.email, subject, sections, user.name);
      if (success) sent++;
    }

    return NextResponse.json({
      message: 'Digest cron complete',
      eligible_users: users.length,
      sent,
      skipped,
    });
  } catch (err) {
    console.error('Send digest cron error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

function getTagForReminderType(type: string): DigestItem['tag'] {
  switch (type) {
    case 'deliverable_due': return 'urgent';
    case 'invoice_overdue': return 'overdue';
    case 'payment_due': return 'urgent';
    case 'stale_lead': return 'stale';
    case 'follow_up': return 'stale';
    default: return 'info';
  }
}
