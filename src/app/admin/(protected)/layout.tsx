import { Sidebar } from "@/components/admin/Sidebar";
import { MobileNav } from "@/components/admin/MobileNav";
import type { ReactNode } from "react";

export const metadata = {
  title: "Admin · Alliance Dental",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-brand-gray-light">
      {/* Desktop sidebar */}
      <div className="hidden w-64 shrink-0 md:block">
        <div className="sticky top-0 h-screen overflow-y-auto">
          <Sidebar />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-brand-gray-border bg-white px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-cyan">
              <span className="text-sm font-bold text-white">A</span>
            </div>
            <span className="text-sm font-semibold text-brand-navy">Alliance Admin</span>
          </div>
          <MobileNav />
        </div>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
