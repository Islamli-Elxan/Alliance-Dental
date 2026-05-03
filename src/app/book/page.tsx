import Link from "next/link";
import { BookingWizard } from "@/components/booking/BookingWizard";

export const metadata = {
  title: "Görüş al · Alliance Dental Clinic",
};

export default function BookPage() {
  return (
    <main className="min-h-screen bg-brand-gray-light">
      <header className="bg-brand-navy text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 md:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-md bg-brand-cyan" aria-hidden />
            <div>
              <div className="text-base font-semibold">Alliance Dental</div>
              <div className="text-xs text-brand-cyan">Onlayn görüş</div>
            </div>
          </Link>
          <Link href="/" className="text-sm transition-colors hover:text-brand-cyan">
            Əsas səhifə
          </Link>
        </div>
        <div className="h-1 w-full bg-brand-cyan" aria-hidden />
      </header>

      <section className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-6">
          <h1 className="text-2xl text-brand-navy md:text-3xl">Görüş al</h1>
          <p className="mt-1 text-sm text-brand-slate">
            3 sadə addım — xidmət, həkim və vaxt seçin. Təsdiq WhatsApp ilə gələcək.
          </p>
        </div>
        <BookingWizard />
      </section>
    </main>
  );
}
