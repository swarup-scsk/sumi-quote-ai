import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";

export const Route = createFileRoute("/quote/$id")({
  head: () => ({
    meta: [
      { title: "Quote Preview — Sales & Quoting AI" },
      { name: "description", content: "Preview generated quote, pricing breakdown, margin and approval status." },
    ],
  }),
  component: QuotePage,
});

function QuotePage() {
  const { id } = Route.useParams();
  return (
    <PlaceholderScreen
      title={`Quote Preview — ${id}`}
      description="Pricing breakdown, margin check, inventory availability, and approval status will appear here."
    />
  );
}
