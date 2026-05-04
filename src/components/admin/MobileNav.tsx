"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Menu,
  X,
  LayoutDashboard,
  Calendar,
  MessageSquare,
  LogOut,
  Stethoscope,
  Settings,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "İdarə paneli", icon: LayoutDashboard, exact: true },
  { href: "/admin/appointments", label: "Görüşlər", icon: Calendar, exact: false },
  { href: "/admin/doctors", label: "Həkimlər", icon: Stethoscope, exact: false },
  { href: "/admin/services", label: "Xidmətlər", icon: Settings, exact: false },
  { href: "/admin/notifications", label: "Bildirişlər", icon: MessageSquare, exact: false },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => setOpen(false), [pathname]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-brand-slate transition-colors hover:bg-brand-gray-light"
        aria-label={open ? "Menyunu bağla" : "Menyunu aç"}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-72 bg-brand-navy text-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-cyan">
                <span className="text-sm font-bold">A</span>
              </div>
              <div>
                <div className="text-sm font-semibold">Alliance Dental</div>
                <div className="text-xs text-brand-cyan">Admin Panel</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-white/60 hover:text-white"
              aria-label="Bağla"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {NAV.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-brand-cyan text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Signout */}
          <div className="border-t border-white/10 px-3 py-3">
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Çıxış
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
