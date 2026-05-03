"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { NotificationLogTable } from "./NotificationLogTable";
import type { AdminNotificationDto } from "@/app/api/admin/notifications/route";

const STATUS_OPTIONS = [
  { value: "", label: "Bütün statuslar" },
  { value: "SENT", label: "Göndərildi" },
  { value: "PENDING", label: "Növbədə" },
  { value: "FAILED", label: "Uğursuz" },
  { value: "DELIVERED", label: "Çatdırıldı" },
] as const;

const TYPE_OPTIONS = [
  { value: "", label: "Bütün növlər" },
  { value: "BOOKING_CONFIRMATION", label: "Görüş təsdiqi" },
  { value: "REMINDER_24H", label: "24 saat xatırlatma" },
  { value: "REMINDER_2H", label: "2 saat xatırlatma" },
  { value: "CANCELLATION", label: "Ləğv bildirişi" },
] as const;

export function NotificationsClient() {
  const [status, setStatus] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [logs, setLogs] = useState<AdminNotificationDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (type) p.set("type", type);
    p.set("limit", "200");
    return p.toString();
  }, [status, type]);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/notifications?${queryString}`, { cache: "no-store" });
      const json: { data?: AdminNotificationDto[]; error?: string } = await res.json();
      if (!res.ok || json.error || !json.data) {
        setError(json.error ?? "Yüklənmədi");
        setLogs([]);
        return;
      }
      setLogs(json.data);
    } catch {
      setError("Şəbəkə xətası");
      setLogs([]);
    }
  }, [queryString]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl text-brand-navy">Bildirişlər</h1>
        <p className="mt-1 text-sm text-brand-slate">
          Göndərilən və uğursuz olan WhatsApp mesajları. Uğursuzları yenidən göndərin.
        </p>
      </div>

      <div className="grid gap-3 rounded-xl border border-brand-gray-border bg-white p-4 shadow-card md:grid-cols-3">
        <div>
          <label className="block text-xs font-medium text-brand-slate">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-gray-border px-3 py-2 text-sm focus:border-brand-cyan focus:outline-none focus:ring-2 focus:ring-brand-cyan"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-brand-slate">Növ</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-gray-border px-3 py-2 text-sm focus:border-brand-cyan focus:outline-none focus:ring-2 focus:ring-brand-cyan"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {logs === null && !error && (
        <div className="rounded-xl border border-brand-gray-border bg-white px-6 py-12 text-center text-sm text-brand-slate">
          Yüklənir...
        </div>
      )}

      {logs !== null && (
        <NotificationLogTable
          logs={logs}
          onUpdated={(next) =>
            setLogs((curr) =>
              curr ? curr.map((l) => (l.id === next.id ? next : l)) : curr,
            )
          }
        />
      )}
    </div>
  );
}
