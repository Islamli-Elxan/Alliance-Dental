"use client";

import { useState } from "react";
import { Loader2, RefreshCw, MessageSquare } from "lucide-react";
import { formatDateTimeBaku } from "@/lib/utils";
import type { AdminNotificationDto } from "@/app/api/admin/notifications/route";

interface NotificationLogTableProps {
  logs: AdminNotificationDto[];
  onUpdated: (next: AdminNotificationDto) => void;
}

const TYPE_LABELS: Record<string, string> = {
  BOOKING_CONFIRMATION: "Görüş təsdiqi",
  REMINDER_24H: "24 saat xatırlatma",
  REMINDER_2H: "2 saat xatırlatma",
  CANCELLATION: "Ləğv bildirişi",
};

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  SENT: { label: "Göndərildi", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  PENDING: { label: "Növbədə", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  FAILED: { label: "Uğursuz", cls: "bg-red-50 text-red-700 border-red-200" },
  DELIVERED: { label: "Çatdırıldı", cls: "bg-brand-cyan-light text-brand-cyan border-brand-cyan" },
};

export function NotificationLogTable({ logs, onUpdated }: NotificationLogTableProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function retry(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/notifications/${id}/retry`, { method: "POST" });
      const json: {
        data?: { id: string; status: string; sentAt: string | null; errorMessage: string | null };
        error?: string;
      } = await res.json();
      if (!res.ok || json.error || !json.data) {
        setError(json.error ?? "Yenidən göndərilmədi");
        return;
      }
      const log = logs.find((l) => l.id === id);
      if (log) {
        onUpdated({
          ...log,
          status: json.data.status,
          sentAt: json.data.sentAt,
          errorMessage: json.data.errorMessage,
          retryCount: log.retryCount + (json.data.status === "SENT" ? 0 : 1),
        });
      }
    } catch {
      setError("Şəbəkə xətası");
    } finally {
      setBusyId(null);
    }
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-brand-gray-border bg-white px-6 py-12 text-center text-sm text-brand-slate">
        Heç bir bildiriş tapılmadı.
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
              <th className="px-4 py-3 font-medium">Vaxt</th>
              <th className="px-4 py-3 font-medium">Pasiyent</th>
              <th className="px-4 py-3 font-medium">Növ</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Xəta</th>
              <th className="px-4 py-3 text-right font-medium">Əməliyyatlar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-gray-border">
            {logs.map((log) => {
              const status = STATUS_STYLES[log.status] ?? {
                label: log.status,
                cls: "bg-slate-100 text-slate-600 border-slate-200",
              };
              const isFailed = log.status === "FAILED";
              const isExpanded = expanded === log.id;
              return (
                <tr
                  key={log.id}
                  className={isFailed ? "bg-red-50/40" : "hover:bg-brand-gray-light/60"}
                >
                  <td className="px-4 py-3 align-top text-brand-navy">
                    <div>{formatDateTimeBaku(new Date(log.sentAt ?? log.createdAt))}</div>
                    {log.retryCount > 0 && (
                      <div className="text-xs text-brand-slate">{log.retryCount}× cəhd</div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium text-brand-navy">
                      {log.appointment.patientName}
                    </div>
                    <div className="font-mono text-xs text-brand-slate">
                      {log.appointment.patientPhone}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-brand-slate">
                    {TYPE_LABELS[log.type] ?? log.type}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.cls}`}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-red-700">
                    {log.errorMessage ?? "—"}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setExpanded(isExpanded ? null : log.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-brand-gray-border bg-white px-2.5 py-1 text-xs text-brand-slate hover:border-brand-cyan hover:text-brand-cyan"
                      >
                        <MessageSquare className="h-3 w-3" aria-hidden />
                        {isExpanded ? "Bağla" : "Mesaj"}
                      </button>
                      {isFailed && (
                        <button
                          type="button"
                          disabled={busyId !== null}
                          onClick={() => retry(log.id)}
                          className="inline-flex items-center gap-1 rounded-md bg-brand-cyan px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-cyan-dark disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {busyId === log.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                          ) : (
                            <RefreshCw className="h-3 w-3" aria-hidden />
                          )}
                          Yenidən
                        </button>
                      )}
                    </div>

                    {isExpanded && (
                      <pre className="mt-3 max-w-xs overflow-x-auto whitespace-pre-wrap rounded-md border border-brand-gray-border bg-brand-gray-light p-3 text-left text-xs text-brand-slate">
                        {log.messageText}
                      </pre>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
