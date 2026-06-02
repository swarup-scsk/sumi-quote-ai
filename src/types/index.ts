// ─────────────────────────────────────────────────────────────────────────────
// types.ts — Shared TypeScript interfaces for Sales & Quoting AI
// These mirror the N8N payload contracts exactly.
// Paste this file into Lovable as src/types/index.ts
// ─────────────────────────────────────────────────────────────────────────────

// ── Confidence status per field ───────────────────────────────────────────────
export type FieldStatus = "auto" | "review" | "blank";
// auto   → confidence ≥ 0.80 — green, pre-populated
// review → confidence 0.40–0.79 — amber, flagged for rep
// blank  → confidence < 0.40 — red, rep must fill in

// ── Spec Card (returned by N8N Workflow 1 after PDF extraction) ───────────────
export interface SpecCard {
  rfq_id: string;
  customer_name: string;
  email_from: string;
  subject: string;
  filename: string;
  received_at: string;       // ISO 8601
  extracted_at: string;      // ISO 8601
  status: "pending_review" | "confirmed" | "quote_generated" | "quote_shared";

  // Extracted spec fields + confidence scores
  grade: string | null;
  grade_confidence: number;

  thickness_mm: number | null;
  thickness_confidence: number;

  thickness_tolerance: string | null;
  thickness_tolerance_confidence: number;

  width_mm: number | null;
  width_confidence: number;

  coating: string | null;
  coating_confidence: number;

  quantity_tonnes: number | null;
  quantity_confidence: number;

  standard: string | null;
  standard_confidence: number;

  processing_requirements: string[];
  processing_confidence: number;

  surface_finish: string | null;
  surface_finish_confidence: number;

  delivery_format: string | null;
  delivery_format_confidence: number;

  notes: string | null;
  extraction_warnings: string[];

  // Summary
  field_status: Record<string, FieldStatus>;
  flagged_field_count: number;
  overall_confidence: number;    // 0.0–1.0
  review_required: boolean;
}

// ── Confirmed Spec (sent by Lovable → N8N Workflow 2) ─────────────────────────
export interface ConfirmedSpec {
  rfq_id: string;
  customer_name: string;
  customer_tier: CustomerTier;
  grade: string;
  thickness_mm: number;
  thickness_tolerance: string;
  width_mm: number;
  coating: string;
  quantity_tonnes: number;
  standard: string;
  processing_requirements: string[];
  delivery_format: string;
  confirmed_by: string;          // user id / name
  confirmed_at: string;          // ISO 8601
}

// ── Pricing Breakdown ─────────────────────────────────────────────────────────
export interface PricingBreakdown {
  hrc_base_per_tonne: number;
  grade_premium_per_tonne: number;
  coating_per_tonne: number;
  processing_per_tonne: number;
  handling_per_tonne: number;
  total_unit_cost: number;
  quantity_tonnes: number;
  quote_value_eur: number;
}

// ── Margin Info ───────────────────────────────────────────────────────────────
export interface MarginInfo {
  gross_margin_pct: number;     // e.g. 15.0
  margin_floor_pct: number;     // e.g. 10
  margin_ok: boolean;
  auto_approved: boolean;
  approval_status: "auto_approved" | "requires_manager_approval";
  approval_reason: string | null;
}

// ── Inventory Info ────────────────────────────────────────────────────────────
export interface InventoryInfo {
  key: string;
  available: boolean;
  tonnes: number;
  location: string;
}

// ── Quote (returned by N8N Workflow 2) ────────────────────────────────────────
export interface Quote {
  rfq_id: string;
  quote_id: string;
  customer_name: string;
  customer_tier: CustomerTier;
  generated_at: string;          // ISO 8601
  valid_until: string;           // YYYY-MM-DD
  payment_terms: string;         // e.g. "60 days"
  status: "approved" | "pending_approval";
  approval_message: string;

  spec: {
    grade: string;
    thickness_mm: number;
    thickness_tolerance: string;
    width_mm: number;
    coating: string;
    quantity_tonnes: number;
    standard: string;
    processing_requirements: string[];
    delivery_format: string;
  };

  inventory: InventoryInfo;
  pricing_breakdown: PricingBreakdown;
  margin: MarginInfo;
}

// ── Audit Event (sent by Lovable → N8N Workflow 3) ───────────────────────────
export type AuditEventType =
  | "spec_extracted"
  | "spec_confirmed"
  | "spec_field_override"
  | "quote_generated"
  | "quote_approved"
  | "quote_escalated"
  | "quote_sent";

export interface AuditEvent {
  event_type: AuditEventType;
  rfq_id?: string;
  quote_id?: string;
  customer_name?: string;
  user_id?: string;
  overall_confidence?: number;
  flagged_fields?: number;
  quote_value_eur?: number;
  gross_margin_pct?: number;
  approval_status?: string;
  field_name?: string;       // for spec_field_override
  old_value?: string;
  new_value?: string;
  notes?: string;
  timestamp?: string;        // defaults to now in N8N
}

// ── Activity Log Entry ────────────────────────────────────────────────────────
export interface ActivityLogEntry {
  action: string;
  timestamp: string;      // ISO 8601
  user_email: string;
  user_id?: string;
  details?: string;
}

// ── RFQ Inbox Item (local state, derived from SpecCard) ───────────────────────
export interface RFQInboxItem {
  rfq_id: string;
  customer_name: string;
  subject: string;
  filename: string;
  received_at: string;
  status: "uploading" | "processing" | "pending_review" | "confirmed" | "quoted" | "error";
  overall_confidence?: number;
  flagged_field_count?: number;
  spec_card?: SpecCard;
  quote?: Quote;
  error_message?: string;
  activity_log?: ActivityLogEntry[];
}

// ── Customer Tier ─────────────────────────────────────────────────────────────
export type CustomerTier = "Spot" | "Contract" | "Strategic";

// ── Settings (editable in Settings Panel, stored in localStorage) ─────────────
export interface AppSettings {
  n8n_base_url: string;           // e.g. http://your-vm:5678/webhook
  confidence_thresholds: {
    high: number;                  // default 0.80
    low: number;                   // default 0.40
  };
  pricing_overrides?: {            // optional — for demo mode
    hrc_base?: number;
    handling?: number;
  };
  default_customer_tier: CustomerTier;
  demo_mode: boolean;              // uses mock data instead of real N8N calls
}

export const DEFAULT_SETTINGS: AppSettings = {
  n8n_base_url: "http://localhost:5678/webhook",
  confidence_thresholds: { high: 0.80, low: 0.40 },
  default_customer_tier: "Contract",
  demo_mode: true,
};
