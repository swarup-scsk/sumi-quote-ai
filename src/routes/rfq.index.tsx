import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { useApp } from "@/context/AppContext";

export const Route = createFileRoute("/rfq/")({
  head: () => ({
    meta: [
      { title: "Spec Review — Sales & Quoting AI" },
      { name: "description", content: "Open an RFQ to review its extracted spec card." },
    ],
  }),
  component: RfqIndexPage,
});

function RfqIndexPage() {
  const { state } = useApp();
  const reviewable = state.rfqList.find(
    (r) => r.status === "pending_review" || r.status === "confirmed",
  );
  if (reviewable) {
    return <Navigate to="/rfq/$id" params={{ id: reviewable.rfq_id }} replace />;
  }
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
