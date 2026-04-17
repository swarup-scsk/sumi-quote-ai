import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { FileCheck2 } from "lucide-react";
import { useApp } from "@/context/AppContext";

export const Route = createFileRoute("/quote/")({
  head: () => ({
    meta: [
      { title: "Quotes — Sales & Quoting AI" },
      { name: "description", content: "Open a generated quote." },
    ],
  }),
  component: QuoteIndexPage,
});

function QuoteIndexPage() {
  const { state } = useApp();
  const quoted = state.rfqList.find((r) => r.status === "quoted");
  if (quoted) {
    return <Navigate to="/quote/$id" params={{ id: quoted.rfq_id }} replace />;
  }
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
