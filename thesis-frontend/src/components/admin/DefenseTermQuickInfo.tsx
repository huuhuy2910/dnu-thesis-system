import React from "react";
import { CalendarRange, Flag, ShieldCheck } from "lucide-react";

interface DefenseTermQuickInfoProps {
  roleLabel: string;
  termCode: string;
  termName: string;
  roundIndex: number;
  status: "Draft" | "Preparing" | "Finalized" | "Published" | "Archived";
}

const statusPalette: Record<DefenseTermQuickInfoProps["status"], { bg: string; text: string }> = {
  Draft: { bg: "#f1f5f9", text: "#334155" },
  Preparing: { bg: "#dbeafe", text: "#1d4ed8" },
  Finalized: { bg: "#fef3c7", text: "#b45309" },
  Published: { bg: "#dcfce7", text: "#166534" },
  Archived: { bg: "#1f2937", text: "#f8fafc" },
};

const DefenseTermQuickInfo: React.FC<DefenseTermQuickInfoProps> = ({
  roleLabel,
  termCode,
  termName,
  roundIndex,
  status,
}) => {
  const palette = statusPalette[status];

  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        background: "linear-gradient(135deg, #fffaf2 0%, #ffffff 100%)",
        padding: 16,
        marginBottom: 18,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <CalendarRange size={18} color="#ea580c" />
        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{roleLabel} đang theo dõi</div>
          <div style={{ fontWeight: 700, color: "#0f172a" }}>{termName}</div>
          <div style={{ fontSize: 12, color: "#475569" }}>Mã đợt: {termCode} - Đợt thứ {roundIndex}</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            borderRadius: 999,
            padding: "6px 10px",
            background: palette.bg,
            color: palette.text,
            fontWeight: 700,
            fontSize: 12,
          }}
        >
          <Flag size={14} /> {status}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#475569", fontSize: 12 }}>
          <ShieldCheck size={14} /> Vai trò: {roleLabel}
        </span>
      </div>
    </div>
  );
};

export default DefenseTermQuickInfo;
