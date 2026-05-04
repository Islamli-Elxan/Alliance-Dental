"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeft, Loader2, AlertCircle, Stethoscope, User, CalendarDays, Clock, Banknote, CheckCircle2 } from "lucide-react";
import { azDateLong, formatTimeBaku, formatPriceAzn } from "@/lib/utils";
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

  const apptDate = new Date(slot.startTime);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
      <h2 className="text-xl text-brand-navy md:text-2xl font-bold">Məlumatlarınızı daxil edin</h2>
      <p className="mt-1 text-sm text-brand-slate">
        Görüşü təsdiqləməzdən əvvəl detalları yoxlayın.
      </p>

      {/* Modern Detail Cards Grid */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 rounded-xl border border-brand-gray-border bg-brand-gray-light/50 p-4 sm:p-5">
        <DetailCard
          icon={<Stethoscope className="h-4 w-4 text-brand-cyan" />}
          label="Xidmət"
          value={service.name}
          subtext={`${service.durationMinutes} dəq`}
        />
        <DetailCard
          icon={<User className="h-4 w-4 text-brand-cyan" />}
          label="Həkim"
          value={doctor.name}
          subtext={doctor.specialty}
        />
        <DetailCard
          icon={<CalendarDays className="h-4 w-4 text-brand-cyan" />}
          label="Tarix"
          value={azDateLong(apptDate)}
        />
        <DetailCard
          icon={<Clock className="h-4 w-4 text-brand-cyan" />}
          label="Saat"
          value={formatTimeBaku(apptDate)}
        />
        <div className="col-span-2">
          <DetailCard
            icon={<Banknote className="h-4 w-4 text-emerald-500" />}
            label="Qiymət"
            value={formatPriceAzn(service.price)}
            highlight
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="patientName" className="block text-sm font-semibold text-brand-navy">
            Ad və soyad
          </label>
          <input
            id="patientName"
            type="text"
            autoComplete="name"
            required
            value={patientName}
            onChange={(e) => onChange({ patientName: e.target.value })}
            className="mt-1.5 w-full rounded-xl border border-brand-gray-border px-4 py-3 focus:border-brand-cyan focus:outline-none focus:ring-4 focus:ring-brand-cyan/10 transition-shadow"
            placeholder="Aysel Məmmədova"
          />
        </div>

        <div>
          <label htmlFor="patientPhone" className="block text-sm font-semibold text-brand-navy">
            Telefon (WhatsApp)
          </label>
          <div className="mt-1.5 flex shadow-sm rounded-xl transition-shadow focus-within:ring-4 focus-within:ring-brand-cyan/10 focus-within:border-brand-cyan">
            <span className="inline-flex items-center rounded-l-xl border border-r-0 border-brand-gray-border bg-brand-gray-light px-4 font-medium text-brand-slate">
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
              className="w-full rounded-r-xl border border-brand-gray-border px-4 py-3 focus:outline-none focus:border-brand-cyan"
              placeholder="50 123 45 67"
              maxLength={9}
            />
          </div>
          <p className="mt-2 text-xs text-brand-slate flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            WhatsApp aktiv olan nömrəni daxil edin — təsdiq mesajı alacaqsınız.
          </p>
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-brand-gray-border bg-white p-4 cursor-pointer hover:border-brand-cyan transition-colors">
          <input
            type="checkbox"
            checked={reminderOptIn}
            onChange={(e) => onChange({ reminderOptIn: e.target.checked })}
            className="mt-0.5 h-5 w-5 rounded border-brand-gray-border text-brand-cyan focus:ring-brand-cyan transition-colors"
          />
          <span className="text-sm text-brand-navy leading-snug">
            WhatsApp vasitəsilə görüşdən 24 saat və 2 saat əvvəl xatırlatma almaq istəyirəm.
          </span>
        </label>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 animate-in fade-in">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-brand-gray-border">
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 rounded-xl border border-brand-gray-border px-6 py-3 text-sm font-medium text-brand-slate transition-colors hover:border-brand-cyan hover:text-brand-cyan hover:bg-brand-gray-light disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Geri qayıt
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan-dark px-8 py-3 text-sm font-bold text-white shadow-md shadow-brand-cyan/20 transition-all hover:shadow-lg hover:shadow-brand-cyan/30 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Təsdiqlənir...
              </>
            ) : (
              "Görüşü Təsdiqlə"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function DetailCard({
  icon,
  label,
  value,
  subtext,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-brand-gray-border bg-white p-3 sm:p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-gray-light">
          {icon}
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-slate">{label}</span>
      </div>
      <div className={`text-sm sm:text-base font-bold ${highlight ? "text-emerald-600 text-lg" : "text-brand-navy"}`}>
        {value}
      </div>
      {subtext && (
        <div className="mt-0.5 text-xs text-brand-slate/70 font-medium truncate">{subtext}</div>
      )}
    </div>
  );
}
