"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, User, CheckCircle2 } from "lucide-react";
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
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
      <h2 className="text-xl text-brand-navy md:text-2xl font-bold">Həkim və vaxt seçin</h2>
      <p className="mt-1 text-sm text-brand-slate">
        Xidmət: <span className="font-medium text-brand-navy">{service.name}</span> ·{" "}
        {service.durationMinutes} dəq
      </p>

      {doctorsError && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 animate-in fade-in">
          {doctorsError}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Doctors */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-brand-navy uppercase tracking-wider">Həkim</h3>
          {doctors === null && !doctorsError && (
            <>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-2xl border border-brand-gray-border bg-brand-gray-light"
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
                  "relative flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200",
                  isActive
                    ? "border-brand-cyan bg-brand-cyan/5 shadow-md shadow-brand-cyan/10 ring-1 ring-brand-cyan"
                    : "border-brand-gray-border bg-white hover:border-brand-cyan/50 hover:shadow-sm hover:-translate-y-0.5",
                ].join(" ")}
                aria-pressed={isActive}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-cyan/10 text-base font-bold text-brand-cyan">
                  {initials(d.name) || <User className="h-5 w-5" aria-hidden />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-base font-bold text-brand-navy">{d.name}</div>
                  <div className="truncate text-sm text-brand-slate">{d.specialty}</div>
                </div>
                {isActive && (
                  <CheckCircle2 className="h-5 w-5 text-brand-cyan animate-in zoom-in" />
                )}
              </button>
            );
          })}
        </div>

        {/* Date + slots */}
        <div className="rounded-2xl border border-brand-gray-border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-brand-navy uppercase tracking-wider">Tarix seçin</h3>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Əvvəlki həftə"
                onClick={() => setWeekStartIso((iso) => addDaysIso(iso, -7))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-gray-border text-brand-slate hover:border-brand-cyan hover:text-brand-cyan hover:bg-brand-gray-light transition-colors"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Növbəti həftə"
                onClick={() => setWeekStartIso((iso) => addDaysIso(iso, 7))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-gray-border text-brand-slate hover:border-brand-cyan hover:text-brand-cyan hover:bg-brand-gray-light transition-colors"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2">
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
                    "flex flex-col items-center justify-center rounded-xl border py-2.5 text-sm transition-all duration-200",
                    isPast
                      ? "cursor-not-allowed border-brand-gray-border bg-brand-gray-light/50 text-brand-slate/40"
                      : isActive
                        ? "border-brand-cyan bg-brand-cyan text-white shadow-md shadow-brand-cyan/20 scale-105"
                        : "border-brand-gray-border bg-white text-brand-slate hover:border-brand-cyan hover:text-brand-cyan hover:-translate-y-0.5 hover:shadow-sm",
                  ].join(" ")}
                >
                  <span className="text-xs uppercase tracking-wider opacity-80">{azWeekdayShort(dateObj)}</span>
                  <span className="mt-1 text-lg font-bold">
                    {formatDateBaku(dateObj).slice(0, 2)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-brand-navy uppercase tracking-wider border-b border-brand-gray-border pb-2 mb-4">
              Boş vaxtlar — <span className="text-brand-cyan font-bold">{azDateLong(dateFromIso(activeDate))}</span>
            </h3>

            {slotsLoading && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-11 animate-pulse rounded-xl border border-brand-gray-border bg-brand-gray-light"
                  />
                ))}
              </div>
            )}

            {!slotsLoading && slotsError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 animate-in fade-in">
                {slotsError}
              </div>
            )}

            {!slotsLoading && !slotsError && slots !== null && slots.length === 0 && (
              <div className="rounded-xl border border-brand-gray-border bg-brand-gray-light/50 px-4 py-8 text-center animate-in fade-in">
                <p className="text-brand-navy font-medium">Bu gün üçün boş vaxt yoxdur.</p>
                <p className="text-sm text-brand-slate mt-1">Zəhmət olmasa başqa gün seçin.</p>
              </div>
            )}

            {!slotsLoading && slots && slots.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 animate-in fade-in">
                {slots.map((slot) => {
                  const isSelected = activeSlot?.startTime === slot.startTime;
                  return (
                    <button
                      key={slot.startTime}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => handleSlotClick(slot)}
                      className={[
                        "rounded-xl border py-2.5 text-sm font-medium transition-all duration-200",
                        !slot.available
                          ? "cursor-not-allowed border-brand-gray-border bg-brand-gray-light/50 text-brand-slate/40 line-through"
                          : isSelected
                            ? "border-brand-cyan bg-brand-cyan text-white shadow-md shadow-brand-cyan/20 scale-[1.02]"
                            : "border-brand-gray-border bg-white text-brand-navy hover:border-brand-cyan hover:text-brand-cyan hover:-translate-y-0.5 hover:shadow-sm",
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

      <div className="mt-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-brand-gray-border">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto inline-flex justify-center items-center gap-2 rounded-xl border border-brand-gray-border px-6 py-3 text-sm font-medium text-brand-slate transition-colors hover:border-brand-cyan hover:text-brand-cyan hover:bg-brand-gray-light"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Geri qayıt
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="w-full sm:w-auto inline-flex justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan-dark px-8 py-3 text-sm font-bold text-white shadow-md shadow-brand-cyan/20 transition-all hover:shadow-lg hover:shadow-brand-cyan/30 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
        >
          Növbəti addım
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
