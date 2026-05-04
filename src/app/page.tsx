import Link from "next/link";
import {
  ArrowRight,
  Phone,
  MapPin,
  Clock,
  Star,
  CheckCircle,
  MessageCircle,
  Calendar,
  ShieldCheck,
  Sparkles,
  Zap,
  HeartPulse,
  Stethoscope,
  ChevronDown,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getClinicBySlug, getDefaultClinicSlug } from "@/lib/clinic";

async function getData() {
  try {
    const clinic = await getClinicBySlug(getDefaultClinicSlug());
    const [services, doctors] = await Promise.all([
      prisma.service.findMany({ where: { clinicId: clinic.id }, orderBy: { price: "asc" } }),
      prisma.doctor.findMany({ where: { clinicId: clinic.id }, orderBy: { name: "asc" } }),
    ]);
    return { clinic, services, doctors };
  } catch {
    return { clinic: null, services: [], doctors: [] };
  }
}

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  sparkles: <Sparkles className="h-6 w-6" />,
  zap: <Zap className="h-6 w-6" />,
  stethoscope: <Stethoscope className="h-6 w-6" />,
  "heart-pulse": <HeartPulse className="h-6 w-6" />,
  "shield-check": <ShieldCheck className="h-6 w-6" />,
};

const STATS = [
  { value: "5000+", label: "Məmnun pasiyent" },
  { value: "12+", label: "İl təcrübə" },
  { value: "3", label: "Mütəxəssis həkim" },
  { value: "100%", label: "Güvənli müalicə" },
];

const WHY_US = [
  {
    icon: <Calendar className="h-5 w-5" />,
    title: "Onlayn görüş 30 saniyədə",
    desc: "Telefonla zəng olmadan, gözləmə yoxdur. İstədiyiniz vaxtda görüş alın.",
  },
  {
    icon: <MessageCircle className="h-5 w-5" />,
    title: "WhatsApp ilə xatırlatma",
    desc: "24 saat və 2 saat əvvəl avtomatik xatırlatma mesajı gəlir.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "Sertifikatlı mütəxəssislər",
    desc: "Beynəlxalq sertifikatlı həkimlərimiz ən müasir avadanlıqla xidmət edir.",
  },
  {
    icon: <Star className="h-5 w-5" />,
    title: "Ağrısız müalicə texnologiyası",
    desc: "Ən son anesteziya texnikası ilə ağrısız, stressiz müalicə.",
  },
];

const FAQS = [
  {
    q: "Görüş necə ala bilərəm?",
    a: "\"Görüş al\" düyməsini klikləyin, xidmət, həkim və əlveriş vaxt seçin. Görüşünüz WhatsApp ilə təsdiqlənəcək.",
  },
  {
    q: "Görüşü ləğv etmək istəsəm nə etməliyəm?",
    a: "WhatsApp mesajındakı \"LƏĞV ET\" yazın. Görüşünüz avtomatik ləğv olunacaq.",
  },
  {
    q: "Hansı xidmətlər siğorta ilə ödənilir?",
    a: "Müalicə və diş daşı təmizliyi sığortanıza görə dəyişir. Ətraflı məlumat üçün bizə zəng edin.",
  },
  {
    q: "Uşaqlar üçün müayinə varmı?",
    a: "Bəli, 5 yaşdan yuxarı uşaqlar üçün xüsusi uşaq stomatologiyası xidməti mövcuddur.",
  },
  {
    q: "İlk müayinə pulludurmu?",
    a: "İlk konsultasiya üçün müştərilərimizə xüsusi qiymətimiz var. Onlayn görüş alarkən \"Ortodontiya konsultasiyası\" seçin.",
  },
];

export default async function HomePage() {
  const { services, doctors } = await getData();

  return (
    <div className="min-h-screen bg-brand-white">
      {/* ───── Header ───── */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-navy/95 backdrop-blur-md text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-cyan">
              <span className="text-base font-bold">A</span>
            </div>
            <div>
              <div className="text-base font-semibold leading-tight">Alliance Dental</div>
              <div className="text-[10px] text-brand-cyan leading-tight">Klinika</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="#services" className="transition-colors hover:text-brand-cyan">Xidmətlər</a>
            <a href="#doctors" className="transition-colors hover:text-brand-cyan">Həkimlər</a>
            <a href="#about" className="transition-colors hover:text-brand-cyan">Haqqımızda</a>
            <a href="#faq" className="transition-colors hover:text-brand-cyan">FAQ</a>
            <a href="#contact" className="transition-colors hover:text-brand-cyan">Əlaqə</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/book"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-cyan px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-cyan-dark"
            >
              <Calendar className="h-4 w-4" />
              <span>Görüş al</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ───── Hero ───── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-navy via-[#0a3255] to-[#0d4a7a]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-brand-cyan blur-3xl" />
          <div className="absolute bottom-0 left-0 h-60 w-60 rounded-full bg-brand-cyan blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-cyan/20 px-3 py-1 text-xs font-medium text-brand-cyan ring-1 ring-brand-cyan/30">
              <MapPin className="h-3 w-3" /> Bakı, Azərbaycan
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              Sağlam{" "}
              <span className="text-brand-cyan">təbəssüm</span>
              {" "}üçün etibarlı seçim
            </h1>
            <p className="mt-5 max-w-lg text-base text-white/70 sm:text-lg">
              Müasir avadanlıq, sertifikatlı həkimlər. Onlayn görüş alın — WhatsApp vasitəsilə
              anında təsdiq alacaqsınız.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/book"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-cyan px-6 py-3 font-semibold text-white shadow-lg shadow-brand-cyan/30 transition-all hover:bg-brand-cyan-dark hover:shadow-brand-cyan/40 hover:-translate-y-0.5"
              >
                Onlayn görüş al
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="tel:+994123456789"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                <Phone className="h-4 w-4" />
                +994 12 345 67 89
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-white/60">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-brand-cyan" />
                Pulsuz konsultasiya
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-brand-cyan" />
                WhatsApp xatırlatma
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-brand-cyan" />
                Çevik ödəniş
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Stats ───── */}
      <section className="bg-brand-cyan">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center text-white">
                <div className="text-3xl font-bold">{s.value}</div>
                <div className="mt-1 text-sm text-white/80">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Services ───── */}
      <section id="services" className="bg-brand-gray-light py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeader
            tag="Xidmətlərimiz"
            title="Diş sağlığı üçün hər şey"
            sub="Ən müasir avadanlıq və sertifikatlı mütəxəssislərlə geniş xidmət çeşidi."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.length > 0
              ? services.map((s) => (
                  <ServiceCard
                    key={s.id}
                    name={s.name}
                    description={s.description}
                    price={Number(s.price)}
                    duration={s.durationMinutes}
                    icon={s.iconName ? SERVICE_ICONS[s.iconName] : <HeartPulse className="h-6 w-6" />}
                  />
                ))
              : DEFAULT_SERVICES.map((s) => <ServiceCard key={s.name} {...s} />)}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/book"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-cyan px-6 py-3 font-medium text-white transition-colors hover:bg-brand-cyan-dark"
            >
              Görüş al <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ───── Doctors ───── */}
      <section id="doctors" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeader
            tag="Həkim heyətimiz"
            title="Peşəkar mütəxəssislər"
            sub="Hər birinin öz sahəsində dərin bilik və təcrübəsi var."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.length > 0
              ? doctors.map((d) => (
                  <DoctorCard
                    key={d.id}
                    name={d.name}
                    specialty={d.specialty}
                    photoUrl={d.photoUrl}
                  />
                ))
              : DEFAULT_DOCTORS.map((d) => <DoctorCard key={d.name} {...d} />)}
          </div>
        </div>
      </section>

      {/* ───── Why Us ───── */}
      <section id="about" className="bg-brand-gray-light py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="inline-block rounded-full bg-brand-cyan-light px-3 py-1 text-xs font-medium text-brand-cyan">
                Niyə biz?
              </span>
              <h2 className="mt-4 text-3xl font-bold text-brand-navy sm:text-4xl">
                Pasiyent məmnuniyyəti
                <br />
                <span className="text-brand-cyan">birinci prioritet</span>
              </h2>
              <p className="mt-4 text-brand-slate/70">
                12 ildən artıq təcrübəmiz, 5000-dən çox məmnun pasiyentimiz və ən müasir
                müalicə metodlarımızla sizin yanınızdayıq.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {WHY_US.map((w) => (
                <div
                  key={w.title}
                  className="rounded-xl border border-brand-gray-border bg-white p-5 shadow-card"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-cyan-light text-brand-cyan">
                    {w.icon}
                  </div>
                  <h3 className="mt-3 font-medium text-brand-navy">{w.title}</h3>
                  <p className="mt-1.5 text-sm text-brand-slate/70">{w.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───── Booking CTA ───── */}
      <section className="bg-brand-navy py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Görüşünüzü indi alın
          </h2>
          <p className="mt-4 text-white/70">
            30 saniyə vaxtınızı ayırın. Növbəti gülüşünüz sizlə.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/book"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-cyan px-8 py-3.5 font-semibold text-white shadow-lg shadow-brand-cyan/30 transition-all hover:bg-brand-cyan-dark"
            >
              <Calendar className="h-5 w-5" />
              Onlayn görüş al
            </Link>
            <a
              href="tel:+994123456789"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-8 py-3.5 font-medium text-white transition-all hover:bg-white/10"
            >
              <Phone className="h-5 w-5" />
              Zəng et
            </a>
          </div>
        </div>
      </section>

      {/* ───── FAQ ───── */}
      <section id="faq" className="bg-white py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionHeader
            tag="FAQ"
            title="Tez-tez soruşulan suallar"
            sub="Cavab tapmadıqlarınız üçün bizimlə əlaqə saxlayın."
          />
          <div className="mt-10 space-y-3">
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ───── Contact ───── */}
      <section id="contact" className="bg-brand-gray-light py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeader
            tag="Əlaqə"
            title="Bizimlə əlaqə saxlayın"
            sub="Suallarınız üçün bizimlə əlaqə saxlamaqdan çəkinməyin."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <ContactCard
              icon={<Phone className="h-6 w-6" />}
              title="Telefon"
              lines={["+994 12 345 67 89", "+994 55 123 45 67"]}
              href="tel:+994123456789"
            />
            <ContactCard
              icon={<MapPin className="h-6 w-6" />}
              title="Ünvan"
              lines={["Nizami küçəsi 123", "Bakı, Azərbaycan"]}
            />
            <ContactCard
              icon={<Clock className="h-6 w-6" />}
              title="İş saatları"
              lines={["B.e–Cümə: 09:00–18:00", "Şənbə: 09:00–14:00"]}
            />
          </div>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="bg-brand-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-cyan">
                <span className="text-base font-bold">A</span>
              </div>
              <div>
                <div className="font-semibold">Alliance Dental Clinic</div>
                <div className="text-xs text-white/50">Bakı, Azərbaycan</div>
              </div>
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60">
              <a href="#services" className="hover:text-white transition-colors">Xidmətlər</a>
              <a href="#doctors" className="hover:text-white transition-colors">Həkimlər</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
              <a href="#contact" className="hover:text-white transition-colors">Əlaqə</a>
              <Link href="/book" className="hover:text-white transition-colors text-brand-cyan">Görüş al</Link>
            </nav>
          </div>
          <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/40">
            © {new Date().getFullYear()} Alliance Dental Clinic. Bütün hüquqlar qorunur.
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function SectionHeader({ tag, title, sub }: { tag: string; title: string; sub: string }) {
  return (
    <div className="text-center">
      <span className="inline-block rounded-full bg-brand-cyan-light px-3 py-1 text-xs font-medium text-brand-cyan">
        {tag}
      </span>
      <h2 className="mt-3 text-3xl font-bold text-brand-navy sm:text-4xl">{title}</h2>
      <p className="mt-3 mx-auto max-w-xl text-brand-slate/70">{sub}</p>
    </div>
  );
}

function ServiceCard({
  name,
  description,
  price,
  duration,
  icon,
}: {
  name: string;
  description?: string | null;
  price: number;
  duration: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="group rounded-2xl border border-brand-gray-border bg-white p-6 shadow-card transition-all hover:border-brand-cyan/30 hover:shadow-md">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-cyan-light text-brand-cyan transition-colors group-hover:bg-brand-cyan group-hover:text-white">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold text-brand-navy">{name}</h3>
      {description && <p className="mt-1.5 text-sm text-brand-slate/70">{description}</p>}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-lg font-bold text-brand-cyan">{price} ₼</span>
        <span className="rounded-full bg-brand-gray-light px-2.5 py-1 text-xs text-brand-slate/60">
          {duration} dəq
        </span>
      </div>
    </div>
  );
}

function DoctorCard({
  name,
  specialty,
  photoUrl,
}: {
  name: string;
  specialty: string;
  photoUrl?: string | null;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="rounded-2xl border border-brand-gray-border bg-white p-6 shadow-card text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-cyan-light">
        {photoUrl ? (
          <img src={photoUrl} alt={name} className="h-full w-full rounded-2xl object-cover" />
        ) : (
          <span className="text-2xl font-bold text-brand-cyan">{initials}</span>
        )}
      </div>
      <h3 className="mt-4 font-semibold text-brand-navy">{name}</h3>
      <p className="mt-1 text-sm text-brand-cyan">{specialty}</p>
      <div className="mt-4 flex justify-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        ))}
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-xl border border-brand-gray-border bg-white">
      <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 font-medium text-brand-navy list-none">
        {q}
        <ChevronDown className="h-4 w-4 shrink-0 text-brand-slate/50 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="border-t border-brand-gray-border px-5 py-4 text-sm text-brand-slate/70">
        {a}
      </div>
    </details>
  );
}

function ContactCard({
  icon,
  title,
  lines,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  lines: string[];
  href?: string;
}) {
  const content = (
    <div className="rounded-2xl border border-brand-gray-border bg-white p-6 shadow-card transition-all hover:border-brand-cyan/30 hover:shadow-md">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-cyan-light text-brand-cyan">
        {icon}
      </div>
      <h3 className="mt-4 font-medium text-brand-navy">{title}</h3>
      {lines.map((l) => (
        <p key={l} className="mt-1 text-sm text-brand-slate/70">{l}</p>
      ))}
    </div>
  );
  return href ? <a href={href}>{content}</a> : <div>{content}</div>;
}

// Fallback data if DB is empty
const DEFAULT_SERVICES = [
  { name: "Diş ağardılması", description: "Professional ağardma proseduru", price: 150, duration: 60, icon: <Sparkles className="h-6 w-6" /> },
  { name: "İmplant", description: "Diş implant qurğusu", price: 800, duration: 120, icon: <Zap className="h-6 w-6" /> },
  { name: "Diş müalicəsi", description: "Karies müalicəsi və plomba", price: 80, duration: 45, icon: <HeartPulse className="h-6 w-6" /> },
  { name: "Ortodontiya", description: "İlkin ortodontik müayinə", price: 50, duration: 30, icon: <Stethoscope className="h-6 w-6" /> },
  { name: "Diş daşı təmizliyi", description: "Professional gigiyenik təmizlik", price: 60, duration: 30, icon: <ShieldCheck className="h-6 w-6" /> },
];

const DEFAULT_DOCTORS = [
  { name: "Dr. Əli Həsənov", specialty: "Ortodontist" },
  { name: "Dr. Nigar Əliyeva", specialty: "Ümumi Diş Həkimi" },
  { name: "Dr. Kamran Məmmədov", specialty: "İmplantologiya" },
];
