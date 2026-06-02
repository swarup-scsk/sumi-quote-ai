import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, ChevronRight, AlertTriangle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { getConfidenceColor } from "@/lib/confidence";

export const Route = createFileRoute("/rfq/")({
  head: () => ({
    meta: [
      { title: "Spec Review — Sales & Quoting AI" },
      { name: "description", content: "Review draft spec cards extracted from RFQs." },
    ],
  }),
  component: RfqIndexPage,
});

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RfqIndexPage() {
  const { state } = useApp();
  const drafts = state.rfqList
    .filter((r) => r.status === "pending_review")
    .sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime());

  if (drafts.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3 p-12 text-center">
        <FileText className="h-10 w-10 text-mid" />
        <h2 className="text-xl font-semibold text-ink">No spec to review</h2>
        <p className="text-sm text-mid">
          Upload an RFQ PDF from the Inbox to extract a spec card, then return here to review it.
        </p>
        <Link
          to="/"
          className="mt-2 inline-flex items-center rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Go to Inbox
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink">Spec Review</h1>
        <p className="mt-1 text-sm text-mid">
          {drafts.length} draft spec{drafts.length === 1 ? "" : "s"} awaiting review.
        </p>
      </div>

      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        {drafts.map((item) => {
          const pct =
            item.overall_confidence != null
              ? Math.round(item.overall_confidence * 100)
              : null;
          const flagged = item.flagged_field_count ?? 0;
          const isDraft = item.status === "pending_review";
          return (
            <li key={item.rfq_id}>
              <Link
                to="/rfq/$id"
                params={{ id: item.rfq_id }}
                className="flex items-center gap-4 px-5 py-4 hover:bg-surface"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-bg">
                  <FileText className="h-5 w-5 text-brand" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-ink">
                      {item.customer_name}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        isDraft
                          ? "bg-amber/15 text-amber"
                          : "bg-brand/15 text-brand-dark"
                      }`}
                    >
                      {isDraft ? "Draft" : "Confirmed"}
                    </span>
                  </div>
                  <p className="truncate text-xs text-mid">
                    {item.rfq_id} · {item.filename} · {formatTime(item.received_at)}
                  </p>
                </div>
                <div className="hidden items-center gap-3 sm:flex">
                  {flagged > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber/15 px-2 py-0.5 text-[11px] font-semibold text-amber">
                      <AlertTriangle className="h-3 w-3" />
                      {flagged} flagged
                    </span>
                  )}
                  {pct != null && (
                    <span
                      className={`rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold ${getConfidenceColor(item.overall_confidence!)}`}
                    >
                      {pct}%
                    </span>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-mid" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
