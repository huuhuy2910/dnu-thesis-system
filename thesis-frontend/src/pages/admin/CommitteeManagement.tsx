import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Eye,
  Filter,
  GraduationCap,
  Loader2,
  Layers3,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  Users2,
  X,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "../../context/useToast";
import { committeeAssignmentApi, getCommitteeCreateInit } from "../../api/committeeAssignmentApi";
import { FetchDataError } from "../../api/fetchData";
import { committeeService, type EligibleTopicSummary } from "../../services/committee-management.service";
import type {
  CommitteeAssignmentAutoAssignCommittee,
  CommitteeAssignmentAutoAssignRequest,
  CommitteeAssignmentDefenseItem,
  CommitteeAssignmentListItem,
  CommitteeAssignmentCreateRequest,
  CommitteeAssignmentDetail,
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
    defenseDateFrom: string;
    defenseDateTo: string;
    tagCodes: string[];
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

type SessionId = 1 | 2;

interface TopicTableItem {
  topicCode: string;
  title: string;
  studentName?: string | null;
  supervisorName?: string | null;
  supervisorCode?: string | null;
    supervisorLecturerProfileID?: number | null;
    supervisorLecturerCode?: string | null;
  specialty?: string | null;
  tagDescriptions?: string[];
  status?: string | null;
}

interface AssignedTopicSlot {
  topic: TopicTableItem;
  session: SessionId;
  timeLabel: string;
  scheduledAt: string | null;
}

interface LecturerOption {
  lecturerProfileId: number;
  lecturerCode: string;
  fullName: string;
  degree?: string | null;
  departmentCode?: string | null;
}

type RoleId = "chair" | "reviewer1" | "secretary" | "reviewer2" | "reviewer3";

interface RoleConfig {
  id: RoleId;
  label: string;
  apiRole: string;
  requiresPhd?: boolean;
}

const MORNING_SLOTS = ["08:00", "08:45", "09:30", "10:15"] as const;
const AFTERNOON_SLOTS = ["13:30", "14:15", "15:00", "15:45"] as const;
const SESSION_TOPIC_LIMIT = 4;
const DAILY_TOPIC_LIMIT = 8;
const SESSION_LABEL: Record<SessionId, string> = {
  1: "Phiên sáng",
  2: "Phiên chiều",
};

const API_BASE_URL = ((import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:5180").trim().replace(/\/+$/, "");
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 20000,
});

const ROLE_CONFIG: RoleConfig[] = [
  { id: "chair", label: "Chủ tịch", apiRole: "Chủ tịch", requiresPhd: true },
  { id: "reviewer1", label: "Phản biện (Ủy viên) 1", apiRole: "Phản biện (Ủy viên)" },
  { id: "secretary", label: "Thư ký", apiRole: "Thư ký" },
  { id: "reviewer2", label: "Phản biện (Ủy viên) 2", apiRole: "Phản biện (Ủy viên)" },
  { id: "reviewer3", label: "Phản biện (Ủy viên) 3", apiRole: "Phản biện (Ủy viên)" },
];

const EMPTY_ROLE_ASSIGNMENTS: Record<RoleId, number | null> = {
  chair: null,
  reviewer1: null,
  secretary: null,
  reviewer2: null,
  reviewer3: null,
};

function sessionSlotTimes(session: SessionId): readonly string[] {
  return session === 1 ? MORNING_SLOTS : AFTERNOON_SLOTS;
}

function buildDefaultHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const stored = window.localStorage.getItem("app_user");
    if (!stored) return {};
    const parsed = JSON.parse(stored) as { userCode?: string; role?: string } | null;
    const headers: Record<string, string> = {};
    if (parsed?.role) headers["X-User-Role"] = parsed.role;
    if (parsed?.userCode) headers["X-User-Code"] = parsed.userCode;
    return headers;
  } catch {
    return {};
  }
}

function normalizeTopicItem(item: any): TopicTableItem | null {
    if (!item) return null;
    const topicCode = item.topicCode ?? item.topic_code ?? item.code ?? item.topicId;
    const title = item.title ?? item.topicName ?? item.name;
    if (!topicCode || !title) {
      return null;
    }
    return {
      topicCode: String(topicCode),
      title: String(title),
      studentName: item.studentName ?? item.studentFullName ?? item.student ?? null,
      supervisorName: item.supervisorName ?? item.lecturerName ?? item.supervisor ?? null,
      supervisorCode: item.supervisorCode ?? item.lecturerCode ?? null,
      supervisorLecturerProfileID: item.supervisorLecturerProfileID ?? item.supervisorLecturerProfileId ?? item.supervisorLecturerProfileID ?? null,
      supervisorLecturerCode: item.supervisorLecturerCode ?? item.supervisorLecturerCode ?? item.supervisorLecturerCode ?? (item.supervisorCode ?? item.supervisorLecturerCode) ?? null,
      // include supervisor user code if backend provides it
      ...(item.supervisorUserCode ? { supervisorUserCode: String(item.supervisorUserCode) } : {}),
      specialty: item.specialty ?? item.specialtyName ?? item.specialtyCode ?? null,
      tagDescriptions: Array.isArray(item.tagDescriptions)
        ? item.tagDescriptions
        : Array.isArray(item.tags)
          ? item.tags
          : undefined,
      status: item.status ?? item.topicStatus ?? null,
    };
  }

  function getCurrentUserCode(): string | undefined {
    if (typeof window === "undefined") return undefined;
    try {
      const stored = window.localStorage.getItem("app_user");
      if (!stored) return undefined;
      const parsed = JSON.parse(stored) as { userCode?: string } | null;
      return parsed?.userCode;
    } catch {
      return undefined;
    }
  }

  // NOTE: addMinutesToIso was removed because we send time strings (HH:mm) for StartTime/EndTime.

  function addMinutesToTimeLabel(timeLabel: string | null | undefined, minutes: number): string | null {
    if (!timeLabel) return null;
    const parts = timeLabel.split(":");
    if (parts.length < 2) return null;
    const hh = Number(parts[0]);
    const mm = Number(parts[1]);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    const d = new Date();
    d.setHours(hh, mm, 0, 0);
    d.setMinutes(d.getMinutes() + minutes);
    const outH = String(d.getHours()).padStart(2, "0");
    const outM = String(d.getMinutes()).padStart(2, "0");
    return `${outH}:${outM}`;
  }

  function normalizeLecturerItem(item: any): LecturerOption | null {
    if (!item) return null;
    const lecturerProfileId = item.lecturerProfileId ?? item.lecturerProfileID ?? item.id;
    const lecturerCode = item.lecturerCode ?? item.code;
    const fullName = item.fullName ?? item.name;
    if (!lecturerProfileId || !lecturerCode || !fullName) {
      return null;
    }
    return {
      lecturerProfileId: Number(lecturerProfileId),
      lecturerCode: String(lecturerCode),
      fullName: String(fullName),
      degree: item.degree ?? item.academicDegree ?? null,
      departmentCode: item.departmentCode ?? null,
    };
  }

  function combineDateAndTime(date: string, time: string): string | null {
    if (!date) return null;
    const isoCandidate = `${date}T${time}:00`;
    const parsed = new Date(isoCandidate);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString();
  }

  function isPhd(degree?: string | null): boolean {
    if (!degree) return false;
    return degree.toLowerCase().includes("tiến sĩ");
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
      label: "Đề tài",
      description: "Sắp lịch bảo vệ cho đề tài",
      icon: GraduationCap,
    },
    {
      step: 3,
      label: "Thành viên",
      description: "Chọn giảng viên và vai trò",
      icon: Users,
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

  

  interface FilterBarProps {
    filters: FilterState;
    onFilterChange: (field: keyof FilterState, value: string) => void;
    onSearchChange: (value: string) => void;
    tagDictionary: Record<string, { name: string; description?: string | null }>;
    onTagsChange: (tagCodes: string[]) => void;
  }

  function FilterBar({ filters, onFilterChange, onSearchChange, tagDictionary, onTagsChange }: FilterBarProps) {
    const entries = Object.entries(tagDictionary || {}).sort((a, b) => a[1].name.localeCompare(b[1].name));
    const [showAll, setShowAll] = useState(false);
    const DEFAULT_VISIBLE = 6; // show ~2 rows by default (adjust columns via layout)
    const visibleCount = showAll ? entries.length : Math.min(DEFAULT_VISIBLE, entries.length);

    return (
      <section className="rounded-3xl border border-[#D9E1F2] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-[#D9E1F2] bg-white px-3 py-1.5 transition-colors focus-within:border-[#1F3C88]">
              <Search size={16} className="text-[#1F3C88]" />
              <input
                value={filters.search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Tìm kiếm hội đồng, mã, phòng..."
                className="w-64 border-none bg-transparent text-sm outline-none placeholder:text-[#6B7A99]"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-[#4A5775] font-semibold">Từ</label>
              <input
                type="date"
                value={filters.defenseDateFrom}
                onChange={(e) => onFilterChange('defenseDateFrom', e.target.value)}
                className="rounded-md border border-[#D9E1F2] px-3 py-1 text-sm"
              />
              <label className="text-xs text-[#4A5775] font-semibold">Đến</label>
              <input
                type="date"
                value={filters.defenseDateTo}
                onChange={(e) => onFilterChange('defenseDateTo', e.target.value)}
                className="rounded-md border border-[#D9E1F2] px-3 py-1 text-sm"
              />
            </div>

            <div className="ml-auto flex items-center gap-3">
              <span className="text-sm font-semibold text-[#1F3C88] flex items-center gap-2"><Filter size={16} />Bộ lọc</span>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#4A5775]">Tags</span>
                  <span className="text-xs text-[#6B7A99]">(chọn nhiều)</span>
                </div>
                {entries.length > DEFAULT_VISIBLE && (
                  <button
                    type="button"
                    onClick={() => setShowAll((s) => !s)}
                    className="text-xs text-[#1F3C88] font-semibold"
                  >
                    {showAll ? 'Thu gọn' : `Xem thêm (${entries.length - DEFAULT_VISIBLE})`}
                  </button>
                )}
              </div>

              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                {entries.slice(0, visibleCount).map(([code, info]) => {
                  const selected = filters.tagCodes.includes(code);
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        const next = selected ? filters.tagCodes.filter((c) => c !== code) : [...filters.tagCodes, code];
                        onTagsChange(next);
                      }}
                      className={`text-sm text-left rounded-full px-3 py-2 transition ${selected ? 'bg-[#1F3C88] text-white' : 'bg-[#F8FAFF] text-[#1F3C88] border border-[#D9E1F2]'}`}
                    >
                      <div className="font-semibold">{info.name}</div>
                      {info.description && <div className="text-xs text-[#6B7A99] truncate">{info.description}</div>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="w-48">
              <label className="block text-xs font-semibold text-[#4A5775] mb-2">Trạng thái</label>
              <select
                value={filters.status}
                onChange={(e) => onFilterChange('status', e.target.value)}
                className="w-full rounded-lg border border-[#D9E1F2] bg-white px-3 py-2 text-sm focus:border-[#1F3C88]"
              >
                <option value="">Tất cả</option>
                <option value="Hoạt động">Hoạt động</option>
                <option value="Sắp diễn ra">Sắp diễn ra</option>
                <option value="Đã kết thúc">Đã kết thúc</option>
              </select>
            </div>
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
    if (loading) {
      return (
        <section className="rounded-3xl border border-[#D9E1F2] bg-white p-8 shadow-sm">
          <div className="flex h-96 items-center justify-center">
            <div className="animate-spin">
              <RefreshCw size={32} className="text-[#1F3C88]" />
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className="rounded-3xl border border-[#D9E1F2] bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1F3C88]">Danh sách hội đồng</h2>
          <div className="text-sm text-[#4A5775]">
            Hiển thị {data.length} / {total} hội đồng
          </div>
        </div>

        {data.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <Users2 size={48} className="mx-auto mb-4 text-[#D9E1F2]" />
              <p className="text-[#4A5775]">Chưa có hội đồng nào</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {data.map((item) => (
                <div
                  key={item.committeeCode}
                  className="group relative rounded-2xl border border-[#E5ECFB] bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:border-[#1F3C88]/20"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-[#1F3C88]/10 p-2">
                        <Users2 className="h-5 w-5 text-[#1F3C88]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#1F3C88]">{item.committeeCode}</h3>
                        <p className="text-sm text-[#4A5775]">{item.name || "Chưa đặt tên"}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.status === "Hoạt động"
                        ? "bg-green-100 text-green-700"
                        : item.status === "Sắp diễn ra"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {item.status || "Không xác định"}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-[#4A5775]" />
                      <span className="text-[#4A5775]">{item.room || "Chưa có phòng"}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <CalendarClock className="h-4 w-4 text-[#4A5775]" />
                      <span className="text-[#4A5775]">
                        {item.defenseDate ? formatDate(item.defenseDate) : "Chưa có lịch"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-[#4A5775]" />
                      <span className="text-[#4A5775]">{item.memberCount} thành viên</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap className="h-4 w-4 text-[#4A5775]" />
                      <span className="text-[#4A5775]">{item.topicCount ?? 0} đề tài</span>
                    </div>

                    {item.tagCodes && item.tagCodes.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.tagCodes.slice(0, 3).map((tag: string) => (
                          <span key={tag} className="rounded-full bg-[#F37021]/10 px-2 py-1 text-xs text-[#F37021]">
                            {resolveTagLabel(tag)}
                          </span>
                        ))}
                        {item.tagCodes.length > 3 && (
                          <span className="text-xs text-[#4A5775]">+{item.tagCodes.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex gap-2">
                    <button
                      onClick={() => onViewDetail(item.committeeCode)}
                      className="flex-1 rounded-lg bg-[#1F3C88] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#162B61] flex items-center justify-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Xem chi tiết
                    </button>
                    <button
                      onClick={() => onDelete(item.committeeCode)}
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 flex items-center justify-center"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {total > pageSize && (
              <div className="mt-8 flex items-center justify-between">
                <div className="text-sm text-[#4A5775]">
                  Trang {page} / {Math.ceil(total / pageSize)}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onPageChange("prev")}
                    disabled={page === 1}
                    className="rounded-lg border border-[#D9E1F2] px-4 py-2 text-sm font-semibold text-[#1F3C88] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F8FAFF]"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => onPageChange("next")}
                    disabled={page * pageSize >= total}
                    className="rounded-lg border border-[#D9E1F2] px-4 py-2 text-sm font-semibold text-[#1F3C88] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F8FAFF]"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    );
  }

  // ============================================================================
  // COMMITTEE DETAIL MODAL COMPONENT
  // ============================================================================

  // ============================================================================
  // COMMITTEE DETAIL VIEW COMPONENT
  // ============================================================================

  interface CommitteeDetailViewProps {
    committee: CommitteeAssignmentDetail | null;
    loading: boolean;
    onBack: () => void;
    onRefresh: () => void;
    tagDictionary: Record<string, { name: string; description?: string | null }>;
    addToast: (message: string, type: "success" | "error" | "warning" | "info") => void;
  }

  function CommitteeDetailView({
    committee,
    loading,
    onBack,
    onRefresh,
    tagDictionary,
    addToast,
  }: CommitteeDetailViewProps) {
    const [editSection, setEditSection] = useState<'basic' | 'members' | 'topics' | null>(null);
    const [editForm, setEditForm] = useState({
      name: "",
      room: "",
      defenseDate: "",
      tagCodes: [] as string[],
    });
    const [saving, setSaving] = useState(false);

    // Members edit state
    const [membersForm, setMembersForm] = useState<Record<string, number | null>>({});
    const [lecturerOptions, setLecturerOptions] = useState<LecturerOption[]>([]);
    const [lecturersLoading, setLecturersLoading] = useState(false);

    // Topics edit state
    const [topicsForm, setTopicsForm] = useState<Record<number, AssignedTopicSlot[]>>({
      1: [], // Session 1
      2: [], // Session 2
    });
    const [availableTopics, setAvailableTopics] = useState<TopicTableItem[]>([]);
    const [topicsLoading, setTopicsLoading] = useState(false);
    const [topicSearch, setTopicSearch] = useState("");

    useEffect(() => {
      if (committee) {
        setEditForm({
          name: committee.name || "",
          room: committee.room || "",
          defenseDate: committee.defenseDate ? toDateInputValue(committee.defenseDate) : "",
          tagCodes: committee.tags?.map((tag) => tag.tagCode) || [],
        });

        // Initialize members form
        const membersMap: Record<string, number | null> = {};
        committee.members?.forEach((member) => {
          membersMap[member.role] = member.lecturerProfileId;
        });
        setMembersForm(membersMap);

        // Initialize topics form by session
        const session1Topics: AssignedTopicSlot[] = [];
        const session2Topics: AssignedTopicSlot[] = [];

        committee.assignments?.forEach((assignment) => {
          const slot: AssignedTopicSlot = {
            topic: {
              topicCode: assignment.topicCode,
              title: assignment.title,
              studentName: assignment.studentName,
              supervisorLecturerCode: assignment.supervisorCode,
              supervisorName: assignment.supervisorName,
              status: "Đủ điều kiện bảo vệ",
            },
            session: (assignment.session || 1) as SessionId,
            timeLabel: assignment.startTime || "",
            scheduledAt: assignment.scheduledAt || null,
          };

          if (assignment.session === 1) {
            session1Topics.push(slot);
          } else {
            session2Topics.push(slot);
          }
        });

        setTopicsForm({
          1: session1Topics,
          2: session2Topics,
        });
      }
    }, [committee]);

    // Fetch lecturers for members editing
    const fetchLecturersForMembers = useCallback(async () => {
      if (!committee?.tags) return;

      setLecturersLoading(true);
      try {
        const params = new URLSearchParams();
        committee.tags.forEach((tag) => params.append("TagCodes", tag.tagCode));
        const response = await apiClient.get("/LecturerProfiles/get-list", {
          params,
          headers: buildDefaultHeaders(),
        });
        const payload = response.data as { data?: unknown } | unknown;
        const rawList = Array.isArray((payload as any)?.data)
          ? ((payload as any).data as unknown[])
          : Array.isArray(payload)
            ? (payload as unknown[])
            : Array.isArray((payload as any)?.items)
              ? ((payload as any).items as unknown[])
              : [];
        const mapped = rawList
          .map(normalizeLecturerItem)
          .filter((item): item is LecturerOption => Boolean(item));
        setLecturerOptions(mapped);
      } catch (error) {
        console.error("Không thể tải danh sách giảng viên", error);
        addToast("Không thể tải danh sách giảng viên", "error");
      } finally {
        setLecturersLoading(false);
      }
    }, [committee?.tags, addToast]);

    // Fetch topics for topics editing
    const fetchTopicsForEditing = useCallback(async () => {
      if (!committee?.tags) return;

      setTopicsLoading(true);
      try {
        const params = new URLSearchParams();
        committee.tags.forEach((tag) => params.append("TagCodes", tag.tagCode));
        const response = await apiClient.get("/topics/get-list", {
          params,
          headers: buildDefaultHeaders(),
        });
        const payload = response.data as { data?: unknown } | unknown;
        const rawList = Array.isArray((payload as any)?.data)
          ? ((payload as any).data as unknown[])
          : Array.isArray(payload)
            ? (payload as unknown[])
            : Array.isArray((payload as any)?.items)
              ? ((payload as any).items as unknown[])
              : [];
        const mappedAll = rawList
          .map(normalizeTopicItem)
          .filter((item): item is TopicTableItem => Boolean(item));

        // Keep only topics with status "Đủ điều kiện bảo vệ"
        const eligible = mappedAll.filter((t) => (t.status ?? "").trim() === "Đủ điều kiện bảo vệ");
        setAvailableTopics(eligible);
      } catch (error) {
        console.error("Không thể tải danh sách đề tài", error);
        addToast("Không thể tải danh sách đề tài", "error");
      } finally {
        setTopicsLoading(false);
      }
    }, [committee?.tags, addToast]);

    const handleSaveBasicInfo = async () => {
      if (!committee) return;

      setSaving(true);
      try {
        const updatePayload = {
          committeeCode: committee.committeeCode,
          name: editForm.name.trim(),
          room: editForm.room.trim(),
          defenseDate: editForm.defenseDate,
          tagCodes: editForm.tagCodes,
        };

        const response = await committeeAssignmentApi.updateCommittee(committee.committeeCode, updatePayload);
        if (response?.success) {
          addToast("Đã cập nhật thông tin hội đồng", "success");
          setEditSection(null);
          onRefresh();
        } else {
          addToast("Không thể cập nhật hội đồng", "error");
        }
      } catch (error) {
        console.error("Lỗi khi cập nhật hội đồng", error);
        addToast("Không thể cập nhật hội đồng", "error");
      } finally {
        setSaving(false);
      }
    };

    // Handle members save
    const handleSaveMembers = async () => {
      if (!committee) return;

      // Validate required roles
      const requiredRoles = ['chair', 'secretary', 'reviewer1'];
      for (const role of requiredRoles) {
        if (!membersForm[role]) {
          addToast(`Vui lòng chọn ${role === 'chair' ? 'Chủ tịch' : role === 'secretary' ? 'Thư ký' : 'Phản biện 1'}`, "warning");
          return;
        }
      }

      setSaving(true);
      try {
        const membersPayload = Object.entries(membersForm)
          .filter(([_, lecturerId]) => lecturerId !== null)
          .map(([role, lecturerId]) => ({
            lecturerProfileId: lecturerId!,
            role,
          }));

        await apiClient.post(
          "/CommitteeAssignment/members",
          {
            committeeCode: committee.committeeCode,
            members: membersPayload,
          },
          {
            headers: buildDefaultHeaders(),
          }
        );

        addToast("Đã cập nhật thành viên hội đồng", "success");
        setEditSection(null);
        onRefresh();
      } catch (error) {
        console.error("Không thể cập nhật thành viên", error);
        addToast((error as Error).message || "Không thể cập nhật thành viên", "error");
      } finally {
        setSaving(false);
      }
    };

    // Handle topics save
    const handleSaveTopics = async () => {
      if (!committee) return;

      const allTopics = [...topicsForm[1], ...topicsForm[2]];
      if (allTopics.length === 0) {
        addToast("Vui lòng chọn ít nhất một đề tài", "warning");
        return;
      }

      setSaving(true);
      try {
        const items = allTopics.map((slot) => ({
          topicCode: slot.topic.topicCode,
          session: slot.session,
          scheduledAt: slot.scheduledAt || (committee.defenseDate ? combineDateAndTime(committee.defenseDate, slot.timeLabel) : null),
          startTime: slot.timeLabel,
          endTime: addMinutesToTimeLabel(slot.timeLabel, 45),
        }));

        const payload = {
          committeeCode: committee.committeeCode,
          scheduledAt: items[0]?.scheduledAt,
          session: 0,
          assignedBy: getCurrentUserCode() ?? "admin",
          items,
        };

        await apiClient.post("/CommitteeAssignment/assign", payload, {
          headers: buildDefaultHeaders(),
        });

        addToast("Đã cập nhật đề tài hội đồng", "success");
        setEditSection(null);
        onRefresh();
      } catch (error) {
        console.error("Không thể cập nhật đề tài", error);
        addToast((error as Error).message || "Không thể cập nhật đề tài", "error");
      } finally {
        setSaving(false);
      }
    };

    // Handle adding topic to session
    const handleAddTopicToSession = (topic: TopicTableItem, session: number) => {
      if (topicsForm[session].some(slot => slot.topic.topicCode === topic.topicCode)) {
        return; // Already added
      }

      if (topicsForm[session].length >= 4) {
        addToast("Phiên này đã đủ 4 đề tài", "warning");
        return;
      }

      const timeLabel = sessionSlotTimes(session as SessionId)[topicsForm[session].length] || "08:00";
      const newSlot: AssignedTopicSlot = {
        topic,
        session: session as SessionId,
        timeLabel,
        scheduledAt: committee?.defenseDate ? combineDateAndTime(committee.defenseDate, timeLabel) : null,
      };

      setTopicsForm(prev => ({
        ...prev,
        [session]: [...prev[session], newSlot]
      }));
    };

    // Handle removing topic from session
    const handleRemoveTopicFromSession = (topicCode: string, session: number) => {
      setTopicsForm(prev => ({
        ...prev,
        [session]: prev[session].filter(slot => slot.topic.topicCode !== topicCode)
      }));
    };

    // NOTE: per-role filtering is handled inline in the members edit UI to ensure current-assigned
    // lecturers remain visible and assigned lecturers are shown but disabled.

    const filteredTopics = useMemo(() => {
      const keyword = topicSearch.trim().toLowerCase();
      return availableTopics.filter((topic) => {
        const matchesKeyword =
          keyword.length === 0 ||
          topic.topicCode.toLowerCase().includes(keyword) ||
          topic.title.toLowerCase().includes(keyword) ||
          (topic.studentName ?? "").toLowerCase().includes(keyword);
        return matchesKeyword;
      });
    }, [availableTopics, topicSearch]);

    if (loading) {
      return (
        <div className="flex h-96 items-center justify-center">
          <RefreshCw className="h-12 w-12 animate-spin text-[#1F3C88]" />
        </div>
      );
    }

    if (!committee) {
      return (
        <div className="flex h-96 items-center justify-center">
          <p className="text-[#4A5775]">Không thể tải thông tin hội đồng</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Chi tiết hội đồng: {committee?.name}
              </h2>
              <p className="text-gray-600">Mã hội đồng: {committee?.committeeCode}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onRefresh}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4 inline mr-2" />
              Làm mới
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Basic Information Section */}
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ClipboardList className="text-[#1F3C88]" />
                        <h3 className="text-lg font-semibold text-gray-900">Thông tin cơ bản</h3>
                      </div>
                      <button
                        onClick={() => setEditSection(editSection === 'basic' ? null : 'basic')}
                        className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
                      >
                        {editSection === 'basic' ? 'Hủy' : 'Chỉnh sửa'}
                      </button>
                    </div>
                  </div>
              <div className="p-6">
                {editSection === 'basic' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tên hội đồng
                      </label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phòng
                      </label>
                      <input
                        type="text"
                        value={editForm.room}
                        onChange={(e) => setEditForm(prev => ({ ...prev, room: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ngày bảo vệ
                      </label>
                      <input
                        type="date"
                        value={editForm.defenseDate}
                        onChange={(e) => setEditForm(prev => ({ ...prev, defenseDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tags
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(tagDictionary).map(([tagCode, tag]) => (
                          <label key={tagCode} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editForm.tagCodes.includes(tagCode)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditForm(prev => ({
                                    ...prev,
                                    tagCodes: [...prev.tagCodes, tagCode]
                                  }));
                                } else {
                                  setEditForm(prev => ({
                                    ...prev,
                                    tagCodes: prev.tagCodes.filter(code => code !== tagCode)
                                  }));
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{tag.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <button
                        onClick={handleSaveBasicInfo}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </button>
                      <button
                        onClick={() => setEditSection(null)}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tên hội đồng:</span>
                      <span className="font-medium">{committee?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phòng:</span>
                      <span className="font-medium">{committee?.room}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ngày bảo vệ:</span>
                      <span className="font-medium">
                        {committee?.defenseDate ? formatDate(committee.defenseDate) : 'Chưa đặt'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tags:</span>
                      <div className="flex flex-wrap gap-1">
                        {committee?.tags?.map((tag) => (
                          <span key={tag.tagCode} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {tag.tagName}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Members Section */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="text-[#1F3C88]" />
                    <h3 className="text-lg font-semibold text-gray-900">Thành viên hội đồng</h3>
                  </div>
                  <button
                    onClick={() => {
                      setEditSection(editSection === 'members' ? null : 'members');
                      if (editSection !== 'members') {
                        fetchLecturersForMembers();
                      }
                    }}
                    className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
                  >
                    {editSection === 'members' ? 'Hủy' : 'Chỉnh sửa'}
                  </button>
                </div>
              </div>
              <div className="p-6">
                {editSection === 'members' ? (
                  <div className="space-y-4">
                    {lecturersLoading ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <>
                        {(['chair', 'secretary', 'reviewer1', 'reviewer2', 'reviewer3'] as const).map((role) => {
                          // build set of lecturer ids assigned to other roles
                          const assignedToOthers = new Set<number>();
                          Object.entries(membersForm).forEach(([k, v]) => {
                            if (k !== role && v) assignedToOthers.add(v);
                          });

                          // current assigned id for this role
                          const currentAssigned = membersForm[role] ?? null;

                          // options: start from fetched lecturerOptions
                          const baseOptions = lecturerOptions.slice();

                          // if currentAssigned not in baseOptions, try to add a synthetic option from committee.members
                          if (currentAssigned && !baseOptions.some((l) => l.lecturerProfileId === currentAssigned)) {
                            const found = committee?.members?.find((m) => m.lecturerProfileId === currentAssigned);
                            if (found) {
                              baseOptions.unshift({
                                lecturerProfileId: found.lecturerProfileId,
                                lecturerCode: found.lecturerCode ?? "",
                                fullName: found.fullName ?? found.lecturerCode ?? "(Không có tên)",
                                degree: found.degree ?? null,
                              });
                            }
                          }

                          return (
                            <div key={role}>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {role === 'chair' ? 'Chủ tịch' :
                                 role === 'secretary' ? 'Thư ký' :
                                 `Phản biện ${role.slice(-1)}`}
                                {role === 'chair' || role === 'secretary' || role === 'reviewer1' ? ' *' : ''}
                              </label>
                              <select
                                value={currentAssigned ? String(currentAssigned) : ''}
                                onChange={(e) => {
                                  const value = e.target.value ? parseInt(e.target.value) : null;
                                  setMembersForm(prev => ({ ...prev, [role]: value }));
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Chọn giảng viên...</option>
                                {baseOptions.map((lecturer) => {
                                  const isAssignedElsewhere = assignedToOthers.has(lecturer.lecturerProfileId);
                                  return (
                                    <option
                                      key={lecturer.lecturerProfileId}
                                      value={String(lecturer.lecturerProfileId)}
                                      disabled={isAssignedElsewhere}
                                    >
                                      {lecturer.fullName} {lecturer.degree ? `(${lecturer.degree})` : ''}
                                      {isAssignedElsewhere ? ' — Đã là thành viên' : ''}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>
                          );
                        })}
                        <div className="flex gap-2 pt-4">
                          <button
                            onClick={handleSaveMembers}
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                          </button>
                          <button
                            onClick={() => setEditSection(null)}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                          >
                            Hủy
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {committee?.members?.map((member) => {
                      const cfg = ROLE_CONFIG.find((r) => r.id === (member.role as RoleId));
                      const label = cfg ? cfg.label : member.role;
                      return (
                        <div key={member.role} className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-600 font-medium">{label}</span>
                            <span className="text-xs text-[#4A5775]">{member.lecturerCode}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{member.fullName}</div>
                            <div className="text-xs text-[#4A5775]">{member.degree ?? "Chưa cập nhật"}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Topics Section */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="text-[#1F3C88]" />
                    <h3 className="text-lg font-semibold text-gray-900">Đề tài bảo vệ</h3>
                  </div>
                  <button
                    onClick={() => {
                      setEditSection(editSection === 'topics' ? null : 'topics');
                      if (editSection !== 'topics') {
                        fetchTopicsForEditing();
                      }
                    }}
                    className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
                  >
                    {editSection === 'topics' ? 'Hủy' : 'Chỉnh sửa'}
                  </button>
                </div>
              </div>
              <div className="p-6">
                {editSection === 'topics' ? (
                  <div className="space-y-6">
                    {topicsLoading ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <>
                        {/* Topic Search */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tìm đề tài
                          </label>
                          <input
                            type="text"
                            placeholder="Nhập mã đề tài, tên đề tài hoặc tên sinh viên..."
                            value={topicSearch}
                            onChange={(e) => setTopicSearch(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Available Topics */}
                        <div>
                          <h4 className="text-md font-medium text-gray-900 mb-3">Đề tài có thể thêm</h4>
                          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                            {filteredTopics.length === 0 ? (
                              <div className="p-4 text-center text-gray-500">
                                {topicSearch ? 'Không tìm thấy đề tài phù hợp' : 'Không có đề tài nào khả dụng'}
                              </div>
                            ) : (
                              <div className="divide-y divide-gray-200">
                                {filteredTopics.map((topic) => (
                                  <div key={topic.topicCode} className="p-3 hover:bg-gray-50">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <div className="font-medium text-sm">{topic.topicCode}</div>
                                        <div className="text-sm text-gray-600 mt-1">{topic.title}</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                          Sinh viên: {topic.studentName} | GVHD: {topic.supervisorName}
                                        </div>
                                      </div>
                                      <div className="flex gap-2 ml-4">
                                        <button
                                          onClick={() => handleAddTopicToSession(topic, 1)}
                                          disabled={topicsForm[1].some(slot => slot.topic.topicCode === topic.topicCode)}
                                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                                        >
                                          Sáng
                                        </button>
                                        <button
                                          onClick={() => handleAddTopicToSession(topic, 2)}
                                          disabled={topicsForm[2].some(slot => slot.topic.topicCode === topic.topicCode)}
                                          className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                                        >
                                          Chiều
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Session Topics */}
                        {[1, 2].map((session) => (
                          <div key={session}>
                            <h4 className="text-md font-medium text-gray-900 mb-3">
                              Phiên {session} ({session === 1 ? 'Sáng' : 'Chiều'})
                            </h4>
                            {topicsForm[session].length === 0 ? (
                              <div className="text-center py-4 text-gray-500 border border-gray-200 rounded-md">
                                Chưa có đề tài nào
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {topicsForm[session].map((slot) => (
                                  <div key={slot.topic.topicCode} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                    <div className="flex-1">
                                      <div className="font-medium text-sm">{slot.topic.topicCode}</div>
                                      <div className="text-sm text-gray-600">{slot.topic.title}</div>
                                      <div className="text-xs text-gray-500">
                                        {slot.timeLabel} - Sinh viên: {slot.topic.studentName}
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handleRemoveTopicFromSession(slot.topic.topicCode, session)}
                                      className="ml-2 p-1 text-red-600 hover:bg-red-100 rounded"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}

                        <div className="flex gap-2 pt-4">
                          <button
                            onClick={handleSaveTopics}
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                          </button>
                          <button
                            onClick={() => setEditSection(null)}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                          >
                            Hủy
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[1, 2].map((session) => (
                      <div key={session}>
                        <h4 className="text-md font-medium text-gray-900 mb-3">
                          Phiên {session} ({session === 1 ? 'Sáng' : 'Chiều'})
                        </h4>
                        {topicsForm[session].length === 0 ? (
                          <div className="text-center py-4 text-gray-500 border border-gray-200 rounded-md">
                            Chưa có đề tài nào
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {topicsForm[session].map((slot) => (
                              <div key={slot.topic.topicCode} className="p-3 bg-gray-50 rounded-md">
                                <div className="font-medium text-sm">{slot.topic.topicCode}</div>
                                <div className="text-sm text-gray-600">{slot.topic.title}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {slot.timeLabel} - Sinh viên: {slot.topic.studentName} | GVHD: {slot.topic.supervisorName}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

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
                          {topic.supervisorName && (
                            <p className="text-sm text-[#4A5775]">GVHD: {topic.supervisorName}</p>
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
      scheduledAt?: string | undefined;
      session: number;
      startTime?: string;
      endTime?: string;
    }) => Promise<void>;
  }

  function AssignTopicModal({ topic, committees, onClose, onSubmit }: AssignTopicModalProps) {
    const { addToast } = useToast();
    const [committeeCode, setCommitteeCode] = useState("");
    const [committeeDetail, setCommitteeDetail] = useState<CommitteeAssignmentDetail | null>(null);
    const [loadingCommittee, setLoadingCommittee] = useState(false);
    const [session, setSession] = useState("1");
    const [submitting, setSubmitting] = useState(false);

    // computed assignment times
    const assignedCountForSession = useMemo(() => {
      if (!committeeDetail) return 0;
      const s = committeeDetail.sessions?.find((x) => x.session === Number(session));
      return s?.topics?.length ?? 0;
    }, [committeeDetail, session]);

    const totalAssigned = useMemo(() => {
      if (!committeeDetail) return 0;
      return (committeeDetail.assignments ?? []).length;
    }, [committeeDetail]);

    const nextTimeLabel = useMemo(() => {
      const sess = Number(session) as SessionId;
      const times = sessionSlotTimes(sess);
      return times[assignedCountForSession] ?? times[times.length - 1];
    }, [assignedCountForSession, session]);

    const computedStartTime = nextTimeLabel;
    const computedEndTime = addMinutesToTimeLabel(nextTimeLabel, 45);
    const computedScheduledAt = committeeDetail?.defenseDate ? combineDateAndTime(committeeDetail.defenseDate, nextTimeLabel) : null;

    const sessionFull = assignedCountForSession >= SESSION_TOPIC_LIMIT;
    const dailyFull = totalAssigned >= DAILY_TOPIC_LIMIT;

    // fetch committee detail when selection changes
    useEffect(() => {
      let cancelled = false;
      if (!committeeCode) {
        setCommitteeDetail(null);
        return;
      }
      setLoadingCommittee(true);
      committeeAssignmentApi.getCommitteeDetail(committeeCode)
        .then((resp) => {
          if (cancelled) return;
          if (resp?.success && resp.data) setCommitteeDetail(resp.data);
          else setCommitteeDetail(null);
        })
        .catch((err) => {
          console.warn('Không thể tải thông tin hội đồng cho gán đề tài', err);
          setCommitteeDetail(null);
        })
        .finally(() => {
          if (!cancelled) setLoadingCommittee(false);
        });
      return () => { cancelled = true; };
    }, [committeeCode]);

    const handleSubmit = async () => {
      if (!committeeCode || !committeeDetail) {
        addToast('Vui lòng chọn hội đồng', 'warning');
        return;
      }
      if (sessionFull) {
        addToast('Phiên này đã đầy. Vui lòng chọn phiên khác.', 'warning');
        return;
      }
      if (dailyFull) {
        addToast('Hội đồng đã đủ số đề tài cho ngày này.', 'warning');
        return;
      }
      setSubmitting(true);
      try {
        await onSubmit({
          committeeCode,
          scheduledAt: computedScheduledAt ?? undefined,
          session: Number(session),
          startTime: computedStartTime,
          endTime: computedEndTime ?? undefined,
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

          <div className="rounded-xl border border-[#E5ECFB] bg-[#F8FAFF] p-4">
            {loadingCommittee ? (
              <div className="text-sm text-[#4A5775]">Đang tải thông tin hội đồng...</div>
            ) : committeeDetail ? (
              <div className="text-sm text-[#1F3C88] space-y-1">
                <div className="font-semibold">{committeeDetail.name ?? committeeDetail.committeeCode}</div>
                <div className="text-xs text-[#4A5775]">Mã: {committeeDetail.committeeCode}</div>
                <div className="text-xs text-[#4A5775]">Ngày: {committeeDetail.defenseDate ? formatDate(committeeDetail.defenseDate) : 'Chưa có'}</div>
                <div className="text-xs text-[#4A5775]">Số giảng viên: {committeeDetail.members?.length ?? 0}</div>
                <div className="text-xs text-[#4A5775]">Số đề tài - Phiên sáng: {committeeDetail.sessions?.find(s=>s.session===1)?.topics?.length ?? 0}</div>
                <div className="text-xs text-[#4A5775]">Số đề tài - Phiên chiều: {committeeDetail.sessions?.find(s=>s.session===2)?.topics?.length ?? 0}</div>
              </div>
            ) : (
              <div className="text-sm text-[#4A5775]">Chưa chọn hội đồng</div>
            )}
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
              <label className="block text-sm font-semibold text-[#1F3C88]">Giờ bắt đầu (tự gán)</label>
              <input
                type="time"
                value={computedStartTime ?? ''}
                readOnly
                className="mt-1 w-full rounded-lg border border-[#D9E1F2] px-3 py-2 text-sm bg-white/70"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1F3C88]">Giờ kết thúc (tự gán)</label>
              <input
                type="time"
                value={computedEndTime ?? ''}
                readOnly
                className="mt-1 w-full rounded-lg border border-[#D9E1F2] px-3 py-2 text-sm bg-white/70"
              />
            </div>
          </div>

          {sessionFull && (
            <div className="rounded-md border-l-4 border-red-400 bg-red-50 p-3 text-sm text-red-700">
              Phiên này đã đủ {SESSION_TOPIC_LIMIT} đề tài. Vui lòng chọn phiên khác.
            </div>
          )}

          {dailyFull && (
            <div className="rounded-md border-l-4 border-red-400 bg-red-50 p-3 text-sm text-red-700">
              Hội đồng đã đủ {DAILY_TOPIC_LIMIT} đề tài trong ngày. Không thể gán thêm.
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <button
              onClick={onClose}
              className="flex-1 rounded-full border border-[#D9E1F2] px-4 py-2 font-semibold text-[#1F3C88]"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !committeeCode || !committeeDetail || sessionFull || dailyFull}
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
    const [persistedCommitteeCode, setPersistedCommitteeCode] = useState<string | null>(null);
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
    const [topicsLoading, setTopicsLoading] = useState(false);
    const [availableTopics, setAvailableTopics] = useState<TopicTableItem[]>([]);
    const [topicSearch, setTopicSearch] = useState("");
    const [assignedTopics, setAssignedTopics] = useState<Record<SessionId, AssignedTopicSlot[]>>({
      1: [],
      2: [],
    });
    const [lecturersLoading, setLecturersLoading] = useState(false);
    const [lecturerOptions, setLecturerOptions] = useState<LecturerOption[]>([]);
    const [roleAssignments, setRoleAssignments] = useState<Record<RoleId, number | null>>({
      ...EMPTY_ROLE_ASSIGNMENTS,
    });

    // UI state
    const [page, setPage] = useState<number>(1);
    const [tableLoading, setTableLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ search: "", defenseDateFrom: "", defenseDateTo: "", tagCodes: [], status: "" });
    const [committeeRows, setCommitteeRows] = useState<CommitteeAssignmentListItem[]>([]);
    const [totalRows, setTotalRows] = useState<number>(0);
    const [stats, setStats] = useState<StatsSnapshot>({ totalCommittees: 0, eligibleTopics: 0, assignedTopics: 0, nextSession: null });

    // view mode state
    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
    const [selectedCommittee, setSelectedCommittee] = useState<CommitteeAssignmentDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

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

    // committee detail modal state (kept for future use)
    const [_detailModalOpen, _setDetailModalOpen] = useState(false);
    const [_detailCommittee, _setDetailCommittee] = useState<CommitteeAssignmentDetail | null>(null);
    const [_detailLoading, _setDetailLoading] = useState(false);

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
      setPersistedCommitteeCode(null);
      setPhaseOneForm({
        name: "",
        room: "",
        defenseDate: "",
        tagCodes: [],
        status: "Sắp diễn ra",
      });
      setPhaseOneErrors({});
      setAvailableTopics([]);
      setTopicSearch("");
      setAssignedTopics({ 1: [], 2: [] });
      setLecturerOptions([]);
      setRoleAssignments({ ...EMPTY_ROLE_ASSIGNMENTS });
      setLecturersLoading(false);
      setTopicsLoading(false);
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

    const fetchTopicsForSession = useCallback(async () => {
      if (phaseOneForm.tagCodes.length === 0) {
        setAvailableTopics([]);
        return;
      }
      setTopicsLoading(true);
      try {
        const params = new URLSearchParams();
        phaseOneForm.tagCodes.forEach((tag) => params.append("TagCodes", tag));
        const response = await apiClient.get("/topics/get-list", {
          params,
          headers: buildDefaultHeaders(),
        });
        const payload = response.data as { data?: unknown } | unknown;
        const rawList = Array.isArray((payload as any)?.data)
          ? ((payload as any).data as unknown[])
          : Array.isArray(payload)
            ? (payload as unknown[])
            : Array.isArray((payload as any)?.items)
              ? ((payload as any).items as unknown[])
              : [];
        const mappedAll = rawList
          .map(normalizeTopicItem)
          .filter((item): item is TopicTableItem => Boolean(item));

        // Keep only topics with status "Đủ điều kiện bảo vệ"
        const eligible = mappedAll.filter((t) => (t.status ?? "").trim() === "Đủ điều kiện bảo vệ");

        // Fetch tags for these topics via /TopicTags/list using comma-separated topicCodes
        const topicCodes = eligible.map((t) => t.topicCode);
        if (topicCodes.length > 0) {
          try {
            const tagParams = new URLSearchParams();
            tagParams.set("topicCodes", topicCodes.join(","));
            const tagsResp = await apiClient.get("/TopicTags/list", {
              params: tagParams,
              headers: buildDefaultHeaders(),
            });
            const tagPayload = tagsResp.data as { data?: unknown } | unknown;
            const tagList = Array.isArray((tagPayload as any)?.data)
              ? ((tagPayload as any).data as Array<{ topicCode?: string; tag?: string }>)
              : Array.isArray(tagPayload)
                ? (tagPayload as unknown as Array<{ topicCode?: string; tag?: string }>)
                : [];

            const tagMap = new Map<string, string[]>();
            tagList.forEach((entry) => {
              const code = (entry as any).topicCode ?? (entry as any).TopicCode;
              const tag = (entry as any).tag ?? (entry as any).tagCode ?? (entry as any).name;
              if (!code) return;
              const arr = tagMap.get(code) ?? [];
              if (tag) arr.push(String(tag));
              tagMap.set(code, arr);
            });

            // merge tags into eligible topics
            eligible.forEach((t) => {
              const tags = tagMap.get(t.topicCode);
              if (tags && tags.length > 0) {
                t.tagDescriptions = tags;
              }
            });
          } catch (tagErr) {
            console.warn("Không thể tải tag cho đề tài", tagErr);
          }
        }

        // Fetch supervisor lecturer names by supervisorLecturerCode to show GV hướng dẫn
        const supervisorCodes = Array.from(new Set(eligible.map((t) => t.supervisorLecturerCode).filter(Boolean) as string[]));
        if (supervisorCodes.length > 0) {
          try {
            const lecParams = new URLSearchParams();
            lecParams.set("LecturerCodes", supervisorCodes.join(","));
            const lecResp = await apiClient.get("/LecturerProfiles/get-list", {
              params: lecParams,
              headers: buildDefaultHeaders(),
            });
            const lecPayload = lecResp.data as { data?: unknown } | unknown;
            const lecRaw = Array.isArray((lecPayload as any)?.data)
              ? ((lecPayload as any).data as any[])
              : Array.isArray(lecPayload)
                ? (lecPayload as unknown as any[])
                : [];
            const lecMap = new Map<string, string>();
            lecRaw.forEach((entry) => {
              const code = entry?.lecturerCode ?? entry?.lecturer_code ?? entry?.LecturerCode;
              const name = entry?.fullName ?? entry?.full_name ?? entry?.FullName ?? entry?.name;
              if (code && name) lecMap.set(String(code), String(name));
            });
            eligible.forEach((t) => {
              if ((!t.supervisorName || t.supervisorName === "—") && t.supervisorLecturerCode) {
                const n = lecMap.get(t.supervisorLecturerCode);
                if (n) t.supervisorName = n;
              }
            });
          } catch (lecErr) {
            console.warn("Không thể tải thông tin giảng viên hướng dẫn", lecErr);
          }
        }

        setAvailableTopics(eligible);
      } catch (error) {
        console.error("Không thể tải danh sách đề tài", error);
        addToast((error as Error).message || "Không thể tải danh sách đề tài", "error");
        setAvailableTopics([]);
      } finally {
        setTopicsLoading(false);
      }
    }, [addToast, phaseOneForm.tagCodes]);

    const fetchLecturersForCommittee = useCallback(async () => {
      if (phaseOneForm.tagCodes.length === 0) {
        setLecturerOptions([]);
        return;
      }
      setLecturersLoading(true);
      try {
        const params = new URLSearchParams();
        phaseOneForm.tagCodes.forEach((tag) => params.append("TagCodes", tag));
        const response = await apiClient.get("/LecturerProfiles/get-list", {
          params,
          headers: buildDefaultHeaders(),
        });
        const payload = response.data as { data?: unknown } | unknown;
        const rawList = Array.isArray((payload as any)?.data)
          ? ((payload as any).data as unknown[])
          : Array.isArray(payload)
            ? (payload as unknown[])
            : Array.isArray((payload as any)?.items)
              ? ((payload as any).items as unknown[])
              : [];
        const mapped = rawList
          .map(normalizeLecturerItem)
          .filter((item): item is LecturerOption => Boolean(item));
        setLecturerOptions(mapped);
      } catch (error) {
        console.error("Không thể tải danh sách giảng viên", error);
        addToast((error as Error).message || "Không thể tải danh sách giảng viên", "error");
        setLecturerOptions([]);
      } finally {
        setLecturersLoading(false);
      }
    }, [addToast, phaseOneForm.tagCodes]);

    const rebuildSessionAssignments = useCallback(
      (session: SessionId, slots: AssignedTopicSlot[]): AssignedTopicSlot[] => {
        const times = sessionSlotTimes(session);
        return slots.map((slot, index) => {
          const time = times[index] ?? times[times.length - 1];
          return {
            topic: slot.topic,
            session,
            timeLabel: time,
            scheduledAt: combineDateAndTime(phaseOneForm.defenseDate, time),
          };
        });
      },
      [phaseOneForm.defenseDate]
    );

    useEffect(() => {
      setAssignedTopics((prev) => ({
        1: rebuildSessionAssignments(1, prev[1]),
        2: rebuildSessionAssignments(2, prev[2]),
      }));
    }, [phaseOneForm.defenseDate, rebuildSessionAssignments]);

    const totalAssignedTopics = useMemo(
      () => assignedTopics[1].length + assignedTopics[2].length,
      [assignedTopics]
    );

    const supervisorCodesInAssignments = useMemo(() => {
      const codes = new Set<string>();
      assignedTopics[1].forEach((slot) => {
        if (slot.topic.supervisorCode) codes.add(slot.topic.supervisorCode);
      });
      assignedTopics[2].forEach((slot) => {
        if (slot.topic.supervisorCode) codes.add(slot.topic.supervisorCode);
      });
      return codes;
    }, [assignedTopics]);

    const filteredTopics = useMemo(() => {
      const keyword = topicSearch.trim().toLowerCase();
      return availableTopics.filter((topic) => {
        const matchesKeyword =
          keyword.length === 0 ||
          topic.topicCode.toLowerCase().includes(keyword) ||
          topic.title.toLowerCase().includes(keyword) ||
          (topic.studentName ?? "").toLowerCase().includes(keyword);
        return matchesKeyword;
      });
    }, [availableTopics, topicSearch]);

    const lecturerDictionary = useMemo(() => {
      const map = new Map<number, LecturerOption>();
      lecturerOptions.forEach((lecturer) => map.set(lecturer.lecturerProfileId, lecturer));
      return map;
    }, [lecturerOptions]);

    const handleAssignTopicToSession = useCallback(
      (topic: TopicTableItem, session: SessionId) => {
        if (!phaseOneForm.defenseDate) {
          addToast("Vui lòng chọn ngày bảo vệ ở Bước 1 trước khi phân phiên.", "warning");
          return;
        }

        const otherSession = session === 1 ? 2 : 1;
        const currentSlots = assignedTopics[session];
        const otherSlots = assignedTopics[otherSession];

        if (currentSlots.some((slot) => slot.topic.topicCode === topic.topicCode)) {
          return;
        }

        const otherFiltered = otherSlots.filter((slot) => slot.topic.topicCode !== topic.topicCode);
        const nextCurrentLength = currentSlots.length + 1;
        const nextTotal = nextCurrentLength + otherFiltered.length;

        if (currentSlots.length >= SESSION_TOPIC_LIMIT) {
          addToast("Phiên này đã đủ 4 đề tài.", "warning");
          return;
        }

        if (nextTotal > DAILY_TOPIC_LIMIT) {
          addToast("Số lượng đề tài vượt giới hạn.", "warning");
          return;
        }

        const nextCurrentRaw: AssignedTopicSlot[] = [
          ...currentSlots,
          {
            topic,
            session,
            timeLabel: "",
            scheduledAt: null,
          },
        ];

        const nextState: Record<SessionId, AssignedTopicSlot[]> = {
          ...assignedTopics,
          [session]: rebuildSessionAssignments(session, nextCurrentRaw),
          [otherSession]: rebuildSessionAssignments(otherSession, otherFiltered),
        };

        setAssignedTopics(nextState);
      },
      [addToast, assignedTopics, phaseOneForm.defenseDate, rebuildSessionAssignments]
    );

    const handleRemoveTopicFromSession = useCallback(
      (topicCode: string, session: SessionId) => {
        const filtered = assignedTopics[session].filter((slot) => slot.topic.topicCode !== topicCode);
        if (filtered.length === assignedTopics[session].length) {
          return;
        }
        setAssignedTopics((prev) => ({
          ...prev,
          [session]: rebuildSessionAssignments(session, filtered),
        }));
      },
      [assignedTopics, rebuildSessionAssignments]
    );

    const handleRoleAssignmentChange = useCallback((roleId: RoleId, value: string) => {
      setRoleAssignments((prev) => ({
        ...prev,
        [roleId]: value ? Number(value) : null,
      }));
    }, []);

    const handlePhaseOneConfirm = useCallback(async () => {
      if (!validatePhaseOne()) {
        return;
      }
      setWizardSubmitting(true);
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;
  // Prefer backend-suggested nextCode when available (to avoid racing sequence collisions)
  const committeeCode = (wizardInit?.nextCode && String(wizardInit.nextCode).trim()) || `COM${dateStr}001`;

        const createPayload: CommitteeAssignmentCreateRequest = {
          committeeCode,
          name: phaseOneForm.name.trim() || committeeCode,
          defenseDate: phaseOneForm.defenseDate || undefined,
          room: phaseOneForm.room.trim() || undefined,
          tagCodes: [...phaseOneForm.tagCodes],
          members: [],
          sessions: [],
          topics: [],
        };

        let createResponse;
        try {
          createResponse = await committeeAssignmentApi.createCommittee(createPayload);
        } catch (error) {
          if (error instanceof FetchDataError && error.status === 409) {
            const message = `Mã hội đồng ${committeeCode} đã tồn tại. Vui lòng thử lại.`;
            addToast(message, "error");
            setWizardError(message);
            return;
          }
          throw error;
        }

        if (!createResponse?.success) {
          throw new Error(createResponse?.message || "Không thể tạo hội đồng");
        }

    const responseCode = createResponse.data?.committeeCode ?? committeeCode;
    setPersistedCommitteeCode(responseCode);
    setWizardStep(2);
        setAssignedTopics({ 1: [], 2: [] });
        addToast("Đã tạo hội đồng. Vui lòng phân đề tài.", "success");
      } catch (error) {
        console.error("Không thể tạo hội đồng", error);
        addToast((error as Error).message || "Không thể tạo hội đồng", "error");
      } finally {
        setWizardSubmitting(false);
      }
  }, [addToast, phaseOneForm.defenseDate, phaseOneForm.name, phaseOneForm.room, phaseOneForm.tagCodes, validatePhaseOne, wizardInit]);

    const handleTopicsConfirm = useCallback(async () => {
      if (!persistedCommitteeCode) {
        addToast("Thiếu mã hội đồng để lưu đề tài.", "error");
        return;
      }
      if (!phaseOneForm.defenseDate) {
        addToast("Vui lòng chọn ngày bảo vệ ở Bước 1.", "warning");
        return;
      }
      if (totalAssignedTopics === 0) {
        addToast("Vui lòng chọn ít nhất một đề tài.", "warning");
        return;
      }

      const rawItems = [...assignedTopics[1], ...assignedTopics[2]];
      const items = rawItems.map((slot) => {
        const scheduledAt = slot.scheduledAt ?? combineDateAndTime(phaseOneForm.defenseDate, slot.timeLabel);
        // send StartTime/EndTime as time-only strings (HH:mm) so backend can parse into TimeSpan
        const startTime = slot.timeLabel ?? (scheduledAt ? new Date(scheduledAt).toISOString().slice(11,16) : null);
        const endTime = addMinutesToTimeLabel(startTime ?? slot.timeLabel, 45);
        return {
          topicCode: slot.topic.topicCode,
          session: slot.session,
          scheduledAt,
          startTime,
          endTime,
        };
      });

      // pick a top-level scheduledAt (earliest)
      const scheduledTimes = items.map((i) => i.scheduledAt).filter(Boolean) as string[];
      const topScheduledAt = scheduledTimes.length > 0 ? scheduledTimes.sort()[0] : null;

      if (items.some((item) => !item.scheduledAt)) {
        addToast("Không thể xác định thời gian bảo vệ cho đề tài.", "error");
        return;
      }

      setWizardSubmitting(true);
      try {
        const payload = {
          committeeCode: persistedCommitteeCode,
          scheduledAt: topScheduledAt,
          session: 0,
          assignedBy: getCurrentUserCode() ?? "admin",
          items,
        };
        await apiClient.post("/CommitteeAssignment/assign", payload, {
          headers: buildDefaultHeaders(),
        });
        addToast("Đã lưu đề tài cho hội đồng.", "success");
        setWizardStep(3);
      } catch (error) {
        console.error("Không thể lưu đề tài", error);
        addToast((error as Error).message || "Không thể lưu đề tài", "error");
      } finally {
        setWizardSubmitting(false);
      }
    }, [addToast, assignedTopics, persistedCommitteeCode, phaseOneForm.defenseDate, totalAssignedTopics]);

    const refreshStats = useCallback(
      async (signal?: AbortSignal) => {
        setTableLoading(true);
        try {
          const filterPayload = {
            page,
            pageSize,
            search: filters.search,
            dateFrom: filters.defenseDateFrom || undefined,
            dateTo: filters.defenseDateTo || undefined,
            tagCode: filters.tagCodes && filters.tagCodes.length > 0 ? filters.tagCodes.join(",") : undefined,
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
      [filters.defenseDateFrom, filters.defenseDateTo, filters.search, page, pageSize]
    );

    const handleSkipTopics = useCallback(() => {
      if (!persistedCommitteeCode) {
        addToast("Thiếu mã hội đồng để tiếp tục.", "error");
        return;
      }
      setAssignedTopics({ 1: [], 2: [] });
      setWizardStep(3);
      addToast("Bạn có thể phân công đề tài sau khi hoàn tất hội đồng.", "info");
    }, [addToast, persistedCommitteeCode]);

    const handleMembersConfirm = useCallback(async () => {
      if (!persistedCommitteeCode) {
        addToast("Thiếu mã hội đồng để lưu thành viên.", "error");
        return;
      }

      for (const role of ROLE_CONFIG) {
        if (!roleAssignments[role.id]) {
          addToast(`Vui lòng chọn ${role.label}.`, "warning");
          return;
        }
      }

      const membersPayload = ROLE_CONFIG.map((role) => {
        const lecturerId = roleAssignments[role.id]!;
        const lecturer = lecturerDictionary.get(lecturerId);
        if (!lecturer) {
          throw new Error("Thiếu thông tin giảng viên đã chọn");
        }
        if (role.requiresPhd && !isPhd(lecturer.degree)) {
          throw new Error("Chủ tịch cần có học vị Tiến sĩ.");
        }
        if (lecturer.lecturerCode && supervisorCodesInAssignments.has(lecturer.lecturerCode)) {
          throw new Error("Giảng viên này đã hướng dẫn đề tài trong hội đồng.");
        }
        return {
          lecturerProfileId: lecturerId,
          role: role.apiRole,
        };
      });

      setWizardSubmitting(true);
      try {
        await apiClient.post(
          "/CommitteeAssignment/members",
          {
            committeeCode: persistedCommitteeCode,
            members: membersPayload,
          },
          {
            headers: buildDefaultHeaders(),
          }
        );
        addToast("Hội đồng đã được phân công thành công.", "success");
        await refreshStats();
        handleWizardClose();
      } catch (error) {
        console.error("Không thể lưu thành viên", error);
        const message = (error as Error).message || "Không thể lưu thành viên";
        if (message.includes("hướng dẫn")) {
          addToast("Giảng viên này đã hướng dẫn đề tài trong hội đồng.", "error");
        } else {
          addToast(message, "error");
        }
      } finally {
        setWizardSubmitting(false);
      }
  }, [addToast, handleWizardClose, lecturerDictionary, persistedCommitteeCode, refreshStats, roleAssignments, supervisorCodesInAssignments]);

    useEffect(() => {
      if (!wizardOpen) return;
      if (wizardStep === 2) {
        void fetchTopicsForSession();
      }
      if (wizardStep === 3) {
        setRoleAssignments({ ...EMPTY_ROLE_ASSIGNMENTS });
        void fetchLecturersForCommittee();
      }
    }, [fetchLecturersForCommittee, fetchTopicsForSession, wizardOpen, wizardStep]);

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

    // Use tag description as the label when available
    const resolveWizardTagLabel = useCallback((tagCode: string) => {
      const entry = wizardTagNameLookup[tagCode] ?? tagDictionary[tagCode];
      // Prefer human-friendly tagName, then description, then code
      return (entry && ((entry as any).name || (entry as any).tagName)) || (entry && (entry as any).description) || tagCode;
    }, [tagDictionary, wizardTagNameLookup]);

    const lecturerOptionsByRole = useMemo(() => {
      const map: Record<RoleId, LecturerOption[]> = {
        chair: [],
        reviewer1: [],
        secretary: [],
        reviewer2: [],
        reviewer3: [],
      };
      ROLE_CONFIG.forEach((role) => {
        const selectedIds = new Set<number>();
        Object.entries(roleAssignments).forEach(([key, value]) => {
          if (value && key !== role.id) {
            selectedIds.add(value);
          }
        });
        map[role.id] = lecturerOptions.filter((lecturer) => {
          if (selectedIds.has(lecturer.lecturerProfileId)) {
            return false;
          }
          if (role.requiresPhd && !isPhd(lecturer.degree)) {
            return false;
          }
          return true;
        });
      });
      return map;
    }, [lecturerOptions, roleAssignments]);

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

    const handleOpenDetail = useCallback(async (committeeCode: string) => {
      setDetailLoading(true);
      setViewMode('detail');
      try {
        const response = await committeeAssignmentApi.getCommitteeDetail(committeeCode);
        if (response?.success && response.data) {
          const detail = response.data;

          // Normalize/merge data: sometimes backend includes studentName/supervisorName
          // inside sessions.topics rather than top-level assignments. Merge those
          // values into assignments to ensure the UI always sees names.
          try {
            const sessionTopicMap = new Map<string, Partial<CommitteeAssignmentDefenseItem>>();
            (detail.sessions ?? []).forEach((s) => {
              (s.topics ?? []).forEach((t) => {
                if (t && t.topicCode) {
                  sessionTopicMap.set(String(t.topicCode), {
                    studentName: t.studentName ?? null,
                    studentCode: t.studentCode ?? null,
                    supervisorName: t.supervisorName ?? null,
                    supervisorCode: t.supervisorCode ?? null,
                    startTime: t.startTime ?? null,
                    endTime: t.endTime ?? null,
                  });
                }
              });
            });

            // Apply merges
            if (Array.isArray(detail.assignments)) {
              detail.assignments = detail.assignments.map((a) => {
                const key = String(a.topicCode ?? "");
                const fromSession = sessionTopicMap.get(key);
                if (fromSession) {
                  return {
                    ...a,
                    studentName: a.studentName ?? fromSession.studentName ?? a.studentName,
                    studentCode: a.studentCode ?? fromSession.studentCode ?? a.studentCode,
                    supervisorName: a.supervisorName ?? fromSession.supervisorName ?? a.supervisorName,
                    supervisorCode: a.supervisorCode ?? fromSession.supervisorCode ?? a.supervisorCode,
                    startTime: a.startTime ?? fromSession.startTime ?? a.startTime,
                    endTime: a.endTime ?? fromSession.endTime ?? a.endTime,
                  };
                }
                return a;
              });
            }

            // If after merging some supervisor names are still missing, try to fetch lecturer names in batch
            const missingSupervisorCodes = Array.from(new Set(
              (detail.assignments ?? [])
                .map((it) => it.supervisorCode)
                .filter(Boolean) as string[]
            ));

            const haveNames = (detail.assignments ?? []).some((it) => !!it.supervisorName);
            if (missingSupervisorCodes.length > 0 && !haveNames) {
              try {
                const lecParams = new URLSearchParams();
                lecParams.set("LecturerCodes", missingSupervisorCodes.join(","));
                const lecResp = await apiClient.get("/LecturerProfiles/get-list", {
                  params: lecParams,
                  headers: buildDefaultHeaders(),
                });
                const lecPayload = lecResp.data as { data?: unknown } | unknown;
                const lecRaw = Array.isArray((lecPayload as any)?.data)
                  ? ((lecPayload as any).data as any[])
                  : Array.isArray(lecPayload)
                    ? (lecPayload as unknown as any[])
                    : [];
                const lecMap = new Map<string, string>();
                lecRaw.forEach((entry) => {
                  const code = entry?.lecturerCode ?? entry?.lecturer_code ?? entry?.LecturerCode;
                  const name = entry?.fullName ?? entry?.full_name ?? entry?.FullName ?? entry?.name;
                  if (code && name) lecMap.set(String(code), String(name));
                });

                detail.assignments = (detail.assignments ?? []).map((a) => ({
                  ...a,
                  supervisorName: a.supervisorName ?? (a.supervisorCode ? lecMap.get(a.supervisorCode) ?? a.supervisorName : a.supervisorName),
                }));
              } catch (err) {
                // non-fatal
                console.warn("Không thể tải thông tin giảng viên hướng dẫn cho chi tiết hội đồng", err);
              }
            }
          } catch (mergeErr) {
            console.warn("Lỗi khi hợp nhất dữ liệu phiên/phân công", mergeErr);
          }

          setSelectedCommittee(detail);
        } else {
          addToast("Không thể tải thông tin hội đồng", "error");
          setViewMode('list');
        }
      } catch (error) {
        console.error("Lỗi khi tải chi tiết hội đồng", error);
        addToast("Không thể tải thông tin hội đồng", "error");
        setViewMode('list');
      } finally {
        setDetailLoading(false);
      }
    }, [addToast]);

    const handleBackToList = useCallback(() => {
      setViewMode('list');
      setSelectedCommittee(null);
    }, []);

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
          scheduledAt?: string | undefined;
          session: number;
          startTime?: string;
          endTime?: string;
        }) => {
        if (!assigningTopic) return;
        try {
          const response = await committeeAssignmentApi.assignTopics({
            committeeCode: payload.committeeCode,
            scheduledAt: payload.scheduledAt ?? null,
            session: payload.session,
            items: [
              {
                topicCode: assigningTopic.topicCode,
                session: payload.session,
                scheduledAt: payload.scheduledAt ?? null,
                startTime: payload.startTime ?? null,
                endTime: payload.endTime ?? null,
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
            tagDictionary={tagDictionary}
            onTagsChange={(tagCodes) => {
              setFilters((prev) => ({ ...prev, tagCodes }));
              setPage(1);
            }}
          />

          {viewMode === 'list' ? (
            <CommitteeTable
              data={committeeRows}
              loading={tableLoading}
              page={page}
              pageSize={pageSize}
              total={totalRows}
              onPageChange={handlePageChange}
              onViewDetail={handleOpenDetail}
              onDelete={(committeeCode: string) => setDeleteTarget(committeeCode)}
              resolveTagLabel={getTagLabel}
            />
          ) : (
            // Render detail view inside a modal shell to match UX requirements
            <ModalShell
              onClose={handleBackToList}
              title={`Chi tiết hội đồng ${selectedCommittee?.committeeCode ?? ""}`}
              subtitle={selectedCommittee?.name ?? undefined}
              wide
            >
              <CommitteeDetailView
                committee={selectedCommittee}
                loading={detailLoading}
                onBack={handleBackToList}
                onRefresh={() => selectedCommittee && handleOpenDetail(selectedCommittee.committeeCode)}
                tagDictionary={tagDictionary}
                addToast={addToast}
              />
            </ModalShell>
          )}
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
                              const label = resolveWizardTagLabel(tagCode);
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
                      className="space-y-6"
                    >
                      <div className="rounded-2xl border border-[#E5ECFB] bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-[#1F3C88]">Chọn đề tài cho phiên bảo vệ</p>
                            <p className="text-xs text-[#4A5775]">
                              Mỗi phiên tối đa 4 đề tài, tổng {DAILY_TOPIC_LIMIT} đề tài trong cùng ngày.
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#1F3C88]">
                            <span
                              className={`rounded-full px-3 py-1 ${
                                totalAssignedTopics >= DAILY_TOPIC_LIMIT
                                  ? "bg-[#FCE8D5] text-[#8B5E34]"
                                  : "bg-[#F1F5FF]"
                              }`}
                            >
                              {totalAssignedTopics}/{DAILY_TOPIC_LIMIT} đề tài
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2 rounded-full border border-[#D9E1F2] bg-[#F8FAFF] px-3 py-2 text-sm">
                            <Search size={16} className="text-[#1F3C88]" />
                            <input
                              value={topicSearch}
                              onChange={(event) => setTopicSearch(event.target.value)}
                              placeholder="Tìm đề tài, sinh viên, giảng viên hướng dẫn"
                              className="w-full border-none bg-transparent text-sm outline-none"
                            />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {phaseOneForm.tagCodes.map((tagCode) => (
                              <span
                                key={tagCode}
                                className="rounded-full bg-[#1F3C88]/10 px-3 py-1 text-xs font-semibold text-[#1F3C88]"
                              >
                                {resolveWizardTagLabel(tagCode)}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4 overflow-x-auto">
                          {topicsLoading ? (
                            <div className="flex h-48 items-center justify-center">
                              <Loader2 className="h-10 w-10 animate-spin text-[#1F3C88]" />
                            </div>
                          ) : filteredTopics.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-[#D9E1F2] bg-[#F8FAFF] px-4 py-6 text-center text-sm text-[#4A5775]">
                              Không có đề tài phù hợp với chuyên môn đã chọn.
                            </div>
                          ) : (
                            <table className="w-full text-sm">
                              <thead className="bg-[#F8FAFF]">
                                <tr className="border-b border-[#E5ECFB] text-left text-xs uppercase tracking-wide text-[#1F3C88]">
                                  <th className="px-4 py-3">Mã</th>
                                  <th className="px-4 py-3">Tên đề tài</th>
                                  <th className="px-4 py-3">Sinh viên</th>
                                  <th className="px-4 py-3">GV hướng dẫn</th>
                                  <th className="px-4 py-3">Chuyên ngành</th>
                                  <th className="px-4 py-3">Trạng thái</th>
                                  <th className="px-4 py-3 text-center">Thao tác</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredTopics.map((topic) => {
                                  const inMorning = assignedTopics[1].some(
                                    (slot) => slot.topic.topicCode === topic.topicCode
                                  );
                                  const inAfternoon = assignedTopics[2].some(
                                    (slot) => slot.topic.topicCode === topic.topicCode
                                  );
                                  const morningDisabled =
                                    !inMorning &&
                                    (assignedTopics[1].length >= SESSION_TOPIC_LIMIT ||
                                      (totalAssignedTopics >= DAILY_TOPIC_LIMIT && !inAfternoon));
                                  const afternoonDisabled =
                                    !inAfternoon &&
                                    (assignedTopics[2].length >= SESSION_TOPIC_LIMIT ||
                                      (totalAssignedTopics >= DAILY_TOPIC_LIMIT && !inMorning));
                                  return (
                                    <tr key={topic.topicCode} className="border-b border-[#E5ECFB] hover:bg-[#F8FAFF]">
                                      <td className="px-4 py-3 font-semibold text-[#1F3C88]">{topic.topicCode}</td>
                                      <td className="px-4 py-3 text-[#0F1C3F]">{topic.title}</td>
                                      <td className="px-4 py-3 text-[#4A5775]">{topic.studentName ?? "—"}</td>
                                      <td className="px-4 py-3 text-[#4A5775]">{topic.supervisorName ?? "—"}</td>
                                      <td className="px-4 py-3 text-[#4A5775]">
                                        {topic.tagDescriptions?.[0] ?? topic.specialty ?? "—"}
                                      </td>
                                      <td className="px-4 py-3">
                                        <span className="rounded-full bg-[#F1F5FF] px-3 py-1 text-xs font-semibold text-[#1F3C88]">
                                          {topic.status ?? "Đang chờ"}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="flex flex-col gap-2 text-xs font-semibold sm:flex-row sm:justify-center">
                                          <button
                                            type="button"
                                            disabled={morningDisabled}
                                            onClick={() => handleAssignTopicToSession(topic, 1)}
                                            className="rounded-full border border-[#1F3C88] px-3 py-1 text-[#1F3C88] transition enabled:hover:bg-[#1F3C88] enabled:hover:text-white disabled:opacity-50"
                                          >
                                            {inMorning ? "Đã ở phiên sáng" : "Thêm phiên sáng"}
                                          </button>
                                          <button
                                            type="button"
                                            disabled={afternoonDisabled}
                                            onClick={() => handleAssignTopicToSession(topic, 2)}
                                            className="rounded-full border border-[#F37021] px-3 py-1 text-[#F37021] transition enabled:hover:bg-[#F37021] enabled:hover:text-white disabled:opacity-50"
                                          >
                                            {inAfternoon ? "Đã ở phiên chiều" : "Thêm phiên chiều"}
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        {[1, 2].map((sessionId) => {
                          const typedSession = sessionId as SessionId;
                          const sessionTitle = SESSION_LABEL[typedSession];
                          const accentClass = typedSession === 1 ? "border-[#1F3C88]" : "border-[#F37021]";
                          const slots = assignedTopics[typedSession];
                          return (
                            <div
                              key={sessionId}
                              className={`rounded-2xl border ${accentClass} bg-white p-5 shadow-sm`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-[#1F3C88]">{sessionTitle}</p>
                                  <p className="text-xs text-[#4A5775]">
                                    Bắt đầu lúc {typedSession === 1 ? MORNING_SLOTS[0] : AFTERNOON_SLOTS[0]}
                                  </p>
                                </div>
                                <span className="text-xs text-[#4A5775]">
                                  {slots.length}/{SESSION_TOPIC_LIMIT} đề tài
                                </span>
                              </div>
                              <div className="mt-3 space-y-3">
                                {slots.length === 0 ? (
                                  <div className="rounded-xl border border-dashed border-[#D9E1F2] bg-[#F8FAFF] px-4 py-6 text-center text-sm text-[#4A5775]">
                                    Chưa có đề tài nào trong phiên này.
                                  </div>
                                ) : (
                                  slots.map((slot) => (
                                    <div
                                      key={slot.topic.topicCode}
                                      className="rounded-xl border border-[#E5ECFB] bg-[#F8FAFF] p-4"
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div>
                                          <p className="font-semibold text-[#1F3C88]">{slot.topic.title}</p>
                                          <p className="text-xs text-[#4A5775]">{slot.topic.topicCode}</p>
                                          {slot.topic.studentName && (
                                            <p className="text-xs text-[#4A5775]">
                                              Sinh viên: {slot.topic.studentName}
                                            </p>
                                          )}
                                          {slot.topic.supervisorName && (
                                            <p className="text-xs text-[#4A5775]">
                                              GVHD: {slot.topic.supervisorName}
                                            </p>
                                          )}
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveTopicFromSession(slot.topic.topicCode, typedSession)}
                                          className="rounded-full border border-red-300 p-2 text-red-500 transition hover:bg-red-50"
                                          aria-label="Xóa khỏi phiên"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                      <div className="mt-3 text-xs text-[#4A5775]">
                                        <span className="font-semibold text-[#1F3C88]">Thời gian: </span>
                                        {formatTime(slot.timeLabel)}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          );
                        })}
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
                      className="space-y-6"
                    >
                      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="flex flex-col gap-4 rounded-2xl border border-[#E5ECFB] bg-white p-5 shadow-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-[#1F3C88]">Phân vai trò giảng viên</span>
                            {lecturersLoading ? (
                              <span className="flex items-center gap-2 text-xs text-[#4A5775]">
                                <Loader2 className="h-4 w-4 animate-spin text-[#1F3C88]" /> Đang tải
                              </span>
                            ) : (
                              <span className="text-xs text-[#4A5775]">
                                {lecturerOptions.length.toLocaleString("vi-VN")} lựa chọn
                              </span>
                            )}
                          </div>
                          <div className="space-y-4">
                            {ROLE_CONFIG.map((role) => {
                              const selectedId = roleAssignments[role.id];
                              const options = lecturerOptionsByRole[role.id] ?? [];
                              const selectedLecturer = selectedId ? lecturerDictionary.get(selectedId) : null;
                              return (
                                <div key={role.id} className="rounded-xl border border-[#E5ECFB] bg-[#F8FAFF] p-4">
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-semibold text-[#1F3C88]">{role.label}</p>
                                      <p className="text-xs text-[#4A5775]">
                                        {role.requiresPhd ? "Yêu cầu học vị Tiến sĩ" : "Không trùng lặp với vai trò khác"}
                                      </p>
                                    </div>
                                    {selectedLecturer && (
                                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#1F3C88]">
                                        {selectedLecturer.lecturerCode}
                                      </span>
                                    )}
                                  </div>
                                  <select
                                    value={selectedId ?? ""}
                                    onChange={(event) => handleRoleAssignmentChange(role.id, event.target.value)}
                                    className="mt-3 w-full rounded-lg border border-[#D9E1F2] bg-white px-3 py-2 text-sm focus:border-[#1F3C88] focus:outline-none disabled:opacity-60"
                                    disabled={lecturersLoading}
                                  >
                                    <option value="">Chọn giảng viên</option>
                                    {options.map((lecturer) => (
                                      <option key={lecturer.lecturerProfileId} value={lecturer.lecturerProfileId}>
                                        {lecturer.fullName} ({lecturer.degree ?? "Chưa cập nhật"})
                                      </option>
                                    ))}
                                  </select>
                                  {selectedLecturer && (
                                    <div className="mt-2 text-xs text-[#4A5775]">
                                      {selectedLecturer.degree
                                        ? `Học vị: ${selectedLecturer.degree}`
                                        : "Chưa cập nhật học vị"}
                                    </div>
                                  )}
                                  {options.length === 0 && !lecturersLoading && (
                                    <p className="mt-2 text-xs text-red-600">Không còn giảng viên phù hợp cho vai trò này.</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-2xl border border-[#E5ECFB] bg-white p-5 shadow-sm">
                            <p className="text-sm font-semibold text-[#1F3C88]">Đề tài đã sắp lịch</p>
                            <p className="text-xs text-[#4A5775]">Kiểm tra giảng viên hướng dẫn để tránh xung đột.</p>
                            <div className="mt-3 space-y-4">
                              {[1, 2].map((sessionId) => {
                                const typedSession = sessionId as SessionId;
                                const slots = assignedTopics[typedSession];
                                return (
                                  <div key={sessionId} className="rounded-xl border border-[#E5ECFB] bg-[#F8FAFF] p-4">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-semibold text-[#1F3C88]">{SESSION_LABEL[typedSession]}</span>
                                      <span className="text-xs text-[#4A5775]">
                                        {slots.length}/{SESSION_TOPIC_LIMIT} đề tài
                                      </span>
                                    </div>
                                    {slots.length === 0 ? (
                                      <p className="mt-2 text-xs text-[#4A5775]">Chưa có đề tài nào.</p>
                                    ) : (
                                      <ul className="mt-2 space-y-2 text-xs text-[#4A5775]">
                                        {slots.map((slot) => (
                                          <li
                                            key={slot.topic.topicCode}
                                            className="rounded-lg border border-[#E5ECFB] bg-white px-3 py-2"
                                          >
                                            <p className="font-semibold text-[#1F3C88]">{slot.topic.title}</p>
                                            <p>Mã: {slot.topic.topicCode}</p>
                                            {slot.topic.supervisorName && <p>GVHD: {slot.topic.supervisorName}</p>}
                                            <p>Thời gian: {formatTime(slot.timeLabel)}</p>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-[#FFE5D0] bg-[#FFF6EE] p-5 text-xs text-[#8B5E34]">
                            <p>
                              Không thể phân công giảng viên đã hướng dẫn đề tài trong danh sách trên. Hệ thống sẽ thông
                              báo nếu trùng.
                            </p>
                            {supervisorCodesInAssignments.size > 0 && (
                              <p className="mt-2">
                                Mã giảng viên hướng dẫn hiện có: {[...supervisorCodesInAssignments].join(", ")}.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={handleWizardClose}
                    className="rounded-full border border-[#D9E1F2] px-4 py-2 text-sm font-semibold text-[#1F3C88] transition hover:border-[#1F3C88]"
                  >
                    Hủy quy trình
                  </button>
                  <div className="flex flex-wrap gap-3">
                    {wizardStep === 1 && (
                      <button
                        type="button"
                        onClick={handlePhaseOneConfirm}
                        disabled={wizardSubmitting}
                        className="rounded-full bg-[#1F3C88] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#162B61] disabled:opacity-60"
                      >
                        {wizardSubmitting ? "Đang lưu..." : "Xác nhận bước 1"}
                      </button>
                    )}
                    {wizardStep === 2 && (
                      <>
                        {totalAssignedTopics === 0 && (
                          <button
                            type="button"
                            onClick={handleSkipTopics}
                            className="rounded-full border border-[#F37021] px-5 py-2 text-sm font-semibold text-[#F37021] transition hover:bg-[#FFF2E9]"
                          >
                            Bỏ qua bước này
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleTopicsConfirm}
                          disabled={wizardSubmitting || topicsLoading}
                          className="rounded-full bg-[#1F3C88] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#162B61] disabled:opacity-60"
                        >
                          {wizardSubmitting ? "Đang lưu..." : "Lưu lịch đề tài"}
                        </button>
                      </>
                    )}
                    {wizardStep === 3 && (
                      <button
                        type="button"
                        onClick={handleMembersConfirm}
                        disabled={wizardSubmitting}
                        className="rounded-full bg-[#FF6B35] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#E55A2B] disabled:opacity-60"
                      >
                        {wizardSubmitting ? "Đang lưu..." : "Hoàn tất hội đồng"}
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

