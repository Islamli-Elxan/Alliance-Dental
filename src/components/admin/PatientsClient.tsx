"use client";

import { useEffect, useState } from "react";
import { Users, Phone, Search, Download, CalendarDays, Wallet } from "lucide-react";
import { formatPriceAzn, azDateLong } from "@/lib/utils";
import type { PatientDto } from "@/app/api/admin/patients/route";

export function PatientsClient() {
  const [patients, setPatients] = useState<PatientDto[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/patients");
        const json: { data?: PatientDto[]; error?: string } = await res.json();
        if (cancelled) return;
        if (!res.ok || json.error || !json.data) {
          setError(json.error ?? "Pasiyentlər yüklənmədi");
          return;
        }
        setPatients(json.data);
      } catch {
        if (!cancelled) setError("Şəbəkə xətası");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredPatients = patients?.filter((p) => {
    const search = q.toLowerCase();
    return (
      p.name.toLowerCase().includes(search) ||
      p.phone.includes(search)
    );
  }) ?? [];

  const handleExport = () => {
    if (!filteredPatients || filteredPatients.length === 0) return;
    
    const headers = ["Ad", "Telefon", "Görüş Sayı", "Son Ziyarət", "Ümumi Ödəniş"];
    const rows = filteredPatients.map((p) => {
      return [
        `"${p.name}"`,
        p.phone,
        p.appointmentCount,
        new Date(p.lastVisit).toLocaleDateString("az-AZ"),
        p.totalSpent,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pasiyentler_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy flex items-center gap-2">
            <Users className="h-6 w-6 text-brand-cyan" />
            Pasiyentlər
          </h1>
          <p className="mt-1 text-sm text-brand-slate">
            Görüşlərdən avtomatik formalaşan pasiyent bazası.
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={!filteredPatients || filteredPatients.length === 0}
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-white border border-brand-gray-border px-5 py-2.5 text-sm font-medium text-brand-slate hover:text-brand-cyan hover:border-brand-cyan transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4" />
          CSV Export
        </button>
      </div>

      <div className="rounded-xl border border-brand-gray-border bg-white p-4 shadow-card">
        <div className="max-w-md">
          <label className="block text-xs font-semibold uppercase tracking-wider text-brand-slate mb-1.5">
            Axtarış (Ad / Telefon)
          </label>
          <div className="flex shadow-sm rounded-xl focus-within:ring-4 focus-within:ring-brand-cyan/10 focus-within:border-brand-cyan transition-shadow">
            <span className="inline-flex items-center rounded-l-xl border border-r-0 border-brand-gray-border bg-brand-gray-light px-3 text-brand-slate">
              <Search className="h-4 w-4" aria-hidden />
            </span>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pasiyent adı və ya nömrəsi..."
              className="w-full rounded-r-xl border border-brand-gray-border px-3 py-2.5 text-sm focus:border-brand-cyan focus:outline-none"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 font-medium">
          {error}
        </div>
      )}

      {loading && !patients && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl border border-brand-gray-border bg-brand-gray-light/50" />
          ))}
        </div>
      )}

      {patients && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredPatients.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-brand-gray-border bg-brand-gray-light/30 px-6 py-12 text-center text-brand-slate font-medium">
              Heç bir pasiyent tapılmadı.
            </div>
          ) : (
            filteredPatients.map((p) => (
              <div
                key={p.phone}
                className="group rounded-2xl border border-brand-gray-border bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-brand-cyan/50 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-cyan/10 text-brand-cyan font-bold text-lg">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-brand-navy text-lg leading-tight">{p.name}</h3>
                      <a 
                        href={`tel:${p.phone}`} 
                        className="mt-1 flex items-center gap-1.5 text-sm text-brand-slate hover:text-brand-cyan transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {p.phone}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-brand-gray-border/60 pt-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-brand-slate flex items-center gap-1 mb-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Son Ziyarət
                    </div>
                    <div className="font-medium text-brand-navy text-sm">
                      {azDateLong(new Date(p.lastVisit))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-brand-slate flex items-center gap-1 mb-1">
                      <Wallet className="h-3.5 w-3.5" />
                      Cəmi (Xərclənən)
                    </div>
                    <div className="font-bold text-emerald-600 text-sm">
                      {formatPriceAzn(p.totalSpent)}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-brand-gray-border/40 flex justify-between items-center">
                  <span className="text-xs text-brand-slate font-medium">Görüş sayı:</span>
                  <span className="inline-flex items-center justify-center rounded-full bg-brand-navy px-2.5 py-0.5 text-xs font-bold text-white">
                    {p.appointmentCount}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
