import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock3,
  GraduationCap,
  MapPin,
  UsersRound,
} from "lucide-react";
import { FetchDataError, fetchData } from "../../api/fetchData";
import { useAuth } from "../../hooks/useAuth";
import {
  pickCaseInsensitiveValue,
  readEnvelopeData,
  readEnvelopeErrorMessages,
  readEnvelopeMessage,
  readEnvelopeSuccess,
} from "../../utils/api-envelope";
import {
  getActiveDefensePeriodId,
  normalizeDefensePeriodId,
  setActiveDefensePeriodId,
} from "../../utils/defensePeriod";
import type { ApiResponse } from "../../types/api";
import type { SessionCode } from "../../types/defense-workflow-contract";

type ScheduleStatus = "scheduled" | "completed" | "locked" | "cancelled";

type DefenseSchedule = {
  id: string;
  assignmentId: number | null;
  topicTitle: string;
  studentCode: string;
  studentName: string;
  committeeCode: string;
  committeeName: string;
  room: string;
  scheduledAt: string | null;
  session: SessionCode;
  startTime: string | null;
  endTime: string | null;
  status: ScheduleStatus;
  lecturerRole: string;
};

type CommitteeView = {
  numericId: number;
  committeeCode: string;
  committeeName: string;
  room: string;
  scheduledAt: string | null;
  session: SessionCode;
  startTime: string | null;
  endTime: string | null;
  statusRaw: string;
  lecturerRole: string;
};

const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

const toRecordArray = (value: unknown): Array<Record<string, unknown>> => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is Record<string, unknown> => Boolean(toRecord(item)));
};

const toNumberOrNull = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toText = (value: unknown, fallback = ""): string => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

const toIsoDateOrNull = (value: unknown): string | null => {
  if (!value) {
    return null;
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const normalizeTime = (value: unknown): string | null => {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return null;
  }
  const matched = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!matched) {
    return null;
  }
  const hour = Number(matched[1]);
  const minute = Number(matched[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const inferSessionFromTime = (timeValue: string | null): SessionCode | null => {
  if (!timeValue) {
    return null;
  }
  const hour = Number(timeValue.split(":")[0]);
  if (!Number.isFinite(hour)) {
    return null;
  }
  return hour >= 12 ? "AFTERNOON" : "MORNING";
};

const normalizeSession = (value: unknown, fallback: SessionCode = "MORNING"): SessionCode => {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (
    normalized.includes("AFTER") ||
    normalized.includes("PM") ||
    normalized.includes("CHIỀU") ||
    normalized.includes("CHIEU")
  ) {
    return "AFTERNOON";
  }
  if (
    normalized.includes("MORNING") ||
    normalized.includes("AM") ||
    normalized.includes("SÁNG") ||
    normalized.includes("SANG")
  ) {
    return "MORNING";
  }
  return fallback;
};

const mergeDateAndTime = (dateIso: string | null, timeValue: string | null): string | null => {
  if (!dateIso) {
    return null;
  }
  const parsed = new Date(dateIso);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  if (timeValue) {
    const [hourText, minuteText] = timeValue.split(":");
    const hour = Number(hourText);
    const minute = Number(minuteText);
    if (Number.isFinite(hour) && Number.isFinite(minute)) {
      parsed.setHours(hour, minute, 0, 0);
    }
  }
  return parsed.toISOString();
};

const mapRoleLabel = (value: unknown): string => {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized.includes("CHAIR") || normalized.includes("CHU TICH") || normalized === "CT") {
    return "Chủ tịch hội đồng";
  }
  if (normalized.includes("SECRETARY") || normalized.includes("THU KY") || normalized === "TK") {
    return "Thư ký hội đồng";
  }
  if (normalized.includes("REVIEW") || normalized.includes("PHAN BIEN") || normalized === "PB") {
    return "Phản biện hội đồng";
  }
  if (normalized.includes("SUPERVISOR") || normalized.includes("GVHD")) {
    return "Giảng viên hướng dẫn";
  }
  return "Ủy viên hội đồng";
};

const resolveLecturerRole = (
  members: Array<Record<string, unknown>>,
  userCode: string | null,
): string => {
  if (!userCode) {
    return "Thành viên hội đồng";
  }
  const normalizedUserCode = userCode.trim().toUpperCase();
  const matched = members.find((member) => {
    const memberCode = toText(
      pickCaseInsensitiveValue(member, ["lecturerCode", "LecturerCode", "code", "Code"], ""),
      "",
    ).toUpperCase();
    return memberCode === normalizedUserCode;
  });

  if (!matched) {
    return "Thành viên hội đồng";
  }

  const roleRaw = pickCaseInsensitiveValue(
    matched,
    ["role", "Role", "roleCode", "RoleCode"],
    "",
  );
  return mapRoleLabel(roleRaw);
};

const toScheduleStatus = (
  rawStatus: string,
  isLocked: boolean,
  scheduledAt: string | null,
): ScheduleStatus => {
  const normalized = rawStatus.toUpperCase();
  if (normalized.includes("CANCEL")) {
    return "cancelled";
  }
  if (isLocked || normalized.includes("LOCK") || normalized.includes("FINAL")) {
    return "locked";
  }
  if (normalized.includes("COMPLETE") || normalized.includes("DONE")) {
    return "completed";
  }

  if (scheduledAt) {
    const scheduleTime = new Date(scheduledAt).getTime();
    if (Number.isFinite(scheduleTime) && scheduleTime < Date.now()) {
      return "completed";
    }
  }

  return "scheduled";
};

const mapSnapshotToSchedules = (
  snapshot: Record<string, unknown>,
  userCode: string | null,
): DefenseSchedule[] => {
  const committeeItems = toRecordArray(
    pickCaseInsensitiveValue(snapshot, ["committees", "Committees"], []),
  );

  const scoringObject =
    toRecord(pickCaseInsensitiveValue(snapshot, ["scoring", "Scoring"], {})) ?? {};
  const matrixItems = toRecordArray(
    pickCaseInsensitiveValue(scoringObject, ["matrix", "Matrix"], []),
  );

  const committeeCodeMap = new Map<string, CommitteeView>();
  const committeeNumericMap = new Map<number, CommitteeView>();

  committeeItems.forEach((item, index) => {
    const numericId =
      toNumberOrNull(pickCaseInsensitiveValue(item, ["committeeId", "CommitteeId", "id", "Id"], null)) ??
      index + 1;

    const committeeCode = toText(
      pickCaseInsensitiveValue(item, ["committeeCode", "CommitteeCode", "code", "Code"], `HD${numericId}`),
      `HD${numericId}`,
    );
    const committeeName = toText(
      pickCaseInsensitiveValue(item, ["name", "Name", "committeeName", "CommitteeName"], committeeCode),
      committeeCode,
    );

    const room = toText(pickCaseInsensitiveValue(item, ["room", "Room", "location", "Location"], ""), "-");
    const startTime = normalizeTime(
      pickCaseInsensitiveValue(item, ["startTime", "StartTime", "slotStart", "SlotStart"], null),
    );
    const endTime = normalizeTime(
      pickCaseInsensitiveValue(item, ["endTime", "EndTime", "slotEnd", "SlotEnd"], null),
    );
    const committeeDate = toIsoDateOrNull(
      pickCaseInsensitiveValue(item, ["defenseDate", "DefenseDate", "date", "Date", "scheduledAt", "ScheduledAt"], null),
    );

    const session = normalizeSession(
      pickCaseInsensitiveValue(item, ["session", "Session", "sessionCode", "SessionCode"], null),
      inferSessionFromTime(startTime) ?? "MORNING",
    );

    const statusRaw = toText(pickCaseInsensitiveValue(item, ["status", "Status"], ""), "");

    const members = toRecordArray(
      pickCaseInsensitiveValue(item, ["members", "Members"], []),
    );

    const committee: CommitteeView = {
      numericId,
      committeeCode,
      committeeName,
      room,
      scheduledAt: mergeDateAndTime(committeeDate, startTime) ?? committeeDate,
      session,
      startTime,
      endTime,
      statusRaw,
      lecturerRole: resolveLecturerRole(members, userCode),
    };

    committeeCodeMap.set(committeeCode.trim().toUpperCase(), committee);
    committeeNumericMap.set(numericId, committee);
  });

  const scheduleRows: DefenseSchedule[] = [];

  matrixItems.forEach((item, index) => {
    const committeeCodeFromRow = toText(
      pickCaseInsensitiveValue(item, ["committeeCode", "CommitteeCode"], ""),
      "",
    );
    const committeeIdFromRow = toNumberOrNull(
      pickCaseInsensitiveValue(item, ["committeeId", "CommitteeId"], null),
    );

    const matchedCommittee =
      (committeeCodeFromRow ? committeeCodeMap.get(committeeCodeFromRow.toUpperCase()) : undefined) ??
      (committeeIdFromRow != null ? committeeNumericMap.get(committeeIdFromRow) : undefined);

    const assignmentId = toNumberOrNull(
      pickCaseInsensitiveValue(item, ["assignmentId", "AssignmentId"], null),
    );

    const startTime =
      normalizeTime(
        pickCaseInsensitiveValue(item, ["startTime", "StartTime", "slotStart", "SlotStart"], null),
      ) ?? matchedCommittee?.startTime ?? null;
    const endTime =
      normalizeTime(
        pickCaseInsensitiveValue(item, ["endTime", "EndTime", "slotEnd", "SlotEnd"], null),
      ) ?? matchedCommittee?.endTime ?? null;

    const rowDate = toIsoDateOrNull(
      pickCaseInsensitiveValue(item, ["scheduledAt", "ScheduledAt", "defenseDate", "DefenseDate"], null),
    );
    const baseDate = rowDate ?? matchedCommittee?.scheduledAt ?? null;
    const scheduledAt = mergeDateAndTime(baseDate, startTime) ?? baseDate;

    const session = normalizeSession(
      pickCaseInsensitiveValue(item, ["session", "Session", "sessionCode", "SessionCode"], null),
      inferSessionFromTime(startTime) ?? matchedCommittee?.session ?? "MORNING",
    );

    const topicTitle = toText(
      pickCaseInsensitiveValue(item, ["topicTitle", "TopicTitle", "title", "Title"], ""),
      "",
    );

    const topicFallback = toText(
      pickCaseInsensitiveValue(item, ["topicCode", "TopicCode", "assignmentCode", "AssignmentCode"], "Đề tài chưa cập nhật"),
      "Đề tài chưa cập nhật",
    );

    const statusRaw = toText(
      pickCaseInsensitiveValue(item, ["status", "Status"], matchedCommittee?.statusRaw ?? ""),
      "",
    );

    const status = toScheduleStatus(
      statusRaw,
      Boolean(pickCaseInsensitiveValue(item, ["isLocked", "IsLocked"], false)),
      scheduledAt,
    );

    const committeeCode = matchedCommittee?.committeeCode || committeeCodeFromRow || `HD-${committeeIdFromRow ?? index + 1}`;

    scheduleRows.push({
      id: `${committeeCode}-${assignmentId ?? index + 1}`,
      assignmentId,
      topicTitle: topicTitle || topicFallback,
      studentCode: toText(pickCaseInsensitiveValue(item, ["studentCode", "StudentCode"], "-"), "-"),
      studentName: toText(pickCaseInsensitiveValue(item, ["studentName", "StudentName"], "Chưa cập nhật"), "Chưa cập nhật"),
      committeeCode,
      committeeName: matchedCommittee?.committeeName || committeeCode,
      room:
        toText(pickCaseInsensitiveValue(item, ["room", "Room"], matchedCommittee?.room ?? ""), "-") ||
        matchedCommittee?.room ||
        "-",
      scheduledAt,
      session,
      startTime,
      endTime,
      status,
      lecturerRole: matchedCommittee?.lecturerRole ?? "Thành viên hội đồng",
    });
  });

  if (scheduleRows.length === 0) {
    committeeCodeMap.forEach((committee, index) => {
      scheduleRows.push({
        id: `${committee.committeeCode}-${index + 1}`,
        assignmentId: null,
        topicTitle: `Phiên bảo vệ của ${committee.committeeName}`,
        studentCode: "-",
        studentName: "Chưa có danh sách đề tài",
        committeeCode: committee.committeeCode,
        committeeName: committee.committeeName,
        room: committee.room,
        scheduledAt: committee.scheduledAt,
        session: committee.session,
        startTime: committee.startTime,
        endTime: committee.endTime,
        status: toScheduleStatus(committee.statusRaw, false, committee.scheduledAt),
        lecturerRole: committee.lecturerRole,
      });
    });
  }

  return scheduleRows.sort((left, right) => {
    const leftTime = new Date(left.scheduledAt ?? 0).getTime();
    const rightTime = new Date(right.scheduledAt ?? 0).getTime();
    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }
    if ((left.startTime ?? "") !== (right.startTime ?? "")) {
      return (left.startTime ?? "").localeCompare(right.startTime ?? "");
    }
    return left.committeeCode.localeCompare(right.committeeCode);
  });
};

const formatDate = (value: string | null): string => {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }
  return parsed.toLocaleDateString("vi-VN");
};

const formatDateLong = (value: string | null): string => {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }
  return parsed.toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatSession = (session: SessionCode): string =>
  session === "MORNING" ? "Buổi sáng" : "Buổi chiều";

const formatTimeRange = (
  startTime: string | null,
  endTime: string | null,
  scheduledAt: string | null,
): string => {
  if (startTime && endTime) {
    return `${startTime} - ${endTime}`;
  }
  if (startTime) {
    return `Từ ${startTime}`;
  }
  if (!scheduledAt) {
    return "Chưa có khung giờ";
  }
  const parsed = new Date(scheduledAt);
  if (Number.isNaN(parsed.getTime())) {
    return "Chưa có khung giờ";
  }
  return parsed.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

const getStatusText = (status: ScheduleStatus): string => {
  switch (status) {
    case "scheduled":
      return "Đã lên lịch";
    case "completed":
      return "Đã hoàn thành";
    case "locked":
      return "Đã khóa";
    case "cancelled":
      return "Đã hủy";
    default:
      return "Không xác định";
  }
};

const getStatusColor = (status: ScheduleStatus): string => {
  switch (status) {
    case "scheduled":
      return "#c2410c";
    case "completed":
      return "#15803d";
    case "locked":
      return "#1d4ed8";
    case "cancelled":
      return "#dc2626";
    default:
      return "#475569";
  }
};

const getDateKey = (value: string | null): string | null => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildCalendarDays = (date: Date): Array<Date | null> => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const result: Array<Date | null> = [];
  for (let index = 0; index < firstDay.getDay(); index += 1) {
    result.push(null);
  }
  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    result.push(new Date(year, month, day));
  }
  return result;
};

const LecturerSchedule: React.FC = () => {
  const auth = useAuth();
  const [searchParams] = useSearchParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSchedule, setSelectedSchedule] = useState<DefenseSchedule | null>(null);
  const [schedules, setSchedules] = useState<DefenseSchedule[]>([]);
  const [periodLabel, setPeriodLabel] = useState<string>("Đợt đang hoạt động");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodId, setPeriodId] = useState<number | null>(() => {
    const fromQuery = normalizeDefensePeriodId(searchParams.get("periodId"));
    return fromQuery ?? getActiveDefensePeriodId();
  });

  useEffect(() => {
    const fromQuery = normalizeDefensePeriodId(searchParams.get("periodId"));
    const nextPeriod = fromQuery ?? getActiveDefensePeriodId();
    if (nextPeriod !== periodId) {
      setPeriodId(nextPeriod);
    }
  }, [periodId, searchParams]);

  useEffect(() => {
    const hydrateSchedule = async () => {
      setLoading(true);
      setError(null);

      try {
        const endpoint = periodId
          ? `/defense-periods/${periodId}/lecturer/snapshot`
          : "/lecturer-defense/current/snapshot";

        const response = await fetchData<Record<string, unknown>>(endpoint);
        const envelopeResponse = response as unknown as ApiResponse<Record<string, unknown>>;

        if (!readEnvelopeSuccess(envelopeResponse)) {
          const apiError =
            readEnvelopeErrorMessages(envelopeResponse)[0] ||
            readEnvelopeMessage(envelopeResponse) ||
            "Không tải được lịch hội đồng từ API snapshot.";
          setError(apiError);
          setSchedules([]);
          return;
        }

        const rootData =
          toRecord(readEnvelopeData(envelopeResponse)) ||
          toRecord(response.data) ||
          {};

        const periodObject =
          toRecord(pickCaseInsensitiveValue(rootData, ["period", "Period", "currentPeriod", "CurrentPeriod"], null));

        const resolvedPeriodId = toNumberOrNull(
          periodObject
            ? pickCaseInsensitiveValue(periodObject, ["periodId", "PeriodId", "id", "Id"], null)
            : periodId,
        );

        if (resolvedPeriodId != null) {
          setActiveDefensePeriodId(resolvedPeriodId);
          if (periodId == null) {
            setPeriodId(resolvedPeriodId);
          }
        }

        const periodName = periodObject
          ? toText(
              pickCaseInsensitiveValue(periodObject, ["name", "Name"], resolvedPeriodId ? `Đợt #${resolvedPeriodId}` : "Đợt đang hoạt động"),
              resolvedPeriodId ? `Đợt #${resolvedPeriodId}` : "Đợt đang hoạt động",
            )
          : resolvedPeriodId
            ? `Đợt #${resolvedPeriodId}`
            : "Đợt đang hoạt động";

        setPeriodLabel(periodName);

        const snapshot =
          toRecord(pickCaseInsensitiveValue(rootData, ["snapshot", "Snapshot"], rootData)) ||
          {};

        const mappedSchedules = mapSnapshotToSchedules(snapshot, auth.user?.userCode ?? null);
        setSchedules(mappedSchedules);
      } catch (caughtError) {
        if (caughtError instanceof FetchDataError) {
          setError(
            caughtError.message ||
              "Không tải được lịch bảo vệ. Vui lòng kiểm tra kết nối API.",
          );
        } else {
          setError("Không tải được lịch bảo vệ. Vui lòng thử lại.");
        }
        setSchedules([]);
      } finally {
        setLoading(false);
      }
    };

    void hydrateSchedule();
  }, [auth.user?.userCode, periodId]);

  const schedulesByDay = useMemo(() => {
    const map = new Map<string, DefenseSchedule[]>();
    schedules.forEach((schedule) => {
      const key = getDateKey(schedule.scheduledAt);
      if (!key) {
        return;
      }
      const currentRows = map.get(key) ?? [];
      currentRows.push(schedule);
      currentRows.sort((left, right) => {
        const leftTime = new Date(left.scheduledAt ?? 0).getTime();
        const rightTime = new Date(right.scheduledAt ?? 0).getTime();
        return leftTime - rightTime;
      });
      map.set(key, currentRows);
    });
    return map;
  }, [schedules]);

  const monthSchedules = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return schedules.filter((schedule) => {
      const parsed = new Date(schedule.scheduledAt ?? 0);
      if (Number.isNaN(parsed.getTime())) {
        return false;
      }
      return parsed.getFullYear() === year && parsed.getMonth() === month;
    });
  }, [currentDate, schedules]);

  const upcomingInMonth = useMemo(
    () => monthSchedules.filter((item) => item.status === "scheduled").length,
    [monthSchedules],
  );
  const completedInMonth = useMemo(
    () => monthSchedules.filter((item) => item.status === "completed" || item.status === "locked").length,
    [monthSchedules],
  );

  const calendarDays = useMemo(() => buildCalendarDays(currentDate), [currentDate]);

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((previous) => {
      const next = new Date(previous);
      next.setMonth(previous.getMonth() + (direction === "next" ? 1 : -1));
      return next;
    });
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1360, margin: "0 auto", padding: 24 }}>
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 28, textAlign: "center", color: "#475569" }}>
          Đang tải lịch hội đồng từ snapshot...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 1360, margin: "0 auto", padding: 24 }}>
        <div style={{ border: "1px solid #fed7aa", borderRadius: 14, padding: 28, background: "#fff7ed", color: "#9a3412" }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1360, margin: "0 auto", padding: 24, fontFamily: '"Be Vietnam Pro", "Segoe UI", sans-serif' }}>
      <style>
        {`
          .lec-schedule-root {
            --lec-accent: #f37021;
            --lec-ink: #0f172a;
            --lec-muted: #64748b;
            --lec-line: #e2e8f0;
          }
          .lec-schedule-root .month-nav {
            border: 1px solid var(--lec-line);
            border-radius: 10px;
            width: 40px;
            height: 40px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            background: #fff;
            color: #334155;
          }
          .lec-schedule-root .month-nav:hover {
            border-color: var(--lec-accent);
            color: var(--lec-accent);
          }
          .lec-schedule-root .day-cell {
            border: 1px solid var(--lec-line);
            border-radius: 12px;
            min-height: 122px;
            padding: 10px;
            background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
            display: grid;
            gap: 6px;
          }
          .lec-schedule-root .day-chip {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 4px 6px;
            font-size: 11px;
            font-weight: 600;
            background: #ffffff;
            cursor: pointer;
            color: #0f172a;
            text-align: left;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          @media (max-width: 900px) {
            .lec-schedule-root .calendar-grid {
              gap: 6px;
            }
            .lec-schedule-root .day-cell {
              min-height: 94px;
              padding: 8px;
            }
          }
        `}
      </style>

      <div className="lec-schedule-root">
        <section
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            padding: 18,
            background: "linear-gradient(145deg, #ffffff 0%, #fff7ed 100%)",
            boxShadow: "0 14px 36px rgba(15, 23, 42, 0.09)",
            marginBottom: 16,
          }}
        >
          <h1 style={{ margin: 0, display: "flex", alignItems: "center", gap: 10, color: "#c2410c", fontSize: 31, fontWeight: 800 }}>
            <Calendar size={30} /> Lịch hội đồng giảng viên
          </h1>
          <div style={{ marginTop: 10, color: "#334155", fontSize: 14 }}>
            Dữ liệu lấy trực tiếp từ snapshot hội đồng theo đề tài, hiển thị rõ buổi và khung giờ cụ thể.
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ border: "1px solid #fdba74", borderRadius: 999, padding: "5px 11px", background: "#fff7ed", color: "#9a3412", fontSize: 12, fontWeight: 700 }}>
              {periodLabel}
            </span>
            <span style={{ border: "1px solid #cbd5e1", borderRadius: 999, padding: "5px 11px", background: "#ffffff", color: "#334155", fontSize: 12, fontWeight: 700 }}>
              Tổng lịch: {monthSchedules.length}
            </span>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <article style={{ border: "1px solid #fdba74", borderRadius: 14, padding: 14, background: "#fff7ed" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#9a3412", fontSize: 12, fontWeight: 700 }}>
              <Calendar size={16} /> Lịch tháng
            </div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 800, color: "#9a3412" }}>{monthSchedules.length}</div>
          </article>
          <article style={{ border: "1px solid #fcd34d", borderRadius: 14, padding: 14, background: "#fffbeb" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#a16207", fontSize: 12, fontWeight: 700 }}>
              <Clock3 size={16} /> Sắp diễn ra
            </div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 800, color: "#a16207" }}>{upcomingInMonth}</div>
          </article>
          <article style={{ border: "1px solid #86efac", borderRadius: 14, padding: 14, background: "#f0fdf4" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#166534", fontSize: 12, fontWeight: 700 }}>
              <GraduationCap size={16} /> Đã hoàn thành hoặc khóa
            </div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 800, color: "#166534" }}>{completedInMonth}</div>
          </article>
        </section>

        <section style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: 16, background: "#ffffff", boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <button type="button" className="month-nav" onClick={() => navigateMonth("prev")}>
              <ChevronLeft size={20} />
            </button>
            <h2 style={{ margin: 0, fontSize: 20, color: "#0f172a" }}>
              {currentDate.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
            </h2>
            <button type="button" className="month-nav" onClick={() => navigateMonth("next")}>
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="calendar-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 8 }}>
            {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
              <div key={day} style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: "#64748b", padding: "4px 0" }}>
                {day}
              </div>
            ))}

            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} />;
              }

              const key = getDateKey(date.toISOString());
              const daySchedules = key ? schedulesByDay.get(key) ?? [] : [];
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={date.toISOString()}
                  className="day-cell"
                  style={{
                    borderColor: isToday ? "#f37021" : "#e2e8f0",
                    background: isToday ? "linear-gradient(180deg, #fff7ed 0%, #ffffff 100%)" : undefined,
                  }}
                >
                  <div style={{ fontWeight: isToday ? 800 : 700, color: isToday ? "#c2410c" : "#0f172a" }}>{date.getDate()}</div>

                  <div style={{ display: "grid", gap: 4 }}>
                    {daySchedules.slice(0, 2).map((schedule) => (
                      <button
                        key={schedule.id}
                        type="button"
                        className="day-chip"
                        onClick={() => setSelectedSchedule(schedule)}
                        style={{ borderColor: `${getStatusColor(schedule.status)}55` }}
                        title={`${schedule.committeeCode} - ${schedule.topicTitle}`}
                      >
                        {formatTimeRange(schedule.startTime, null, schedule.scheduledAt)} · {schedule.committeeCode}
                      </button>
                    ))}
                    {daySchedules.length > 2 && (
                      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>+{daySchedules.length - 2} lịch khác</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {selectedSchedule && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2500,
            background: "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setSelectedSchedule(null)}
        >
          <div
            style={{
              width: "min(640px, calc(100vw - 24px))",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              background: "#ffffff",
              boxShadow: "0 26px 58px rgba(2, 6, 23, 0.34)",
              padding: 20,
              display: "grid",
              gap: 14,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b", marginBottom: 4 }}>
                  <GraduationCap size={15} /> Chi tiết lịch bảo vệ
                </div>
                <h3 style={{ margin: 0, fontSize: 22, color: "#0f172a" }}>{selectedSchedule.topicTitle}</h3>
              </div>
              <span
                style={{
                  border: `1px solid ${getStatusColor(selectedSchedule.status)}55`,
                  background: `${getStatusColor(selectedSchedule.status)}14`,
                  color: getStatusColor(selectedSchedule.status),
                  borderRadius: 999,
                  padding: "5px 10px",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {getStatusText(selectedSchedule.status)}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Sinh viên</div>
                <div style={{ marginTop: 4, fontWeight: 700, color: "#0f172a" }}>{selectedSchedule.studentName}</div>
                <div style={{ marginTop: 2, fontSize: 13, color: "#475569" }}>{selectedSchedule.studentCode}</div>
              </div>

              <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Buổi và thời gian</div>
                <div style={{ marginTop: 4, fontWeight: 700, color: "#0f172a" }}>{formatSession(selectedSchedule.session)}</div>
                <div style={{ marginTop: 2, fontSize: 13, color: "#475569" }}>
                  {formatTimeRange(selectedSchedule.startTime, selectedSchedule.endTime, selectedSchedule.scheduledAt)}
                </div>
              </div>

              <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Ngày bảo vệ</div>
                <div style={{ marginTop: 4, fontWeight: 700, color: "#0f172a" }}>{formatDateLong(selectedSchedule.scheduledAt)}</div>
                <div style={{ marginTop: 2, fontSize: 13, color: "#475569" }}>{formatDate(selectedSchedule.scheduledAt)}</div>
              </div>

              <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Hội đồng</div>
                <div style={{ marginTop: 4, fontWeight: 700, color: "#0f172a" }}>{selectedSchedule.committeeName}</div>
                <div style={{ marginTop: 2, fontSize: 13, color: "#475569" }}>{selectedSchedule.committeeCode}</div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#334155", fontSize: 14 }}>
                <MapPin size={14} /> Phòng: <strong>{selectedSchedule.room}</strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#334155", fontSize: 14 }}>
                <UsersRound size={14} /> Vai trò của tôi: <strong>{selectedSchedule.lecturerRole}</strong>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setSelectedSchedule(null)}
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                  background: "#ffffff",
                  color: "#0f172a",
                  fontWeight: 700,
                  minHeight: 40,
                  padding: "0 16px",
                  cursor: "pointer",
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LecturerSchedule;
