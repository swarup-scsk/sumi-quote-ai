import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Package,
  PackageX,
  Send,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { logAuditEvent } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  rfqId: string;
}

const eur = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

function fmtDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function QuotePreview({ rfqId }: Props) {
  const { state } = useApp();
  const rfq = state.rfqList.find((r) => r.rfq_id === rfqId);
  const quote = rfq?.quote;

  if (!rfq || !quote) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-xl font-semibold text-ink">Quote not found</h2>
        <p className="mt-2 max-w-md text-sm text-mid">
          Quote not found — the spec must be confirmed first.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          <ArrowLeft className="mr-1.5 size-4" /> Back to Inbox
        </Link>
      </div>
    );
  }

  const approved = quote.status === "approved";
  const { pricing_breakdown: pb, margin, inventory, spec } = quote;

  const priceRows: { label: string; value: number }[] = [
    { label: "HRC base", value: pb.hrc_base_per_tonne },
    { label: "Grade premium", value: pb.grade_premium_per_tonne },
    { label: "Coating", value: pb.coating_per_tonne },
    { label: "Processing", value: pb.processing_per_tonne },
    { label: "Handling", value: pb.handling_per_tonne },
  ];

  function handleSend() {
    logAuditEvent({
      event_type: "quote_sent",
      rfq_id: rfqId,
      quote_id: quote!.quote_id,
      customer_name: quote!.customer_name,
      quote_value_eur: quote!.pricing_breakdown.quote_value_eur,
    });
    toast.success("Quote sent to customer", { duration: 2500 });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <Link to="/" className="mb-3 inline-flex items-center gap-1.5 text-sm text-mid hover:text-brand">
          <ArrowLeft className="size-4" /> Back to Inbox
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink">{quote.customer_name}</h1>
            <p className="mt-1 text-sm text-mid">
              <span className="font-mono">{quote.quote_id}</span> · {quote.customer_tier} tier
            </p>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium",
              approved ? "bg-brand-bg text-brand-dark" : "bg-amber/10 text-amber",
            )}
          >
            {approved ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
            {approved ? "Approved" : "Pending approval"}
          </span>
        </div>
      </div>

      {/* Approval banner */}
      <div
        className={cn(
          "rounded-lg border-l-4 px-4 py-3 text-sm",
          approved
            ? "border-l-brand bg-brand-bg/50 text-brand-dark"
            : "border-l-amber bg-amber/5 text-ink",
        )}
      >
        {quote.approval_message}
      </div>

      {/* Headline figures */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Quote value" value={eur.format(pb.quote_value_eur)} emphasis />
        <Stat label="Quantity" value={`${pb.quantity_tonnes} t`} />
        <Stat
          label="Gross margin"
          value={`${margin.gross_margin_pct}%`}
          tone={margin.margin_ok ? "ok" : "bad"}
        />
        <Stat label="Unit cost" value={`${eur.format(pb.total_unit_cost)}/t`} />
      </div>

      {/* Pricing breakdown */}
      <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-ink">Pricing Breakdown</h3>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface text-left text-xs uppercase tracking-wide text-mid">
                <th className="px-4 py-2 font-medium">Component</th>
                <th className="px-4 py-2 text-right font-medium">EUR / tonne</th>
              </tr>
            </thead>
            <tbody>
              {priceRows.map((r) => (
                <tr key={r.label} className="border-t border-border">
                  <td className="px-4 py-2 text-ink">{r.label}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-ink">{eur.format(r.value)}</td>
                </tr>
              ))}
              <tr className="border-t border-border bg-surface/60 font-semibold">
                <td className="px-4 py-2 text-ink">Total unit cost</td>
                <td className="px-4 py-2 text-right tabular-nums text-ink">{eur.format(pb.total_unit_cost)}</td>
              </tr>
              <tr className="border-t border-border bg-brand-bg font-semibold">
                <td className="px-4 py-2 text-brand-dark">
                  Quote value ({pb.quantity_tonnes} t)
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-brand-dark">
                  {eur.format(pb.quote_value_eur)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Margin + Inventory */}
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-ink">Margin Check</h3>
          <dl className="space-y-2.5 text-sm">
            <Row label="Gross margin">
              <span className={cn("font-semibold", margin.margin_ok ? "text-brand-dark" : "text-coral")}>
                {margin.gross_margin_pct}%
              </span>
            </Row>
            <Row label="Margin floor">{margin.margin_floor_pct}%</Row>
            <Row label="Within policy">
              <span className={cn("font-medium", margin.margin_ok ? "text-brand-dark" : "text-coral")}>
                {margin.margin_ok ? "Yes" : "No"}
              </span>
            </Row>
            <Row label="Approval">
              {margin.approval_status === "auto_approved" ? "Auto-approved" : "Needs manager approval"}
            </Row>
            {margin.approval_reason && <Row label="Reason">{margin.approval_reason}</Row>}
          </dl>
        </section>

        <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-ink">Inventory</h3>
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 inline-flex size-8 items-center justify-center rounded-full",
                inventory.available ? "bg-brand-bg text-brand-dark" : "bg-coral/10 text-coral",
              )}
            >
              {inventory.available ? <Package className="size-4" /> : <PackageX className="size-4" />}
            </span>
            <div className="text-sm">
              <p className="font-medium text-ink">
                {inventory.available ? "Available from stock" : "Not currently in stock"}
              </p>
              <p className="mt-0.5 text-mid">
                {inventory.tonnes} t at {inventory.location}
              </p>
              <p className="mt-0.5 font-mono text-xs text-mid">{inventory.key}</p>
            </div>
          </div>
        </section>
      </div>

      {/* Spec + terms */}
      <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-ink">Quoted Specification</h3>
        <dl className="grid gap-x-8 gap-y-2.5 text-sm sm:grid-cols-2">
          <Row label="Grade">{spec.grade}</Row>
          <Row label="Standard">{spec.standard}</Row>
          <Row label="Thickness">{spec.thickness_mm} mm ({spec.thickness_tolerance})</Row>
          <Row label="Width">{spec.width_mm} mm</Row>
          <Row label="Coating">{spec.coating}</Row>
          <Row label="Quantity">{spec.quantity_tonnes} t</Row>
          <Row label="Delivery format">{spec.delivery_format}</Row>
          <Row label="Processing">
            {spec.processing_requirements.length ? spec.processing_requirements.join(", ") : "—"}
          </Row>
          <Row label="Valid until">{fmtDate(quote.valid_until)}</Row>
          <Row label="Payment terms">{quote.payment_terms}</Row>
          <Row label="Generated">{fmtDate(quote.generated_at)}</Row>
        </dl>
      </section>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Link
          to="/rfq/$id"
          params={{ id: rfqId }}
          className="inline-flex items-center rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-surface"
        >
          Edit spec
        </Link>
        <Button onClick={handleSend} className="bg-brand text-white hover:bg-brand-dark">
          <Send className="mr-1.5 size-4" /> Send Quote
        </Button>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  emphasis,
  tone,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  tone?: "ok" | "bad";
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-mid">{label}</p>
      <p
        className={cn(
          "mt-1 font-semibold",
          emphasis ? "text-xl text-ink" : "text-lg text-ink",
          tone === "ok" && "text-brand-dark",
          tone === "bad" && "text-coral",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-mid">{label}</dt>
      <dd className="text-right font-medium text-ink">{children}</dd>
    </div>
  );
}
