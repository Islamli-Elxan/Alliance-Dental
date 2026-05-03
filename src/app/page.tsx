import Link from "next/link";
import { ArrowRight, ShieldCheck, Calendar, MessageCircle } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-brand-white">
      <header className="bg-brand-navy text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-brand-cyan" aria-hidden />
            <div className="text-lg font-semibold">Alliance Dental</div>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/book" className="transition-colors hover:text-brand-cyan">
              Görüş al
            </Link>
            <Link href="/admin" className="transition-colors hover:text-brand-cyan">
              Admin
            </Link>
          </nav>
        </div>
      </header>

      <section className="bg-brand-gray-light">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <span className="inline-block rounded-full bg-brand-cyan-light px-3 py-1 text-sm font-medium text-brand-cyan">
              Bakı, Azərbaycan
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-tight text-brand-navy md:text-5xl">
              Sağlam təbəssüm üçün etibarlı diş klinikası
            </h1>
            <p className="mt-5 text-lg text-brand-slate">
              Onlayn görüş alın — yalnız 30 saniyəyə. WhatsApp vasitəsilə təsdiq və
              xatırlatma alacaqsınız.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/book"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-cyan px-5 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-brand-cyan-dark"
              >
                Görüş al
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-lg border border-brand-cyan px-5 py-2.5 font-medium text-brand-cyan transition-colors hover:bg-brand-cyan-light"
              >
                Klinika idarə paneli
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={<Calendar className="h-6 w-6 text-brand-cyan" />}
            title="3 addımda görüş"
            description="Xidmət, həkim, vaxt — bitdi. Telefonla zəng tələb olunmur."
          />
          <FeatureCard
            icon={<MessageCircle className="h-6 w-6 text-brand-cyan" />}
            title="WhatsApp təsdiq"
            description="Görüş təsdiqi və 24 saat / 2 saat əvvəl xatırlatma avtomatik gəlir."
          />
          <FeatureCard
            icon={<ShieldCheck className="h-6 w-6 text-brand-cyan" />}
            title="Real həkim cədvəli"
            description="Yalnız boş vaxt slotları göstərilir. İkiqat rezervasiya yoxdur."
          />
        </div>
      </section>

      <footer className="bg-brand-navy text-white">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm">
          © {new Date().getFullYear()} Alliance Dental Clinic. Bütün hüquqlar qorunur.
        </div>
      </footer>
    </main>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-xl border border-brand-gray-border bg-white p-6 shadow-card">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-cyan-light">
        {icon}
      </div>
      <h3 className="mt-4 text-lg">{title}</h3>
      <p className="mt-2 text-sm text-brand-slate">{description}</p>
    </div>
  );
}
