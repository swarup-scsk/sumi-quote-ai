import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RFQ Inbox — Sales & Quoting AI" },
      { name: "description", content: "Incoming RFQ PDFs awaiting spec extraction and review." },
    ],
  }),
  component: InboxPage,
});

function InboxPage() {
  return (
    <PlaceholderScreen
      title="RFQ Inbox"
      description="Drop RFQ PDFs here to extract spec cards. List of incoming and in-progress RFQs will appear here."
    />
  );
}
