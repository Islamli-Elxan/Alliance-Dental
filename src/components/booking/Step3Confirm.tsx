"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { azDateTimeLong, formatPriceAzn } from "@/lib/utils";
import type { DoctorDto, ServiceDto, TimeSlotDto, BookingResultDto } from "./types";

interface Step3ConfirmProps {
  service: ServiceDto;
  doctor: DoctorDto;
  slot: TimeSlotDto;
  patientName: string;
  patientPhone: string;
  reminderOptIn: boolean;
  onChange: (patch: Partial<{
    patientName: string;
    patientPhone: string;
    reminderOptIn: boolean;
  }>) => void;
  onBack: () => void;
  onSuccess: (result: BookingResultDto) => void;
}

const PHONE_REGEX = /^[0-9]{9}$/; // 9 digits after +994

export function Step3Confirm({
  service,
  doctor,
  slot,
  patientName,
  patientPhone,
  reminderOptIn,
  onChange,
  onBack,
  onSuccess,
}: Step3ConfirmProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Phone is stored as +994XXXXXXXXX. UI shows only the 9 trailing digits.
  const phoneDigits = patientPhone.startsWith("+994")
    ? patientPhone.slice(4)
    : patientPhone.replace(/\D/g, "").slice(-9);

  function handlePhoneChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 9);
    onChange({ patientPhone: digits ? `+994${digits}` : "" });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmedName = patientName.trim();
    if (trimmedName.length < 2) {
      setError("Ad ən azı 2 simvol olmalıdır");
      return;
    }
    if (!PHONE_REGEX.test(phoneDigits)) {
      setError("Telefon nömrəsi 9 rəqəm olmalıdır (məs. 501234567)");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          doctorId: doctor.id,
          startTime: slot.startTime,
          patientName: trimmedName,
          patientPhone: `+994${phoneDigits}`,
          reminderOptIn,
        }),
      });
      const json: { data?: BookingResultDto; error?: string } = await res.json();
      if (!res.ok || json.error || !json.data) {
        setError(json.error ?? "Görüş yaradıla bilmədi");
        return;
      }
      onSuccess(json.data);
    } catch {
      setError("Şəbəkə xətası — yenidən cəhd edin");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl text-brand-navy md:text-2xl">Məlumatlarınızı daxil edin</h2>
      <p className="mt-1 text-sm text-brand-slate">
        Görüşü təsdiqləməzdən əvvəl detalları yoxlayın.
      </p>

      <div className="mt-6 rounded-lg border border-brand-gray-border bg-brand-gray-light p-5">
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <SummaryRow label="Xidmət" value={service.name} />
          <SummaryRow label="Müddət" value={`${service.durationMinutes} dəq`} />
          <SummaryRow label="Həkim" value={doctor.name} />
          <SummaryRow label="İxtisas" value={doctor.specialty} />
          <SummaryRow
            label="Tarix və saat"
            value={azDateTimeLong(new Date(slot.startTime))}
          />
          <SummaryRow label="Qiymət" value={formatPriceAzn(service.price)} highlight />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="patientName" className="block text-sm font-medium text-brand-navy">
            Ad və soyad
          </label>
          <input
            id="patientName"
            type="text"
            autoComplete="name"
            required
            value={patientName}
            onChange={(e) => onChange({ patientName: e.target.value })}
            className="mt-1 w-full rounded-lg border border-brand-gray-border px-4 py-2.5 focus:border-brand-cyan focus:outline-none focus:ring-2 focus:ring-brand-cyan"
            placeholder="Aysel Məmmədova"
          />
        </div>

        <div>
          <label htmlFor="patientPhone" className="block text-sm font-medium text-brand-navy">
            Telefon (WhatsApp)
          </label>
          <div className="mt-1 flex">
            <span className="inline-flex items-center rounded-l-lg border border-r-0 border-brand-gray-border bg-brand-gray-light px-3 text-sm text-brand-slate">
              +994
            </span>
            <input
              id="patientPhone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              required
              value={phoneDigits}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className="w-full rounded-r-lg border border-brand-gray-border px-4 py-2.5 focus:border-brand-cyan focus:outline-none focus:ring-2 focus:ring-brand-cyan"
              placeholder="501234567"
              maxLength={9}
            />
          </div>
          <p className="mt-1 text-xs text-brand-slate">
            WhatsApp aktiv olan nömrəni daxil edin — təsdiq və xatırlatma alacaqsınız.
          </p>
        </div>

        <label className="flex items-start gap-3 text-sm text-brand-slate">
          <input
            type="checkbox"
            checked={reminderOptIn}
            onChange={(e) => onChange({ reminderOptIn: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded border-brand-gray-border text-brand-cyan focus:ring-brand-cyan"
          />
          <span>
            WhatsApp vasitəsilə xatırlatma almaq istəyirəm (24 saat və 2 saat əvvəl).
          </span>
        </label>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg border border-brand-gray-border px-5 py-2.5 text-brand-slate transition-colors hover:border-brand-cyan hover:text-brand-cyan disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Geri
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-cyan px-5 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-brand-cyan-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Göndərilir...
              </>
            ) : (
              "Görüşü təsdiqlə"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-brand-slate">{label}</div>
      <div
        className={[
          "mt-0.5",
          highlight ? "text-base font-semibold text-brand-cyan" : "text-brand-navy",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}
