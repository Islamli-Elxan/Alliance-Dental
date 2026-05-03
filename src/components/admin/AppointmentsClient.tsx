"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AppointmentTable } from "./AppointmentTable";
import type { AdminAppointmentDto } from "@/app/api/admin/appointments/route";

const STATUS_OPTIONS: Array<{
  value: "" | AdminAppointmentDto["status"];
  label: string;
}> = [
  { value: "", label: "Bütün statuslar" },
  { value: "PENDING", label: "Gözləmədə" },
  { value: "CONFIRMED", label: "Təsdiqlənib" },
  { value: "COMPLETED", label: "Tamamlanıb" },
  { value: "CANCELLED", label: "Ləğv edilib" },
  { value: "NO_SHOW", label: "Gəlmədi" },
];

export function AppointmentsClient() {
  const [status, setStatus] = useState<"" | AdminAppointmentDto["status"]>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [q, setQ] = useState<string>("");
  const [appointments, setAppointments] = useState<AdminAppointmentDto[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (q.trim()) params.set("q", q.trim());
    params.set("limit", "200");
    return params.toString();
  }, [status, from, to, q]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/appointments?${queryString}`, { cache: "no-store" });
      const json: { data?: AdminAppointmentDto[]; error?: string } = await res.json();
      if (!res.ok || json.error || !json.data) {
        setError(json.error ?? "Yüklənmədi");
        setAppointments([]);
        return;
      }
      setAppointments(json.data);
    } catch {
      setError("Şəbəkə xətası");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl text-brand-navy">Görüşlər</h1>
        <p className="mt-1 text-sm text-brand-slate">
          Bütün görüşlər. Filtr seçərək siyahını dəqiqləşdirin.
        </p>
      </div>

      <div className="grid gap-3 rounded-xl border border-brand-gray-border bg-white p-4 shadow-card md:grid-cols-4">
        <div>
          <label className="block text-xs font-medium text-brand-slate">Status</label>
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as "" | AdminAppointmentDto["status"])
            }
            className="mt-1 w-full rounded-lg border border-brand-gray-border px-3 py-2 text-sm focus:border-brand-cyan focus:outline-none focus:ring-2 focus:ring-brand-cyan"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-brand-slate">Tarixdən</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-gray-border px-3 py-2 text-sm focus:border-brand-cyan focus:outline-none focus:ring-2 focus:ring-brand-cyan"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-brand-slate">Tarixə qədər</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-gray-border px-3 py-2 text-sm focus:border-brand-cyan focus:outline-none focus:ring-2 focus:ring-brand-cyan"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-brand-slate">Axtarış (ad / telefon)</label>
          <div className="mt-1 flex">
            <span className="inline-flex items-center rounded-l-lg border border-r-0 border-brand-gray-border bg-brand-gray-light px-3 text-brand-slate">
              <Search className="h-4 w-4" aria-hidden />
            </span>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Aysel / +99450..."
              className="w-full rounded-r-lg border border-brand-gray-border px-3 py-2 text-sm focus:border-brand-cyan focus:outline-none focus:ring-2 focus:ring-brand-cyan"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && appointments === null && (
        <div className="rounded-xl border border-brand-gray-border bg-white px-6 py-12 text-center text-sm text-brand-slate">
          Yüklənir...
        </div>
      )}

      {appointments !== null && (
        <AppointmentTable
          appointments={appointments}
          onUpdated={(next) =>
            setAppointments((curr) =>
              curr ? curr.map((a) => (a.id === next.id ? next : a)) : curr,
            )
          }
        />
      )}
    </div>
  );
}
