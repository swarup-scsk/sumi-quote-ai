import { createFileRoute } from "@tanstack/react-router";
import { QuotePreview } from "@/components/QuotePreview";

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
  return <QuotePreview rfqId={id} />;
}
