import React from "react";
import { motion } from "framer-motion";

interface ModalShellProps {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  subtitle?: string;
  wide?: boolean;
}

export function ModalShell({ children, onClose, title, subtitle, wide }: ModalShellProps) {
  const widthClass = wide ? "max-w-[980px]" : "max-w-[760px]";

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      <motion.div
        className="absolute inset-0 bg-[#0F1C3F]/65 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={onClose}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        className={`relative flex max-h-[90vh] w-full ${widthClass} flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_30px_70px_rgba(15,28,63,0.18)] ring-1 ring-[#E5ECFB]`}
        style={{ fontFamily: '"Inter","Poppins",sans-serif' }}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-white/98 px-8 py-5 border-b border-[#EAF1FF]">
          <div className="flex min-w-0 flex-col gap-0">
            <span className="text-xs font-bold tracking-wide text-[#1F3C88]">{title}</span>
            {subtitle && <p className="text-sm text-[#4A5775]">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-md border border-transparent bg-[#FF6B35] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#e65f2f] transition"
          >
            Đóng
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-8 pb-8 pt-6">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

export function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E5ECFB] bg-[#F8FAFF] px-4 py-3">
      <span className="block text-xs font-semibold uppercase text-[#6B7A99]">{label}</span>
      <span className="mt-1 text-sm font-semibold text-[#1F3C88]">{value}</span>
    </div>
  );
}