import { Link } from "@tanstack/react-router";
import { useApp } from "@/context/AppContext";

export function DemoBanner() {
  const { state } = useApp();
  const isDemo = state.settings.demo_mode;

  if (isDemo) {
    return (
      <Link
        to="/settings"
        className="block w-full bg-amber/15 px-4 py-2 text-center text-xs font-semibold uppercase tracking-wider text-amber hover:bg-amber/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        DEMO MODE — Using simulated data · DC04 / SCE Prague scenario
      </Link>
    );
  }

  return (
    <Link
      to="/settings"
      className="block w-full bg-green-500/15 px-4 py-2 text-center text-xs font-semibold uppercase tracking-wider text-green-700 hover:bg-green-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      LIVE MODE — Connected to production data
    </Link>
  );
}
