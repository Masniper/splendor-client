import React from "react";
import { AnimatePresence, motion } from "framer-motion";

export type AppToastPayload = {
  message: string;
  type: "error" | "success";
} | null;

type AppToastProps = {
  toast: AppToastPayload;
};

export function AppToast({ toast }: AppToastProps) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -24, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          className={`
            fixed left-1/2 top-4 z-[999] flex w-[min(92vw,28rem)] -translate-x-1/2 items-center gap-2 rounded-lg border-2 px-4 py-2.5 font-sans font-semibold shadow-2xl
            ${
              toast.type === "error"
                ? "border-red-400 bg-red-600 text-white"
                : "border-emerald-400 bg-emerald-600 text-white"
            }
          `}
          role="alert"
        >
          <span className="flex-shrink-0 text-lg" aria-hidden>
            {toast.type === "error" ? "⚠️" : "✅"}
          </span>
          <span className="text-sm leading-snug">{toast.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
