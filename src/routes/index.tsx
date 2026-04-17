import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/context/AppContext";
import { RFQUpload } from "@/components/RFQUpload";
import { RFQList } from "@/components/RFQList";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RFQ Inbox — Sales & Quoting AI" },
      { name: "description", content: "Upload RFQ PDFs and review extracted steel spec cards." },
    ],
  }),
  component: InboxPage,
});

function InboxPage() {
  const { state } = useApp();
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-ink">RFQ Inbox</h2>
        <p className="mt-1 text-sm text-mid">
          Drop a customer RFQ PDF to extract a spec card with AI.
        </p>
      </div>
      <RFQUpload />
      <RFQList items={state.rfqList} />
    </div>
  );
}
