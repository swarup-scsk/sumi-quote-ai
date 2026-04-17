import { Link } from "@tanstack/react-router";
import { Loader2, Inbox } from "lucide-react";
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

export function RFQList({ items }: { items: RFQInboxItem[] }) {
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

              return (
                <tr key={item.rfq_id} className="hover:bg-surface">
                  <td className="px-4 py-3 font-mono text-xs text-ink">{item.rfq_id}</td>
                  <td className="px-4 py-3 font-medium text-ink">{item.customer_name}</td>
                  <td className="px-4 py-3 text-mid">{item.filename}</td>
                  <td className="px-4 py-3 text-mid">{formatTime(item.received_at)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                    {item.status === "error" && item.error_message && (
                      <div className="mt-1 max-w-[260px] truncate text-[11px] text-coral" title={item.error_message}>
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
