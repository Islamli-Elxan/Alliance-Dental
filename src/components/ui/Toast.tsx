"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const add = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t, { id, type, message }]);
      setTimeout(() => remove(id), 4000);
    },
    [remove],
  );

  const value: ToastContextValue = {
    toast: add,
    success: (m) => add(m, "success"),
    error: (m) => add(m, "error"),
    info: (m) => add(m, "info"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 sm:bottom-6 sm:right-6">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const styles: Record<ToastType, { bg: string; border: string; icon: ReactNode }> = {
    success: {
      bg: "bg-white",
      border: "border-green-200",
      icon: <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />,
    },
    error: {
      bg: "bg-white",
      border: "border-red-200",
      icon: <XCircle className="h-5 w-5 text-red-500 shrink-0" />,
    },
    info: {
      bg: "bg-white",
      border: "border-brand-cyan/30",
      icon: <AlertCircle className="h-5 w-5 text-brand-cyan shrink-0" />,
    },
  };

  const s = styles[toast.type];

  return (
    <div
      className={`flex w-full max-w-sm items-start gap-3 rounded-xl border ${s.border} ${s.bg} px-4 py-3 shadow-lg animate-in slide-in-from-right-5 duration-200`}
    >
      {s.icon}
      <p className="flex-1 text-sm text-brand-slate">{toast.message}</p>
      <button
        onClick={onClose}
        className="ml-1 text-brand-slate/40 transition-colors hover:text-brand-slate"
        aria-label="Bağla"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
