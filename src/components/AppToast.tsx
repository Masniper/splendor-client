import React from "react";
import { AnimatePresence, motion } from "framer-motion";

export type ToastItem = {
  id: string;
  message: string;
  type: "error" | "success";
  title?: string;
  variant?: "default" | "chat";
};

type AppToastProps = {
  toasts: ToastItem[];
};

export function AppToast({ toasts }: AppToastProps) {
  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-[999] flex w-[min(92vw,28rem)] -translate-x-1/2 flex-col gap-2">
      <AnimatePresence initial={false} mode="popLayout">
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className={`
              pointer-events-auto flex items-start gap-3 rounded-xl border-2 px-4 py-3 font-sans shadow-2xl
              ${
                t.variant === "chat"
                  ? "border-amber-500/70 bg-zinc-900/95 text-stone-100 ring-1 ring-amber-500/25 backdrop-blur-sm"
                  : t.type === "error"
                    ? "border-red-400 bg-red-600 text-white"
                    : "border-emerald-400 bg-emerald-600 text-white"
              }
            `}
            role="alert"
          >
            <span className="mt-0.5 flex-shrink-0 text-lg leading-none" aria-hidden>
              {t.variant === "chat"
                ? "💬"
                : t.type === "error"
                  ? "⚠️"
                  : "✅"}
            </span>
            <div className="min-w-0 flex-1">
              {t.title && (
                <p
                  className={`mb-1 text-xs font-bold uppercase tracking-wide ${
                    t.variant === "chat" ? "text-amber-400" : "opacity-90"
                  }`}
                >
                  {t.title}
                </p>
              )}
              <p
                className={`break-words text-sm leading-snug [font-family:system-ui,emoji,sans-serif] ${
                  t.variant === "chat" ? "text-stone-200" : ""
                }`}
              >
                {t.message}
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
