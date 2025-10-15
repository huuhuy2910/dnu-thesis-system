import React from "react";
import { Activity, CalendarClock, CheckCircle2, ChevronRight, Clock, Layers3, MapPin, Users2 } from "lucide-react";

const ACCENT_COLOR = "#00B4D8";
const MUTED_BORDER = "#E2E8F0";
const CARD_SHADOW = "0 18px 40px rgba(31, 60, 136, 0.08)";

interface StatsSnapshot {
  totalCommittees: number;
  eligibleTopics: number;
  assignedTopics: number;
  nextSession: {
    committeeCode: string;
    defenseDate?: string | null;
    room?: string | null;
    startTime?: string | null;
    topicCount?: number;
  } | null;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatTime(value: string) {
  const [hh, mm] = value.split(":");
  if (!hh || !mm) return value;
  const date = new Date();
  date.setHours(Number(hh), Number(mm));
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function StatCard({
  title,
  value,
  icon,
  description,
  actionLabel,
  onAction,
  accent,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  accent?: boolean;
}) {
  return (
    <div
      className="relative flex h-full flex-col gap-3 rounded-3xl border bg-white p-6 shadow-lg shadow-[rgba(31,60,136,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
      style={{ boxShadow: CARD_SHADOW, borderColor: accent ? ACCENT_COLOR : MUTED_BORDER }}
    >
      <div
        className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${accent ? "bg-[#00B4D8]/10" : "bg-[#1F3C88]/10"}`}
      >
        <div className={`${accent ? "text-[#00B4D8]" : "text-[#1F3C88]"}`}>{icon}</div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7A99]">
          {title}
        </p>
        <p className={`mt-1 text-3xl font-bold ${accent ? "text-[#00B4D8]" : "text-[#1F3C88]"}`}>
          {value}
        </p>
      </div>
      {description && <p className="text-sm text-[#4A5775]">{description}</p>}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-auto flex items-center gap-2 self-start rounded-full border border-[#00B4D8] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#00B4D8] transition-all duration-200 hover:bg-[#00B4D8] hover:text-white hover:shadow-md"
        >
          {actionLabel}
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

function NextSessionCard({ info }: { info: StatsSnapshot["nextSession"] }) {
  return (
    <div className="flex h-full flex-col justify-between rounded-3xl border border-[#D9E1F2] bg-gradient-to-br from-[#1F3C88] to-[#162B61] p-6 text-white shadow-lg">
      <div className="flex items-center gap-3">
        <CalendarClock size={30} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
            Phiên bảo vệ gần nhất
          </p>
          <p className="mt-1 text-2xl font-bold text-white">
            {info?.defenseDate ? formatDate(info.defenseDate) : "Chưa có lịch"}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 text-sm text-white/90">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-[#00B4D8]" />
          <span>Phòng: {info?.room ?? "Đang cập nhật"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-[#00B4D8]" />
          <span>
            Giờ bắt đầu: {info?.startTime ? formatTime(info.startTime) : "Chờ xác định"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-[#00B4D8]" />
          <span>Đề tài: {info?.topicCount ?? 0}</span>
        </div>
      </div>
    </div>
  );
}

interface StatsSectionProps {
  stats: StatsSnapshot;
  assignedTopicsPercent: number;
  onOpenEligible: () => void;
}

export function StatsSection({ stats, assignedTopicsPercent, onOpenEligible }: StatsSectionProps) {
  return (
    <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Tổng số hội đồng"
        value={stats.totalCommittees.toLocaleString("vi-VN")}
        icon={<Users2 size={28} />}
        description="Hội đồng đã được thành lập trong hệ thống"
      />
      <StatCard
        title="Đề tài đủ điều kiện"
        value={stats.eligibleTopics.toLocaleString("vi-VN")}
        icon={<Layers3 size={28} />}
        description="Đề tài sẵn sàng phân công hội đồng"
        actionLabel="Xem danh sách"
        onAction={onOpenEligible}
      />
      <StatCard
        title="Đề tài đã phân hội đồng"
        value={stats.assignedTopics.toLocaleString("vi-VN")}
        icon={<CheckCircle2 size={28} />}
        description={`Tỷ lệ hoàn thành ${assignedTopicsPercent}%`}
        accent
      />
      <NextSessionCard info={stats.nextSession} />
    </section>
  );
}