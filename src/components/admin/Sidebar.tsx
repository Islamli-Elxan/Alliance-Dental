"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  LogOut,
  Stethoscope,
  Settings,
  Users,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "İdarə paneli", icon: LayoutDashboard, exact: true },
  { href: "/admin/appointments", label: "Görüşlər", icon: Calendar, exact: false },
  { href: "/admin/patients", label: "Pasiyentlər", icon: Users, exact: false },
  { href: "/admin/doctors", label: "Həkimlər", icon: Stethoscope, exact: false },
  { href: "/admin/services", label: "Xidmətlər", icon: Settings, exact: false },
  { href: "/admin/notifications", label: "Bildirişlər", icon: MessageSquare, exact: false },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-full flex-col bg-brand-navy text-white">
      <div className="border-b border-white/10 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-cyan">
            <span className="text-base font-bold">A</span>
          </div>
          <div>
            <div className="text-base font-semibold">Alliance Dental</div>
            <div className="text-xs text-brand-cyan">Admin Panel</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-brand-cyan text-white"
                  : "text-white/80 hover:bg-white/5 hover:text-white",
              ].join(" ")}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-3 py-3">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Çıxış
        </button>
      </div>
    </aside>
  );
}
