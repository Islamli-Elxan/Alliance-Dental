"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Download, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { AppointmentTable } from "./AppointmentTable";
import { BookingWizard } from "@/components/booking/BookingWizard";
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

interface Meta {
  total: number;
  page: number;
  pageCount: number;
}

export function AppointmentsClient() {
  const [status, setStatus] = useState<"" | AdminAppointmentDto["status"]>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [q, setQ] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const limit = 20;

  const [appointments, setAppointments] = useState<AdminAppointmentDto[] | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (q.trim()) params.set("q", q.trim());
    params.set("limit", limit.toString());
    params.set("page", page.toString());
    return params.toString();
  }, [status, from, to, q, page]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/appointments?${queryString}`, { cache: "no-store" });
      const json: { data?: AdminAppointmentDto[]; meta?: Meta; error?: string } = await res.json();
      if (!res.ok || json.error || !json.data) {
        setError(json.error ?? "Yüklənmədi");
        setAppointments([]);
        setMeta(null);
        return;
      }
      setAppointments(json.data);
      setMeta(json.meta ?? null);
    } catch {
      setError("Şəbəkə xətası");
      setAppointments([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [status, from, to, q]);

  const handleExport = useCallback(() => {
    if (!appointments || appointments.length === 0) return;
    
    const headers = ["Tarix", "Saat", "Pasiyent", "Telefon", "Həkim", "Xidmət", "Qiymət", "Status", "Qeydlər"];
    const rows = appointments.map((a) => {
      const date = new Date(a.startTime);
      const dateStr = date.toLocaleDateString("az-AZ");
      const timeStr = date.toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" });
      return [
        dateStr,
        timeStr,
        `"${a.patientName}"`,
        a.patientPhone,
        `"${a.doctor.name}"`,
        `"${a.service.name}"`,
        a.priceAtBooking,
        a.status,
        `"${(a.notes || "").replace(/"/g, '""')}"`
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `gorusler_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [appointments]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Görüşlər</h1>
          <p className="mt-1 text-sm text-brand-slate">
            Bütün görüşləri idarə edin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewAppointmentModalOpen(true)}
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-brand-cyan px-4 py-2 text-sm font-medium text-white hover:bg-brand-cyan-dark transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Yeni görüş
          </button>
          <button
            onClick={handleExport}
            disabled={!appointments || appointments.length === 0}
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-white border border-brand-gray-border px-4 py-2 text-sm font-medium text-brand-slate hover:text-brand-cyan hover:border-brand-cyan transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Download className="h-4 w-4" />
            CSV Export
          </button>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-brand-gray-border bg-white p-4 shadow-card md:grid-cols-4">
        <div>
          <label className="block text-xs font-medium text-brand-slate">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "" | AdminAppointmentDto["status"])}
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
        <>
          <AppointmentTable
            appointments={appointments}
            onUpdated={(next) =>
              setAppointments((curr) =>
                curr ? curr.map((a) => (a.id === next.id ? next : a)) : curr,
              )
            }
          />

          {/* Pagination */}
          {meta && meta.pageCount > 1 && (
            <div className="flex items-center justify-between border-t border-brand-gray-border pt-4">
              <div className="text-sm text-brand-slate">
                Cəmi <span className="font-medium text-brand-navy">{meta.total}</span> görüş.
                Səhifə <span className="font-medium text-brand-navy">{meta.page}</span> / {meta.pageCount}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="inline-flex items-center gap-1 rounded-lg border border-brand-gray-border px-3 py-2 text-sm font-medium text-brand-slate hover:bg-brand-gray-light disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Əvvəlki
                </button>
                <button
                  onClick={() => setPage(p => Math.min(meta.pageCount, p + 1))}
                  disabled={page === meta.pageCount || loading}
                  className="inline-flex items-center gap-1 rounded-lg border border-brand-gray-border px-3 py-2 text-sm font-medium text-brand-slate hover:bg-brand-gray-light disabled:opacity-50"
                >
                  Növbəti
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {isNewAppointmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
          <div className="absolute inset-0 bg-brand-navy/60 backdrop-blur-sm" onClick={() => setIsNewAppointmentModalOpen(false)} />
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl animate-in zoom-in-95">
            <div className="sticky top-0 z-10 flex items-center justify-between bg-white border-b border-brand-gray-border px-6 py-4 rounded-t-2xl">
              <h2 className="text-lg font-bold text-brand-navy">Yeni Görüş Yarat</h2>
              <button
                onClick={() => setIsNewAppointmentModalOpen(false)}
                className="rounded-lg p-2 text-brand-slate hover:bg-brand-gray-light hover:text-brand-navy transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <BookingWizard
                onComplete={() => {
                  setIsNewAppointmentModalOpen(false);
                  void reload();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
