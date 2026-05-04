import { BookingWizard } from "@/components/booking/BookingWizard";

export const metadata = {
  title: "Görüş al · Alliance Dental Clinic",
};

export default function BookPage() {
  return (
    <main className="min-h-screen bg-brand-gray-light py-4 sm:py-8">
      <section className="mx-auto w-full max-w-3xl px-4 md:px-6">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-brand-navy shadow-sm mb-4">
            <span className="text-xl font-bold text-brand-cyan">A</span>
          </div>
          <h1 className="text-2xl font-bold text-brand-navy md:text-3xl">Görüş təyin edin</h1>
          <p className="mt-2 text-sm text-brand-slate max-w-md mx-auto">
            3 sadə addım — xidmət, həkim və vaxt seçin. Təsdiq və xatırlatma WhatsApp ilə göndəriləcək.
          </p>
        </div>
        <BookingWizard />
      </section>
    </main>
  );
}
