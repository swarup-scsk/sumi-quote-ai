import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";

export const Route = createFileRoute("/rfq/$id")({
  head: () => ({
    meta: [
      { title: "Spec Card Review — Sales & Quoting AI" },
      { name: "description", content: "Review and confirm extracted RFQ specifications." },
    ],
  }),
  component: SpecReviewPage,
});

function SpecReviewPage() {
  const { id } = Route.useParams();
  return (
    <PlaceholderScreen
      title={`Spec Card Review — ${id}`}
      description="Confirm grade, dimensions, coating, processing requirements and quantity before generating a quote."
    />
  );
}
