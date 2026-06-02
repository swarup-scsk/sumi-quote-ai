import { createFileRoute, Link } from "@tanstack/react-router";
import { FileCheck2, ChevronRight, CheckCircle2, Send } from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { RFQInboxItem } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/quote/")({
  head: () => ({
    meta: [
      { title: "Quotes — Sales & Quoting AI" },
      { name: "description", content: "Browse all generated and shared quotes." },
    ],
  }),
  component: QuoteIndexPage,
});

const eur = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function fmtDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function StateBadge({ status }: { status: RFQInboxItem["status"] }) {
  if (status === "quote_shared") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-brand-dark px-2.5 py-0.5 text-[11px] font-semibold text-white">
        <Send className="h-3 w-3" /> Quote Shared
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2.5 py-0.5 text-[11px] font-semibold text-brand-dark">
      <CheckCircle2 className="h-3 w-3" /> Quote Generated
    </span>
  );
}

function QuoteIndexPage() {
  const { state } = useApp();
  const quotes = state.rfqList
    .filter((r) => (r.status === "quote_generated" || r.status === "quote_shared") && r.quote)
    .sort((a, b) => new Date(b.quote!.generated_at).getTime() - new Date(a.quote!.generated_at).getTime());

  if (quotes.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3 p-12 text-center">
        <FileCheck2 className="h-10 w-10 text-mid" />
        <h2 className="text-xl font-semibold text-ink">No quotes yet</h2>
        <p className="text-sm text-mid">
          Confirm a spec card to generate your first quote. Quotes will appear here once available.
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
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-ink">Quotes</h2>
        <p className="mt-1 text-sm text-mid">All generated quotes and their delivery state.</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand text-left text-[11px] uppercase tracking-wider text-white">
                <th className="px-4 py-3 font-semibold">Quote ID</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Spec</th>
                <th className="px-4 py-3 text-right font-semibold">Value</th>
                <th className="px-4 py-3 text-right font-semibold">Margin</th>
                <th className="px-4 py-3 font-semibold">Generated</th>
                <th className="px-4 py-3 font-semibold">State</th>
                <th className="w-8 px-2 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {quotes.map((item) => {
                const q = item.quote!;
                return (
                  <tr key={item.rfq_id} className="group cursor-pointer hover:bg-surface">
                    <td className="px-4 py-3 font-mono text-xs text-ink">
                      <Link to="/quote/$id" params={{ id: item.rfq_id }} className="block">
                        {q.quote_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">
                      <Link to="/quote/$id" params={{ id: item.rfq_id }} className="block">
                        {q.customer_name}
                        <span className="ml-1 text-xs font-normal text-mid">· {q.customer_tier}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-mid">
                      <Link to="/quote/$id" params={{ id: item.rfq_id }} className="block">
                        {q.spec.grade} · {q.spec.thickness_mm}×{q.spec.width_mm}mm · {q.spec.quantity_tonnes}t
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink">
                      <Link to="/quote/$id" params={{ id: item.rfq_id }} className="block">
                        {eur.format(q.pricing_breakdown.quote_value_eur)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <Link
                        to="/quote/$id"
                        params={{ id: item.rfq_id }}
                        className={cn(
                          "block font-medium",
                          q.margin.margin_ok ? "text-brand-dark" : "text-coral",
                        )}
                      >
                        {q.margin.gross_margin_pct.toFixed(1)}%
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-mid">
                      <Link to="/quote/$id" params={{ id: item.rfq_id }} className="block">
                        {fmtDate(q.generated_at)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link to="/quote/$id" params={{ id: item.rfq_id }} className="block">
                        <StateBadge status={item.status} />
                      </Link>
                    </td>
                    <td className="px-2 py-3 text-mid">
                      <Link to="/quote/$id" params={{ id: item.rfq_id }} className="block">
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
