import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Download,
  X,
  Gavel,
  GraduationCap,
  Layers3,
  Lock,
  Eye,
  Pencil,
  Plus,
  Save,
  Search,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { useToast } from "../../context/useToast";
import { FetchDataError, fetchData } from "../../api/fetchData";
import type { ApiResponse } from "../../types/api";
import type { SessionCode } from "../../types/defense-workflow-contract";
import {
  pickCaseInsensitiveValue,
  readEnvelopeAllowedActions,
  readEnvelopeConcurrencyToken,
  readEnvelopeData,
  readEnvelopeErrorMessages,
  readEnvelopeIdempotencyReplay,
  readEnvelopeMessage,
  readEnvelopeSuccess,
  readEnvelopeWarnings,
  readEnvelopeWarningMessages,
  toCompatResponse,
} from "../../utils/api-envelope";
import {
  extractDefensePeriodId,
  getActiveDefensePeriodId,
  normalizeDefensePeriodId,
  setActiveDefensePeriodId,
} from "../../utils/defensePeriod";

type AutoGenerateTopicDto = {
  topicId?: number | string;
  topicCode?: string;
  title?: string;
  tagCodes?: string[];
  studentCode?: string | null;
  supervisorCode?: string | null;
};

type AutoGenerateLecturerDto = {
  lecturerId?: number | string;
  lecturerProfileId?: number;
  lecturerCode?: string;
  lecturerName?: string;
  degree?: string | null;
  tagCodes?: string[];
  availability?: boolean;
  guideQuota?: number | null;
  currentGuidingCount?: number | null;
};

type TagCatalogEntry = {
  tagCode: string;
  tagName: string;
};

type AutoGenerateCommitteeApi = {
  committeeCode?: string;
  concurrencyToken?: string;
  room?: string;
  defenseDate?: string;
  tagCodes?: string[];
  members?: Array<{
    role?: string;
    lecturerCode?: string;
    lecturerName?: string;
  }>;
  assignments?: Array<{ studentCode?: string; session?: number | null }>;
};

type CouncilScheduleMode = "FULL_DAY" | "ONE_SESSION";

type EligibleStudent = {
  studentCode: string;
  topicCode?: string;
  studentName: string;
  topicTitle: string;
  supervisorCode: string;
  tags: string[];
  studentTags: string[];
  topicTags: string[];
  lecturerTags: string[];
  status?: string;
  isEligible: boolean;
  valid: boolean;
  error?: string;
};

type LecturerCapability = {
  lecturerCode: string;
  lecturerName: string;
  degree?: string | null;
  tags: string[];
  warning?: string;
};

type ManualLecturerOption = {
  lecturerCode: string;
  lecturerName: string;
  degree?: string | null;
  tags: string[];
};

type CouncilMember = {
  role: string;
  lecturerCode: string;
  lecturerName: string;
};

type CouncilAssignment = {
  assignmentId?: number;
  studentCode: string;
  topicCode?: string;
  sessionCode: SessionCode;
  startTime?: string;
  endTime?: string;
  scheduledAt?: string;
  orderIndex: number;
};

type CouncilDraft = {
  id: string;
  councilId?: number;
  name?: string;
  concurrencyToken?: string;
  room: string;
  defenseDate: string;
  session: "Sang" | "Chieu";
  sessionCode?: SessionCode;
  startTime?: string;
  endTime?: string;
  slotId: string;
  councilTags: string[];
  morningStudents: string[];
  afternoonStudents: string[];
  assignments?: CouncilAssignment[];
  forbiddenLecturers: string[];
  members: CouncilMember[];
  warning?: string;
};

type CommitteeStatus = "Draft" | "Ready" | "Warning";

type CouncilRow = CouncilDraft & {
  memberCount: number;
  status: CommitteeStatus;
};

const buildDefaultManualMembers = (count: number): CouncilMember[] => {
  const total = Math.max(FIXED_MANUAL_MEMBER_SLOT_COUNT, Number(count) || 0);
  return Array.from({ length: total }, (_, index) => ({
    role: index === 0 ? "CT" : index === 1 ? "TK" : "UV",
    lecturerCode: "",
    lecturerName: "",
  }));
};

type ModalAlert = {
  type: "error" | "warning" | "info";
  message: string;
};

const FIXED_TOPICS_PER_SESSION = 4;
const FIXED_MEMBERS_PER_COUNCIL = 4;
const COUNCIL_CONFIG_OPTIONS = [3, 4, 5, 6, 7];

const baseCard: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: 18,
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

const readinessMessageMap: Record<string, string> = {
  "UC2.READINESS.LECTURER_CAPABILITIES_UNLOCKED":
    "Chưa chốt năng lực giảng viên.",
  "UC2.READINESS.COUNCIL_CONFIG_NOT_CONFIRMED":
    "Chưa xác nhận cấu hình hội đồng.",
  "UC2.READINESS.NO_COUNCILS": "Chưa có hội đồng nào.",
};

const translateBackendMessage = (value: string) => {
  const normalized = value.trim();
  if (!normalized) return "";

  const direct = readinessMessageMap[normalized.toUpperCase()];
  if (direct) return direct;

  if (normalized.toUpperCase().startsWith("UC2.READINESS.")) {
    const suffix = normalized
      .slice("UC2.READINESS.".length)
      .replace(/_/g, " ")
      .toLowerCase();
    return suffix.charAt(0).toUpperCase() + suffix.slice(1) + ".";
  }

  return normalized;
};

const isNoDataMessage = (value: string) => {
  const normalized = value.trim().toLowerCase();
  return (
    normalized.includes("không có dữ liệu") ||
    normalized.includes("khong co du lieu") ||
    normalized.includes("no data") ||
    normalized.includes("empty") ||
    normalized.includes("not found")
  );
};

type TimeSelectorParts = {
  hour12: string;
  minute: string;
  meridiem: "AM" | "PM";
};

type DateSelectorParts = {
  day: number;
  month: number;
  year: number;
};

type StringStateSetter = React.Dispatch<React.SetStateAction<string>>;

type PickerOption = {
  value: string | number;
  label: React.ReactNode;
  displayLabel?: React.ReactNode;
  className?: string;
};

type InlinePickerProps = {
  value: string | number;
  options: PickerOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
};

const InlinePicker: React.FC<InlinePickerProps> = ({
  value,
  options,
  onChange,
  ariaLabel,
  className,
  disabled,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selected =
    options.find((option) => String(option.value) === String(value)) ??
    options[0];
  const selectedDisplayLabel = selected?.displayLabel ?? selected?.label ?? "-";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={rootRef} className={`prepare-picker ${className ?? ""}`}>
      <button
        type="button"
        className="prepare-picker-trigger"
        aria-label={ariaLabel}
        aria-expanded={open}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen((prev) => !prev);
          }
        }}
      >
        <div className="prepare-picker-value">{selectedDisplayLabel}</div>
        <span className="prepare-picker-caret">▾</span>
      </button>
      {open && !disabled && (
        <div
          className="prepare-picker-menu"
          role="listbox"
          aria-label={ariaLabel}
        >
          {options.map((option) => {
            const active = String(option.value) === String(value);
            return (
              <button
                key={String(option.value)}
                type="button"
                className={`prepare-picker-item ${option.className ?? ""} ${active ? "active" : ""}`}
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(String(option.value));
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const toTwoDigits = (value: number | string) => String(value).padStart(2, "0");

const HOUR_SELECTOR_OPTIONS = Array.from({ length: 12 }, (_, index) =>
  toTwoDigits(index + 1),
);

const BASE_MINUTE_SELECTOR_OPTIONS = Array.from({ length: 12 }, (_, index) =>
  toTwoDigits(index * 5),
);

const MONTH_SELECTOR_OPTIONS = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  label: `Tháng ${toTwoDigits(index + 1)}`,
}));

const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month, 0).getDate();

const parseTimeSelector = (value: string): TimeSelectorParts => {
  const safeValue = String(value ?? "").trim();
  const [hourRaw = "8", minuteRaw = "0"] = safeValue.split(":");
  const parsedHour = Number(hourRaw);
  const parsedMinute = Number(minuteRaw);
  const hour24 = Number.isFinite(parsedHour)
    ? Math.min(23, Math.max(0, Math.floor(parsedHour)))
    : 8;
  const minute = Number.isFinite(parsedMinute)
    ? Math.min(59, Math.max(0, Math.floor(parsedMinute)))
    : 0;
  const meridiem: "AM" | "PM" = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  return {
    hour12: toTwoDigits(hour12),
    minute: toTwoDigits(minute),
    meridiem,
  };
};

const composeTimeSelector = (parts: TimeSelectorParts) => {
  const hour12 = Number(parts.hour12);
  const minute = Number(parts.minute);
  const safeHour12 = Number.isFinite(hour12)
    ? Math.min(12, Math.max(1, Math.floor(hour12)))
    : 8;
  const safeMinute = Number.isFinite(minute)
    ? Math.min(59, Math.max(0, Math.floor(minute)))
    : 0;
  let hour24 = safeHour12 % 12;
  if (parts.meridiem === "PM") {
    hour24 += 12;
  }
  return `${toTwoDigits(hour24)}:${toTwoDigits(safeMinute)}`;
};

const parseDateSelector = (value: string): DateSelectorParts => {
  const today = new Date();
  const safeValue = String(value ?? "")
    .trim()
    .slice(0, 10);
  const [yearRaw, monthRaw, dayRaw] = safeValue.split("-");

  const parsedYear = Number(yearRaw);
  const parsedMonth = Number(monthRaw);
  const baseYear =
    Number.isFinite(parsedYear) && parsedYear >= 2000
      ? Math.floor(parsedYear)
      : today.getFullYear();
  const baseMonth =
    Number.isFinite(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12
      ? Math.floor(parsedMonth)
      : today.getMonth() + 1;

  const maxDay = getDaysInMonth(baseYear, baseMonth);
  const parsedDay = Number(dayRaw);
  const day =
    Number.isFinite(parsedDay) && parsedDay >= 1 && parsedDay <= maxDay
      ? Math.floor(parsedDay)
      : Math.min(today.getDate(), maxDay);

  return {
    day,
    month: baseMonth,
    year: baseYear,
  };
};

const composeDateSelector = (parts: DateSelectorParts) => {
  const safeYear = Number.isFinite(parts.year)
    ? Math.floor(parts.year)
    : new Date().getFullYear();
  const safeMonth = Number.isFinite(parts.month)
    ? Math.min(12, Math.max(1, Math.floor(parts.month)))
    : 1;
  const maxDay = getDaysInMonth(safeYear, safeMonth);
  const safeDay = Number.isFinite(parts.day)
    ? Math.min(maxDay, Math.max(1, Math.floor(parts.day)))
    : 1;

  return `${safeYear}-${toTwoDigits(safeMonth)}-${toTwoDigits(safeDay)}`;
};

const normalizeRoomCode = (value: string | null | undefined) =>
  String(value ?? "")
    .trim()
    .toUpperCase();

const normalizeTagCode = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toUpperCase();

const normalizeSearchText = (value: string | null | undefined) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const isChairRole = (role: string | null | undefined) => {
  const normalized = normalizeSearchText(role).replace(/[^a-z0-9]+/g, " ");
  return (
    normalized === "ct" ||
    normalized.includes("chu tich") ||
    normalized.includes("chair")
  );
};

const isDoctorDegree = (degree: string | null | undefined) => {
  const normalized = normalizeSearchText(degree).replace(/[^a-z0-9]+/g, " ");
  if (!normalized) {
    return false;
  }

  if (
    normalized.includes("tien si") ||
    normalized.includes("doctor") ||
    normalized.includes("phd")
  ) {
    return true;
  }

  const tokens = normalized.split(" ").filter(Boolean);
  return tokens.includes("ts") || tokens.includes("dr");
};

const normalizeTagLookupKey = (value: string | null | undefined) =>
  normalizeSearchText(value).replace(/\s+/g, " ").trim();

const formatLecturerNameWithDegree = (
  lecturerName: string | null | undefined,
  degree: string | null | undefined,
) => {
  const safeName = String(lecturerName ?? "").trim() || "Chưa rõ giảng viên";
  const safeDegree = String(degree ?? "").trim() || "Chưa cập nhật học vị";
  return `${safeName} (${safeDegree})`;
};

const FIXED_MANUAL_MEMBER_SLOT_COUNT = 2;

const MANUAL_MEMBER_ROLE_SELECT_OPTIONS: Array<{
  value: string;
  label: string;
}> = [
  { value: "PB", label: "Phản biện" },
  { value: "UV", label: "Ủy viên" },
];

const getManualMemberRoleLabel = (role: string | null | undefined) => {
  const normalized = normalizeSearchText(role).replace(/[^a-z0-9]+/g, " ");
  if (!normalized) {
    return "-";
  }

  if (
    normalized.startsWith("ct") ||
    normalized.includes("chu tich") ||
    normalized.includes("chair")
  ) {
    return "Chủ tịch";
  }

  if (
    normalized.startsWith("tk") ||
    normalized.includes("thu ky") ||
    normalized.includes("secretary")
  ) {
    return "Thư ký";
  }

  if (
    normalized.startsWith("pb") ||
    normalized.includes("phan bien") ||
    normalized.includes("reviewer")
  ) {
    return "Phản biện";
  }

  if (
    normalized.startsWith("uv") ||
    normalized.includes("uy vien") ||
    normalized.includes("member")
  ) {
    return "Ủy viên";
  }

  return String(role ?? "").trim() || "-";
};

const normalizeManualMemberRoleCode = (
  role: string | null | undefined,
  slotIndex?: number,
) => {
  const normalized = normalizeSearchText(role).replace(/[^a-z0-9]+/g, " ");

  if (
    slotIndex === 0 ||
    normalized === "ct" ||
    normalized.includes("chu tich")
  ) {
    return "CT";
  }

  if (slotIndex === 1 || normalized === "tk" || normalized.includes("thu ky")) {
    return "TK";
  }

  if (normalized.startsWith("pb") || normalized.includes("phan bien")) {
    return "PB";
  }

  if (
    normalized.startsWith("uv") ||
    normalized.includes("uy vien") ||
    normalized.includes("member")
  ) {
    return "UV";
  }

  return slotIndex !== undefined && slotIndex >= FIXED_MANUAL_MEMBER_SLOT_COUNT
    ? "UV"
    : String(role ?? "").trim();
};

const getManualMemberSlotRoleLabel = (
  slotIndex: number,
  role: string | null | undefined,
) =>
  slotIndex === 0
    ? "Chủ tịch"
    : slotIndex === 1
      ? "Thư ký"
      : getManualMemberRoleLabel(role);

const getManualMemberRoleSelectOptions = (
  slotIndex: number,
  currentRole: string,
) => {
  if (slotIndex < FIXED_MANUAL_MEMBER_SLOT_COUNT) {
    return [];
  }

  const normalizedRole = normalizeManualMemberRoleCode(currentRole, slotIndex);
  const currentOption = MANUAL_MEMBER_ROLE_SELECT_OPTIONS.find(
    (option) => option.value === normalizedRole,
  );

  return currentOption
    ? MANUAL_MEMBER_ROLE_SELECT_OPTIONS
    : [
        {
          value: normalizedRole,
          label: getManualMemberRoleLabel(normalizedRole),
        },
        ...MANUAL_MEMBER_ROLE_SELECT_OPTIONS,
      ];
};

const normalizeRoomCodeList = (values: Array<string | null | undefined>) =>
  Array.from(
    new Set(
      values
        .map((value) => normalizeRoomCode(value))
        .filter((value) => value.length > 0),
    ),
  );

const normalizeDefenseDateOnly = (value: string | null | undefined) => {
  const text = String(value ?? "").trim();
  if (!text) {
    return "";
  }

  const rawDate = text.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    return rawDate;
  }

  return composeDateSelector(parseDateSelector(text));
};

const normalizeSessionCode = (value: unknown): SessionCode => {
  const text = String(value ?? "")
    .trim()
    .toUpperCase();
  if (!text) {
    return "MORNING";
  }

  if (
    text === "AFTERNOON" ||
    text === "2" ||
    text.includes("CHIEU") ||
    text.includes("PM")
  ) {
    return "AFTERNOON";
  }

  return "MORNING";
};

const normalizeTimeOnly = (value: string | null | undefined) => {
  const text = String(value ?? "").trim();
  if (!text) {
    return "";
  }

  const normalized = text.slice(0, 5);
  if (/^\d{2}:\d{2}$/.test(normalized)) {
    return normalized;
  }

  return composeTimeSelector(parseTimeSelector(text));
};

const toPositiveInteger = (value: unknown) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0
    ? Math.floor(numericValue)
    : undefined;
};

const unwrapCompactPayload = (raw: unknown): unknown => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return raw;
  }

  const source = raw as Record<string, unknown>;
  const inner = pickCaseInsensitiveValue<unknown>(
    source,
    ["data", "Data"],
    undefined,
  );

  return inner !== undefined && inner !== null ? inner : raw;
};

const extractCompactRows = (
  raw: unknown,
  objectKeys: string[],
): Array<Record<string, unknown>> => {
  const payload = unwrapCompactPayload(raw);

  if (Array.isArray(payload)) {
    return payload.filter((item): item is Record<string, unknown> =>
      Boolean(item && typeof item === "object"),
    );
  }

  if (payload && typeof payload === "object") {
    const source = payload as Record<string, unknown>;
    for (const key of objectKeys) {
      const rows = pickCaseInsensitiveValue<unknown>(source, [key], undefined);
      if (Array.isArray(rows)) {
        return rows.filter((item): item is Record<string, unknown> =>
          Boolean(item && typeof item === "object"),
        );
      }
    }
  }

  return [];
};

const readBooleanLike = (value: unknown, fallback: boolean) => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no", "n"].includes(normalized)) {
      return false;
    }
  }
  return fallback;
};

const readStringList = (
  item: Record<string, unknown>,
  keys: string[],
): string[] => {
  const value = pickCaseInsensitiveValue<unknown>(item, keys, []);
  return Array.isArray(value)
    ? value.map((entry) => String(entry ?? "").trim()).filter(Boolean)
    : [];
};

const mergeStringLists = (...lists: Array<string[] | null | undefined>) =>
  Array.from(
    new Set(
      lists.reduce<string[]>((accumulator, list) => {
        if (!Array.isArray(list)) {
          return accumulator;
        }
        list.forEach((entry) => {
          const value = String(entry ?? "").trim();
          if (value) {
            accumulator.push(value);
          }
        });
        return accumulator;
      }, []),
    ),
  );

const mapStudentRecord = (item: Record<string, unknown>): EligibleStudent => {
  const tags = readStringList(item, [
    "topicTags",
    "TopicTags",
    "topicTagCodes",
    "TopicTagCodes",
    "tagCodes",
    "TagCodes",
    "tags",
    "Tags",
  ]);
  const studentTags = readStringList(item, [
    "studentTags",
    "StudentTags",
    "studentTagCodes",
    "StudentTagCodes",
  ]);
  const lecturerTags = readStringList(item, [
    "lecturerTags",
    "LecturerTags",
    "lecturerTagCodes",
    "LecturerTagCodes",
  ]);

  const topicCodeRaw = pickCaseInsensitiveValue<unknown>(
    item,
    ["topicCode", "TopicCode", "topicId", "TopicId"],
    undefined,
  );
  const topicCode =
    topicCodeRaw === undefined || topicCodeRaw === null
      ? undefined
      : String(topicCodeRaw).trim() || undefined;

  const errorRaw = pickCaseInsensitiveValue<unknown>(
    item,
    ["error", "Error"],
    undefined,
  );
  const error =
    errorRaw === undefined || errorRaw === null
      ? undefined
      : String(errorRaw).trim() || undefined;

  const statusRaw = pickCaseInsensitiveValue<unknown>(
    item,
    [
      "status",
      "Status",
      "topicStatus",
      "TopicStatus",
      "assignedStatus",
      "AssignedStatus",
    ],
    undefined,
  );
  const status =
    statusRaw === undefined || statusRaw === null
      ? undefined
      : String(statusRaw).trim() || undefined;

  return {
    studentCode: String(
      pickCaseInsensitiveValue(item, ["studentCode", "StudentCode"], ""),
    ).trim(),
    topicCode,
    studentName: String(
      pickCaseInsensitiveValue(item, ["studentName", "StudentName"], ""),
    ).trim(),
    topicTitle: String(
      pickCaseInsensitiveValue(
        item,
        ["topicTitle", "TopicTitle", "title", "Title"],
        "",
      ),
    ).trim(),
    supervisorCode: String(
      pickCaseInsensitiveValue(item, ["supervisorCode", "SupervisorCode"], ""),
    ).trim(),
    tags,
    studentTags,
    topicTags: tags,
    lecturerTags,
    status,
    isEligible: readBooleanLike(
      pickCaseInsensitiveValue(
        item,
        [
          "isEligible",
          "IsEligible",
          "isEligibleForDefense",
          "IsEligibleForDefense",
        ],
        true,
      ),
      true,
    ),
    valid: readBooleanLike(
      pickCaseInsensitiveValue(item, ["valid", "Valid"], true),
      true,
    ),
    error,
  };
};

const mapLecturerCapabilityRecord = (
  item: Record<string, unknown>,
): LecturerCapability => {
  const tagsValue = pickCaseInsensitiveValue<unknown>(
    item,
    ["tags", "Tags", "tagCodes", "TagCodes"],
    [],
  );
  const tags = Array.isArray(tagsValue)
    ? tagsValue.map((tag) => String(tag ?? "").trim()).filter(Boolean)
    : [];

  const warningsListRaw = pickCaseInsensitiveValue<unknown>(
    item,
    ["warnings", "Warnings"],
    [],
  );
  const warningsList = Array.isArray(warningsListRaw)
    ? warningsListRaw.map((entry) => String(entry ?? "").trim()).filter(Boolean)
    : [];

  const warningRaw = pickCaseInsensitiveValue<unknown>(
    item,
    ["warning", "Warning"],
    undefined,
  );

  const degree = String(
    pickCaseInsensitiveValue(
      item,
      ["degree", "Degree", "academicTitle", "AcademicTitle", "title", "Title"],
      "",
    ),
  ).trim();

  return {
    lecturerCode: String(
      pickCaseInsensitiveValue(item, ["lecturerCode", "LecturerCode"], ""),
    ).trim(),
    lecturerName: String(
      pickCaseInsensitiveValue(item, ["lecturerName", "LecturerName"], ""),
    ).trim(),
    degree: degree || undefined,
    tags,
    warning: (() => {
      if (warningsList.length > 0) {
        return warningsList.join(" | ");
      }
      if (warningRaw === undefined || warningRaw === null) {
        return undefined;
      }
      return String(warningRaw).trim() || undefined;
    })(),
  };
};

const mapTagCatalogRecord = (
  item: Record<string, unknown>,
): TagCatalogEntry | null => {
  const tagCode = String(
    pickCaseInsensitiveValue(
      item,
      ["tagCode", "TagCode", "code", "Code", "value", "Value"],
      "",
    ),
  ).trim();

  if (!tagCode) {
    return null;
  }

  const tagName = String(
    pickCaseInsensitiveValue(
      item,
      ["tagName", "TagName", "name", "Name", "label", "Label"],
      tagCode,
    ),
  ).trim();

  return {
    tagCode,
    tagName: tagName || tagCode,
  };
};

const mapLecturerDefenseRecord = (
  item: Record<string, unknown>,
): AutoGenerateLecturerDto => {
  const rawProfileId = Number(
    pickCaseInsensitiveValue(
      item,
      ["lecturerProfileId", "LecturerProfileId", "LecturerProfileID"],
      0,
    ),
  );
  const lecturerProfileId =
    Number.isFinite(rawProfileId) && rawProfileId > 0
      ? Math.floor(rawProfileId)
      : undefined;

  const lecturerCode = String(
    pickCaseInsensitiveValue(
      item,
      ["lecturerCode", "LecturerCode", "code", "Code"],
      "",
    ),
  ).trim();

  const lecturerName = String(
    pickCaseInsensitiveValue(
      item,
      ["lecturerName", "LecturerName", "fullName", "FullName", "name", "Name"],
      "",
    ),
  ).trim();

  const degree = String(
    pickCaseInsensitiveValue(item, ["degree", "Degree"], ""),
  ).trim();

  const guideQuotaRaw = Number(
    pickCaseInsensitiveValue(item, ["guideQuota", "GuideQuota"], 0),
  );
  const guideQuota = Number.isFinite(guideQuotaRaw) ? guideQuotaRaw : undefined;

  const currentGuidingCountRaw = Number(
    pickCaseInsensitiveValue(
      item,
      [
        "currentGuidingCount",
        "CurrentGuidingCount",
        "guidedTopicCount",
        "GuidedTopicCount",
      ],
      0,
    ),
  );
  const currentGuidingCount = Number.isFinite(currentGuidingCountRaw)
    ? currentGuidingCountRaw
    : undefined;

  const tags = mergeStringLists(
    readStringList(item, ["tagCodes", "TagCodes"]),
    readStringList(item, ["tags", "Tags"]),
  );

  return {
    lecturerId: lecturerProfileId ?? lecturerCode,
    lecturerProfileId,
    lecturerCode,
    lecturerName,
    degree,
    tagCodes: tags,
    availability: readBooleanLike(
      pickCaseInsensitiveValue(
        item,
        [
          "isInCapabilityPool",
          "IsInCapabilityPool",
          "availability",
          "Availability",
        ],
        true,
      ),
      true,
    ),
    guideQuota,
    currentGuidingCount,
  };
};

const mapTopicRecordToAutoTopic = (
  item: Record<string, unknown>,
): AutoGenerateTopicDto => {
  const tagsValue = pickCaseInsensitiveValue<unknown>(
    item,
    ["tags", "Tags", "tagCodes", "TagCodes"],
    [],
  );

  return {
    topicId: pickCaseInsensitiveValue<unknown>(
      item,
      ["topicId", "TopicId", "topicCode", "TopicCode"],
      undefined,
    ) as number | string | undefined,
    topicCode: String(
      pickCaseInsensitiveValue(
        item,
        ["topicCode", "TopicCode", "topicId", "TopicId"],
        "",
      ),
    ).trim(),
    title: String(
      pickCaseInsensitiveValue(
        item,
        ["topicTitle", "TopicTitle", "title", "Title"],
        "",
      ),
    ).trim(),
    tagCodes: Array.isArray(tagsValue)
      ? tagsValue.map((entry) => String(entry ?? "").trim()).filter(Boolean)
      : [],
    studentCode: String(
      pickCaseInsensitiveValue(item, ["studentCode", "StudentCode"], ""),
    ).trim(),
    supervisorCode: String(
      pickCaseInsensitiveValue(item, ["supervisorCode", "SupervisorCode"], ""),
    ).trim(),
  };
};

const CommitteeManagement: React.FC = () => {
  const { addToast } = useToast();
  const councilCenterRef = useRef<HTMLDivElement | null>(null);
  const [searchParams] = useSearchParams();
  const queryPeriodId = normalizeDefensePeriodId(searchParams.get("periodId"));
  const [defensePeriodId, setDefensePeriodId] = useState<number | null>(
    () => queryPeriodId ?? getActiveDefensePeriodId(),
  );

  const [students, setStudents] = useState<EligibleStudent[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "success" | "timeout">(
    "idle",
  );

  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [roomCatalog, setRoomCatalog] = useState<string[]>([]);
  const [tagCatalog, setTagCatalog] = useState<string[]>([]);
  const [tagNameByCode, setTagNameByCode] = useState<Record<string, string>>(
    {},
  );
  const [morningStart, setMorningStart] = useState("08:00");
  const [morningEnd, setMorningEnd] = useState("11:30");
  const [afternoonStart, setAfternoonStart] = useState("13:30");
  const [afternoonEnd, setAfternoonEnd] = useState("17:00");
  const [autoStartDate, setAutoStartDate] = useState("2026-04-22");
  const [autoEndDate, setAutoEndDate] = useState("2026-04-24");
  const [maxCapacity, setMaxCapacity] = useState(4);
  const [configSaved, setConfigSaved] = useState(false);
  const [councilConfigConfirmed, setCouncilConfigConfirmed] = useState(false);
  const [topicsPerSessionConfig, setTopicsPerSessionConfig] = useState(4);
  const [membersPerCouncilConfig, setMembersPerCouncilConfig] = useState(4);
  const [configCouncilTags, setConfigCouncilTags] = useState<string[]>([]);

  const [capabilitiesLocked, setCapabilitiesLocked] = useState(false);

  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [drafts, setDrafts] = useState<CouncilDraft[]>([]);
  const [showAutoGenerateModal, setShowAutoGenerateModal] = useState(false);
  const [showEligibleTopicsModal, setShowEligibleTopicsModal] = useState(false);
  const [autoGenerateStep, setAutoGenerateStep] = useState<1 | 2>(1);
  const [loadingAutoGenerateConfig, setLoadingAutoGenerateConfig] =
    useState(false);
  const [availableAutoRooms, setAvailableAutoRooms] = useState<string[]>([]);
  const [availableAutoTopics, setAvailableAutoTopics] = useState<
    AutoGenerateTopicDto[]
  >([]);
  const [availableAutoLecturers, setAvailableAutoLecturers] = useState<
    AutoGenerateLecturerDto[]
  >([]);
  const [selectedAutoRooms, setSelectedAutoRooms] = useState<string[]>([]);
  const [selectedAutoTopicIds, setSelectedAutoTopicIds] = useState<
    Array<number | string>
  >([]);
  const [selectedAutoLecturerIds, setSelectedAutoLecturerIds] = useState<
    Array<number | string>
  >([]);
  const [autoGenerateModalAlert, setAutoGenerateModalAlert] =
    useState<ModalAlert | null>(null);
  const [topicSearchKeyword, setTopicSearchKeyword] = useState("");
  const [lecturerSourceFilter, setLecturerSourceFilter] = useState<
    "all" | "committee" | "supervisor"
  >("all");
  const [lecturerSearchKeyword, setLecturerSearchKeyword] = useState("");
  const [autoGroupByTag, setAutoGroupByTag] = useState(true);
  const [autoPrioritizeMatchTag, setAutoPrioritizeMatchTag] = useState(true);
  const [searchCouncil, setSearchCouncil] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [roomFilter, setRoomFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [councilPage, setCouncilPage] = useState(1);
  const [selectedCouncilId, setSelectedCouncilId] = useState<string>("");
  const [manualMode, setManualMode] = useState<"create" | "edit" | null>(null);
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1);
  const [manualId, setManualId] = useState("HD-2026-04");
  const [manualName, setManualName] = useState("Hội đồng mới");
  const [manualDefenseDate, setManualDefenseDate] = useState("2026-04-24");
  const [manualRoom, setManualRoom] = useState("");
  const [manualScheduleMode, setManualScheduleMode] =
    useState<CouncilScheduleMode>("FULL_DAY");
  const [manualSessionCode, setManualSessionCode] =
    useState<SessionCode>("MORNING");
  const [manualStartTime, setManualStartTime] = useState(morningStart);
  const [manualEndTime, setManualEndTime] = useState(afternoonEnd);
  const [manualCouncilTags, setManualCouncilTags] = useState<string[]>([]);
  const [manualMorningStudents, setManualMorningStudents] = useState<string[]>(
    [],
  );
  const [manualAfternoonStudents, setManualAfternoonStudents] = useState<
    string[]
  >([]);
  const [manualRelatedStudents, setManualRelatedStudents] = useState<string[]>(
    [],
  );
  const [manualUnrelatedStudents, setManualUnrelatedStudents] = useState<
    string[]
  >([]);
  const [manualAssignments, setManualAssignments] = useState<
    CouncilAssignment[]
  >([]);
  const [manualMembers, setManualMembers] = useState<CouncilMember[]>(() =>
    buildDefaultManualMembers(FIXED_MEMBERS_PER_COUNCIL),
  );
  const [manualSnapshot, setManualSnapshot] = useState<{
    id: string;
    councilId?: number;
    name: string;
    concurrencyToken?: string;
    defenseDate: string;
    room: string;
    scheduleMode: CouncilScheduleMode;
    sessionCode: SessionCode;
    startTime: string;
    endTime: string;
    tags: string[];
    morning: string[];
    afternoon: string[];
    assignments: CouncilAssignment[];
    members: CouncilMember[];
  } | null>(null);
  const [manualReadOnly, setManualReadOnly] = useState(false);

  const notifyError = useCallback(
    (message: string) => addToast(message, "error"),
    [addToast],
  );
  const notifySuccess = useCallback(
    (message: string) => addToast(message, "success"),
    [addToast],
  );
  const notifyWarning = useCallback(
    (message: string) => addToast(message, "warning"),
    [addToast],
  );
  const notifyInfo = useCallback(
    (message: string) => addToast(message, "info"),
    [addToast],
  );

  const [allowFinalizeAfterWarning, setAllowFinalizeAfterWarning] =
    useState(false);

  const [isFinalized, setIsFinalized] = useState(false);
  const [backendAllowedActions, setBackendAllowedActions] = useState<string[]>(
    [],
  );
  const [stateHydrated, setStateHydrated] = useState(false);
  const [, setReadinessReady] = useState(true);
  const [, setReadinessNote] = useState<string>("");
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);
  const [, setApiSignal] = useState<{
    at: string;
    traceId?: string;
    concurrencyToken?: string;
    idempotencyReplay?: boolean;
    message?: string;
  } | null>(null);
  const [lecturerCapabilities, setLecturerCapabilities] = useState<
    LecturerCapability[]
  >([]);
  const selectedRoomsRef = useRef(selectedRooms);
  const autoStartDateRef = useRef(autoStartDate);
  const missingEndpointWarningsRef = useRef(new Set<string>());
  const missingPeriodWarningsRef = useRef(false);

  useEffect(() => {
    selectedRoomsRef.current = selectedRooms;
  }, [selectedRooms]);

  useEffect(() => {
    autoStartDateRef.current = autoStartDate;
  }, [autoStartDate]);

  useEffect(() => {
    if (queryPeriodId && queryPeriodId !== defensePeriodId) {
      setDefensePeriodId(queryPeriodId);
    }
  }, [defensePeriodId, queryPeriodId]);

  useEffect(() => {
    setActiveDefensePeriodId(defensePeriodId);
  }, [defensePeriodId]);

  useEffect(() => {
    if (defensePeriodId != null) {
      return;
    }

    let cancelled = false;

    const resolvePeriod = async () => {
      try {
        const response = await fetchData<ApiResponse<unknown>>(
          "/defense-periods",
          {
            method: "GET",
          },
        );
        const payload = readEnvelopeData<unknown>(response);
        const fallbackPeriodId = extractDefensePeriodId(payload);
        if (!cancelled && fallbackPeriodId != null) {
          setDefensePeriodId(fallbackPeriodId);
          setActiveDefensePeriodId(fallbackPeriodId);
        }
      } catch {
        // Ignore fallback resolution errors and keep UI in explicit warning state.
      }
    };

    void resolvePeriod();

    return () => {
      cancelled = true;
    };
  }, [defensePeriodId]);

  const defensePeriodBase = defensePeriodId
    ? `/defense-periods/${defensePeriodId}`
    : "";
  const makeIdempotencyKey = (prefix: string) =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
  const adminApi = useMemo(() => {
    const pickSection = pickCaseInsensitiveValue;

    const normalizeText = (value: unknown) => {
      if (typeof value === "string" || typeof value === "number") {
        return String(value).trim();
      }
      return "";
    };

    const unwrapListPayload = (payload: unknown): unknown[] => {
      if (Array.isArray(payload)) {
        return payload;
      }
      if (!payload || typeof payload !== "object") {
        return [];
      }
      const source = payload as Record<string, unknown>;
      const candidates = [
        source.items,
        source.Items,
        source.records,
        source.Records,
        source.result,
        source.Result,
        source.list,
        source.List,
        source.data,
        source.Data,
      ];
      const rows = candidates.find((candidate) => Array.isArray(candidate));
      if (Array.isArray(rows)) {
        return rows;
      }
      return [source];
    };

    const extractCodeList = (payload: unknown, keys: string[]) => {
      const values = new Set<string>();
      unwrapListPayload(payload).forEach((item) => {
        const primitive = normalizeText(item);
        if (primitive) {
          values.add(primitive);
          return;
        }
        if (!item || typeof item !== "object") {
          return;
        }
        const source = item as Record<string, unknown>;
        const lowered = new Map(
          Object.entries(source).map(([key, value]) => [
            key.toLowerCase(),
            value,
          ]),
        );
        for (const key of keys) {
          const value = normalizeText(lowered.get(key.toLowerCase()));
          if (value) {
            values.add(value);
            break;
          }
        }
      });
      return Array.from(values).sort((a, b) => a.localeCompare(b, "vi"));
    };

    const fetchFirstAvailableList = async (paths: string[]) => {
      let notFoundError: FetchDataError | null = null;
      for (const path of paths) {
        try {
          return await fetchData<ApiResponse<unknown>>(path, { method: "GET" });
        } catch (error) {
          if (error instanceof FetchDataError && error.status === 404) {
            notFoundError = error;
            continue;
          }
          throw error;
        }
      }
      if (notFoundError) {
        throw notFoundError;
      }
      throw new Error(
        `Không tìm thấy endpoint khả dụng trong danh sách: ${paths.join(", ")}`,
      );
    };

    const getSetupSnapshot = async () => {
      try {
        return await fetchData<ApiResponse<Record<string, unknown>>>(
          `${defensePeriodBase}/setup/snapshot`,
          { method: "GET" },
        );
      } catch (error) {
        if (error instanceof FetchDataError && error.status === 404) {
          return fetchData<ApiResponse<Record<string, unknown>>>(
            `${defensePeriodBase}/management/snapshot`,
            { method: "GET" },
          );
        }
        throw error;
      }
    };

    const getParticipantsSnapshot = async (
      kind: "student" | "lecturer",
      view: "runtime" | "scope" = "runtime",
    ) => {
      try {
        const response = await fetchData<ApiResponse<unknown>>(
          `${defensePeriodBase}/participants?kind=${encodeURIComponent(kind)}&view=${encodeURIComponent(view)}`,
          { method: "GET" },
        );
        const raw = readEnvelopeData<unknown>(response);
        const payload = unwrapCompactPayload(raw);
        const payloadObject =
          payload && typeof payload === "object" && !Array.isArray(payload)
            ? (payload as Record<string, unknown>)
            : {};
        const action = pickSection<string>(
          payloadObject,
          ["action", "Action"],
          "",
        );
        const rows = extractCompactRows(payload, [
          "students",
          "Students",
          "lecturers",
          "Lecturers",
          "items",
          "Items",
        ]);
        return {
          response,
          action,
          data: payload,
          rows,
        };
      } catch (error) {
        if (error instanceof FetchDataError && error.status === 404) {
          return null;
        }
        throw error;
      }
    };

    const runLifecycleAction = (
      action: "SYNC" | "FINALIZE",
      payload?: Record<string, unknown>,
      idempotencyKey?: string,
    ) =>
      fetchData<ApiResponse<Record<string, unknown>>>(
        `${defensePeriodBase}/lifecycle`,
        {
          method: "POST",
          body: {
            action,
            ...(payload ?? {}),
            ...(idempotencyKey ? { idempotencyKey } : {}),
          },
          headers: idempotencyKey
            ? { "Idempotency-Key": idempotencyKey }
            : undefined,
        },
      );

    const runGenerate = (
      mode: "SIMULATE" | "GENERATE",
      payload?: Record<string, unknown>,
      idempotencyKey?: string,
    ) =>
      fetchData<ApiResponse<Record<string, unknown>>>(
        `${defensePeriodBase}/setup/generate`,
        {
          method: "POST",
          body: {
            mode,
            request: payload ?? {},
          },
          headers: idempotencyKey
            ? { "Idempotency-Key": idempotencyKey }
            : undefined,
        },
      );

    return {
      getSetupSnapshot,
      sync: (idempotencyKey?: string) =>
        runLifecycleAction(
          "SYNC",
          { retryOnFailure: true },
          idempotencyKey ?? makeIdempotencyKey("SYNC"),
        ),
      getStudents: async (eligible?: boolean) => {
        const response = await getSetupSnapshot();
        const setupRaw = readEnvelopeData<unknown>(response);
        const setupPayload = unwrapCompactPayload(setupRaw);
        const setupObject =
          setupPayload &&
          typeof setupPayload === "object" &&
          !Array.isArray(setupPayload)
            ? (setupPayload as Record<string, unknown>)
            : {};

        const studentsSource = pickSection<unknown>(
          setupObject,
          ["students", "Students"],
          setupPayload,
        );
        let normalizedRows = extractCompactRows(studentsSource, [
          "students",
          "Students",
          "items",
          "Items",
        ]);

        if (normalizedRows.length === 0) {
          try {
            const topicResponse = await fetchData<ApiResponse<unknown>>(
              `${defensePeriodBase}/topics?onlyEligible=false&onlyUnassigned=false&page=1&size=200`,
              { method: "GET" },
            );
            const topicRaw = readEnvelopeData<unknown>(topicResponse);
            const topicPayload = unwrapCompactPayload(topicRaw);
            const topicObject =
              topicPayload &&
              typeof topicPayload === "object" &&
              !Array.isArray(topicPayload)
                ? (topicPayload as Record<string, unknown>)
                : {};
            const topicData = pickSection<unknown>(
              topicObject,
              ["data", "Data"],
              topicPayload,
            );
            normalizedRows = extractCompactRows(topicData, ["items", "Items"]);
          } catch (error) {
            if (!(error instanceof FetchDataError && error.status === 404)) {
              throw error;
            }
          }
        }

        // Fallback for deep-filter flow only when setup snapshot does not provide rows.
        if (normalizedRows.length === 0) {
          const participantsSnapshot =
            (await getParticipantsSnapshot("student", "runtime")) ??
            (await getParticipantsSnapshot("student", "scope"));
          normalizedRows = participantsSnapshot?.rows ?? [];
        }

        const filteredRows =
          typeof eligible === "boolean"
            ? normalizedRows.filter(
                (item) => mapStudentRecord(item).isEligible === eligible,
              )
            : normalizedRows;
        return toCompatResponse(response, filteredRows);
      },
      getTopics: async (query?: {
        onlyEligible?: boolean;
        onlyUnassigned?: boolean;
        page?: number;
        size?: number;
      }) => {
        const params = new URLSearchParams({
          onlyEligible: String(query?.onlyEligible ?? false),
          onlyUnassigned: String(query?.onlyUnassigned ?? false),
          page: String(query?.page ?? 1),
          size: String(query?.size ?? 200),
        }).toString();

        const response = await fetchData<ApiResponse<unknown>>(
          `${defensePeriodBase}/topics?${params}`,
          { method: "GET" },
        );

        const raw = readEnvelopeData<unknown>(response);
        const payload = unwrapCompactPayload(raw);
        const payloadObject =
          payload && typeof payload === "object" && !Array.isArray(payload)
            ? (payload as Record<string, unknown>)
            : {};
        const dataNode = pickSection<unknown>(
          payloadObject,
          ["data", "Data"],
          payload,
        );
        const summary =
          dataNode && typeof dataNode === "object" && !Array.isArray(dataNode)
            ? (dataNode as Record<string, unknown>)
            : {};
        const items = extractCompactRows(summary, ["items", "Items"]);

        return toCompatResponse(response, {
          ...summary,
          items,
        });
      },
      getConfig: async () => {
        const response = await getSetupSnapshot();
        const snapshotRaw = readEnvelopeData<unknown>(response);
        const snapshot = unwrapCompactPayload(snapshotRaw);
        return toCompatResponse(
          response,
          pickSection<Record<string, unknown>>(
            snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)
              ? (snapshot as Record<string, unknown>)
              : {},
            ["config", "Config"],
            {},
          ),
        );
      },
      getState: async () => {
        const response = await getSetupSnapshot();
        const snapshotRaw = readEnvelopeData<unknown>(response);
        const snapshot = unwrapCompactPayload(snapshotRaw);
        return toCompatResponse(
          response,
          pickSection<Record<string, unknown>>(
            snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)
              ? (snapshot as Record<string, unknown>)
              : {},
            ["state", "State"],
            {},
          ),
        );
      },
      getRoomCatalog: async () => {
        const response = await fetchFirstAvailableList(["/rooms/get-list"]);
        const payload = readEnvelopeData<unknown>(response);
        const rooms = normalizeRoomCodeList(
          extractCodeList(payload, [
            "roomCode",
            "room",
            "roomName",
            "code",
            "name",
          ]),
        );
        return toCompatResponse(response, rooms);
      },
      getTagCatalog: async () => {
        const response = await fetchFirstAvailableList([
          "/Tags/list",
          "/Tags/get-list",
          "/tags/list",
        ]);
        const payload = readEnvelopeData<unknown>(response);
        const rows = unwrapListPayload(payload).filter(
          (item): item is Record<string, unknown> =>
            Boolean(item && typeof item === "object"),
        );

        const entries = rows
          .map((item) => mapTagCatalogRecord(item))
          .filter((item): item is TagCatalogEntry => Boolean(item));

        if (entries.length > 0) {
          return toCompatResponse(response, entries);
        }

        const fallback = extractCodeList(payload, [
          "tagCode",
          "code",
          "tagName",
          "name",
        ]).map((value) => ({ tagCode: value, tagName: value }));

        return toCompatResponse(response, fallback);
      },
      getLecturerDefenseList: async (query?: {
        defenseTermId?: number | null;
        source?: "all" | "committee" | "supervisor";
        keyword?: string;
        page?: number;
        pageSize?: number;
      }) => {
        const resolvedPeriodId =
          normalizeDefensePeriodId(query?.defenseTermId) ?? defensePeriodId;
        if (!resolvedPeriodId) {
          throw new Error("Thiếu defenseTermId để tải danh sách giảng viên.");
        }

        const params = new URLSearchParams({
          defenseTermId: String(resolvedPeriodId),
          source: query?.source ?? "all",
          keyword: query?.keyword?.trim() ?? "",
          page: String(query?.page ?? 1),
          pageSize: String(query?.pageSize ?? 200),
        });

        const response = await fetchData<ApiResponse<unknown>>(
          `/LecturerDefense/get-list?${params.toString()}`,
          { method: "GET" },
        );

        const payload = readEnvelopeData<unknown>(response);
        let rows = extractCompactRows(payload, [
          "items",
          "Items",
          "lecturers",
          "Lecturers",
          "records",
          "Records",
          "data",
          "Data",
        ]);

        if (rows.length === 0) {
          rows = unwrapListPayload(payload).filter(
            (item): item is Record<string, unknown> =>
              Boolean(item && typeof item === "object"),
          );
        }

        return toCompatResponse(response, rows);
      },
      createSelectedLecturers: (payload: {
        defenseTermId: number;
        lecturerProfileIds: number[];
      }) =>
        fetchData<ApiResponse<boolean>>(`/LecturerDefense/create-selected`, {
          method: "POST",
          body: {
            defenseTermId: payload.defenseTermId,
            lecturerProfileIds: payload.lecturerProfileIds,
          },
        }),
      getLecturerCapabilities: async () => {
        const response = await getSetupSnapshot();
        const setupRaw = readEnvelopeData<unknown>(response);
        const setupPayload = unwrapCompactPayload(setupRaw);
        const setupObject =
          setupPayload &&
          typeof setupPayload === "object" &&
          !Array.isArray(setupPayload)
            ? (setupPayload as Record<string, unknown>)
            : {};

        const lecturersSource = pickSection<unknown>(
          setupObject,
          [
            "lecturers",
            "Lecturers",
            "lecturerCapabilities",
            "LecturerCapabilities",
          ],
          setupPayload,
        );
        let rows = extractCompactRows(lecturersSource, [
          "lecturers",
          "Lecturers",
          "items",
          "Items",
        ]);

        // Fallback for deep-filter flow only when setup snapshot does not provide rows.
        if (rows.length === 0) {
          const participantsSnapshot =
            (await getParticipantsSnapshot("lecturer", "runtime")) ??
            (await getParticipantsSnapshot("lecturer", "scope"));
          rows = participantsSnapshot?.rows ?? [];
        }

        return toCompatResponse(response, rows);
      },
      updateConfig: (payload: {
        startDate: string;
        endDate: string;
        rooms: string[];
        morningStart: string;
        afternoonStart: string;
        softMaxCapacity: number;
      }) =>
        fetchData<ApiResponse<boolean>>(`${defensePeriodBase}/setup/config`, {
          method: "PUT",
          body: {
            config: payload,
          },
        }),
      lockCapabilities: () =>
        fetchData<ApiResponse<boolean>>(`${defensePeriodBase}/setup/config`, {
          method: "PUT",
          body: {
            lockLecturerCapabilities: true,
          },
        }),
      confirmCouncilConfig: (payload: {
        topicsPerSessionConfig: number;
        membersPerCouncilConfig: number;
        tags: string[];
      }) =>
        fetchData<ApiResponse<boolean>>(`${defensePeriodBase}/setup/config`, {
          method: "PUT",
          body: {
            councilConfig: payload,
          },
        }),
      autoGenerateCouncils: (
        payload: Record<string, unknown>,
        idempotencyKey?: string,
      ) =>
        runGenerate(
          "GENERATE",
          payload,
          idempotencyKey ?? makeIdempotencyKey("AUTOGEN"),
        ),
      simulateAutoGenerateCouncils: (
        payload: Record<string, unknown>,
        idempotencyKey?: string,
      ) =>
        runGenerate(
          "SIMULATE",
          payload,
          idempotencyKey ?? makeIdempotencyKey("AUTOGEN-SIM"),
        ),
      getAutoGenerateConfig: async () => {
        const response = await getSetupSnapshot();
        const snapshotRaw = readEnvelopeData<unknown>(response);
        const snapshot = unwrapCompactPayload(snapshotRaw);
        return toCompatResponse(
          response,
          pickSection<Record<string, unknown>>(
            snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)
              ? (snapshot as Record<string, unknown>)
              : {},
            ["autoGenerate", "AutoGenerate"],
            {},
          ),
        );
      },
      getCouncils: async (query?: Record<string, string | number>) => {
        const queryString = query
          ? new URLSearchParams(
              Object.entries(query).map(([key, value]) => [key, String(value)]),
            ).toString()
          : "";
        const response = await fetchData<
          ApiResponse<Record<string, unknown> | Array<Record<string, unknown>>>
        >(
          `${defensePeriodBase}/councils${queryString ? `?${queryString}` : ""}`,
          { method: "GET" },
        );
        const data = unwrapCompactPayload(
          readEnvelopeData<
            Record<string, unknown> | Array<Record<string, unknown>>
          >(response),
        );
        if (Array.isArray(data)) {
          return toCompatResponse(response, { items: data });
        }
        if (data && typeof data === "object") {
          const items = pickSection<Array<Record<string, unknown>>>(
            data as Record<string, unknown>,
            ["items", "Items"],
            [],
          );
          if (Array.isArray(items) && items.length > 0) {
            return toCompatResponse(response, {
              ...(data as Record<string, unknown>),
              items,
            });
          }
          return toCompatResponse(response, {
            items: [data as Record<string, unknown>],
          });
        }
        return toCompatResponse(response, {
          items: [] as Array<Record<string, unknown>>,
        });
      },
      getCouncilById: async (councilId: string) => {
        const response = await fetchData<
          ApiResponse<Record<string, unknown> | Array<Record<string, unknown>>>
        >(
          `${defensePeriodBase}/councils?councilId=${encodeURIComponent(councilId)}`,
          { method: "GET" },
        );
        const data = unwrapCompactPayload(
          readEnvelopeData<
            Record<string, unknown> | Array<Record<string, unknown>>
          >(response),
        );
        if (Array.isArray(data)) {
          return toCompatResponse(
            response,
            (data[0] ?? {}) as Record<string, unknown>,
          );
        }
        return toCompatResponse(
          response,
          (data ?? {}) as Record<string, unknown>,
        );
      },
      createCouncil: (payload: Record<string, unknown>) =>
        fetchData<ApiResponse<Record<string, unknown>>>(
          `${defensePeriodBase}/councils/upsert`,
          {
            method: "POST",
            body: {
              operation: "CREATE",
              data: payload,
            },
          },
        ),
      updateCouncil: (councilId: string, payload: Record<string, unknown>) =>
        fetchData<ApiResponse<Record<string, unknown>>>(
          `${defensePeriodBase}/councils/upsert`,
          {
            method: "POST",
            body: {
              operation: "UPDATE",
              councilId,
              data: payload,
            },
          },
        ),
      submitCouncilWorkflow: (body: Record<string, unknown>) =>
        fetchData<ApiResponse<Record<string, unknown>>>(
          `${defensePeriodBase}/councils/upsert`,
          {
            method: "POST",
            body,
          },
        ),
      deleteCouncil: (councilId: string, concurrencyToken?: string) =>
        fetchData<ApiResponse<boolean>>(
          `${defensePeriodBase}/councils/${encodeURIComponent(councilId)}${concurrencyToken ? `?concurrencyToken=${encodeURIComponent(concurrencyToken)}` : ""}`,
          {
            method: "DELETE",
          },
        ),
      addCouncilMember: (councilId: string, payload: Record<string, unknown>) =>
        fetchData<ApiResponse<Record<string, unknown>>>(
          `${defensePeriodBase}/councils/upsert`,
          {
            method: "POST",
            body: {
              councilId,
              operation: "ADD_MEMBER",
              memberAdd: payload,
            },
          },
        ),
      updateCouncilMember: (
        councilId: string,
        lecturerCode: string,
        payload: Record<string, unknown>,
      ) =>
        fetchData<ApiResponse<Record<string, unknown>>>(
          `${defensePeriodBase}/councils/upsert`,
          {
            method: "POST",
            body: {
              councilId,
              operation: "UPDATE_MEMBER",
              memberUpdate: {
                ...payload,
                lecturerCode,
              },
            },
          },
        ),
      removeCouncilMember: (
        councilId: string,
        lecturerCode: string,
        concurrencyToken: string,
      ) =>
        fetchData<ApiResponse<boolean>>(
          `${defensePeriodBase}/councils/upsert`,
          {
            method: "POST",
            body: {
              councilId,
              operation: "REMOVE_MEMBER",
              memberRemove: {
                lecturerCode,
                concurrencyToken,
              },
            },
          },
        ),
      addCouncilTopic: (councilId: string, payload: Record<string, unknown>) =>
        fetchData<ApiResponse<Record<string, unknown>>>(
          `${defensePeriodBase}/councils/upsert`,
          {
            method: "POST",
            body: {
              councilId,
              operation: "ADD_TOPIC",
              topicAdd: payload,
            },
          },
        ),
      updateCouncilTopic: (
        councilId: string,
        assignmentId: number,
        payload: Record<string, unknown>,
      ) =>
        fetchData<ApiResponse<Record<string, unknown>>>(
          `${defensePeriodBase}/councils/upsert`,
          {
            method: "POST",
            body: {
              councilId,
              operation: "UPDATE_TOPIC",
              topicUpdate: {
                ...payload,
                assignmentId,
              },
            },
          },
        ),
      removeCouncilTopic: (
        councilId: string,
        assignmentId: number,
        concurrencyToken: string,
      ) =>
        fetchData<ApiResponse<boolean>>(
          `${defensePeriodBase}/councils/upsert`,
          {
            method: "POST",
            body: {
              councilId,
              operation: "REMOVE_TOPIC",
              topicRemove: {
                assignmentId,
                concurrencyToken,
              },
            },
          },
        ),
      finalize: (allowFinalizeAfterWarning: boolean, idempotencyKey?: string) =>
        (async () => {
          const finalizeIdempotencyKey =
            idempotencyKey ?? makeIdempotencyKey("FINALIZE");
          const response = await runLifecycleAction(
            "FINALIZE",
            {
              finalize: {
                allowFinalizeAfterWarning,
                idempotencyKey: finalizeIdempotencyKey,
              },
            },
            finalizeIdempotencyKey,
          );
          const data = readEnvelopeData<unknown>(response);
          const value =
            typeof data === "boolean" ? data : readEnvelopeSuccess(response);
          return toCompatResponse(response, value);
        })(),
    };
  }, [defensePeriodBase, defensePeriodId]);
  const parseApiEnvelope = useCallback(
    <T,>(response: ApiResponse<T> | null | undefined) => {
      if (!response) {
        return { ok: false, data: null as T | null };
      }

      const message = readEnvelopeMessage(response);
      const allowedActions = readEnvelopeAllowedActions(response);
      const warningMessages = Array.from(
        new Set(
          readEnvelopeWarnings(response)
            .map((warning) => {
              const rawMessage = String(warning.message ?? "").trim();
              const rawCode = String(warning.code ?? "")
                .trim()
                .toUpperCase();
              if (!rawMessage) {
                return "";
              }

              // Do not spam toast for readiness soft warnings.
              if (
                rawCode.startsWith("UC2.READINESS.") ||
                rawMessage.toUpperCase().startsWith("UC2.READINESS.")
              ) {
                return "";
              }

              const translated = translateBackendMessage(rawMessage);
              return translated || rawMessage;
            })
            .filter((item): item is string => Boolean(item)),
        ),
      );
      const success = readEnvelopeSuccess(response);
      const errorMessages = readEnvelopeErrorMessages(response);

      setApiSignal({
        at: new Date().toLocaleTimeString("vi-VN"),
        traceId: response.traceId ?? response.TraceId,
        concurrencyToken: readEnvelopeConcurrencyToken(response) ?? undefined,
        idempotencyReplay: readEnvelopeIdempotencyReplay(response),
        message: message ?? undefined,
      });

      if (allowedActions.length > 0) {
        setBackendAllowedActions(allowedActions);
      }

      if (success && message) {
        notifyInfo(translateBackendMessage(message));
      }

      if (warningMessages.length) {
        notifyWarning(warningMessages.join(" | "));
      }

      if (!success) {
        const translatedMessage = message
          ? translateBackendMessage(message)
          : "";
        const messageGroup =
          errorMessages.length > 0
            ? errorMessages.join(" | ")
            : translatedMessage;
        if (messageGroup) {
          if (isNoDataMessage(messageGroup)) {
            notifyInfo("Chưa có dữ liệu để hiển thị.");
          } else {
            notifyError(messageGroup);
          }
        }
      }

      return { ok: success, data: readEnvelopeData<T>(response) };
    },
    [notifyError, notifyInfo, notifyWarning],
  );

  const extractApiErrorMessage = useCallback(
    (source: unknown, fallback: string) => {
      if (!source || typeof source !== "object") {
        return fallback;
      }

      const envelope = source as ApiResponse<unknown>;
      const rawMessage = readEnvelopeMessage(envelope) ?? "";
      const message = translateBackendMessage(String(rawMessage).trim());
      const errors = readEnvelopeErrorMessages(envelope);
      const warningMessages = readEnvelopeWarningMessages(envelope);

      const errorBagRaw =
        (source as Record<string, unknown>).errors ??
        (source as Record<string, unknown>).Errors;
      const errorBagMessages =
        errorBagRaw && typeof errorBagRaw === "object"
          ? Object.values(errorBagRaw as Record<string, unknown>).reduce<
              string[]
            >((accumulator, value) => {
              if (Array.isArray(value)) {
                value.forEach((entry) => {
                  const text = String(entry ?? "").trim();
                  if (text) {
                    accumulator.push(text);
                  }
                });
                return accumulator;
              }
              const text = String(value ?? "").trim();
              if (text) {
                accumulator.push(text);
              }
              return accumulator;
            }, [])
          : [];

      const merged = Array.from(
        new Set(
          [...errors, ...warningMessages, ...errorBagMessages, message]
            .map((entry) => String(entry ?? "").trim())
            .filter(Boolean),
        ),
      );

      return merged.length > 0 ? merged.join(" | ") : fallback;
    },
    [],
  );

  const showAutoGenerateModalError = useCallback(
    (message: string, showToast = true) => {
      setAutoGenerateModalAlert({ type: "error", message });
      if (showToast) {
        notifyError(message);
      }
    },
    [notifyError],
  );

  const closeAutoGenerateModal = useCallback(() => {
    setShowAutoGenerateModal(false);
    setAutoGenerateModalAlert(null);
  }, []);

  const hydrateReadinessState = (
    payload: Record<string, unknown> | null | undefined,
  ) => {
    const readinessPayload =
      payload?.readiness && typeof payload.readiness === "object"
        ? (payload.readiness as Record<string, unknown>)
        : null;

    const warnings = (
      (Array.isArray(payload?.warnings)
        ? payload.warnings
        : Array.isArray(readinessPayload?.warnings)
          ? readinessPayload.warnings
          : []) as Array<string | { message?: string }>
    )
      .map((item) =>
        typeof item === "string" ? item : String(item?.message ?? ""),
      )
      .filter(Boolean);

    const marker =
      readinessPayload?.status ??
      readinessPayload?.state ??
      payload?.readiness ??
      payload?.status ??
      payload?.result ??
      payload?.state;
    const explicitReady =
      (readinessPayload?.isReady as boolean | undefined) ??
      (payload?.isReady as boolean | undefined);
    const inferredReady =
      typeof explicitReady === "boolean"
        ? explicitReady
        : typeof marker === "string"
          ? ["READY", "PASS", "OK", "GREEN"].includes(marker.toUpperCase())
          : true;

    setReadinessReady(inferredReady);
    setReadinessNote(
      payload?.message
        ? String(payload.message)
        : readinessPayload?.message
          ? String(readinessPayload.message)
          : (warnings[0] ?? ""),
    );
  };

  const hasAllowedAction = (action: string) =>
    backendAllowedActions.length === 0 ||
    backendAllowedActions.includes(action);

  const logMissingEndpoint = useCallback((label: string, url: string) => {
    const cacheKey = `${label}:${url}`;
    if (missingEndpointWarningsRef.current.has(cacheKey)) {
      return;
    }

    missingEndpointWarningsRef.current.add(cacheKey);
    console.warn(`[CommitteeManagement] Missing optional endpoint: ${url}`);
  }, []);

  const loadOptionalResponse = useCallback(
    async <T,>(label: string, url: string, loader: () => Promise<T>) => {
      try {
        return await loader();
      } catch (error) {
        if (error instanceof FetchDataError && error.status === 404) {
          logMissingEndpoint(label, url);
          return null;
        }
        throw error;
      }
    },
    [logMissingEndpoint],
  );

  useEffect(() => {
    const hydrateFromBackend = async () => {
      if (!defensePeriodId) {
        setStateHydrated(true);
        if (!missingPeriodWarningsRef.current) {
          notifyWarning(
            "Chua chon dot bao ve. Vui long chon dot tai module Quan ly dot truoc khi thao tac.",
          );
          missingPeriodWarningsRef.current = true;
        }
        return;
      }

      missingPeriodWarningsRef.current = false;

      try {
        const [
          setupSnapshotRes,
          roomCatalogRes,
          tagCatalogRes,
          topicsRes,
          lecturerDefenseRes,
        ] = await Promise.all([
          loadOptionalResponse(
            "setup-snapshot",
            `${defensePeriodBase}/setup/snapshot`,
            () => adminApi.getSetupSnapshot(),
          ),
          loadOptionalResponse("room-catalog", "/rooms/get-list", () =>
            adminApi.getRoomCatalog(),
          ),
          loadOptionalResponse(
            "tag-catalog",
            "/Tags/list | /Tags/get-list | /tags/list",
            () => adminApi.getTagCatalog(),
          ),
          loadOptionalResponse(
            "topics",
            `${defensePeriodBase}/topics?onlyEligible=false&onlyUnassigned=false&page=1&size=200`,
            () =>
              adminApi.getTopics({
                onlyEligible: false,
                onlyUnassigned: false,
                page: 1,
                size: 200,
              }),
          ),
          loadOptionalResponse(
            "lecturer-defense",
            `/LecturerDefense/get-list?defenseTermId=${defensePeriodId}&source=all&page=1&pageSize=200`,
            () =>
              adminApi.getLecturerDefenseList({
                defenseTermId: defensePeriodId,
                source: "all",
                keyword: "",
                page: 1,
                pageSize: 200,
              }),
          ),
        ]);

        const setupParsed =
          setupSnapshotRes != null ? parseApiEnvelope(setupSnapshotRes) : null;

        const setupRaw = (setupParsed?.data ?? null) as unknown;
        const setupPayload = unwrapCompactPayload(setupRaw);
        const setupObject =
          setupPayload &&
          typeof setupPayload === "object" &&
          !Array.isArray(setupPayload)
            ? (setupPayload as Record<string, unknown>)
            : {};

        const stateData = pickCaseInsensitiveValue<Record<string, unknown>>(
          setupObject,
          ["state", "State"],
          {},
        );
        const configData = pickCaseInsensitiveValue<Record<string, unknown>>(
          setupObject,
          ["config", "Config"],
          {},
        );

        const studentsSource = pickCaseInsensitiveValue<unknown>(
          setupObject,
          ["students", "Students"],
          [],
        );
        const studentsData = extractCompactRows(studentsSource, [
          "students",
          "Students",
          "items",
          "Items",
        ]);

        const topicsParsed =
          topicsRes != null ? parseApiEnvelope(topicsRes) : null;
        const topicsData = extractCompactRows(
          (topicsParsed?.data ?? {}) as Record<string, unknown>,
          ["items", "Items", "topics", "Topics"],
        );

        const lecturersSource = pickCaseInsensitiveValue<unknown>(
          setupObject,
          [
            "lecturers",
            "Lecturers",
            "lecturerCapabilities",
            "LecturerCapabilities",
          ],
          [],
        );
        const capabilityData = extractCompactRows(lecturersSource, [
          "lecturers",
          "Lecturers",
          "items",
          "Items",
        ]);

        const councilsSource = pickCaseInsensitiveValue<unknown>(
          setupObject,
          ["councils", "Councils"],
          [],
        );
        const councilsData = {
          items: extractCompactRows(councilsSource, ["items", "Items"]),
        };

        const roomCatalogData = Array.isArray(roomCatalogRes?.data)
          ? normalizeRoomCodeList(
              roomCatalogRes.data.filter(
                (room): room is string =>
                  typeof room === "string" && room.trim().length > 0,
              ),
            )
          : [];
        const tagCatalogEntries = Array.isArray(tagCatalogRes?.data)
          ? tagCatalogRes.data
              .map((entry) => {
                if (entry && typeof entry === "object") {
                  return mapTagCatalogRecord(entry as Record<string, unknown>);
                }
                return null;
              })
              .filter((entry): entry is TagCatalogEntry => Boolean(entry))
          : [];

        const tagCatalogData = Array.from(
          new Set(
            tagCatalogEntries
              .map((entry) => String(entry.tagCode ?? "").trim())
              .filter(Boolean),
          ),
        ).sort((a, b) => a.localeCompare(b, "vi"));

        const nextTagNameByCode = tagCatalogEntries.reduce<
          Record<string, string>
        >((accumulator, entry) => {
          const normalizedCode = normalizeTagCode(entry.tagCode);
          if (!normalizedCode) {
            return accumulator;
          }
          accumulator[normalizedCode] =
            String(entry.tagName ?? entry.tagCode ?? "").trim() ||
            String(entry.tagCode ?? "").trim();
          return accumulator;
        }, {});

        if (Object.keys(nextTagNameByCode).length === 0) {
          tagCatalogData.forEach((tagCode) => {
            const normalizedCode = normalizeTagCode(tagCode);
            if (normalizedCode) {
              nextTagNameByCode[normalizedCode] = tagCode;
            }
          });
        }

        const lecturerDefenseParsed =
          lecturerDefenseRes != null
            ? parseApiEnvelope(lecturerDefenseRes)
            : null;
        const lecturerDefenseData = lecturerDefenseParsed?.ok
          ? ((lecturerDefenseParsed.data ?? []) as Array<
              Record<string, unknown>
            >)
          : [];
        const mappedLecturerDefense = lecturerDefenseData
          .map((item) => mapLecturerDefenseRecord(item))
          .filter(
            (item) =>
              Boolean(item.lecturerCode) ||
              Number.isFinite(Number(item.lecturerProfileId ?? 0)),
          );

        setRoomCatalog(roomCatalogData);
        setTagCatalog(tagCatalogData);
        setTagNameByCode(nextTagNameByCode);

        if (roomCatalogData.length > 0) {
          setAvailableAutoRooms((prev) =>
            prev.length > 0 ? normalizeRoomCodeList(prev) : roomCatalogData,
          );
        }

        const mappedStudents = (
          studentsData.length > 0 ? studentsData : topicsData
        )
          .map((item) => mapStudentRecord(item))
          .filter((item) => item.studentCode.length > 0);
        setStudents(mappedStudents);

        const autoTopicsFromEndpoint = topicsData
          .map((item) => mapTopicRecordToAutoTopic(item))
          .filter((topic) => Boolean(topic.topicCode || topic.topicId));
        if (autoTopicsFromEndpoint.length > 0) {
          setAvailableAutoTopics(autoTopicsFromEndpoint);
          setSelectedAutoTopicIds((prev) =>
            prev.length > 0
              ? prev
              : autoTopicsFromEndpoint
                  .map((topic) => topic.topicId ?? topic.topicCode ?? "")
                  .slice(0, 12),
          );
        }

        const degreeByLecturerCode = new Map(
          mappedLecturerDefense
            .map(
              (lecturer) =>
                [
                  String(lecturer.lecturerCode ?? "").trim(),
                  String(lecturer.degree ?? "").trim(),
                ] as const,
            )
            .filter(([code]) => code.length > 0),
        );

        const mappedCapabilities = capabilityData
          .map((item) => mapLecturerCapabilityRecord(item))
          .filter((item) => item.lecturerCode.length > 0)
          .map((item) => {
            if (String(item.degree ?? "").trim().length > 0) {
              return item;
            }
            const fallbackDegree =
              degreeByLecturerCode.get(item.lecturerCode) ?? "";
            return fallbackDegree ? { ...item, degree: fallbackDegree } : item;
          });
        setLecturerCapabilities(mappedCapabilities);

        const fallbackAutoLecturers: AutoGenerateLecturerDto[] =
          mappedCapabilities.map((lecturer) => ({
            lecturerId: lecturer.lecturerCode,
            lecturerCode: lecturer.lecturerCode,
            lecturerName: lecturer.lecturerName,
            degree: lecturer.degree ?? "",
            tagCodes: lecturer.tags,
            availability: true,
            guideQuota: undefined,
            currentGuidingCount: undefined,
          }));

        const autoLecturers =
          mappedLecturerDefense.length > 0
            ? mappedLecturerDefense
            : fallbackAutoLecturers;

        setAvailableAutoLecturers(autoLecturers);
        setSelectedAutoLecturerIds((prev) => {
          const defaultIds = autoLecturers
            .map(
              (lecturer) =>
                lecturer.lecturerProfileId ??
                lecturer.lecturerId ??
                lecturer.lecturerCode ??
                "",
            )
            .filter(
              (id): id is number | string =>
                id !== "" && id !== null && id !== undefined,
            );

          if (defaultIds.length === 0) {
            return [];
          }

          if (prev.length > 0) {
            const prevSet = new Set(prev.map((id) => String(id)));
            const kept = defaultIds.filter((id) => prevSet.has(String(id)));
            if (kept.length > 0) {
              return kept;
            }
          }

          return defaultIds;
        });

        const allowedActionsRaw = pickCaseInsensitiveValue<unknown>(
          stateData,
          ["allowedActions", "AllowedActions"],
          [],
        );
        const normalizedAllowedActions = Array.isArray(allowedActionsRaw)
          ? allowedActionsRaw
              .map((item) => String(item ?? "").trim())
              .filter(Boolean)
          : [];
        if (normalizedAllowedActions.length > 0) {
          setBackendAllowedActions(normalizedAllowedActions);
        }

        setCapabilitiesLocked(
          Boolean(
            pickCaseInsensitiveValue(
              stateData,
              ["lecturerCapabilitiesLocked", "LecturerCapabilitiesLocked"],
              false,
            ),
          ),
        );
        setCouncilConfigConfirmed(
          Boolean(
            pickCaseInsensitiveValue(
              stateData,
              ["councilConfigConfirmed", "CouncilConfigConfirmed"],
              false,
            ),
          ),
        );
        setIsFinalized(
          Boolean(
            pickCaseInsensitiveValue(
              stateData,
              ["finalized", "Finalized"],
              false,
            ),
          ),
        );

        hydrateReadinessState(stateData);

        if (Object.keys(configData).length > 0) {
          const configuredRoomsRaw = pickCaseInsensitiveValue<unknown>(
            configData,
            ["rooms", "Rooms"],
            [],
          );
          const configuredRooms = normalizeRoomCodeList(
            Array.isArray(configuredRoomsRaw)
              ? configuredRoomsRaw
                  .map((room) => String(room ?? "").trim())
                  .filter(Boolean)
              : [],
          );
          const configuredStartDate = normalizeDefenseDateOnly(
            String(
              pickCaseInsensitiveValue(
                configData,
                ["startDate", "StartDate"],
                "",
              ),
            ),
          );
          const configuredEndDate = normalizeDefenseDateOnly(
            String(
              pickCaseInsensitiveValue(configData, ["endDate", "EndDate"], ""),
            ),
          );
          setSelectedRooms(
            configuredRooms.length
              ? configuredRooms
              : roomCatalogData.slice(0, 2),
          );
          if (configuredStartDate) {
            setAutoStartDate(configuredStartDate);
          }
          if (configuredEndDate) {
            setAutoEndDate(configuredEndDate);
          }
          setMorningStart(
            String(
              pickCaseInsensitiveValue(
                configData,
                ["morningStart", "MorningStart"],
                "08:00",
              ),
            ),
          );
          setAfternoonStart(
            String(
              pickCaseInsensitiveValue(
                configData,
                ["afternoonStart", "AfternoonStart"],
                "13:30",
              ),
            ),
          );
          setMaxCapacity(
            Number(
              pickCaseInsensitiveValue(
                configData,
                ["softMaxCapacity", "SoftMaxCapacity"],
                4,
              ),
            ),
          );
          setTopicsPerSessionConfig(
            Number(
              pickCaseInsensitiveValue(
                configData,
                ["topicsPerSessionConfig", "TopicsPerSessionConfig"],
                4,
              ),
            ),
          );
          setMembersPerCouncilConfig(
            Number(
              pickCaseInsensitiveValue(
                configData,
                ["membersPerCouncilConfig", "MembersPerCouncilConfig"],
                4,
              ),
            ),
          );
          const configTagsRaw = pickCaseInsensitiveValue<unknown>(
            configData,
            ["tags", "Tags"],
            [],
          );
          setConfigCouncilTags(
            Array.isArray(configTagsRaw)
              ? configTagsRaw
                  .map((item) => String(item ?? "").trim())
                  .filter(Boolean)
              : [],
          );
          setConfigSaved(true);
        } else if (roomCatalogData.length > 0) {
          setSelectedRooms((prev) =>
            prev.length > 0 ? prev : roomCatalogData.slice(0, 2),
          );
        }

        const rawItems = (councilsData?.items ?? []) as Array<
          Record<string, unknown>
        >;

        const extractStudentCodes = (value: unknown) => {
          if (!Array.isArray(value)) {
            return [] as string[];
          }
          return value
            .map((entry) => {
              if (typeof entry === "string" || typeof entry === "number") {
                return String(entry).trim();
              }
              if (entry && typeof entry === "object") {
                return String(
                  pickCaseInsensitiveValue(
                    entry as Record<string, unknown>,
                    ["studentCode", "StudentCode"],
                    "",
                  ),
                ).trim();
              }
              return "";
            })
            .filter(Boolean);
        };

        if (rawItems.length > 0) {
          const mapped: CouncilDraft[] = rawItems.map((item, index) => {
            const councilCode =
              String(
                pickCaseInsensitiveValue(
                  item,
                  ["committeeCode", "CommitteeCode"],
                  `HD-${String(index + 1).padStart(2, "0")}`,
                ),
              ).trim() || `HD-${String(index + 1).padStart(2, "0")}`;

            const assignmentRows = (
              Array.isArray(
                pickCaseInsensitiveValue(
                  item,
                  ["assignments", "Assignments"],
                  [],
                ),
              )
                ? (pickCaseInsensitiveValue(
                    item,
                    ["assignments", "Assignments"],
                    [],
                  ) as Array<Record<string, unknown>>)
                : []
            )
              .map((assignment, assignmentIndex) => {
                const sessionCode = normalizeSessionCode(
                  pickCaseInsensitiveValue(
                    assignment,
                    ["sessionCode", "SessionCode", "session", "Session"],
                    "MORNING",
                  ),
                );
                const studentCode = String(
                  pickCaseInsensitiveValue(
                    assignment,
                    ["studentCode", "StudentCode"],
                    "",
                  ),
                ).trim();
                return {
                  assignmentId:
                    Number(
                      pickCaseInsensitiveValue(
                        assignment,
                        ["assignmentId", "AssignmentId"],
                        0,
                      ),
                    ) || undefined,
                  studentCode,
                  topicCode: pickCaseInsensitiveValue(
                    assignment,
                    ["topicCode", "TopicCode"],
                    "",
                  )
                    ? String(
                        pickCaseInsensitiveValue(
                          assignment,
                          ["topicCode", "TopicCode"],
                          "",
                        ),
                      )
                    : undefined,
                  sessionCode,
                  startTime:
                    normalizeTimeOnly(
                      String(
                        pickCaseInsensitiveValue(
                          assignment,
                          ["startTime", "StartTime"],
                          "",
                        ),
                      ),
                    ) || undefined,
                  endTime:
                    normalizeTimeOnly(
                      String(
                        pickCaseInsensitiveValue(
                          assignment,
                          ["endTime", "EndTime"],
                          "",
                        ),
                      ),
                    ) || undefined,
                  scheduledAt:
                    normalizeDefenseDateOnly(
                      String(
                        pickCaseInsensitiveValue(
                          assignment,
                          [
                            "scheduledAt",
                            "ScheduledAt",
                            "defenseDate",
                            "DefenseDate",
                          ],
                          "",
                        ),
                      ),
                    ) || undefined,
                  orderIndex:
                    Number(
                      pickCaseInsensitiveValue(
                        assignment,
                        ["orderIndex", "OrderIndex"],
                        0,
                      ),
                    ) || assignmentIndex + 1,
                };
              })
              .filter((assignment) => assignment.studentCode);

            const explicitMorning = extractStudentCodes(
              pickCaseInsensitiveValue(
                item,
                ["morningStudents", "MorningStudents"],
                [],
              ),
            );
            const explicitAfternoon = extractStudentCodes(
              pickCaseInsensitiveValue(
                item,
                ["afternoonStudents", "AfternoonStudents"],
                [],
              ),
            );
            const derivedMorning = assignmentRows
              .filter((assignment) => assignment.sessionCode === "MORNING")
              .map((assignment) => assignment.studentCode);
            const derivedAfternoon = assignmentRows
              .filter((assignment) => assignment.sessionCode === "AFTERNOON")
              .map((assignment) => assignment.studentCode);

            return {
              id: councilCode,
              councilId:
                Number(
                  pickCaseInsensitiveValue(
                    item,
                    [
                      "councilId",
                      "CouncilId",
                      "committeeId",
                      "CommitteeId",
                      "id",
                      "Id",
                    ],
                    0,
                  ),
                ) || undefined,
              name:
                String(
                  pickCaseInsensitiveValue(
                    item,
                    ["name", "Name", "councilName", "CouncilName"],
                    councilCode,
                  ),
                ).trim() || councilCode,
              concurrencyToken: pickCaseInsensitiveValue(
                item,
                ["concurrencyToken", "ConcurrencyToken"],
                "",
              )
                ? String(
                    pickCaseInsensitiveValue(
                      item,
                      ["concurrencyToken", "ConcurrencyToken"],
                      "",
                    ),
                  )
                : undefined,
              room: normalizeRoomCode(
                String(pickCaseInsensitiveValue(item, ["room", "Room"], "")) ||
                  selectedRoomsRef.current[0] ||
                  "",
              ),
              defenseDate: normalizeDefenseDateOnly(
                pickCaseInsensitiveValue(
                  item,
                  ["defenseDate", "DefenseDate"],
                  "",
                )
                  ? String(
                      pickCaseInsensitiveValue(
                        item,
                        ["defenseDate", "DefenseDate"],
                        "",
                      ),
                    ).slice(0, 10)
                  : autoStartDateRef.current,
              ),
              session: "Sang",
              slotId: `${councilCode}-FULLDAY`,
              councilTags: Array.isArray(
                pickCaseInsensitiveValue(
                  item,
                  ["councilTags", "CouncilTags"],
                  [],
                ),
              )
                ? (
                    pickCaseInsensitiveValue(
                      item,
                      ["councilTags", "CouncilTags"],
                      [],
                    ) as unknown[]
                  )
                    .map((tag) => String(tag ?? "").trim())
                    .filter(Boolean)
                : [],
              morningStudents:
                explicitMorning.length > 0 ? explicitMorning : derivedMorning,
              afternoonStudents:
                explicitAfternoon.length > 0
                  ? explicitAfternoon
                  : derivedAfternoon,
              assignments: assignmentRows,
              forbiddenLecturers: Array.isArray(
                pickCaseInsensitiveValue(
                  item,
                  ["forbiddenLecturers", "ForbiddenLecturers"],
                  [],
                ),
              )
                ? (
                    pickCaseInsensitiveValue(
                      item,
                      ["forbiddenLecturers", "ForbiddenLecturers"],
                      [],
                    ) as unknown[]
                  )
                    .map((entry) => String(entry ?? "").trim())
                    .filter(Boolean)
                : [],
              members: (Array.isArray(
                pickCaseInsensitiveValue(item, ["members", "Members"], []),
              )
                ? (pickCaseInsensitiveValue(
                    item,
                    ["members", "Members"],
                    [],
                  ) as Array<Record<string, unknown>>)
                : []
              ).map((m) => ({
                role: String(
                  pickCaseInsensitiveValue(m, ["role", "Role"], "UV"),
                ),
                lecturerCode: String(
                  pickCaseInsensitiveValue(
                    m,
                    ["lecturerCode", "LecturerCode"],
                    "",
                  ),
                ),
                lecturerName: String(
                  pickCaseInsensitiveValue(
                    m,
                    ["lecturerName", "LecturerName"],
                    "",
                  ),
                ),
              })),
              warning: pickCaseInsensitiveValue(
                item,
                ["warning", "Warning"],
                "",
              )
                ? String(
                    pickCaseInsensitiveValue(item, ["warning", "Warning"], ""),
                  )
                : undefined,
            };
          });
          setDrafts(mapped);
          setSelectedCouncilId(mapped[0]?.id ?? "");
        }
      } catch (error) {
        console.error("[CommitteeManagement] Backend hydration failed", error);
        notifyWarning(
          "Không tải được một số dữ liệu từ BE, hệ thống đang dùng dữ liệu màn hình hiện tại.",
        );
      } finally {
        setStateHydrated(true);
      }
    };

    void hydrateFromBackend();
  }, [
    adminApi,
    defensePeriodBase,
    defensePeriodId,
    loadOptionalResponse,
    notifyWarning,
    parseApiEnvelope,
  ]);

  const validRows = useMemo(
    () => students.filter((item: EligibleStudent) => item.valid),
    [students],
  );

  const yearSelectorOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = new Set<number>();
    for (let year = currentYear - 1; year <= currentYear + 5; year += 1) {
      years.add(year);
    }
    years.add(parseDateSelector(autoStartDate).year);
    years.add(parseDateSelector(autoEndDate).year);
    return Array.from(years).sort((a, b) => a - b);
  }, [autoStartDate, autoEndDate]);

  const getMinuteSelectorOptions = useCallback((timeValue: string) => {
    const minute = parseTimeSelector(timeValue).minute;
    if (BASE_MINUTE_SELECTOR_OPTIONS.includes(minute)) {
      return BASE_MINUTE_SELECTOR_OPTIONS;
    }
    return [...BASE_MINUTE_SELECTOR_OPTIONS, minute].sort(
      (a, b) => Number(a) - Number(b),
    );
  }, []);

  const updateTimeSelector = useCallback(
    (
      currentValue: string,
      key: keyof TimeSelectorParts,
      nextValue: string,
      setter: StringStateSetter,
      fixedMeridiem: "AM" | "PM",
    ) => {
      const current = parseTimeSelector(currentValue);
      const updated: TimeSelectorParts = {
        ...current,
        [key]: key === "meridiem" ? fixedMeridiem : toTwoDigits(nextValue),
      } as TimeSelectorParts;
      updated.meridiem = fixedMeridiem;
      setConfigSaved(false);
      setter(composeTimeSelector(updated));
    },
    [],
  );

  const updateDateSelector = useCallback(
    (
      currentValue: string,
      key: keyof DateSelectorParts,
      nextValue: number,
      setter: StringStateSetter,
    ) => {
      const current = parseDateSelector(currentValue);
      const updated: DateSelectorParts = {
        ...current,
        [key]: nextValue,
      } as DateSelectorParts;
      updated.day = Math.min(
        updated.day,
        getDaysInMonth(updated.year, updated.month),
      );
      setConfigSaved(false);
      setter(composeDateSelector(updated));
    },
    [],
  );

  const formatDateLabel = useCallback((value: string) => {
    const parts = parseDateSelector(value);
    return `${toTwoDigits(parts.day)}/${toTwoDigits(parts.month)}/${parts.year}`;
  }, []);

  const renderTimeSelector = (
    label: string,
    value: string,
    setter: StringStateSetter,
    fixedMeridiem: "AM" | "PM",
    afterChange?: (nextValue: string) => void,
  ) => {
    const parts = parseTimeSelector(value);
    const minuteOptions = getMinuteSelectorOptions(value).map((minute) => ({
      value: minute,
      label: minute,
    }));

    return (
      <label className="prepare-field">
        <span>{label}</span>
        <div className="prepare-composite-control">
          <InlinePicker
            value={parts.hour12}
            options={HOUR_SELECTOR_OPTIONS.map((hour) => ({
              value: hour,
              label: hour,
            }))}
            ariaLabel={`${label} - chọn giờ`}
            className="prepare-picker-compact"
            onChange={(nextValue) => {
              const updated = {
                ...parts,
                hour12: toTwoDigits(nextValue),
                meridiem: fixedMeridiem,
              } satisfies TimeSelectorParts;
              updateTimeSelector(
                value,
                "hour12",
                nextValue,
                setter,
                fixedMeridiem,
              );
              afterChange?.(composeTimeSelector(updated));
            }}
          />
          <span className="prepare-composite-separator">:</span>
          <InlinePicker
            value={parts.minute}
            options={minuteOptions}
            ariaLabel={`${label} - chọn phút`}
            className="prepare-picker-compact"
            onChange={(nextValue) => {
              const updated = {
                ...parts,
                minute: toTwoDigits(nextValue),
                meridiem: fixedMeridiem,
              } satisfies TimeSelectorParts;
              updateTimeSelector(
                value,
                "minute",
                nextValue,
                setter,
                fixedMeridiem,
              );
              afterChange?.(composeTimeSelector(updated));
            }}
          />
          <span className="prepare-fixed-badge">{fixedMeridiem}</span>
        </div>
      </label>
    );
  };

  const renderDateSelector = (
    label: string,
    value: string,
    setter: StringStateSetter,
  ) => {
    const parts = parseDateSelector(value);
    const dayOptions = Array.from(
      { length: getDaysInMonth(parts.year, parts.month) },
      (_, index) => index + 1,
    );

    return (
      <label className="prepare-field">
        <span>{label}</span>
        <div className="prepare-date-control">
          <InlinePicker
            value={parts.day}
            options={dayOptions.map((day) => ({
              value: day,
              label: toTwoDigits(day),
            }))}
            ariaLabel={`${label} - chọn ngày`}
            className="prepare-picker-compact"
            onChange={(nextValue) =>
              updateDateSelector(value, "day", Number(nextValue), setter)
            }
          />
          <InlinePicker
            value={parts.month}
            options={MONTH_SELECTOR_OPTIONS.map((month) => ({
              value: month.value,
              label: month.label,
            }))}
            ariaLabel={`${label} - chọn tháng`}
            className="prepare-picker-wide"
            onChange={(nextValue) =>
              updateDateSelector(value, "month", Number(nextValue), setter)
            }
          />
          <InlinePicker
            value={parts.year}
            options={yearSelectorOptions.map((year) => ({
              value: year,
              label: String(year),
            }))}
            ariaLabel={`${label} - chọn năm`}
            className="prepare-picker-year"
            onChange={(nextValue) =>
              updateDateSelector(value, "year", Number(nextValue), setter)
            }
          />
        </div>
        <div className="prepare-date-help">
          Định dạng: {formatDateLabel(value)}
        </div>
      </label>
    );
  };

  const allTags = useMemo(() => {
    const values = new Set<string>();
    tagCatalog.forEach((tag) => values.add(tag));
    students.forEach((item: EligibleStudent) =>
      item.tags.forEach((tag) => values.add(tag)),
    );
    lecturerCapabilities.forEach((item: LecturerCapability) =>
      item.tags.forEach((tag) => values.add(tag)),
    );
    drafts.forEach((item) =>
      item.councilTags.forEach((tag) => values.add(tag)),
    );
    configCouncilTags.forEach((tag) => values.add(tag));
    manualCouncilTags.forEach((tag) => values.add(tag));
    return Array.from(values)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "vi"));
  }, [
    tagCatalog,
    students,
    lecturerCapabilities,
    drafts,
    configCouncilTags,
    manualCouncilTags,
  ]);

  const eligibleStudents = useMemo(
    () => validRows.filter((item: EligibleStudent) => item.isEligible),
    [validRows],
  );

  const getTagDisplayName = useCallback(
    (tagCode: string) => {
      const rawTagCode = String(tagCode ?? "").trim();
      if (!rawTagCode) {
        return "";
      }
      const normalizedCode = normalizeTagCode(rawTagCode);
      return tagNameByCode[normalizedCode] ?? rawTagCode;
    },
    [tagNameByCode],
  );

  const getTagDisplayList = useCallback(
    (tags: string[]) =>
      Array.from(
        new Set(mergeStringLists(tags).map((tag) => getTagDisplayName(tag))),
      ),
    [getTagDisplayName],
  );

  const canCreateCouncils =
    councilConfigConfirmed &&
    capabilitiesLocked &&
    hasAllowedAction("GENERATE_COUNCILS");

  const councilRows = useMemo(
    () =>
      drafts.map((item): CouncilRow => {
        const memberCount = item.members.filter(
          (member) => member.lecturerCode,
        ).length;
        const hasWarning =
          Boolean(item.warning) ||
          item.morningStudents.length < FIXED_TOPICS_PER_SESSION ||
          item.afternoonStudents.length < FIXED_TOPICS_PER_SESSION ||
          memberCount < FIXED_MEMBERS_PER_COUNCIL;
        const status: CommitteeStatus = hasWarning
          ? "Warning"
          : isFinalized
            ? "Ready"
            : "Draft";
        return {
          ...item,
          memberCount,
          status,
        };
      }),
    [drafts, isFinalized],
  );

  const assignedTopicsCount = useMemo(
    () =>
      councilRows.reduce(
        (sum, row) =>
          sum + row.morningStudents.length + row.afternoonStudents.length,
        0,
      ),
    [councilRows],
  );

  const councilCompletionPercent = useMemo(() => {
    if (!validRows.length) return 0;
    return Math.min(
      100,
      Math.round((assignedTopicsCount / validRows.length) * 100),
    );
  }, [assignedTopicsCount, validRows.length]);

  const latestCouncilOverview = useMemo(() => {
    if (!councilRows.length) return null;
    return [...councilRows].sort((a, b) =>
      b.defenseDate.localeCompare(a.defenseDate),
    )[0];
  }, [councilRows]);

  const filteredCouncilRows = useMemo(() => {
    const keyword = searchCouncil.trim().toLowerCase();
    return councilRows.filter((item) => {
      const matchKeyword =
        keyword.length === 0 ||
        item.id.toLowerCase().includes(keyword) ||
        item.slotId.toLowerCase().includes(keyword);
      const matchTag =
        tagFilter === "all" || item.councilTags.includes(tagFilter);
      const matchRoom = roomFilter === "all" || item.room === roomFilter;
      const matchDate = dateFilter === "all" || item.defenseDate === dateFilter;
      return matchKeyword && matchTag && matchRoom && matchDate;
    });
  }, [councilRows, searchCouncil, tagFilter, roomFilter, dateFilter]);

  const availableRooms = useMemo(() => {
    const values = new Set<string>();
    roomCatalog.forEach((room) => values.add(normalizeRoomCode(room)));
    councilRows.forEach((item) => values.add(normalizeRoomCode(item.room)));
    return Array.from(values)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "vi"));
  }, [councilRows, roomCatalog]);

  const roomOptions = useMemo(() => {
    return normalizeRoomCodeList([
      ...selectedRooms,
      ...availableRooms,
      ...availableAutoRooms,
    ]).sort();
  }, [selectedRooms, availableRooms, availableAutoRooms]);

  const autoRoomOptions = useMemo(
    () =>
      normalizeRoomCodeList([...availableAutoRooms, ...roomOptions]).sort(
        (a, b) => a.localeCompare(b, "vi"),
      ),
    [availableAutoRooms, roomOptions],
  );

  useEffect(() => {
    if (roomFilter !== "all" && !availableRooms.includes(roomFilter)) {
      setRoomFilter("all");
    }
  }, [availableRooms, roomFilter]);

  useEffect(() => {
    if (tagFilter !== "all" && !allTags.includes(tagFilter)) {
      setTagFilter("all");
    }
  }, [allTags, tagFilter]);

  useEffect(() => {
    if (!manualMode || manualReadOnly) {
      return;
    }
    const normalizedManualRoom = normalizeRoomCode(manualRoom);
    if (roomOptions.length === 0) {
      if (manualRoom) {
        setManualRoom("");
      }
      return;
    }
    if (normalizedManualRoom && normalizedManualRoom !== manualRoom) {
      setManualRoom(normalizedManualRoom);
      return;
    }
    if (!normalizedManualRoom || !roomOptions.includes(normalizedManualRoom)) {
      setManualRoom(roomOptions[0]);
    }
  }, [manualMode, manualReadOnly, manualRoom, roomOptions]);

  const availableDates = useMemo(
    () =>
      Array.from(new Set(councilRows.map((item) => item.defenseDate))).sort(),
    [councilRows],
  );

  const councilsPerDate = useMemo(() => {
    const map = new Map<string, number>();
    filteredCouncilRows.forEach((item) => {
      map.set(item.defenseDate, (map.get(item.defenseDate) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredCouncilRows]);

  const hasUnresolvedWarning = useMemo(
    () => councilRows.some((item) => item.status === "Warning"),
    [councilRows],
  );

  const councilTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredCouncilRows.length / 10)),
    [filteredCouncilRows.length],
  );

  const pagedCouncilRows = useMemo(() => {
    const safePage = Math.min(councilPage, councilTotalPages);
    const start = (safePage - 1) * 10;
    return filteredCouncilRows.slice(start, start + 10);
  }, [filteredCouncilRows, councilPage, councilTotalPages]);

  const editableDrafts = useMemo(() => councilRows, [councilRows]);

  const selectedCouncil = useMemo(
    () =>
      editableDrafts.find(
        (item: CouncilDraft) => item.id === selectedCouncilId,
      ) ?? null,
    [editableDrafts, selectedCouncilId],
  );

  const nextGeneratedCouncilId = useMemo(() => {
    const values = editableDrafts
      .map((item: CouncilDraft) => {
        const parts = item.id.split("-");
        const lastPart = parts.length ? parts[parts.length - 1] : "";
        return Number(lastPart);
      })
      .filter((value: number) => Number.isFinite(value));
    const max = values.length ? Math.max(...values) : 0;
    return `HD-${defensePeriodId ?? "PERIOD"}-${String(max + 1).padStart(2, "0")}`;
  }, [defensePeriodId, editableDrafts]);

  const findStudentByCode = (studentCode: string) =>
    students.find(
      (item: EligibleStudent) => item.studentCode === studentCode,
    ) ?? null;

  const filteredAutoTopics = useMemo(() => {
    const keyword = topicSearchKeyword.trim().toLowerCase();
    if (!keyword) return availableAutoTopics;
    return availableAutoTopics.filter((topic) => {
      const code = String(topic.topicCode ?? topic.topicId ?? "").toLowerCase();
      const title = (topic.title ?? "").toLowerCase();
      const tags = mergeStringLists(topic.tagCodes)
        .map((tag) => `${tag} ${getTagDisplayName(tag)}`)
        .join(" ")
        .toLowerCase();
      return (
        code.includes(keyword) ||
        title.includes(keyword) ||
        tags.includes(keyword)
      );
    });
  }, [availableAutoTopics, topicSearchKeyword, getTagDisplayName]);

  const mapApiCommitteeToDraft = (
    item: AutoGenerateCommitteeApi,
    index: number,
  ): CouncilDraft => {
    const record = item as Record<string, unknown>;
    const code =
      item.committeeCode ||
      `HD-${defensePeriodId ?? "PERIOD"}-${String(index + 1).padStart(2, "0")}`;
    const sessionCode = normalizeSessionCode(
      pickCaseInsensitiveValue(
        record,
        ["session", "Session", "sessionCode", "SessionCode"],
        "MORNING",
      ),
    );
    const startTime =
      normalizeTimeOnly(
        String(
          pickCaseInsensitiveValue(record, ["startTime", "StartTime"], ""),
        ),
      ) || undefined;
    const endTime =
      normalizeTimeOnly(
        String(pickCaseInsensitiveValue(record, ["endTime", "EndTime"], "")),
      ) || undefined;
    const assignments = Array.isArray(item.assignments) ? item.assignments : [];
    const assignmentRows: CouncilAssignment[] = assignments
      .map((assignment, assignmentIndex) => {
        const assignmentRecord = assignment as Record<string, unknown>;
        const sessionCode = normalizeSessionCode(
          pickCaseInsensitiveValue(
            assignmentRecord,
            ["sessionCode", "SessionCode", "session", "Session"],
            "MORNING",
          ),
        );
        const studentCode = String(assignment.studentCode ?? "").trim();
        return {
          assignmentId: Number(assignmentRecord.assignmentId ?? 0) || undefined,
          studentCode,
          topicCode: assignmentRecord.topicCode
            ? String(assignmentRecord.topicCode)
            : undefined,
          sessionCode,
          startTime:
            normalizeTimeOnly(String(assignmentRecord.startTime ?? "")) ||
            undefined,
          endTime:
            normalizeTimeOnly(String(assignmentRecord.endTime ?? "")) ||
            undefined,
          scheduledAt:
            normalizeDefenseDateOnly(
              String(assignmentRecord.scheduledAt ?? ""),
            ) || undefined,
          orderIndex:
            Number(assignmentRecord.orderIndex ?? 0) || assignmentIndex + 1,
        };
      })
      .filter((assignment) => assignment.studentCode);
    const morningStudents = assignmentRows
      .filter((assignment) => assignment.sessionCode === "MORNING")
      .map((assignment) => assignment.studentCode);
    const afternoonStudents = assignmentRows
      .filter((assignment) => assignment.sessionCode === "AFTERNOON")
      .map((assignment) => assignment.studentCode);
    const members: CouncilMember[] = (item.members ?? []).map((member) => ({
      role: member.role ?? "UV",
      lecturerCode: member.lecturerCode ?? "",
      lecturerName:
        member.lecturerName ?? getLecturerNameByCode(member.lecturerCode ?? ""),
    }));
    return {
      id: code,
      councilId:
        Number(
          pickCaseInsensitiveValue(
            record,
            [
              "councilId",
              "CouncilId",
              "committeeId",
              "CommitteeId",
              "id",
              "Id",
            ],
            0,
          ),
        ) || undefined,
      name:
        String(
          pickCaseInsensitiveValue(
            record,
            ["name", "Name", "councilName", "CouncilName"],
            code,
          ),
        ).trim() || code,
      concurrencyToken: item.concurrencyToken ?? undefined,
      room: normalizeRoomCode(
        item.room ?? selectedRooms[0] ?? roomOptions[0] ?? "",
      ),
      defenseDate: normalizeDefenseDateOnly(item.defenseDate ?? autoStartDate),
      session: sessionCode === "AFTERNOON" ? "Chieu" : "Sang",
      sessionCode,
      startTime,
      endTime,
      slotId: `${code}-${sessionCode === "AFTERNOON" ? "PM" : "AM"}`,
      councilTags: item.tagCodes ?? [],
      morningStudents,
      afternoonStudents,
      assignments: assignmentRows,
      forbiddenLecturers: [],
      members,
      warning: undefined,
    };
  };

  const reloadCouncilsFromBackend = async () => {
    const councilsRes = (await loadOptionalResponse(
      "councils",
      `${defensePeriodBase}/councils`,
      () =>
        adminApi.getCouncils() as Promise<
          ApiResponse<{
            items?: Array<Record<string, unknown>>;
          }>
        >,
    )) as ApiResponse<{
      items?: Array<Record<string, unknown>>;
    }> | null;

    if (!councilsRes) {
      return [] as CouncilDraft[];
    }

    const parsed = parseApiEnvelope(councilsRes);
    if (!parsed.ok) {
      return [] as CouncilDraft[];
    }
    const rawItems = (parsed.data?.items ?? []) as Array<{
      committeeCode?: string;
      concurrencyToken?: string;
      room?: string;
      defenseDate?: string | null;
      session?: string | number | null;
      sessionCode?: string | null;
      startTime?: string | null;
      endTime?: string | null;
      councilTags?: string[];
      assignments?: Array<Record<string, unknown>>;
      morningStudents?: Array<{ studentCode?: string }>;
      afternoonStudents?: Array<{ studentCode?: string }>;
      forbiddenLecturers?: string[];
      members?: Array<{
        role?: string;
        lecturerCode?: string;
        lecturerName?: string;
      }>;
      warning?: string | null;
    }>;
    const mapped: CouncilDraft[] = rawItems.map((item, index) => {
      const sessionCode = normalizeSessionCode(
        item.sessionCode ?? item.session ?? "MORNING",
      );
      const assignmentRows: CouncilAssignment[] = (item.assignments ?? [])
        .map((assignment, assignmentIndex) => ({
          assignmentId: Number(assignment.assignmentId ?? 0) || undefined,
          studentCode: String(assignment.studentCode ?? "").trim(),
          topicCode: assignment.topicCode
            ? String(assignment.topicCode)
            : undefined,
          sessionCode: normalizeSessionCode(
            assignment.sessionCode ?? assignment.session ?? "MORNING",
          ),
          startTime:
            normalizeTimeOnly(String(assignment.startTime ?? "")) || undefined,
          endTime:
            normalizeTimeOnly(String(assignment.endTime ?? "")) || undefined,
          scheduledAt:
            normalizeDefenseDateOnly(String(assignment.scheduledAt ?? "")) ||
            undefined,
          orderIndex: Number(assignment.orderIndex ?? 0) || assignmentIndex + 1,
        }))
        .filter((assignment) => assignment.studentCode);
      const explicitMorning = (item.morningStudents ?? [])
        .map((s) => s.studentCode ?? "")
        .filter(Boolean);
      const explicitAfternoon = (item.afternoonStudents ?? [])
        .map((s) => s.studentCode ?? "")
        .filter(Boolean);
      const derivedMorning = assignmentRows
        .filter((assignment) => assignment.sessionCode === "MORNING")
        .map((assignment) => assignment.studentCode);
      const derivedAfternoon = assignmentRows
        .filter((assignment) => assignment.sessionCode === "AFTERNOON")
        .map((assignment) => assignment.studentCode);

      return {
        id: item.committeeCode ?? `HD-${String(index + 1).padStart(2, "0")}`,
        councilId:
          Number(
            (item as Record<string, unknown>).councilId ??
              (item as Record<string, unknown>).committeeId ??
              0,
          ) || undefined,
        name:
          String(
            (item as Record<string, unknown>).name ??
              (item as Record<string, unknown>).councilName ??
              item.committeeCode ??
              `HD-${String(index + 1).padStart(2, "0")}`,
          ).trim() ||
          item.committeeCode ||
          `HD-${String(index + 1).padStart(2, "0")}`,
        concurrencyToken: item.concurrencyToken
          ? String(item.concurrencyToken)
          : undefined,
        room: normalizeRoomCode(item.room ?? selectedRooms[0] ?? ""),
        defenseDate: normalizeDefenseDateOnly(
          item.defenseDate
            ? String(item.defenseDate).slice(0, 10)
            : autoStartDate,
        ),
        session: sessionCode === "AFTERNOON" ? "Chieu" : "Sang",
        sessionCode,
        startTime: normalizeTimeOnly(item.startTime ?? "") || undefined,
        endTime: normalizeTimeOnly(item.endTime ?? "") || undefined,
        slotId: `${item.committeeCode ?? `HD-${index + 1}`}-${sessionCode === "AFTERNOON" ? "PM" : "AM"}`,
        councilTags: item.councilTags ?? [],
        morningStudents:
          explicitMorning.length > 0 ? explicitMorning : derivedMorning,
        afternoonStudents:
          explicitAfternoon.length > 0 ? explicitAfternoon : derivedAfternoon,
        assignments: assignmentRows,
        forbiddenLecturers: item.forbiddenLecturers ?? [],
        members: (item.members ?? []).map((m) => ({
          role: m.role ?? "UV",
          lecturerCode: m.lecturerCode ?? "",
          lecturerName: m.lecturerName ?? "",
        })),
        warning: item.warning ?? undefined,
      };
    });
    setDrafts(mapped);
    setSelectedCouncilId((prev) =>
      mapped.some((item) => item.id === prev) ? prev : (mapped[0]?.id ?? ""),
    );
    return mapped;
  };

  const buildCouncilStep1Payload = (
    draft: CouncilDraft,
    concurrencyToken?: string,
  ) => ({
    name: String(draft.name ?? draft.id).trim() || draft.id,
    defenseDate: `${normalizeDefenseDateOnly(draft.defenseDate)}T00:00:00`,
    room: normalizeRoomCode(draft.room),
    councilTags: draft.councilTags,
    ...(concurrencyToken ? { concurrencyToken } : {}),
  });

  const buildCouncilStep2Payload = (
    draft: CouncilDraft,
    concurrencyToken: string,
  ) => ({
    concurrencyToken,
    members: draft.members.map((member) => ({
      role: member.role,
      lecturerCode: member.lecturerCode,
    })),
  });

  const buildCouncilStep3Payload = (
    draft: CouncilDraft,
    concurrencyToken: string,
    scheduleMode: CouncilScheduleMode,
  ) => {
    const topicCodeByStudent = new Map<string, string>();
    students.forEach((student) => {
      const studentCode = String(student.studentCode ?? "").trim();
      const topicCode = String(student.topicCode ?? "").trim();
      if (studentCode && topicCode) {
        topicCodeByStudent.set(studentCode, topicCode);
      }
    });
    const assignmentSource =
      draft.assignments && draft.assignments.length > 0
        ? draft.assignments
        : manualAssignments;

    assignmentSource.forEach((assignment) => {
      const studentCode = String(assignment.studentCode ?? "").trim();
      const topicCode = String(assignment.topicCode ?? "").trim();
      if (studentCode && topicCode && !topicCodeByStudent.has(studentCode)) {
        topicCodeByStudent.set(studentCode, topicCode);
      }
    });

    const fullDayStart = normalizeTimeOnly(draft.startTime ?? manualStartTime);
    const fullDayEnd = normalizeTimeOnly(draft.endTime ?? manualEndTime);

    const getSessionRange = (sessionCode: SessionCode) => {
      if (scheduleMode === "ONE_SESSION") {
        return {
          startTime: fullDayStart,
          endTime: fullDayEnd,
        };
      }

      return sessionCode === "AFTERNOON"
        ? {
            startTime: normalizeTimeOnly(afternoonStart) || fullDayStart,
            endTime: fullDayEnd || normalizeTimeOnly(afternoonEnd),
          }
        : {
            startTime: fullDayStart || normalizeTimeOnly(morningStart),
            endTime: normalizeTimeOnly(morningEnd) || fullDayEnd,
          };
    };

    const missingTopicCodes: string[] = [];
    const assignmentRows = assignmentSource
      .map((assignment, index) => {
        const studentCode = String(assignment.studentCode ?? "").trim();
        const topicCode = String(
          assignment.topicCode ?? topicCodeByStudent.get(studentCode) ?? "",
        ).trim();
        if (!topicCode) {
          if (studentCode) {
            missingTopicCodes.push(studentCode);
          }
          return null;
        }

        const sessionCode = normalizeSessionCode(assignment.sessionCode);
        const sessionRange = getSessionRange(sessionCode);

        return {
          topicCode,
          scheduledAt:
            `${normalizeDefenseDateOnly(assignment.scheduledAt ?? draft.defenseDate) || normalizeDefenseDateOnly(draft.defenseDate)}` +
            "T00:00:00",
          sessionCode,
          startTime:
            normalizeTimeOnly(assignment.startTime ?? sessionRange.startTime) ||
            sessionRange.startTime,
          endTime:
            normalizeTimeOnly(assignment.endTime ?? sessionRange.endTime) ||
            sessionRange.endTime,
          orderIndex: Number(assignment.orderIndex ?? index + 1) || index + 1,
        };
      })
      .filter(
        (
          assignment,
        ): assignment is {
          topicCode: string;
          scheduledAt: string;
          sessionCode: SessionCode;
          startTime: string;
          endTime: string;
          orderIndex: number;
        } => Boolean(assignment),
      );

    return {
      step3: {
        concurrencyToken,
        assignments: assignmentRows,
      },
      missingTopicCodes,
    };
  };

  const loadAutoGenerateConfig = async () => {
    setLoadingAutoGenerateConfig(true);
    try {
      const [configRes, topicsRes, lecturersRes] = await Promise.all([
        loadOptionalResponse(
          "auto-generate-config",
          `${defensePeriodBase}/setup/snapshot`,
          () => adminApi.getAutoGenerateConfig(),
        ),
        loadOptionalResponse(
          "topics",
          `${defensePeriodBase}/topics?onlyEligible=false&onlyUnassigned=false&page=1&size=200`,
          () =>
            adminApi.getTopics({
              onlyEligible: false,
              onlyUnassigned: false,
              page: 1,
              size: 200,
            }),
        ),
        loadOptionalResponse(
          "lecturer-defense",
          `/LecturerDefense/get-list?defenseTermId=${defensePeriodId}&source=${lecturerSourceFilter}&keyword=${encodeURIComponent(lecturerSearchKeyword)}&page=1&pageSize=200`,
          () =>
            adminApi.getLecturerDefenseList({
              defenseTermId: defensePeriodId,
              source: lecturerSourceFilter,
              keyword: lecturerSearchKeyword,
              page: 1,
              pageSize: 200,
            }),
        ),
      ]);

      if (!configRes) {
        return;
      }
      const configParsed = parseApiEnvelope(configRes);
      if (!configParsed.ok) {
        return;
      }
      const configData = (configParsed.data ?? {}) as Record<string, unknown>;

      const availableRoomsRaw = pickCaseInsensitiveValue<unknown>(
        configData,
        ["availableRooms", "AvailableRooms", "rooms", "Rooms"],
        [],
      );
      const defaultSelectedRoomsRaw = pickCaseInsensitiveValue<unknown>(
        configData,
        ["defaultSelectedRooms", "DefaultSelectedRooms"],
        [],
      );
      const roomSource =
        Array.isArray(defaultSelectedRoomsRaw) &&
        defaultSelectedRoomsRaw.length > 0
          ? defaultSelectedRoomsRaw
          : availableRoomsRaw;
      const rooms = normalizeRoomCodeList(
        Array.isArray(roomSource)
          ? roomSource.map((room) => String(room ?? "").trim()).filter(Boolean)
          : [],
      );

      let topics: AutoGenerateTopicDto[] = [];
      if (topicsRes) {
        const topicsParsed = parseApiEnvelope(topicsRes);
        if (topicsParsed.ok) {
          const topicsData = (topicsParsed.data ?? {}) as Record<
            string,
            unknown
          >;
          topics = extractCompactRows(topicsData, ["items", "Items"])
            .map((item) => mapTopicRecordToAutoTopic(item))
            .filter((topic) => Boolean(topic.topicCode || topic.topicId));
        }
      }
      if (topics.length === 0) {
        topics = eligibleStudents.map((student) => ({
          topicId: student.topicCode ?? student.studentCode,
          topicCode: student.topicCode ?? student.studentCode,
          title: student.topicTitle,
          tagCodes: student.tags,
          studentCode: student.studentCode,
          supervisorCode: student.supervisorCode,
        }));
      }

      let lecturers: AutoGenerateLecturerDto[] = [];
      if (lecturersRes) {
        const lecturersParsed = parseApiEnvelope(lecturersRes);
        if (lecturersParsed.ok) {
          lecturers = (
            (lecturersParsed.data ?? []) as Array<Record<string, unknown>>
          )
            .map((item) => mapLecturerDefenseRecord(item))
            .filter(
              (item) =>
                Boolean(item.lecturerCode) || Boolean(item.lecturerProfileId),
            );
        }
      }
      if (lecturers.length === 0) {
        lecturers = lecturerCapabilities.map((lecturer) => ({
          lecturerId: lecturer.lecturerCode,
          lecturerProfileId: undefined,
          lecturerCode: lecturer.lecturerCode,
          lecturerName: lecturer.lecturerName,
          degree: lecturer.degree ?? "",
          tagCodes: lecturer.tags,
          availability: true,
          guideQuota: undefined,
          currentGuidingCount: undefined,
        }));
      }

      const roomPool = rooms.length
        ? rooms
        : roomCatalog.length
          ? roomCatalog
          : selectedRooms;

      setAvailableAutoRooms(roomPool);
      setSelectedAutoRooms((prev) => {
        const normalizedPrev = normalizeRoomCodeList(prev);
        if (!roomPool.length) {
          return [];
        }
        if (normalizedPrev.length) {
          const kept = normalizedPrev.filter((room) => roomPool.includes(room));
          if (kept.length) {
            return kept;
          }
        }
        const selectedFromConfig = normalizeRoomCodeList(
          selectedRoomsRef.current,
        );
        const matched = selectedFromConfig.filter((room) =>
          roomPool.includes(room),
        );
        return matched.length ? matched : roomPool.slice(0, 2);
      });
      setSelectedRooms((prev) => {
        const normalizedPrev = normalizeRoomCodeList(prev);
        if (!roomPool.length) {
          return normalizedPrev;
        }
        if (normalizedPrev.length) {
          const kept = normalizedPrev.filter((room) => roomPool.includes(room));
          return kept.length ? kept : roomPool.slice(0, 2);
        }
        return roomPool.slice(0, 2);
      });
      setAvailableAutoTopics(topics);
      setAvailableAutoLecturers(lecturers);
      setSelectedAutoTopicIds(
        topics
          .map((topic) => topic.topicId ?? topic.topicCode ?? "")
          .slice(0, 12),
      );
      setSelectedAutoLecturerIds(
        lecturers
          .map(
            (lecturer) =>
              lecturer.lecturerProfileId ??
              lecturer.lecturerId ??
              lecturer.lecturerCode ??
              "",
          )
          .filter(
            (id): id is number | string =>
              id !== "" && id !== null && id !== undefined,
          ),
      );
    } catch {
      notifyWarning(
        "Không tải được dữ liệu cấu hình tự động từ BE. Sử dụng dữ liệu hiện tại để tiếp tục.",
      );
      const fallbackRooms = normalizeRoomCodeList(
        roomCatalog.length ? roomCatalog : selectedRooms,
      );
      setAvailableAutoRooms(fallbackRooms);
      setSelectedAutoRooms((prev) => {
        const normalizedPrev = normalizeRoomCodeList(prev);
        if (!fallbackRooms.length) {
          return [];
        }
        if (normalizedPrev.length) {
          const kept = normalizedPrev.filter((room) =>
            fallbackRooms.includes(room),
          );
          if (kept.length) {
            return kept;
          }
        }
        const selectedFromConfig = normalizeRoomCodeList(
          selectedRoomsRef.current,
        );
        const matched = selectedFromConfig.filter((room) =>
          fallbackRooms.includes(room),
        );
        return matched.length ? matched : fallbackRooms.slice(0, 2);
      });
      setAvailableAutoTopics(
        eligibleStudents.map((student) => ({
          topicId: student.topicCode ?? student.studentCode,
          topicCode: student.topicCode ?? student.studentCode,
          title: student.topicTitle,
          tagCodes: student.tags,
          studentCode: student.studentCode,
          supervisorCode: student.supervisorCode,
        })),
      );
      const fallbackLecturers = lecturerCapabilities.map((lecturer) => ({
        lecturerId: lecturer.lecturerCode,
        lecturerProfileId: undefined,
        lecturerCode: lecturer.lecturerCode,
        lecturerName: lecturer.lecturerName,
        degree: lecturer.degree ?? "",
        tagCodes: lecturer.tags,
        availability: true,
        guideQuota: undefined,
        currentGuidingCount: undefined,
      }));
      setAvailableAutoLecturers(fallbackLecturers);
      setSelectedAutoLecturerIds(
        fallbackLecturers
          .map((lecturer) => lecturer.lecturerId ?? lecturer.lecturerCode ?? "")
          .filter((id) => String(id ?? "").trim().length > 0),
      );
    } finally {
      setLoadingAutoGenerateConfig(false);
    }
  };

  const toggleAutoTopic = (topicId: number | string) => {
    setSelectedAutoTopicIds((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId],
    );
  };

  const toggleAutoRoom = (room: string) => {
    const normalizedRoom = normalizeRoomCode(room);
    if (!normalizedRoom) {
      return;
    }
    setConfigSaved(false);
    setSelectedAutoRooms((prev) =>
      normalizeRoomCodeList(prev).includes(normalizedRoom)
        ? normalizeRoomCodeList(prev).filter((item) => item !== normalizedRoom)
        : [...normalizeRoomCodeList(prev), normalizedRoom],
    );
    setSelectedRooms((prev) =>
      normalizeRoomCodeList(prev).includes(normalizedRoom)
        ? normalizeRoomCodeList(prev).filter((item) => item !== normalizedRoom)
        : [...normalizeRoomCodeList(prev), normalizedRoom],
    );
  };

  const toggleAutoLecturer = (lecturerId: number | string) => {
    setSelectedAutoLecturerIds((prev) =>
      prev.includes(lecturerId)
        ? prev.filter((id) => id !== lecturerId)
        : [...prev, lecturerId],
    );
  };

  const submitAutoGenerate = async () => {
    setAutoGenerateModalAlert(null);
    const normalizedSelectedRooms = normalizeRoomCodeList(
      selectedAutoRooms.length > 0 ? selectedAutoRooms : selectedRooms,
    );

    if (normalizedSelectedRooms.length === 0) {
      showAutoGenerateModalError(
        "Cần chọn ít nhất 1 phòng để tạo hội đồng tự động.",
      );
      return;
    }
    if (selectedAutoTopicIds.length === 0) {
      showAutoGenerateModalError("Cần chọn ít nhất 1 đề tài hợp lệ.");
      return;
    }
    if (selectedAutoLecturerIds.length === 0) {
      showAutoGenerateModalError("Cần chọn ít nhất 1 giảng viên hợp lệ.");
      return;
    }

    const selectedTopicKeys = new Set(
      selectedAutoTopicIds.map((id) => String(id)),
    );
    const normalizedSelectedTopicCodes = Array.from(
      new Set(
        availableAutoTopics
          .filter((topic) =>
            selectedTopicKeys.has(
              String(topic.topicId ?? topic.topicCode ?? ""),
            ),
          )
          .map((topic) => String(topic.topicCode ?? topic.topicId ?? "").trim())
          .filter((code) => code.length > 0),
      ),
    );

    if (normalizedSelectedTopicCodes.length === 0) {
      showAutoGenerateModalError(
        "Không ánh xạ được mã đề tài từ danh sách đã chọn. Vui lòng đồng bộ lại dữ liệu.",
      );
      return;
    }

    const selectedLecturerKeys = new Set(
      selectedAutoLecturerIds.map((id) => String(id)),
    );
    const selectedLecturerRows = availableAutoLecturers.filter((lecturer) =>
      selectedLecturerKeys.has(
        String(
          lecturer.lecturerProfileId ??
            lecturer.lecturerId ??
            lecturer.lecturerCode ??
            "",
        ),
      ),
    );

    const normalizedSelectedLecturerCodes = Array.from(
      new Set(
        selectedLecturerRows
          .map((lecturer) =>
            String(lecturer.lecturerCode ?? lecturer.lecturerId ?? "").trim(),
          )
          .filter((code) => code.length > 0),
      ),
    );

    const normalizedSelectedLecturerProfileIds = Array.from(
      new Set(
        selectedLecturerRows
          .map((lecturer) =>
            Number(lecturer.lecturerProfileId ?? lecturer.lecturerId ?? 0),
          )
          .filter((id) => Number.isFinite(id) && id > 0),
      ),
    );

    if (normalizedSelectedLecturerCodes.length === 0) {
      showAutoGenerateModalError(
        "Không ánh xạ được mã giảng viên từ danh sách đã chọn. Vui lòng đồng bộ lại dữ liệu.",
      );
      return;
    }

    if (normalizedSelectedLecturerProfileIds.length === 0 || !defensePeriodId) {
      showAutoGenerateModalError(
        "Không ánh xạ được LecturerProfileID hợp lệ từ danh sách giảng viên đã chọn.",
      );
      return;
    }

    const payload = {
      selectedTopicCodes: normalizedSelectedTopicCodes,
      selectedLecturerCodes: normalizedSelectedLecturerCodes,
      selectedRooms: normalizedSelectedRooms,
      tags: normalizedConfigCouncilTagCodes,
      strategy: {
        groupByTag: autoGroupByTag,
        maxPerSession: topicsPerSessionConfig,
        prioritizeMatchTag: autoPrioritizeMatchTag,
        heuristicWeights: {
          tagMatchWeight: 0.5,
          workloadWeight: 0.2,
          fairnessWeight: 0.15,
          consecutiveCommitteePenaltyWeight: 0.2,
        },
      },
      constraints: {
        requireRoles: ["CT", "TK"],
      },
    };

    const unwrapGenerateActionData = (value: unknown) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        const source = value as Record<string, unknown>;
        const actionRaw = pickCaseInsensitiveValue<unknown>(
          source,
          ["action", "Action"],
          "",
        );
        const action =
          typeof actionRaw === "string" ? actionRaw.trim().toUpperCase() : "";
        const data = pickCaseInsensitiveValue<unknown>(
          source,
          ["data", "Data"],
          value,
        );
        return { action, data };
      }
      return { action: "", data: value };
    };

    const extractGeneratedCommittees = (
      value: unknown,
    ): AutoGenerateCommitteeApi[] => {
      if (Array.isArray(value)) {
        return value as AutoGenerateCommitteeApi[];
      }
      if (!value || typeof value !== "object") {
        return [];
      }
      const source = value as Record<string, unknown>;
      const committees = pickCaseInsensitiveValue<unknown>(
        source,
        ["committees", "Committees"],
        [],
      );
      return Array.isArray(committees)
        ? (committees as AutoGenerateCommitteeApi[])
        : [];
    };

    const extractNumericField = (value: unknown, keys: string[]) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return undefined;
      }
      const picked = pickCaseInsensitiveValue<unknown>(
        value as Record<string, unknown>,
        keys,
        undefined,
      );
      const num = Number(picked);
      return Number.isFinite(num) ? num : undefined;
    };

    setAssignmentLoading(true);
    setActionInFlight("Mô phỏng và tạo hội đồng tự động");
    try {
      const createSelectedResponse = await adminApi.createSelectedLecturers({
        defenseTermId: defensePeriodId,
        lecturerProfileIds: normalizedSelectedLecturerProfileIds,
      });
      const createSelectedParsed = parseApiEnvelope(createSelectedResponse);
      if (!createSelectedParsed.ok) {
        setAutoGenerateModalAlert({
          type: "error",
          message: extractApiErrorMessage(
            createSelectedResponse,
            "Không thể cập nhật danh sách giảng viên vào đợt.",
          ),
        });
        return;
      }

      const simulateResponse = await adminApi.simulateAutoGenerateCouncils(
        payload,
        makeIdempotencyKey("AUTOGEN-SIM"),
      );
      const simulateParsed = parseApiEnvelope(simulateResponse);
      if (!simulateParsed.ok) {
        setAutoGenerateModalAlert({
          type: "error",
          message: extractApiErrorMessage(
            simulateResponse,
            "Mô phỏng tạo hội đồng thất bại.",
          ),
        });
        return;
      }

      const simulationResult = unwrapGenerateActionData(
        simulateParsed.data as unknown,
      );
      if (simulationResult.action && simulationResult.action !== "SIMULATE") {
        notifyWarning(
          `Phản hồi mô phỏng trả về action ${simulationResult.action}. Tiếp tục tạo chính thức theo dữ liệu nhận được.`,
        );
      }
      const idempotencyKey = makeIdempotencyKey("AUTOGEN");
      const response = await adminApi.autoGenerateCouncils(
        payload,
        idempotencyKey,
      );
      const parsed = parseApiEnvelope(response);
      if (!parsed.ok) {
        setAutoGenerateModalAlert({
          type: "error",
          message: extractApiErrorMessage(
            response,
            "Tạo hội đồng tự động thất bại.",
          ),
        });
        return;
      }

      const generateResult = unwrapGenerateActionData(parsed.data as unknown);
      if (generateResult.action && generateResult.action !== "GENERATE") {
        notifyWarning(
          `Phản hồi tạo chính thức trả về action ${generateResult.action}. Dữ liệu vẫn được hiển thị để rà soát.`,
        );
      }

      const normalizedGenerateData = generateResult.data;
      const generatedRaw = extractGeneratedCommittees(normalizedGenerateData);

      const generated = generatedRaw.map(mapApiCommitteeToDraft);
      setDrafts(generated);
      setSelectedCouncilId(generated[0]?.id ?? "");
      setCouncilPage(1);
      setAutoGenerateModalAlert(null);
      closeAutoGenerateModal();
      const warnings = readEnvelopeWarningMessages(response);
      const committeesCreated =
        extractNumericField(normalizedGenerateData, [
          "committeesCreated",
          "CommitteesCreated",
        ]) ?? generated.length;
      const topicsAssigned =
        extractNumericField(normalizedGenerateData, [
          "topicsAssigned",
          "TopicsAssigned",
        ]) ??
        generatedRaw.reduce(
          (sum, item) => sum + (item.assignments?.length ?? 0),
          0,
        );
      if (warnings.length) {
        notifyWarning(
          `Tạo tự động hoàn tất với cảnh báo: ${warnings.join(" ")}`,
        );
      } else if (readEnvelopeIdempotencyReplay(response)) {
        notifyInfo(
          "Yêu cầu tạo tự động đã được xử lý trước đó (idempotency replay).",
        );
      } else {
        notifySuccess(
          `Đã tạo ${committeesCreated} hội đồng, phân công ${topicsAssigned} đề tài.`,
        );
      }
    } catch (error) {
      if (error instanceof FetchDataError) {
        const fallback =
          error.status === 400
            ? "Yêu cầu tạo hội đồng không hợp lệ (HTTP 400). Hãy kiểm tra mã đề tài, mã giảng viên và phòng đã chọn trong đợt hiện tại."
            : "Mô phỏng/tạo hội đồng tự động thất bại. Vui lòng kiểm tra cấu hình và thử lại.";
        showAutoGenerateModalError(
          extractApiErrorMessage(error.data, fallback),
          true,
        );
      } else {
        showAutoGenerateModalError(
          "Mô phỏng/tạo hội đồng tự động thất bại. Vui lòng kiểm tra cấu hình và thử lại.",
          true,
        );
      }
    } finally {
      setAssignmentLoading(false);
      setActionInFlight(null);
    }
  };

  const pickStudentsByTags = (tags: string[], excludedCodes?: Set<string>) => {
    const excluded = excludedCodes ?? new Set<string>();
    const matched = eligibleStudents.filter(
      (item: EligibleStudent) =>
        !excluded.has(item.studentCode) &&
        (tags.length === 0 ||
          item.tags.some((tag: string) => tags.includes(tag))),
    );
    const fallback = eligibleStudents.filter(
      (item: EligibleStudent) =>
        !excluded.has(item.studentCode) &&
        !matched.some((picked) => picked.studentCode === item.studentCode),
    );
    const picked = [...matched, ...fallback].slice(
      0,
      FIXED_TOPICS_PER_SESSION * 2,
    );
    return {
      morning: picked
        .slice(0, FIXED_TOPICS_PER_SESSION)
        .map((item: EligibleStudent) => item.studentCode),
      afternoon: picked
        .slice(FIXED_TOPICS_PER_SESSION, FIXED_TOPICS_PER_SESSION * 2)
        .map((item: EligibleStudent) => item.studentCode),
    };
  };

  const refreshBackendState = async () => {
    const stateRes = await adminApi.getState();
    const parsed = parseApiEnvelope(stateRes);
    const stateData = (parsed.data ?? null) as Record<string, unknown> | null;
    if (!stateData) {
      return;
    }

    const allowedActionsRaw = (stateData.allowedActions ??
      stateData.AllowedActions) as unknown;
    const allowedActions = Array.isArray(allowedActionsRaw)
      ? allowedActionsRaw.map((item) => String(item))
      : [];

    setBackendAllowedActions(allowedActions);
    setCapabilitiesLocked(
      Boolean(
        stateData.lecturerCapabilitiesLocked ??
        stateData.LecturerCapabilitiesLocked,
      ),
    );
    setCouncilConfigConfirmed(
      Boolean(
        stateData.councilConfigConfirmed ?? stateData.CouncilConfigConfirmed,
      ),
    );
    setIsFinalized(Boolean(stateData.finalized ?? stateData.Finalized));

    hydrateReadinessState(stateData);
  };

  const syncData = async () => {
    setSyncing(true);
    setActionInFlight("Đồng bộ dữ liệu");
    setSyncStatus("idle");
    try {
      const idempotencyKey = makeIdempotencyKey("SYNC");
      const response = await adminApi.sync(idempotencyKey);
      const parsed = parseApiEnvelope(response);
      if (!parsed.ok) {
        setSyncStatus("timeout");
        return;
      }
      await refreshBackendState();
      const studentRes = await adminApi.getStudents(true);
      const studentParsed = parseApiEnvelope(studentRes);
      if (!studentParsed.ok) {
        setSyncStatus("timeout");
        return;
      }
      setStudents(
        ((studentParsed.data ?? []) as Array<Record<string, unknown>>)
          .map((item) => mapStudentRecord(item))
          .filter((item) => item.studentCode.length > 0),
      );
      setSyncedAt(new Date().toLocaleString("vi-VN"));
      setSyncStatus("success");
      const syncWarnings = (response?.warnings ?? [])
        .map((warning) => String(warning.message ?? "").trim())
        .filter(
          (message) =>
            message.length > 0 &&
            !message.toUpperCase().startsWith("UC2.READINESS."),
        );

      if (syncWarnings.length) {
        notifyWarning(
          `Đồng bộ hoàn tất với cảnh báo: ${syncWarnings.join(" | ")}`,
        );
      } else if (readEnvelopeIdempotencyReplay(response)) {
        notifyInfo(
          "Yêu cầu đồng bộ đã được xử lý trước đó (idempotency replay).",
        );
      } else {
        notifySuccess("Đồng bộ dữ liệu đủ điều kiện thành công.");
      }
    } catch {
      setSyncStatus("timeout");
      notifyError("Đồng bộ thất bại hoặc timeout. Vui lòng thử lại.");
    } finally {
      setSyncing(false);
      setActionInFlight(null);
    }
  };

  const saveConfig = async () => {
    const normalizedSelectedRooms = normalizeRoomCodeList(selectedRooms);
    const normalizedStartDate = normalizeDefenseDateOnly(autoStartDate);
    const normalizedEndDate = normalizeDefenseDateOnly(autoEndDate);
    if (normalizedSelectedRooms.length === 0) {
      setConfigSaved(false);
      notifyError("Không thể lưu cấu hình: cần chọn ít nhất 1 phòng.");
      return;
    }
    if (!normalizedStartDate || !normalizedEndDate) {
      setConfigSaved(false);
      notifyError("Không thể lưu cấu hình: thiếu ngày bắt đầu hoặc kết thúc.");
      return;
    }
    try {
      setActionInFlight("Lưu cấu hình đợt");
      const response = await adminApi.updateConfig({
        startDate: `${normalizedStartDate}T00:00:00Z`,
        endDate: `${normalizedEndDate}T00:00:00Z`,
        rooms: normalizedSelectedRooms,
        morningStart,
        afternoonStart,
        softMaxCapacity: maxCapacity,
      });
      const parsed = parseApiEnvelope(response);
      if (!parsed.ok) {
        setConfigSaved(false);
        return;
      }
      setConfigSaved(true);
      notifySuccess("Đã lưu cấu hình tham số đợt bảo vệ.");
    } catch {
      setConfigSaved(false);
      notifyError("Không lưu được cấu hình đợt bảo vệ.");
    } finally {
      setActionInFlight(null);
    }
  };

  const saveCouncilConfig = async () => {
    if (normalizedConfigCouncilTagCodes.length === 0) {
      setCouncilConfigConfirmed(false);
      notifyWarning(
        "Vui lòng chọn ít nhất 1 tag hội đồng trước khi lưu cấu hình.",
      );
      return;
    }
    try {
      setActionInFlight("Lưu cấu hình hội đồng");
      const response = await adminApi.confirmCouncilConfig({
        topicsPerSessionConfig,
        membersPerCouncilConfig,
        tags: normalizedConfigCouncilTagCodes,
      });
      const parsed = parseApiEnvelope(response);
      if (!parsed.ok) {
        setCouncilConfigConfirmed(false);
        return;
      }
      setCouncilConfigConfirmed(Boolean(parsed.data));
      notifySuccess(
        `Đã lưu tham số cấu hình (${topicsPerSessionConfig} đề tài/buổi, ${membersPerCouncilConfig} thành viên). Khi tạo chính thức hệ thống chuẩn hóa 2 buổi, mỗi buổi 4 đề tài và 4 thành viên.`,
      );
    } catch {
      setCouncilConfigConfirmed(false);
      notifyError("Không lưu được cấu hình hội đồng.");
    } finally {
      setActionInFlight(null);
    }
  };

  const runAssignment = async () => {
    if (!hasAllowedAction("GENERATE_COUNCILS")) {
      notifyWarning(
        "Backend chưa cho phép tạo hội đồng ở trạng thái hiện tại.",
      );
      return;
    }
    setAutoGenerateStep(1);
    setAutoGenerateModalAlert(null);
    setSelectedAutoRooms(normalizeRoomCodeList(selectedRoomsRef.current));
    setShowAutoGenerateModal(true);
    await loadAutoGenerateConfig();
  };

  const proceedAutoGenerateStep2 = () => {
    if (selectedAutoTopicIds.length === 0) {
      notifyWarning("Vui lòng chọn ít nhất 1 đề tài đủ điều kiện.");
      return;
    }
    if (selectedAutoLecturerIds.length === 0) {
      notifyWarning("Vui lòng chọn ít nhất 1 giảng viên tham gia.");
      return;
    }
    setAutoGenerateStep(2);
  };

  const exportCouncilListCsv = useCallback(() => {
    if (filteredCouncilRows.length === 0) {
      notifyWarning("Không có dữ liệu hội đồng để xuất file.");
      return;
    }

    const toCsvField = (value: string | number) => {
      const text = String(value ?? "").replace(/"/g, '""');
      return `"${text}"`;
    };

    const headers = [
      "MaHoiDong",
      "NgayBaoVe",
      "Phong",
      "Tags",
      "SoDeTaiSang",
      "SoDeTaiChieu",
      "SoThanhVien",
      "TrangThai",
    ];

    const rows = filteredCouncilRows.map((row) => [
      row.id,
      row.defenseDate,
      row.room,
      getTagDisplayList(row.councilTags).join(" | "),
      row.morningStudents.length,
      row.afternoonStudents.length,
      row.memberCount,
      row.status,
    ]);

    const csvContent = [
      headers.map((header) => toCsvField(header)).join(","),
      ...rows.map((row) => row.map((value) => toCsvField(value)).join(",")),
    ].join("\n");

    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const fileDate = new Date().toISOString().slice(0, 10);
    anchor.href = objectUrl;
    anchor.download = `council-list-${fileDate}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);

    notifySuccess("Đã xuất file danh sách hội đồng.");
  }, [filteredCouncilRows, getTagDisplayList, notifySuccess, notifyWarning]);

  const finalize = async () => {
    if (!drafts.length) {
      notifyWarning("Chưa có hội đồng nháp để chốt.");
      return;
    }
    try {
      setActionInFlight("Finalize kỳ bảo vệ");
      const idempotencyKey = makeIdempotencyKey("FINALIZE");
      const response = await adminApi.finalize(
        allowFinalizeAfterWarning,
        idempotencyKey,
      );
      const parsed = parseApiEnvelope(response);
      if (!parsed.ok) {
        return;
      }
      await refreshBackendState();
      if (readEnvelopeIdempotencyReplay(response)) {
        notifyInfo(
          "Yêu cầu chốt danh sách đã được xử lý trước đó (idempotency replay).",
        );
      } else {
        notifySuccess("Đã chốt danh sách hội đồng.");
      }
    } catch {
      notifyError(
        "Chốt danh sách thất bại. Vui lòng kiểm tra điều kiện rồi thử lại.",
      );
    } finally {
      setActionInFlight(null);
    }
  };

  const tagCodeByNameLookup = useMemo(() => {
    return Object.entries(tagNameByCode).reduce<Record<string, string>>(
      (accumulator, [code, tagName]) => {
        const key = normalizeTagLookupKey(tagName);
        if (!key) {
          return accumulator;
        }
        accumulator[key] = code;
        return accumulator;
      },
      {},
    );
  }, [tagNameByCode]);

  const resolveTagCode = useCallback(
    (rawTagValue: string) => {
      const rawValue = String(rawTagValue ?? "").trim();
      if (!rawValue) {
        return "";
      }

      const normalizedCode = normalizeTagCode(rawValue);
      if (tagNameByCode[normalizedCode]) {
        return normalizedCode;
      }

      const lookupKey = normalizeTagLookupKey(rawValue);
      if (lookupKey && tagCodeByNameLookup[lookupKey]) {
        return tagCodeByNameLookup[lookupKey];
      }

      return normalizedCode || rawValue;
    },
    [tagCodeByNameLookup, tagNameByCode],
  );

  const normalizedConfigCouncilTagCodes = useMemo(
    () =>
      Array.from(
        new Set(
          configCouncilTags
            .map((tag) => resolveTagCode(tag))
            .filter((tag) => tag.length > 0),
        ),
      ),
    [configCouncilTags, resolveTagCode],
  );

  const normalizedManualCouncilTagCodes = useMemo(
    () =>
      Array.from(
        new Set(
          manualCouncilTags
            .map((tag) => resolveTagCode(tag))
            .filter((tag) => tag.length > 0),
        ),
      ),
    [manualCouncilTags, resolveTagCode],
  );

  const lecturerDirectory = useMemo(() => {
    const index = new Map<
      string,
      {
        lecturerCode: string;
        lecturerName: string;
        degree: string;
        tags: string[];
      }
    >();

    const upsert = (item: {
      lecturerCode?: string | null;
      lecturerName?: string | null;
      degree?: string | null;
      tags?: string[] | null;
    }) => {
      const lecturerCode = String(item.lecturerCode ?? "").trim();
      if (!lecturerCode) {
        return;
      }

      const nextName = String(item.lecturerName ?? "").trim();
      const nextDegree = String(item.degree ?? "").trim();
      const nextTags = mergeStringLists(item.tags ?? []);
      const previous = index.get(lecturerCode);

      index.set(lecturerCode, {
        lecturerCode,
        lecturerName: nextName || previous?.lecturerName || lecturerCode,
        degree: nextDegree || previous?.degree || "",
        tags: mergeStringLists(previous?.tags ?? [], nextTags),
      });
    };

    availableAutoLecturers.forEach((lecturer) => {
      upsert({
        lecturerCode: String(lecturer.lecturerCode ?? "").trim(),
        lecturerName: String(lecturer.lecturerName ?? "").trim(),
        degree: String(lecturer.degree ?? "").trim(),
        tags: lecturer.tagCodes ?? [],
      });
    });

    lecturerCapabilities.forEach((lecturer) => {
      upsert({
        lecturerCode: lecturer.lecturerCode,
        lecturerName: lecturer.lecturerName,
        degree: lecturer.degree,
        tags: lecturer.tags,
      });
    });

    return index;
  }, [availableAutoLecturers, lecturerCapabilities]);

  const getLecturerNameByCode = useCallback(
    (lecturerCode: string) => {
      const normalizedCode = String(lecturerCode ?? "").trim();
      if (!normalizedCode) {
        return "";
      }
      return lecturerDirectory.get(normalizedCode)?.lecturerName ?? "";
    },
    [lecturerDirectory],
  );

  const getLecturerDegreeByCode = useCallback(
    (lecturerCode: string) => {
      const normalizedCode = String(lecturerCode ?? "").trim();
      if (!normalizedCode) {
        return "";
      }
      return lecturerDirectory.get(normalizedCode)?.degree ?? "";
    },
    [lecturerDirectory],
  );

  const getLecturerTagsByCode = useCallback(
    (lecturerCode: string) => {
      const normalizedCode = String(lecturerCode ?? "").trim();
      if (!normalizedCode) {
        return [] as string[];
      }
      return lecturerDirectory.get(normalizedCode)?.tags ?? [];
    },
    [lecturerDirectory],
  );

  const getLecturerDisplayNameByCode = useCallback(
    (
      lecturerCode: string,
      fallbackName = "",
      fallbackDegree: string | null | undefined = "",
    ) => {
      const normalizedCode = String(lecturerCode ?? "").trim();
      const profile = normalizedCode
        ? lecturerDirectory.get(normalizedCode)
        : undefined;
      const resolvedName =
        profile?.lecturerName ||
        String(fallbackName ?? "").trim() ||
        normalizedCode ||
        "Chưa gán";
      const resolvedDegree =
        profile?.degree || String(fallbackDegree ?? "").trim();
      return formatLecturerNameWithDegree(resolvedName, resolvedDegree);
    },
    [lecturerDirectory],
  );

  const formatLecturerOptionLabel = useCallback(
    (lecturer: {
      lecturerCode?: string | null;
      lecturerName?: string | null;
      degree?: string | null;
    }) => {
      const lecturerCode = String(lecturer.lecturerCode ?? "").trim();
      const label = getLecturerDisplayNameByCode(
        lecturerCode,
        String(lecturer.lecturerName ?? "").trim(),
        lecturer.degree,
      );
      return lecturerCode ? `${lecturerCode} - ${label}` : label;
    },
    [getLecturerDisplayNameByCode],
  );

  const manualLecturerOptions = useMemo<ManualLecturerOption[]>(() => {
    if (lecturerCapabilities.length > 0) {
      return lecturerCapabilities
        .map((lecturer) => {
          const profile = lecturerDirectory.get(lecturer.lecturerCode);
          return {
            lecturerCode: lecturer.lecturerCode,
            lecturerName:
              lecturer.lecturerName ||
              profile?.lecturerName ||
              lecturer.lecturerCode,
            degree: lecturer.degree ?? profile?.degree ?? "",
            tags: mergeStringLists(lecturer.tags, profile?.tags),
          };
        })
        .filter((lecturer) => lecturer.lecturerCode.length > 0);
    }

    return Array.from(lecturerDirectory.values()).map((lecturer) => ({
      lecturerCode: lecturer.lecturerCode,
      lecturerName: lecturer.lecturerName,
      degree: lecturer.degree,
      tags: lecturer.tags,
    }));
  }, [lecturerCapabilities, lecturerDirectory]);

  const renderLecturerPickerOption = useCallback(
    (lecturer: ManualLecturerOption) => {
      const tagNames = getTagDisplayList(lecturer.tags);
      const safeDegree =
        String(lecturer.degree ?? "").trim() || "Chưa cập nhật học vị";
      const lecturerSummary = `${lecturer.lecturerCode} - ${lecturer.lecturerName}`;
      const tagSummary =
        tagNames.length > 0 ? tagNames.join(", ") : "Chưa có tags";

      return (
        <div className="committee-lecturer-option">
          <div
            className="committee-lecturer-option-title"
            title={lecturerSummary}
          >
            {lecturerSummary}
          </div>
          <div
            className="committee-lecturer-option-meta"
            title={`${safeDegree} · ${tagSummary}`}
          >
            <span className="committee-lecturer-option-degree-text">
              {safeDegree}
            </span>
            <span className="committee-lecturer-option-separator">·</span>
            <span className="committee-lecturer-option-tags-text">
              {tagSummary}
            </span>
          </div>
        </div>
      );
    },
    [getTagDisplayList],
  );

  const buildManualMemberLecturerOptions = useCallback(
    (memberIndex: number, role: string) => {
      const selectedByOthers = new Set(
        manualMembers
          .map((member, index) =>
            index === memberIndex
              ? ""
              : String(member.lecturerCode ?? "").trim(),
          )
          .filter((code) => code.length > 0),
      );
      const requiresDoctorDegree = isChairRole(role);

      return manualLecturerOptions
        .filter((lecturer) => {
          const lecturerCode = String(lecturer.lecturerCode ?? "").trim();
          if (!lecturerCode || selectedByOthers.has(lecturerCode)) {
            return false;
          }
          if (requiresDoctorDegree && !isDoctorDegree(lecturer.degree)) {
            return false;
          }
          return true;
        })
        .sort((left, right) => {
          const leftLabel = formatLecturerOptionLabel(left);
          const rightLabel = formatLecturerOptionLabel(right);
          return leftLabel.localeCompare(rightLabel, "vi");
        });
    },
    [formatLecturerOptionLabel, manualLecturerOptions, manualMembers],
  );

  const expectedManualMemberCount = useMemo(
    () =>
      Math.max(
        FIXED_MANUAL_MEMBER_SLOT_COUNT,
        Number(membersPerCouncilConfig) || FIXED_MEMBERS_PER_COUNCIL,
      ),
    [membersPerCouncilConfig],
  );

  const validateManualMemberSetup = useCallback(() => {
    if (manualMembers.length === 0) {
      return "Bước 2 chưa hợp lệ: cần ít nhất 1 thành viên hội đồng.";
    }

    if (manualMembers.length !== expectedManualMemberCount) {
      return `Bước 2 chưa hợp lệ: danh sách thành viên phải đúng ${expectedManualMemberCount} người theo cấu hình đợt.`;
    }

    const normalizedRoles = manualMembers.map((item, index) =>
      normalizeManualMemberRoleCode(item.role, index),
    );
    const invalidRole = normalizedRoles.find(
      (role) => !["CT", "TK", "PB", "UV"].includes(role),
    );
    if (invalidRole) {
      return `Bước 2 chưa hợp lệ: vai trò ${invalidRole} không thuộc danh sách cho phép CT, TK, PB, UV.`;
    }

    const missingMemberInfo = manualMembers.some((item, index) => {
      const role = normalizeManualMemberRoleCode(item.role, index);
      return !role.trim() || !String(item.lecturerCode ?? "").trim();
    });
    if (missingMemberInfo) {
      return "Bước 2 chưa hoàn tất: mỗi slot phải có vai trò và giảng viên.";
    }

    const normalizedCodes = manualMembers
      .map((item) => String(item.lecturerCode ?? "").trim())
      .filter(Boolean);
    if (new Set(normalizedCodes).size !== normalizedCodes.length) {
      return "Mỗi giảng viên chỉ được chọn 1 slot trong cùng hội đồng.";
    }

    const chairMembers = manualMembers.filter((item, index) =>
      isChairRole(normalizeManualMemberRoleCode(item.role, index)),
    );
    const secretaryMembers = manualMembers.filter(
      (item, index) => normalizeManualMemberRoleCode(item.role, index) === "TK",
    );

    if (chairMembers.length !== 1 || secretaryMembers.length !== 1) {
      return "Bước 2 chưa hợp lệ: phải có đúng 1 Chủ tịch (CT) và đúng 1 Thư ký (TK).";
    }

    const invalidChair = chairMembers.find((item) => {
      const lecturerCode = String(item.lecturerCode ?? "").trim();
      if (!lecturerCode) {
        return true;
      }
      return !isDoctorDegree(getLecturerDegreeByCode(lecturerCode));
    });
    if (invalidChair) {
      const invalidLabel = getLecturerDisplayNameByCode(
        invalidChair.lecturerCode,
        invalidChair.lecturerName,
      );
      return `Vai trò Chủ tịch chỉ chấp nhận giảng viên có học vị Tiến sĩ. Không hợp lệ: ${invalidLabel}.`;
    }

    return "";
  }, [
    expectedManualMemberCount,
    getLecturerDegreeByCode,
    getLecturerDisplayNameByCode,
    manualMembers,
  ]);

  const eligibleTopicRows = useMemo(() => {
    const lecturerTagMap = new Map(
      Array.from(lecturerDirectory.entries()).map(([code, item]) => [
        code,
        item.tags,
      ]),
    );
    const topicTagMap = new Map<string, string[]>();
    availableAutoTopics.forEach((topic) => {
      const tags = mergeStringLists(topic.tagCodes);
      const topicCodeKey = String(topic.topicCode ?? "").trim();
      const topicIdKey = String(topic.topicId ?? "").trim();
      if (topicCodeKey) {
        topicTagMap.set(topicCodeKey, tags);
      }
      if (topicIdKey) {
        topicTagMap.set(topicIdKey, tags);
      }
    });

    return eligibleStudents
      .map((item) => {
        const supervisorCode = String(item.supervisorCode ?? "").trim();
        const lecturerName = supervisorCode
          ? getLecturerDisplayNameByCode(supervisorCode, supervisorCode)
          : "Chưa gán";
        const topicCode = String(item.topicCode ?? "").trim();
        const topicTags = mergeStringLists(
          item.topicTags,
          item.tags,
          topicTagMap.get(topicCode),
        );
        const lecturerTags = mergeStringLists(
          item.lecturerTags,
          lecturerTagMap.get(supervisorCode),
        );
        const statusValue = String(item.status ?? "").trim();

        return {
          topicCode: topicCode || "-",
          topicTitle: String(item.topicTitle ?? "").trim() || "-",
          studentName: String(item.studentName ?? "").trim() || "-",
          lecturerName,
          topicTags,
          lecturerTags,
          status:
            statusValue ||
            (item.valid
              ? item.isEligible
                ? "Đủ điều kiện"
                : "Chưa đủ điều kiện"
              : "Có cảnh báo"),
        };
      })
      .sort((left, right) => {
        const leftKey = `${left.topicCode} ${left.topicTitle}`.trim();
        const rightKey = `${right.topicCode} ${right.topicTitle}`.trim();
        return leftKey.localeCompare(rightKey, "vi");
      });
  }, [
    availableAutoTopics,
    eligibleStudents,
    getLecturerDisplayNameByCode,
    lecturerDirectory,
  ]);

  const eligibleTopicModalSummary = useMemo(() => {
    const statusValues = new Set<string>();
    const topicTags = new Set<string>();
    const lecturerTags = new Set<string>();

    eligibleTopicRows.forEach((row) => {
      if (row.status) {
        statusValues.add(row.status);
      }
      row.topicTags.forEach((tag) => topicTags.add(tag));
      row.lecturerTags.forEach((tag) => lecturerTags.add(tag));
    });

    return {
      statuses: Array.from(statusValues).sort((left, right) =>
        left.localeCompare(right, "vi"),
      ),
      topicTags: Array.from(topicTags).sort((left, right) =>
        left.localeCompare(right, "vi"),
      ),
      lecturerTags: Array.from(lecturerTags).sort((left, right) =>
        left.localeCompare(right, "vi"),
      ),
    };
  }, [eligibleTopicRows]);

  const getModalStatusChipClassName = (status: string) =>
    /warning|cảnh báo|chưa|thiếu/i.test(status)
      ? "committee-modal-chip committee-modal-chip--warning"
      : "committee-modal-chip committee-modal-chip--status";

  const buildStudentView = (codes: string[]) =>
    codes.map((studentCode) => {
      const student = findStudentByCode(studentCode);
      const supervisorCode = student?.supervisorCode ?? "";
      const supervisorName = supervisorCode
        ? getLecturerDisplayNameByCode(supervisorCode, supervisorCode)
        : "Chưa gán";
      return {
        studentCode,
        topicCode: String(student?.topicCode ?? "").trim() || "-",
        studentName: student?.studentName ?? "-",
        topicTitle: student?.topicTitle ?? "-",
        supervisorName,
        topicTags: mergeStringLists(student?.topicTags, student?.tags),
      };
    });

  const resolveManualAssignmentRange = useCallback(
    (
      scheduleMode: CouncilScheduleMode,
      sessionCode: SessionCode,
      startTimeOverride?: string,
      endTimeOverride?: string,
    ) => {
      if (scheduleMode === "ONE_SESSION") {
        return {
          startTime:
            normalizeTimeOnly(startTimeOverride ?? manualStartTime) ||
            startTimeOverride ||
            manualStartTime,
          endTime:
            normalizeTimeOnly(endTimeOverride ?? manualEndTime) ||
            endTimeOverride ||
            manualEndTime,
        };
      }

      if (sessionCode === "AFTERNOON") {
        return {
          startTime: normalizeTimeOnly(afternoonStart) || afternoonStart,
          endTime: normalizeTimeOnly(afternoonEnd) || afternoonEnd,
        };
      }

      return {
        startTime: normalizeTimeOnly(morningStart) || morningStart,
        endTime: normalizeTimeOnly(morningEnd) || morningEnd,
      };
    },
    [
      afternoonEnd,
      afternoonStart,
      manualEndTime,
      manualStartTime,
      morningEnd,
      morningStart,
    ],
  );

  const buildManualAssignments = useCallback(
    (
      relatedCodes: string[],
      morningCodes: string[] = [],
      afternoonCodes: string[] = [],
      options?: {
        scheduleMode?: CouncilScheduleMode;
        sessionCode?: SessionCode;
        existingAssignments?: CouncilAssignment[];
        assignmentDefaults?: {
          defenseDate?: string;
          startTime?: string;
          endTime?: string;
        };
      },
    ) => {
      const scheduleMode = options?.scheduleMode ?? manualScheduleMode;
      const sessionCode = options?.sessionCode ?? manualSessionCode;
      const defaultDefenseDate =
        normalizeDefenseDateOnly(
          options?.assignmentDefaults?.defenseDate ?? manualDefenseDate,
        ) || manualDefenseDate;
      const defaultStartTime =
        options?.assignmentDefaults?.startTime ?? manualStartTime;
      const defaultEndTime =
        options?.assignmentDefaults?.endTime ?? manualEndTime;
      const existingAssignments = new Map(
        (options?.existingAssignments ?? []).map((assignment) => [
          assignment.studentCode,
          assignment,
        ]),
      );

      const topicCodeByStudent = new Map<string, string>();
      students.forEach((student) => {
        const studentCode = String(student.studentCode ?? "").trim();
        const topicCode = String(student.topicCode ?? "").trim();
        if (studentCode && topicCode) {
          topicCodeByStudent.set(studentCode, topicCode);
        }
      });

      const normalizeCodes = (codes: string[]) =>
        Array.from(
          new Set(
            codes.map((code) => String(code ?? "").trim()).filter(Boolean),
          ),
        );

      const selectedRelated = normalizeCodes(relatedCodes);
      const selectedMorning =
        scheduleMode === "ONE_SESSION"
          ? sessionCode === "MORNING"
            ? selectedRelated
            : []
          : normalizeCodes(morningCodes);
      const selectedAfternoon =
        scheduleMode === "ONE_SESSION"
          ? sessionCode === "AFTERNOON"
            ? selectedRelated
            : []
          : normalizeCodes(afternoonCodes);

      const buildAssignment = (
        studentCode: string,
        nextSessionCode: SessionCode,
        orderIndex: number,
      ): CouncilAssignment => {
        const previous = existingAssignments.get(studentCode);
        const defaultRange = resolveManualAssignmentRange(
          scheduleMode,
          nextSessionCode,
          defaultStartTime,
          defaultEndTime,
        );
        const topicCode = String(
          previous?.topicCode ?? topicCodeByStudent.get(studentCode) ?? "",
        ).trim();

        return {
          assignmentId: previous?.assignmentId,
          studentCode,
          topicCode: topicCode || undefined,
          sessionCode: nextSessionCode,
          scheduledAt:
            normalizeDefenseDateOnly(
              previous?.scheduledAt ?? defaultDefenseDate,
            ) || defaultDefenseDate,
          startTime:
            normalizeTimeOnly(previous?.startTime ?? defaultRange.startTime) ||
            defaultRange.startTime,
          endTime:
            normalizeTimeOnly(previous?.endTime ?? defaultRange.endTime) ||
            defaultRange.endTime,
          orderIndex: Number(previous?.orderIndex ?? orderIndex) || orderIndex,
        };
      };

      return [
        ...selectedMorning.map((studentCode, index) =>
          buildAssignment(studentCode, "MORNING", index + 1),
        ),
        ...selectedAfternoon.map((studentCode, index) =>
          buildAssignment(studentCode, "AFTERNOON", index + 1),
        ),
      ];
    },
    [
      manualDefenseDate,
      manualScheduleMode,
      manualSessionCode,
      manualEndTime,
      manualStartTime,
      resolveManualAssignmentRange,
      students,
    ],
  );

  const allEligibleStudentCodes = useMemo(
    () => eligibleStudents.map((item: EligibleStudent) => item.studentCode),
    [eligibleStudents],
  );

  const applyManualSchedulePreset = useCallback(
    (scheduleMode: CouncilScheduleMode, sessionCode: SessionCode) => {
      if (scheduleMode === "FULL_DAY") {
        setManualStartTime(normalizeTimeOnly(morningStart));
        setManualEndTime(normalizeTimeOnly(afternoonEnd));
        return;
      }

      if (sessionCode === "AFTERNOON") {
        setManualStartTime(normalizeTimeOnly(afternoonStart));
        setManualEndTime(normalizeTimeOnly(afternoonEnd));
        return;
      }

      setManualStartTime(normalizeTimeOnly(morningStart));
      setManualEndTime(normalizeTimeOnly(morningEnd));
    },
    [afternoonEnd, afternoonStart, morningEnd, morningStart],
  );

  const applyManualTopicSelection = useCallback(
    (
      relatedCodes: string[],
      morningCodes: string[] = [],
      afternoonCodes: string[] = [],
      options?: {
        scheduleMode?: CouncilScheduleMode;
        sessionCode?: SessionCode;
        preserveAssignments?: boolean;
        existingAssignments?: CouncilAssignment[];
        assignmentDefaults?: {
          defenseDate?: string;
          startTime?: string;
          endTime?: string;
        };
      },
    ) => {
      const scheduleMode = options?.scheduleMode ?? manualScheduleMode;
      const oneSessionCode = options?.sessionCode ?? manualSessionCode;
      const normalizedRelated = Array.from(
        new Set(
          relatedCodes.map((code) => String(code ?? "").trim()).filter(Boolean),
        ),
      );
      const relatedSet = new Set(normalizedRelated);

      let nextMorning = Array.from(
        new Set(
          morningCodes.map((code) => String(code ?? "").trim()).filter(Boolean),
        ),
      ).filter((code) => relatedSet.has(code));
      let nextAfternoon = Array.from(
        new Set(
          afternoonCodes
            .map((code) => String(code ?? "").trim())
            .filter(Boolean),
        ),
      ).filter((code) => relatedSet.has(code) && !nextMorning.includes(code));

      const assignedSet = new Set([...nextMorning, ...nextAfternoon]);
      const unassigned = normalizedRelated.filter(
        (code) => !assignedSet.has(code),
      );

      if (scheduleMode === "ONE_SESSION") {
        const combined = Array.from(
          new Set([...nextMorning, ...nextAfternoon, ...unassigned]),
        );
        if (oneSessionCode === "AFTERNOON") {
          nextMorning = [];
          nextAfternoon = combined;
        } else {
          nextMorning = combined;
          nextAfternoon = [];
        }
      } else {
        unassigned.forEach((code) => {
          if (nextMorning.length <= nextAfternoon.length) {
            nextMorning.push(code);
          } else {
            nextAfternoon.push(code);
          }
        });
      }

      const nextAssignments = buildManualAssignments(
        normalizedRelated,
        nextMorning,
        nextAfternoon,
        {
          scheduleMode,
          sessionCode: oneSessionCode,
          existingAssignments:
            options?.existingAssignments ??
            (options?.preserveAssignments === false ? [] : manualAssignments),
        },
      );

      setManualRelatedStudents(normalizedRelated);
      setManualMorningStudents(nextMorning);
      setManualAfternoonStudents(nextAfternoon);
      setManualAssignments(nextAssignments);
      setManualUnrelatedStudents(
        allEligibleStudentCodes.filter((code) => !relatedSet.has(code)),
      );
    },
    [
      allEligibleStudentCodes,
      buildManualAssignments,
      manualAssignments,
      manualScheduleMode,
      manualSessionCode,
    ],
  );

  const getManualTopicSessionCode = useCallback(
    (studentCode: string): SessionCode =>
      manualAfternoonStudents.includes(studentCode) ? "AFTERNOON" : "MORNING",
    [manualAfternoonStudents],
  );

  const assignTopicToSession = (
    studentCode: string,
    sessionCode: SessionCode,
  ) => {
    if (!manualRelatedStudents.includes(studentCode)) {
      return;
    }
    const nextMorning = manualMorningStudents.filter(
      (code) => code !== studentCode,
    );
    const nextAfternoon = manualAfternoonStudents.filter(
      (code) => code !== studentCode,
    );
    if (sessionCode === "AFTERNOON") {
      nextAfternoon.push(studentCode);
    } else {
      nextMorning.push(studentCode);
    }
    applyManualTopicSelection(
      manualRelatedStudents,
      nextMorning,
      nextAfternoon,
      {
        scheduleMode: "FULL_DAY",
        sessionCode,
      },
    );
    const defaultRange = resolveManualAssignmentRange("FULL_DAY", sessionCode);
    setManualAssignments((prev) =>
      prev.map((assignment) =>
        assignment.studentCode === studentCode
          ? {
              ...assignment,
              sessionCode,
              scheduledAt:
                normalizeDefenseDateOnly(manualDefenseDate) ||
                manualDefenseDate,
              startTime: defaultRange.startTime,
              endTime: defaultRange.endTime,
            }
          : assignment,
      ),
    );
  };

  const updateManualAssignment = useCallback(
    (
      studentCode: string,
      updater: (assignment: CouncilAssignment) => CouncilAssignment,
    ) => {
      setManualAssignments((prev) =>
        prev.map((assignment) =>
          assignment.studentCode === studentCode
            ? updater(assignment)
            : assignment,
        ),
      );
    },
    [],
  );

  const resetManualForm = (defaultId?: string) => {
    const preferredTags =
      normalizedConfigCouncilTagCodes.length > 0
        ? normalizedConfigCouncilTagCodes
        : Array.from(
            new Set(
              allTags
                .slice(0, 2)
                .map((tag) => resolveTagCode(tag))
                .filter((tag) => tag.length > 0),
            ),
          );

    const autoPicked = pickStudentsByTags(preferredTags);
    setManualId(defaultId ?? nextGeneratedCouncilId);
    setManualName("Hội đồng mới");
    setManualDefenseDate("2026-04-24");
    setManualRoom(normalizeRoomCode(selectedRooms[0] ?? roomOptions[0] ?? ""));
    setManualScheduleMode("FULL_DAY");
    setManualSessionCode("MORNING");
    applyManualSchedulePreset("FULL_DAY", "MORNING");
    setManualCouncilTags(preferredTags);
    const selectedCodes = Array.from(
      new Set([...autoPicked.morning, ...autoPicked.afternoon]),
    );
    applyManualTopicSelection(
      selectedCodes,
      autoPicked.morning,
      autoPicked.afternoon,
      {
        scheduleMode: "FULL_DAY",
        sessionCode: "MORNING",
        preserveAssignments: false,
        assignmentDefaults: {
          defenseDate: "2026-04-24",
        },
      },
    );
    setManualMembers(buildDefaultManualMembers(expectedManualMemberCount));
    setCreateStep(1);
    setManualSnapshot(null);
    setManualReadOnly(false);
  };

  const startCreateCouncil = () => {
    setManualMode("create");
    resetManualForm(nextGeneratedCouncilId);
    notifyInfo("Mở biểu mẫu thêm hội đồng mới.");
  };

  const toggleConfigCouncilTag = (tag: string) => {
    const normalizedTag = resolveTagCode(tag);
    if (!normalizedTag) {
      return;
    }
    setCouncilConfigConfirmed(false);
    setConfigCouncilTags((prev: string[]) =>
      prev.includes(normalizedTag)
        ? prev.filter((item: string) => item !== normalizedTag)
        : [...prev, normalizedTag],
    );
  };

  const toggleManualCouncilTag = (tag: string) => {
    const normalizedTag = resolveTagCode(tag);
    if (!normalizedTag) {
      return;
    }
    setManualCouncilTags((prev: string[]) => {
      const next = prev.includes(normalizedTag)
        ? prev.filter((item: string) => item !== normalizedTag)
        : [...prev, normalizedTag];
      const autoPicked = pickStudentsByTags(next);
      const selectedCodes = Array.from(
        new Set([...autoPicked.morning, ...autoPicked.afternoon]),
      );
      applyManualTopicSelection(
        selectedCodes,
        autoPicked.morning,
        autoPicked.afternoon,
      );
      return next;
    });
  };

  const moveTopicToRelated = (studentCode: string) => {
    const nextRelated = Array.from(
      new Set([...manualRelatedStudents, studentCode]),
    );
    applyManualTopicSelection(
      nextRelated,
      manualMorningStudents,
      manualAfternoonStudents,
    );
  };

  const moveTopicToUnrelated = (studentCode: string) => {
    const nextRelated = manualRelatedStudents.filter(
      (code) => code !== studentCode,
    );
    applyManualTopicSelection(
      nextRelated,
      manualMorningStudents.filter((code) => code !== studentCode),
      manualAfternoonStudents.filter((code) => code !== studentCode),
    );
  };

  const startEditCouncil = (councilId?: string, readOnly = false) => {
    const target = councilId
      ? (editableDrafts.find((item: CouncilDraft) => item.id === councilId) ??
        null)
      : selectedCouncil;
    if (!target) {
      notifyWarning("Không tìm thấy hội đồng để thao tác.");
      return;
    }
    setManualMode("edit");
    setSelectedCouncilId(target.id);
    const normalizedCouncilTags = Array.from(
      new Set(
        target.councilTags
          .map((tag) => resolveTagCode(tag))
          .filter((tag) => tag.length > 0),
      ),
    );
    const inferredScheduleMode: CouncilScheduleMode =
      target.morningStudents.length > 0 && target.afternoonStudents.length > 0
        ? "FULL_DAY"
        : "ONE_SESSION";
    const inferredSessionCode: SessionCode =
      inferredScheduleMode === "ONE_SESSION"
        ? target.afternoonStudents.length > 0
          ? "AFTERNOON"
          : "MORNING"
        : (target.sessionCode ?? normalizeSessionCode(target.session));
    const normalizedMembers = target.members.map((member, index) => ({
      ...member,
      role: normalizeManualMemberRoleCode(member.role, index),
    }));
    while (normalizedMembers.length < expectedManualMemberCount) {
      normalizedMembers.push({
        role:
          normalizedMembers.length === 0
            ? "CT"
            : normalizedMembers.length === 1
              ? "TK"
              : "UV",
        lecturerCode: "",
        lecturerName: "",
      });
    }
    const selectedCodes = Array.from(
      new Set([...target.morningStudents, ...target.afternoonStudents]),
    );
    setManualId(target.id);
    setManualName(target.name ?? target.id);
    setManualDefenseDate(target.defenseDate);
    setManualRoom(normalizeRoomCode(target.room));
    setManualScheduleMode(inferredScheduleMode);
    setManualSessionCode(inferredSessionCode);
    setManualStartTime(normalizeTimeOnly(target.startTime ?? morningStart));
    setManualEndTime(normalizeTimeOnly(target.endTime ?? afternoonEnd));
    setManualCouncilTags(normalizedCouncilTags);
    applyManualTopicSelection(
      selectedCodes,
      target.morningStudents,
      target.afternoonStudents,
      {
        scheduleMode: inferredScheduleMode,
        sessionCode: inferredSessionCode,
        existingAssignments: target.assignments ?? [],
        assignmentDefaults:
          inferredScheduleMode === "ONE_SESSION"
            ? {
                defenseDate: target.defenseDate,
                startTime:
                  normalizeTimeOnly(target.startTime ?? manualStartTime) ||
                  normalizeTimeOnly(
                    inferredSessionCode === "AFTERNOON"
                      ? afternoonStart
                      : morningStart,
                  ) ||
                  (inferredSessionCode === "AFTERNOON"
                    ? afternoonStart
                    : morningStart),
                endTime:
                  normalizeTimeOnly(target.endTime ?? manualEndTime) ||
                  normalizeTimeOnly(
                    inferredSessionCode === "AFTERNOON"
                      ? afternoonEnd
                      : morningEnd,
                  ) ||
                  (inferredSessionCode === "AFTERNOON"
                    ? afternoonEnd
                    : morningEnd),
              }
            : {
                defenseDate: target.defenseDate,
              },
      },
    );
    setManualMembers(normalizedMembers);
    setCreateStep(1);
    setManualSnapshot({
      id: target.id,
      councilId: target.councilId,
      name: target.name ?? target.id,
      concurrencyToken: target.concurrencyToken,
      defenseDate: target.defenseDate,
      room: target.room,
      scheduleMode: inferredScheduleMode,
      sessionCode: inferredSessionCode,
      startTime: normalizeTimeOnly(target.startTime ?? morningStart),
      endTime: normalizeTimeOnly(target.endTime ?? afternoonEnd),
      tags: [...normalizedCouncilTags],
      morning: [...target.morningStudents],
      afternoon: [...target.afternoonStudents],
      assignments: target.assignments ? [...target.assignments] : [],
      members: [...normalizedMembers],
    });
    setManualReadOnly(readOnly);
    notifyInfo(
      readOnly
        ? "Đang ở chế độ xem chi tiết hội đồng."
        : "Đang ở chế độ chỉnh sửa hội đồng.",
    );
  };

  const deleteSelectedCouncil = async (councilId?: string) => {
    const target = councilId
      ? (editableDrafts.find((item: CouncilDraft) => item.id === councilId) ??
        null)
      : selectedCouncil;
    if (!target) {
      notifyWarning("Không tìm thấy hội đồng để xóa.");
      return;
    }
    try {
      setActionInFlight(`Xóa hội đồng ${target.id}`);
      const response = await adminApi.deleteCouncil(
        target.id,
        target.concurrencyToken,
      );
      const parsed = parseApiEnvelope(response);
      if (!parsed.ok) {
        return;
      }
      await reloadCouncilsFromBackend();
      setManualMode(null);
      setManualReadOnly(false);
      notifySuccess(`Đã xóa hội đồng ${target.id}.`);
    } catch {
      notifyError(
        `Không xóa được hội đồng ${target.id}. Vui lòng tải lại dữ liệu và thử lại.`,
      );
    } finally {
      setActionInFlight(null);
    }
  };

  const updateManualMember = (index: number, lecturerCode: string) => {
    const normalizedCode = String(lecturerCode ?? "").trim();
    const selectedLecturer = manualLecturerOptions.find(
      (lecturer) => lecturer.lecturerCode === normalizedCode,
    );
    const lecturerName = normalizedCode
      ? (selectedLecturer?.lecturerName ??
        getLecturerNameByCode(normalizedCode))
      : "";
    setManualMembers((prev: CouncilMember[]) =>
      prev.map((member: CouncilMember, idx: number) =>
        idx === index
          ? {
              ...member,
              lecturerCode: normalizedCode,
              lecturerName,
            }
          : member,
      ),
    );
  };

  const updateManualMemberRole = (index: number, role: string) => {
    setManualMembers((prev: CouncilMember[]) =>
      prev.map((member: CouncilMember, idx: number) => {
        if (idx !== index) {
          return member;
        }

        if (index < FIXED_MANUAL_MEMBER_SLOT_COUNT) {
          return member;
        }

        const normalizedRole = normalizeManualMemberRoleCode(role, index);
        if (!normalizedRole) {
          return member;
        }

        const currentCode = String(member.lecturerCode ?? "").trim();
        if (!currentCode) {
          return { ...member, role: normalizedRole };
        }

        const selectedInOtherSlot = prev.some(
          (candidate, candidateIndex) =>
            candidateIndex !== index &&
            String(candidate.lecturerCode ?? "").trim() === currentCode,
        );
        const invalidForChair =
          isChairRole(normalizedRole) &&
          !isDoctorDegree(getLecturerDegreeByCode(currentCode));

        if (selectedInOtherSlot || invalidForChair) {
          return {
            ...member,
            role: normalizedRole,
            lecturerCode: "",
            lecturerName: "",
          };
        }

        return {
          ...member,
          role: normalizedRole,
        };
      }),
    );
  };

  const addManualMemberSlot = () => {
    setManualMembers((prev) => {
      if (prev.length >= expectedManualMemberCount) {
        notifyWarning(
          `Số lượng thành viên phải đúng ${expectedManualMemberCount} theo cấu hình đợt.`,
        );
        return prev;
      }
      return [
        ...prev,
        {
          role: "UV",
          lecturerCode: "",
          lecturerName: "",
        },
      ];
    });
  };

  const removeManualMemberSlot = (index: number) => {
    if (index < FIXED_MANUAL_MEMBER_SLOT_COUNT) {
      return;
    }

    setManualMembers((prev) => {
      if (prev.length <= expectedManualMemberCount) {
        notifyWarning(
          `Không thể giảm dưới ${expectedManualMemberCount} thành viên theo cấu hình đợt.`,
        );
        return prev;
      }
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const proceedCreateStep = (targetStep: 1 | 2 | 3) => {
    const normalizedManualName = String(manualName ?? "").trim();
    const normalizedManualRoom = normalizeRoomCode(manualRoom);

    if (targetStep >= 2 && !normalizedManualName) {
      notifyError("Bước 1 chưa đầy đủ: vui lòng nhập tên hội đồng.");
      return;
    }

    if (targetStep >= 2 && (!manualDefenseDate || !normalizedManualRoom)) {
      notifyError("Bước 1 chưa đầy đủ: vui lòng chọn ngày và phòng.");
      return;
    }

    if (targetStep >= 2 && !roomOptions.includes(normalizedManualRoom)) {
      notifyError(
        "Phòng hội đồng không hợp lệ hoặc không thuộc danh mục phòng của đợt.",
      );
      return;
    }

    if (targetStep >= 2 && normalizedManualCouncilTagCodes.length === 0) {
      notifyError(
        "Bước 1 chưa hoàn tất: vui lòng chọn ít nhất 1 tag hội đồng.",
      );
      return;
    }
    if (
      targetStep >= 2 &&
      manualScheduleMode === "ONE_SESSION" &&
      normalizeTimeOnly(manualStartTime) >= normalizeTimeOnly(manualEndTime)
    ) {
      notifyError(
        "Khung giờ 1 buổi không hợp lệ: giờ bắt đầu phải nhỏ hơn giờ kết thúc.",
      );
      return;
    }
    if (
      targetStep >= 2 &&
      normalizeTimeOnly(manualStartTime) >= normalizeTimeOnly(manualEndTime)
    ) {
      notifyError(
        "Khung giờ hội đồng không hợp lệ: giờ bắt đầu phải nhỏ hơn giờ kết thúc.",
      );
      return;
    }
    if (targetStep === 3) {
      const memberValidationMessage = validateManualMemberSetup();
      if (memberValidationMessage) {
        notifyError(memberValidationMessage);
        return;
      }
    }
    setCreateStep(targetStep);
    notifySuccess(`Đã chuyển sang bước ${targetStep}.`);
  };

  const enableEditFromDetail = () => {
    if (!window.confirm("Bật chế độ chỉnh sửa cho hội đồng này?")) return;
    setManualReadOnly(false);
    notifyInfo("Đã bật chỉnh sửa. Bạn có thể lưu hoặc hủy chỉnh sửa.");
  };

  const cancelManualEdit = () => {
    if (!manualSnapshot) {
      setManualMode(null);
      return;
    }
    if (
      !window.confirm("Hủy các thay đổi chưa lưu và quay lại dữ liệu ban đầu?")
    )
      return;
    setManualId(manualSnapshot.id);
    setManualName(manualSnapshot.name);
    setManualDefenseDate(manualSnapshot.defenseDate);
    setManualRoom(normalizeRoomCode(manualSnapshot.room));
    setManualScheduleMode(manualSnapshot.scheduleMode);
    setManualSessionCode(manualSnapshot.sessionCode);
    setManualStartTime(manualSnapshot.startTime);
    setManualEndTime(manualSnapshot.endTime);
    setManualCouncilTags([...manualSnapshot.tags]);
    const selectedCodes = [
      ...manualSnapshot.morning,
      ...manualSnapshot.afternoon,
    ];
    applyManualTopicSelection(
      selectedCodes,
      manualSnapshot.morning,
      manualSnapshot.afternoon,
      {
        scheduleMode: manualSnapshot.scheduleMode,
        sessionCode: manualSnapshot.sessionCode,
        existingAssignments: manualSnapshot.assignments,
        assignmentDefaults:
          manualSnapshot.scheduleMode === "ONE_SESSION"
            ? {
                defenseDate: manualSnapshot.defenseDate,
                startTime: manualSnapshot.startTime,
                endTime: manualSnapshot.endTime,
              }
            : {
                defenseDate: manualSnapshot.defenseDate,
              },
      },
    );
    setManualAssignments([...manualSnapshot.assignments]);
    setManualMembers(
      manualSnapshot.members.map((member, index) => ({
        ...member,
        role: normalizeManualMemberRoleCode(member.role, index),
      })),
    );
    setManualReadOnly(true);
    notifyInfo("Đã hủy chỉnh sửa và khôi phục dữ liệu gốc.");
  };

  const saveManualCouncil = async () => {
    if (!manualMode) {
      notifyWarning("Không xác định được chế độ lưu hội đồng.");
      return;
    }

    const normalizedManualRoom = normalizeRoomCode(manualRoom);
    const normalizedManualDefenseDate =
      normalizeDefenseDateOnly(manualDefenseDate);
    const normalizedManualName = String(manualName ?? "").trim();
    const normalizedManualId = manualId.trim();
    const resolvedCouncilId =
      manualMode === "edit"
        ? (selectedCouncil?.id ?? manualSnapshot?.id ?? normalizedManualId)
        : (manualSnapshot?.id ?? normalizedManualId) || nextGeneratedCouncilId;
    const resolvedCouncilNumericId =
      manualMode === "edit"
        ? toPositiveInteger(
            selectedCouncil?.councilId ?? manualSnapshot?.councilId,
          )
        : toPositiveInteger(manualSnapshot?.councilId);
    const normalizedManualStartTime = normalizeTimeOnly(manualStartTime);
    const normalizedManualEndTime = normalizeTimeOnly(manualEndTime);
    const currentConcurrencyToken =
      manualSnapshot?.concurrencyToken ?? selectedCouncil?.concurrencyToken;
    const workflowCouncilId = resolvedCouncilNumericId ?? null;

    const draftAssignments =
      manualAssignments.length > 0
        ? manualAssignments
        : buildManualAssignments(
            manualRelatedStudents,
            manualMorningStudents,
            manualAfternoonStudents,
            {
              scheduleMode: manualScheduleMode,
              sessionCode: manualSessionCode,
              existingAssignments: [],
            },
          );

    if (manualMode === "edit" && manualReadOnly) {
      notifyWarning("Hãy bật chế độ chỉnh sửa trước khi lưu.");
      return;
    }

    if (!normalizedManualName) {
      notifyError("Vui lòng nhập tên hội đồng.");
      return;
    }

    if (!manualDefenseDate || !normalizedManualDefenseDate) {
      notifyError("Vui lòng chọn ngày bảo vệ.");
      return;
    }

    if (!manualRoom.trim() || !normalizedManualRoom) {
      notifyError("Vui lòng chọn phòng bảo vệ cho hội đồng.");
      return;
    }

    if (!roomOptions.includes(normalizedManualRoom)) {
      notifyError(
        "Phòng hội đồng không hợp lệ. Vui lòng chọn phòng nằm trong danh mục phòng của đợt.",
      );
      return;
    }

    if (!normalizedManualStartTime || !normalizedManualEndTime) {
      notifyError("Vui lòng cấu hình đầy đủ giờ bắt đầu và kết thúc.");
      return;
    }

    if (normalizedManualStartTime >= normalizedManualEndTime) {
      notifyError("Giờ bắt đầu phải nhỏ hơn giờ kết thúc.");
      return;
    }

    if (normalizedManualCouncilTagCodes.length === 0) {
      notifyError("Vui lòng chọn ít nhất 1 tag cho hội đồng.");
      return;
    }

    if (createStep >= 2) {
      const memberValidationMessage = validateManualMemberSetup();
      if (memberValidationMessage) {
        notifyError(memberValidationMessage);
        return;
      }
    }

    if (createStep >= 3) {
      if (manualRelatedStudents.length === 0) {
        notifyError("Vui lòng chọn ít nhất 1 đề tài liên quan cho hội đồng.");
        return;
      }

      if (draftAssignments.length === 0) {
        notifyError("Chưa có assignment hợp lệ để lưu bước 3.");
        return;
      }

      const allSelectedCodes = [
        ...manualMorningStudents,
        ...manualAfternoonStudents,
      ];
      if (new Set(allSelectedCodes).size !== allSelectedCodes.length) {
        notifyError("Danh sách đề tài theo buổi đang bị trùng lặp.");
        return;
      }

      if (
        manualScheduleMode === "FULL_DAY" &&
        (manualMorningStudents.length === 0 ||
          manualAfternoonStudents.length === 0)
      ) {
        notifyError(
          "Hội đồng cả ngày cần có đề tài cho cả buổi sáng và buổi chiều.",
        );
        return;
      }

      const invalidAssignment = draftAssignments.find((assignment) => {
        const topicCode = String(assignment.topicCode ?? "").trim();
        const scheduledAt = normalizeDefenseDateOnly(assignment.scheduledAt);
        const startTime = normalizeTimeOnly(assignment.startTime);
        const endTime = normalizeTimeOnly(assignment.endTime);
        return (
          !topicCode ||
          !scheduledAt ||
          !startTime ||
          !endTime ||
          Number(assignment.orderIndex ?? 0) <= 0
        );
      });
      if (invalidAssignment) {
        notifyError(
          "Bước 3 chưa hợp lệ: mỗi đề tài phải có ngày, giờ bắt đầu, giờ kết thúc và thứ tự.",
        );
        return;
      }
    }

    const draft: CouncilDraft = {
      id: resolvedCouncilId,
      councilId: resolvedCouncilNumericId,
      name: normalizedManualName,
      concurrencyToken: currentConcurrencyToken,
      room: normalizedManualRoom,
      defenseDate: normalizedManualDefenseDate,
      session: manualSessionCode === "AFTERNOON" ? "Chieu" : "Sang",
      sessionCode: manualSessionCode,
      startTime: normalizedManualStartTime,
      endTime: normalizedManualEndTime,
      slotId: `${resolvedCouncilId}-${manualSessionCode === "AFTERNOON" ? "PM" : "AM"}`,
      councilTags: normalizedManualCouncilTagCodes,
      morningStudents: manualMorningStudents,
      afternoonStudents: manualAfternoonStudents,
      assignments: draftAssignments.map((assignment, index) => ({
        ...assignment,
        topicCode: String(assignment.topicCode ?? "").trim() || undefined,
        scheduledAt:
          normalizeDefenseDateOnly(
            assignment.scheduledAt ?? normalizedManualDefenseDate,
          ) || normalizedManualDefenseDate,
        sessionCode: normalizeSessionCode(assignment.sessionCode),
        startTime:
          normalizeTimeOnly(
            assignment.startTime ?? normalizedManualStartTime,
          ) || normalizedManualStartTime,
        endTime:
          normalizeTimeOnly(assignment.endTime ?? normalizedManualEndTime) ||
          normalizedManualEndTime,
        orderIndex: Number(assignment.orderIndex ?? index + 1) || index + 1,
      })),
      forbiddenLecturers: [],
      members: manualMembers.map((member, index) => ({
        ...member,
        role: normalizeManualMemberRoleCode(member.role, index),
      })),
      warning: undefined,
    };

    const extractSavedCouncilMeta = (
      response: ApiResponse<Record<string, unknown>>,
      parsedData: unknown,
    ) => {
      const responseData =
        parsedData &&
        typeof parsedData === "object" &&
        !Array.isArray(parsedData)
          ? (parsedData as Record<string, unknown>)
          : {};
      const savedCouncilCode =
        String(
          pickCaseInsensitiveValue(
            responseData,
            [
              "committeeCode",
              "CommitteeCode",
              "councilCode",
              "CouncilCode",
              "id",
              "Id",
            ],
            draft.id,
          ),
        ).trim() || draft.id;
      const savedCouncilId =
        toPositiveInteger(
          pickCaseInsensitiveValue(
            responseData,
            [
              "councilId",
              "CouncilId",
              "committeeId",
              "CommitteeId",
              "id",
              "Id",
            ],
            draft.councilId ?? 0,
          ),
        ) ?? draft.councilId;
      const savedName =
        String(
          pickCaseInsensitiveValue(
            responseData,
            ["name", "Name", "councilName", "CouncilName"],
            draft.name ?? savedCouncilCode,
          ),
        ).trim() ||
        draft.name ||
        savedCouncilCode;
      const tokenFromData = String(
        pickCaseInsensitiveValue(
          responseData,
          ["concurrencyToken", "ConcurrencyToken"],
          draft.concurrencyToken ?? "",
        ) ??
          draft.concurrencyToken ??
          "",
      ).trim();
      const savedConcurrencyToken =
        readEnvelopeConcurrencyToken(response) ?? (tokenFromData || undefined);

      return {
        councilCode: savedCouncilCode,
        councilId: savedCouncilId,
        name: savedName,
        concurrencyToken: savedConcurrencyToken,
      };
    };

    try {
      if (createStep === 1) {
        if (manualMode === "edit" && !currentConcurrencyToken) {
          notifyError(
            "Thiếu concurrency token cho UPDATE_STEP1. Vui lòng tải lại dữ liệu hội đồng.",
          );
          return;
        }

        if (manualMode === "edit" && !workflowCouncilId) {
          notifyError(
            "Không xác định được councilId số nguyên cho UPDATE_STEP1.",
          );
          return;
        }

        setActionInFlight(`Lưu bước 1 hội đồng ${draft.id}`);
        const response = await adminApi.submitCouncilWorkflow({
          operation: manualMode === "create" ? "CREATE_STEP1" : "UPDATE_STEP1",
          ...(manualMode === "edit" && workflowCouncilId
            ? { councilId: workflowCouncilId }
            : {}),
          step1: buildCouncilStep1Payload(
            draft,
            manualMode === "edit" ? currentConcurrencyToken : undefined,
          ),
        });
        const parsed = parseApiEnvelope(response);
        if (!parsed.ok) {
          return;
        }

        const meta = extractSavedCouncilMeta(
          response,
          parsed.data as Record<string, unknown> | null,
        );
        setManualId(meta.councilCode);
        setManualName(meta.name);
        setSelectedCouncilId(meta.councilCode);
        setManualSnapshot({
          id: meta.councilCode,
          councilId: meta.councilId,
          name: meta.name,
          concurrencyToken: meta.concurrencyToken,
          defenseDate: draft.defenseDate,
          room: draft.room,
          scheduleMode: manualScheduleMode,
          sessionCode: draft.sessionCode ?? manualSessionCode,
          startTime: draft.startTime ?? normalizedManualStartTime,
          endTime: draft.endTime ?? normalizedManualEndTime,
          tags: [...draft.councilTags],
          morning: [...draft.morningStudents],
          afternoon: [...draft.afternoonStudents],
          assignments: draft.assignments ? [...draft.assignments] : [],
          members: draft.members.map((member, index) => ({
            ...member,
            role: normalizeManualMemberRoleCode(member.role, index),
          })),
        });
        setCreateStep(2);
        notifySuccess(`Đã lưu bước 1 cho hội đồng ${meta.councilCode}.`);
        return;
      }

      if (createStep === 2) {
        if (!currentConcurrencyToken) {
          notifyError(
            "Thiếu concurrency token cho SAVE_MEMBERS. Vui lòng lưu lại bước 1.",
          );
          return;
        }

        if (!workflowCouncilId) {
          notifyError(
            "Không xác định được councilId số nguyên để lưu thành viên.",
          );
          return;
        }

        setActionInFlight(`Lưu thành viên hội đồng ${draft.id}`);
        const response = await adminApi.submitCouncilWorkflow({
          councilId: workflowCouncilId,
          operation: "SAVE_MEMBERS",
          step2: buildCouncilStep2Payload(draft, currentConcurrencyToken),
        });
        const parsed = parseApiEnvelope(response);
        if (!parsed.ok) {
          return;
        }

        const meta = extractSavedCouncilMeta(
          response,
          parsed.data as Record<string, unknown> | null,
        );

        setManualSnapshot((prev) =>
          prev
            ? {
                ...prev,
                id: meta.councilCode,
                councilId: meta.councilId ?? prev.councilId,
                name: meta.name,
                concurrencyToken:
                  meta.concurrencyToken ?? prev.concurrencyToken,
                assignments: draft.assignments ? [...draft.assignments] : [],
                members: draft.members.map((member, index) => ({
                  ...member,
                  role: normalizeManualMemberRoleCode(member.role, index),
                })),
              }
            : prev,
        );
        setCreateStep(3);
        notifySuccess(`Đã lưu thành viên cho hội đồng ${draft.id}.`);
        return;
      }

      if (createStep === 3) {
        if (!currentConcurrencyToken) {
          notifyError(
            "Thiếu concurrency token cho SAVE_TOPICS. Vui lòng lưu lại bước trước.",
          );
          return;
        }

        if (!workflowCouncilId) {
          notifyError(
            "Không xác định được councilId số nguyên để lưu danh sách đề tài.",
          );
          return;
        }

        const step3Payload = buildCouncilStep3Payload(
          draft,
          currentConcurrencyToken,
          manualScheduleMode,
        );
        if (step3Payload.missingTopicCodes.length > 0) {
          notifyError(
            `Không tìm thấy topicCode cho các sinh viên: ${step3Payload.missingTopicCodes.join(", ")}.`,
          );
          return;
        }
        if (step3Payload.step3.assignments.length === 0) {
          notifyError(
            "Danh sách đề tài theo buổi đang rỗng, chưa thể lưu bước 3.",
          );
          return;
        }

        setActionInFlight(`Lưu đề tài hội đồng ${draft.id}`);
        const response = await adminApi.submitCouncilWorkflow({
          councilId: workflowCouncilId,
          operation: "SAVE_TOPICS",
          ...step3Payload,
        });
        const parsed = parseApiEnvelope(response);
        if (!parsed.ok) {
          return;
        }

        await reloadCouncilsFromBackend();
        await refreshBackendState();
        setManualMode(null);
        setManualReadOnly(false);
        notifySuccess(`Đã lưu hội đồng thủ công ${draft.id}.`);
        return;
      }

      notifyWarning("Không xác định được chế độ lưu hội đồng.");
    } catch {
      notifyError(
        "Không lưu được hội đồng. Vui lòng tải lại dữ liệu và thử lại.",
      );
    } finally {
      setActionInFlight(null);
    }
  };

  const closeManualModal = () => {
    if (
      !manualReadOnly &&
      manualMode === "edit" &&
      !window.confirm("Đóng cửa sổ chỉnh sửa? Các thay đổi chưa lưu sẽ mất.")
    ) {
      return;
    }
    setManualMode(null);
    setManualReadOnly(false);
  };

  const manualRelatedStudentView = buildStudentView(manualRelatedStudents);
  const manualUnrelatedStudentView = buildStudentView(manualUnrelatedStudents);
  const manualAssignmentByStudentCode = useMemo(
    () =>
      new Map(
        manualAssignments.map((assignment) => [
          assignment.studentCode,
          assignment,
        ]),
      ),
    [manualAssignments],
  );

  return (
    <div
      style={{
        maxWidth: 1360,
        margin: "0 auto",
        padding: 20,
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        position: "relative",
      }}
      className="committee-root"
    >
      <style>
        {`
          .committee-root {
            --adm-ink: #0f172a;
            --adm-muted: #64748b;
            --adm-main: #f37021;
            --adm-main-dark: #f37021;
            --adm-accent: #ffffff;
            --adm-line: #cbd5e1;
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            color: var(--adm-ink);
            background: radial-gradient(circle at 8% 0%, #ffffff 0%, #ffffff 34%);
            border-radius: 12px;
          }
          .committee-root h1,
          .committee-root h2,
          .committee-root h3 {
            line-height: 1.3;
            letter-spacing: -0.008em;
          }
          .committee-root .committee-kicker {
            font-size: 11px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            font-weight: 700;
            color: #0f172a;
            line-height: 1.35;
            margin-bottom: 4px;
          }
          .committee-root .committee-value {
            font-size: 24px;
            font-weight: 700;
            line-height: 1.2;
            color: #0f172a;
          }
          /* Removed module switch styles (module-switch, module-switch-btn) */
          .committee-toolbar {
            border: 1px solid #cbd5e1;
            border-radius: 12px;
            background: #ffffff;
            padding: 0 8px;
            display: flex;
            align-items: center;
            gap: 0;
            flex-wrap: wrap;
            border-bottom: 1px solid #e2e8f0;
          }
          .committee-hero {
            border-radius: 12px;
            padding: 16px 18px;
            color: #0f172a;
            background: linear-gradient(135deg, #ffffff 0%, #ffffff 100%);
            border: 1px solid #e2e8f0;
          }
          .committee-hero-grid {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            flex-wrap: wrap;
          }
          .committee-hero-title {
            margin: 0;
            font-size: 28px;
            color: #0f172a;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 700;
            line-height: 1.22;
            letter-spacing: -0.018em;
          }
          .committee-hero-sub {
            margin-top: 8px;
            color: #0f172a;
            font-size: 13px;
            line-height: 1.62;
            max-width: 62ch;
          }
          .committee-overview-grid {
            margin-top: 14px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 14px;
          }
          .committee-overview-card {
            background: #ffffff;
            border-radius: 18px;
            padding: 18px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
            display: grid;
            gap: 8px;
            min-height: 182px;
          }
          .committee-overview-label {
            font-size: 13px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-weight: 700;
            line-height: 1.3;
          }
          .committee-overview-value {
            font-size: 38px;
            font-weight: 800;
            line-height: 1;
            color: #1d3f91;
          }
          .committee-overview-meta {
            font-size: 13px;
            line-height: 1.52;
            color: #475569;
          }
          .committee-overview-icon {
            width: 40px;
            height: 40px;
            border-radius: 12px;
            background: #eef2ff;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 6px;
          }
          .committee-overview-icon-accent {
            background: #ecfeff;
          }
          .committee-overview-link {
            justify-self: start;
            border: 1px solid #22b8cf;
            border-radius: 999px;
            background: #f0fdff;
            color: #0891b2;
            min-height: 30px;
            padding: 0 14px;
            font-size: 12px;
            font-weight: 700;
          }
          .committee-overview-link:hover {
            background: #ccfbf1;
            border-color: #14b8a6;
          }
          .committee-overview-card-primary {
            background: linear-gradient(145deg, #1d3f91 0%, #1e3a8a 100%);
            border-color: rgba(255, 255, 255, 0.22);
            box-shadow: 0 14px 28px rgba(29, 63, 145, 0.28);
          }
          .committee-overview-card-primary .committee-overview-label,
          .committee-overview-card-primary .committee-overview-value,
          .committee-overview-card-primary .committee-overview-meta {
            color: #ffffff;
          }
          .committee-overview-icon-primary {
            background: rgba(255, 255, 255, 0.18);
          }
          @media (max-width: 980px) {
            .committee-hero-title {
              font-size: 24px;
            }
            .committee-overview-grid {
              grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            }
          }
          .committee-content {
            position: relative;
            z-index: 1;
          }
          .committee-primary-btn {
            border: none;
            border-radius: 10px;
            background: #f37021;
            color: #ffffff;
            padding: 0 16px;
            font-weight: 600;
            cursor: pointer;
            font-size: 14px;
            line-height: 1.2;
            min-height: 44px;
          }
          .committee-content .committee-primary-btn {
            color: #ffffff !important;
          }
          .committee-content .committee-accent-btn {
            color: #0f172a !important;
          }
          .committee-content .committee-ghost-btn {
            color: #0f172a !important;
          }
          .committee-content .committee-danger-btn {
            color: #b91c1c !important;
          }
          .committee-config-save-btn {
            width: 100%;
            white-space: nowrap;
          }
          .committee-config-actions {
            display: grid;
            grid-template-columns: minmax(0, 320px);
            gap: 8px;
            justify-content: start;
          }
          .committee-config-actions .committee-primary-btn {
            width: 100%;
            min-width: 0;
            white-space: nowrap;
          }
          .committee-modal-alert {
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            background: #f8fafc;
            color: #0f172a;
            padding: 10px 12px;
            font-size: 12px;
            font-weight: 600;
            line-height: 1.4;
          }
          .committee-modal-alert-error {
            border-color: #fecaca;
            background: #fef2f2;
            color: #b91c1c;
          }
          @media (max-width: 560px) {
            .committee-config-actions {
              grid-template-columns: 1fr;
            }
          }
          .committee-primary-btn:hover {
            background: #f37021;
            border-color: #f37021;
            transform: translateY(-1px);
          }
          .committee-primary-btn:disabled {
            border-color: #cbd5e1;
            background: #f8fafc;
            color: #64748b !important;
            box-shadow: none;
            cursor: not-allowed;
          }
          .committee-accent-btn {
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            background: #ffffff;
            color: #0f172a;
            padding: 8px 14px;
            font-weight: 600;
            min-height: 40px;
            cursor: pointer;
          }
          .committee-accent-btn:hover:not(:disabled) {
            border-color: #cbd5e1;
            background: #ffffff;
          }
          .committee-accent-btn:disabled {
            border-color: #cbd5e1;
            background: #f8fafc;
            color: #64748b;
            cursor: not-allowed;
          }
          .committee-ghost-btn {
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            background: #ffffff;
            color: #0f172a;
            padding: 8px 12px;
            font-weight: 600;
            min-height: 40px;
            cursor: pointer;
          }
          .committee-ghost-btn:hover:not(:disabled) {
            border-color: #cbd5e1;
            background: #ffffff;
          }
          .committee-danger-btn {
            border: 1px solid #fecaca;
            border-radius: 10px;
            background: #ffffff;
            color: #b91c1c;
            padding: 8px 12px;
            font-weight: 600;
            min-height: 40px;
            cursor: pointer;
          }
          .committee-danger-btn:hover:not(:disabled) {
            border-color: #fecaca;
            background: #fff7ed;
          }
          .committee-danger-btn:disabled {
            border-color: #fecaca;
            background: #ffffff;
            color: #b91c1c;
            opacity: .65;
            cursor: not-allowed;
          }
          .committee-tag-toggle {
            border: 1px solid #cbd5e1;
            border-radius: 999px;
            background: #ffffff;
            color: #0f172a;
            cursor: pointer;
            font-weight: 700;
            transition: border-color .2s ease, background-color .2s ease, color .2s ease, transform .2s ease, box-shadow .2s ease;
          }
          .committee-tag-toggle:hover:not(:disabled) {
            border-color: #f37021;
            transform: translateY(-1px);
          }
          .committee-tag-toggle.active {
            border-color: #f37021;
            background: #f37021;
            color: #ffffff;
            box-shadow: 0 6px 16px rgba(243, 112, 33, 0.28);
          }
          .committee-member-caption {
            font-size: 12px;
            color: #64748b;
            font-weight: 600;
            line-height: 1.4;
          }
          .committee-manual-members-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
            gap: 10px;
          }
          .committee-member-slot-card {
            border: 1px solid #cbd5e1;
            border-radius: 12px;
            padding: 10px;
            background: #ffffff;
            display: grid;
            gap: 8px;
          }
          .committee-member-slot-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 6px;
          }
          .committee-member-role-hint {
            border: 1px solid #fdba74;
            border-radius: 999px;
            background: #fff7ed;
            color: #c2410c;
            font-size: 10px;
            line-height: 1;
            padding: 4px 8px;
            font-weight: 700;
          }
          .committee-member-field {
            display: grid;
            gap: 4px;
          }
          .committee-member-field-label {
            font-size: 11px;
            font-weight: 700;
            color: #334155;
          }
          .committee-member-readonly-role {
            font-size: 12px;
            color: #334155;
            font-weight: 700;
          }
          .committee-member-meta {
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            background: #f8fafc;
            padding: 8px;
            font-size: 11px;
            color: #334155;
            display: grid;
            gap: 4px;
            line-height: 1.35;
          }
          .committee-member-warning {
            border: 1px solid #fed7aa;
            border-radius: 10px;
            background: #fff7ed;
            color: #c2410c;
            padding: 8px;
            font-size: 11px;
            font-weight: 700;
            line-height: 1.35;
          }
          .committee-member-remove-btn {
            width: 100%;
            margin-top: 2px;
          }
          .committee-manual-topic-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
            gap: 10px;
          }
          .committee-topic-panel {
            border: 1px solid #cbd5e1;
            border-radius: 12px;
            background: #ffffff;
            padding: 10px;
            display: grid;
            gap: 8px;
            min-height: 320px;
          }
          .committee-topic-panel-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            font-size: 12px;
            font-weight: 700;
            color: #0f172a;
          }
          .committee-topic-panel-list {
            display: grid;
            gap: 8px;
            max-height: 430px;
            overflow: auto;
            padding-right: 2px;
          }
          .committee-topic-item {
            border: 1px solid #dbeafe;
            border-radius: 10px;
            background: #ffffff;
            padding: 10px;
            display: grid;
            gap: 6px;
          }
          .committee-topic-item--selected {
            border-color: #fdba74;
            background: #fff7ed;
          }
          .committee-topic-item-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 6px;
          }
          .committee-topic-item-code {
            font-size: 11px;
            font-weight: 800;
            color: #1e293b;
          }
          .committee-topic-item-student-code {
            border: 1px solid #cbd5e1;
            border-radius: 999px;
            padding: 2px 8px;
            font-size: 10px;
            font-weight: 700;
            color: #334155;
            background: #ffffff;
          }
          .committee-topic-item-title {
            font-size: 13px;
            font-weight: 700;
            color: #0f172a;
            line-height: 1.4;
          }
          .committee-topic-item-meta {
            font-size: 11px;
            color: #475569;
            line-height: 1.35;
          }
          .committee-topic-item-action {
            margin-top: 2px;
            width: fit-content;
            min-height: 28px;
            padding: 2px 8px;
          }
          .committee-topic-empty {
            border: 1px dashed #cbd5e1;
            border-radius: 10px;
            padding: 12px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            background: #f8fafc;
          }
          .committee-icon-btn {
            width: 34px;
            height: 34px;
            min-height: 34px;
            border-radius: 8px;
            padding: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0;
          }
          .committee-icon-btn:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
          }
          .committee-inline-icon-label {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            white-space: nowrap;
            line-height: 1.15;
            min-width: 0;
          }
          .committee-inline-icon-label svg {
            flex-shrink: 0;
          }
          .committee-modal-step-btn {
            white-space: nowrap;
          }
          .committee-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(15,23,42,0.45);
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding: 24px 16px;
            overflow-y: auto;
            z-index: 2600;
          }
          .committee-modal {
            width: min(1180px, calc(100vw - 32px));
            max-height: calc(100vh - 48px);
            overflow-y: auto;
            overflow-x: hidden;
            border-radius: 12px;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            padding: 16px;
            color: #0f172a;
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          }
          .committee-modal,
          .committee-modal * {
            box-sizing: border-box;
          }
          .committee-modal-head {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 10px;
            margin-bottom: 12px;
          }
          .committee-modal-title {
            font-size: 20px;
            line-height: 1.25;
            font-weight: 700;
            color: #0f172a;
            word-break: break-word;
          }
          .committee-modal-sub {
            margin-top: 4px;
            font-size: 13px;
            color: #0f172a;
          }
          .committee-modal-body {
            display: grid;
            gap: 12px;
            overflow-x: hidden;
          }
          .committee-modal-grid-3 {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 10px;
          }
          .committee-modal-card {
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            background: #ffffff;
            padding: 10px;
            display: grid;
            gap: 6px;
          }
          .committee-modal input,
          .committee-modal select {
            width: 100%;
            min-width: 0;
            height: 42px;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            padding: 0 12px;
            font-size: 14px;
            color: #0f172a;
            background: #ffffff;
            line-height: 1.2;
          }
          .committee-modal select,
          .committee-content select {
            padding-right: 34px;
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
            background-image: linear-gradient(45deg, transparent 50%, #f37021 50%), linear-gradient(135deg, #f37021 50%, transparent 50%);
            background-position: calc(100% - 18px) calc(50% - 2px), calc(100% - 13px) calc(50% - 2px);
            background-size: 5px 5px, 5px 5px;
            background-repeat: no-repeat;
          }
          .committee-content select {
            width: 100%;
            min-width: 0;
            height: 42px;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            padding: 0 12px;
            font-size: 14px;
            color: #0f172a;
            background-color: #ffffff;
            line-height: 1.2;
          }
          .committee-council-select {
            height: 38px;
            padding: 0 10px;
            font-size: 13px;
          }
          .committee-council-select option {
            font-size: 13px;
          }
          .committee-modal input:focus,
          .committee-modal select:focus {
            outline: none;
            border-color: #f37021;
            box-shadow: 0 0 0 3px rgba(243, 112, 33, 0.16);
          }
          .committee-content select:focus {
            outline: none;
            border-color: #f37021;
            box-shadow: 0 0 0 3px rgba(243, 112, 33, 0.16);
          }
          .committee-content select option,
          .committee-modal select option {
            background: #ffffff;
            color: #0f172a;
            font-size: 14px;
          }
          .committee-content select option:checked,
          .committee-modal select option:checked {
            background: #ffffff;
            color: #0f172a;
            font-weight: 700;
          }
          .committee-modal-label {
            font-size: 12px;
            color: #0f172a;
            font-weight: 600;
          }
          .committee-modal-value {
            font-size: 15px;
            color: #0f172a;
            font-weight: 600;
          }
          .committee-supervisor-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 12px;
            overflow: hidden;
          }
          .committee-supervisor-table th,
          .committee-supervisor-table td {
            padding: 8px;
            border-top: 1px solid #e2e8f0;
            text-align: left;
            vertical-align: top;
          }
          .committee-supervisor-table thead th {
            border-top: 0;
            background: #ffffff;
            color: #0f172a;
            font-size: 12px;
            font-weight: 600;
          }
          .committee-content button,
          .committee-content input,
          .committee-content textarea,
          .committee-content select {
            transition: all 0.22s ease;
          }
          .committee-content button {
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            font-weight: 600;
            font-size: 13px;
            border-radius: 10px;
            color: #0f172a;
          }
          .committee-content button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            line-height: 1.15;
          }
          .committee-content input:focus,
          .committee-content textarea:focus,
          .committee-content select:focus {
            outline: none;
            border-color: #f37021;
            box-shadow: 0 0 0 3px rgba(243, 112, 33, 0.16);
          }
          .committee-content table tbody tr {
            transition: background-color 0.2s ease;
          }
          .committee-content table tbody tr:hover {
            background: #ffffff;
          }
          .committee-modal-summary {
            border: 1px solid #cbd5e1;
            border-radius: 12px;
            background: #f8fafc;
            padding: 12px;
            display: grid;
            gap: 10px;
          }
          .committee-modal-summary-row {
            display: flex;
            flex-wrap: wrap;
            align-items: flex-start;
            gap: 8px;
          }
          .committee-modal-summary-label {
            min-width: 96px;
            font-size: 12px;
            font-weight: 700;
            color: #0f172a;
            line-height: 1.4;
            padding-top: 2px;
          }
          .committee-modal-summary-meta {
            font-size: 12px;
            color: #475569;
            font-weight: 600;
            line-height: 1.4;
            padding-top: 2px;
          }
          .committee-modal-chip-list {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            min-width: 0;
          }
          .committee-modal-chip {
            border: 1px solid #cbd5e1;
            border-radius: 999px;
            background: #ffffff;
            color: #0f172a;
            font-size: 11px;
            font-weight: 700;
            line-height: 1.2;
            padding: 4px 8px;
            white-space: nowrap;
          }
          .committee-modal-chip--status {
            border-color: #0f172a;
            background: #0f172a;
            color: #ffffff;
          }
          .committee-modal-chip--warning {
            border-color: #fed7aa;
            background: #fff7ed;
            color: #c2410c;
          }
          .committee-modal-chip--muted {
            border-color: #e2e8f0;
            background: #ffffff;
            color: #64748b;
          }
          .committee-modal-cell-stack {
            display: grid;
            gap: 4px;
          }
          .committee-modal-cell-title {
            font-weight: 700;
            color: #0f172a;
            line-height: 1.25;
            word-break: break-word;
          }
          .committee-modal-cell-subtitle {
            font-size: 11px;
            color: #64748b;
            font-weight: 600;
            line-height: 1.35;
          }
          .committee-auto-options {
            display: grid;
            gap: 8px;
            margin-top: 4px;
          }
          .committee-auto-option-row {
            display: grid;
            grid-template-columns: 18px minmax(0, 1fr);
            gap: 8px;
            align-items: start;
            font-size: 13px;
            line-height: 1.35;
            color: #0f172a;
          }
          .committee-auto-option-row input[type="checkbox"] {
            width: 16px;
            height: 16px;
            margin: 2px 0 0;
            accent-color: #f37021;
          }
          .committee-auto-option-label {
            font-size: 13px;
            line-height: 1.35;
            word-break: break-word;
          }
          .committee-auto-option-field {
            display: grid;
            gap: 6px;
          }
          .committee-auto-option-field > span {
            font-size: 12px;
            font-weight: 600;
            color: #0f172a;
          }
          .committee-auto-option-field > input {
            width: 100%;
            min-height: 38px;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            padding: 0 12px;
            background: #ffffff;
            color: #0f172a;
            font-size: 13px;
            line-height: 1.2;
          }
          .committee-data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          .committee-data-table thead {
            background: #ffffff;
          }
          .committee-data-table thead th {
            text-align: left;
            padding: 11px 12px;
            border-bottom: 1px solid #e2e8f0;
            color: #0f172a;
            font-size: 12px;
            font-weight: 700;
            white-space: nowrap;
          }
          .committee-data-table tbody td {
            padding: 11px 12px;
            border-top: 1px solid #e2e8f0;
            line-height: 1.35;
            color: #0f172a;
            vertical-align: middle;
          }
          .prepare-room-title {
            font-size: 14px;
            font-weight: 700;
            margin-top: 12px;
            margin-bottom: 8px;
            color: #0f172a;
          }
          .prepare-room-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 14px;
          }
          .prepare-room-chip {
            border: 1px solid #cbd5e1;
            border-radius: 999px;
            min-height: 36px;
            padding: 0 12px;
            background: #ffffff;
            color: #0f172a;
            font-weight: 700;
            font-size: 12px;
            line-height: 1;
            cursor: pointer;
            transition: border-color .2s ease, background-color .2s ease, transform .2s ease;
          }
          .prepare-room-chip:hover {
            border-color: #cbd5e1;
            background: #ffffff;
            transform: translateY(-1px);
          }
          .prepare-room-chip.active {
            border-color: #f37021;
            background: #f37021;
            color: #ffffff;
            box-shadow: 0 6px 14px rgba(243, 112, 33, 0.2);
          }
          .prepare-time-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 12px;
          }
          .prepare-field {
            display: grid;
            gap: 8px;
          }
          .prepare-field span {
            font-size: 12px;
            color: #0f172a;
            font-weight: 600;
            letter-spacing: 0.02em;
          }
          .prepare-field > input {
            width: 100%;
            min-height: 40px;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            padding: 0 12px;
            background: #ffffff;
            color: #0f172a;
            font-size: 14px;
            line-height: 1.2;
          }
          .prepare-picker {
            position: relative;
            min-width: 0;
          }
          .prepare-picker-compact {
            min-width: 72px;
            max-width: 72px;
          }
          .prepare-picker-year {
            min-width: 94px;
            max-width: 94px;
          }
          .prepare-picker-wide {
            min-width: 112px;
            max-width: 112px;
          }
          .prepare-picker-mini {
            min-width: 64px;
            max-width: 64px;
          }
          .prepare-picker-trigger {
            width: 100%;
            min-height: 34px;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            background: #ffffff;
            color: #0f172a;
            padding: 0 10px;
            display: inline-flex;
            align-items: center;
            justify-content: space-between;
            gap: 6px;
            cursor: pointer;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
            transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease, background-color .2s ease;
          }
          .prepare-picker-trigger:hover {
            border-color: #cbd5e1;
            background: #ffffff;
            transform: translateY(-1px);
            box-shadow: 0 4px 10px rgba(243, 112, 33, 0.06);
          }
          .prepare-picker-trigger:focus {
            outline: none;
          }
          .prepare-picker-trigger:focus-visible {
            border-color: #f37021;
            box-shadow: 0 0 0 3px rgba(243, 112, 33, 0.16);
          }
          .prepare-picker-value {
            font-size: 13px;
            font-weight: 600;
            color: #0f172a;
            line-height: 1;
            white-space: nowrap;
          }
          .prepare-picker-caret {
            font-size: 10px;
            color: #0f172a;
            transform: translateY(-1px);
          }
          .prepare-picker-menu {
            position: absolute;
            top: calc(100% + 4px);
            left: 0;
            z-index: 25;
            min-width: 100%;
            max-height: 210px;
            overflow: auto;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            box-shadow: 0 6px 14px rgba(0,0,0,0.12);
            padding: 4px;
          }
          .prepare-picker {
            position: relative;
            min-width: 0;
          }
          .prepare-picker-compact {
            min-width: 64px;
            max-width: 64px;
          }
          .prepare-picker-mini {
            min-width: 42px;
            max-width: 42px;
          }
          .prepare-picker-trigger {
            width: 100%;
            min-height: 34px;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            background: #ffffff;
            color: #0f172a;
            padding: 0 8px;
            display: inline-flex;
            align-items: center;
            justify-content: space-between;
            gap: 6px;
            cursor: pointer;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
            transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease, background-color .2s ease;
          }
          .prepare-picker-trigger:hover {
            border-color: #cbd5e1;
            background: #ffffff;
            transform: translateY(-1px);
            box-shadow: 0 4px 10px rgba(243, 112, 33, 0.06);
          }
          .prepare-picker-trigger:focus {
            outline: none;
          }
          .prepare-picker-trigger:focus-visible {
            border-color: #f37021;
            box-shadow: 0 0 0 3px rgba(243, 112, 33, 0.16);
          }
          .prepare-picker-value {
            font-size: 13px;
            font-weight: 700;
            color: #0f172a;
            line-height: 1;
            white-space: nowrap;
          }
          .prepare-picker-caret {
            font-size: 10px;
            color: #0f172a;
            transform: translateY(-1px);
          }
          .prepare-picker-menu {
            position: absolute;
            top: calc(100% + 4px);
            left: 0;
            z-index: 25;
            min-width: 100%;
            max-height: 210px;
            overflow: auto;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            box-shadow: 0 6px 14px rgba(0,0,0,0.12);
            padding: 4px;
          }
          .prepare-picker-item {
            width: 100%;
            border: 0;
            background: transparent;
            color: #0f172a;
            border-radius: 8px;
            min-height: 30px;
            padding: 0 8px;
            text-align: left;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color .16s ease, color .16s ease, transform .16s ease;
          }
          .prepare-picker-item:hover {
            background: #ffffff;
            color: #0f172a;
            transform: translateX(1px);
          }
          .prepare-picker-item.active {
            background: #fff7ed;
            color: #9a3412;
            border-color: #fdba74;
            box-shadow: inset 0 0 0 1px rgba(243, 112, 33, 0.12);
          }
          .prepare-picker-trigger:disabled {
            opacity: 0.72;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
          }
          .prepare-picker-value {
            display: block;
            width: 100%;
            min-width: 0;
            white-space: normal;
            text-align: left;
            line-height: 1.25;
          }
          .prepare-picker-menu {
            padding: 6px;
            border-radius: 12px;
          }
          .prepare-picker-item {
            display: grid;
            gap: 4px;
            align-items: start;
            padding: 9px 10px;
            min-height: 40px;
            border: 1px solid transparent;
            border-radius: 10px;
            line-height: 1.35;
          }
          .prepare-picker-item:hover {
            background: #fff7ed;
            border-color: #fed7aa;
            transform: translateX(1px);
          }
          .committee-lecturer-picker {
            width: 100%;
            min-width: 0;
            max-width: none;
          }
          .prepare-picker-value {
            display: block;
            width: 100%;
            min-width: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-align: left;
            line-height: 1.25;
          }
          .committee-lecturer-picker .prepare-picker-trigger {
            width: 100%;
            min-height: 46px;
            height: auto;
            padding: 8px 12px;
            align-items: center;
          }
          .committee-lecturer-picker .prepare-picker-value {
            white-space: nowrap;
            line-height: 1.2;
          }
          .committee-lecturer-picker .prepare-picker-menu {
            width: 100%;
            min-width: 100%;
            max-height: 380px;
            padding: 8px;
          }
          .committee-lecturer-picker .prepare-picker-item {
            min-height: 78px;
            padding: 10px 12px;
            align-items: stretch;
          }
          .committee-lecturer-picker .prepare-picker-item.committee-lecturer-picker-placeholder {
            min-height: 44px;
            display: flex;
            align-items: center;
            gap: 0;
          }
          .committee-lecturer-option {
            display: grid;
            gap: 4px;
            width: 100%;
            min-width: 0;
          }
          .committee-lecturer-option-title {
            font-size: 13px;
            font-weight: 800;
            color: #0f172a;
            line-height: 1.28;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            min-width: 0;
          }
          .committee-lecturer-option-meta {
            display: flex;
            align-items: center;
            gap: 6px;
            min-width: 0;
            overflow: hidden;
            white-space: nowrap;
          }
          .committee-lecturer-option-degree-text {
            display: inline-flex;
            align-items: center;
            border-radius: 999px;
            background: #eff6ff;
            color: #1d4ed8;
            border: 1px solid #bfdbfe;
            padding: 2px 8px;
            font-size: 11px;
            font-weight: 800;
            flex-shrink: 0;
          }
          .committee-lecturer-option-separator {
            color: #94a3b8;
            font-size: 12px;
            font-weight: 700;
            flex-shrink: 0;
          }
          .committee-lecturer-option-tags-text {
            display: block;
            flex: 1 1 auto;
            font-size: 11px;
            color: #475569;
            font-weight: 700;
            line-height: 1.2;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .committee-filter-picker {
            width: 100%;
            min-width: 160px;
            max-width: none;
          }
          .committee-filter-picker .prepare-picker-trigger {
            min-height: 46px;
            padding: 8px 12px;
          }
          .committee-filter-picker .prepare-picker-value {
            white-space: nowrap;
          }
          .prepare-composite-control {
            display: grid;
            grid-template-columns: minmax(64px, 68px) auto minmax(64px, 68px) auto;
            gap: 4px;
            align-items: center;
            width: fit-content;
            max-width: 100%;
          }
          .prepare-composite-separator {
            color: #0f172a;
            font-weight: 700;
            font-size: 14px;
            line-height: 1;
          }
          .prepare-fixed-badge {
            min-width: 42px;
            min-height: 34px;
            padding: 0 10px;
            border-radius: 10px;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            color: #0f172a;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
            line-height: 1;
          }
          .prepare-date-control {
            display: grid;
            grid-template-columns: minmax(64px, 68px) minmax(88px, 104px) minmax(92px, 96px);
            gap: 4px;
            width: fit-content;
            max-width: 100%;
          }
          .prepare-date-help {
            margin-top: -2px;
            font-size: 11px;
            color: #0f172a;
          }
          @media (max-width: 640px) {
            .prepare-composite-control {
              grid-template-columns: minmax(58px, 64px) auto minmax(58px, 64px) auto;
              gap: 4px;
            }
            .prepare-fixed-badge {
              min-width: 38px;
              font-size: 11px;
            }
            .prepare-date-control {
              grid-template-columns: minmax(58px, 64px) minmax(82px, 96px) minmax(82px, 90px);
              gap: 4px;
            }
          }
          .prepare-warning {
            color: #0f172a;
            margin-top: 10px;
            font-size: 12px;
            font-weight: 600;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            border-radius: 10px;
            padding: 8px 10px;
          }
          .prepare-history {
            margin-top: 14px;
            border: 1px solid #cbd5e1;
            border-radius: 12px;
            padding: 10px;
            background: #ffffff;
          }
          .prepare-history-title {
            font-weight: 700;
            margin-bottom: 8px;
            color: #0f172a;
          }
          .prepare-history-row {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            margin-bottom: 6px;
            gap: 8px;
            color: #0f172a;
          }
          .section-card-sm {
            border-radius: 12px;
            padding: 16px;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            font-size: 13px;
          }
          .section-title-sm {
            margin-top: 0;
            display: flex;
            gap: 8px;
            align-items: center;
            font-size: 18px;
            line-height: 1.2;
            letter-spacing: -0.01em;
            font-weight: 700;
            color: #0f172a;
          }
          .section-card-sm label,
          .section-card-sm p,
          .section-card-sm span,
          .section-card-sm div {
            line-height: 1.4;
          }
          .section-card-sm table {
            font-size: 12px !important;
          }
          .section-card-sm th {
            font-size: 11px;
          }
          .section-card-sm .committee-primary-btn,
          .section-card-sm .committee-accent-btn,
          .section-card-sm .committee-ghost-btn,
          .section-card-sm .committee-danger-btn {
            min-height: 40px;
            font-size: 13px;
          }
          .committee-content button:not(.committee-primary-btn):not(.committee-accent-btn):not(.committee-ghost-btn):not(.committee-danger-btn):not(.committee-tag-toggle) {
            border: 1px solid #cbd5e1;
            background: #ffffff;
            color: #0f172a;
            min-height: 40px;
          }
          .committee-content button:not(.committee-primary-btn):not(.committee-accent-btn):not(.committee-ghost-btn):not(.committee-danger-btn):not(.committee-tag-toggle):disabled {
            border-color: #0f172a;
            background: #ffffff;
            color: #0f172a;
            cursor: not-allowed;
          }
          .committee-content button:not(.committee-primary-btn):not(.committee-accent-btn):not(.committee-ghost-btn):not(.committee-danger-btn):not(.committee-tag-toggle):hover:not(:disabled) {
            border-color: #0f172a;
            background: #ffffff;
          }
        `}
      </style>
      <div className="committee-content">
        <section className="committee-hero">
          <div className="committee-hero-grid">
            <div>
              <div className="committee-kicker">
                FIT DNU · Quản trị hội đồng
              </div>
              <h1 className="committee-hero-title">
                <GraduationCap size={24} color="#f37021" /> Quản lý hội đồng bảo
                vệ
              </h1>
              <div className="committee-hero-sub">
                Điều phối quản trị hội đồng theo chuẩn vận hành FIT DNU: đồng bộ
                dữ liệu, cấu hình đợt, phân công và chốt danh sách trước điều
                hành.
              </div>
            </div>
          </div>
        </section>

        <section className="committee-overview-grid">
          <article className="committee-overview-card">
            <div className="committee-overview-icon">
              <Users size={18} color="#1d3f91" />
            </div>
            <div className="committee-overview-label">Tổng số hội đồng</div>
            <div className="committee-overview-value">{drafts.length}</div>
            <div className="committee-overview-meta">
              Hội đồng đã được thành lập trong hệ thống
            </div>
          </article>

          <article className="committee-overview-card">
            <div className="committee-overview-icon">
              <Layers3 size={18} color="#1d3f91" />
            </div>
            <div className="committee-overview-label">Đề tài đủ điều kiện</div>
            <div className="committee-overview-value">{validRows.length}</div>
            <div className="committee-overview-meta">
              Đề tài sẵn sàng phân công hội đồng
            </div>
            <button
              type="button"
              className="committee-overview-link"
              onClick={() => setShowEligibleTopicsModal(true)}
            >
              Xem danh sách
            </button>
          </article>

          <article className="committee-overview-card">
            <div className="committee-overview-icon committee-overview-icon-accent">
              <CheckCircle2 size={18} color="#06b6d4" />
            </div>
            <div className="committee-overview-label">
              Đề tài đã phân hội đồng
            </div>
            <div className="committee-overview-value">
              {assignedTopicsCount}
            </div>
            <div className="committee-overview-meta">
              Tỷ lệ hoàn thành {councilCompletionPercent}%
            </div>
          </article>

          <article className="committee-overview-card committee-overview-card-primary">
            <div className="committee-overview-icon committee-overview-icon-primary">
              <CalendarDays size={18} color="#ffffff" />
            </div>
            <div className="committee-overview-label">
              Phiên bảo vệ gần nhất
            </div>
            <div className="committee-overview-value">
              {latestCouncilOverview
                ? new Date(
                    latestCouncilOverview.defenseDate,
                  ).toLocaleDateString("vi-VN")
                : "-"}
            </div>
            <div className="committee-overview-meta">
              <div>Phòng: {latestCouncilOverview?.room ?? "-"}</div>
              <div>
                Khung giờ: {latestCouncilOverview?.startTime ?? morningStart} -{" "}
                {latestCouncilOverview?.endTime ?? afternoonEnd}
              </div>
              <div>
                Đề tài:{" "}
                {latestCouncilOverview
                  ? latestCouncilOverview.morningStudents.length +
                    latestCouncilOverview.afternoonStudents.length
                  : 0}
              </div>
            </div>
          </article>
        </section>

        <div
          ref={councilCenterRef}
          style={{ marginTop: 16, display: "grid", gap: 16 }}
        >
          <section style={baseCard} className="section-card-sm">
            <h2 className="section-title-sm">
              <Gavel size={18} color="#0f172a" /> Trung tâm quản lý hội đồng
            </h2>
            <div style={{ color: "#0f172a", fontSize: 13, marginBottom: 10 }}>
              Quản lý danh sách hội đồng theo phòng, tags và trạng thái.
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <label style={{ display: "grid", gap: 6 }}>
                <span
                  style={{ fontSize: 12, color: "#0f172a", fontWeight: 700 }}
                >
                  Tìm hội đồng
                </span>
                <div style={{ position: "relative" }}>
                  <Search
                    size={14}
                    color="#0f172a"
                    style={{ position: "absolute", left: 10, top: 11 }}
                  />
                  <input
                    value={searchCouncil}
                    onChange={(event) => {
                      setSearchCouncil(event.target.value);
                      setCouncilPage(1);
                    }}
                    placeholder="VD: HD-2026-01, FULLDAY"
                    style={{
                      width: "100%",
                      padding: "8px 10px 8px 32px",
                      borderRadius: 10,
                      border: "1px solid #cbd5e1",
                    }}
                  />
                </div>
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span
                  style={{ fontSize: 12, color: "#0f172a", fontWeight: 700 }}
                >
                  Lọc theo tags
                </span>
                <InlinePicker
                  value={tagFilter}
                  onChange={(event) => {
                    setTagFilter(event);
                    setCouncilPage(1);
                  }}
                  ariaLabel="Lọc theo tags"
                  className="prepare-picker-wide committee-filter-picker"
                  options={[
                    { value: "all", label: "Tất cả tags" },
                    ...allTags.map((tag) => ({
                      value: tag,
                      label: getTagDisplayName(tag),
                    })),
                  ]}
                />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span
                  style={{ fontSize: 12, color: "#0f172a", fontWeight: 700 }}
                >
                  Lọc theo phòng
                </span>
                <InlinePicker
                  value={roomFilter}
                  onChange={(event) => {
                    setRoomFilter(event);
                    setCouncilPage(1);
                  }}
                  ariaLabel="Lọc theo phòng"
                  className="prepare-picker-wide committee-filter-picker"
                  options={[
                    { value: "all", label: "Tất cả phòng" },
                    ...availableRooms.map((room) => ({
                      value: room,
                      label: room,
                    })),
                  ]}
                />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span
                  style={{ fontSize: 12, color: "#0f172a", fontWeight: 700 }}
                >
                  Lọc theo ngày
                </span>
                <InlinePicker
                  value={dateFilter}
                  onChange={(event) => {
                    setDateFilter(event);
                    setCouncilPage(1);
                  }}
                  ariaLabel="Lọc theo ngày"
                  className="prepare-picker-wide committee-filter-picker"
                  options={[
                    { value: "all", label: "Tất cả ngày" },
                    ...availableDates.map((date) => ({
                      value: date,
                      label: new Date(date).toLocaleDateString("vi-VN"),
                    })),
                  ]}
                />
              </label>
            </div>

            <div
              style={{
                marginBottom: 10,
                border: "1px solid #cbd5e1",
                borderRadius: 10,
                padding: 10,
                background: "#ffffff",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 12,
                  color: "#0f172a",
                  marginBottom: 6,
                }}
              >
                Lịch hội đồng theo ngày
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {councilsPerDate.map((item) => (
                  <span
                    key={item.date}
                    style={{
                      border: "1px solid #cbd5e1",
                      borderRadius: 999,
                      padding: "4px 10px",
                      fontSize: 12,
                      color: "#0f172a",
                      background: "#ffffff",
                    }}
                  >
                    {new Date(item.date).toLocaleDateString("vi-VN")}:{" "}
                    {item.count} hội đồng
                  </span>
                ))}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <div style={{ color: "#0f172a", fontSize: 13 }}>
                Hiển thị <strong>{pagedCouncilRows.length}</strong> /{" "}
                {filteredCouncilRows.length} hội đồng
                {selectedCouncilId ? (
                  <span
                    style={{
                      marginLeft: 8,
                      color: "#0f172a",
                      fontWeight: 700,
                    }}
                  >
                    Đang chọn: {selectedCouncilId}
                  </span>
                ) : null}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: "#0f172a",
                    fontSize: 12,
                  }}
                >
                  <SlidersHorizontal size={14} /> Bộ lọc vận hành thời gian thực
                </div>
                <button
                  type="button"
                  className="committee-primary-btn"
                  onClick={runAssignment}
                  disabled={
                    !stateHydrated ||
                    !hasAllowedAction("GENERATE_COUNCILS") ||
                    assignmentLoading ||
                    loadingAutoGenerateConfig ||
                    Boolean(actionInFlight)
                  }
                >
                  <Sparkles size={14} />{" "}
                  {assignmentLoading || loadingAutoGenerateConfig
                    ? "Đang tải cấu hình..."
                    : "Tạo hội đồng tự động"}
                </button>
                <button
                  type="button"
                  className="committee-primary-btn"
                  onClick={startCreateCouncil}
                >
                  <Plus size={14} /> Thêm hội đồng thủ công
                </button>
                <button
                  type="button"
                  className="committee-ghost-btn"
                  onClick={exportCouncilListCsv}
                >
                  <Download size={14} /> Xuất danh sách hội đồng
                </button>
              </div>
            </div>

            <div
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <table className="committee-data-table">
                <colgroup>
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "22%" }} />
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "11%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Mã hội đồng</th>
                    <th>Ngày</th>
                    <th>Phòng</th>
                    <th>Tags</th>
                    <th>Sáng</th>
                    <th>Chiều</th>
                    <th>Thành viên</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedCouncilRows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedCouncilId(row.id)}
                      style={{
                        background:
                          selectedCouncilId === row.id
                            ? "#ffffff"
                            : "transparent",
                        cursor: "pointer",
                      }}
                    >
                      <td style={{ fontWeight: 700 }}>{row.id}</td>
                      <td>
                        {new Date(row.defenseDate).toLocaleDateString("vi-VN")}
                      </td>
                      <td>{row.room}</td>
                      <td>
                        {getTagDisplayList(row.councilTags).join(", ") || "-"}
                      </td>
                      <td>
                        {row.morningStudents.length}/{FIXED_TOPICS_PER_SESSION}
                      </td>
                      <td>
                        {row.afternoonStudents.length}/
                        {FIXED_TOPICS_PER_SESSION}
                      </td>
                      <td>
                        {row.memberCount}/{FIXED_MEMBERS_PER_COUNCIL}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: 999,
                            fontWeight: 700,
                            fontSize: 12,
                            background:
                              row.status === "Ready"
                                ? "#0f172a"
                                : row.status === "Warning"
                                  ? "#ffffff"
                                  : "#ffffff",
                            color:
                              row.status === "Ready"
                                ? "#0f172a"
                                : row.status === "Warning"
                                  ? "#f37021"
                                  : "#0f172a",
                          }}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            type="button"
                            className="committee-ghost-btn committee-icon-btn"
                            title="Xem chi tiết hội đồng"
                            aria-label="Xem chi tiết hội đồng"
                            onClick={(event) => {
                              event.stopPropagation();
                              startEditCouncil(row.id, true);
                            }}
                            style={{ minHeight: 34, padding: 0 }}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            className="committee-ghost-btn committee-icon-btn"
                            title="Sửa hội đồng"
                            aria-label="Sửa hội đồng"
                            onClick={(event) => {
                              event.stopPropagation();
                              startEditCouncil(row.id, false);
                            }}
                            style={{ minHeight: 34, padding: 0 }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className="committee-danger-btn committee-icon-btn"
                            title="Xóa hội đồng"
                            aria-label="Xóa hội đồng"
                            onClick={(event) => {
                              event.stopPropagation();
                              deleteSelectedCouncil(row.id);
                            }}
                            disabled={Boolean(actionInFlight)}
                            style={{ minHeight: 34, padding: 0 }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pagedCouncilRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        style={{
                          padding: 14,
                          textAlign: "center",
                          color: "#0f172a",
                        }}
                      >
                        Chưa có dữ liệu để hiển thị.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredCouncilRows.length > 10 && (
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ color: "#0f172a", fontSize: 12 }}>
                  Trang {Math.min(councilPage, councilTotalPages)} /{" "}
                  {councilTotalPages}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    className="committee-ghost-btn"
                    disabled={councilPage <= 1}
                    onClick={() =>
                      setCouncilPage((prev) => Math.max(1, prev - 1))
                    }
                    style={{ minHeight: 34, padding: "6px 10px" }}
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    className="committee-ghost-btn"
                    disabled={councilPage >= councilTotalPages}
                    onClick={() =>
                      setCouncilPage((prev) =>
                        Math.min(councilTotalPages, prev + 1),
                      )
                    }
                    style={{ minHeight: 34, padding: "6px 10px" }}
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}

            <div
              style={{
                marginTop: 12,
                borderTop: "1px solid #e2e8f0",
                paddingTop: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "grid", gap: 6 }}>
                {hasUnresolvedWarning && (
                  <label
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <input
                      type="checkbox"
                      checked={allowFinalizeAfterWarning}
                      onChange={(event) =>
                        setAllowFinalizeAfterWarning(event.target.checked)
                      }
                    />
                    Cho phép chốt khi còn cảnh báo
                  </label>
                )}
                <div style={{ fontSize: 12, color: "#0f172a" }}>
                  Trạng thái chốt: {isFinalized ? "Đã chốt" : "Chưa chốt"}
                </div>
              </div>
              <button
                type="button"
                onClick={finalize}
                disabled={
                  !stateHydrated ||
                  !hasAllowedAction("FINALIZE") ||
                  !drafts.length ||
                  Boolean(actionInFlight)
                }
                className="committee-primary-btn"
              >
                <Lock size={14} /> Chốt hội đồng
              </button>
            </div>
          </section>
        </div>

        {/* Finalize block moved to table footer actions */}

        {showEligibleTopicsModal &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              className="committee-modal-overlay"
              onClick={() => setShowEligibleTopicsModal(false)}
            >
              <div
                className="committee-modal"
                style={{
                  width: "min(1120px, calc(100vw - 32px))",
                  maxHeight: "calc(100vh - 48px)",
                  padding: 18,
                }}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="committee-modal-head">
                  <div>
                    <div className="committee-modal-title">
                      Danh sách đề tài đủ điều kiện
                    </div>
                    <div className="committee-modal-sub">
                      Tổng cộng {eligibleTopicRows.length} đề tài sẵn sàng phân
                      công hội đồng trong đợt hiện tại.
                    </div>
                  </div>
                  <button
                    type="button"
                    className="committee-ghost-btn committee-icon-btn"
                    onClick={() => setShowEligibleTopicsModal(false)}
                    title="Đóng"
                    aria-label="Đóng"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="committee-modal-summary">
                  <div className="committee-modal-summary-row">
                    <span className="committee-modal-summary-label">
                      Trạng thái
                    </span>
                    <div className="committee-modal-chip-list">
                      {eligibleTopicModalSummary.statuses.length > 0 ? (
                        eligibleTopicModalSummary.statuses.map((status) => (
                          <span
                            key={`status-${status}`}
                            className={getModalStatusChipClassName(status)}
                          >
                            {status}
                          </span>
                        ))
                      ) : (
                        <span className="committee-modal-chip committee-modal-chip--muted">
                          -
                        </span>
                      )}
                    </div>
                    <span className="committee-modal-summary-meta">
                      {eligibleTopicRows.length} đề tài
                    </span>
                  </div>

                  <div className="committee-modal-summary-row">
                    <span className="committee-modal-summary-label">
                      Tags đề tài
                    </span>
                    <div className="committee-modal-chip-list">
                      {eligibleTopicModalSummary.topicTags.length > 0 ? (
                        eligibleTopicModalSummary.topicTags.map((tag) => (
                          <span
                            key={`topic-tag-${tag}`}
                            className="committee-modal-chip"
                          >
                            {getTagDisplayName(tag)}
                          </span>
                        ))
                      ) : (
                        <span className="committee-modal-chip committee-modal-chip--muted">
                          -
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="committee-modal-summary-row">
                    <span className="committee-modal-summary-label">
                      Tags giảng viên
                    </span>
                    <div className="committee-modal-chip-list">
                      {eligibleTopicModalSummary.lecturerTags.length > 0 ? (
                        eligibleTopicModalSummary.lecturerTags.map((tag) => (
                          <span
                            key={`lecturer-tag-${tag}`}
                            className="committee-modal-chip"
                          >
                            {getTagDisplayName(tag)}
                          </span>
                        ))
                      ) : (
                        <span className="committee-modal-chip committee-modal-chip--muted">
                          -
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: 12,
                    overflowX: "auto",
                    overflowY: "hidden",
                  }}
                >
                  <table className="committee-data-table">
                    <colgroup>
                      <col style={{ width: "14%" }} />
                      <col style={{ width: "32%" }} />
                      <col style={{ width: "18%" }} />
                      <col style={{ width: "24%" }} />
                      <col style={{ width: "12%" }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>TopicCode</th>
                        <th>Tên đề tài</th>
                        <th>Tên sinh viên</th>
                        <th>Tên giảng viên</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eligibleTopicRows.map((item, index) => {
                        const isWarningStatus =
                          /warning|cảnh báo|chưa|thiếu/i.test(item.status);
                        return (
                          <tr
                            key={`${item.topicCode}-${item.studentName}-${index}`}
                          >
                            <td style={{ fontWeight: 700 }}>
                              {item.topicCode}
                            </td>
                            <td>
                              <div className="committee-modal-cell-stack">
                                <div className="committee-modal-cell-title">
                                  {item.topicTitle}
                                </div>
                                <div className="committee-modal-chip-list">
                                  {item.topicTags.length > 0 ? (
                                    item.topicTags.map((tag) => (
                                      <span
                                        key={`${item.topicCode}-topic-tag-${tag}`}
                                        className="committee-modal-chip"
                                      >
                                        {getTagDisplayName(tag)}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="committee-modal-chip committee-modal-chip--muted">
                                      -
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>{item.studentName}</td>
                            <td>
                              <div className="committee-modal-cell-stack">
                                <div className="committee-modal-cell-title">
                                  {item.lecturerName}
                                </div>
                                <div className="committee-modal-chip-list">
                                  {item.lecturerTags.length > 0 ? (
                                    item.lecturerTags.map((tag) => (
                                      <span
                                        key={`${item.topicCode}-lecturer-tag-${tag}`}
                                        className="committee-modal-chip"
                                      >
                                        {getTagDisplayName(tag)}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="committee-modal-chip committee-modal-chip--muted">
                                      -
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              <span
                                className={
                                  isWarningStatus
                                    ? "committee-modal-chip committee-modal-chip--warning"
                                    : "committee-modal-chip committee-modal-chip--status"
                                }
                              >
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {eligibleTopicRows.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            style={{
                              padding: 14,
                              textAlign: "center",
                              color: "#0f172a",
                            }}
                          >
                            Chưa có dữ liệu để hiển thị.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>,
            document.body,
          )}

        {showAutoGenerateModal &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              className="committee-modal-overlay"
              onClick={closeAutoGenerateModal}
            >
              <div
                className="committee-modal"
                style={{
                  width: "min(1120px, calc(100vw - 32px))",
                  maxHeight: "calc(100vh - 48px)",
                  padding: 18,
                }}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="committee-modal-head">
                  <div>
                    <div className="committee-modal-title">
                      Cấu hình tạo hội đồng tự động
                    </div>
                    <div className="committee-modal-sub">
                      Chọn dữ liệu đủ điều kiện trong đợt hiện tại, sau đó gửi
                      yêu cầu để backend thực hiện phân công tự động.
                    </div>
                  </div>
                  <button
                    type="button"
                    className="committee-ghost-btn committee-icon-btn"
                    onClick={closeAutoGenerateModal}
                  >
                    <X size={16} />
                  </button>
                </div>

                {autoGenerateModalAlert && (
                  <div
                    className={
                      autoGenerateModalAlert.type === "error"
                        ? "committee-modal-alert committee-modal-alert-error"
                        : "committee-modal-alert"
                    }
                    style={{ marginBottom: 10 }}
                  >
                    {autoGenerateModalAlert.message}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className={
                      autoGenerateStep === 1
                        ? "committee-primary-btn committee-modal-step-btn"
                        : "committee-ghost-btn committee-modal-step-btn"
                    }
                    style={{ minHeight: 34, padding: "6px 12px" }}
                    onClick={() => setAutoGenerateStep(1)}
                  >
                    <span className="committee-inline-icon-label">
                      <Search size={14} />
                      <span>1. Chọn đề tài và giảng viên</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className={
                      autoGenerateStep === 2
                        ? "committee-primary-btn committee-modal-step-btn"
                        : "committee-ghost-btn committee-modal-step-btn"
                    }
                    style={{ minHeight: 34, padding: "6px 12px" }}
                    onClick={proceedAutoGenerateStep2}
                  >
                    <span className="committee-inline-icon-label">
                      <Layers3 size={14} />
                      <span>2. Nhập tham số tạo hội đồng</span>
                    </span>
                  </button>
                </div>

                <div
                  style={{
                    marginTop: 12,
                    display: "grid",
                    gap: 12,
                  }}
                >
                  {autoGenerateStep === 1 ? (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(360px, 1fr))",
                        gap: 12,
                      }}
                    >
                      <div className="committee-modal-card" style={{ gap: 10 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: 14,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              whiteSpace: "nowrap",
                            }}
                          >
                            <Search size={14} />
                            <span>
                              Đề tài đủ điều kiện ({selectedAutoTopicIds.length}
                              /{filteredAutoTopics.length})
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              type="button"
                              className="committee-ghost-btn committee-modal-step-btn"
                              style={{ minHeight: 30, padding: "4px 10px" }}
                              onClick={() => void syncData()}
                              disabled={syncing || Boolean(actionInFlight)}
                            >
                              <span className="committee-inline-icon-label">
                                <RefreshCw size={13} />
                                <span>
                                  {syncing
                                    ? "Đang đồng bộ..."
                                    : "Đồng bộ dữ liệu"}
                                </span>
                              </span>
                            </button>
                            <button
                              type="button"
                              className="committee-ghost-btn committee-modal-step-btn"
                              style={{ minHeight: 30, padding: "4px 10px" }}
                              onClick={() =>
                                setSelectedAutoTopicIds(
                                  filteredAutoTopics
                                    .map(
                                      (topic) =>
                                        topic.topicId ?? topic.topicCode ?? "",
                                    )
                                    .filter(
                                      (id): id is number | string =>
                                        id !== "" &&
                                        id !== null &&
                                        id !== undefined,
                                    ),
                                )
                              }
                            >
                              <span className="committee-inline-icon-label">
                                <CheckCircle2 size={13} />
                                <span>Chọn tất cả</span>
                              </span>
                            </button>
                            <button
                              type="button"
                              className="committee-ghost-btn committee-modal-step-btn"
                              style={{ minHeight: 30, padding: "4px 10px" }}
                              onClick={() => setSelectedAutoTopicIds([])}
                            >
                              <span className="committee-inline-icon-label">
                                <X size={13} />
                                <span>Bỏ chọn</span>
                              </span>
                            </button>
                          </div>
                        </div>

                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          {syncedAt
                            ? `Lần đồng bộ gần nhất: ${syncedAt}`
                            : "Chưa có lần đồng bộ gần nhất."}
                          {syncStatus === "timeout"
                            ? " · Có lỗi timeout khi đồng bộ."
                            : ""}
                        </div>

                        <label style={{ display: "grid", gap: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: 12 }}>
                            Tìm đề tài
                          </span>
                          <input
                            type="text"
                            value={topicSearchKeyword}
                            onChange={(event) =>
                              setTopicSearchKeyword(event.target.value)
                            }
                            placeholder="Mã đề tài / tên đề tài / tag"
                          />
                        </label>

                        <div
                          style={{
                            maxHeight: 320,
                            overflow: "auto",
                            border: "1px solid #cbd5e1",
                            borderRadius: 10,
                            padding: 8,
                            display: "grid",
                            gap: 6,
                          }}
                        >
                          {filteredAutoTopics.map((topic) => {
                            const id = topic.topicId ?? topic.topicCode ?? "";
                            const checked = selectedAutoTopicIds.includes(id);
                            return (
                              <label
                                key={`topic-${id}`}
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "auto 1fr",
                                  gap: 8,
                                  alignItems: "start",
                                  padding: 8,
                                  border: "1px solid #e2e8f0",
                                  borderRadius: 8,
                                  background: checked ? "#fff7ed" : "#ffffff",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleAutoTopic(id)}
                                />
                                <div>
                                  <div
                                    style={{ fontSize: 12, fontWeight: 700 }}
                                  >
                                    {topic.topicCode ?? topic.topicId ?? "-"}
                                  </div>
                                  <div style={{ fontSize: 12, marginTop: 2 }}>
                                    {topic.title ?? "(Không tiêu đề)"}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 11,
                                      marginTop: 2,
                                      color: "#64748b",
                                    }}
                                  >
                                    Tags:{" "}
                                    {getTagDisplayList(
                                      topic.tagCodes ?? [],
                                    ).join(", ") || "-"}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                          {filteredAutoTopics.length === 0 && (
                            <div
                              style={{
                                fontSize: 12,
                                color: "#64748b",
                                padding: 8,
                              }}
                            >
                              Chưa có đề tài đủ điều kiện để hiển thị.
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="committee-modal-card" style={{ gap: 8 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: 14,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              whiteSpace: "nowrap",
                            }}
                          >
                            <Users size={14} />
                            <span>
                              Giảng viên tham gia (
                              {selectedAutoLecturerIds.length}/
                              {availableAutoLecturers.length})
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              type="button"
                              className="committee-ghost-btn committee-modal-step-btn"
                              style={{ minHeight: 30, padding: "4px 10px" }}
                              onClick={() =>
                                setSelectedAutoLecturerIds(
                                  availableAutoLecturers
                                    .map(
                                      (lecturer) =>
                                        lecturer.lecturerProfileId ??
                                        lecturer.lecturerId ??
                                        lecturer.lecturerCode ??
                                        "",
                                    )
                                    .filter(
                                      (id): id is number | string =>
                                        id !== "" &&
                                        id !== null &&
                                        id !== undefined,
                                    ),
                                )
                              }
                            >
                              <span className="committee-inline-icon-label">
                                <CheckCircle2 size={13} />
                                <span>Chọn tất cả</span>
                              </span>
                            </button>
                            <button
                              type="button"
                              className="committee-ghost-btn committee-modal-step-btn"
                              style={{ minHeight: 30, padding: "4px 10px" }}
                              onClick={() => setSelectedAutoLecturerIds([])}
                            >
                              <span className="committee-inline-icon-label">
                                <X size={13} />
                                <span>Bỏ chọn</span>
                              </span>
                            </button>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "minmax(130px, 170px) minmax(0, 1fr) auto",
                            gap: 8,
                            alignItems: "end",
                          }}
                        >
                          <label style={{ display: "grid", gap: 6 }}>
                            <span style={{ fontWeight: 700, fontSize: 12 }}>
                              Nguồn giảng viên
                            </span>
                            <InlinePicker
                              value={lecturerSourceFilter}
                              onChange={(event) =>
                                setLecturerSourceFilter(
                                  event as "all" | "committee" | "supervisor",
                                )
                              }
                              ariaLabel="Nguồn giảng viên"
                              className="prepare-picker-wide committee-filter-picker"
                              options={[
                                { value: "all", label: "Tất cả" },
                                {
                                  value: "committee",
                                  label: "Đã vào hội đồng",
                                },
                                {
                                  value: "supervisor",
                                  label: "GV hướng dẫn",
                                },
                              ]}
                            />
                          </label>

                          <label style={{ display: "grid", gap: 6 }}>
                            <span style={{ fontWeight: 700, fontSize: 12 }}>
                              Từ khóa
                            </span>
                            <input
                              type="text"
                              value={lecturerSearchKeyword}
                              onChange={(event) =>
                                setLecturerSearchKeyword(event.target.value)
                              }
                              placeholder="Mã GV / tên giảng viên"
                            />
                          </label>

                          <button
                            type="button"
                            className="committee-ghost-btn committee-modal-step-btn"
                            style={{ minHeight: 36, padding: "0 12px" }}
                            onClick={() => void loadAutoGenerateConfig()}
                            disabled={
                              loadingAutoGenerateConfig ||
                              Boolean(actionInFlight)
                            }
                          >
                            <span className="committee-inline-icon-label">
                              <RefreshCw size={13} />
                              <span>Tải lại</span>
                            </span>
                          </button>
                        </div>

                        <div
                          style={{
                            maxHeight: 320,
                            overflow: "auto",
                            border: "1px solid #cbd5e1",
                            borderRadius: 10,
                            padding: 8,
                            display: "grid",
                            gap: 6,
                          }}
                        >
                          {availableAutoLecturers.map((lecturer) => {
                            const id =
                              lecturer.lecturerProfileId ??
                              lecturer.lecturerId ??
                              lecturer.lecturerCode ??
                              "";
                            const checked =
                              selectedAutoLecturerIds.includes(id);
                            return (
                              <label
                                key={`lecturer-${id}`}
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "auto 1fr",
                                  gap: 8,
                                  alignItems: "start",
                                  padding: 8,
                                  border: "1px solid #e2e8f0",
                                  borderRadius: 8,
                                  background: checked ? "#fff7ed" : "#ffffff",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleAutoLecturer(id)}
                                />
                                <div>
                                  <div
                                    style={{ fontSize: 12, fontWeight: 700 }}
                                  >
                                    {formatLecturerOptionLabel({
                                      lecturerCode: String(
                                        lecturer.lecturerCode ??
                                          lecturer.lecturerId ??
                                          "",
                                      ).trim(),
                                      lecturerName: lecturer.lecturerName,
                                      degree: lecturer.degree,
                                    })}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 11,
                                      marginTop: 2,
                                      color: "#64748b",
                                    }}
                                  >
                                    Hướng dẫn:{" "}
                                    {Number.isFinite(
                                      Number(lecturer.currentGuidingCount),
                                    )
                                      ? Number(lecturer.currentGuidingCount)
                                      : 0}
                                    /
                                    {Number.isFinite(
                                      Number(lecturer.guideQuota),
                                    )
                                      ? Number(lecturer.guideQuota)
                                      : 0}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 11,
                                      marginTop: 2,
                                      color: "#64748b",
                                    }}
                                  >
                                    Tags:{" "}
                                    {getTagDisplayList(
                                      lecturer.tagCodes ?? [],
                                    ).join(", ") || "-"}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                          {availableAutoLecturers.length === 0 && (
                            <div
                              style={{
                                fontSize: 12,
                                color: "#64748b",
                                padding: 8,
                              }}
                            >
                              Chưa có giảng viên đủ điều kiện để hiển thị.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(320px, 420px))",
                        gap: 12,
                        justifyContent: "center",
                      }}
                    >
                      <div
                        className="committee-modal-card"
                        style={{ gap: 10, maxWidth: 420 }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 13,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            whiteSpace: "normal",
                            flexWrap: "wrap",
                            lineHeight: 1.3,
                          }}
                        >
                          <CalendarDays size={14} />
                          <span>Cấu hình đợt</span>
                        </div>
                        <div
                          style={{
                            marginTop: 2,
                            fontSize: 12,
                            color: "#64748b",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            whiteSpace: "normal",
                            flexWrap: "wrap",
                            lineHeight: 1.35,
                          }}
                        >
                          <Building2 size={13} />
                          Thiết lập phòng, ca bảo vệ và năng lực vận hành mỗi
                          ngày.
                        </div>

                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 12,
                            color: "#0f172a",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            whiteSpace: "normal",
                            flexWrap: "wrap",
                            lineHeight: 1.35,
                          }}
                        >
                          <Building2 size={13} />
                          <span>
                            Danh mục phòng: {roomCatalog.length} phòng từ API
                          </span>
                        </div>

                        <div
                          className="prepare-room-title"
                          style={{
                            marginTop: 2,
                            marginBottom: 0,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            whiteSpace: "normal",
                            flexWrap: "wrap",
                            lineHeight: 1.3,
                          }}
                        >
                          <Building2 size={13} />
                          <span>Phòng dùng khi tạo tự động</span>
                        </div>
                        <div
                          className="prepare-room-list"
                          style={{ marginBottom: 6 }}
                        >
                          {autoRoomOptions.map((room: string) => (
                            <button
                              key={room}
                              type="button"
                              onClick={() => toggleAutoRoom(room)}
                              className={`prepare-room-chip ${selectedAutoRooms.includes(room) ? "active" : ""}`}
                            >
                              {room}
                            </button>
                          ))}
                          {autoRoomOptions.length === 0 && (
                            <div style={{ fontSize: 12, color: "#0f172a" }}>
                              Chưa đồng bộ được danh mục phòng từ API. Vui lòng
                              kiểm tra endpoint phòng rồi tải lại.
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "#475569" }}>
                          Đã chọn {selectedAutoRooms.length} phòng để backend
                          phân bổ lịch tự động.
                        </div>

                        <div className="prepare-time-grid">
                          {renderTimeSelector(
                            "Ca sáng",
                            morningStart,
                            setMorningStart,
                            "AM",
                          )}
                          {renderTimeSelector(
                            "Kết thúc ca sáng",
                            morningEnd,
                            setMorningEnd,
                            "AM",
                          )}
                          {renderTimeSelector(
                            "Ca chiều",
                            afternoonStart,
                            setAfternoonStart,
                            "PM",
                          )}
                          {renderTimeSelector(
                            "Kết thúc ca chiều",
                            afternoonEnd,
                            setAfternoonEnd,
                            "PM",
                          )}
                          {renderDateSelector(
                            "Tạo tự động từ ngày",
                            autoStartDate,
                            setAutoStartDate,
                          )}
                          {renderDateSelector(
                            "Đến ngày",
                            autoEndDate,
                            setAutoEndDate,
                          )}
                        </div>

                        <label
                          className="prepare-field"
                          style={{ marginTop: 4 }}
                        >
                          <span>Số hội đồng tối đa/ngày</span>
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={maxCapacity}
                            onChange={(event) => {
                              setConfigSaved(false);
                              setMaxCapacity(Number(event.target.value));
                            }}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => void saveConfig()}
                          disabled={!stateHydrated || Boolean(actionInFlight)}
                          className="committee-primary-btn committee-config-save-btn"
                        >
                          <Save size={14} /> Lưu cấu hình đợt
                        </button>
                        {configSaved && (
                          <div style={{ fontSize: 12, color: "#0f172a" }}>
                            Đã lưu cấu hình đợt.
                          </div>
                        )}
                      </div>

                      <div
                        className="committee-modal-card"
                        style={{ gap: 10, maxWidth: 420 }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            whiteSpace: "normal",
                            flexWrap: "wrap",
                            lineHeight: 1.3,
                          }}
                        >
                          <Sparkles size={14} />
                          <span>Cấu hình hội đồng</span>
                        </div>
                        <div
                          style={{
                            marginTop: 2,
                            fontSize: 12,
                            color: "#64748b",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            whiteSpace: "normal",
                            flexWrap: "wrap",
                            lineHeight: 1.35,
                          }}
                        >
                          <Layers3 size={13} />
                          Thiết lập tham số phân hội đồng và tags áp dụng.
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                            gap: 10,
                          }}
                        >
                          <label style={{ display: "grid", gap: 6 }}>
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: 12,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                whiteSpace: "normal",
                                flexWrap: "wrap",
                                lineHeight: 1.3,
                              }}
                            >
                              <Layers3 size={13} />
                              <span>Số đề tài/buổi</span>
                            </span>
                            <InlinePicker
                              value={topicsPerSessionConfig}
                              onChange={(event) => {
                                setTopicsPerSessionConfig(Number(event));
                                setCouncilConfigConfirmed(false);
                              }}
                              ariaLabel="Số đề tài mỗi buổi"
                              className="prepare-picker-compact"
                              options={COUNCIL_CONFIG_OPTIONS.map((value) => ({
                                value,
                                label: String(value),
                              }))}
                            />
                          </label>

                          <label style={{ display: "grid", gap: 6 }}>
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: 12,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                whiteSpace: "normal",
                                flexWrap: "wrap",
                                lineHeight: 1.3,
                              }}
                            >
                              <Users size={13} />
                              <span>Số thành viên/hội đồng</span>
                            </span>
                            <InlinePicker
                              value={membersPerCouncilConfig}
                              onChange={(event) => {
                                setMembersPerCouncilConfig(Number(event));
                                setCouncilConfigConfirmed(false);
                              }}
                              ariaLabel="Số thành viên mỗi hội đồng"
                              className="prepare-picker-compact"
                              options={COUNCIL_CONFIG_OPTIONS.map((value) => ({
                                value,
                                label: String(value),
                              }))}
                            />
                          </label>
                        </div>

                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 12,
                            color: "#0f172a",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            whiteSpace: "normal",
                            flexWrap: "wrap",
                            lineHeight: 1.3,
                          }}
                        >
                          <Sparkles size={13} />
                          <span>Tags hội đồng</span>
                        </div>
                        <div
                          style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                        >
                          {allTags.map((tag: string) => (
                            <button
                              key={`cfg-tag-modal-${tag}`}
                              type="button"
                              onClick={() => toggleConfigCouncilTag(tag)}
                              className={`committee-tag-toggle ${configCouncilTags.includes(resolveTagCode(tag)) ? "active" : ""}`}
                              style={{
                                minHeight: 32,
                                padding: "0 10px",
                                fontSize: 12,
                                lineHeight: 1.1,
                              }}
                            >
                              {getTagDisplayName(tag)}
                            </button>
                          ))}
                        </div>

                        <div
                          style={{
                            border: "1px solid #cbd5e1",
                            borderRadius: 10,
                            background: "#ffffff",
                            padding: 10,
                            fontSize: 13,
                            color: "#0f172a",
                          }}
                        >
                          {topicsPerSessionConfig} đề tài/buổi ·{" "}
                          {membersPerCouncilConfig} thành viên/hội đồng ·{" "}
                          {normalizedConfigCouncilTagCodes.length} tag
                        </div>

                        <div className="committee-config-actions">
                          <button
                            type="button"
                            onClick={() => void saveCouncilConfig()}
                            disabled={!stateHydrated || Boolean(actionInFlight)}
                            className="committee-primary-btn"
                          >
                            <Save size={14} /> Lưu cấu hình hội đồng
                          </button>
                        </div>

                        <div
                          style={{
                            fontSize: 12,
                            color: canCreateCouncils ? "#0f172a" : "#b91c1c",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            whiteSpace: "normal",
                            flexWrap: "wrap",
                            lineHeight: 1.35,
                          }}
                        >
                          <CheckCircle2 size={13} />
                          Điều kiện tạo tự động:{" "}
                          {canCreateCouncils ? "Đạt" : "Chưa đạt"}
                        </div>

                        <div className="committee-auto-options">
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: 13,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              whiteSpace: "normal",
                              flexWrap: "wrap",
                              lineHeight: 1.3,
                            }}
                          >
                            <SlidersHorizontal size={13} />
                            <span>Tùy chọn xử lý tự động</span>
                          </div>
                          <label className="committee-auto-option-row">
                            <input
                              type="checkbox"
                              checked={autoGroupByTag}
                              onChange={(event) =>
                                setAutoGroupByTag(event.target.checked)
                              }
                            />
                            <span className="committee-auto-option-label">
                              Group theo tag
                            </span>
                          </label>
                          <label className="committee-auto-option-row">
                            <input
                              type="checkbox"
                              checked={autoPrioritizeMatchTag}
                              onChange={(event) =>
                                setAutoPrioritizeMatchTag(event.target.checked)
                              }
                            />
                            <span className="committee-auto-option-label">
                              Ưu tiên trùng tag
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 8,
                    marginTop: 14,
                  }}
                >
                  {autoGenerateStep === 2 && (
                    <button
                      type="button"
                      className="committee-ghost-btn committee-modal-step-btn"
                      onClick={() => setAutoGenerateStep(1)}
                    >
                      <span className="committee-inline-icon-label">
                        <Layers3 size={14} />
                        <span>Quay lại bước 1</span>
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="committee-ghost-btn committee-modal-step-btn"
                    onClick={closeAutoGenerateModal}
                  >
                    <span className="committee-inline-icon-label">
                      <X size={14} />
                      <span>Hủy</span>
                    </span>
                  </button>
                  {autoGenerateStep === 1 ? (
                    <button
                      type="button"
                      className="committee-primary-btn committee-modal-step-btn"
                      onClick={proceedAutoGenerateStep2}
                      disabled={
                        loadingAutoGenerateConfig || Boolean(actionInFlight)
                      }
                    >
                      <span className="committee-inline-icon-label">
                        <Layers3 size={14} />
                        <span>Tiếp tục bước 2</span>
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="committee-primary-btn committee-modal-step-btn"
                      onClick={submitAutoGenerate}
                      disabled={
                        assignmentLoading ||
                        loadingAutoGenerateConfig ||
                        !stateHydrated ||
                        !hasAllowedAction("GENERATE_COUNCILS") ||
                        Boolean(actionInFlight)
                      }
                    >
                      <span className="committee-inline-icon-label">
                        <CheckCircle2 size={14} />
                        <span>
                          {assignmentLoading
                            ? "Đang mô phỏng & tạo..."
                            : loadingAutoGenerateConfig
                              ? "Đang tải cấu hình..."
                              : "Xác nhận tạo hội đồng tự động"}
                        </span>
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )}

        {manualMode &&
          typeof document !== "undefined" &&
          createPortal(
            <div className="committee-modal-overlay" onClick={closeManualModal}>
              <div
                className="committee-modal"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="committee-modal-head">
                  <div>
                    <div className="committee-modal-title">
                      {manualMode === "create"
                        ? "Thêm hội đồng mới"
                        : manualReadOnly
                          ? `Chi tiết hội đồng ${selectedCouncilId}`
                          : `Chỉnh sửa hội đồng ${selectedCouncilId}`}
                    </div>
                    <div className="committee-modal-sub">
                      {manualMode === "create"
                        ? "Lưu từng bước để hoàn tất hội đồng: thông tin cơ bản, thành viên, rồi đề tài."
                        : "Xem chi tiết, xác nhận chỉnh sửa, hủy hoặc lưu thay đổi."}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      className="committee-ghost-btn committee-icon-btn"
                      onClick={closeManualModal}
                      title="Đóng"
                      aria-label="Đóng"
                      disabled={Boolean(actionInFlight)}
                    >
                      <X size={16} />
                    </button>
                    {manualReadOnly ? (
                      <button
                        type="button"
                        className="committee-primary-btn committee-icon-btn"
                        onClick={enableEditFromDetail}
                        title="Chuyển sang chỉnh sửa"
                        aria-label="Chuyển sang chỉnh sửa"
                      >
                        <Pencil size={16} />
                      </button>
                    ) : (
                      <>
                        {manualMode === "edit" && (
                          <button
                            type="button"
                            className="committee-danger-btn committee-icon-btn"
                            onClick={cancelManualEdit}
                            title="Hủy chỉnh sửa"
                            aria-label="Hủy chỉnh sửa"
                            disabled={Boolean(actionInFlight)}
                          >
                            <X size={16} />
                          </button>
                        )}
                        <button
                          type="button"
                          className="committee-accent-btn committee-icon-btn"
                          onClick={saveManualCouncil}
                          title={`Lưu bước ${createStep}`}
                          aria-label={`Lưu bước ${createStep}`}
                          disabled={Boolean(actionInFlight)}
                        >
                          <Save size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {!manualReadOnly && (
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginBottom: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    {[1, 2, 3].map((step) => (
                      <button
                        key={`create-step-${step}`}
                        type="button"
                        className={
                          createStep === step
                            ? "committee-primary-btn"
                            : "committee-ghost-btn"
                        }
                        style={{ minHeight: 34, padding: "6px 10px" }}
                        onClick={() => proceedCreateStep(step as 1 | 2 | 3)}
                      >
                        Bước {step}
                      </button>
                    ))}
                  </div>
                )}

                <div className="committee-modal-body">
                  {(manualReadOnly || createStep === 1) && (
                    <>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#0f172a",
                          marginBottom: 8,
                        }}
                      >
                        Trường bắt buộc: ngày bảo vệ, phòng, tags và lịch hội
                        đồng.
                      </div>
                      <div className="committee-modal-grid-3">
                        <label className="committee-modal-card">
                          <span className="committee-modal-label">
                            Mã hội đồng
                          </span>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#64748b",
                              marginBottom: 6,
                            }}
                          >
                            {manualMode === "create"
                              ? "Mã sẽ được hệ thống sinh khi lưu bước 1."
                              : "Mã chỉ dùng để tham chiếu, không chỉnh sửa trực tiếp."}
                          </div>
                          <input
                            value={manualId}
                            readOnly
                            aria-readonly="true"
                            placeholder="Mã hội đồng"
                            style={{
                              background: "#f8fafc",
                              cursor: "not-allowed",
                            }}
                          />
                        </label>

                        <label className="committee-modal-card">
                          <span className="committee-modal-label">
                            Tên hội đồng
                          </span>
                          {manualReadOnly ? (
                            <div className="committee-modal-value">
                              {manualName || "-"}
                            </div>
                          ) : (
                            <input
                              value={manualName}
                              onChange={(event) =>
                                setManualName(event.target.value)
                              }
                              placeholder="Ví dụ: Hội đồng 1"
                            />
                          )}
                        </label>

                        <label className="committee-modal-card">
                          <span className="committee-modal-label">
                            Ngày bảo vệ
                          </span>
                          {manualReadOnly ? (
                            <div className="committee-modal-value">
                              {new Date(manualDefenseDate).toLocaleDateString(
                                "vi-VN",
                              )}
                            </div>
                          ) : (
                            <input
                              type="date"
                              value={manualDefenseDate}
                              onChange={(event) => {
                                const nextDate = event.target.value;
                                setManualDefenseDate(nextDate);
                                applyManualTopicSelection(
                                  manualRelatedStudents,
                                  manualMorningStudents,
                                  manualAfternoonStudents,
                                  {
                                    scheduleMode: manualScheduleMode,
                                    sessionCode: manualSessionCode,
                                    preserveAssignments: false,
                                    assignmentDefaults: {
                                      defenseDate: nextDate,
                                    },
                                  },
                                );
                              }}
                            />
                          )}
                        </label>

                        <label className="committee-modal-card">
                          <span className="committee-modal-label">Phòng</span>
                          {manualReadOnly ? (
                            <div className="committee-modal-value">
                              {manualRoom || "-"}
                            </div>
                          ) : (
                            <>
                              <InlinePicker
                                value={manualRoom}
                                onChange={(event) => setManualRoom(event)}
                                disabled={roomOptions.length === 0}
                                ariaLabel="Chọn phòng"
                                className="prepare-picker-wide"
                                options={
                                  roomOptions.length === 0
                                    ? [
                                        {
                                          value: "",
                                          label: "Chưa có phòng từ API",
                                        },
                                      ]
                                    : roomOptions.map((room) => ({
                                        value: room,
                                        label: room,
                                      }))
                                }
                              />
                              <div
                                style={{
                                  marginTop: 6,
                                  fontSize: 11,
                                  color:
                                    roomOptions.length > 0
                                      ? "#0f172a"
                                      : "#f37021",
                                }}
                              >
                                {roomOptions.length > 0
                                  ? `Có ${roomOptions.length} phòng khả dụng từ API.`
                                  : "Chưa lấy được danh mục phòng. Cần đồng bộ API phòng trước khi lưu."}
                              </div>
                            </>
                          )}
                        </label>

                        <label className="committee-modal-card">
                          <span className="committee-modal-label">
                            Lịch hội đồng
                          </span>
                          {manualReadOnly ? (
                            <div className="committee-modal-value">
                              {manualScheduleMode === "FULL_DAY"
                                ? `Cả ngày · ${manualStartTime} - ${manualEndTime}`
                                : `1 buổi · ${manualSessionCode === "AFTERNOON" ? "Buổi chiều" : "Buổi sáng"} · ${manualStartTime} - ${manualEndTime}`}
                            </div>
                          ) : (
                            <div style={{ display: "grid", gap: 8 }}>
                              <InlinePicker
                                value={manualScheduleMode}
                                onChange={(event) => {
                                  const nextMode = event as CouncilScheduleMode;
                                  setManualScheduleMode(nextMode);
                                  if (nextMode === "FULL_DAY") {
                                    setManualSessionCode("MORNING");
                                    applyManualSchedulePreset(
                                      nextMode,
                                      "MORNING",
                                    );
                                    applyManualTopicSelection(
                                      manualRelatedStudents,
                                      manualMorningStudents,
                                      manualAfternoonStudents,
                                      {
                                        scheduleMode: "FULL_DAY",
                                        sessionCode: "MORNING",
                                        preserveAssignments: false,
                                      },
                                    );
                                    return;
                                  }
                                  const nextOneSessionRange =
                                    manualSessionCode === "AFTERNOON"
                                      ? {
                                          startTime:
                                            normalizeTimeOnly(afternoonStart) ||
                                            afternoonStart,
                                          endTime:
                                            normalizeTimeOnly(afternoonEnd) ||
                                            afternoonEnd,
                                        }
                                      : {
                                          startTime:
                                            normalizeTimeOnly(morningStart) ||
                                            morningStart,
                                          endTime:
                                            normalizeTimeOnly(morningEnd) ||
                                            morningEnd,
                                        };
                                  applyManualSchedulePreset(
                                    nextMode,
                                    manualSessionCode,
                                  );
                                  applyManualTopicSelection(
                                    manualRelatedStudents,
                                    manualMorningStudents,
                                    manualAfternoonStudents,
                                    {
                                      scheduleMode: nextMode,
                                      sessionCode: manualSessionCode,
                                      preserveAssignments: false,
                                      assignmentDefaults: {
                                        defenseDate: manualDefenseDate,
                                        ...nextOneSessionRange,
                                      },
                                    },
                                  );
                                }}
                                ariaLabel="Chọn lịch hội đồng"
                                className="prepare-picker-wide"
                                options={[
                                  { value: "FULL_DAY", label: "Cả ngày" },
                                  { value: "ONE_SESSION", label: "1 buổi" },
                                ]}
                              />
                              {manualScheduleMode === "ONE_SESSION" ? (
                                <>
                                  <InlinePicker
                                    value={manualSessionCode}
                                    onChange={(event) => {
                                      const nextSession =
                                        normalizeSessionCode(event);
                                      const nextOneSessionRange =
                                        nextSession === "AFTERNOON"
                                          ? {
                                              startTime:
                                                normalizeTimeOnly(
                                                  afternoonStart,
                                                ) || afternoonStart,
                                              endTime:
                                                normalizeTimeOnly(
                                                  afternoonEnd,
                                                ) || afternoonEnd,
                                            }
                                          : {
                                              startTime:
                                                normalizeTimeOnly(
                                                  morningStart,
                                                ) || morningStart,
                                              endTime:
                                                normalizeTimeOnly(morningEnd) ||
                                                morningEnd,
                                            };
                                      setManualSessionCode(nextSession);
                                      applyManualSchedulePreset(
                                        "ONE_SESSION",
                                        nextSession,
                                      );
                                      applyManualTopicSelection(
                                        manualRelatedStudents,
                                        manualMorningStudents,
                                        manualAfternoonStudents,
                                        {
                                          scheduleMode: "ONE_SESSION",
                                          sessionCode: nextSession,
                                          preserveAssignments: false,
                                          assignmentDefaults: {
                                            defenseDate: manualDefenseDate,
                                            ...nextOneSessionRange,
                                          },
                                        },
                                      );
                                    }}
                                    ariaLabel="Chọn buổi hội đồng"
                                    className="prepare-picker-wide"
                                    options={[
                                      { value: "MORNING", label: "Buổi sáng" },
                                      {
                                        value: "AFTERNOON",
                                        label: "Buổi chiều",
                                      },
                                    ]}
                                  />
                                  <div className="prepare-time-grid">
                                    {renderTimeSelector(
                                      "Giờ bắt đầu",
                                      manualStartTime,
                                      setManualStartTime,
                                      manualSessionCode === "AFTERNOON"
                                        ? "PM"
                                        : "AM",
                                      (nextTime) =>
                                        applyManualTopicSelection(
                                          manualRelatedStudents,
                                          manualMorningStudents,
                                          manualAfternoonStudents,
                                          {
                                            scheduleMode: manualScheduleMode,
                                            sessionCode: manualSessionCode,
                                            preserveAssignments: false,
                                            assignmentDefaults: {
                                              defenseDate: manualDefenseDate,
                                              startTime: nextTime,
                                              endTime: manualEndTime,
                                            },
                                          },
                                        ),
                                    )}
                                    {renderTimeSelector(
                                      "Giờ kết thúc",
                                      manualEndTime,
                                      setManualEndTime,
                                      manualSessionCode === "AFTERNOON"
                                        ? "PM"
                                        : "AM",
                                      (nextTime) =>
                                        applyManualTopicSelection(
                                          manualRelatedStudents,
                                          manualMorningStudents,
                                          manualAfternoonStudents,
                                          {
                                            scheduleMode: manualScheduleMode,
                                            sessionCode: manualSessionCode,
                                            preserveAssignments: false,
                                            assignmentDefaults: {
                                              defenseDate: manualDefenseDate,
                                              startTime: manualStartTime,
                                              endTime: nextTime,
                                            },
                                          },
                                        ),
                                    )}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="prepare-time-grid">
                                    {renderTimeSelector(
                                      "Bắt đầu cả ngày",
                                      manualStartTime,
                                      setManualStartTime,
                                      "AM",
                                    )}
                                    {renderTimeSelector(
                                      "Kết thúc cả ngày",
                                      manualEndTime,
                                      setManualEndTime,
                                      "PM",
                                    )}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color: "#0f172a",
                                      lineHeight: 1.45,
                                    }}
                                  >
                                    Chia buổi theo cấu hình đợt: sáng{" "}
                                    {morningStart} - {morningEnd}, chiều{" "}
                                    {afternoonStart} - {afternoonEnd}.
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </label>
                      </div>
                    </>
                  )}

                  {(manualReadOnly || createStep === 1) && (
                    <div className="committee-modal-card">
                      <span className="committee-modal-label">
                        Tags hội đồng
                      </span>
                      {manualReadOnly ? (
                        <div className="committee-modal-value">
                          {getTagDisplayList(manualCouncilTags).join(", ") ||
                            "-"}
                        </div>
                      ) : (
                        <div
                          style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                        >
                          {allTags.map((tag: string) => (
                            <button
                              key={`manual-tag-${tag}`}
                              type="button"
                              className={`committee-tag-toggle ${manualCouncilTags.includes(resolveTagCode(tag)) ? "active" : ""}`}
                              onClick={() => toggleManualCouncilTag(tag)}
                              style={{
                                minHeight: 34,
                                padding: "6px 10px",
                              }}
                            >
                              {getTagDisplayName(tag)}
                            </button>
                          ))}
                        </div>
                      )}
                      {!manualReadOnly && allTags.length === 0 && (
                        <div
                          style={{
                            marginTop: 8,
                            fontSize: 12,
                            color: "#f37021",
                          }}
                        >
                          Chưa có tags từ API. Hãy kiểm tra endpoint /Tags/list
                          rồi tải lại để có thể cấu hình hội đồng.
                        </div>
                      )}
                    </div>
                  )}

                  {!manualReadOnly && createStep === 1 && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 8,
                        marginTop: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        type="button"
                        className="committee-primary-btn"
                        onClick={() => void saveManualCouncil()}
                      >
                        {manualMode === "create"
                          ? "Lưu bước 1 & sang bước 2"
                          : "Cập nhật bước 1 & sang bước 2"}
                      </button>
                    </div>
                  )}

                  {(manualReadOnly || createStep === 2) && (
                    <div className="committee-modal-card">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ display: "grid", gap: 2 }}>
                          <span className="committee-modal-label">
                            Danh sách thành viên hội đồng
                          </span>
                          <span className="committee-member-caption">
                            Chủ tịch và Thư ký được khóa cứng. Tổng số thành
                            viên phải đúng {expectedManualMemberCount} theo cấu
                            hình đợt.
                          </span>
                        </div>
                        {!manualReadOnly && (
                          <button
                            type="button"
                            className="committee-ghost-btn"
                            style={{ minHeight: 30, padding: "4px 10px" }}
                            onClick={addManualMemberSlot}
                            disabled={
                              manualMembers.length >= expectedManualMemberCount
                            }
                          >
                            <Plus size={13} /> Thêm slot thành viên
                          </button>
                        )}
                      </div>

                      <div className="committee-manual-members-grid">
                        {manualMembers.map(
                          (member: CouncilMember, idx: number) => {
                            const isFixedRoleSlot =
                              idx < FIXED_MANUAL_MEMBER_SLOT_COUNT;
                            const roleLabel = getManualMemberSlotRoleLabel(
                              idx,
                              member.role,
                            );
                            const roleSelectOptions =
                              getManualMemberRoleSelectOptions(
                                idx,
                                member.role,
                              );
                            const lecturerOptions =
                              buildManualMemberLecturerOptions(
                                idx,
                                member.role,
                              );
                            const selectedDegree = getLecturerDegreeByCode(
                              member.lecturerCode,
                            );
                            const selectedTags = getTagDisplayList(
                              getLecturerTagsByCode(member.lecturerCode),
                            );
                            const selectedLabel = member.lecturerCode
                              ? formatLecturerOptionLabel({
                                  lecturerCode: member.lecturerCode,
                                  lecturerName: member.lecturerName,
                                  degree: selectedDegree,
                                })
                              : "-";
                            const requiresDoctorDegree = isChairRole(
                              member.role,
                            );

                            return (
                              <div
                                key={`${member.role}-${idx}`}
                                className="committee-member-slot-card"
                              >
                                <div className="committee-member-slot-head">
                                  <span className="committee-modal-label">
                                    {roleLabel}
                                  </span>
                                  {isFixedRoleSlot ? (
                                    <span className="committee-member-role-hint">
                                      Khóa cứng
                                    </span>
                                  ) : (
                                    <span className="committee-member-role-hint">
                                      Phản biện / Ủy viên
                                    </span>
                                  )}
                                </div>

                                {manualReadOnly ? (
                                  <>
                                    <div className="committee-member-readonly-role">
                                      Vai trò: {roleLabel}
                                    </div>
                                    <div className="committee-modal-value">
                                      {selectedLabel}
                                    </div>
                                    {member.lecturerCode && (
                                      <div className="committee-member-meta">
                                        <div>
                                          Học vị:{" "}
                                          {selectedDegree ||
                                            "Chưa cập nhật học vị"}{" "}
                                          · Tags:{" "}
                                          {selectedTags.join(", ") || "-"}
                                        </div>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    {isFixedRoleSlot ? (
                                      <div className="committee-member-readonly-role">
                                        Vai trò cố định: {roleLabel}
                                      </div>
                                    ) : (
                                      <label className="committee-member-field">
                                        <span className="committee-member-field-label">
                                          Vai trò
                                        </span>
                                        <InlinePicker
                                          value={member.role}
                                          onChange={(event) =>
                                            updateManualMemberRole(idx, event)
                                          }
                                          ariaLabel={`Vai trò thành viên ${idx + 1}`}
                                          className="prepare-picker-wide"
                                          options={roleSelectOptions.map(
                                            (roleValue) => ({
                                              value: roleValue.value,
                                              label: roleValue.label,
                                            }),
                                          )}
                                        />
                                      </label>
                                    )}

                                    <label className="committee-member-field">
                                      <span className="committee-member-field-label">
                                        Giảng viên{" "}
                                        {requiresDoctorDegree
                                          ? "(lọc Tiến sĩ)"
                                          : ""}
                                      </span>
                                      <InlinePicker
                                        value={member?.lecturerCode ?? ""}
                                        onChange={(event) =>
                                          updateManualMember(idx, event)
                                        }
                                        ariaLabel={`Chọn giảng viên cho slot ${idx + 1}`}
                                        disabled={lecturerOptions.length === 0}
                                        className="committee-lecturer-picker"
                                        options={[
                                          {
                                            value: "",
                                            label: requiresDoctorDegree
                                              ? "Chọn giảng viên Tiến sĩ"
                                              : "Chọn giảng viên",
                                            displayLabel: requiresDoctorDegree
                                              ? "Chọn giảng viên Tiến sĩ"
                                              : "Chọn giảng viên",
                                            className:
                                              "committee-lecturer-picker-placeholder",
                                          },
                                          ...lecturerOptions.map(
                                            (lecturer) => ({
                                              value: lecturer.lecturerCode,
                                              label:
                                                renderLecturerPickerOption(
                                                  lecturer,
                                                ),
                                              displayLabel: `${lecturer.lecturerCode} - ${lecturer.lecturerName}`,
                                            }),
                                          ),
                                        ]}
                                      />
                                    </label>

                                    {requiresDoctorDegree &&
                                      lecturerOptions.length === 0 && (
                                        <div className="committee-member-warning">
                                          Không có giảng viên Tiến sĩ khả dụng
                                          cho slot Chủ tịch.
                                        </div>
                                      )}

                                    {member.lecturerCode && (
                                      <div className="committee-member-meta">
                                        <div>
                                          Học vị:{" "}
                                          {selectedDegree ||
                                            "Chưa cập nhật học vị"}{" "}
                                          · Tags:{" "}
                                          {selectedTags.join(", ") || "-"}
                                        </div>
                                      </div>
                                    )}

                                    {!isFixedRoleSlot &&
                                      manualMembers.length >
                                        expectedManualMemberCount && (
                                        <button
                                          type="button"
                                          className="committee-danger-btn committee-member-remove-btn"
                                          style={{
                                            minHeight: 30,
                                            padding: "4px 10px",
                                          }}
                                          onClick={() =>
                                            removeManualMemberSlot(idx)
                                          }
                                        >
                                          <Trash2 size={12} /> Xóa slot
                                        </button>
                                      )}
                                  </>
                                )}
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  )}

                  {!manualReadOnly && createStep === 2 && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                        marginTop: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        type="button"
                        className="committee-ghost-btn"
                        onClick={() => setCreateStep(1)}
                      >
                        Quay lại bước 1
                      </button>
                      <button
                        type="button"
                        className="committee-primary-btn"
                        onClick={() => void saveManualCouncil()}
                      >
                        {manualMode === "create"
                          ? "Lưu bước 2 & sang bước 3"
                          : "Cập nhật bước 2 & sang bước 3"}
                      </button>
                    </div>
                  )}

                  {(manualReadOnly || createStep === 3) && (
                    <div className="committee-modal-card">
                      <span className="committee-modal-label">
                        Danh sách đề tài
                      </span>
                      <span className="committee-member-caption">
                        Chọn đề tài liên quan để xếp vào hội đồng. Danh sách
                        hiển thị đầy đủ mã, GVHD và tags.
                      </span>
                      <div className="committee-manual-topic-grid">
                        <div className="committee-topic-panel">
                          <div className="committee-topic-panel-head">
                            <span>Đề tài liên quan</span>
                            <span>{manualRelatedStudentView.length}</span>
                          </div>
                          <div className="committee-topic-panel-list">
                            {manualRelatedStudentView.map((item) => {
                              const topicSession = getManualTopicSessionCode(
                                item.studentCode,
                              );
                              const currentAssignment =
                                manualAssignmentByStudentCode.get(
                                  item.studentCode,
                                );
                              return (
                                <article
                                  key={`related-${item.studentCode}`}
                                  className="committee-topic-item committee-topic-item--selected"
                                >
                                  <div className="committee-topic-item-head">
                                    <span className="committee-topic-item-code">
                                      {item.topicCode}
                                    </span>
                                    <span className="committee-topic-item-student-code">
                                      {item.studentCode}
                                    </span>
                                  </div>
                                  <div className="committee-topic-item-title">
                                    {item.topicTitle}
                                  </div>
                                  <div className="committee-topic-item-meta">
                                    Sinh viên: {item.studentName}
                                  </div>
                                  <div className="committee-topic-item-meta">
                                    GVHD: {item.supervisorName}
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 6,
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <span className="committee-modal-chip committee-modal-chip--status">
                                      {topicSession === "AFTERNOON"
                                        ? "Buổi chiều"
                                        : "Buổi sáng"}
                                    </span>
                                    {!manualReadOnly &&
                                      manualScheduleMode === "FULL_DAY" && (
                                        <>
                                          <button
                                            type="button"
                                            className={
                                              topicSession === "MORNING"
                                                ? "committee-primary-btn"
                                                : "committee-ghost-btn"
                                            }
                                            style={{
                                              minHeight: 28,
                                              padding: "2px 8px",
                                            }}
                                            onClick={() =>
                                              assignTopicToSession(
                                                item.studentCode,
                                                "MORNING",
                                              )
                                            }
                                          >
                                            Sáng
                                          </button>
                                          <button
                                            type="button"
                                            className={
                                              topicSession === "AFTERNOON"
                                                ? "committee-primary-btn"
                                                : "committee-ghost-btn"
                                            }
                                            style={{
                                              minHeight: 28,
                                              padding: "2px 8px",
                                            }}
                                            onClick={() =>
                                              assignTopicToSession(
                                                item.studentCode,
                                                "AFTERNOON",
                                              )
                                            }
                                          >
                                            Chiều
                                          </button>
                                        </>
                                      )}
                                  </div>
                                  <div className="committee-modal-chip-list">
                                    {item.topicTags.length > 0 ? (
                                      item.topicTags.map((tag) => (
                                        <span
                                          key={`related-${item.studentCode}-${tag}`}
                                          className="committee-modal-chip"
                                        >
                                          {getTagDisplayName(tag)}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="committee-modal-chip committee-modal-chip--muted">
                                        -
                                      </span>
                                    )}
                                  </div>

                                  <div className="committee-member-meta">
                                    <div>
                                      Ngày:{" "}
                                      {formatDateLabel(
                                        currentAssignment?.scheduledAt ??
                                          manualDefenseDate,
                                      )}
                                    </div>
                                    <div>
                                      Khung giờ:{" "}
                                      {currentAssignment?.startTime ??
                                        manualStartTime}{" "}
                                      -{" "}
                                      {currentAssignment?.endTime ??
                                        manualEndTime}
                                    </div>
                                    <div>
                                      Thứ tự:{" "}
                                      {currentAssignment?.orderIndex ?? 1}
                                    </div>
                                  </div>

                                  {!manualReadOnly && (
                                    <div style={{ display: "grid", gap: 8 }}>
                                      <label className="committee-member-field">
                                        <span className="committee-member-field-label">
                                          Ngày
                                        </span>
                                        <input
                                          type="date"
                                          value={
                                            currentAssignment?.scheduledAt ??
                                            manualDefenseDate
                                          }
                                          onChange={(event) => {
                                            const nextDate =
                                              normalizeDefenseDateOnly(
                                                event.target.value,
                                              ) || manualDefenseDate;
                                            updateManualAssignment(
                                              item.studentCode,
                                              (assignment) => ({
                                                ...assignment,
                                                scheduledAt: nextDate,
                                              }),
                                            );
                                          }}
                                        />
                                      </label>
                                      <div className="prepare-time-grid">
                                        <label className="committee-member-field">
                                          <span className="committee-member-field-label">
                                            Giờ bắt đầu
                                          </span>
                                          <input
                                            type="time"
                                            value={
                                              currentAssignment?.startTime ??
                                              manualStartTime
                                            }
                                            onChange={(event) => {
                                              const nextTime =
                                                normalizeTimeOnly(
                                                  event.target.value,
                                                ) ||
                                                currentAssignment?.startTime ||
                                                manualStartTime;
                                              updateManualAssignment(
                                                item.studentCode,
                                                (assignment) => ({
                                                  ...assignment,
                                                  startTime: nextTime,
                                                }),
                                              );
                                            }}
                                          />
                                        </label>
                                        <label className="committee-member-field">
                                          <span className="committee-member-field-label">
                                            Giờ kết thúc
                                          </span>
                                          <input
                                            type="time"
                                            value={
                                              currentAssignment?.endTime ??
                                              manualEndTime
                                            }
                                            onChange={(event) => {
                                              const nextTime =
                                                normalizeTimeOnly(
                                                  event.target.value,
                                                ) ||
                                                currentAssignment?.endTime ||
                                                manualEndTime;
                                              updateManualAssignment(
                                                item.studentCode,
                                                (assignment) => ({
                                                  ...assignment,
                                                  endTime: nextTime,
                                                }),
                                              );
                                            }}
                                          />
                                        </label>
                                        <label className="committee-member-field">
                                          <span className="committee-member-field-label">
                                            Thứ tự
                                          </span>
                                          <input
                                            type="number"
                                            min={1}
                                            step={1}
                                            value={
                                              currentAssignment?.orderIndex ?? 1
                                            }
                                            onChange={(event) => {
                                              const nextOrder = Math.max(
                                                1,
                                                Math.floor(
                                                  Number(event.target.value) ||
                                                    1,
                                                ),
                                              );
                                              updateManualAssignment(
                                                item.studentCode,
                                                (assignment) => ({
                                                  ...assignment,
                                                  orderIndex: nextOrder,
                                                }),
                                              );
                                            }}
                                          />
                                        </label>
                                      </div>
                                    </div>
                                  )}

                                  {!manualReadOnly && (
                                    <button
                                      type="button"
                                      className="committee-danger-btn committee-topic-item-action"
                                      onClick={() =>
                                        moveTopicToUnrelated(item.studentCode)
                                      }
                                    >
                                      <X size={12} /> Bỏ liên quan
                                    </button>
                                  )}
                                </article>
                              );
                            })}

                            {manualRelatedStudentView.length === 0 && (
                              <div className="committee-topic-empty">
                                Chưa có đề tài liên quan được chọn.
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="committee-topic-panel">
                          <div className="committee-topic-panel-head">
                            <span>Đề tài chưa chọn</span>
                            <span>{manualUnrelatedStudentView.length}</span>
                          </div>
                          <div className="committee-topic-panel-list">
                            {manualUnrelatedStudentView.map((item) => (
                              <article
                                key={`unrelated-${item.studentCode}`}
                                className="committee-topic-item"
                              >
                                <div className="committee-topic-item-head">
                                  <span className="committee-topic-item-code">
                                    {item.topicCode}
                                  </span>
                                  <span className="committee-topic-item-student-code">
                                    {item.studentCode}
                                  </span>
                                </div>
                                <div className="committee-topic-item-title">
                                  {item.topicTitle}
                                </div>
                                <div className="committee-topic-item-meta">
                                  Sinh viên: {item.studentName}
                                </div>
                                <div className="committee-topic-item-meta">
                                  GVHD: {item.supervisorName}
                                </div>
                                <div className="committee-modal-chip-list">
                                  {item.topicTags.length > 0 ? (
                                    item.topicTags.map((tag) => (
                                      <span
                                        key={`unrelated-${item.studentCode}-${tag}`}
                                        className="committee-modal-chip"
                                      >
                                        {getTagDisplayName(tag)}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="committee-modal-chip committee-modal-chip--muted">
                                      -
                                    </span>
                                  )}
                                </div>

                                {!manualReadOnly && (
                                  <button
                                    type="button"
                                    className="committee-ghost-btn committee-topic-item-action"
                                    onClick={() =>
                                      moveTopicToRelated(item.studentCode)
                                    }
                                  >
                                    <Plus size={12} /> Thêm liên quan
                                  </button>
                                )}
                              </article>
                            ))}

                            {manualUnrelatedStudentView.length === 0 && (
                              <div className="committee-topic-empty">
                                Tất cả đề tài hiện đã được chọn liên quan.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {!manualReadOnly && (
                        <div
                          style={{
                            marginTop: 10,
                            fontSize: 12,
                            color: "#0f172a",
                          }}
                        >
                          {manualScheduleMode === "ONE_SESSION"
                            ? `Đề tài đã chọn: ${manualRelatedStudents.length} · Tất cả thuộc ${manualSessionCode === "AFTERNOON" ? "buổi chiều" : "buổi sáng"}`
                            : `Đề tài đã chọn: ${manualRelatedStudents.length} · Buổi sáng: ${manualMorningStudents.length} · Buổi chiều: ${manualAfternoonStudents.length}`}
                        </div>
                      )}
                    </div>
                  )}

                  {!manualReadOnly && createStep === 3 && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                        marginTop: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        type="button"
                        className="committee-ghost-btn"
                        onClick={() => setCreateStep(2)}
                      >
                        Quay lại bước 2
                      </button>
                      <button
                        type="button"
                        className="committee-primary-btn"
                        onClick={() => void saveManualCouncil()}
                        disabled={Boolean(actionInFlight)}
                      >
                        {manualMode === "create"
                          ? "Lưu hội đồng"
                          : "Hoàn tất cập nhật"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )}
      </div>
    </div>
  );
};

export default CommitteeManagement;
