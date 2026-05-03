"use client";

import { useCallback, useEffect, useState } from "react";
import { Banknote, CalendarDays, TrendingUp, AlertTriangle } from "lucide-react";
import { KpiCard } from "./KpiCard";
import { AppointmentCalendar } from "./AppointmentCalendar";
import { AppointmentDetailDrawer } from "./AppointmentDetailDrawer";
import type { AdminAppointmentDto } from "@/app/api/admin/appointments/route";

interface AdminStatsDto {
  monthRevenueDisplay: string;
  retentionPercent: number;
  totalAppointmentsThisMonth: number;
  totalAppointmentsLastMonth: number;
  noShowCountThisMonth: number;
  pendingCount: number;
  upcomingNext7Days: number;
}

export function DashboardClient() {
  const [stats, setStats] = useState<AdminStatsDto | null>(null);
  const [appointments, setAppointments] = useState<AdminAppointmentDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminAppointmentDto | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      const [statsRes, apptRes] = await Promise.all([
        fetch("/api/admin/stats", { cache: "no-store" }),
        fetch("/api/admin/appointments?limit=200", { cache: "no-store" }),
      ]);
      const statsJson: { data?: AdminStatsDto; error?: string } = await statsRes.json();
      const apptJson: { data?: AdminAppointmentDto[]; error?: string } = await apptRes.json();
      if (statsJson.data) setStats(statsJson.data);
      else setError(statsJson.error ?? "Statistika yüklənmədi");
      if (apptJson.data) setAppointments(apptJson.data);
    } catch {
      setError("Şəbəkə xətası");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const monthDelta =
    stats != null
      ? stats.totalAppointmentsThisMonth - stats.totalAppointmentsLastMonth
      : 0;
  const monthTrend =
    monthDelta > 0 ? "up" : monthDelta < 0 ? "down" : "flat";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-brand-navy">İdarə paneli</h1>
        <p className="mt-1 text-sm text-brand-slate">
          Bu ay üçün əsas göstəricilər və həftəlik cədvəl.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Bu ay gəlir"
          value={stats?.monthRevenueDisplay ?? "—"}
          hint="Təsdiqlənən və tamamlanan görüşlər"
          icon={Banknote}
        />
        <KpiCard
          label="Ləğv olunmayan görüşlər"
          value={stats ? `${stats.retentionPercent}%` : "—"}
          hint="Bu ay (PENDING+CONFIRMED+COMPLETED) / cəmi"
          icon={TrendingUp}
        />
        <KpiCard
          label="Cəmi görüşlər"
          value={stats?.totalAppointmentsThisMonth.toString() ?? "—"}
          trend={stats ? monthTrend : null}
          trendLabel={
            stats
              ? `${monthDelta >= 0 ? "+" : ""}${monthDelta} keçən ay ilə`
              : undefined
          }
          icon={CalendarDays}
        />
        <KpiCard
          label="No-Show"
          value={stats?.noShowCountThisMonth.toString() ?? "—"}
          hint="Bu ay gəlməyən pasiyentlər"
          tone={stats && stats.noShowCountThisMonth > 0 ? "danger" : "default"}
          icon={AlertTriangle}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat
          label="Gözləmədə olan görüşlər"
          value={stats?.pendingCount.toString() ?? "—"}
        />
        <MiniStat
          label="Növbəti 7 gündə"
          value={stats?.upcomingNext7Days.toString() ?? "—"}
        />
        <MiniStat
          label="Keçən ay görüşləri"
          value={stats?.totalAppointmentsLastMonth.toString() ?? "—"}
        />
        <MiniStat
          label="Cəmi yüklənmiş görüşlər"
          value={appointments ? appointments.length.toString() : "—"}
        />
      </div>

      {appointments !== null && (
        <AppointmentCalendar
          appointments={appointments}
          onSelect={(a) => setSelected(a)}
        />
      )}

      {selected && (
        <AppointmentDetailDrawer
          appointment={selected}
          onClose={() => setSelected(null)}
          onUpdated={(next) => {
            setAppointments((curr) =>
              curr ? curr.map((a) => (a.id === next.id ? next : a)) : curr,
            );
            setSelected(next);
            void reload();
          }}
        />
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-brand-gray-border bg-white px-4 py-3 shadow-card">
      <div className="text-xs uppercase tracking-wide text-brand-slate">{label}</div>
      <div className="mt-1 text-lg font-semibold text-brand-navy">{value}</div>
    </div>
  );
}
