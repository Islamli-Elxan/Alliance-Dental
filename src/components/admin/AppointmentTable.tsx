"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { azDateTimeLong, formatPriceAzn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import type { AdminAppointmentDto } from "@/app/api/admin/appointments/route";

interface AppointmentTableProps {
  appointments: AdminAppointmentDto[];
  onUpdated: (next: AdminAppointmentDto) => void;
}

const QUICK_ACTIONS: Array<{
  label: string;
  next: AdminAppointmentDto["status"];
  // status the row must currently be in to allow this action
  fromAny: AdminAppointmentDto["status"][];
}> = [
  { label: "Təsdiqlə", next: "CONFIRMED", fromAny: ["PENDING"] },
  { label: "Tamamlandı", next: "COMPLETED", fromAny: ["CONFIRMED", "PENDING"] },
  { label: "Ləğv et", next: "CANCELLED", fromAny: ["PENDING", "CONFIRMED"] },
];

export function AppointmentTable({ appointments, onUpdated }: AppointmentTableProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function update(id: string, status: AdminAppointmentDto["status"]) {
    setBusyId(`${id}:${status}`);
    setError(null);
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, {
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
      const target = appointments.find((a) => a.id === id);
      if (target) onUpdated({ ...target, status: json.data.status });
    } catch {
      setError("Şəbəkə xətası");
    } finally {
      setBusyId(null);
    }
  }

  if (appointments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-brand-gray-border bg-white px-6 py-12 text-center text-sm text-brand-slate">
        Heç bir görüş tapılmadı.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-brand-gray-border bg-white shadow-card">
      {error && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-brand-gray-border bg-brand-gray-light text-left text-xs uppercase tracking-wide text-brand-slate">
            <tr>
              <th className="px-4 py-3 font-medium">Tarix / Saat</th>
              <th className="px-4 py-3 font-medium">Pasiyent</th>
              <th className="px-4 py-3 font-medium">Həkim</th>
              <th className="px-4 py-3 font-medium">Xidmət</th>
              <th className="px-4 py-3 text-right font-medium">Qiymət</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Əməliyyatlar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-gray-border">
            {appointments.map((a) => (
              <tr key={a.id} className="hover:bg-brand-gray-light/60">
                <td className="px-4 py-3 align-top text-brand-navy">
                  {azDateTimeLong(new Date(a.startTime))}
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="font-medium text-brand-navy">{a.patientName}</div>
                  <div className="text-xs text-brand-slate">{a.patientPhone}</div>
                </td>
                <td className="px-4 py-3 align-top text-brand-slate">{a.doctor.name}</td>
                <td className="px-4 py-3 align-top text-brand-slate">{a.service.name}</td>
                <td className="px-4 py-3 text-right align-top text-brand-navy">
                  {formatPriceAzn(a.priceAtBooking)}
                </td>
                <td className="px-4 py-3 align-top">
                  <StatusBadge status={a.status} />
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    {QUICK_ACTIONS.filter((qa) => qa.fromAny.includes(a.status)).map((qa) => {
                      const key = `${a.id}:${qa.next}`;
                      const isBusy = busyId === key;
                      const variant =
                        qa.next === "CONFIRMED"
                          ? "bg-brand-cyan text-white hover:bg-brand-cyan-dark"
                          : qa.next === "CANCELLED"
                            ? "border border-red-200 bg-white text-red-700 hover:bg-red-50"
                            : "border border-brand-gray-border bg-white text-brand-slate hover:border-brand-cyan hover:text-brand-cyan";
                      return (
                        <button
                          key={key}
                          type="button"
                          disabled={busyId !== null}
                          onClick={() => update(a.id, qa.next)}
                          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variant}`}
                        >
                          {isBusy && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
                          {qa.label}
                        </button>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
