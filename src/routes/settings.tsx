import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Sales & Quoting AI" },
      { name: "description", content: "Configure N8N endpoints, confidence thresholds and demo mode." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <PlaceholderScreen
      title="Settings"
      description="N8N base URL, confidence thresholds, default customer tier, pricing overrides and demo mode toggle."
    />
  );
}
