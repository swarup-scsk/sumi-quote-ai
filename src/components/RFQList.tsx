import { Fragment, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Loader2,
  Inbox,
  ChevronDown,
  ChevronRight,
  Upload,
  FileSearch,
  CheckCircle2,
  FileText,
  ShieldCheck,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import type { RFQInboxItem } from "@/types";
import { getConfidenceColor } from "@/lib/confidence";

function StatusBadge({ status }: { status: RFQInboxItem["status"] }) {
  const map: Record<RFQInboxItem["status"], { label: string; cls: string; spin?: boolean }> = {
    uploading: { label: "Uploading", cls: "bg-mid/15 text-mid" },
    processing: { label: "Processing", cls: "bg-amber/15 text-amber", spin: true },
    pending_review: { label: "Pending Review", cls: "bg-amber/15 text-amber" },
    confirmed: { label: "Confirmed", cls: "bg-brand/15 text-brand-dark" },
    quoted: { label: "Quoted", cls: "bg-brand-dark text-white" },
    error: { label: "Error", cls: "bg-coral/15 text-coral" },
  };
  const s = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${s.cls}`}
    >
      {s.spin && <Loader2 className="h-3 w-3 animate-spin" />}
      {s.label}
    </span>
  );
}

function ConfidencePill({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <span
      className={`rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold ${getConfidenceColor(value)}`}
    >
      {pct}%
    </span>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Trail ──────────────────────────────────────────────────────────────────
type TrailEvent = {
  ts: string;
  label: string;
  detail?: string;
  icon: typeof Upload;
  tone: "mid" | "brand" | "amber" | "coral";
};

const toneClasses: Record<TrailEvent["tone"], string> = {
  mid: "bg-mid/15 text-mid",
  brand: "bg-brand/15 text-brand-dark",
  amber: "bg-amber/15 text-amber",
  coral: "bg-coral/15 text-coral",
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

function TrailRow({ item }: { item: RFQInboxItem }) {
  const events = buildEvents(item);
  return (
    <tr className="bg-surface/40">
      <td colSpan={8} className="px-6 py-4">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-mid">
          Activity trail
        </div>
        <ol className="space-y-3">
          {events.map((e, i) => {
            const Icon = e.icon;
            return (
              <li key={i} className="flex gap-3">
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${toneClasses[e.tone]}`}
                >
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
      </td>
    </tr>
  );
}

export function RFQList({ items }: { items: RFQInboxItem[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setExpanded((s) => ({ ...s, [id]: !s[id] }));

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white px-6 py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-bg">
          <Inbox className="h-8 w-8 text-brand" />
        </div>
        <h3 className="text-base font-semibold text-ink">No RFQs yet</h3>
        <p className="mt-1 text-sm text-mid">
          Upload a PDF drawing above to start.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-brand text-left text-[11px] uppercase tracking-wider text-white">
              <th className="w-8 px-2 py-3"></th>
              <th className="px-4 py-3 font-semibold">RFQ ID</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Filename</th>
              <th className="px-4 py-3 font-semibold">Received</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Confidence</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item) => {
              const showConfidence =
                item.status === "pending_review" ||
                item.status === "confirmed" ||
                item.status === "quoted";
              const canReview =
                item.status === "pending_review" || item.status === "confirmed";
              const canViewQuote = item.status === "quoted";
              const isOpen = !!expanded[item.rfq_id];

              return (
                <>
                  <tr key={item.rfq_id} className="hover:bg-surface">
                    <td className="px-2 py-3">
                      <button
                        type="button"
                        onClick={() => toggle(item.rfq_id)}
                        aria-label={isOpen ? "Hide activity trail" : "Show activity trail"}
                        className="flex h-6 w-6 items-center justify-center rounded text-mid hover:bg-surface hover:text-ink"
                      >
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink">{item.rfq_id}</td>
                    <td className="px-4 py-3 font-medium text-ink">{item.customer_name}</td>
                    <td className="px-4 py-3 text-mid">{item.filename}</td>
                    <td className="px-4 py-3 text-mid">{formatTime(item.received_at)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                      {item.status === "error" && item.error_message && (
                        <div
                          className="mt-1 max-w-[260px] truncate text-[11px] text-coral"
                          title={item.error_message}
                        >
                          {item.error_message}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {showConfidence && item.overall_confidence != null ? (
                        <ConfidencePill value={item.overall_confidence} />
                      ) : (
                        <span className="text-xs text-mid">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canReview && (
                        <Link
                          to="/rfq/$id"
                          params={{ id: item.rfq_id }}
                          className="inline-flex items-center rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
                        >
                          Review Spec
                        </Link>
                      )}
                      {canViewQuote && (
                        <Link
                          to="/quote/$id"
                          params={{ id: item.rfq_id }}
                          className="inline-flex items-center rounded-md bg-brand-dark px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand"
                        >
                          View Quote
                        </Link>
                      )}
                      {!canReview && !canViewQuote && (
                        <span className="text-xs text-mid">—</span>
                      )}
                    </td>
                  </tr>
                  {isOpen && <TrailRow item={item} />}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
