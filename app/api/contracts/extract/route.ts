import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const EXTRACTION_PROMPT = `You are an expert at reading influencer/creator brand deal contracts. Extract the following information from this contract and return ONLY valid JSON with no other text.

Contract text:
---
{CONTRACT_TEXT}
---

Return this exact JSON structure (use null for any field you cannot find):
{
  "payment": {
    "total_amount": null,
    "currency": "USD",
    "schedule": null,
    "method": null
  },
  "deliverables": [
    {
      "platform": "<tiktok|youtube|instagram|twitter|blog|podcast|other>",
      "content_type": "<video|post|story|reel|short|blog_post|other>",
      "quantity": 1,
      "description": "",
      "due_date": null
    }
  ],
  "usage_rights": {
    "duration": null,
    "exclusivity": false,
    "platforms": [],
    "paid_ads_allowed": false,
    "whitelisting_allowed": false
  },
  "approval": {
    "process": null,
    "timeline": null
  },
  "exclusivity": {
    "restricted_brands": null,
    "duration": null
  },
  "termination": {
    "notice_period": null,
    "kill_fee": null
  },
  "special_terms": {
    "performance_bonus": null,
    "affiliate_code": null,
    "discount_code": null,
    "notes": null
  },
  "dates": {
    "contract_start": null,
    "contract_end": null,
    "signing_deadline": null
  }
}`;

const PRO_MONTHLY_LIMIT = 50;

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile for subscription tier
    const { data: userProfile } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', authUser.id)
      .single();

    if (!userProfile || userProfile.subscription_tier === 'free') {
      return NextResponse.json(
        { error: 'AI extraction requires a Pro or Elite subscription' },
        { status: 403 }
      );
    }

    // Credit check for Pro users (Option A: count contracts this month)
    if (userProfile.subscription_tier === 'pro') {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

      const { count } = await supabase
        .from('contracts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', authUser.id)
        .neq('extraction_confidence', 'none')
        .gte('created_at', monthStart)
        .lt('created_at', monthEnd);

      if ((count ?? 0) >= PRO_MONTHLY_LIMIT) {
        return NextResponse.json(
          {
            error: `You've used ${count}/${PRO_MONTHLY_LIMIT} AI extractions this month. Upgrade to Elite for unlimited.`,
            limit_reached: true,
          },
          { status: 429 }
        );
      }
    }

    const { contract_id, file_url } = await request.json();

    if (!contract_id || !file_url) {
      return NextResponse.json({ error: 'Missing contract_id or file_url' }, { status: 400 });
    }

    // Download the PDF from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('deal-files')
      .download(file_url);

    if (downloadError || !fileData) {
      return NextResponse.json({ error: 'Failed to download PDF' }, { status: 500 });
    }

    // Extract text from PDF
    const buffer = Buffer.from(await fileData.arrayBuffer());
    const { PDFParse } = await import('pdf-parse');
    let pdfText: string;
    try {
      const parser = new PDFParse(buffer);
      const result = await parser.getText();
      pdfText = result.pages.map(p => p.text).join('\n');
    } catch {
      return NextResponse.json({ error: 'Failed to parse PDF' }, { status: 422 });
    }

    if (!pdfText.trim()) {
      // Update contract with no extraction
      await supabase
        .from('contracts')
        .update({ extraction_confidence: 'none', extracted_data: null })
        .eq('id', contract_id);

      return NextResponse.json({
        error: 'No text found in PDF (may be a scanned document)',
        extracted_data: null,
        confidence: 'none',
      });
    }

    // Truncate very long contracts to avoid token limits
    const maxChars = 30_000;
    const truncatedText = pdfText.length > maxChars
      ? pdfText.slice(0, maxChars) + '\n\n[... contract text truncated ...]'
      : pdfText;

    // Send to Claude API
    const prompt = EXTRACTION_PROMPT.replace('{CONTRACT_TEXT}', truncatedText);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    // Parse Claude's response
    const responseText = message.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('');

    let extractedData: any;
    let overallConfidence: string;

    try {
      // Try to parse JSON — Claude might wrap it in ```json blocks
      const jsonStr = responseText
        .replace(/^```(?:json)?\s*/m, '')
        .replace(/\s*```\s*$/m, '')
        .trim();
      extractedData = JSON.parse(jsonStr);
      overallConfidence = computeConfidence(extractedData);
    } catch {
      // JSON parsing failed — store raw text
      extractedData = { _raw: responseText };
      overallConfidence = 'low';
    }

    // Update the contracts row
    await supabase
      .from('contracts')
      .update({
        extracted_data: extractedData,
        extraction_confidence: overallConfidence,
      })
      .eq('id', contract_id);

    return NextResponse.json({
      extracted_data: extractedData,
      confidence: overallConfidence,
    });
  } catch (err) {
    console.error('Contract extraction error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

function computeConfidence(data: any): string {
  const keyFields = [
    data?.payment?.total_amount,
    data?.payment?.schedule,
    data?.deliverables?.length > 0 ? data.deliverables : null,
    data?.usage_rights?.duration,
    data?.usage_rights?.exclusivity !== undefined ? data.usage_rights.exclusivity : null,
    data?.dates?.contract_start,
    data?.dates?.contract_end,
    data?.approval?.process,
    data?.termination?.notice_period,
    data?.exclusivity?.duration,
  ];

  const total = keyFields.length;
  const filled = keyFields.filter(v => v !== null && v !== undefined).length;
  const ratio = filled / total;

  if (ratio > 0.7) return 'high';
  if (ratio >= 0.4) return 'medium';
  return 'low';
}
