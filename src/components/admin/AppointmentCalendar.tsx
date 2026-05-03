"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import {
  CLINIC_TIMEZONE,
  azDateLong,
  azWeekdayShort,
  formatTimeBaku,
} from "@/lib/utils";
import type { AdminAppointmentDto } from "@/app/api/admin/appointments/route";

interface AppointmentCalendarProps {
  appointments: AdminAppointmentDto[];
  onSelect?: (appt: AdminAppointmentDto) => void;
}

const STATUS_PILL: Record<AdminAppointmentDto["status"], string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-brand-cyan-light text-brand-cyan border-brand-cyan",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  NO_SHOW: "bg-slate-100 text-slate-600 border-slate-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function startOfIsoWeekUtcDate(d: Date): Date {
  // Compute the Monday 00:00 in clinic timezone for the week containing `d`.
  const isoDay = Number.parseInt(formatInTimeZone(d, CLINIC_TIMEZONE, "i"), 10);
  const dateOnly = formatInTimeZone(d, CLINIC_TIMEZONE, "yyyy-MM-dd");
  const [y, mo, da] = dateOnly.split("-").map((s) => Number.parseInt(s, 10));
  const ref = new Date(Date.UTC(y ?? 0, (mo ?? 1) - 1, da ?? 1, 12, 0, 0));
  ref.setUTCDate(ref.getUTCDate() - (isoDay - 1));
  return ref;
}

function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setUTCDate(c.getUTCDate() + n);
  return c;
}

function bakuDateKey(iso: string): string {
  return formatInTimeZone(new Date(iso), CLINIC_TIMEZONE, "yyyy-MM-dd");
}

export function AppointmentCalendar({ appointments, onSelect }: AppointmentCalendarProps) {
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const weekStart = useMemo(() => startOfIsoWeekUtcDate(anchor), [anchor]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const apptsByDay = useMemo(() => {
    const map = new Map<string, AdminAppointmentDto[]>();
    for (const a of appointments) {
      const key = bakuDateKey(a.startTime);
      const arr = map.get(key) ?? [];
      arr.push(a);
      map.set(key, arr);
    }
    Array.from(map.values()).forEach((arr) => {
      arr.sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    return map;
  }, [appointments]);

  const todayKey = formatInTimeZone(new Date(), CLINIC_TIMEZONE, "yyyy-MM-dd");

  return (
    <div className="rounded-xl border border-brand-gray-border bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-brand-gray-border px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-brand-navy">Həftəlik cədvəl</h2>
          <p className="text-xs text-brand-slate">
            {azDateLong(days[0]!)} — {azDateLong(days[6]!)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Əvvəlki həftə"
            onClick={() => setAnchor((d) => addDays(d, -7))}
            className="rounded-md border border-brand-gray-border p-1.5 text-brand-slate hover:border-brand-cyan hover:text-brand-cyan"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setAnchor(new Date())}
            className="rounded-md border border-brand-gray-border px-2.5 py-1.5 text-xs text-brand-slate hover:border-brand-cyan hover:text-brand-cyan"
          >
            Bu həftə
          </button>
          <button
            type="button"
            aria-label="Növbəti həftə"
            onClick={() => setAnchor((d) => addDays(d, 7))}
            className="rounded-md border border-brand-gray-border p-1.5 text-brand-slate hover:border-brand-cyan hover:text-brand-cyan"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-brand-gray-border md:grid-cols-7 md:divide-x md:divide-y-0">
        {days.map((day) => {
          const key = formatInTimeZone(day, CLINIC_TIMEZONE, "yyyy-MM-dd");
          const dayAppts = apptsByDay.get(key) ?? [];
          const isToday = key === todayKey;
          return (
            <div key={key} className="min-h-[180px] p-3">
              <div className="mb-2 flex items-baseline justify-between">
                <div className="text-xs font-medium uppercase text-brand-slate">
                  {azWeekdayShort(day)}
                </div>
                <div
                  className={[
                    "text-sm font-semibold",
                    isToday ? "text-brand-cyan" : "text-brand-navy",
                  ].join(" ")}
                >
                  {formatInTimeZone(day, CLINIC_TIMEZONE, "d")}
                </div>
              </div>
              <div className="space-y-1.5">
                {dayAppts.length === 0 && (
                  <div className="rounded-md border border-dashed border-brand-gray-border px-2 py-2 text-center text-xs text-brand-slate">
                    Boş
                  </div>
                )}
                {dayAppts.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => onSelect?.(a)}
                    className={`block w-full rounded-md border px-2 py-1.5 text-left text-xs transition-colors hover:opacity-90 ${STATUS_PILL[a.status]}`}
                  >
                    <div className="font-mono font-semibold">
                      {formatTimeBaku(new Date(a.startTime))}
                    </div>
                    <div className="truncate">{a.patientName}</div>
                    <div className="truncate text-[11px] opacity-75">{a.service.name}</div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
