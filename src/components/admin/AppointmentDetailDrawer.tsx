"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { azDateTimeLong, formatPriceAzn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import type { AdminAppointmentDto } from "@/app/api/admin/appointments/route";

interface AppointmentDetailDrawerProps {
  appointment: AdminAppointmentDto;
  onClose: () => void;
  onUpdated: (next: AdminAppointmentDto) => void;
}

const ACTIONS: Array<{
  label: string;
  status: AdminAppointmentDto["status"];
  variant: "primary" | "danger" | "neutral";
}> = [
  { label: "Təsdiqlə", status: "CONFIRMED", variant: "primary" },
  { label: "Tamamlandı", status: "COMPLETED", variant: "neutral" },
  { label: "Gəlmədi", status: "NO_SHOW", variant: "neutral" },
  { label: "Ləğv et", status: "CANCELLED", variant: "danger" },
];

export function AppointmentDetailDrawer({
  appointment,
  onClose,
  onUpdated,
}: AppointmentDetailDrawerProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function update(status: AdminAppointmentDto["status"]) {
    setBusy(status);
    setError(null);
    try {
      const res = await fetch(`/api/admin/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json: { data?: { status: AdminAppointmentDto["status"] }; error?: string } =
        await res.json();
      if (!res.ok || json.error || !json.data) {
        setError(json.error ?? "Yenilənmədi");
        return;
      }
      onUpdated({ ...appointment, status: json.data.status });
    } catch {
      setError("Şəbəkə xətası");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-stretch justify-end bg-brand-navy/40"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex h-full w-full max-w-md flex-col bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-brand-gray-border px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-brand-navy">Görüş detalları</h3>
            <p className="mt-0.5 text-xs text-brand-slate">
              {azDateTimeLong(new Date(appointment.startTime))}
            </p>
          </div>
          <button
            type="button"
            aria-label="Bağla"
            onClick={onClose}
            className="rounded-md p-1 text-brand-slate hover:bg-brand-gray-light hover:text-brand-navy"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase text-brand-slate">Status</span>
            <StatusBadge status={appointment.status} />
          </div>

          <div className="space-y-3 rounded-lg border border-brand-gray-border bg-brand-gray-light p-4 text-sm">
            <DetailRow label="Pasiyent" value={appointment.patientName} />
            <DetailRow label="Telefon" value={appointment.patientPhone} mono />
            <DetailRow label="Xidmət" value={appointment.service.name} />
            <DetailRow label="Həkim" value={appointment.doctor.name} />
            <DetailRow label="Qiymət" value={formatPriceAzn(appointment.priceAtBooking)} />
            {appointment.notes && <DetailRow label="Qeydlər" value={appointment.notes} />}
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="space-y-2 border-t border-brand-gray-border px-5 py-4">
          <div className="grid grid-cols-2 gap-2">
            {ACTIONS.map((a) => {
              const isCurrent = appointment.status === a.status;
              const isBusy = busy === a.status;
              const base =
                "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";
              const variant =
                a.variant === "primary"
                  ? "bg-brand-cyan text-white hover:bg-brand-cyan-dark"
                  : a.variant === "danger"
                    ? "border border-red-200 bg-white text-red-700 hover:bg-red-50"
                    : "border border-brand-gray-border bg-white text-brand-slate hover:border-brand-cyan hover:text-brand-cyan";
              return (
                <button
                  key={a.status}
                  type="button"
                  disabled={isCurrent || busy !== null}
                  onClick={() => update(a.status)}
                  className={`${base} ${variant}`}
                >
                  {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                  {a.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs uppercase tracking-wide text-brand-slate">{label}</span>
      <span
        className={[
          "text-right text-sm font-medium text-brand-navy",
          mono ? "font-mono" : "",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}
