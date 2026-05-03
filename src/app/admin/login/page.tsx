import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata = {
  title: "Admin daxil ol · Alliance Dental",
};

// useSearchParams in <LoginForm /> bails this page out of static generation.
export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-gray-light px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-cyan">
            <span className="text-lg font-bold text-white">A</span>
          </div>
          <h1 className="text-2xl text-brand-navy">Admin Panel</h1>
          <p className="mt-1 text-sm text-brand-slate">Alliance Dental Clinic</p>
        </div>

        <div className="rounded-xl border border-brand-gray-border bg-white p-6 shadow-card md:p-8">
          <Suspense fallback={<LoginFormSkeleton />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-4 text-center text-xs text-brand-slate">
          Demo: <span className="font-mono">admin@alliance.az</span> /{" "}
          <span className="font-mono">demo2024</span>
        </p>
      </div>
    </main>
  );
}

function LoginFormSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="h-10 animate-pulse rounded-lg bg-brand-gray-light" />
      <div className="h-10 animate-pulse rounded-lg bg-brand-gray-light" />
      <div className="h-10 animate-pulse rounded-lg bg-brand-cyan-light" />
    </div>
  );
}
