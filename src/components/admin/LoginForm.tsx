"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertCircle, Loader2 } from "lucide-react";

export function LoginForm() {
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl") ?? "/admin";
  // Prevent open redirect — only allow internal /admin paths
  const callbackUrl = rawCallback.startsWith("/admin") ? rawCallback : "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (!res || res.error) {
        setError("Email və ya şifrə yanlışdır");
        return;
      }
      window.location.href = callbackUrl;
    } catch {
      setError("Daxil olmaq mümkün olmadı");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-brand-navy">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-brand-gray-border px-4 py-2.5 focus:border-brand-cyan focus:outline-none focus:ring-2 focus:ring-brand-cyan"
          placeholder="admin@alliance.az"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-brand-navy">
          Şifrə
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-brand-gray-border px-4 py-2.5 focus:border-brand-cyan focus:outline-none focus:ring-2 focus:ring-brand-cyan"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-cyan px-5 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-brand-cyan-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Yoxlanılır...
          </>
        ) : (
          "Daxil ol"
        )}
      </button>
    </form>
  );
}
