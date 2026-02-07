export interface ParsedEmail {
  brandName: string | null;
  contactName: string | null;
  budget: number | null;
  deliverables: ParsedDeliverable[];
  dates: ParsedDate[];
}

export interface ParsedDeliverable {
  platform: string;
  type: string | null;
}

export interface ParsedDate {
  label: string;
  date: string;
}

const PLATFORM_KEYWORDS: Record<string, string[]> = {
  youtube: ['youtube', 'yt', 'youtube video', 'youtube short'],
  instagram: ['instagram', 'ig', 'insta', 'instagram reel', 'instagram story', 'instagram post'],
  tiktok: ['tiktok', 'tik tok', 'tiktok video'],
  twitter: ['twitter', 'x.com', 'tweet'],
  blog: ['blog', 'blog post', 'article', 'written content'],
  newsletter: ['newsletter', 'email blast', 'email newsletter'],
  podcast: ['podcast', 'podcast episode', 'podcast mention'],
  snapchat: ['snapchat', 'snap'],
};

const CONTENT_TYPE_MAP: Record<string, string> = {
  video: 'video',
  reel: 'reel',
  reels: 'reel',
  story: 'story',
  stories: 'story',
  post: 'post',
  short: 'short',
  shorts: 'short',
  'blog post': 'blog_post',
  article: 'blog_post',
  mention: 'newsletter_mention',
  integration: 'podcast_integration',
};

export function parseEmail(
  fromEmail: string,
  fromName: string | null,
  subject: string | null,
  bodyText: string | null
): ParsedEmail {
  const text = [subject, bodyText].filter(Boolean).join('\n');
  const textLower = text.toLowerCase();

  return {
    brandName: extractBrandName(fromEmail, fromName, text),
    contactName: extractContactName(fromName, text),
    budget: extractBudget(text),
    deliverables: extractDeliverables(textLower),
    dates: extractDates(text),
  };
}

function extractBrandName(
  fromEmail: string,
  fromName: string | null,
  text: string
): string | null {
  // Try extracting from email domain (skip common providers)
  const commonDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'aol.com', 'icloud.com', 'mail.com', 'protonmail.com',
    'live.com', 'msn.com',
  ];
  const domain = fromEmail.split('@')[1]?.toLowerCase();
  if (domain && !commonDomains.includes(domain)) {
    // Capitalize domain name without TLD
    const domainName = domain.split('.')[0];
    const brandFromDomain = domainName.charAt(0).toUpperCase() + domainName.slice(1);
    return brandFromDomain;
  }

  // Try "on behalf of [Brand]" or "from [Brand]" patterns
  const behalfMatch = text.match(/(?:on behalf of|representing|from)\s+([A-Z][A-Za-z0-9\s&]+?)(?:\.|,|\n|$)/);
  if (behalfMatch) return behalfMatch[1].trim();

  // Fall back to sender name if it looks like a company
  if (fromName) {
    // If the name has "Team", "Inc", "LLC", etc., it's likely a brand
    if (/\b(team|inc|llc|ltd|co|corp|media|agency|group|studio|labs?)\b/i.test(fromName)) {
      return fromName.replace(/\b(team|inc\.?|llc|ltd\.?|co\.?|corp\.?)\b/gi, '').trim();
    }
  }

  return null;
}

function extractContactName(
  fromName: string | null,
  text: string
): string | null {
  if (fromName) {
    // Filter out obvious brand names (has Team, Inc, etc.)
    if (!/\b(team|inc|llc|ltd|co|corp|media|agency|group|studio|labs?)\b/i.test(fromName)) {
      return fromName;
    }
  }

  // Try signature-style patterns
  const sigMatch = text.match(/(?:best|thanks|regards|cheers|sincerely),?\s*\n\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  if (sigMatch) return sigMatch[1];

  return null;
}

function extractBudget(text: string): number | null {
  // Match patterns like $5,000 / $5000 / $5k / $5K / USD 5,000
  const patterns = [
    /\$\s?([\d,]+(?:\.\d{2})?)\s*(?:USD)?/g,
    /\$\s?([\d]+(?:\.\d{1,2})?)\s*[kK]/g,
    /(?:budget|rate|fee|compensation|payment|pay|offer(?:ing)?)\s*(?:of|is|:)?\s*\$?\s*([\d,]+(?:\.\d{2})?)/gi,
    /USD\s*([\d,]+(?:\.\d{2})?)/g,
  ];

  const amounts: number[] = [];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      let amountStr = match[1].replace(/,/g, '');
      let amount = parseFloat(amountStr);
      // Handle $5k = $5,000
      if (/[kK]/.test(match[0]) && amount < 1000) {
        amount *= 1000;
      }
      if (amount > 0 && amount < 10_000_000) {
        amounts.push(amount);
      }
    }
  }

  if (amounts.length === 0) return null;

  // Return the largest amount (likely the total budget)
  return Math.max(...amounts);
}

function extractDeliverables(textLower: string): ParsedDeliverable[] {
  const found: ParsedDeliverable[] = [];
  const seen = new Set<string>();

  for (const [platform, keywords] of Object.entries(PLATFORM_KEYWORDS)) {
    for (const keyword of keywords) {
      if (textLower.includes(keyword) && !seen.has(platform)) {
        seen.add(platform);

        // Try to find associated content type
        let contentType: string | null = null;
        for (const [typeKey, typeValue] of Object.entries(CONTENT_TYPE_MAP)) {
          // Look for "[type] on [platform]" or "[platform] [type]"
          const typePattern = new RegExp(
            `(?:${keyword}\\s+${typeKey}|${typeKey}\\s+(?:on\\s+)?${keyword})`,
            'i'
          );
          if (typePattern.test(textLower)) {
            contentType = typeValue;
            break;
          }
        }

        found.push({ platform, type: contentType });
      }
    }
  }

  return found;
}

function extractDates(text: string): ParsedDate[] {
  const dates: ParsedDate[] = [];

  // Match "by [date]", "deadline: [date]", "due [date]", "before [date]"
  const dateContextPatterns = [
    { pattern: /(?:deadline|due(?:\s+date)?|by|before|no later than)\s*:?\s*(\w+\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4})/gi, label: 'deadline' },
    { pattern: /(?:deadline|due(?:\s+date)?|by|before|no later than)\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/gi, label: 'deadline' },
    { pattern: /(?:launch|go(?:\s+live)?|publish|post)\s*(?:date|on)?\s*:?\s*(\w+\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4})/gi, label: 'launch' },
    { pattern: /(?:launch|go(?:\s+live)?|publish|post)\s*(?:date|on)?\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/gi, label: 'launch' },
  ];

  for (const { pattern, label } of dateContextPatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const parsed = new Date(match[1]);
      if (!isNaN(parsed.getTime())) {
        dates.push({ label, date: parsed.toISOString().split('T')[0] });
      }
    }
  }

  return dates;
}
