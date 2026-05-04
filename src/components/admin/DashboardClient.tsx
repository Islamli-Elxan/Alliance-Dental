"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Banknote,
  CalendarDays,
  TrendingUp,
  AlertTriangle,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  ArrowRight,
  Phone,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { KpiCard } from "./KpiCard";
import { DashboardCharts } from "./DashboardCharts";
import { AppointmentCalendar } from "./AppointmentCalendar";
import { AppointmentDetailDrawer } from "./AppointmentDetailDrawer";
import { StatusBadge } from "./StatusBadge";
import { formatPriceAzn, azDateTimeLong, formatTimeBaku } from "@/lib/utils";
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
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(async () => {
    try {
      setError(null);
      setRefreshing(true);
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
    } finally {
      setRefreshing(false);
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

  // Today's appointments
  const todayAppts = appointments
    ? appointments.filter((a) => {
        const today = new Date();
        const apptDate = new Date(a.startTime);
        return (
          apptDate.getFullYear() === today.getFullYear() &&
          apptDate.getMonth() === today.getMonth() &&
          apptDate.getDate() === today.getDate()
        );
      })
    : [];

  // Recent/upcoming (next 5 pending/confirmed)
  const upcomingAppts = appointments
    ? appointments
        .filter(
          (a) =>
            (a.status === "PENDING" || a.status === "CONFIRMED") &&
            new Date(a.startTime) >= new Date(),
        )
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .slice(0, 6)
    : [];

  // Recent completed/cancelled
  const recentActivity = appointments
    ? appointments
        .filter((a) => a.status === "COMPLETED" || a.status === "CANCELLED" || a.status === "NO_SHOW")
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 5)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">İdarə paneli</h1>
          <p className="mt-0.5 text-sm text-brand-slate/70">
            Bu ay üçün əsas göstəricilər və cədvəl
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void reload()}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-gray-border bg-white px-3 py-2 text-xs font-medium text-brand-slate transition-colors hover:border-brand-cyan hover:text-brand-cyan disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Yenilə
          </button>
          <Link
            href="/admin/appointments"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-cyan px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-cyan-dark"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Bütün görüşlər
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* KPI Cards */}
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

      {/* Quick Stats Row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickStat
          icon={<Clock className="h-4 w-4 text-amber-500" />}
          label="Gözləmədə"
          value={stats?.pendingCount.toString() ?? "—"}
          accent="amber"
        />
        <QuickStat
          icon={<CalendarDays className="h-4 w-4 text-brand-cyan" />}
          label="Növbəti 7 gün"
          value={stats?.upcomingNext7Days.toString() ?? "—"}
          accent="cyan"
        />
        <QuickStat
          icon={<Users className="h-4 w-4 text-emerald-500" />}
          label="Bugün"
          value={todayAppts.length.toString()}
          accent="emerald"
        />
        <QuickStat
          icon={<CheckCircle className="h-4 w-4 text-violet-500" />}
          label="Keçən ay"
          value={stats?.totalAppointmentsLastMonth.toString() ?? "—"}
          accent="violet"
        />
      </div>

      {/* Charts */}
      <DashboardCharts />

      {/* Today's Schedule + Upcoming side by side */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Today's Schedule */}
        <div className="rounded-xl border border-brand-gray-border bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-brand-gray-border px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                <Clock className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-brand-navy">Bugünkü cədvəl</h3>
                <p className="text-xs text-brand-slate/60">{todayAppts.length} görüş</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-brand-gray-border">
            {todayAppts.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <CalendarDays className="mx-auto h-8 w-8 text-brand-slate/20" />
                <p className="mt-2 text-sm text-brand-slate/50">Bu gün üçün görüş yoxdur</p>
              </div>
            ) : (
              todayAppts.slice(0, 8).map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelected(a)}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-brand-gray-light/50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-cyan-light text-xs font-bold text-brand-cyan">
                    {formatTimeBaku(new Date(a.startTime))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-brand-navy">
                        {a.patientName}
                      </span>
                      <StatusBadge status={a.status} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-brand-slate/60">
                      <span>{a.service.name}</span>
                      <span>·</span>
                      <span>{a.doctor.name}</span>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-brand-cyan">
                    {formatPriceAzn(a.priceAtBooking)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="rounded-xl border border-brand-gray-border bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-brand-gray-border px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-cyan-light">
                <CalendarDays className="h-4 w-4 text-brand-cyan" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-brand-navy">Yaxınlaşan görüşlər</h3>
                <p className="text-xs text-brand-slate/60">Gözləmədə və təsdiqlənmiş</p>
              </div>
            </div>
            <Link
              href="/admin/appointments"
              className="text-xs font-medium text-brand-cyan hover:underline"
            >
              Hamısı →
            </Link>
          </div>
          <div className="divide-y divide-brand-gray-border">
            {upcomingAppts.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <CheckCircle className="mx-auto h-8 w-8 text-brand-slate/20" />
                <p className="mt-2 text-sm text-brand-slate/50">Yaxınlaşan görüş yoxdur</p>
              </div>
            ) : (
              upcomingAppts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelected(a)}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-brand-gray-light/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-brand-navy">
                        {a.patientName}
                      </span>
                      <StatusBadge status={a.status} />
                    </div>
                    <div className="mt-0.5 text-xs text-brand-slate/60">
                      {azDateTimeLong(new Date(a.startTime))} · {a.doctor.name}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-semibold text-brand-cyan">
                      {formatPriceAzn(a.priceAtBooking)}
                    </div>
                    <div className="text-xs text-brand-slate/50">{a.service.name}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="rounded-xl border border-brand-gray-border bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-brand-gray-border px-5 py-4">
            <h3 className="text-sm font-semibold text-brand-navy">Son fəaliyyət</h3>
          </div>
          <div className="divide-y divide-brand-gray-border">
            {recentActivity.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  a.status === "COMPLETED" ? "bg-emerald-50" : a.status === "CANCELLED" ? "bg-red-50" : "bg-slate-100"
                }`}>
                  {a.status === "COMPLETED" ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  ) : a.status === "CANCELLED" ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-slate-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-sm text-brand-navy">
                    <span className="font-medium">{a.patientName}</span>
                    {" — "}
                    {a.status === "COMPLETED" ? "tamamlandı" : a.status === "CANCELLED" ? "ləğv edildi" : "gəlmədi"}
                  </span>
                  <div className="text-xs text-brand-slate/50">
                    {a.service.name} · {a.doctor.name}
                  </div>
                </div>
                <span className="shrink-0 text-xs text-brand-slate/50">
                  {formatTimeBaku(new Date(a.startTime))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Calendar */}
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

function QuickStat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-brand-gray-border bg-white px-4 py-3.5 shadow-card">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-${accent}-50`}>
        {icon}
      </div>
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-brand-slate/60">{label}</div>
        <div className="mt-0.5 text-lg font-bold text-brand-navy">{value}</div>
      </div>
    </div>
  );
}
