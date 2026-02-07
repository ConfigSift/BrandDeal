import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseEmail } from '@/lib/email-parser';

// Postmark inbound webhook payload (simplified)
interface PostmarkInbound {
  FromFull: { Email: string; Name: string };
  ToFull: Array<{ Email: string; Name: string }>;
  CcFull?: Array<{ Email: string; Name: string }>;
  Subject: string;
  TextBody: string;
  HtmlBody: string;
  OriginalRecipient: string;
  Attachments?: Array<{
    Name: string;
    Content: string; // base64
    ContentType: string;
    ContentLength: number;
  }>;
  Date: string;
  MessageID: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PostmarkInbound = await request.json();

    const supabase = createAdminClient();

    // Determine the forwarding address this was sent to
    const toAddress =
      body.OriginalRecipient ||
      body.ToFull?.[0]?.Email ||
      '';

    if (!toAddress) {
      return NextResponse.json({ error: 'No recipient' }, { status: 400 });
    }

    // Look up user by forwarding_address
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('forwarding_address', toAddress.toLowerCase())
      .single();

    if (userError || !user) {
      // Unknown forwarding address — silently accept to avoid webhook retries
      return NextResponse.json({ message: 'No matching user' }, { status: 200 });
    }

    // Parse the email for structured data
    const parsed = parseEmail(
      body.FromFull.Email,
      body.FromFull.Name || null,
      body.Subject || null,
      body.TextBody || null
    );

    // Upload attachments to Supabase Storage
    const attachments: Array<{
      filename: string;
      url: string;
      size: number;
      mime_type: string;
    }> = [];

    if (body.Attachments && body.Attachments.length > 0) {
      for (const att of body.Attachments) {
        const buffer = Buffer.from(att.Content, 'base64');
        const filePath = `${user.id}/emails/${Date.now()}-${att.Name}`;

        const { error: uploadError } = await supabase.storage
          .from('email-attachments')
          .upload(filePath, buffer, {
            contentType: att.ContentType,
            upsert: false,
          });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('email-attachments')
            .getPublicUrl(filePath);

          attachments.push({
            filename: att.Name,
            url: urlData.publicUrl,
            size: att.ContentLength,
            mime_type: att.ContentType,
          });
        }
      }
    }

    // Insert into emails table
    const { error: insertError } = await supabase.from('emails').insert({
      user_id: user.id,
      from_email: body.FromFull.Email,
      from_name: body.FromFull.Name || null,
      subject: body.Subject || null,
      body_text: body.TextBody || null,
      body_html: body.HtmlBody || null,
      attachments,
      parsed_brand_name: parsed.brandName,
      parsed_contact_name: parsed.contactName,
      parsed_budget: parsed.budget,
      parsed_deliverables: parsed.deliverables.length > 0 ? parsed.deliverables : null,
      parsed_dates: parsed.dates.length > 0 ? parsed.dates : null,
      processed: false,
      linked_to_deal: false,
      received_at: body.Date || new Date().toISOString(),
    });

    if (insertError) {
      console.error('Failed to insert email:', insertError);
      return NextResponse.json({ error: 'Insert failed' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Email received' }, { status: 200 });
  } catch (err) {
    console.error('Inbound email webhook error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
