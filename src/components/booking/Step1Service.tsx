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
    <div>
      <h2 className="text-xl text-brand-navy md:text-2xl">Hansı xidməti istəyirsiniz?</h2>
      <p className="mt-1 text-sm text-brand-slate">
        İstədiyiniz proseduru seçin. Növbəti addımda həkim və vaxt seçəcəksiniz.
      </p>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {services === null && !error && <ServiceSkeletons />}

        {services?.map((service) => {
          const isSelected = selectedServiceId === service.id;
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => onSelect(service)}
              className={[
                "flex flex-col items-start gap-3 rounded-xl border p-5 text-left transition-colors",
                isSelected
                  ? "border-brand-cyan bg-brand-cyan-light"
                  : "border-brand-gray-border bg-white hover:border-brand-cyan",
              ].join(" ")}
              aria-pressed={isSelected}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-cyan-light">
                <ServiceIcon name={service.iconName} />
              </div>
              <div>
                <div className="font-medium text-brand-navy">{service.name}</div>
                {service.description && (
                  <p className="mt-1 text-sm text-brand-slate">{service.description}</p>
                )}
              </div>
              <div className="mt-auto flex items-center gap-2">
                <span className="rounded-md bg-brand-gray-light px-2 py-1 text-sm text-brand-slate">
                  {service.durationMinutes} dəq
                </span>
                <span className="rounded-md bg-brand-cyan-light px-2 py-1 text-sm font-medium text-brand-cyan">
                  {formatPriceAzn(service.price)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={onNext}
          disabled={!selectedServiceId}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-cyan px-5 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-brand-cyan-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          Növbəti
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
          className="h-40 animate-pulse rounded-xl border border-brand-gray-border bg-brand-gray-light"
        />
      ))}
    </>
  );
}
