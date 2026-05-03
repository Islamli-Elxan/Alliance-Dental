"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, User } from "lucide-react";
import {
  CLINIC_TIMEZONE,
  azWeekdayShort,
  formatDateBaku,
  azDateLong,
} from "@/lib/utils";
import { formatInTimeZone } from "date-fns-tz";
import type { DoctorDto, ServiceDto, TimeSlotDto } from "./types";

interface Step2DoctorProps {
  service: ServiceDto;
  selected: { doctor: DoctorDto; date: string; slot: TimeSlotDto } | null;
  onSelect: (doctor: DoctorDto, date: string, slot: TimeSlotDto) => void;
  onBack: () => void;
  onNext: () => void;
}

function todayIsoInBaku(): string {
  return formatInTimeZone(new Date(), CLINIC_TIMEZONE, "yyyy-MM-dd");
}

function addDaysIso(iso: string, days: number): string {
  // Use noon UTC to avoid DST edge cases when adding days.
  const [y, m, d] = iso.split("-").map((s) => Number.parseInt(s, 10));
  const base = new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1, 12, 0, 0));
  base.setUTCDate(base.getUTCDate() + days);
  return formatInTimeZone(base, CLINIC_TIMEZONE, "yyyy-MM-dd");
}

function dateFromIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map((s) => Number.parseInt(s, 10));
  return new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1, 12, 0, 0));
}

function initials(name: string): string {
  const parts = name.replace(/^Dr\.?\s*/i, "").trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join("");
}

export function Step2Doctor({ service, selected, onSelect, onBack, onNext }: Step2DoctorProps) {
  const [doctors, setDoctors] = useState<DoctorDto[] | null>(null);
  const [doctorsError, setDoctorsError] = useState<string | null>(null);
  const [activeDoctorId, setActiveDoctorId] = useState<string | null>(selected?.doctor.id ?? null);
  const [activeDate, setActiveDate] = useState<string>(selected?.date ?? todayIsoInBaku());
  const [weekStartIso, setWeekStartIso] = useState<string>(() => activeDate);
  const [activeSlot, setActiveSlot] = useState<TimeSlotDto | null>(selected?.slot ?? null);
  const [slots, setSlots] = useState<TimeSlotDto[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Load doctors once
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/doctors", { cache: "no-store" });
        const json: { data?: DoctorDto[]; error?: string } = await res.json();
        if (cancelled) return;
        if (!res.ok || json.error || !json.data) {
          setDoctorsError(json.error ?? "Həkimlər yüklənmədi");
          return;
        }
        setDoctors(json.data);
        if (!activeDoctorId && json.data[0]) {
          setActiveDoctorId(json.data[0].id);
        }
      } catch {
        if (!cancelled) setDoctorsError("Şəbəkə xətası");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load slots whenever doctor or date changes
  useEffect(() => {
    if (!activeDoctorId) return;
    let cancelled = false;
    setSlotsLoading(true);
    setSlotsError(null);
    setSlots(null);

    async function load() {
      try {
        const params = new URLSearchParams({
          doctorId: activeDoctorId!,
          serviceId: service.id,
          date: activeDate,
        });
        const res = await fetch(`/api/slots?${params.toString()}`, { cache: "no-store" });
        const json: { data?: TimeSlotDto[]; error?: string } = await res.json();
        if (cancelled) return;
        if (!res.ok || json.error || !json.data) {
          setSlotsError(json.error ?? "Vaxtlar yüklənmədi");
          setSlots([]);
          return;
        }
        setSlots(json.data);
      } catch {
        if (!cancelled) {
          setSlotsError("Şəbəkə xətası");
          setSlots([]);
        }
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [activeDoctorId, activeDate, service.id]);

  // Reset slot selection when changing doctor or date (unless the same one is still valid)
  useEffect(() => {
    setActiveSlot((current) => {
      if (!current) return null;
      const stillThere = slots?.find((s) => s.startTime === current.startTime && s.available);
      return stillThere ?? null;
    });
  }, [slots]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDaysIso(weekStartIso, i));
  }, [weekStartIso]);

  const todayIso = useMemo(() => todayIsoInBaku(), []);

  const activeDoctor = useMemo(
    () => doctors?.find((d) => d.id === activeDoctorId) ?? null,
    [doctors, activeDoctorId],
  );

  const handleSlotClick = useCallback(
    (slot: TimeSlotDto) => {
      if (!slot.available || !activeDoctor) return;
      setActiveSlot(slot);
      onSelect(activeDoctor, activeDate, slot);
    },
    [activeDoctor, activeDate, onSelect],
  );

  const canProceed = activeDoctor !== null && activeSlot !== null;

  return (
    <div>
      <h2 className="text-xl text-brand-navy md:text-2xl">Həkim və vaxt seçin</h2>
      <p className="mt-1 text-sm text-brand-slate">
        Xidmət: <span className="font-medium text-brand-navy">{service.name}</span> ·{" "}
        {service.durationMinutes} dəq
      </p>

      {doctorsError && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {doctorsError}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Doctors */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-brand-navy">Həkim</h3>
          {doctors === null && !doctorsError && (
            <>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-lg border border-brand-gray-border bg-brand-gray-light"
                />
              ))}
            </>
          )}
          {doctors?.map((d) => {
            const isActive = d.id === activeDoctorId;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setActiveDoctorId(d.id)}
                className={[
                  "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                  isActive
                    ? "border-brand-cyan bg-brand-cyan-light"
                    : "border-brand-gray-border bg-white hover:border-brand-cyan",
                ].join(" ")}
                aria-pressed={isActive}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-cyan-light text-sm font-semibold text-brand-cyan">
                  {initials(d.name) || <User className="h-4 w-4" aria-hidden />}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-brand-navy">{d.name}</div>
                  <div className="truncate text-sm text-brand-slate">{d.specialty}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Date + slots */}
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-brand-navy">Tarix seçin</h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Əvvəlki həftə"
                onClick={() => setWeekStartIso((iso) => addDaysIso(iso, -7))}
                className="rounded-md border border-brand-gray-border p-1.5 text-brand-slate hover:border-brand-cyan hover:text-brand-cyan"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Növbəti həftə"
                onClick={() => setWeekStartIso((iso) => addDaysIso(iso, 7))}
                className="rounded-md border border-brand-gray-border p-1.5 text-brand-slate hover:border-brand-cyan hover:text-brand-cyan"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1.5">
            {weekDays.map((iso) => {
              const dateObj = dateFromIso(iso);
              const isPast = iso < todayIso;
              const isActive = iso === activeDate;
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={isPast}
                  onClick={() => setActiveDate(iso)}
                  aria-pressed={isActive}
                  className={[
                    "flex flex-col items-center justify-center rounded-lg border px-1 py-2 text-sm transition-colors",
                    isPast
                      ? "cursor-not-allowed border-brand-gray-border bg-brand-gray-light text-slate-300"
                      : isActive
                        ? "border-brand-cyan bg-brand-cyan text-white"
                        : "border-brand-gray-border bg-white text-brand-slate hover:border-brand-cyan hover:text-brand-cyan",
                  ].join(" ")}
                >
                  <span className="text-xs uppercase">{azWeekdayShort(dateObj)}</span>
                  <span className="mt-0.5 font-semibold">
                    {formatDateBaku(dateObj).slice(0, 2)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-brand-navy">
              Boş vaxtlar — {azDateLong(dateFromIso(activeDate))}
            </h3>

            {slotsLoading && (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 animate-pulse rounded-lg border border-brand-gray-border bg-brand-gray-light"
                  />
                ))}
              </div>
            )}

            {!slotsLoading && slotsError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {slotsError}
              </div>
            )}

            {!slotsLoading && !slotsError && slots !== null && slots.length === 0 && (
              <div className="mt-3 rounded-lg border border-brand-gray-border bg-brand-gray-light px-4 py-6 text-center text-sm text-brand-slate">
                Bu gün bu həkim üçün boş vaxt yoxdur. Başqa gün seçin.
              </div>
            )}

            {!slotsLoading && slots && slots.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {slots.map((slot) => {
                  const isSelected = activeSlot?.startTime === slot.startTime;
                  return (
                    <button
                      key={slot.startTime}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => handleSlotClick(slot)}
                      className={[
                        "rounded-lg border px-3 py-2 text-sm transition-colors",
                        !slot.available
                          ? "cursor-not-allowed border-brand-gray-border bg-brand-gray-light text-slate-300 line-through"
                          : isSelected
                            ? "border-brand-cyan bg-brand-cyan text-white"
                            : "border-brand-gray-border bg-white text-brand-navy hover:border-brand-cyan hover:text-brand-cyan",
                      ].join(" ")}
                    >
                      {slot.displayTime}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-brand-gray-border px-5 py-2.5 text-brand-slate transition-colors hover:border-brand-cyan hover:text-brand-cyan"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Geri
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-cyan px-5 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-brand-cyan-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          Növbəti
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
