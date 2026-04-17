import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { Inbox, FileText, FileCheck2, Settings as SettingsIcon } from "lucide-react";
import type { ReactNode } from "react";

const navItems = [
  { to: "/", icon: Inbox, label: "Inbox" },
  { to: "/rfq", icon: FileText, label: "Spec Review" },
  { to: "/quote", icon: FileCheck2, label: "Quotes" },
  { to: "/settings", icon: SettingsIcon, label: "Settings" },
];

function NavIcon({
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
  const content = (
    <div
      className={`group relative flex h-12 w-12 items-center justify-center rounded-lg transition-colors ${
        active
          ? "bg-brand text-white"
          : "text-mid hover:bg-brand-bg hover:text-brand-dark"
      }`}
      title={label}
    >
      <Icon className="h-5 w-5" />
      <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
        {label}
      </span>
    </div>
  );
  return (
    <Link to={to} className="flex justify-center">
      {content}
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
      <aside className="flex w-16 flex-col items-center border-r border-border bg-white py-4">
        <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
          SQ
        </div>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <NavIcon
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
        <header className="flex h-14 items-center justify-between border-b border-border bg-white px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight text-brand">
              Sales &amp; Quoting AI
            </h1>
            <span className="rounded-full bg-amber/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber">
              Prototype
            </span>
          </div>
          <div className="text-xs text-mid">Sumitomo Corporation Europe</div>
        </header>

        <main className="flex-1 overflow-auto">{children ?? <Outlet />}</main>
      </div>
    </div>
  );
}
