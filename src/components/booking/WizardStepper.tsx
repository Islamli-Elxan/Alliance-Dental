interface WizardStepperProps {
  current: 1 | 2 | 3 | 4;
}

const STEPS = [
  { n: 1, label: "Xidmət" },
  { n: 2, label: "Həkim və vaxt" },
  { n: 3, label: "Məlumatlar" },
] as const;

export function WizardStepper({ current }: WizardStepperProps) {
  // Hide stepper on success screen
  if (current === 4) return null;

  return (
    <div className="flex items-center justify-between gap-2">
      {STEPS.map((step, idx) => {
        const isActive = current === step.n;
        const isDone = current > step.n;
        return (
          <div key={step.n} className="flex flex-1 items-center gap-2">
            <div className="flex items-center gap-3">
              <div
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                  isActive
                    ? "bg-brand-cyan text-white"
                    : isDone
                      ? "bg-brand-cyan-light text-brand-cyan"
                      : "bg-brand-gray-light text-brand-slate",
                ].join(" ")}
                aria-current={isActive ? "step" : undefined}
              >
                {step.n}
              </div>
              <span
                className={[
                  "hidden text-sm md:inline",
                  isActive ? "font-medium text-brand-navy" : "text-brand-slate",
                ].join(" ")}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={[
                  "h-px flex-1",
                  isDone ? "bg-brand-cyan" : "bg-brand-gray-border",
                ].join(" ")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
