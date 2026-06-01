import jsPDF from "jspdf";
import type { RFQInboxItem, Quote } from "@/types";

const eur = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

function fmtDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

interface Builder {
  doc: jsPDF;
  y: number;
  margin: number;
  width: number;
}

function makeDoc(): Builder {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  return { doc, y: 56, margin: 56, width: doc.internal.pageSize.getWidth() };
}

function heading(b: Builder, text: string, size = 18) {
  b.doc.setFont("helvetica", "bold");
  b.doc.setFontSize(size);
  b.doc.setTextColor(20, 20, 30);
  b.doc.text(text, b.margin, b.y);
  b.y += size + 8;
}

function subheading(b: Builder, text: string) {
  ensureSpace(b, 24);
  b.doc.setFont("helvetica", "bold");
  b.doc.setFontSize(11);
  b.doc.setTextColor(60, 60, 70);
  b.doc.text(text.toUpperCase(), b.margin, b.y);
  b.y += 6;
  b.doc.setDrawColor(220);
  b.doc.line(b.margin, b.y, b.width - b.margin, b.y);
  b.y += 14;
}

function ensureSpace(b: Builder, needed: number) {
  const pageH = b.doc.internal.pageSize.getHeight();
  if (b.y + needed > pageH - b.margin) {
    b.doc.addPage();
    b.y = b.margin;
  }
}

function row(b: Builder, label: string, value: string) {
  ensureSpace(b, 18);
  b.doc.setFont("helvetica", "normal");
  b.doc.setFontSize(10);
  b.doc.setTextColor(110, 110, 120);
  b.doc.text(label, b.margin, b.y);
  b.doc.setTextColor(20, 20, 30);
  b.doc.setFont("helvetica", "bold");
  const lines = b.doc.splitTextToSize(value || "—", b.width - b.margin * 2 - 160);
  b.doc.text(lines, b.margin + 160, b.y);
  b.y += 14 * Math.max(1, lines.length);
}

function paragraph(b: Builder, text: string) {
  b.doc.setFont("helvetica", "normal");
  b.doc.setFontSize(10);
  b.doc.setTextColor(60, 60, 70);
  const lines = b.doc.splitTextToSize(text, b.width - b.margin * 2);
  ensureSpace(b, 14 * lines.length);
  b.doc.text(lines, b.margin, b.y);
  b.y += 14 * lines.length + 6;
}

export function buildRFQPdf(rfq: RFQInboxItem): jsPDF {
  const b = makeDoc();
  const sc = rfq.spec_card;

  heading(b, "Request for Quotation");
  b.doc.setFont("helvetica", "normal");
  b.doc.setFontSize(10);
  b.doc.setTextColor(110, 110, 120);
  b.doc.text(`${rfq.rfq_id}  ·  Received ${fmtDate(rfq.received_at)}`, b.margin, b.y);
  b.y += 22;

  subheading(b, "Customer");
  row(b, "Customer", rfq.customer_name);
  row(b, "Email", sc?.email_from ?? "—");
  row(b, "Subject", rfq.subject);
  row(b, "Original file", rfq.filename);

  if (sc) {
    subheading(b, "Requested Specification");
    row(b, "Grade", sc.grade ?? "—");
    row(b, "Standard", sc.standard ?? "—");
    row(b, "Thickness", sc.thickness_mm != null ? `${sc.thickness_mm} mm (${sc.thickness_tolerance ?? "—"})` : "—");
    row(b, "Width", sc.width_mm != null ? `${sc.width_mm} mm` : "—");
    row(b, "Coating", sc.coating ?? "—");
    row(b, "Quantity", sc.quantity_tonnes != null ? `${sc.quantity_tonnes} t` : "—");
    row(b, "Surface finish", sc.surface_finish ?? "—");
    row(b, "Delivery format", sc.delivery_format ?? "—");
    row(b, "Processing", sc.processing_requirements?.length ? sc.processing_requirements.join(", ") : "—");

    if (sc.notes) {
      subheading(b, "Customer notes");
      paragraph(b, sc.notes);
    }
    if (sc.extraction_warnings?.length) {
      subheading(b, "Extraction warnings");
      sc.extraction_warnings.forEach((w) => paragraph(b, `• ${w}`));
    }
  }

  return b.doc;
}

export function buildQuotePdf(quote: Quote): jsPDF {
  const b = makeDoc();
  const { pricing_breakdown: pb, margin, inventory, spec } = quote;

  heading(b, "Quotation");
  b.doc.setFont("helvetica", "normal");
  b.doc.setFontSize(10);
  b.doc.setTextColor(110, 110, 120);
  b.doc.text(`${quote.quote_id}  ·  ${quote.customer_name}  ·  ${quote.customer_tier} tier`, b.margin, b.y);
  b.y += 14;
  b.doc.text(`Generated ${fmtDate(quote.generated_at)}  ·  Valid until ${fmtDate(quote.valid_until)}`, b.margin, b.y);
  b.y += 24;

  subheading(b, "Quoted Specification");
  row(b, "Grade", spec.grade);
  row(b, "Standard", spec.standard);
  row(b, "Thickness", `${spec.thickness_mm} mm (${spec.thickness_tolerance})`);
  row(b, "Width", `${spec.width_mm} mm`);
  row(b, "Coating", spec.coating);
  row(b, "Quantity", `${spec.quantity_tonnes} t`);
  row(b, "Delivery format", spec.delivery_format);
  row(b, "Processing", spec.processing_requirements.length ? spec.processing_requirements.join(", ") : "—");

  subheading(b, "Pricing Breakdown (EUR / tonne)");
  row(b, "HRC base", eur.format(pb.hrc_base_per_tonne));
  row(b, "Grade premium", eur.format(pb.grade_premium_per_tonne));
  row(b, "Coating", eur.format(pb.coating_per_tonne));
  row(b, "Processing", eur.format(pb.processing_per_tonne));
  row(b, "Handling", eur.format(pb.handling_per_tonne));
  row(b, "Total unit cost", eur.format(pb.total_unit_cost));
  row(b, `Quote value (${pb.quantity_tonnes} t)`, eur.format(pb.quote_value_eur));

  subheading(b, "Margin & Approval");
  row(b, "Gross margin", `${margin.gross_margin_pct}%`);
  row(b, "Margin floor", `${margin.margin_floor_pct}%`);
  row(b, "Status", margin.approval_status === "auto_approved" ? "Auto-approved" : "Requires manager approval");
  if (margin.approval_reason) row(b, "Reason", margin.approval_reason);

  subheading(b, "Inventory");
  row(b, "Availability", inventory.available ? "Available from stock" : "Not currently in stock");
  row(b, "Tonnes", `${inventory.tonnes} t`);
  row(b, "Location", inventory.location);

  subheading(b, "Terms");
  row(b, "Payment terms", quote.payment_terms);
  row(b, "Valid until", fmtDate(quote.valid_until));

  return b.doc;
}

export function downloadPdf(doc: jsPDF, filename: string) {
  doc.save(filename);
}
