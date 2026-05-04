"use client";

import Link from "next/link";
import { CheckCircle2, MessageCircle, Phone } from "lucide-react";
import { azDateTimeLong } from "@/lib/utils";
import type { BookingResultDto } from "./types";

interface BookingSuccessProps {
  result: BookingResultDto;
  onReset: () => void;
  onComplete?: () => void;
}

export function BookingSuccess({ result, onReset, onComplete }: BookingSuccessProps) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-cyan-light">
        <CheckCircle2 className="h-9 w-9 text-brand-cyan" aria-hidden />
      </div>

      <h2 className="mt-5 text-2xl text-brand-navy">Görüşünüz qeydə alındı!</h2>
      <p className="mt-2 text-sm text-brand-slate">
        Aşağıdakı detalları yoxlayın və WhatsApp təsdiqini gözləyin.
      </p>

      <div className="mx-auto mt-6 max-w-md rounded-lg border border-brand-gray-border bg-brand-gray-light p-5 text-left">
        <Row label="Pasiyent" value={result.patientName} />
        <Row label="Xidmət" value={result.service.name} />
        <Row label="Həkim" value={result.doctor.name} />
        <Row label="Tarix və saat" value={azDateTimeLong(new Date(result.startTime))} />
        <Row label="Status" value="Təsdiq gözlənilir" />
      </div>

      <div className="mx-auto mt-4 flex max-w-md items-start gap-2 rounded-lg border border-brand-cyan-light bg-white px-4 py-3 text-left text-sm text-brand-slate">
        <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" aria-hidden />
        <span>
          {result.whatsapp.sent && (
            <>
              WhatsApp nömrənizə (<span className="font-mono">{result.patientPhone}</span>) təsdiq
              mesajı göndərildi. Mesajı qəbul etmək üçün telefonunuzu yoxlayın.
            </>
          )}
          {!result.whatsapp.sent && result.whatsapp.skipped && (
            <>
              Demo rejimi: Green API açarları konfiqurasiya edilməyib, ona görə WhatsApp mesajı
              göndərilmədi. Görüş yenə də sistemdə qeydə alındı.
            </>
          )}
          {!result.whatsapp.sent && !result.whatsapp.skipped && (
            <>
              WhatsApp mesajı göndərilə bilmədi. Klinika sizinlə telefonla əlaqə saxlayacaq:{" "}
              <span className="font-mono">{result.patientPhone}</span>.
            </>
          )}
        </span>
      </div>

      <div className="mt-7 flex flex-col items-center justify-center gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-cyan px-5 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-brand-cyan-dark"
        >
          Yeni görüş al
        </button>
        {onComplete ? (
          <button
            type="button"
            onClick={onComplete}
            className="inline-flex items-center gap-2 rounded-lg border border-brand-gray-border px-5 py-2.5 text-brand-slate transition-colors hover:border-brand-cyan hover:text-brand-cyan"
          >
            Bağla
          </button>
        ) : (
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-brand-gray-border px-5 py-2.5 text-brand-slate transition-colors hover:border-brand-cyan hover:text-brand-cyan"
          >
            <Phone className="h-4 w-4" aria-hidden />
            Əsas səhifəyə qayıt
          </Link>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-brand-gray-border py-2 last:border-0 last:pb-0 first:pt-0">
      <span className="text-xs uppercase tracking-wide text-brand-slate">{label}</span>
      <span className="text-sm font-medium text-brand-navy">{value}</span>
    </div>
  );
}
