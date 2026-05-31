import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { Inbox, FileText, FileCheck2, Settings as SettingsIcon, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { DemoBanner } from "@/components/DemoBanner";
import { useApp } from "@/context/AppContext";

const navItems = [
  { to: "/", icon: Inbox, label: "Inbox" },
  { to: "/rfq", icon: FileText, label: "Spec Review" },
  { to: "/quote", icon: FileCheck2, label: "Quotes" },
  { to: "/settings", icon: SettingsIcon, label: "Settings" },
];

function SidebarIcon({
  to,
  icon: Icon,
  label,
  active,
}: {
  to: string;
  icon: typeof Inbox;
  label: string;
  active: boolean;
}) {
  return (
    <Link to={to} className="flex justify-center">
      <div
        className={`group relative flex h-12 w-12 items-center justify-center rounded-lg transition-colors ${
          active ? "bg-brand text-white" : "text-mid hover:bg-brand-bg hover:text-brand-dark"
        }`}
        title={label}
      >
        <Icon className="h-5 w-5" />
        <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
          {label}
        </span>
      </div>
    </Link>
  );
}

function BottomNavIcon({
  to,
  icon: Icon,
  label,
  active,
}: {
  to: string;
  icon: typeof Inbox;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium ${
        active ? "text-brand" : "text-mid"
      }`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}

export function Layout({ children }: { children?: ReactNode }) {
  const { pathname } = useLocation();

  const isActive = (to: string) => {
    if (to === "/") return pathname === "/";
    return pathname.startsWith(to);
  };

  return (
    <div className="flex min-h-screen bg-surface text-ink">
      {/* Desktop sidebar */}
      <aside className="hidden w-16 flex-col items-center border-r border-border bg-white py-4 md:flex">
        <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
          SQ
        </div>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <SidebarIcon
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={isActive(item.to)}
            />
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <DemoBanner />
        <HeaderBar />

        <main className="flex-1 overflow-auto pb-16 md:pb-0">{children ?? <Outlet />}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-white shadow-lg md:hidden">
        {navItems.map((item) => (
          <BottomNavIcon
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            active={isActive(item.to)}
          />
        ))}
      </nav>
    </div>
  );
}
