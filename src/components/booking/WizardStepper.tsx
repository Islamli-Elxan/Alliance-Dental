import { Check } from "lucide-react";

interface WizardStepperProps {
  current: 1 | 2 | 3 | 4;
}

const STEPS = [
  { n: 1, label: "Xidmət seçin", shortLabel: "Xidmət" },
  { n: 2, label: "Həkim və vaxt", shortLabel: "Həkim" },
  { n: 3, label: "Təsdiqləyin", shortLabel: "Təsdiq" },
] as const;

export function WizardStepper({ current }: WizardStepperProps) {
  // Hide stepper on success screen
  if (current === 4) return null;

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-brand-gray-light">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-cyan to-brand-cyan-dark transition-all duration-500 ease-out"
          style={{ width: `${((current - 1) / 2) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="flex items-center justify-between gap-1">
        {STEPS.map((step, idx) => {
          const isActive = current === step.n;
          const isDone = current > step.n;
          return (
            <div key={step.n} className="flex flex-1 items-center gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={[
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300",
                    isDone
                      ? "bg-brand-cyan text-white shadow-md shadow-brand-cyan/30"
                      : isActive
                        ? "bg-brand-cyan text-white shadow-md shadow-brand-cyan/30 ring-4 ring-brand-cyan/20"
                        : "bg-brand-gray-light text-brand-slate/50",
                  ].join(" ")}
                  aria-current={isActive ? "step" : undefined}
                >
                  {isDone ? <Check className="h-4 w-4" strokeWidth={3} /> : step.n}
                </div>
                <div className="hidden sm:block">
                  <div
                    className={[
                      "text-sm font-medium transition-colors",
                      isActive
                        ? "text-brand-navy"
                        : isDone
                          ? "text-brand-cyan"
                          : "text-brand-slate/40",
                    ].join(" ")}
                  >
                    {step.label}
                  </div>
                  <div className="text-xs text-brand-slate/40">
                    Addım {step.n}/3
                  </div>
                </div>
                {/* Mobile label */}
                <span
                  className={[
                    "text-xs font-medium sm:hidden",
                    isActive ? "text-brand-navy" : isDone ? "text-brand-cyan" : "text-brand-slate/40",
                  ].join(" ")}
                >
                  {step.shortLabel}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className="mx-1 hidden flex-1 sm:block">
                  <div
                    className={[
                      "h-px w-full transition-colors duration-300",
                      isDone ? "bg-brand-cyan" : "bg-brand-gray-border",
                    ].join(" ")}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
