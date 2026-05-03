type Status = "PENDING" | "CONFIRMED" | "CANCELLED" | "NO_SHOW" | "COMPLETED";

const STYLES: Record<Status, { label: string; className: string }> = {
  PENDING: {
    label: "Gözləmədə",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  CONFIRMED: {
    label: "Təsdiqlənib",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  CANCELLED: {
    label: "Ləğv edilib",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  NO_SHOW: {
    label: "Gəlmədi",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
  COMPLETED: {
    label: "Tamamlanıb",
    className: "bg-brand-cyan-light text-brand-cyan border-brand-cyan",
  },
};

export function StatusBadge({ status }: { status: Status }) {
  const s = STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.className}`}
    >
      {s.label}
    </span>
  );
}

export const STATUS_LABELS = Object.fromEntries(
  Object.entries(STYLES).map(([k, v]) => [k, v.label]),
) as Record<Status, string>;
