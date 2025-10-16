import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Filter,
  GraduationCap,
  Loader2,
  Layers3,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Users,
  Users2,
} from "lucide-react";
import { useToast } from "../../context/useToast";
import { committeeAssignmentApi, getCommitteeCreateInit, saveCommitteeMembers } from "../../api/committeeAssignmentApi";
import { fetchData } from "../../api/fetchData";
import type { ApiResponse } from "../../types/api";
import type { LecturerProfile } from "../../types/lecturer-profile";
import type { LecturerTag } from "../../types/tag";
import { committeeService, type EligibleTopicSummary, wizardRoles } from "../../services/committee-management.service";
import type {
  CommitteeAssignmentAutoAssignCommittee,
  CommitteeAssignmentAutoAssignRequest,
  CommitteeAssignmentAvailableLecturer,
  CommitteeAssignmentAvailableTopic,
  CommitteeAssignmentDefenseItem,
  CommitteeAssignmentListItem,
  CommitteeAssignmentCreateRequest,
  CommitteeCreateInitDto,
} from "../../types/committee-assignment";

  const PRIMARY_COLOR = "#1F3C88";
  const ACCENT_COLOR = "#F37021";
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

  interface PhaseOneFormState {
    name: string;
    room: string;
    defenseDate: string;
    tagCodes: string[];
    status: string;
  }

  interface SelectedLecturer {
    lecturerProfileId: number;
    lecturerCode: string;
    fullName: string;
    degree?: string | null;
    departmentCode?: string | null;
    role: string;
    isChair: boolean;
    isEligibleChair: boolean;
    defenseQuota: number;
    currentDefenseLoad: number;
  }

  interface SelectedTopicAssignment {
    topicCode: string;
    title: string;
    studentName?: string | null;
    supervisorName?: string | null;
    session: number;
    startTime: string;
    endTime: string;
    tagDescriptions?: string[];
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

  function toDateInputValue(value?: string | Date | null) {
    if (!value) return "";
    const source = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(source.getTime())) return "";
    const tzOffset = source.getTimezoneOffset();
    const normalized = new Date(source.getTime() - tzOffset * 60_000);
    return normalized.toISOString().slice(0, 10);
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
  // WIZARD STEP INDICATOR
  // ============================================================================

  const WIZARD_STEPS: Array<{
    step: number;
    label: string;
    description: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }> = [
    {
      step: 1,
      label: "Thông tin chung",
      description: "Tạo mã hội đồng và lịch bảo vệ",
      icon: ClipboardList,
    },
    {
      step: 2,
      label: "Thành viên",
      description: "Chọn giảng viên và vai trò",
      icon: Users,
    },
    {
      step: 3,
      label: "Đề tài",
      description: "Sắp lịch bảo vệ cho đề tài",
      icon: GraduationCap,
    },
  ];

  function WizardStepIndicator({ current }: { current: number }) {
    return (
      <ol className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-stretch">
        {WIZARD_STEPS.map((item, index) => {
          const Icon = item.icon;
          const completed = current > item.step;
          const active = current === item.step;
          return (
            <li
              key={item.step}
              className={`flex flex-1 items-center gap-3 rounded-2xl border px-4 py-4 transition ${
                active
                  ? "border-[#1F3C88] bg-[#F1F5FF] shadow-lg"
                  : completed
                    ? "border-[#50C878] bg-[#F2FFF7]"
                    : "border-[#E5ECFB] bg-white"
              }`}
            >
              <span
                className={`inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                  active
                    ? "border-[#1F3C88] bg-white text-[#1F3C88]"
                    : completed
                      ? "border-[#50C878] bg-[#50C878] text-white"
                      : "border-[#E5ECFB] text-[#6B7A99]"
                }`}
              >
                {completed ? <Check size={22} /> : <Icon size={22} />}
              </span>
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${active ? "text-[#1F3C88]" : "text-[#1D2753]"}`}>
                  Bước {item.step}. {item.label}
                </p>
                <p className="text-xs text-[#4A5775]">{item.description}</p>
              </div>
              {index < WIZARD_STEPS.length - 1 && (
                <span className="hidden flex-1 border-t border-dashed border-[#D9E1F2] sm:block" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
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
                            {item.tagCodes?.slice(0, 2).map((tag: string) => (
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

    // wizard state
    const [wizardOpen, setWizardOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
    const [wizardInit, setWizardInit] = useState<CommitteeCreateInitDto | null>(null);
    const [wizardInitializing, setWizardInitializing] = useState(false);
    const [wizardSubmitting, setWizardSubmitting] = useState(false);
    const [wizardError, setWizardError] = useState<string | null>(null);
    const [phaseOneForm, setPhaseOneForm] = useState<PhaseOneFormState>({
      name: "",
      room: "",
      defenseDate: "",
      tagCodes: [],
      status: "Sắp diễn ra",
    });
    const [phaseOneErrors, setPhaseOneErrors] = useState<Record<string, string>>({});
    const [availableLecturers, setAvailableLecturers] = useState<CommitteeAssignmentAvailableLecturer[]>([]);
    const [lecturersLoading, setLecturersLoading] = useState(false);
    const [lecturerSearch, setLecturerSearch] = useState("");
    const [selectedLecturers, setSelectedLecturers] = useState<SelectedLecturer[]>([]);
    const [availableTopics, setAvailableTopics] = useState<CommitteeAssignmentAvailableTopic[]>([]);
    const [topicsLoading, setTopicsLoading] = useState(false);
    const [topicSearch, setTopicSearch] = useState("");
    const [selectedTopics, setSelectedTopics] = useState<SelectedTopicAssignment[]>([]);

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

    const resetWizard = useCallback(() => {
      setWizardStep(1);
      setWizardInit(null);
      setWizardInitializing(false);
      setWizardSubmitting(false);
      setWizardError(null);
      setPhaseOneForm({
        name: "",
        room: "",
        defenseDate: "",
        tagCodes: [],
        status: "Sắp diễn ra",
      });
      setPhaseOneErrors({});
      setAvailableLecturers([]);
      setSelectedLecturers([]);
      setLecturerSearch("");
      setAvailableTopics([]);
      setSelectedTopics([]);
      setTopicSearch("");
    }, []);

    const handleWizardClose = useCallback(() => {
      setWizardOpen(false);
      resetWizard();
    }, [resetWizard]);

    const initializeWizard = useCallback(async () => {
      setWizardInitializing(true);
      setWizardError(null);
      try {
        const response = await getCommitteeCreateInit();
        if (!response?.success || !response.data) {
          throw new Error(response?.message || "Không thể tải dữ liệu khởi tạo");
        }
        const init = response.data;
        setWizardInit(init);
        const initialTags = Array.isArray(init.suggestedTags)
          ? init.suggestedTags
              .map((tag) => {
                if (typeof tag === "string") return tag;
                if (tag && typeof tag.tagCode === "string") return tag.tagCode;
                return "";
              })
              .filter((code): code is string => Boolean(code && code.trim()))
          : [];
        setPhaseOneForm({
          name: init.nextCode ?? "",
          room: init.rooms?.[0] ?? "",
          defenseDate: toDateInputValue(init.defaultDefenseDate ?? null),
          tagCodes: initialTags,
          status: "Sắp diễn ra",
        });
        setPhaseOneErrors({});
      } catch (error) {
        console.error("Khởi tạo wizard thất bại", error);
        setWizardError((error as Error).message || "Không thể khởi tạo dữ liệu tạo hội đồng");
      } finally {
        setWizardInitializing(false);
      }
    }, []);

    const handleOpenWizard = useCallback(() => {
      resetWizard();
      setWizardOpen(true);
      void initializeWizard();
    }, [initializeWizard, resetWizard]);

    const handlePhaseOneFieldChange = useCallback((field: keyof PhaseOneFormState, value: string) => {
      setPhaseOneForm((prev) => ({ ...prev, [field]: value }));
      setPhaseOneErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }, []);

    const togglePhaseOneTag = useCallback((tagCode: string) => {
      setPhaseOneForm((prev) => {
        const exists = prev.tagCodes.includes(tagCode);
        const tagCodes = exists ? prev.tagCodes.filter((code) => code !== tagCode) : [...prev.tagCodes, tagCode];
        return { ...prev, tagCodes };
      });
      setPhaseOneErrors((prev) => {
        if (!prev.tagCodes) return prev;
        const next = { ...prev };
        delete next.tagCodes;
        return next;
      });
    }, []);

    const validatePhaseOne = useCallback(() => {
      const errors: Record<string, string> = {};
      if (!phaseOneForm.name.trim()) {
        errors.name = "Vui lòng nhập tên hội đồng";
      }
      if (!phaseOneForm.defenseDate) {
        errors.defenseDate = "Chọn ngày bảo vệ";
      }
      if (phaseOneForm.tagCodes.length === 0) {
        errors.tagCodes = "Chọn ít nhất một chuyên môn";
      }
      setPhaseOneErrors(errors);
      return Object.keys(errors).length === 0;
    }, [phaseOneForm.defenseDate, phaseOneForm.name, phaseOneForm.tagCodes]);

    const loadAvailableLecturers = useCallback(async () => {
      setLecturersLoading(true);
      try {
        // If no tag selected, fall back to fetching all lecturers
        if (!phaseOneForm.tagCodes || phaseOneForm.tagCodes.length === 0) {
          const res = await fetchData("/LecturerProfiles/get-list");
          const all: LecturerProfile[] = ((res as ApiResponse<LecturerProfile[]>)?.data) || [];
          const mapped = all.map((l) => ({
            lecturerProfileId: l.lecturerProfileID,
            lecturerCode: l.lecturerCode,
            fullName: l.fullName,
            name: l.fullName,
            degree: l.degree,
            departmentCode: l.departmentCode,
            specialties: null,
            specialtyCode: null,
            defenseQuota: l.defenseQuota ?? 0,
            currentDefenseLoad: l.currentGuidingCount ?? 0,
            availability: true,
            isEligibleChair: l.degree === "Tiến sĩ" || l.degree === "Phó giáo sư",
          }));
          setAvailableLecturers(mapped);
          return;
        }

        // Query LecturerTags for the selected tag codes (backend supports comma-separated TagCode)
        const tagQuery = encodeURIComponent(phaseOneForm.tagCodes.join(","));
  const tagsRes = await fetchData(`/LecturerTags/list?TagCode=${tagQuery}`);
  const lecturerTags: LecturerTag[] = ((tagsRes as ApiResponse<LecturerTag[]>)?.data) || [];

        // Collect unique lecturer codes
        const lecturerCodes = Array.from(new Set(lecturerTags.map((t) => t.lecturerCode).filter(Boolean)));

        // Fetch lecturers and filter by the collected codes
  const lecturersRes = await fetchData("/LecturerProfiles/get-list");
  const allLecturers: LecturerProfile[] = ((lecturersRes as ApiResponse<LecturerProfile[]>)?.data) || [];
        const filtered = allLecturers.filter((l) => lecturerCodes.includes(l.lecturerCode));

        const mapped = filtered.map((l) => ({
          lecturerProfileId: l.lecturerProfileID,
          lecturerCode: l.lecturerCode,
          fullName: l.fullName,
          name: l.fullName,
          degree: l.degree,
          departmentCode: l.departmentCode,
          specialties: null,
          specialtyCode: null,
          defenseQuota: l.defenseQuota ?? 0,
          currentDefenseLoad: l.currentGuidingCount ?? 0,
          availability: true,
          isEligibleChair: l.degree === "Tiến sĩ" || l.degree === "Phó giáo sư",
        }));

        setAvailableLecturers(mapped);
      } catch (error) {
        console.error("Không thể tải giảng viên", error);
        addToast((error as Error).message || "Không thể tải danh sách giảng viên", "error");
        setAvailableLecturers([]);
      } finally {
        setLecturersLoading(false);
      }
    }, [addToast, phaseOneForm.tagCodes]);

    const loadAvailableTopics = useCallback(async () => {
      setTopicsLoading(true);
      try {
        const response = await committeeAssignmentApi.getAvailableTopics(
          phaseOneForm.tagCodes.length > 0 ? { tag: phaseOneForm.tagCodes.join(",") } : undefined
        );
        if (!response?.success || !response.data) {
          throw new Error(response?.message || "Không thể tải danh sách đề tài");
        }
        setAvailableTopics(response.data);
      } catch (error) {
        console.error("Không thể tải đề tài", error);
        addToast((error as Error).message || "Không thể tải danh sách đề tài", "error");
        setAvailableTopics([]);
      } finally {
        setTopicsLoading(false);
      }
    }, [addToast, phaseOneForm.tagCodes]);

    const handleAddLecturer = useCallback((lecturer: CommitteeAssignmentAvailableLecturer) => {
      setSelectedLecturers((prev) => {
        if (prev.some((item) => item.lecturerCode === lecturer.lecturerCode)) {
          return prev;
        }
        const isFirst = prev.length === 0;
        const canBeChair = Boolean(lecturer.isEligibleChair);
        const asChair = isFirst && canBeChair;
        return [
          ...prev,
          {
            lecturerProfileId: lecturer.lecturerProfileId,
            lecturerCode: lecturer.lecturerCode,
            fullName: lecturer.fullName,
            degree: lecturer.degree,
            departmentCode: lecturer.departmentCode,
            role: asChair ? "Chủ tịch" : "Ủy viên",
            isChair: asChair,
            isEligibleChair: canBeChair,
            defenseQuota: lecturer.defenseQuota,
            currentDefenseLoad: lecturer.currentDefenseLoad,
          },
        ];
      });
    }, []);

    const handleRemoveLecturer = useCallback((lecturerCode: string) => {
      setSelectedLecturers((prev) => prev.filter((item) => item.lecturerCode !== lecturerCode));
    }, []);

    const handleLecturerRoleChange = useCallback(
      (lecturerCode: string, role: string) => {
        setSelectedLecturers((prev) => {
          const target = prev.find((item) => item.lecturerCode === lecturerCode);
          if (!target) return prev;
          if (role === "Chủ tịch" && !target.isEligibleChair) {
            addToast("Giảng viên này chưa đủ điều kiện để làm Chủ tịch.", "warning");
            return prev;
          }

          return prev.map((item) => {
            if (item.lecturerCode === lecturerCode) {
              return { ...item, role, isChair: role === "Chủ tịch" };
            }
            if (role === "Chủ tịch" && item.isChair) {
              return { ...item, isChair: false, role: item.role === "Chủ tịch" ? "Ủy viên" : item.role };
            }
            return item;
          });
        });
      },
      [addToast]
    );

    const handleLecturerMarkChair = useCallback(
      (lecturerCode: string) => {
        setSelectedLecturers((prev) => {
          const target = prev.find((item) => item.lecturerCode === lecturerCode);
          if (!target) return prev;
          if (!target.isEligibleChair) {
            addToast("Giảng viên này chưa đủ điều kiện để làm Chủ tịch.", "warning");
            return prev;
          }
          return prev.map((item) => {
            if (item.lecturerCode === lecturerCode) {
              return { ...item, isChair: true, role: "Chủ tịch" };
            }
            return { ...item, isChair: false, role: item.role === "Chủ tịch" ? "Ủy viên" : item.role };
          });
        });
      },
      [addToast]
    );

    const validatePhaseTwo = useCallback(() => {
      if (selectedLecturers.length < 4) {
        addToast("Cần tối thiểu 4 thành viên trong hội đồng.", "warning");
        return false;
      }
      const chairCount = selectedLecturers.filter((member) => member.isChair).length;
      if (chairCount !== 1) {
        addToast("Cần chọn chính xác 1 Chủ tịch cho hội đồng.", "warning");
        return false;
      }
      const chair = selectedLecturers.find((member) => member.isChair);
      if (chair && !chair.isEligibleChair) {
        addToast("Chủ tịch phải có học vị Tiến sĩ hoặc Phó giáo sư.", "warning");
        return false;
      }
      return true;
    }, [addToast, selectedLecturers]);

    const handleTopicToggle = useCallback((topic: CommitteeAssignmentAvailableTopic) => {
      setSelectedTopics((prev) => {
        const exists = prev.some((item) => item.topicCode === topic.topicCode);
        if (exists) {
          return prev.filter((item) => item.topicCode !== topic.topicCode);
        }
        return [
          ...prev,
          {
            topicCode: topic.topicCode,
            title: topic.title,
            studentName: topic.studentName ?? null,
            supervisorName: topic.supervisorName ?? null,
            session: 1,
            startTime: "",
            endTime: "",
            tagDescriptions: topic.tagDescriptions,
          },
        ];
      });
    }, []);

    const handleTopicFieldChange = useCallback((topicCode: string, field: "session" | "startTime" | "endTime", value: string) => {
      setSelectedTopics((prev) =>
        prev.map((item) =>
          item.topicCode === topicCode
            ? {
                ...item,
                [field]: field === "session" ? Number(value) || 1 : value,
              }
            : item
        )
      );
    }, []);

    const validatePhaseThree = useCallback(() => {
      if (wizardStep < 3) {
        return true;
      }
      for (const topic of selectedTopics) {
        if (topic.startTime && topic.endTime && topic.startTime >= topic.endTime) {
          addToast(`Giờ bắt đầu phải trước giờ kết thúc cho đề tài ${topic.topicCode}.`, "warning");
          return false;
        }
      }
      return true;
    }, [addToast, selectedTopics, wizardStep]);

    const handleWizardNext = useCallback(() => {
      if (wizardStep === 1) {
        if (!validatePhaseOne()) return;
        setWizardStep(2);
        return;
      }
      if (wizardStep === 2) {
        if (!validatePhaseTwo()) return;
        setWizardStep(3);
      }
    }, [validatePhaseOne, validatePhaseTwo, wizardStep]);

    const handleWizardBack = useCallback(() => {
      setWizardStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev));
    }, []);

    useEffect(() => {
      if (!wizardOpen) return;
      if (wizardStep === 2) {
        void loadAvailableLecturers();
      }
      if (wizardStep === 3) {
        void loadAvailableTopics();
      }
    }, [loadAvailableLecturers, loadAvailableTopics, wizardOpen, wizardStep]);

    const wizardTagNameLookup = useMemo(() => {
      const lookup: Record<string, string> = {};
      if (Array.isArray(wizardInit?.suggestedTags)) {
        wizardInit.suggestedTags.forEach((tag) => {
          if (typeof tag === "string") {
            lookup[tag] = tag;
          } else if (tag && typeof tag.tagCode === "string") {
            lookup[tag.tagCode] = tag.tagName ?? tag.tagCode;
          }
        });
      }
      return lookup;
    }, [wizardInit]);

    const wizardTagOptions = useMemo(() => {
      const codes = Object.keys(wizardTagNameLookup);
      if (codes.length > 0) {
        return codes;
      }
      return Object.keys(tagDictionary);
    }, [tagDictionary, wizardTagNameLookup]);

    const filteredLecturers = useMemo(() => {
      const keyword = lecturerSearch.trim().toLowerCase();
      return availableLecturers.filter((lecturer) => {
        const matchesKeyword = !keyword || lecturer.fullName.toLowerCase().includes(keyword) || lecturer.lecturerCode.toLowerCase().includes(keyword);
        return matchesKeyword;
      });
    }, [availableLecturers, lecturerSearch]);

    const filteredTopics = useMemo(() => {
      const keyword = topicSearch.trim().toLowerCase();
      return availableTopics.filter((topic) => {
        const matchesKeyword =
          !keyword ||
          topic.title.toLowerCase().includes(keyword) ||
          topic.topicCode.toLowerCase().includes(keyword) ||
          (topic.studentName ?? "").toLowerCase().includes(keyword);
        // Exclude topics where the supervisor is already part of the selected committee members
        const supervisorInCommittee = selectedLecturers.some((lect) => {
          if (topic.supervisorCode && lect.lecturerCode) return lect.lecturerCode === topic.supervisorCode;
          if (topic.supervisorName && lect.fullName) return lect.fullName === topic.supervisorName;
          return false;
        });
        return matchesKeyword && !supervisorInCommittee;
      });
  }, [availableTopics, topicSearch, selectedLecturers]);

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
          const filterPayload = {
            page,
            pageSize,
            search: filters.search,
            defenseDate: filters.defenseDate || undefined,
          };
          console.log("API Call: listCommittees with filters:", filterPayload);
          
          const [listResponse, eligibleCount] = await Promise.all([
            committeeAssignmentApi.listCommittees(filterPayload, { signal }),
            committeeService.eligibleTopicCount({ signal }),
          ]);

          console.log("listCommittees response:", listResponse);
          console.log("eligibleCount:", eligibleCount);

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
          } else {
            console.error("API response not successful:", listResponse?.message || "Unknown error");
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

    const handleWizardSubmit = useCallback(async () => {
      setWizardError(null);
      const validPhaseOne = validatePhaseOne();
      const validPhaseTwo = validatePhaseTwo();
      const validPhaseThree = validatePhaseThree();
      if (!validPhaseOne || !validPhaseTwo || !validPhaseThree) {
        return;
      }

      setWizardSubmitting(true);
      try {
        const normalizedCode = wizardInit?.nextCode?.trim() || `COM${new Date().getFullYear()}_${Date.now().toString(36).toUpperCase()}`;
        const createPayload: CommitteeAssignmentCreateRequest = {
          committeeCode: normalizedCode,
          name: phaseOneForm.name.trim() || normalizedCode,
          defenseDate: phaseOneForm.defenseDate || undefined,
          room: phaseOneForm.room.trim() || undefined,
          tagCodes: [...phaseOneForm.tagCodes],
          members: [],
          sessions: [],
        };

        const createResponse = await committeeAssignmentApi.createCommittee(createPayload);
        if (!createResponse?.success || !createResponse.data) {
          throw new Error(createResponse?.message || "Không thể tạo hội đồng");
        }

        const committeeCode = createResponse.data.committeeCode;

        if (selectedLecturers.length > 0) {
          const memberResponse = await saveCommitteeMembers({
            committeeCode,
            members: selectedLecturers.map((member) => ({
              lecturerProfileId: member.lecturerProfileId,
              role: member.isChair ? "Chủ tịch" : member.role || "Ủy viên",
              isChair: member.isChair,
            })),
          });
          if (!memberResponse?.success) {
            throw new Error(memberResponse?.message || "Không thể lưu thành viên hội đồng");
          }
        }

        if (selectedTopics.length > 0) {
          if (!phaseOneForm.defenseDate) {
            throw new Error("Thiếu ngày bảo vệ để gán đề tài");
          }

          const grouped = selectedTopics.reduce(
            (acc, item) => {
              const bucket = acc.get(item.session) ?? [];
              bucket.push({
                topicCode: item.topicCode,
                startTime: item.startTime || undefined,
                endTime: item.endTime || undefined,
              });
              acc.set(item.session, bucket);
              return acc;
            },
            new Map<number, { topicCode: string; startTime?: string; endTime?: string }[]>()
          );

          for (const [session, items] of grouped.entries()) {
            if (items.length === 0) continue;
            const assignResponse = await committeeAssignmentApi.assignTopics({
              committeeCode,
              scheduledAt: phaseOneForm.defenseDate,
              session,
              items: items.map((item) => ({
                topicCode: item.topicCode,
                session,
                scheduledAt: phaseOneForm.defenseDate,
                startTime: item.startTime || undefined,
                endTime: item.endTime || undefined,
              })),
            });
            if (!assignResponse?.success) {
              throw new Error(assignResponse?.message || `Không thể gán đề tài cho phiên ${session}`);
            }
          }
        }

        addToast("Tạo hội đồng thành công", "success");
        await refreshStats();
        resetWizard();
        setWizardOpen(false);
      } catch (error) {
        console.error("Không thể hoàn tất quy trình tạo hội đồng", error);
        const message = (error as Error).message || "Không thể hoàn tất quy trình";
        setWizardError(message);
        addToast(message, "error");
      } finally {
        setWizardSubmitting(false);
      }
    }, [
      addToast,
      phaseOneForm.defenseDate,
      phaseOneForm.name,
      phaseOneForm.room,
      phaseOneForm.tagCodes,
      refreshStats,
      resetWizard,
      selectedLecturers,
      selectedTopics,
      validatePhaseOne,
      validatePhaseThree,
      validatePhaseTwo,
      wizardInit?.nextCode,
    ]);

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
                session: payload.session,
                scheduledAt: payload.scheduledAt,
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
            openWizard={handleOpenWizard}
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
        {wizardOpen && (
          <ModalShell
            onClose={handleWizardClose}
            title="Quy trình tạo hội đồng mới"
            subtitle="Hoàn tất lần lượt 3 bước để kích hoạt hội đồng bảo vệ"
            wide
          >
            {wizardInitializing ? (
              <div className="flex h-72 items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-[#1F3C88]" />
              </div>
            ) : (
              <div className="space-y-6">
                {wizardError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {wizardError}
                  </div>
                )}

                <WizardStepIndicator current={wizardStep} />

                <AnimatePresence mode="wait">
                  {wizardStep === 1 && (
                    <motion.div
                      key="wizard-step-1"
                      initial={{ opacity: 0, x: -24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 24 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="grid gap-6 lg:grid-cols-[1.2fr_1fr]"
                    >
                      <div className="space-y-5">
                        <div className="rounded-2xl border border-[#E5ECFB] bg-[#F8FAFF] p-5">
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#1F3C88]">
                            Mã hội đồng gợi ý
                          </p>
                          <p className="mt-1 text-2xl font-bold text-[#0F1C3F]">
                            {wizardInit?.nextCode ?? "—"}
                          </p>
                          <p className="mt-2 text-sm text-[#4A5775]">
                            Bạn có thể thay đổi tên hội đồng bên dưới, mã sẽ tự động đồng bộ khi tạo.
                          </p>
                        </div>

                        <div className="space-y-4 rounded-2xl border border-[#E5ECFB] bg-white p-5 shadow-sm">
                          <label className="block space-y-2">
                            <span className="text-sm font-semibold text-[#1F3C88]">Tên hội đồng</span>
                            <input
                              value={phaseOneForm.name}
                              onChange={(event) => handlePhaseOneFieldChange("name", event.target.value)}
                              placeholder="VD: Hội đồng Bảo vệ Khoa Công nghệ thông tin"
                              className="w-full rounded-lg border border-[#D9E1F2] px-3 py-2 text-sm focus:border-[#1F3C88] focus:outline-none"
                            />
                            {phaseOneErrors.name && (
                              <span className="text-xs text-red-500">{phaseOneErrors.name}</span>
                            )}
                          </label>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <label className="space-y-2">
                              <span className="text-sm font-semibold text-[#1F3C88]">Ngày bảo vệ dự kiến</span>
                              <input
                                type="date"
                                value={phaseOneForm.defenseDate}
                                onChange={(event) => handlePhaseOneFieldChange("defenseDate", event.target.value)}
                                className="w-full rounded-lg border border-[#D9E1F2] px-3 py-2 text-sm focus:border-[#1F3C88] focus:outline-none"
                              />
                              {phaseOneErrors.defenseDate && (
                                <span className="text-xs text-red-500">{phaseOneErrors.defenseDate}</span>
                              )}
                            </label>

                            <label className="space-y-2">
                              <span className="text-sm font-semibold text-[#1F3C88]">Phòng bảo vệ</span>
                              <input
                                list="wizard-room-options"
                                value={phaseOneForm.room}
                                onChange={(event) => handlePhaseOneFieldChange("room", event.target.value)}
                                placeholder="VD: P.301 nhà A"
                                className="w-full rounded-lg border border-[#D9E1F2] px-3 py-2 text-sm focus:border-[#1F3C88] focus:outline-none"
                              />
                              <datalist id="wizard-room-options">
                                {(wizardInit?.rooms ?? []).map((room) => (
                                  <option key={room} value={room} />
                                ))}
                              </datalist>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-2xl border border-[#E5ECFB] bg-white p-5 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-[#1F3C88]">Lĩnh vực ưu tiên</span>
                            <span className="text-xs text-[#4A5775]">Chọn ≥ 1 tag</span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {wizardTagOptions.map((tagCode) => {
                              const selected = phaseOneForm.tagCodes.includes(tagCode);
                              const label = wizardTagNameLookup[tagCode] ?? tagDictionary[tagCode]?.name ?? tagCode;
                              return (
                                <button
                                  type="button"
                                  key={tagCode}
                                  onClick={() => togglePhaseOneTag(tagCode)}
                                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                                    selected
                                      ? "border-[#1F3C88] bg-[#1F3C88] text-white shadow"
                                      : "border-[#D9E1F2] bg-[#F8FAFF] text-[#1F3C88] hover:border-[#1F3C88]/50"
                                  }`}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                          {phaseOneErrors.tagCodes && (
                            <span className="mt-2 block text-xs text-red-500">{phaseOneErrors.tagCodes}</span>
                          )}
                        </div>

                        <div className="rounded-2xl border border-[#E5ECFB] bg-[#F8FAFF] p-5 text-sm text-[#4A5775]">
                          <p>
                            Hệ thống sẽ gợi ý giảng viên và đề tài phù hợp dựa trên tập tag bạn chọn. Bạn có thể
                            quay lại bước này bất kỳ lúc nào trước khi hoàn tất.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {wizardStep === 2 && (
                    <motion.div
                      key="wizard-step-2"
                      initial={{ opacity: 0, x: -24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 24 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="grid gap-6 lg:grid-cols-2"
                    >
                      <div className="flex flex-col gap-4 rounded-2xl border border-[#E5ECFB] bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-[#1F3C88]">Danh sách giảng viên khả dụng</span>
                          <span className="text-xs text-[#4A5775]">
                            {filteredLecturers.length.toLocaleString("vi-VN")}
                            {" "}giảng viên
                          </span>
                        </div>
                        <div className="flex items-center gap-2 rounded-full border border-[#D9E1F2] bg-[#F8FAFF] px-3 py-2 text-sm">
                          <Search size={16} className="text-[#1F3C88]" />
                          <input
                            value={lecturerSearch}
                            onChange={(event) => setLecturerSearch(event.target.value)}
                            placeholder="Tìm theo tên, mã giảng viên"
                            className="w-full border-none bg-transparent text-sm outline-none"
                          />
                        </div>

                        <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                          {lecturersLoading ? (
                            <div className="flex h-48 items-center justify-center">
                              <Loader2 className="h-10 w-10 animate-spin text-[#1F3C88]" />
                            </div>
                          ) : filteredLecturers.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-[#D9E1F2] bg-[#F8FAFF] px-4 py-6 text-center text-sm text-[#4A5775]">
                              Không tìm thấy giảng viên phù hợp với tiêu chí.
                            </div>
                          ) : (
                            filteredLecturers.map((lecturer) => {
                              const alreadySelected = selectedLecturers.some((item) => item.lecturerCode === lecturer.lecturerCode);
                              const reachingQuota = lecturer.defenseQuota > 0 && lecturer.currentDefenseLoad >= lecturer.defenseQuota;
                              return (
                                <div
                                  key={lecturer.lecturerCode}
                                  className="rounded-xl border border-[#E5ECFB] bg-[#F8FAFF] p-4"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="font-semibold text-[#1F3C88]">{lecturer.fullName}</p>
                                      <p className="text-xs text-[#4A5775]">Mã: {lecturer.lecturerCode}</p>
                                      <p className="text-xs text-[#4A5775]">
                                        Học vị: {lecturer.degree ?? "Đang cập nhật"}
                                      </p>
                                      {lecturer.specialties && (
                                        <p className="mt-2 text-xs text-[#4A5775]">
                                          Chuyên ngành: {lecturer.specialties}
                                        </p>
                                      )}
                                      <p className="mt-2 text-xs text-[#4A5775]">
                                        Phân công hiện tại: {lecturer.currentDefenseLoad}/{lecturer.defenseQuota || "∞"}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      disabled={alreadySelected || reachingQuota}
                                      onClick={() => handleAddLecturer(lecturer)}
                                      className="rounded-full border border-[#1F3C88] px-3 py-1 text-xs font-semibold text-[#1F3C88] transition enabled:hover:bg-[#1F3C88] enabled:hover:text-white disabled:opacity-50"
                                    >
                                      {alreadySelected ? "Đã thêm" : reachingQuota ? "Vượt định mức" : "Thêm"}
                                    </button>
                                  </div>
                                  {!lecturer.isEligibleChair && (
                                    <p className="mt-3 rounded-md bg-white px-3 py-2 text-xs text-[#4A5775]">
                                      Không đủ điều kiện làm Chủ tịch.
                                    </p>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-2xl border border-[#E5ECFB] bg-white p-5 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-[#1F3C88]">Thành viên đã chọn</span>
                            <span className="text-xs text-[#4A5775]">
                              {selectedLecturers.length} / tối thiểu 4
                            </span>
                          </div>
                          <div className="mt-3 space-y-3">
                            {selectedLecturers.length === 0 ? (
                              <div className="rounded-xl border border-dashed border-[#D9E1F2] bg-[#F8FAFF] px-4 py-6 text-center text-sm text-[#4A5775]">
                                Chưa có giảng viên nào được chọn.
                              </div>
                            ) : (
                              selectedLecturers.map((member) => (
                                <div
                                  key={member.lecturerCode}
                                  className="rounded-xl border border-[#E5ECFB] bg-[#F8FAFF] p-4"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="font-semibold text-[#1F3C88]">{member.fullName}</p>
                                      <p className="text-xs text-[#4A5775]">{member.lecturerCode}</p>
                                      <p className="text-xs text-[#4A5775]">
                                        Học vị: {member.degree ?? "Đang cập nhật"}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveLecturer(member.lecturerCode)}
                                      className="rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                                    >
                                      Gỡ
                                    </button>
                                  </div>
                                  <div className="mt-3 flex flex-wrap items-center gap-3">
                                    <select
                                      value={member.role}
                                      onChange={(event) => handleLecturerRoleChange(member.lecturerCode, event.target.value)}
                                      className="rounded-lg border border-[#D9E1F2] px-2 py-1 text-sm focus:border-[#1F3C88] focus:outline-none"
                                    >
                                      {wizardRoles.map((roleOption) => (
                                        <option key={roleOption.value} value={roleOption.value}>
                                          {roleOption.label}
                                        </option>
                                      ))}
                                    </select>
                                    <label className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-[#1F3C88]">
                                      <input
                                        type="radio"
                                        name="wizard-chair"
                                        checked={member.isChair}
                                        onChange={() => handleLecturerMarkChair(member.lecturerCode)}
                                      />
                                      Chủ tịch
                                    </label>
                                    {!member.isEligibleChair && (
                                      <span className="text-xs text-[#F37021]">
                                        Không đủ điều kiện Chủ tịch
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-[#FCE8D5] bg-[#FFF7F0] p-5 text-xs text-[#8B5E34]">
                          Hội đồng cần tối thiểu 4 thành viên và bắt buộc có 1 Chủ tịch có học vị Tiến sĩ hoặc
                          Phó giáo sư.
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {wizardStep === 3 && (
                    <motion.div
                      key="wizard-step-3"
                      initial={{ opacity: 0, x: -24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 24 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="grid gap-6 lg:grid-cols-2"
                    >
                      <div className="flex flex-col gap-4 rounded-2xl border border-[#E5ECFB] bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-[#1F3C88]">Đề tài đủ điều kiện</span>
                          <span className="text-xs text-[#4A5775]">
                            {filteredTopics.length.toLocaleString("vi-VN")}
                            {" "}đề tài
                          </span>
                        </div>
                        <div className="flex items-center gap-2 rounded-full border border-[#D9E1F2] bg-[#F8FAFF] px-3 py-2 text-sm">
                          <Search size={16} className="text-[#1F3C88]" />
                          <input
                            value={topicSearch}
                            onChange={(event) => setTopicSearch(event.target.value)}
                            placeholder="Tìm đề tài, sinh viên, mã đề tài"
                            className="w-full border-none bg-transparent text-sm outline-none"
                          />
                        </div>

                        <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                          {topicsLoading ? (
                            <div className="flex h-48 items-center justify-center">
                              <Loader2 className="h-10 w-10 animate-spin text-[#1F3C88]" />
                            </div>
                          ) : filteredTopics.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-[#D9E1F2] bg-[#F8FAFF] px-4 py-6 text-center text-sm text-[#4A5775]">
                              Không có đề tài phù hợp.
                            </div>
                          ) : (
                            filteredTopics.map((topic) => {
                              const selected = selectedTopics.some((item) => item.topicCode === topic.topicCode);
                              return (
                                <label
                                  key={topic.topicCode}
                                  className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${
                                    selected ? "border-[#1F3C88] bg-[#F1F5FF]" : "border-[#E5ECFB] bg-[#F8FAFF]"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={() => handleTopicToggle(topic)}
                                    className="mt-1"
                                  />
                                  <div>
                                    <p className="font-semibold text-[#1F3C88]">{topic.title}</p>
                                    <p className="text-xs text-[#4A5775]">Mã: {topic.topicCode}</p>
                                    {topic.studentName && (
                                      <p className="text-xs text-[#4A5775]">Sinh viên: {topic.studentName}</p>
                                    )}
                                    {topic.tagDescriptions && topic.tagDescriptions.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-[#1F3C88]">
                                        {topic.tagDescriptions.map((tag) => (
                                          <span key={tag} className="rounded-full bg-white px-2 py-0.5 shadow-sm">
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </label>
                              );
                            })
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-2xl border border-[#E5ECFB] bg-white p-5 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-[#1F3C88]">Lịch dự kiến cho đề tài</span>
                            <span className="text-xs text-[#4A5775]">
                              Ngày bảo vệ: {phaseOneForm.defenseDate || "Chưa chọn"}
                            </span>
                          </div>
                          <div className="mt-3 space-y-3">
                            {selectedTopics.length === 0 ? (
                              <div className="rounded-xl border border-dashed border-[#D9E1F2] bg-[#F8FAFF] px-4 py-6 text-center text-sm text-[#4A5775]">
                                Chưa có đề tài được chọn. Bạn có thể bỏ qua bước này và gán sau.
                              </div>
                            ) : (
                              selectedTopics.map((topic) => (
                                <div key={topic.topicCode} className="rounded-xl border border-[#E5ECFB] bg-[#F8FAFF] p-4">
                                  <p className="font-semibold text-[#1F3C88]">{topic.title}</p>
                                  <p className="text-xs text-[#4A5775]">{topic.topicCode}</p>
                                  <div className="mt-3 grid gap-3 sm:grid-cols-[150px_1fr_1fr]">
                                    <label className="space-y-1 text-xs">
                                      <span className="font-semibold text-[#1F3C88]">Phiên</span>
                                      <select
                                        value={topic.session}
                                        onChange={(event) => handleTopicFieldChange(topic.topicCode, "session", event.target.value)}
                                        className="w-full rounded-lg border border-[#D9E1F2] px-2 py-1 text-sm focus:border-[#1F3C88] focus:outline-none"
                                      >
                                        <option value={1}>Sáng</option>
                                        <option value={2}>Chiều</option>
                                      </select>
                                    </label>
                                    <label className="space-y-1 text-xs">
                                      <span className="font-semibold text-[#1F3C88]">Giờ bắt đầu</span>
                                      <input
                                        type="time"
                                        value={topic.startTime}
                                        onChange={(event) => handleTopicFieldChange(topic.topicCode, "startTime", event.target.value)}
                                        className="w-full rounded-lg border border-[#D9E1F2] px-2 py-1 text-sm focus:border-[#1F3C88] focus:outline-none"
                                      />
                                    </label>
                                    <label className="space-y-1 text-xs">
                                      <span className="font-semibold text-[#1F3C88]">Giờ kết thúc</span>
                                      <input
                                        type="time"
                                        value={topic.endTime}
                                        onChange={(event) => handleTopicFieldChange(topic.topicCode, "endTime", event.target.value)}
                                        className="w-full rounded-lg border border-[#D9E1F2] px-2 py-1 text-sm focus:border-[#1F3C88] focus:outline-none"
                                      />
                                    </label>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-[#E5ECFB] bg-[#F8FAFF] p-5 text-xs text-[#4A5775]">
                          Bạn có thể bỏ qua bước này và phân công đề tài sau khi hội đồng được tạo.
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={wizardStep === 1 ? handleWizardClose : handleWizardBack}
                    className="flex items-center gap-2 rounded-full border border-[#D9E1F2] px-4 py-2 text-sm font-semibold text-[#1F3C88] transition hover:border-[#1F3C88]"
                  >
                    {wizardStep === 1 ? (
                      <>
                        Hủy
                      </>
                    ) : (
                      <>
                        <ArrowLeft size={16} /> Quay lại
                      </>
                    )}
                  </button>
                  <div className="flex gap-3">
                    {wizardStep < 3 && (
                      <button
                        type="button"
                        onClick={handleWizardNext}
                        className="flex items-center gap-2 rounded-full bg-[#1F3C88] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#162B61]"
                      >
                        Tiếp tục <ArrowRight size={16} />
                      </button>
                    )}
                    {wizardStep === 3 && (
                      <button
                        type="button"
                        onClick={handleWizardSubmit}
                        disabled={wizardSubmitting}
                        className="flex items-center gap-2 rounded-full bg-[#FF6B35] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#E55A2B] disabled:opacity-60"
                      >
                        {wizardSubmitting ? "Đang hoàn tất..." : "Hoàn tất quy trình"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </ModalShell>
        )}

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

