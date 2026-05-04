"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  Zap,
  Stethoscope,
  HeartPulse,
  ShieldCheck,
  ArrowRight,
  type LucideIcon,
  CheckCircle2,
} from "lucide-react";
import { formatPriceAzn } from "@/lib/utils";
import type { ServiceDto } from "./types";

interface Step1ServiceProps {
  selectedServiceId: string | null;
  onSelect: (service: ServiceDto) => void;
  onNext: () => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  zap: Zap,
  stethoscope: Stethoscope,
  "heart-pulse": HeartPulse,
  "shield-check": ShieldCheck,
};

function ServiceIcon({ name }: { name: string | null }) {
  const Icon = (name && ICON_MAP[name]) || Sparkles;
  return <Icon className="h-6 w-6 text-brand-cyan" aria-hidden />;
}

export function Step1Service({ selectedServiceId, onSelect, onNext }: Step1ServiceProps) {
  const [services, setServices] = useState<ServiceDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/services", { cache: "no-store" });
        const json: { data?: ServiceDto[]; error?: string } = await res.json();
        if (cancelled) return;
        if (!res.ok || json.error || !json.data) {
          setError(json.error ?? "Xidmətlər yüklənmədi");
          return;
        }
        setServices(json.data);
      } catch {
        if (!cancelled) setError("Şəbəkə xətası");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
      <h2 className="text-xl text-brand-navy md:text-2xl font-bold">Hansı xidməti istəyirsiniz?</h2>
      <p className="mt-1 text-sm text-brand-slate">
        İstədiyiniz proseduru seçin. Növbəti addımda həkim və vaxt seçəcəksiniz.
      </p>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 animate-in fade-in">
          {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services === null && !error && <ServiceSkeletons />}

        {services?.map((service) => {
          const isSelected = selectedServiceId === service.id;
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => onSelect(service)}
              className={[
                "relative flex flex-col items-start gap-4 rounded-2xl border p-5 text-left transition-all duration-200",
                isSelected
                  ? "border-brand-cyan bg-brand-cyan/5 shadow-md shadow-brand-cyan/10 ring-1 ring-brand-cyan"
                  : "border-brand-gray-border bg-white hover:border-brand-cyan/50 hover:shadow-sm hover:-translate-y-0.5",
              ].join(" ")}
              aria-pressed={isSelected}
            >
              <div className="flex w-full items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-cyan/10">
                  <ServiceIcon name={service.iconName} />
                </div>
                {isSelected && (
                  <CheckCircle2 className="h-5 w-5 text-brand-cyan animate-in zoom-in" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-brand-navy text-lg leading-tight">{service.name}</div>
                {service.description && (
                  <p className="mt-1.5 text-sm text-brand-slate leading-snug line-clamp-2">{service.description}</p>
                )}
              </div>
              <div className="mt-2 flex w-full items-center justify-between border-t border-brand-gray-border/60 pt-4">
                <span className="flex items-center gap-1.5 rounded-lg bg-brand-gray-light px-2.5 py-1 text-xs font-medium text-brand-slate">
                  {service.durationMinutes} dəq
                </span>
                <span className="rounded-lg bg-brand-cyan/10 px-2.5 py-1 text-sm font-bold text-brand-cyan">
                  {formatPriceAzn(service.price)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-end border-t border-brand-gray-border pt-4">
        <button
          type="button"
          onClick={onNext}
          disabled={!selectedServiceId}
          className="w-full sm:w-auto inline-flex justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan-dark px-8 py-3 text-sm font-bold text-white shadow-md shadow-brand-cyan/20 transition-all hover:shadow-lg hover:shadow-brand-cyan/30 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
        >
          Növbəti addım
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function ServiceSkeletons() {
  return (
    <>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-48 animate-pulse rounded-2xl border border-brand-gray-border bg-brand-gray-light"
        />
      ))}
    </>
  );
}
