import { createFileRoute } from "@tanstack/react-router";
import { SpecCardReview } from "@/components/SpecCardReview";

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
  return <SpecCardReview rfqId={id} />;
}
