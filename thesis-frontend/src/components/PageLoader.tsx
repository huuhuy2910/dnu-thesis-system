import React from "react";

const PageLoader: React.FC = () => {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-white/90 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-4">
        <img
          src="/favicon_dnu.png"
          alt="Dai Nam loading"
          className="w-16 h-16 animate-spin-slow"
        />
        <span className="text-sm font-medium text-primary">Đang tải hệ thống…</span>
      </div>
    </div>
  );
};

export default PageLoader;
