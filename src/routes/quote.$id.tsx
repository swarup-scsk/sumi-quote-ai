import { createFileRoute, Link } from "@tanstack/react-router";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";
import { useApp } from "@/context/AppContext";

export const Route = createFileRoute("/quote/$id")({
  head: () => ({
    meta: [
      { title: "Quote Preview — Sales & Quoting AI" },
      {
        name: "description",
        content: "Preview generated quote, pricing breakdown, margin and approval status.",
      },
    ],
  }),
  component: QuotePage,
});

function QuotePage() {
  const { id } = Route.useParams();
  const { state } = useApp();
  const rfq = state.rfqList.find((r) => r.rfq_id === id);

  if (!rfq || !rfq.quote) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-xl font-semibold text-ink">Quote not found</h2>
        <p className="mt-2 max-w-md text-sm text-mid">
          Quote not found — spec must be confirmed first.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          ← Back to Inbox
        </Link>
      </div>
    );
  }

  return (
    <PlaceholderScreen
      title={`Quote Preview — ${id}`}
      description="Pricing breakdown, margin check, inventory availability, and approval status will appear here."
    />
  );
}
