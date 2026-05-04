import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-brand-gray-border bg-white py-16 px-6 text-center">
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-cyan-light text-brand-cyan">
          {icon}
        </div>
      )}
      <h3 className="text-base font-medium text-brand-navy">{title}</h3>
      {description && (
        <p className="mt-1 max-w-xs text-sm text-brand-slate/70">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
