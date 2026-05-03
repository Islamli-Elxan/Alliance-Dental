import { type LucideIcon, ArrowDown, ArrowUp, Minus } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  trend?: "up" | "down" | "flat" | null;
  trendLabel?: string;
  icon?: LucideIcon;
  tone?: "default" | "warning" | "danger";
}

export function KpiCard({
  label,
  value,
  hint,
  trend,
  trendLabel,
  icon: Icon,
  tone = "default",
}: KpiCardProps) {
  const trendIcon =
    trend === "up" ? ArrowUp : trend === "down" ? ArrowDown : trend === "flat" ? Minus : null;

  const toneClass =
    tone === "danger"
      ? "text-red-600"
      : tone === "warning"
        ? "text-amber-600"
        : "text-brand-navy";

  return (
    <div className="rounded-xl border border-brand-gray-border bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-brand-slate">{label}</div>
          <div className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</div>
        </div>
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-cyan-light">
            <Icon className="h-4 w-4 text-brand-cyan" aria-hidden />
          </div>
        )}
      </div>
      {(hint || trendIcon) && (
        <div className="mt-3 flex items-center gap-2 text-xs text-brand-slate">
          {trendIcon && (
            <span
              className={[
                "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium",
                trend === "up"
                  ? "bg-emerald-50 text-emerald-700"
                  : trend === "down"
                    ? "bg-red-50 text-red-700"
                    : "bg-slate-100 text-slate-600",
              ].join(" ")}
            >
              {(() => {
                const TrendIcon = trendIcon;
                return <TrendIcon className="h-3 w-3" aria-hidden />;
              })()}
              {trendLabel}
            </span>
          )}
          {hint && <span>{hint}</span>}
        </div>
      )}
    </div>
  );
}
