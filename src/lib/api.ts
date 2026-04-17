// ─────────────────────────────────────────────────────────────────────────────
// api.ts — N8N integration layer for Sales & Quoting AI
// Paste this as src/lib/api.ts in Lovable
// All calls go to the three N8N webhook endpoints.
// If settings.demo_mode = true, returns mock data instead (for offline demos).
// ─────────────────────────────────────────────────────────────────────────────

import type {
  SpecCard,
  ConfirmedSpec,
  Quote,
  AuditEvent,
  AppSettings,
  DEFAULT_SETTINGS,
} from "@/types";

// ── Settings loader (reads from localStorage) ─────────────────────────────────
export function getSettings(): AppSettings {
  try {
    const stored = localStorage.getItem("sqai_settings");
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } as AppSettings;
  } catch {/* ignore */}
  return DEFAULT_SETTINGS as AppSettings;
}

export function saveSettings(s: AppSettings) {
  localStorage.setItem("sqai_settings", JSON.stringify(s));
}

// ── File → base64 helper ──────────────────────────────────────────────────────
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => {
      // Strip "data:application/pdf;base64," prefix if present
      const result = reader.result as string;
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// H1 — Submit RFQ PDF → get Spec Card back
// ─────────────────────────────────────────────────────────────────────────────
export async function submitRFQ(params: {
  rfq_id: string;
  customer_name: string;
  email_from: string;
  subject: string;
  file: File;
}): Promise<SpecCard> {
  const settings = getSettings();

  // Demo mode — return mock spec card
  if (settings.demo_mode) {
    await new Promise(r => setTimeout(r, 1800));  // simulate latency
    return MOCK_SPEC_CARD(params.rfq_id, params.customer_name);
  }

  const pdf_base64 = await fileToBase64(params.file);

  const response = await fetch(`${settings.n8n_base_url}/rfq-ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rfq_id:        params.rfq_id,
      customer_name: params.customer_name,
      email_from:    params.email_from,
      subject:       params.subject,
      filename:      params.file.name,
      pdf_base64,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`RFQ ingestion failed (${response.status}): ${err}`);
  }

  return response.json() as Promise<SpecCard>;
}

// ─────────────────────────────────────────────────────────────────────────────
// H2 — Submit confirmed spec → get Quote back
// ─────────────────────────────────────────────────────────────────────────────
export async function generateQuote(spec: ConfirmedSpec): Promise<Quote> {
  const settings = getSettings();

  if (settings.demo_mode) {
    await new Promise(r => setTimeout(r, 1200));
    return MOCK_QUOTE(spec);
  }

  const response = await fetch(`${settings.n8n_base_url}/generate-quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(spec),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Quote generation failed (${response.status}): ${err}`);
  }

  return response.json() as Promise<Quote>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit Logger — fire-and-forget, never blocks the UI
// ─────────────────────────────────────────────────────────────────────────────
export function logAuditEvent(event: AuditEvent): void {
  const settings = getSettings();
  if (settings.demo_mode) return;

  fetch(`${settings.n8n_base_url}/audit-log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    }),
  }).catch(err => console.warn("Audit log failed (non-critical):", err));
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA — used when demo_mode = true
// Represents the DC04 / SCE Prague scenario from the exec deck
// ─────────────────────────────────────────────────────────────────────────────
function MOCK_SPEC_CARD(rfq_id: string, customer_name: string): SpecCard {
  return {
    rfq_id,
    customer_name,
    email_from:    "buyer@sce-prague.cz",
    subject:       "RFQ: DC04 0.8mm EG 150T — Q2 delivery",
    filename:      "drawing-dc04-0.8mm.pdf",
    received_at:   new Date().toISOString(),
    extracted_at:  new Date().toISOString(),
    status:        "pending_review",
    grade:              "DC04",        grade_confidence:              0.98,
    thickness_mm:       0.8,           thickness_confidence:          0.95,
    thickness_tolerance:"±0.05mm",     thickness_tolerance_confidence:0.72,
    width_mm:           1250,          width_confidence:              0.91,
    coating:            "EG 20/20",    coating_confidence:            0.89,
    quantity_tonnes:    150,           quantity_confidence:           0.96,
    standard:           "EN 10152",   standard_confidence:           0.88,
    processing_requirements: ["Slitting to 625mm"],
    processing_confidence: 0.81,
    surface_finish:     "A",           surface_finish_confidence:     0.45,
    delivery_format:    "Slit coil",   delivery_format_confidence:    0.60,
    notes: "Customer referenced EN 10131 Class A tolerance on drawing note 3.",
    extraction_warnings: [
      "Thickness tolerance partially obscured in drawing — check note 3.",
      "Delivery format not explicitly stated — inferred from coil dimensions.",
    ],
    field_status: {
      grade:                  "auto",
      thickness_mm:           "auto",
      thickness_tolerance:    "review",
      width_mm:               "auto",
      coating:                "auto",
      quantity_tonnes:        "auto",
      standard:               "auto",
      processing_requirements:"auto",
      surface_finish:         "review",
      delivery_format:        "review",
    },
    flagged_field_count: 3,
    overall_confidence:  0.82,
    review_required:     true,
  };
}

function MOCK_QUOTE(spec: ConfirmedSpec): Quote {
  const qty    = spec.quantity_tonnes;
  const unit   = 657;
  const value  = Math.round(unit * qty * 100) / 100;
  const gm     = 15.0;

  return {
    rfq_id:          spec.rfq_id,
    quote_id:        `Q-${spec.rfq_id}-${Date.now()}`,
    customer_name:   spec.customer_name,
    customer_tier:   spec.customer_tier,
    generated_at:    new Date().toISOString(),
    valid_until:     new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    payment_terms:   "60 days",
    status:          "approved",
    approval_message:"Quote auto-approved — margin and value within policy thresholds.",
    spec: {
      grade:                   spec.grade,
      thickness_mm:            spec.thickness_mm,
      thickness_tolerance:     spec.thickness_tolerance,
      width_mm:                spec.width_mm,
      coating:                 spec.coating,
      quantity_tonnes:         qty,
      standard:                spec.standard,
      processing_requirements: spec.processing_requirements,
      delivery_format:         spec.delivery_format,
    },
    inventory: {
      key:       "DC04-EG20-0.8",
      available: true,
      tonnes:    450,
      location:  "SCE Prague",
    },
    pricing_breakdown: {
      hrc_base_per_tonne:      518,
      grade_premium_per_tonne: 47,
      coating_per_tonne:       62,
      processing_per_tonne:    22,
      handling_per_tonne:      8,
      total_unit_cost:         unit,
      quantity_tonnes:         qty,
      quote_value_eur:         value,
    },
    margin: {
      gross_margin_pct: gm,
      margin_floor_pct: 10,
      margin_ok:        true,
      auto_approved:    true,
      approval_status:  "auto_approved",
      approval_reason:  null,
    },
  };
}
