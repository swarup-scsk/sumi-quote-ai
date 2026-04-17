import { createFileRoute } from "@tanstack/react-router";
import { SettingsPanel } from "@/components/SettingsPanel";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Sales & Quoting AI" },
      {
        name: "description",
        content: "Configure N8N endpoints, confidence thresholds and demo mode.",
      },
    ],
  }),
  component: SettingsPanel,
});
