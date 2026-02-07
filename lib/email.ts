import { ServerClient } from 'postmark';

const FROM_EMAIL = 'notifications@branddealos.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.branddealos.com';

function getClient(): ServerClient | null {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  if (!token) {
    console.warn('POSTMARK_SERVER_TOKEN not configured — emails will not be sent');
    return null;
  }
  return new ServerClient(token);
}

interface SendEmailParams {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export async function sendEmail({ to, subject, htmlBody, textBody }: SendEmailParams): Promise<boolean> {
  const client = getClient();
  if (!client) return false;

  try {
    await client.sendEmail({
      From: FROM_EMAIL,
      To: to,
      Subject: subject,
      HtmlBody: htmlBody,
      TextBody: textBody || stripHtml(htmlBody),
      MessageStream: 'outbound',
    });
    return true;
  } catch (err) {
    console.error('Failed to send email:', err);
    return false;
  }
}

export interface DigestSection {
  title: string;
  emoji: string;
  items: DigestItem[];
}

export interface DigestItem {
  text: string;
  tag?: 'urgent' | 'overdue' | 'stale' | 'new' | 'info';
  href?: string;
}

export async function sendDigest(
  to: string,
  subject: string,
  sections: DigestSection[],
  userName?: string | null
): Promise<boolean> {
  const htmlBody = buildDigestHtml(subject, sections, userName);
  const textBody = buildDigestText(subject, sections, userName);
  return sendEmail({ to, subject, htmlBody, textBody });
}

// --- HTML Email Template ---

function buildDigestHtml(
  subject: string,
  sections: DigestSection[],
  userName?: string | null
): string {
  const greeting = userName ? `Hi ${userName},` : 'Hi there,';
  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const sectionHtml = sections
    .filter(s => s.items.length > 0)
    .map(section => {
      const itemRows = section.items.map(item => {
        const tagHtml = item.tag ? getTagHtml(item.tag) : '';
        const text = item.href
          ? `<a href="${APP_URL}${item.href}" style="color:#374151;text-decoration:none;">${escapeHtml(item.text)}</a>`
          : escapeHtml(item.text);
        return `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;line-height:1.5;">
            ${tagHtml}${text}
          </td>
        </tr>`;
      }).join('');

      return `
        <tr>
          <td style="padding:20px 0 8px 0;">
            <p style="margin:0;font-size:15px;font-weight:600;color:#1e293b;">
              ${section.emoji} ${escapeHtml(section.title)} (${section.items.length})
            </p>
          </td>
        </tr>
        ${itemRows}
      `;
    }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fa;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#6C5CE7;border-radius:10px;padding:10px 12px;">
                    <span style="color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:-0.5px;">B</span>
                  </td>
                  <td style="padding-left:10px;">
                    <span style="font-size:18px;font-weight:700;color:#1e293b;letter-spacing:-0.3px;">BrandDeal OS</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;border:1px solid #e5e7eb;">
                <tr>
                  <td style="padding:32px;">
                    <p style="margin:0 0 4px 0;font-size:15px;color:#374151;">${greeting}</p>
                    <p style="margin:0 0 24px 0;font-size:13px;color:#9ca3af;">${date}</p>
                    <!-- Sections -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      ${sectionHtml}
                    </table>
                    <!-- CTA Button -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:28px 0 0 0;" align="center">
                          <a href="${APP_URL}/pipeline" style="display:inline-block;background-color:#6C5CE7;color:#ffffff;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;">
                            View Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 0;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:12px;color:#9ca3af;">
                You're receiving this because you have email digests enabled.
              </p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                <a href="${APP_URL}/settings" style="color:#6C5CE7;text-decoration:underline;">Manage notification preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildDigestText(
  subject: string,
  sections: DigestSection[],
  userName?: string | null
): string {
  const greeting = userName ? `Hi ${userName},` : 'Hi there,';
  const lines = [greeting, ''];

  for (const section of sections) {
    if (section.items.length === 0) continue;
    lines.push(`${section.emoji} ${section.title} (${section.items.length})`);
    lines.push('---');
    for (const item of section.items) {
      const tag = item.tag ? `[${item.tag}] ` : '';
      lines.push(`- ${tag}${item.text}`);
    }
    lines.push('');
  }

  lines.push(`View Dashboard: ${APP_URL}/pipeline`);
  lines.push('');
  lines.push(`Manage preferences: ${APP_URL}/settings`);

  return lines.join('\n');
}

function getTagHtml(tag: string): string {
  const colors: Record<string, { bg: string; text: string }> = {
    urgent: { bg: '#fef3c7', text: '#92400e' },
    overdue: { bg: '#fee2e2', text: '#991b1b' },
    stale: { bg: '#f3f4f6', text: '#6b7280' },
    new: { bg: '#ede9fe', text: '#6C5CE7' },
    info: { bg: '#e0f2fe', text: '#0369a1' },
  };
  const c = colors[tag] || colors.info;
  return `<span style="display:inline-block;background-color:${c.bg};color:${c.text};font-size:10px;font-weight:600;text-transform:uppercase;padding:2px 6px;border-radius:4px;margin-right:6px;letter-spacing:0.5px;">${tag}</span>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}
