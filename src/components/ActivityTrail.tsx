import { useState } from "react";
import { ChevronDown, ChevronRight, Upload, FileSearch, CheckCircle2, FileText, ShieldCheck, AlertTriangle, XCircle } from "lucide-react";
import type { RFQInboxItem } from "@/types";

type TrailEvent = {
  ts: string;
  label: string;
  detail?: string;
  icon: typeof Upload;
  tone: "mid" | "brand" | "amber" | "coral";
};

function buildEvents(item: RFQInboxItem): TrailEvent[] {
  const events: TrailEvent[] = [];

  events.push({
    ts: item.received_at,
    label: "RFQ uploaded",
    detail: item.filename,
    icon: Upload,
    tone: "mid",
  });

  if (item.status === "processing") {
    events.push({
      ts: item.received_at,
      label: "Extraction in progress",
      icon: FileSearch,
      tone: "amber",
    });
  }

  if (item.spec_card) {
    const sc = item.spec_card;
    events.push({
      ts: sc.extracted_at,
      label: "Spec extracted",
      detail: `Confidence ${Math.round((sc.overall_confidence ?? 0) * 100)}% · ${sc.flagged_field_count ?? 0} flagged`,
      icon: FileSearch,
      tone: (sc.flagged_field_count ?? 0) > 0 ? "amber" : "brand",
    });
    if (sc.status === "confirmed" || sc.status === "quoted") {
      events.push({
        ts: sc.extracted_at,
        label: "Spec confirmed",
        detail: "Rep approved extracted fields",
        icon: CheckCircle2,
        tone: "brand",
      });
    }
  }

  if (item.quote) {
    const q = item.quote;
    events.push({
      ts: q.generated_at,
      label: "Quote generated",
      detail: `${q.quote_id} · €${q.pricing_breakdown.quote_value_eur.toLocaleString()} · margin ${q.margin.gross_margin_pct.toFixed(1)}%`,
      icon: FileText,
      tone: "brand",
    });
    if (q.margin.auto_approved) {
      events.push({
        ts: q.generated_at,
        label: "Auto-approved",
        detail: q.approval_message,
        icon: ShieldCheck,
        tone: "brand",
      });
    } else {
      events.push({
        ts: q.generated_at,
        label: "Manager approval required",
        detail: q.margin.approval_reason ?? q.approval_message,
        icon: AlertTriangle,
        tone: "amber",
      });
    }
  }

  if (item.status === "error") {
    events.push({
      ts: item.received_at,
      label: "Error",
      detail: item.error_message ?? "Processing failed",
      icon: XCircle,
      tone: "coral",
    });
  }

  return events.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const toneClasses: Record<TrailEvent["tone"], string> = {
  mid: "bg-mid/15 text-mid",
  brand: "bg-brand/15 text-brand-dark",
  amber: "bg-amber/15 text-amber",
  coral: "bg-coral/15 text-coral",
};

function RFQTrail({ item }: { item: RFQInboxItem }) {
  const [open, setOpen] = useState(false);
  const events = buildEvents(item);
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-surface"
      >
        <div className="flex items-center gap-2 min-w-0">
          {open ? (
            <ChevronDown className="h-4 w-4 text-mid shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-mid shrink-0" />
          )}
          <span className="font-mono text-xs text-ink shrink-0">{item.rfq_id}</span>
          <span className="truncate text-sm font-medium text-ink">{item.customer_name}</span>
        </div>
        <span className="text-[11px] text-mid shrink-0">
          {events.length} {events.length === 1 ? "event" : "events"}
        </span>
      </button>
      {open && (
        <ol className="space-y-3 border-t border-border bg-surface/40 px-6 py-4">
          {events.map((e, i) => {
            const Icon = e.icon;
            return (
              <li key={i} className="flex gap-3">
                <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${toneClasses[e.tone]}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-medium text-ink">{e.label}</p>
                    <span className="text-[11px] text-mid shrink-0">{formatTime(e.ts)}</span>
                  </div>
                  {e.detail && <p className="text-xs text-mid">{e.detail}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export function ActivityTrail({ items }: { items: RFQInboxItem[] }) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 bg-brand px-4 py-3 text-left text-white"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            Activity trail
          </span>
        </div>
        <span className="text-[11px] opacity-80">
          {items.length} {items.length === 1 ? "RFQ" : "RFQs"}
        </span>
      </button>
      {open && (
        <div>
          {items.map((item) => (
            <RFQTrail key={item.rfq_id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
