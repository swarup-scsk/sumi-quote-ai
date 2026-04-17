import { Link } from "@tanstack/react-router";
import { useApp } from "@/context/AppContext";

export function DemoBanner() {
  const { state } = useApp();
  if (!state.settings.demo_mode) return null;

  return (
    <Link
      to="/settings"
      className="block w-full bg-amber/15 px-4 py-2 text-center text-xs font-semibold uppercase tracking-wider text-amber hover:bg-amber/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      DEMO MODE — Using simulated data · DC04 / SCE Prague scenario
    </Link>
  );
}
