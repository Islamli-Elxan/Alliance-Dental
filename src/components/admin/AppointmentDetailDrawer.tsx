"use client";

import { useState } from "react";
import {
  X,
  Loader2,
  Phone,
  MessageCircle,
  Clock,
  User,
  Stethoscope,
  CalendarDays,
  Banknote,
  FileText,
  Send,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { azDateTimeLong, formatPriceAzn, formatTimeBaku, azDateLong } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import { useToast } from "@/components/ui/Toast";
import type { AdminAppointmentDto } from "@/app/api/admin/appointments/route";

interface AppointmentDetailDrawerProps {
  appointment: AdminAppointmentDto;
  onClose: () => void;
  onUpdated: (next: AdminAppointmentDto) => void;
}

const STATUS_ACTIONS: Array<{
  label: string;
  status: AdminAppointmentDto["status"];
  variant: "primary" | "danger" | "neutral" | "warning";
  icon: typeof CheckCircle;
}> = [
  { label: "Təsdiqlə", status: "CONFIRMED", variant: "primary", icon: CheckCircle },
  { label: "Tamamlandı", status: "COMPLETED", variant: "neutral", icon: CheckCircle },
  { label: "Gəlmədi", status: "NO_SHOW", variant: "warning", icon: AlertCircle },
  { label: "Ləğv et", status: "CANCELLED", variant: "danger", icon: X },
];

export function AppointmentDetailDrawer({
  appointment,
  onClose,
  onUpdated,
}: AppointmentDetailDrawerProps) {
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState(appointment.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);

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
      toast.success(`Status dəyişdirildi: ${status}`);
      onUpdated({ ...appointment, status: json.data.status });
    } catch {
      setError("Şəbəkə xətası");
    } finally {
      setBusy(null);
    }
  }

  async function saveNotes() {
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/admin/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes.trim() }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) {
        toast.error(json.error ?? "Qeyd saxlanmadı");
        return;
      }
      toast.success("Qeyd saxlanıldı");
      onUpdated({ ...appointment, notes: notes.trim() });
      setShowNoteInput(false);
    } catch {
      toast.error("Şəbəkə xətası");
    } finally {
      setSavingNotes(false);
    }
  }

  const apptDate = new Date(appointment.startTime);
  const isPast = apptDate < new Date();

  return (
    <div
      className="fixed inset-0 z-40 flex items-stretch justify-end"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Drawer */}
      <div
        className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl animate-in"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "slide-in-from-right 0.3s ease-out" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-brand-gray-border px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-brand-navy">Görüş detalları</h3>
              <StatusBadge status={appointment.status} />
            </div>
            <p className="mt-1 text-sm text-brand-slate/60">
              {azDateTimeLong(apptDate)}
            </p>
          </div>
          <button
            type="button"
            aria-label="Bağla"
            onClick={onClose}
            className="rounded-lg p-2 text-brand-slate/50 transition-colors hover:bg-brand-gray-light hover:text-brand-navy"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {/* Patient Info */}
          <div className="rounded-xl border border-brand-gray-border bg-gradient-to-br from-brand-navy to-[#0a3255] p-5 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <User className="h-6 w-6 text-brand-cyan" />
              </div>
              <div>
                <div className="text-lg font-semibold">{appointment.patientName}</div>
                <div className="flex items-center gap-1.5 text-sm text-white/70">
                  <Phone className="h-3.5 w-3.5" />
                  <span className="font-mono">{appointment.patientPhone}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <a
                href={`tel:${appointment.patientPhone}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                <Phone className="h-3 w-3" />
                Zəng et
              </a>
              <a
                href={`https://wa.me/${appointment.patientPhone.replace("+", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-300 backdrop-blur-sm transition-colors hover:bg-emerald-500/30"
              >
                <MessageCircle className="h-3 w-3" />
                WhatsApp
              </a>
            </div>
          </div>

          {/* Appointment Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <DetailCard
              icon={<Stethoscope className="h-4 w-4 text-brand-cyan" />}
              label="Xidmət"
              value={appointment.service.name}
            />
            <DetailCard
              icon={<User className="h-4 w-4 text-brand-cyan" />}
              label="Həkim"
              value={appointment.doctor.name}
            />
            <DetailCard
              icon={<CalendarDays className="h-4 w-4 text-brand-cyan" />}
              label="Tarix"
              value={azDateLong(apptDate)}
            />
            <DetailCard
              icon={<Clock className="h-4 w-4 text-brand-cyan" />}
              label="Vaxt"
              value={`${formatTimeBaku(apptDate)} – ${formatTimeBaku(new Date(appointment.endTime))}`}
            />
            <DetailCard
              icon={<Banknote className="h-4 w-4 text-brand-cyan" />}
              label="Qiymət"
              value={formatPriceAzn(appointment.priceAtBooking)}
              highlight
            />
            <DetailCard
              icon={<CalendarDays className="h-4 w-4 text-brand-cyan" />}
              label="Yaradılma"
              value={azDateTimeLong(new Date(appointment.createdAt))}
            />
          </div>

          {/* Notes Section */}
          <div className="rounded-xl border border-brand-gray-border bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-slate/50" />
                <span className="text-sm font-medium text-brand-navy">Qeydlər</span>
              </div>
              {!showNoteInput && (
                <button
                  onClick={() => setShowNoteInput(true)}
                  className="text-xs font-medium text-brand-cyan hover:underline"
                >
                  {appointment.notes ? "Redaktə et" : "+ Qeyd əlavə et"}
                </button>
              )}
            </div>
            {showNoteInput ? (
              <div className="mt-3 space-y-2">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Daxili qeyd yazın..."
                  rows={3}
                  className="w-full rounded-lg border border-brand-gray-border px-3 py-2 text-sm focus:border-brand-cyan focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => { setShowNoteInput(false); setNotes(appointment.notes ?? ""); }}
                    className="rounded-lg border border-brand-gray-border px-3 py-1.5 text-xs text-brand-slate hover:bg-brand-gray-light"
                  >
                    Ləğv et
                  </button>
                  <button
                    onClick={() => void saveNotes()}
                    disabled={savingNotes}
                    className="inline-flex items-center gap-1 rounded-lg bg-brand-cyan px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-cyan-dark disabled:opacity-50"
                  >
                    {savingNotes ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    Saxla
                  </button>
                </div>
              </div>
            ) : appointment.notes ? (
              <p className="mt-2 text-sm text-brand-slate/70 whitespace-pre-wrap">{appointment.notes}</p>
            ) : (
              <p className="mt-2 text-xs text-brand-slate/40 italic">Qeyd yoxdur</p>
            )}
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="border-t border-brand-gray-border px-6 py-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-brand-slate/50">
            Statusu dəyiş
          </div>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_ACTIONS.map((a) => {
              const isCurrent = appointment.status === a.status;
              const isBusy = busy === a.status;
              const Icon = a.icon;
              const baseClass =
                "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40";
              const variantClass =
                a.variant === "primary"
                  ? "bg-brand-cyan text-white hover:bg-brand-cyan-dark shadow-sm"
                  : a.variant === "danger"
                    ? "border border-red-200 bg-white text-red-600 hover:bg-red-50"
                    : a.variant === "warning"
                      ? "border border-amber-200 bg-white text-amber-600 hover:bg-amber-50"
                      : "border border-brand-gray-border bg-white text-brand-slate hover:border-brand-cyan hover:text-brand-cyan";
              return (
                <button
                  key={a.status}
                  type="button"
                  disabled={isCurrent || busy !== null}
                  onClick={() => void update(a.status)}
                  className={`${baseClass} ${variantClass}`}
                >
                  {isBusy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Icon className="h-3.5 w-3.5" />
                  )}
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

function DetailCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-brand-gray-border bg-brand-gray-light p-3">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs font-medium text-brand-slate/60">{label}</span>
      </div>
      <div className={`mt-1 text-sm font-medium ${highlight ? "text-brand-cyan" : "text-brand-navy"}`}>
        {value}
      </div>
    </div>
  );
}
