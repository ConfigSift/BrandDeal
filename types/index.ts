export type DealStatus = 'lead' | 'negotiating' | 'signed' | 'delivered' | 'paid';
export type DealSource = 'email' | 'manual' | 'import';
export type DeliverablePlatform = 'tiktok' | 'youtube' | 'instagram' | 'twitter' | 'blog' | 'newsletter' | 'podcast' | 'snapchat' | 'other';
export type ContentType = 'video' | 'post' | 'story' | 'reel' | 'short' | 'blog_post' | 'newsletter_mention' | 'podcast_integration' | 'event_appearance' | 'custom';
export type DeliverableStatus = 'not_started' | 'in_progress' | 'submitted' | 'approved' | 'published';
export type InvoiceStatus = 'draft' | 'sent' | 'overdue' | 'paid';
export type ReminderType = 'deliverable_due' | 'invoice_overdue' | 'follow_up' | 'stale_lead' | 'payment_due';
export type SubscriptionTier = 'free' | 'pro' | 'elite';

export interface NotificationPreferences {
  deliverables: boolean;
  invoices: boolean;
  stale_leads: boolean;
  inbox: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  subscription_tier: SubscriptionTier;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  creator_niche: string | null;
  website_url: string | null;
  instagram_handle: string | null;
  youtube_handle: string | null;
  tiktok_handle: string | null;
  twitter_handle: string | null;
  forwarding_address: string | null;
  timezone: string;
  reminder_email_frequency: string;
  notification_preferences: NotificationPreferences | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  user_id: string;
  name: string;
  website: string | null;
  logo_url: string | null;
  industry: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  brand_id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  brand?: Brand;
}

export interface Deal {
  id: string;
  user_id: string;
  brand_id: string | null;
  contact_id: string | null;
  title: string;
  status: DealStatus;
  value: number;
  currency: string;
  source: DealSource;
  signed_date: string | null;
  delivery_deadline: string | null;
  next_action: string | null;
  next_action_date: string | null;
  notes: string | null;
  sort_order: number;
  archived: boolean;
  status_changed_at: string;
  created_at: string;
  updated_at: string;
  // Joined
  brand?: Brand;
  contact?: Contact;
  deliverables?: Deliverable[];
  invoices?: Invoice[];
}

export interface Deliverable {
  id: string;
  deal_id: string;
  user_id: string;
  title: string;
  platform: DeliverablePlatform;
  content_type: ContentType;
  due_date: string | null;
  status: DeliverableStatus;
  published_url: string | null;
  proof_file_url: string | null;
  completed_at: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  deal_id: string;
  user_id: string;
  file_url: string;
  file_name: string | null;
  file_size: number | null;
  extracted_data: Record<string, any> | null;
  extraction_confidence: string;
  reviewed: boolean;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  deal_id: string;
  user_id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  sent_date: string | null;
  due_date: string | null;
  pdf_url: string | null;
  template_id: string;
  custom_notes: string | null;
  line_items: Array<{ description: string; amount: number }>;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  user_id: string;
  amount: number;
  paid_date: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
}

export interface FileRecord {
  id: string;
  deal_id: string;
  user_id: string;
  file_url: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_at: string;
}

export interface Email {
  id: string;
  user_id: string;
  deal_id: string | null;
  from_email: string;
  from_name: string | null;
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  attachments: Array<{ filename: string; url: string; size: number; mime_type: string }>;
  parsed_brand_name: string | null;
  parsed_contact_name: string | null;
  parsed_budget: number | null;
  parsed_deliverables: any | null;
  parsed_dates: any | null;
  processed: boolean;
  linked_to_deal: boolean;
  received_at: string;
  created_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  deal_id: string | null;
  deliverable_id: string | null;
  invoice_id: string | null;
  reminder_type: ReminderType;
  title: string;
  message: string | null;
  remind_at: string;
  sent: boolean;
  sent_at: string | null;
  dismissed: boolean;
  dismissed_at: string | null;
  created_at: string;
}

// Dashboard stats
export interface DealStats {
  total_deals: number;
  active_deals: number;
  pipeline_value: number;
  pending_payments: number;
  overdue_payments: number;
  avg_deal_value: number;
}

// Pipeline column
export interface PipelineColumn {
  id: DealStatus;
  title: string;
  color: string;
  deals: Deal[];
}
