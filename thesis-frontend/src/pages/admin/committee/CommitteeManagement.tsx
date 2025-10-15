import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  Filter,
  Layers3,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Users2,
} from "lucide-react";
import { useToast } from "../../../context/useToast";
import { committeeAssignmentApi } from "../../../api/committeeAssignmentApi";
import { committeeService, type EligibleTopicSummary } from "../../../services/committee-management.service";
import type {
  CommitteeAssignmentAutoAssignCommittee,
  CommitteeAssignmentAutoAssignRequest,
  CommitteeAssignmentDefenseItem,
  CommitteeAssignmentListItem,
} from "../../../api/committeeAssignmentApi";

  const PRIMARY_COLOR = "#1F3C88";
  const ACCENT_COLOR = "#00B4D8";
  const MUTED_BORDER = "#E2E8F0";
  const CARD_SHADOW = "0 18px 40px rgba(31, 60, 136, 0.08)";

  // ============================================================================
  // TYPES
  // ============================================================================

  interface FilterState {
    search: string;
    defenseDate: string;
    specialty: string;
    term: string;
    status: string;
  }

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

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

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

  function extractSoonestAssignment(
    assignments?: CommitteeAssignmentDefenseItem[] | null
  ): CommitteeAssignmentDefenseItem | null {
    if (!assignments || assignments.length === 0) {
      return null;
    }
    const sorted = [...assignments].sort((a, b) => {
      const dateA = new Date(a.scheduledAt ?? "").getTime();
      const dateB = new Date(b.scheduledAt ?? "").getTime();
      return dateA - dateB;
    });
    return sorted[0] ?? null;
  }

  function computeNextSessionCandidate(items: CommitteeAssignmentListItem[]): StatsSnapshot["nextSession"] {
    const upcoming = items
      .filter((item) => item.defenseDate)
      .map((item) => ({
        committeeCode: item.committeeCode,
        defenseDate: item.defenseDate,
        room: item.room,
        topicCount: item.topicCount ?? 0,
      }))
      .sort((a, b) => new Date(a.defenseDate ?? "").getTime() - new Date(b.defenseDate ?? "").getTime());

    return upcoming[0] ?? null;
  }

  // ============================================================================
  // MODAL SHELL COMPONENT
  // ============================================================================

  interface ModalShellProps {
    children: React.ReactNode;
    onClose: () => void;
    title: string;
    subtitle?: string;
    wide?: boolean;
  }

  function ModalShell({ children, onClose, title, subtitle, wide }: ModalShellProps) {
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



  // ============================================================================
  // FILTER BAR COMPONENT
  // ============================================================================

  function FilterChip({
    label,
    value,
    onChange,
    type = "text",
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: "text" | "date";
  }) {
    return (
      <label className="flex items-center gap-2 rounded-full border border-[#D9E1F2] bg-[#F8FAFF] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#4A5775] transition-colors hover:border-[#1F3C88]/50">
        {label}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="border-none bg-transparent text-xs font-medium uppercase text-[#1F3C88] outline-none placeholder:text-[#6B7A99]"
          placeholder="Tất cả"
        />
      </label>
    );
  }

  interface FilterBarProps {
    filters: FilterState;
    onFilterChange: (field: keyof FilterState, value: string) => void;
    onSearchChange: (value: string) => void;
  }

  function FilterBar({ filters, onFilterChange, onSearchChange }: FilterBarProps) {
    return (
      <section className="rounded-3xl border border-[#D9E1F2] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 rounded-full border border-[#D9E1F2] bg-white px-3 py-1.5 transition-colors focus-within:border-[#1F3C88]">
            <Search size={16} className="text-[#1F3C88]" />
            <input
              value={filters.search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Tìm kiếm hội đồng, mã, phòng..."
              className="w-56 border-none bg-transparent text-sm outline-none placeholder:text-[#6B7A99]"
            />
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1F3C88]">
            <Filter size={16} />
            Bộ lọc
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <FilterChip
              label="Ngày bảo vệ"
              value={filters.defenseDate}
              onChange={(value) => onFilterChange("defenseDate", value)}
              type="date"
            />
            <FilterChip
              label="Chuyên ngành"
              value={filters.specialty}
              onChange={(value) => onFilterChange("specialty", value)}
            />
            <FilterChip
              label="Học kỳ"
              value={filters.term}
              onChange={(value) => onFilterChange("term", value)}
            />
            <FilterChip
              label="Trạng thái"
              value={filters.status}
              onChange={(value) => onFilterChange("status", value)}
            />
          </div>
        </div>
      </section>
    );
  }

  // ============================================================================
  // STATS SECTION COMPONENT
  // ============================================================================

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

  function StatsSection({ stats, assignedTopicsPercent, onOpenEligible }: StatsSectionProps) {
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

  // ============================================================================
  // COMMITTEE TABLE COMPONENT
  // ============================================================================

  interface CommitteeTableProps {
    data: CommitteeAssignmentListItem[];
    loading: boolean;
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (direction: "next" | "prev") => void;
    onViewDetail: (committeeCode: string) => void;
    onDelete: (committeeCode: string) => void;
    resolveTagLabel: (tagCode: string) => string;
  }

  function CommitteeTable({
    data,
    loading,
    page,
    pageSize,
    total,
    onPageChange,
    onViewDetail,
    onDelete,
    resolveTagLabel,
  }: CommitteeTableProps) {
    return (
      <section className="rounded-3xl border border-[#D9E1F2] bg-white p-5 shadow-sm">
        {loading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="animate-spin">
              <RefreshCw size={32} className="text-[#1F3C88]" />
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5ECFB] bg-[#F8FAFF]">
                    <th className="px-4 py-3 text-left font-semibold text-[#1F3C88]">Mã hội đồng</th>
                    <th className="px-4 py-3 text-left font-semibold text-[#1F3C88]">Phòng</th>
                    <th className="px-4 py-3 text-left font-semibold text-[#1F3C88]">Ngày bảo vệ</th>
                    <th className="px-4 py-3 text-left font-semibold text-[#1F3C88]">Chuyên môn</th>
                    <th className="px-4 py-3 text-left font-semibold text-[#1F3C88]">Đề tài</th>
                    <th className="px-4 py-3 text-left font-semibold text-[#1F3C88]">Trạng thái</th>
                    <th className="px-4 py-3 text-center font-semibold text-[#1F3C88]">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-[#4A5775]">
                        Chưa có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    data.map((item) => (
                      <tr key={item.committeeCode} className="border-b border-[#E5ECFB] hover:bg-[#F8FAFF]">
                        <td className="px-4 py-3 font-semibold text-[#1F3C88]">{item.committeeCode}</td>
                        <td className="px-4 py-3 text-[#4A5775]">{item.room || "—"}</td>
                        <td className="px-4 py-3 text-[#4A5775]">
                          {item.defenseDate ? formatDate(item.defenseDate) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {item.tagCodes?.slice(0, 2).map((tag) => (
                              <span key={tag} className="rounded-full bg-[#1F3C88]/10 px-2 py-1 text-xs text-[#1F3C88]">
                                {resolveTagLabel(tag)}
                              </span>
                            ))}
                            {(item.tagCodes?.length ?? 0) > 2 && (
                              <span className="text-xs text-[#4A5775]">+{(item.tagCodes?.length ?? 0) - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#1F3C88]">{item.topicCount ?? 0}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            item.status === "Hoạt động"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}>
                            {item.status || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => onViewDetail(item.committeeCode)}
                              className="rounded-md bg-[#1F3C88] px-3 py-1 text-xs font-semibold text-white hover:bg-[#162B61]"
                            >
                              Xem chi tiết
                            </button>
                            <button
                              onClick={() => onDelete(item.committeeCode)}
                              className="rounded-md bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-[#4A5775]">
                Trang {page} của {Math.max(1, Math.ceil(total / pageSize))} ({total} hội đồng)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => onPageChange("prev")}
                  disabled={page === 1}
                  className="rounded-full border border-[#D9E1F2] px-4 py-1 text-sm font-semibold text-[#1F3C88] disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  onClick={() => onPageChange("next")}
                  disabled={page >= Math.ceil(total / pageSize)}
                  className="rounded-full border border-[#D9E1F2] px-4 py-1 text-sm font-semibold text-[#1F3C88] disabled:opacity-50"
                >
                  Tiếp theo
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    );
  }

  // ============================================================================
  // ELIGIBLE TOPIC MODAL COMPONENT
  // ============================================================================

  interface EligibleTopicModalProps {
    topics: EligibleTopicSummary[];
    loading: boolean;
    mode: "assign" | "multi-select";
    onClose: () => void;
    onAssign?: (topic: EligibleTopicSummary) => void;
    onToggleTopic?: (topicCode: string, checked: boolean) => void;
    onConfirmSelection?: () => void;
    selectedTopicCodes?: string[];
  }

  function EligibleTopicModal({
    topics,
    loading,
    mode,
    onClose,
    onAssign,
    onToggleTopic,
    onConfirmSelection,
    selectedTopicCodes = [],
  }: EligibleTopicModalProps) {
    return (
      <ModalShell title="Danh sách đề tài đủ điều kiện" onClose={onClose} wide>
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <RefreshCw size={32} className="animate-spin text-[#1F3C88]" />
          </div>
        ) : (
          <div className="space-y-4">
            {topics.length === 0 ? (
              <div className="rounded-2xl border border-[#E5ECFB] bg-[#F8FAFF] p-6 text-center">
                <p className="text-[#4A5775]">Không có đề tài đủ điều kiện.</p>
              </div>
            ) : (
              <>
                <div className="max-h-[400px] space-y-3 overflow-y-auto">
                  {topics.map((topic) => (
                    <div key={topic.topicCode} className="rounded-2xl border border-[#E5ECFB] bg-[#F8FAFF] p-4">
                      <div className="flex items-start gap-3">
                        {mode === "multi-select" && onToggleTopic && (
                          <input
                            type="checkbox"
                            checked={selectedTopicCodes.includes(topic.topicCode)}
                            onChange={(e) => onToggleTopic(topic.topicCode, e.target.checked)}
                            className="mt-1"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-[#1F3C88]">{topic.title}</p>
                          <p className="text-sm text-[#4A5775]">Mã: {topic.topicCode}</p>
                          {topic.studentName && (
                            <p className="text-sm text-[#4A5775]">Sinh viên: {topic.studentName}</p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {topic.tagDescriptions?.map((tag) => (
                              <span key={tag} className="rounded-full bg-[#1F3C88]/10 px-2 py-0.5 text-xs text-[#1F3C88]">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        {mode === "assign" && onAssign && (
                          <button
                            onClick={() => onAssign(topic)}
                            className="rounded-md bg-[#1F3C88] px-3 py-1 text-xs font-semibold text-white hover:bg-[#162B61]"
                          >
                            Gán
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {mode === "multi-select" && onConfirmSelection && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={onClose}
                      className="flex-1 rounded-full border border-[#D9E1F2] px-4 py-2 font-semibold text-[#1F3C88]"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={onConfirmSelection}
                      className="flex-1 rounded-full bg-[#FF6B35] px-4 py-2 font-semibold text-white"
                    >
                      Xác nhận ({selectedTopicCodes.length})
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </ModalShell>
    );
  }

  // ============================================================================
  // ASSIGN TOPIC MODAL COMPONENT
  // ============================================================================

  interface AssignTopicModalProps {
    topic: EligibleTopicSummary;
    committees: CommitteeAssignmentListItem[];
    onClose: () => void;
    onSubmit: (payload: {
      committeeCode: string;
      scheduledAt: string;
      session: number;
      startTime?: string;
      endTime?: string;
    }) => Promise<void>;
  }

  function AssignTopicModal({ topic, committees, onClose, onSubmit }: AssignTopicModalProps) {
    const [committeeCode, setCommitteeCode] = useState("");
    const [scheduledAt, setScheduledAt] = useState("");
    const [session, setSession] = useState("1");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
      if (!committeeCode || !scheduledAt) {
        alert("Vui lòng chọn hội đồng và ngày bảo vệ");
        return;
      }
      setSubmitting(true);
      try {
        await onSubmit({
          committeeCode,
          scheduledAt,
          session: Number(session),
          startTime,
          endTime,
        });
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <ModalShell title="Gán đề tài cho hội đồng" subtitle={topic.title} onClose={onClose}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#1F3C88]">Hội đồng</label>
            <select
              value={committeeCode}
              onChange={(e) => setCommitteeCode(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#D9E1F2] px-3 py-2 text-sm"
            >
              <option value="">-- Chọn hội đồng --</option>
              {committees.map((c) => (
                <option key={c.committeeCode} value={c.committeeCode}>
                  {c.committeeCode} ({c.room})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1F3C88]">Ngày bảo vệ</label>
            <input
              type="date"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#D9E1F2] px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1F3C88]">Phiên</label>
            <select
              value={session}
              onChange={(e) => setSession(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#D9E1F2] px-3 py-2 text-sm"
            >
              <option value="1">Sáng</option>
              <option value="2">Chiều</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-[#1F3C88]">Giờ bắt đầu</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#D9E1F2] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1F3C88]">Giờ kết thúc</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#D9E1F2] px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={onClose}
              className="flex-1 rounded-full border border-[#D9E1F2] px-4 py-2 font-semibold text-[#1F3C88]"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 rounded-full bg-[#FF6B35] px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              {submitting ? "Đang gán..." : "Gán đề tài"}
            </button>
          </div>
        </div>
      </ModalShell>
    );
  }

  // ============================================================================
  // AUTO ASSIGN MODAL COMPONENT
  // ============================================================================

  interface AutoAssignModalProps {
    loading: boolean;
    result: CommitteeAssignmentAutoAssignCommittee[] | null;
    committees: CommitteeAssignmentListItem[];
    onSubmit: (request: CommitteeAssignmentAutoAssignRequest) => Promise<void>;
    onClose: () => void;
  }

  function AutoAssignModal({ loading, result, committees, onSubmit, onClose }: AutoAssignModalProps) {
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
      setSubmitting(true);
      try {
        await onSubmit({ committeeCodes: committees.map((c) => c.committeeCode) });
      } finally {
        setSubmitting(false);
      }
    };

    if (result) {
      return (
        <ModalShell title="Kết quả tự động phân công" onClose={onClose} wide>
          <div className="space-y-3">
            {result.map((item) => (
              <div key={item.committeeCode} className="rounded-2xl border border-[#E5ECFB] bg-[#F8FAFF] p-4">
                <p className="font-semibold text-[#1F3C88]">{item.committeeCode}</p>
                <p className="text-sm text-[#4A5775]">Đề tài gán: {item.assignedCount ?? 0}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-full bg-[#FF6B35] px-4 py-2 font-semibold text-white"
            >
              Đóng
            </button>
          </div>
        </ModalShell>
      );
    }

    return (
      <ModalShell title="Tự động phân công đề tài" onClose={onClose}>
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <RefreshCw size={32} className="animate-spin text-[#1F3C88]" />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[#4A5775]">
              Hệ thống sẽ tự động phân công các đề tài đủ điều kiện cho các hội đồng phù hợp.
            </p>
            <div className="flex gap-2 pt-4">
              <button
                onClick={onClose}
                className="flex-1 rounded-full border border-[#D9E1F2] px-4 py-2 font-semibold text-[#1F3C88]"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 rounded-full bg-[#FF6B35] px-4 py-2 font-semibold text-white disabled:opacity-50"
              >
                {submitting ? "Đang xử lý..." : "Thực hiện phân công"}
              </button>
            </div>
          </div>
        )}
      </ModalShell>
    );
  }

  // ============================================================================
  // HEADER SECTION COMPONENT
  // ============================================================================

  function HeaderSection({
    onRefresh,
    openWizard,
    openAutoAssign,
  }: {
    onRefresh: () => void | Promise<void>;
    openWizard: () => void | Promise<void>;
    openAutoAssign: () => void | Promise<void>;
  }) {
    return (
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p
              className="text-sm font-semibold uppercase tracking-widest"
              style={{ color: PRIMARY_COLOR }}
            >
              Hệ thống quản trị FIT - Đại học Đại Nam
            </p>
            <h1 className="mt-1 text-3xl font-bold text-[#0F1C3F]">
              Quản lý và phân công Hội đồng bảo vệ đồ án tốt nghiệp
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onRefresh}
              className="flex items-center gap-2 rounded-full border border-[#D9E1F2] bg-white px-4 py-2 text-sm font-semibold text-[#FF6B35] shadow-sm transition hover:border-[#FF6B35] hover:text-[#FF6B35]"
            >
              <RefreshCw size={16} /> Tải lại dữ liệu
            </button>
            <button
              type="button"
              onClick={openAutoAssign}
              className="flex items-center gap-2 rounded-full border border-[#1F3C88] bg-[#1F3C88]/10 px-4 py-2 text-sm font-semibold text-[#1F3C88] shadow-sm transition hover:bg-[#1F3C88]/20"
            >
              <Layers3 size={16} /> Tự động phân công
            </button>
            <button
              type="button"
              onClick={openWizard}
              className="flex items-center gap-2 rounded-full bg-[#FF6B35] px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-[#E55A2B]"
            >
              <Plus size={18} className="text-white" /> Tạo hội đồng mới
            </button>
          </div>
        </div>
      </header>
    );
  }

  // ============================================================================
  // MAIN COMPONENT
  // ============================================================================

  const CommitteeManagement: React.FC = () => {
    const pageSize = 10;

    // UI state
    const [page, setPage] = useState<number>(1);
    const [tableLoading, setTableLoading] = useState(false);
    const [filters, setFilters] = useState<FilterState>({ search: "", defenseDate: "", specialty: "", term: "", status: "" });
    const [committeeRows, setCommitteeRows] = useState<CommitteeAssignmentListItem[]>([]);
    const [totalRows, setTotalRows] = useState<number>(0);
    const [stats, setStats] = useState<StatsSnapshot>({ totalCommittees: 0, eligibleTopics: 0, assignedTopics: 0, nextSession: null });

    // modal / transient state
    const defaultModalState = useMemo(() => ({ eligibleTopics: false, assignTopic: false, autoAssign: false }), []);
    const [modals, setModals] = useState(defaultModalState);
    const [assigningTopic, setAssigningTopic] = useState<EligibleTopicSummary | null>(null);
    const [autoAssignResult, setAutoAssignResult] = useState<CommitteeAssignmentAutoAssignCommittee[] | null>(null);
    const [autoAssignLoading, setAutoAssignLoading] = useState(false);

    // eligible topic list state
    const [eligibleTopicList, setEligibleTopicList] = useState<EligibleTopicSummary[]>([]);
    const [eligibleLoading, setEligibleLoading] = useState(false);
    const [eligibleMode, setEligibleMode] = useState<"assign" | "multi-select">("assign");
    const [eligibleSelectedCodes, setEligibleSelectedCodes] = useState<string[]>([]);
    const eligibleConfirmRef = useRef<(topics: EligibleTopicSummary[]) => void>(() => {});

    // cached helpers and tag dictionary
    const cachedTags = useRef<{ tagCode: string; tagName: string; description?: string | null }[] | null>(null);
    const cachedTagDictionary = useRef<Record<string, { name: string; description?: string | null }>>({});
    const [tagDictionary, setTagDictionary] = useState<Record<string, { name: string; description?: string | null }>>({});

    // delete state
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const { addToast } = useToast();

    const closeAllModals = useCallback(() => {
      setModals(defaultModalState);
      setAssigningTopic(null);
      setAutoAssignResult(null);
      setEligibleSelectedCodes([]);
      eligibleConfirmRef.current = () => {};
    }, [defaultModalState]);

    const openAutoAssignModal = useCallback(() => {
      setAutoAssignResult(null);
      setModals((prev) => ({ ...prev, autoAssign: true }));
    }, []);

    const refreshStats = useCallback(
      async (signal?: AbortSignal) => {
        setTableLoading(true);
        try {
          const [listResponse, eligibleCount] = await Promise.all([
            committeeAssignmentApi.listCommittees(
              {
                page,
                pageSize,
                search: filters.search,
                defenseDate: filters.defenseDate || undefined,
              },
              { signal }
            ),
            committeeService.eligibleTopicCount({ signal }),
          ]);

          if (signal?.aborted) return;

          if (listResponse?.success && listResponse.data) {
            setCommitteeRows(listResponse.data.items ?? []);
            setTotalRows(listResponse.data.totalCount ?? 0);

            const assignedTopicSum = (listResponse.data.items ?? []).reduce(
              (sum, item) => sum + (item.topicCount ?? 0),
              0
            );

            const nextSession = computeNextSessionCandidate(listResponse.data.items ?? []);
            let nextSessionEnriched: StatsSnapshot["nextSession"] = nextSession;

            if (nextSession?.defenseDate) {
              try {
                const detail = await committeeAssignmentApi.getCommitteeDetail(nextSession.committeeCode, { signal });
                if (!signal?.aborted && detail?.success && detail.data) {
                  const soonest = extractSoonestAssignment(detail.data.assignments);
                  const baseTopicCount = detail.data.assignments?.length ?? nextSession?.topicCount ?? 0;

                  nextSessionEnriched = {
                    committeeCode: detail.data.committeeCode,
                    defenseDate:
                      soonest?.scheduledAt ?? detail.data.defenseDate ?? nextSession?.defenseDate ?? null,
                    room: soonest?.room ?? detail.data.room ?? nextSession?.room ?? null,
                    startTime: soonest?.startTime ?? undefined,
                    topicCount: baseTopicCount,
                  };
                }
              } catch (detailError) {
                console.warn("Unable to enrich next session", detailError);
              }
            }

            setStats({
              totalCommittees: listResponse.data.totalCount ?? 0,
              eligibleTopics: eligibleCount,
              assignedTopics: assignedTopicSum,
              nextSession: nextSessionEnriched,
            });
          }
        } catch (error) {
          if (!signal?.aborted) {
            console.error("Không thể tải dữ liệu hội đồng", error);
          }
        } finally {
          if (!signal?.aborted) {
            setTableLoading(false);
          }
        }
      },
      [filters.defenseDate, filters.search, page, pageSize]
    );

    useEffect(() => {
      const controller = new AbortController();
      refreshStats(controller.signal);
      return () => controller.abort();
    }, [refreshStats]);

    useEffect(() => {
      const controller = new AbortController();
      if (cachedTags.current) {
        setTagDictionary(cachedTagDictionary.current);
      } else {
        committeeAssignmentApi
          .getTags({ signal: controller.signal })
          .then((response) => {
            if (!response?.success || !response.data) return;
            const dictionary: Record<string, { name: string; description?: string | null }> = {};
            response.data.forEach((tag) => {
              dictionary[tag.tagCode] = { name: tag.tagName, description: tag.description };
            });
            cachedTags.current = response.data.map((tag) => ({
              tagCode: tag.tagCode,
              tagName: tag.tagName,
              description: tag.description,
            }));
            cachedTagDictionary.current = dictionary;
            setTagDictionary(dictionary);
          })
          .catch((error) => {
            if (controller.signal.aborted) return;
            console.warn("Không thể tải danh sách tag", error);
          });
      }
      return () => controller.abort();
    }, []);

    const closeEligibleModal = useCallback(() => {
      setModals((prev) => ({ ...prev, eligibleTopics: false }));
      setEligibleSelectedCodes([]);
      eligibleConfirmRef.current = () => {};
    }, []);

    const openEligibleModal = useCallback(
      async (config: { mode?: "assign" | "multi-select"; initialSelectedCodes?: string[]; onConfirm?: (topics: EligibleTopicSummary[]) => void } = {}) => {
        const desiredMode = config.mode ?? "assign";
        setEligibleMode(desiredMode);
        setEligibleSelectedCodes(config.initialSelectedCodes ?? []);
        eligibleConfirmRef.current = config.onConfirm ?? (() => {});

        setEligibleLoading(true);
        setModals((prev) => ({ ...prev, eligibleTopics: true }));
        try {
          const topics = await committeeService.eligibleTopicSummaries();
          setEligibleTopicList(topics);
        } catch (error) {
          console.error("Không thể lấy danh sách đề tài đủ điều kiện", error);
          setEligibleTopicList([]);
        } finally {
          setEligibleLoading(false);
        }
      },
      []
    );

    const handleToggleEligibleTopic = useCallback((topicCode: string, checked: boolean) => {
      setEligibleSelectedCodes((prev) => {
        if (checked) {
          if (prev.includes(topicCode)) return prev;
          return [...prev, topicCode];
        }
        return prev.filter((code) => code !== topicCode);
      });
    }, []);

    const handleConfirmEligibleTopics = useCallback(() => {
      const selectedSet = new Set(eligibleSelectedCodes);
      const selectedTopics = eligibleTopicList.filter((topic) => selectedSet.has(topic.topicCode));
      eligibleConfirmRef.current(selectedTopics);
      eligibleConfirmRef.current = () => {};
      closeEligibleModal();
    }, [eligibleSelectedCodes, eligibleTopicList, closeEligibleModal]);

    const handleRefreshClick = useCallback(() => {
      const controller = new AbortController();
      refreshStats(controller.signal);
    }, [refreshStats]);

    const handleFilterChange = useCallback(
      (key: keyof FilterState, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPage(1);
      },
      []
    );

    const assignedTopicsPercent = useMemo(() => {
      if (!stats.eligibleTopics) return 0;
      const pct = (stats.assignedTopics / stats.eligibleTopics) * 100;
      return Math.min(100, Math.round(pct));
    }, [stats.assignedTopics, stats.eligibleTopics]);

    const handlePageChange = useCallback((direction: "next" | "prev") => {
      setPage((prev) => {
        if (direction === "prev") {
          return Math.max(1, prev - 1);
        }
        const maxPage = Math.max(1, Math.ceil(totalRows / pageSize));
        return Math.min(maxPage, prev + 1);
      });
    }, [pageSize, totalRows]);

    const navigate = useNavigate();
    const openWizard = useCallback(() => {
      navigate('/admin/committees-new/create');
    }, [navigate]);

    const getTagLabel = useCallback(
      (tagCode: string) => {
        const entry = tagDictionary[tagCode];
        return entry?.description || entry?.name || tagCode;
      },
      [tagDictionary]
    );

    const submitAutoAssign = useCallback(
      async (request: CommitteeAssignmentAutoAssignRequest) => {
        setAutoAssignLoading(true);
        try {
          const response = await committeeAssignmentApi.autoAssignTopics(request);
          if (!response?.success || !response.data) {
            throw new Error(response?.message || "Không thể tự động phân công");
          }
          setAutoAssignResult(response.data.committees ?? []);
          handleRefreshClick();
        } catch (error) {
          console.error(error);
          addToast((error as Error).message || "Lỗi tự động phân công", "error");
        } finally {
          setAutoAssignLoading(false);
        }
      },
      [handleRefreshClick, addToast]
    );

    const beginManualAssign = useCallback((topic: EligibleTopicSummary) => {
      setAssigningTopic(topic);
      setModals((prev) => ({ ...prev, assignTopic: true }));
    }, []);

    const submitManualAssign = useCallback(
      async (payload: {
        committeeCode: string;
        scheduledAt: string;
        session: number;
        startTime?: string;
        endTime?: string;
      }) => {
        if (!assigningTopic) return;
        try {
          const response = await committeeAssignmentApi.assignTopics({
            committeeCode: payload.committeeCode,
            scheduledAt: payload.scheduledAt,
            session: payload.session,
            items: [
              {
                topicCode: assigningTopic.topicCode,
                startTime: payload.startTime,
                endTime: payload.endTime,
              },
            ],
          });

          if (!response?.success) {
            throw new Error(response?.message || "Không thể gán đề tài");
          }

          addToast("Gán đề tài thành công", "success");
          closeAllModals();
          handleRefreshClick();
        } catch (error) {
          console.error(error);
          addToast((error as Error).message || "Lỗi gán đề tài", "error");
        }
      },
      [assigningTopic, closeAllModals, handleRefreshClick, addToast]
    );

    return (
      <div className="min-h-screen bg-[#F5F7FB] py-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6">
          <HeaderSection
            onRefresh={handleRefreshClick}
            openWizard={openWizard}
            openAutoAssign={openAutoAssignModal}
          />
          <StatsSection
            stats={stats}
            assignedTopicsPercent={assignedTopicsPercent}
            onOpenEligible={() => openEligibleModal({ mode: "assign" })}
          />
          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onSearchChange={(value) => handleFilterChange("search", value)}
          />
          <CommitteeTable
            data={committeeRows}
            loading={tableLoading}
            page={page}
            pageSize={pageSize}
            total={totalRows}
            onPageChange={handlePageChange}
            onViewDetail={() => {}}
            onDelete={(committeeCode: string) => setDeleteTarget(committeeCode)}
            resolveTagLabel={getTagLabel}
          />
        </div>

        {modals.eligibleTopics && (
          <EligibleTopicModal
            topics={eligibleTopicList}
            loading={eligibleLoading}
            mode={eligibleMode}
            onClose={closeEligibleModal}
            onAssign={eligibleMode === "assign" ? beginManualAssign : undefined}
            onToggleTopic={eligibleMode === "multi-select" ? handleToggleEligibleTopic : undefined}
            onConfirmSelection={eligibleMode === "multi-select" ? handleConfirmEligibleTopics : undefined}
            selectedTopicCodes={eligibleMode === "multi-select" ? eligibleSelectedCodes : []}
          />
        )}

        {deleteTarget && (
          <ModalShell
            onClose={() => setDeleteTarget(null)}
            title="Xác nhận xóa hội đồng"
            subtitle={`Bạn có chắc muốn xóa hội đồng ${deleteTarget}?`}
          >
            <div className="flex flex-col gap-4">
              <p className="text-sm text-[#4A5775]">Hành động này không thể hoàn tác.</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="rounded-full border border-[#D9E1F2] px-4 py-2"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={async () => {
                    if (!deleteTarget) return;
                    setDeleting(true);
                    try {
                      const res = await committeeAssignmentApi.deleteCommittee(deleteTarget, true);
                      if (res?.success) {
                        await refreshStats();
                        addToast(`Đã xóa hội đồng ${deleteTarget}`, "success");
                        setDeleteTarget(null);
                      } else {
                        throw new Error(res?.message || "Xóa thất bại");
                      }
                    } catch (err: unknown) {
                      console.error("Delete committee failed", err);
                      addToast((err as Error)?.message ?? "Xóa thất bại", "error");
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  className="rounded-full bg-[#FF6B35] px-4 py-2 text-white"
                >
                  {deleting ? "Đang xóa..." : "Xóa hội đồng"}
                </button>
              </div>
            </div>
          </ModalShell>
        )}

        {modals.assignTopic && assigningTopic && (
          <AssignTopicModal
            topic={assigningTopic}
            committees={committeeRows}
            onClose={closeAllModals}
            onSubmit={submitManualAssign}
          />
        )}

        {modals.autoAssign && (
          <AutoAssignModal
            loading={autoAssignLoading}
            result={autoAssignResult}
            committees={committeeRows}
            onSubmit={submitAutoAssign}
            onClose={closeAllModals}
          />
        )}
      </div>
    );
  };

export default CommitteeManagement;

