import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  createConcurrencyToken,
  createIdempotencyKey,
  ucError,
  type SessionCode,
  type WorkflowActionTrace,
} from "../../types/defense-workflow-contract";
import { useToast } from "../../context/useToast";
import { FetchDataError, fetchData, normalizeUrl } from "../../api/fetchData";
import type { ApiResponse } from "../../types/api";
import {
  pickCaseInsensitiveValue,
  readEnvelopeAllowedActions,
  readEnvelopeData,
  readEnvelopeErrorMessages,
  readEnvelopeMessage,
  readEnvelopeSuccess,
  readEnvelopeWarningMessages,
  toCompatResponse,
} from "../../utils/api-envelope";
import {
  getActiveDefensePeriodId,
  normalizeDefensePeriodId,
  setActiveDefensePeriodId,
} from "../../utils/defensePeriod";

import {
  ArrowRight,
  Building2,
  CalendarDays,
  CalendarClock,
  CheckCircle2,
  ClipboardPen,
  Clock3,
  Eye,
  ExternalLink,
  FileText,
  Gavel,
  Info,
  LayoutDashboard,
  Lock,
  MapPin,
  MessageSquareText,
  PencilRuler,
  Save,
  Star,
  Users2,
  XCircle,
} from "lucide-react";

type Committee = {
  id: string;
  name: string;
  numericId: number;
  room: string;
  session: SessionCode | null;
  date: string | null;
  slot: string | null;
  studentCount: number;
  status: "Sắp diễn ra" | "Đang họp" | "Đã khóa";
  normalizedRole: CommitteeRoleCode;
  roleCode: CommitteeRoleCode;
  roleLabel: string;
  roleRaw: string;
  allowedScoringActions: string[];
  allowedMinuteActions: string[];
  allowedRevisionActions: string[];
  members: CommitteeMemberView[];
};

type CommitteeRoleCode = "CT" | "UVTK" | "UVPB" | "UV" | "UNKNOWN";

type CommitteeMemberView = {
  memberId: string;
  lecturerCode: string;
  lecturerName: string;
  roleRaw: string;
  roleCode: CommitteeRoleCode;
  roleLabel: string;
};

type RevisionRequest = {
  revisionId: number;
  assignmentId: number | null;
  studentCode: string;
  topicCode: string | null;
  topicTitle: string;
  revisionFileUrl: string | null;
  lastUpdated: string | null;
  status: "pending" | "approved" | "rejected";
  reason?: string;
};

type PanelKey = "councils" | "grading";

type CommitteeDetailTabKey = "overview" | "members" | "topics";

type WorkspaceTabKey = "scoring" | "minutes" | "review";

type GradingRoomView = "scoring" | "reports";

type CurrentDefensePeriodView = {
  periodId: number;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
};

const EMPTY_REVISION: RevisionRequest = {
  revisionId: 0,
  assignmentId: null,
  studentCode: "",
  topicCode: null,
  topicTitle: "",
  revisionFileUrl: null,
  lastUpdated: null,
  status: "pending",
};

type ScoringOverview = {
  variance: number | null;
  varianceThreshold: number | null;
  finalScore: number | null;
  finalLetter: string | null;
};

type DefenseDocument = {
  documentId: number;
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
  uploadedAt: string | null;
};

type ScoringMatrixRow = {
  committeeId: number;
  committeeCode: string;
  committeeName: string;
  assignmentId: number;
  assignmentCode: string;
  topicCode: string | null;
  topicTitle: string;
  studentCode: string;
  studentName: string;
  supervisorLecturerName: string | null;
  topicTags: string[];
  session: SessionCode | null;
  scheduledAt: string | null;
  startTime: string | null;
  endTime: string | null;
  topicSupervisorScore: number | null;
  scoreGvhd: number | null;
  scoreCt: number | null;
  scoreTk: number | null;
  scorePb: number | null;
  finalScore: number | null;
  finalGrade: string | null;
  variance: number | null;
  isLocked: boolean;
  status: string;
  submittedCount: number;
  requiredCount: number;
  defenseDocuments: DefenseDocument[];
};

type ScoringAlertRow = {
  assignmentId: number;
  message: string;
  value: number | null;
  threshold: number | null;
};

const panels: Array<{ key: PanelKey; label: string; icon: React.ReactNode }> = [
  { key: "councils", label: "Hội đồng của tôi", icon: <Users2 size={15} /> },
  { key: "grading", label: "Phòng chấm điểm hội đồng", icon: <PencilRuler size={15} /> },
];

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  padding: 18,
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

const normalizeCommitteeRole = (value: unknown): CommitteeRoleCode => {
  const raw = String(value ?? "").trim().toUpperCase();
  if (!raw) {
    return "UNKNOWN";
  }

  if (
    raw === "CT" ||
    raw === "CHAIR" ||
    raw.includes("CHU TICH") ||
    raw.includes("CHỦ TỊCH")
  ) {
    return "CT";
  }

  if (
    raw === "UVTK" ||
    raw === "TK" ||
    raw === "SECRETARY" ||
    raw.includes("THU KY") ||
    raw.includes("THƯ KÝ")
  ) {
    return "UVTK";
  }

  if (
    raw === "UVPB" ||
    raw === "PB" ||
    raw === "REVIEWER" ||
    raw.includes("PHAN BIEN") ||
    raw.includes("PHẢN BIỆN")
  ) {
    return "UVPB";
  }

  if (raw === "UV" || raw === "MEMBER" || raw.includes("UY VIEN") || raw.includes("ỦY VIÊN")) {
    return "UV";
  }

  return "UNKNOWN";
};

const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

const toStringOrNull = (value: unknown): string | null => {
  const text = String(value ?? "").trim();
  return text ? text : null;
};

const toBooleanOrNull = (value: unknown): boolean | null => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value !== 0 : null;
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

  return null;
};

const toIsoDateOrNull = (value: unknown): string | null => {
  const text = String(value ?? "").trim();
  if (!text) {
    return null;
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
};

const toNumberOrNull = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeTopicTagNames = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    const normalized = value
      .map((item) => {
        if (typeof item === "string") {
          return item.trim();
        }
        const record = toRecord(item);
        if (!record) {
          return "";
        }
        return (
          toStringOrNull(
            pickCaseInsensitiveValue(
              record,
              ["tagName", "TagName", "name", "Name", "tagCode", "TagCode", "code", "Code"],
              null,
            ),
          ) ?? ""
        );
      })
      .map((item) => item.trim())
      .filter(Boolean);

    return Array.from(new Set(normalized));
  }

  if (typeof value === "string") {
    const fromText = value
      .split(/[;,|]/)
      .map((item) => item.trim())
      .filter(Boolean);
    return Array.from(new Set(fromText));
  }

  return [];
};

const normalizeTimeText = (value: unknown): string | null => {
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
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const inferSessionFromTime = (timeValue: string | null): SessionCode | null => {
  if (!timeValue) {
    return null;
  }
  const [hourText] = timeValue.split(":");
  const hour = Number(hourText);
  if (!Number.isFinite(hour)) {
    return null;
  }
  return hour >= 12 ? "AFTERNOON" : "MORNING";
};

const normalizeSessionCode = (value: unknown): SessionCode => {
  const raw = String(value ?? "").trim().toUpperCase();
  if (
    raw === "AFTERNOON" ||
    raw === "2" ||
    raw.includes("CHIEU") ||
    raw.includes("PM")
  ) {
    return "AFTERNOON";
  }
  return "MORNING";
};

const mapCurrentPeriodView = (
  periodRecord: Record<string, unknown> | null,
): CurrentDefensePeriodView | null => {
  if (!periodRecord) {
    return null;
  }

  const periodId = normalizeDefensePeriodId(
    pickCaseInsensitiveValue(
      periodRecord,
      ["defenseTermId", "DefenseTermId", "periodId", "PeriodId", "id", "Id"],
      null,
    ),
  );

  if (periodId == null || periodId <= 0) {
    return null;
  }

  return {
    periodId,
    name:
      String(
        pickCaseInsensitiveValue(periodRecord, ["name", "Name", "title", "Title"], ""),
      ).trim() || `Đợt ${periodId}`,
    status:
      String(
        pickCaseInsensitiveValue(periodRecord, ["status", "Status", "state", "State"], "UNKNOWN"),
      ).trim() || "UNKNOWN",
    startDate: toIsoDateOrNull(
      pickCaseInsensitiveValue(periodRecord, ["startDate", "StartDate", "startedAt", "StartedAt"], null),
    ),
    endDate: toIsoDateOrNull(
      pickCaseInsensitiveValue(periodRecord, ["endDate", "EndDate", "endedAt", "EndedAt"], null),
    ),
  };
};

const readApiErrorMessage = (payload: unknown): string | null => {
  const record = toRecord(payload);
  if (!record) {
    return null;
  }

  const directMessage = toStringOrNull(
    pickCaseInsensitiveValue(record, ["message", "Message", "title", "Title"], null),
  );
  if (directMessage) {
    return directMessage;
  }

  const errorRecord = toRecord(
    pickCaseInsensitiveValue(record, ["errors", "Errors"], null),
  );
  if (!errorRecord) {
    return null;
  }

  for (const value of Object.values(errorRecord)) {
    if (Array.isArray(value) && value.length > 0) {
      const first = toStringOrNull(value[0]);
      if (first) {
        return first;
      }
    }
  }

  return null;
};

const getRoleLabel = (roleCode: CommitteeRoleCode): string => {
  switch (roleCode) {
    case "CT":
      return "Chủ tịch hội đồng";
    case "UVTK":
      return "Ủy viên thư ký hội đồng";
    case "UVPB":
      return "Ủy viên phản biện hội đồng";
    case "UV":
      return "Ủy viên hội đồng";
    default:
      return "Không xác định";
  }
};

const mapCommitteeStatus = (value: unknown): Committee["status"] => {
  const raw = String(value ?? "").trim().toUpperCase();
  if (raw === "LOCKED" || raw === "COMPLETED" || raw === "FINALIZED") {
    return "Đã khóa";
  }
  if (raw === "LIVE" || raw === "ONGOING") {
    return "Đang họp";
  }
  return "Sắp diễn ra";
};

const normalizeAllowedActions = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => String(item ?? "").trim().toUpperCase())
        .filter(Boolean),
    ),
  );
};

const includesAnyAction = (allowedActions: string[], ...targets: string[]): boolean => {
  if (allowedActions.length === 0) {
    return false;
  }

  const normalizedTargets = targets
    .map((item) => String(item ?? "").trim().toUpperCase())
    .filter(Boolean);

  if (normalizedTargets.length === 0) {
    return false;
  }

  return normalizedTargets.some((action) => allowedActions.includes(action));
};

const LecturerCommittees: React.FC = () => {
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [periodId, setPeriodId] = useState<number | null>(() => getActiveDefensePeriodId());
  const [currentPeriod, setCurrentPeriod] = useState<CurrentDefensePeriodView | null>(null);
  const [currentSnapshotError, setCurrentSnapshotError] = useState<string | null>(null);
  const [councilListLocked, setCouncilListLocked] = useState<boolean | null>(null);
  const [councilLockStatus, setCouncilLockStatus] = useState<string>("UNKNOWN");
  const periodBase = periodId ? `/defense-periods/${periodId}` : "";
  const lecturerBase = `${periodBase}/lecturer`;
  const periodIdText = String(periodId ?? "");
  const pickSnapshotSection = pickCaseInsensitiveValue;

  const syncPeriodToUrl = (nextPeriodId: number | null) => {
    const currentPeriodId = normalizeDefensePeriodId(searchParams.get("periodId"));
    if (currentPeriodId === nextPeriodId) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    if (nextPeriodId != null) {
      nextParams.set("periodId", String(nextPeriodId));
    } else {
      nextParams.delete("periodId");
    }
    setSearchParams(nextParams, { replace: true });
  };

  const getLecturerSnapshot = async (committeeId?: string | number) => {
    const committeeQuery =
      committeeId == null || String(committeeId).trim() === ""
        ? ""
        : `?committeeId=${encodeURIComponent(String(committeeId))}`;

    let envelope: ApiResponse<Record<string, unknown>>;
    try {
      envelope = await fetchData<ApiResponse<Record<string, unknown>>>(
        `/lecturer-defense/current/snapshot${committeeQuery}`,
        {
          method: "GET",
        },
      );
    } catch (error) {
      if (periodId == null || periodId <= 0) {
        throw error;
      }

      envelope = await fetchData<ApiResponse<Record<string, unknown>>>(
        `${lecturerBase}/snapshot${committeeQuery}`,
        {
          method: "GET",
        },
      );
    }

    const payloadRecord =
      toRecord(readEnvelopeData<Record<string, unknown>>(envelope)) ?? {};
    const periodView = mapCurrentPeriodView(
      toRecord(
        pickSnapshotSection(payloadRecord, ["period", "Period"], null),
      ),
    );

    if (periodView) {
      setPeriodId(periodView.periodId);
      setActiveDefensePeriodId(periodView.periodId);
      syncPeriodToUrl(periodView.periodId);
      setCurrentPeriod(periodView);
    } else if (periodId != null && periodId > 0) {
      syncPeriodToUrl(periodId);
      setCurrentPeriod((prev) =>
        prev ?? {
          periodId,
          name: `Đợt #${periodId}`,
          status: "UNKNOWN",
          startDate: null,
          endDate: null,
        },
      );
    } else {
      throw new Error("CURRENT_PERIOD_CONTRACT_INVALID");
    }
    setCurrentSnapshotError(null);

    const snapshot =
      toRecord(
        pickSnapshotSection(payloadRecord, ["snapshot", "Snapshot"], payloadRecord),
      ) ?? {};

    return toCompatResponse(envelope, snapshot);
  };

  const lecturerApi = {
    getCommittees: async () => {
      const snapshotRes = await getLecturerSnapshot();
      const snapshot = readEnvelopeData<Record<string, unknown>>(snapshotRes);
      const committeesSource = pickSnapshotSection<unknown>(
        snapshot,
        ["committees", "Committees"],
        [],
      );

      const committeeContainer = toRecord(committeesSource);
      const rowsSource =
        Array.isArray(committeesSource)
          ? committeesSource
          : pickSnapshotSection<unknown[]>(
              committeeContainer ?? {},
              ["committees", "Committees", "items", "Items"],
              [],
            );

      const rows = Array.isArray(rowsSource)
        ? rowsSource
            .map((item) => toRecord(item))
            .filter((item): item is Record<string, unknown> => Boolean(item))
        : [];

      const lockFlag = toBooleanOrNull(
        pickSnapshotSection<unknown>(
          committeeContainer ?? {},
          ["councilListLocked", "CouncilListLocked"],
          null,
        ),
      );
      const lockStatus = toStringOrNull(
        pickSnapshotSection<unknown>(
          committeeContainer ?? {},
          ["councilLockStatus", "CouncilLockStatus"],
          null,
        ),
      );

      return toCompatResponse(snapshotRes, {
        items: rows,
        councilListLocked: lockFlag,
        councilLockStatus: lockStatus,
      });
    },
    getCommitteeMinutes: async (id: string | number) => {
      const snapshotRes = await getLecturerSnapshot(id);
      const snapshot = readEnvelopeData<Record<string, unknown>>(snapshotRes);
      const minutesRows = pickSnapshotSection<Array<Record<string, unknown>>>(
        snapshot,
        ["minutes", "Minutes"],
        [],
      );
      const committeeId = Number(id);
      const committeeCode = String(id).trim().toUpperCase();
      const filtered = (Array.isArray(minutesRows) ? minutesRows : []).filter(
        (item) => {
          const row = toRecord(item) ?? {};
          const rowCommitteeId = Number(
            pickSnapshotSection<unknown>(
              row,
              ["committeeId", "CommitteeId", "councilId", "CouncilId"],
              0,
            ),
          );
          const rowCommitteeCode = String(
            pickSnapshotSection<unknown>(
              row,
              ["committeeCode", "CommitteeCode", "councilCode", "CouncilCode"],
              "",
            ),
          )
            .trim()
            .toUpperCase();

          return rowCommitteeId === committeeId || (committeeCode && rowCommitteeCode === committeeCode);
        },
      );

      return toCompatResponse(snapshotRes, filtered);
    },
    updateCommitteeMinutes: (id: string | number, payload: Record<string, unknown>, idempotencyKey?: string) =>
      fetchData<ApiResponse<boolean>>(`${lecturerBase}/minutes/upsert`, {
        method: "POST",
        body: {
          committeeId: Number(id),
          data: payload,
          ...(idempotencyKey ? { idempotencyKey } : {}),
        },
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
    submitIndependentScore: (id: string | number, payload: Record<string, unknown>, idempotencyKey?: string) =>
      fetchData<ApiResponse<boolean>>(`${lecturerBase}/scoring/actions`, {
        method: "POST",
        body: {
          action: "SUBMIT",
          committeeId: Number(id),
          score: payload,
          ...(idempotencyKey ? { idempotencyKey } : {}),
        },
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
    openSessionByCommittee: (id: string | number, idempotencyKey?: string) =>
      fetchData<ApiResponse<boolean>>(`${lecturerBase}/scoring/actions`, {
        method: "POST",
        body: {
          action: "OPEN_SESSION",
          committeeId: Number(id),
          ...(idempotencyKey ? { idempotencyKey } : {}),
        },
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
    reopenRequestByCommittee: (id: string | number, payload: Record<string, unknown>, idempotencyKey?: string) =>
      fetchData<ApiResponse<boolean>>(`${lecturerBase}/scoring/actions`, {
        method: "POST",
        body: {
          action: "REOPEN_REQUEST",
          committeeId: Number(id),
          reopen: payload,
          ...(idempotencyKey ? { idempotencyKey } : {}),
        },
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
    lockSessionByCommittee: (id: string | number, idempotencyKey?: string) =>
      fetchData<ApiResponse<boolean>>(`${lecturerBase}/scoring/actions`, {
        method: "POST",
        body: {
          action: "LOCK_SESSION",
          committeeId: Number(id),
          ...(idempotencyKey ? { idempotencyKey } : {}),
        },
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
    getRevisionQueue: async () => {
      const snapshotRes = await getLecturerSnapshot();
      const snapshot = readEnvelopeData<Record<string, unknown>>(snapshotRes);
      const queue = pickSnapshotSection<Array<Record<string, unknown>>>(
        snapshot,
        ["revisionQueue", "RevisionQueue"],
        [],
      );
      return toCompatResponse(snapshotRes, Array.isArray(queue) ? queue : []);
    },
    getScoringMatrix: async (committeeId?: string | number) => {
      const snapshotRes = await getLecturerSnapshot();
      const snapshot = readEnvelopeData<Record<string, unknown>>(snapshotRes);
      const scoring = pickSnapshotSection<Record<string, unknown>>(
        snapshot,
        ["scoring", "Scoring"],
        {},
      );
      const matrixRows = pickSnapshotSection<Array<Record<string, unknown>>>(
        scoring,
        ["matrix", "Matrix"],
        [],
      );
      const normalizedRows = Array.isArray(matrixRows) ? matrixRows : [];
      const filtered =
        committeeId == null
          ? normalizedRows
          : normalizedRows.filter(
              (item) =>
                Number(item.committeeId ?? item.councilId ?? 0) ===
                  Number(committeeId) ||
                String(item.committeeCode ?? "") === String(committeeId),
            );
      return toCompatResponse(snapshotRes, filtered);
    },
    getScoringAlerts: async (committeeId?: string | number) => {
      const snapshotRes = await getLecturerSnapshot();
      const snapshot = readEnvelopeData<Record<string, unknown>>(snapshotRes);
      const scoring = pickSnapshotSection<Record<string, unknown>>(
        snapshot,
        ["scoring", "Scoring"],
        {},
      );
      const alertRows = pickSnapshotSection<Array<Record<string, unknown>>>(
        scoring,
        ["alerts", "Alerts"],
        [],
      );
      const normalizedRows = Array.isArray(alertRows) ? alertRows : [];
      const filtered =
        committeeId == null
          ? normalizedRows
          : normalizedRows.filter(
              (item) =>
                Number(item.committeeId ?? item.councilId ?? 0) ===
                  Number(committeeId) ||
                String(item.committeeCode ?? "") === String(committeeId),
            );
      return toCompatResponse(snapshotRes, filtered);
    },
    approveRevision: (revisionId: number, idempotencyKey?: string) =>
      fetchData<ApiResponse<boolean>>(`${lecturerBase}/revisions/actions`, {
        method: "POST",
        body: {
          action: "APPROVE",
          revisionId,
          ...(idempotencyKey ? { idempotencyKey } : {}),
        },
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
    rejectRevision: (revisionId: number, reason: string, idempotencyKey?: string) =>
      fetchData<ApiResponse<boolean>>(`${lecturerBase}/revisions/actions`, {
        method: "POST",
        body: {
          action: "REJECT",
          revisionId,
          reject: {
            reason,
          },
          ...(idempotencyKey ? { idempotencyKey } : {}),
        },
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
  };
  const notifyError = (message: string) => addToast(message, "error");
  const notifySuccess = (message: string) => addToast(message, "success");
  const notifyInfo = (message: string) => addToast(message, "info");

  useEffect(() => {
    setActiveDefensePeriodId(periodId);
  }, [periodId]);

  const [activePanel, setActivePanel] = useState<PanelKey>("councils");
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [detailCommitteeId, setDetailCommitteeId] = useState<string>("");
  const [detailTab, setDetailTab] = useState<CommitteeDetailTabKey>("overview");
  const [revisionQueue, setRevisionQueue] = useState<RevisionRequest[]>([]);
  const [selectedCommitteeId, setSelectedCommitteeId] = useState<string>("");
  const [joinedCommitteeId, setJoinedCommitteeId] = useState<string>("");
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTabKey>("scoring");
  const [loadingData, setLoadingData] = useState(false);
  const [reopenReason, setReopenReason] = useState("Cần hội đồng thống nhất lại vì có chênh lệch điểm.");
  const [assignmentConcurrencyToken, setAssignmentConcurrencyToken] = useState(
    createConcurrencyToken("lecturer-assignment")
  );
  const [latestActionTrace, setLatestActionTrace] = useState<WorkflowActionTrace | null>(null);
  const [scoringOverview, setScoringOverview] = useState<ScoringOverview>({
    variance: null,
    varianceThreshold: null,
    finalScore: null,
    finalLetter: null,
  });

  const [summary, setSummary] = useState("Sinh viên trình bày rõ phạm vi và mục tiêu đề tài.");
  const [review, setReview] = useState("Cần bổ sung đánh giá hiệu năng theo từng nhóm dữ liệu.");
  const [questions, setQuestions] = useState("1) Baseline đang dùng là gì? 2) Kết quả theo từng lớp dữ liệu?");
  const [answers, setAnswers] = useState("Sinh viên trả lời đúng trọng tâm và có minh chứng số liệu.");
  const [strengths, setStrengths] = useState("Mô hình có tính ứng dụng tốt, pipeline rõ ràng.");
  const [weaknesses, setWeaknesses] = useState("Thiếu đối sánh benchmark đầy đủ ở vài ngữ cảnh.");
  const [recommendations, setRecommendations] = useState("Bổ sung benchmark đa bộ dữ liệu trước khi công bố chính thức.");
  const [lastAutoSave, setLastAutoSave] = useState<string | null>(null);

  const [myScore, setMyScore] = useState("8.5");
  const [myComment, setMyComment] = useState("Đề tài đạt yêu cầu, có tiềm năng ứng dụng thực tế.");
  const [submitted, setSubmitted] = useState(false);
  const [chairRequestedReopen, setChairRequestedReopen] = useState(false);
  const [sessionLocked, setSessionLocked] = useState(false);

  const [revision, setRevision] = useState<RevisionRequest>(EMPTY_REVISION);
  const [allScoringRows, setAllScoringRows] = useState<ScoringMatrixRow[]>([]);
  const [scoringMatrix, setScoringMatrix] = useState<ScoringMatrixRow[]>([]);
  const [scoringAlerts, setScoringAlerts] = useState<ScoringAlertRow[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number>(0);
  const [fallbackAllowedActions, setFallbackAllowedActions] = useState<string[]>([]);
  const [roomView, setRoomView] = useState<GradingRoomView>("scoring");
  const [roomNow, setRoomNow] = useState<Date>(() => new Date());

  const normalizedFallbackAllowedActions = useMemo(
    () => normalizeAllowedActions(fallbackAllowedActions),
    [fallbackAllowedActions],
  );

  const hasAllowedAction = (scopedActions: string[], ...actions: string[]) => {
    const normalizedScopedActions = normalizeAllowedActions(scopedActions);
    if (normalizedScopedActions.length > 0) {
      return includesAnyAction(normalizedScopedActions, ...actions);
    }
    if (normalizedFallbackAllowedActions.length > 0) {
      return includesAnyAction(normalizedFallbackAllowedActions, ...actions);
    }
    return false;
  };

  const notifyApiFailure = (response: ApiResponse<unknown> | null | undefined, fallback: string) => {
    const allowedActions = readEnvelopeAllowedActions(response);
    if (allowedActions.length > 0) {
      setFallbackAllowedActions(normalizeAllowedActions(allowedActions));
    }

    const warnings = readEnvelopeWarningMessages(response);
    if (warnings.length) {
      notifyInfo(warnings.join(" | "));
    }

    const success = readEnvelopeSuccess(response);
    const messages = readEnvelopeErrorMessages(response);
    const message = readEnvelopeMessage(response);
    if (!success) {
      notifyError(messages[0] || message || fallback);
      return true;
    }

    if (message) {
      notifyInfo(message);
    }
    return false;
  };

  const extractMissingMemberCodes = (error: unknown): string[] => {
    if (!(error instanceof FetchDataError) || !error.data || typeof error.data !== "object") {
      return [];
    }
    const payload = error.data as Record<string, unknown>;
    const details = payload.details as Record<string, unknown> | undefined;
    const raw = details?.MissingMemberCodes ?? payload.MissingMemberCodes;
    return Array.isArray(raw) ? raw.map((item) => String(item)).filter(Boolean) : [];
  };

  const mapRevisionQueueRows = (rows: Array<Record<string, unknown>>): RevisionRequest[] =>
    rows.map((item, index) => {
      const revisionId = Number(
        pickSnapshotSection<unknown>(item, ["revisionId", "RevisionId", "id", "Id"], 0),
      );
      const assignmentIdValue = Number(
        pickSnapshotSection<unknown>(item, ["assignmentId", "AssignmentId"], 0),
      );
      const statusRaw = String(
        pickSnapshotSection<unknown>(item, ["finalStatus", "FinalStatus", "status", "Status"], "PENDING"),
      )
        .trim()
        .toUpperCase();

      const status: RevisionRequest["status"] =
        statusRaw === "2" || statusRaw === "APPROVED"
          ? "approved"
          : statusRaw === "3" || statusRaw === "REJECTED"
            ? "rejected"
            : "pending";

      const topicCode = toStringOrNull(
        pickSnapshotSection<unknown>(item, ["topicCode", "TopicCode"], null),
      );
      const topicTitle =
        toStringOrNull(
          pickSnapshotSection<unknown>(item, ["topicTitle", "TopicTitle", "title", "Title"], null),
        ) ??
        topicCode ??
        "-";

      const studentCode =
        toStringOrNull(
          pickSnapshotSection<unknown>(
            item,
            ["studentCode", "StudentCode", "proposerStudentCode", "ProposerStudentCode"],
            null,
          ),
        ) ?? "-";

      return {
        revisionId:
          Number.isFinite(revisionId) && revisionId > 0
            ? revisionId
            : Number.isFinite(assignmentIdValue) && assignmentIdValue > 0
              ? assignmentIdValue
              : index + 1,
        assignmentId:
          Number.isFinite(assignmentIdValue) && assignmentIdValue > 0
            ? assignmentIdValue
            : null,
        studentCode,
        topicCode,
        topicTitle,
        revisionFileUrl: toStringOrNull(
          pickSnapshotSection<unknown>(
            item,
            ["revisionFileUrl", "RevisionFileUrl", "fileUrl", "FileUrl"],
            null,
          ),
        ),
        lastUpdated: toStringOrNull(
          pickSnapshotSection<unknown>(item, ["lastUpdated", "LastUpdated", "updatedAt", "UpdatedAt"], null),
        ),
        status,
        reason:
          toStringOrNull(
            pickSnapshotSection<unknown>(item, ["reason", "Reason", "rejectReason", "RejectReason"], null),
          ) ?? undefined,
      };
    });

  const mapDefenseDocuments = (documents: unknown): DefenseDocument[] => {
    if (!Array.isArray(documents)) {
      return [];
    }

    return documents
      .map((entry, index) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }

        const record = entry as Record<string, unknown>;
        const fileId = Number(
          pickSnapshotSection<unknown>(
            record,
            ["fileID", "FileID", "fileId", "FileId", "documentId", "DocumentId", "id", "Id"],
            0,
          ),
        );
        const rawFileUrl = String(
          pickSnapshotSection<unknown>(
            record,
            ["fileURL", "FileURL", "fileUrl", "FileUrl", "downloadUrl", "DownloadUrl", "url", "Url"],
            "",
          ),
        ).trim();

        const fallbackDownloadUrl =
          Number.isFinite(fileId) && fileId > 0
            ? `/api/SubmissionFiles/download/${fileId}`
            : "";
        const resolvedUrl = rawFileUrl || fallbackDownloadUrl;
        const normalizedFileUrl = normalizeUrl(resolvedUrl);

        const rawName = String(
          pickSnapshotSection<unknown>(
            record,
            ["fileName", "FileName", "documentName", "DocumentName", "name", "Name", "documentType", "DocumentType"],
            "",
          ),
        ).trim();

        const documentType = String(
          pickSnapshotSection<unknown>(record, ["documentType", "DocumentType"], ""),
        ).trim();

        const fallbackName =
          resolvedUrl
            .split("?")[0]
            .split("#")[0]
            .split("/")
            .pop() || documentType || `Bao-cao-${index + 1}`;

        const uploadedAt = String(
          pickSnapshotSection<unknown>(record, ["uploadedAt", "UploadedAt", "generatedAt", "GeneratedAt"], ""),
        ).trim();

        const fileName = rawName || decodeURIComponent(fallbackName);
        if (!fileName && !normalizedFileUrl) {
          return null;
        }

        return {
          documentId:
            Number.isFinite(fileId) && fileId > 0
              ? fileId
              : index + 1,
          fileName,
          fileUrl: normalizedFileUrl,
          mimeType:
            String(
              pickSnapshotSection<unknown>(
                record,
                ["mimeType", "MimeType", "contentType", "ContentType", "fileType", "FileType"],
                "",
              ),
            ).trim() || null,
          uploadedAt: uploadedAt || null,
        };
      })
      .filter((item): item is DefenseDocument => Boolean(item));
  };

  const mapCommitteeMembers = (rawMembers: unknown): CommitteeMemberView[] => {
    if (!Array.isArray(rawMembers)) {
      return [];
    }

    return rawMembers
      .map((member, index) => {
        const record = toRecord(member);
        if (!record) {
          return null;
        }

        const roleRaw = String(
          pickSnapshotSection<unknown>(record, ["role", "Role", "roleCode", "RoleCode"], ""),
        ).trim();
        const roleCode = normalizeCommitteeRole(roleRaw);
        const lecturerCode =
          toStringOrNull(
            pickSnapshotSection<unknown>(
              record,
              ["lecturerCode", "LecturerCode", "memberCode", "MemberCode"],
              null,
            ),
          ) ?? "";
        const lecturerName =
          toStringOrNull(
            pickSnapshotSection<unknown>(
              record,
              ["lecturerName", "LecturerName", "fullName", "FullName", "name", "Name"],
              null,
            ),
          ) ??
          (lecturerCode ? `GV ${lecturerCode}` : "Chưa cập nhật");

        return {
          memberId:
            toStringOrNull(
              pickSnapshotSection<unknown>(record, ["memberId", "MemberId", "id", "Id"], null),
            ) ?? `${lecturerCode || "member"}-${index + 1}`,
          lecturerCode,
          lecturerName,
          roleRaw,
          roleCode,
          roleLabel: getRoleLabel(roleCode),
        };
      })
      .filter((member): member is CommitteeMemberView => Boolean(member));
  };

  const mapScoringMatrixRows = (
    items: Array<Record<string, unknown>>,
    committeeIdFallback = 0,
    committeeCodeFallback = "",
    defaultSession: SessionCode | null = null,
    committeeNameFallback = "",
  ): ScoringMatrixRow[] =>
    items.map((item) => {
      const topicRecord = toRecord(
        pickSnapshotSection<unknown>(item, ["topic", "Topic"], null),
      );
      const rawDocuments = pickSnapshotSection<unknown>(
        item,
        [
          "defenseDocuments",
          "DefenseDocuments",
          "reportDocuments",
          "ReportDocuments",
          "documents",
          "Documents",
          "files",
          "Files",
        ],
        [],
      );

      const topicCode =
        toStringOrNull(
          pickSnapshotSection<unknown>(item, ["topicCode", "TopicCode"], null),
        ) ?? null;
      const assignmentCode =
        toStringOrNull(
          pickSnapshotSection<unknown>(item, ["assignmentCode", "AssignmentCode"], null),
        ) ?? topicCode ?? "-";

      const supervisorNameFromRow = toStringOrNull(
        pickSnapshotSection<unknown>(
          item,
          [
            "supervisorLecturerName",
            "SupervisorLecturerName",
            "supervisorName",
            "SupervisorName",
            "gvhdName",
            "GvhdName",
          ],
          null,
        ),
      );
      const supervisorNameFromTopic = topicRecord
        ? toStringOrNull(
            pickSnapshotSection<unknown>(
              topicRecord,
              [
                "supervisorLecturerName",
                "SupervisorLecturerName",
                "supervisorName",
                "SupervisorName",
                "lecturerName",
                "LecturerName",
                "supervisorFullName",
                "SupervisorFullName",
              ],
              null,
            ),
          )
        : null;
      const supervisorCode =
        toStringOrNull(
          pickSnapshotSection<unknown>(
            item,
            ["supervisorLecturerCode", "SupervisorLecturerCode", "supervisorCode", "SupervisorCode"],
            null,
          ),
        ) ??
        (topicRecord
          ? toStringOrNull(
              pickSnapshotSection<unknown>(
                topicRecord,
                ["supervisorLecturerCode", "SupervisorLecturerCode", "supervisorCode", "SupervisorCode"],
                null,
              ),
            )
          : null);

      const rowTagNames = normalizeTopicTagNames(
        pickSnapshotSection<unknown>(
          item,
          ["topicTags", "TopicTags", "tags", "Tags", "tagNames", "TagNames", "tagCodes", "TagCodes"],
          [],
        ),
      );
      const topicTagNames = topicRecord
        ? normalizeTopicTagNames(
            pickSnapshotSection<unknown>(
              topicRecord,
              ["topicTags", "TopicTags", "tags", "Tags", "tagNames", "TagNames", "tagCodes", "TagCodes"],
              [],
            ),
          )
        : [];
      const topicTags = Array.from(new Set([...rowTagNames, ...topicTagNames]));

      const startTime = normalizeTimeText(
        pickSnapshotSection<unknown>(
          item,
          ["startTime", "StartTime", "slotStart", "SlotStart"],
          null,
        ),
      );
      const endTime = normalizeTimeText(
        pickSnapshotSection<unknown>(
          item,
          ["endTime", "EndTime", "slotEnd", "SlotEnd"],
          null,
        ),
      );

      const rawSession = toStringOrNull(
        pickSnapshotSection<unknown>(
          item,
          ["session", "Session", "sessionCode", "SessionCode"],
          null,
        ),
      );

      const scheduledAt = toIsoDateOrNull(
        pickSnapshotSection<unknown>(item, ["scheduledAt", "ScheduledAt", "defenseDate", "DefenseDate"], null),
      );

      const resolvedSession = rawSession
        ? normalizeSessionCode(rawSession)
        : inferSessionFromTime(startTime) ?? defaultSession ?? null;

      return {
        committeeId:
          Number(
            pickSnapshotSection<unknown>(item, ["committeeId", "CommitteeId", "councilId", "CouncilId"], committeeIdFallback),
          ) || committeeIdFallback,
        committeeCode:
          String(
            pickSnapshotSection<unknown>(item, ["committeeCode", "CommitteeCode", "councilCode", "CouncilCode"], committeeCodeFallback),
          ) || committeeCodeFallback,
        committeeName:
          toStringOrNull(
            pickSnapshotSection<unknown>(item, ["committeeName", "CommitteeName", "councilName", "CouncilName", "name", "Name"], null),
          ) ?? committeeNameFallback ?? committeeCodeFallback,
        assignmentId: Number(pickSnapshotSection<unknown>(item, ["assignmentId", "AssignmentId"], 0)),
        assignmentCode,
        topicCode,
        topicTitle:
          toStringOrNull(
            pickSnapshotSection<unknown>(item, ["topicTitle", "TopicTitle", "title", "Title"], null),
          ) ?? assignmentCode,
        studentCode: String(pickSnapshotSection<unknown>(item, ["studentCode", "StudentCode"], "-")),
        studentName: String(pickSnapshotSection<unknown>(item, ["studentName", "StudentName"], "-")),
        supervisorLecturerName:
          supervisorNameFromRow ??
          supervisorNameFromTopic ??
          (supervisorCode ? `GV ${supervisorCode}` : null),
        topicTags,
        session: resolvedSession,
        scheduledAt,
        startTime,
        endTime,
        topicSupervisorScore: toNumberOrNull(
          pickSnapshotSection<unknown>(item, ["topicSupervisorScore", "TopicSupervisorScore", "scoreGvhd", "ScoreGvhd"], null),
        ),
        scoreGvhd: toNumberOrNull(
          pickSnapshotSection<unknown>(item, ["scoreGvhd", "ScoreGvhd", "topicSupervisorScore", "TopicSupervisorScore"], null),
        ),
        scoreCt: toNumberOrNull(
          pickSnapshotSection<unknown>(item, ["scoreCt", "ScoreCt"], null),
        ),
        scoreTk: toNumberOrNull(
          pickSnapshotSection<unknown>(item, ["scoreTk", "ScoreTk", "scoreUvtk", "ScoreUvtk"], null),
        ),
        scorePb: toNumberOrNull(
          pickSnapshotSection<unknown>(item, ["scorePb", "ScorePb", "scoreUvpb", "ScoreUvpb"], null),
        ),
        finalScore: toNumberOrNull(pickSnapshotSection<unknown>(item, ["finalScore", "FinalScore"], null)),
        finalGrade:
          toStringOrNull(
            pickSnapshotSection<unknown>(item, ["finalGrade", "FinalGrade", "finalLetter", "FinalLetter"], null),
          ) ?? null,
        variance: toNumberOrNull(pickSnapshotSection<unknown>(item, ["variance", "Variance"], null)),
        isLocked: Boolean(pickSnapshotSection<unknown>(item, ["isLocked", "IsLocked"], false)),
        status: String(pickSnapshotSection<unknown>(item, ["status", "Status"], "PENDING")),
        submittedCount: Number(pickSnapshotSection<unknown>(item, ["submittedCount", "SubmittedCount"], 0)),
        requiredCount: Number(pickSnapshotSection<unknown>(item, ["requiredCount", "RequiredCount"], 0)),
        defenseDocuments: mapDefenseDocuments(rawDocuments),
      };
    });

  const refreshAllScoringRows = async () => {
    const allMatrixResponse = await lecturerApi.getScoringMatrix();
    if (notifyApiFailure(allMatrixResponse as ApiResponse<unknown>, "Không tải được danh sách đề tài chấm điểm.")) {
      return;
    }

    const matrixItems = (allMatrixResponse?.data ?? []) as Array<Record<string, unknown>>;
    setAllScoringRows(mapScoringMatrixRows(matrixItems));
  };

  const refreshRevisionQueue = async () => {
    const response = await lecturerApi.getRevisionQueue();
    if (notifyApiFailure(response as ApiResponse<unknown>, "Không tải được hàng chờ chỉnh sửa.")) {
      return;
    }
    const mapped = mapRevisionQueueRows((response?.data ?? []) as Array<Record<string, unknown>>);
    setRevisionQueue(mapped);
    setRevision((prev) => mapped.find((item) => item.revisionId === prev.revisionId) ?? mapped[0] ?? EMPTY_REVISION);
  };

  const refreshScoringData = async (committeeId: number) => {
    const [matrixRes, alertsRes] = await Promise.all([
      lecturerApi.getScoringMatrix(committeeId),
      lecturerApi.getScoringAlerts(committeeId),
    ]);

    if (notifyApiFailure(matrixRes as ApiResponse<unknown>, "Không tải được bảng chấm điểm.")) {
      return;
    }

    const matrixItems = (matrixRes?.data ?? []) as Array<Record<string, unknown>>;
    const committeeSessionFallback = committees.find((item) => item.id === selectedCommitteeId)?.session ?? null;
    const committeeNameFallback = committees.find((item) => item.id === selectedCommitteeId)?.name ?? selectedCommitteeId;
    const mappedMatrix = mapScoringMatrixRows(
      matrixItems,
      committeeId,
      selectedCommitteeId,
      committeeSessionFallback,
      committeeNameFallback,
    );
    setScoringMatrix(mappedMatrix);
    setSelectedAssignmentId((prev) => {
      if (prev > 0 && mappedMatrix.some((row) => row.assignmentId === prev)) {
        return prev;
      }
      return mappedMatrix[0]?.assignmentId ?? 0;
    });

    const alertItems = (alertsRes?.data ?? []) as Array<Record<string, unknown>>;
    setScoringAlerts(
      alertItems.map((item) => ({
        assignmentId: Number(item.assignmentId ?? 0),
        message: String(item.message ?? ""),
        value: Number.isFinite(Number(item.value)) ? Number(item.value) : null,
        threshold: Number.isFinite(Number(item.threshold)) ? Number(item.threshold) : null,
      }))
    );
  };

  const hydrateMinutes = async (committeeId: number, assignmentId?: number) => {
    const response = await lecturerApi.getCommitteeMinutes(committeeId);
    if (notifyApiFailure(response as ApiResponse<unknown>, "Không tải được biên bản hội đồng.")) {
      return;
    }

    const rows = (response?.data ?? []) as Array<Record<string, unknown>>;
    const target =
      rows.find((item) => Number(item.assignmentId ?? 0) === (assignmentId ?? selectedAssignmentId)) ??
      rows[0] ??
      null;
    if (!target) {
      return;
    }

    setSummary(String(target.summaryContent ?? target.summary ?? ""));
    setReview(String(target.reviewerComments ?? target.review ?? ""));
    setQuestions(String(target.qnaDetails ?? target.questions ?? ""));
    setAnswers(String(target.answers ?? ""));
    setStrengths(String(target.strengths ?? ""));
    setWeaknesses(String(target.weaknesses ?? ""));
    setRecommendations(String(target.recommendations ?? ""));
  };

  useEffect(() => {
    const hydrateLecturerData = async () => {
      setLoadingData(true);
      try {
        const [committeeRes, revisionRes] = await Promise.all([
          lecturerApi.getCommittees() as Promise<
            ApiResponse<{
              items?: Array<Record<string, unknown>>;
              councilListLocked?: boolean | null;
              councilLockStatus?: string | null;
            }>
          >,
          lecturerApi.getRevisionQueue(),
        ]);
        setCurrentSnapshotError(null);

        const allowedActions =
          committeeRes?.allowedActions ?? committeeRes?.AllowedActions;
        if (allowedActions) {
          setFallbackAllowedActions(normalizeAllowedActions(allowedActions));
        }

        const committeePayload =
          (committeeRes?.data as {
            items?: Array<Record<string, unknown>>;
            councilListLocked?: boolean | null;
            councilLockStatus?: string | null;
          } | null) ?? null;

        const lockStatusText = String(committeePayload?.councilLockStatus ?? "")
          .trim()
          .toUpperCase();
        if (typeof committeePayload?.councilListLocked === "boolean") {
          setCouncilListLocked(committeePayload.councilListLocked);
          setCouncilLockStatus(
            lockStatusText || (committeePayload.councilListLocked ? "LOCKED" : "UNLOCKED"),
          );
        } else if (lockStatusText) {
          setCouncilListLocked(lockStatusText === "LOCKED");
          setCouncilLockStatus(lockStatusText);
        } else {
          setCouncilListLocked(null);
          setCouncilLockStatus("UNKNOWN");
        }

        const committeeItems =
          (committeePayload?.items ?? []) as Array<Record<string, unknown>>;

        if (committeeItems.length) {
          const mapped = committeeItems.map((item, index) => {
            const roleValue = pickSnapshotSection<unknown>(
              item,
              ["normalizedRole", "NormalizedRole", "role", "Role"],
              "",
            );
            const roleCode = normalizeCommitteeRole(roleValue);
            const numericIdRaw = Number(
              pickSnapshotSection<unknown>(
                item,
                ["committeeId", "CommitteeId", "councilId", "CouncilId", "id", "Id"],
                0,
              ),
            );
            const committeeCode = String(
              pickSnapshotSection<unknown>(
                item,
                ["committeeCode", "CommitteeCode", "councilCode", "CouncilCode"],
                `HD-${index + 1}`,
              ),
            ).trim() || `HD-${index + 1}`;
            const fallbackNumeric = Number(String(committeeCode).replace(/\D+/g, ""));
            const numericId =
              Number.isFinite(numericIdRaw) && numericIdRaw > 0
                ? numericIdRaw
                : Number.isFinite(fallbackNumeric) && fallbackNumeric > 0
                  ? fallbackNumeric
                  : index + 1;

            const allowedScoringActions = normalizeAllowedActions(
              pickSnapshotSection<unknown>(
                item,
                ["allowedScoringActions", "AllowedScoringActions"],
                [],
              ),
            );
            const allowedMinuteActions = normalizeAllowedActions(
              pickSnapshotSection<unknown>(
                item,
                ["allowedMinuteActions", "AllowedMinuteActions"],
                [],
              ),
            );
            const allowedRevisionActions = normalizeAllowedActions(
              pickSnapshotSection<unknown>(
                item,
                ["allowedRevisionActions", "AllowedRevisionActions"],
                [],
              ),
            );

            const sessionRaw = toStringOrNull(
              pickSnapshotSection<unknown>(
                item,
                ["sessionCode", "SessionCode", "session", "Session"],
                null,
              ),
            );

            const committeeName =
              toStringOrNull(
                pickSnapshotSection<unknown>(
                  item,
                  ["name", "Name", "committeeName", "CommitteeName"],
                  null,
                ),
              ) ?? `Hội đồng ${committeeCode}`;

            const startTime = normalizeTimeText(
              pickSnapshotSection<unknown>(
                item,
                ["startTime", "StartTime", "slotStart", "SlotStart"],
                null,
              ),
            );
            const endTime = normalizeTimeText(
              pickSnapshotSection<unknown>(
                item,
                ["endTime", "EndTime", "slotEnd", "SlotEnd"],
                null,
              ),
            );

            const scheduledAt = toIsoDateOrNull(
              pickSnapshotSection<unknown>(
                item,
                ["scheduledAt", "ScheduledAt", "defenseDate", "DefenseDate"],
                null,
              ),
            );

            const resolvedSession = sessionRaw
              ? normalizeSessionCode(sessionRaw)
              : inferSessionFromTime(startTime);

            const slot =
              startTime && endTime
                ? `${startTime} - ${endTime}`
                : startTime
                  ? `Từ ${startTime}`
                  : endTime
                    ? `Đến ${endTime}`
                    : null;

            const defenseDate = scheduledAt ? scheduledAt.slice(0, 10) : null;

            const members = mapCommitteeMembers(
              pickSnapshotSection<unknown>(
                item,
                ["members", "Members", "committeeMembers", "CommitteeMembers"],
                [],
              ),
            );

            return {
              id: committeeCode,
              name: committeeName,
              numericId,
              room: String(pickSnapshotSection<unknown>(item, ["room", "Room"], "-") ?? "-") || "-",
              session: resolvedSession,
              date: defenseDate,
              slot,
              studentCount: Number(
                pickSnapshotSection<unknown>(
                  item,
                  ["studentCount", "StudentCount", "topicCount", "TopicCount", "assignmentCount", "AssignmentCount"],
                  0,
                ) ?? 0,
              ),
              status: mapCommitteeStatus(pickSnapshotSection<unknown>(item, ["status", "Status"], "")),
              normalizedRole: roleCode,
              roleCode,
              roleLabel: getRoleLabel(roleCode),
              roleRaw: String(pickSnapshotSection<unknown>(item, ["role", "Role"], "")).trim(),
              allowedScoringActions,
              allowedMinuteActions,
              allowedRevisionActions,
              members,
            };
          }) satisfies Committee[];
          setCommittees(mapped);
          setSelectedCommitteeId((prev) => (mapped.some((item) => item.id === prev) ? prev : mapped[0]?.id ?? ""));
          setDetailCommitteeId((prev) => (mapped.some((item) => item.id === prev) ? prev : ""));
        } else {
          setCommittees([]);
          setSelectedCommitteeId("");
          setDetailCommitteeId("");
        }

        if (!notifyApiFailure(revisionRes as ApiResponse<unknown>, "Không tải được hàng chờ chỉnh sửa.")) {
          const mappedRevisions = mapRevisionQueueRows((revisionRes?.data ?? []) as Array<Record<string, unknown>>);
          setRevisionQueue(mappedRevisions);
          setRevision(mappedRevisions[0] ?? EMPTY_REVISION);
        }

        await refreshAllScoringRows();
      } catch (error) {
        setCommittees([]);
        setAllScoringRows([]);
        setRevisionQueue([]);
        setRevision(EMPTY_REVISION);
        setSelectedCommitteeId("");
        setDetailCommitteeId("");
        setCouncilListLocked(null);
        setCouncilLockStatus("UNKNOWN");

        if (error instanceof FetchDataError) {
          const apiMessage = readApiErrorMessage(error.data);

          if (error.status === 404) {
            const message =
              apiMessage ??
              "Bạn chưa được gán vào đợt bảo vệ đang hoạt động. Vui lòng liên hệ quản trị viên.";
            setCurrentSnapshotError(message);
            setCurrentPeriod(null);
            notifyInfo(message);
            return;
          }

          if (error.status === 409) {
            const message =
              apiMessage ??
              "Tài khoản hiện tại đang gắn với nhiều đợt bảo vệ hoạt động. Vui lòng liên hệ quản trị viên để xử lý dữ liệu.";
            setCurrentSnapshotError(message);
            setCurrentPeriod(null);
            notifyError(message);
            return;
          }
        }

        if (error instanceof Error && error.message === "CURRENT_PERIOD_CONTRACT_INVALID") {
          const message = "Dữ liệu snapshot hiện tại không chứa thông tin đợt bảo vệ hợp lệ.";
          setCurrentSnapshotError(message);
          setCurrentPeriod(null);
          notifyError(message);
          return;
        }

        setCurrentSnapshotError("Không tải được dữ liệu giảng viên từ API.");
        notifyError("Không tải được dữ liệu giảng viên từ API.");
      } finally {
        setLoadingData(false);
      }
    };

    void hydrateLecturerData();
  }, [periodId]);

  const committeeStats = useMemo(() => {
    const live = committees.filter((item) => item.status === "Đang họp").length;
    const upcoming = committees.filter((item) => item.status === "Sắp diễn ra").length;
    const locked = committees.filter((item) => item.status === "Đã khóa").length;
    const pendingRevision = revisionQueue.filter((item) => item.status === "pending").length;
    return { live, upcoming, locked, pendingRevision };
  }, [committees, revisionQueue]);

  const periodDisplay = currentPeriod
    ? `${currentPeriod.name} (#${currentPeriod.periodId})`
    : periodId
      ? `Đợt #${periodId}`
      : "Chưa xác định";
  const waitingCouncilLock = !currentSnapshotError && councilListLocked === false;

  const selectedCommittee = useMemo(
    () => committees.find((item) => item.id === selectedCommitteeId) ?? null,
    [committees, selectedCommitteeId]
  );
  const joinedCommittee = useMemo(
    () => committees.find((item) => item.id === joinedCommitteeId) ?? null,
    [committees, joinedCommitteeId],
  );
  const detailCommittee = useMemo(
    () => committees.find((item) => item.id === detailCommitteeId) ?? null,
    [committees, detailCommitteeId],
  );
  const selectedCommitteeNumericId = useMemo(() => {
    if (selectedCommittee?.numericId && selectedCommittee.numericId > 0) {
      return selectedCommittee.numericId;
    }
    const parsed = Number(String(selectedCommitteeId).replace(/\D+/g, ""));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }, [selectedCommittee, selectedCommitteeId]);

  const selectedMatrixRow = useMemo(
    () => scoringMatrix.find((row) => row.assignmentId === selectedAssignmentId) ?? null,
    [scoringMatrix, selectedAssignmentId]
  );

  const isRowInCommittee = (row: ScoringMatrixRow, committee: Committee | null) => {
    if (!committee) {
      return false;
    }
    return (
      row.committeeId === committee.numericId ||
      String(row.committeeCode).trim().toUpperCase() === committee.id.trim().toUpperCase()
    );
  };

  const committeeBadgeStats = useMemo(() => {
    const statsMap = new Map<string, { total: number; scored: number; locked: number }>();
    committees.forEach((committee) => {
      statsMap.set(committee.id, {
        total: 0,
        scored: 0,
        locked: 0,
      });
    });

    allScoringRows.forEach((row) => {
      const matched = committees.find((committee) => isRowInCommittee(row, committee));
      if (!matched) {
        return;
      }
      const current = statsMap.get(matched.id) ?? { total: 0, scored: 0, locked: 0 };
      current.total += 1;
      if (row.finalScore != null || row.submittedCount > 0) {
        current.scored += 1;
      }
      if (row.isLocked) {
        current.locked += 1;
      }
      statsMap.set(matched.id, current);
    });

    committees.forEach((committee) => {
      const current = statsMap.get(committee.id) ?? { total: 0, scored: 0, locked: 0 };
      if (current.total <= 0 && committee.studentCount > 0) {
        current.total = committee.studentCount;
      }
      statsMap.set(committee.id, current);
    });

    return statsMap;
  }, [allScoringRows, committees]);

  const detailCommitteeRows = useMemo(
    () => allScoringRows.filter((row) => isRowInCommittee(row, detailCommittee)),
    [allScoringRows, detailCommittee],
  );

  const selectedRevisionItem = useMemo(
    () =>
      revisionQueue.find((item) => item.assignmentId != null && item.assignmentId === selectedAssignmentId) ??
      revision,
    [revision, revisionQueue, selectedAssignmentId],
  );

  const getSessionSortOrder = (session: SessionCode | null): number => {
    if (session === "MORNING") {
      return 0;
    }
    if (session === "AFTERNOON") {
      return 1;
    }
    return 2;
  };

  const sortedScoringRows = useMemo(
    () =>
      [...scoringMatrix].sort((left, right) => {
        const leftSessionOrder = getSessionSortOrder(left.session);
        const rightSessionOrder = getSessionSortOrder(right.session);
        if (leftSessionOrder !== rightSessionOrder) {
          return leftSessionOrder - rightSessionOrder;
        }
        const leftTime = new Date(left.scheduledAt ?? 0).getTime();
        const rightTime = new Date(right.scheduledAt ?? 0).getTime();
        if (leftTime !== rightTime) {
          return leftTime - rightTime;
        }
        if ((left.startTime ?? "") !== (right.startTime ?? "")) {
          return (left.startTime ?? "").localeCompare(right.startTime ?? "");
        }
        return left.assignmentId - right.assignmentId;
      }),
    [scoringMatrix],
  );

  const morningRows = useMemo(
    () => sortedScoringRows.filter((row) => row.session === "MORNING"),
    [sortedScoringRows],
  );

  const afternoonRows = useMemo(
    () => sortedScoringRows.filter((row) => row.session === "AFTERNOON"),
    [sortedScoringRows],
  );

  const unscheduledRows = useMemo(
    () => sortedScoringRows.filter((row) => row.session == null),
    [sortedScoringRows],
  );

  const scoreGvhdDisplay =
    selectedMatrixRow?.topicSupervisorScore ??
    selectedMatrixRow?.scoreGvhd ??
    null;

  const selectedScoringActions = selectedCommittee?.allowedScoringActions ?? [];
  const selectedMinuteActions = selectedCommittee?.allowedMinuteActions ?? [];
  const selectedRevisionActions = selectedCommittee?.allowedRevisionActions ?? [];

  const hasScoringPermissionSource =
    selectedScoringActions.length > 0 || normalizedFallbackAllowedActions.length > 0;
  const hasMinutePermissionSource =
    selectedMinuteActions.length > 0 || normalizedFallbackAllowedActions.length > 0;
  const hasRevisionPermissionSource =
    selectedRevisionActions.length > 0 || normalizedFallbackAllowedActions.length > 0;

  const canOpenSessionByActions = hasAllowedAction(
    selectedScoringActions,
    "OPEN_SESSION",
    "UC3.1.OPEN",
  );
  const canSubmitScoreByActions = hasAllowedAction(
    selectedScoringActions,
    "SUBMIT",
    "SUBMIT_SCORE",
    "UC3.2.SUBMIT",
  );
  const canRequestReopenByActions = hasAllowedAction(
    selectedScoringActions,
    "REOPEN_REQUEST",
    "REOPEN_SCORE",
    "UC3.3.REOPEN",
  );
  const canLockSessionByActions = hasAllowedAction(
    selectedScoringActions,
    "LOCK_SESSION",
    "LOCK_SCORE",
    "UC3.5.LOCK",
  );

  const canOpenSession = canOpenSessionByActions;
  const canSubmitScore = canSubmitScoreByActions;
  const canRequestReopen = canRequestReopenByActions;
  const canLockSession = canLockSessionByActions;

  const canEditMinutesByActions = hasAllowedAction(
    selectedMinuteActions,
    "UPSERT",
    "UPSERT_MINUTES",
    "UPDATE_MINUTES",
    "EDIT_MINUTES",
  );
  const canEditMinutes = canEditMinutesByActions;

  const canEditReviewerComments =
    canEditMinutes ||
    hasAllowedAction(
      selectedScoringActions,
      "SUBMIT",
      "SUBMIT_SCORE",
      "UC3.2.SUBMIT",
    );

  const canApproveRevisionByActions = hasAllowedAction(
    selectedRevisionActions,
    "APPROVE",
    "APPROVE_REVISION",
    "UC4.2.APPROVE",
  );
  const canRejectRevisionByActions = hasAllowedAction(
    selectedRevisionActions,
    "REJECT",
    "REJECT_REVISION",
    "UC4.2.REJECT",
  );
  const canApproveRevision = canApproveRevisionByActions;
  const canRejectRevision = canRejectRevisionByActions;
  const isSessionOpened = selectedCommittee?.status === "Đang họp";
  const isSessionClosed = selectedCommittee?.status === "Đã khóa";
  const isCurrentSessionLocked = isSessionClosed || sessionLocked;

  const permissionSourceMissing =
    !hasScoringPermissionSource && !hasMinutePermissionSource && !hasRevisionPermissionSource;

  const isScoreValid = useMemo(() => {
    const num = Number(myScore);
    return Number.isFinite(num) && num >= 0 && num <= 10;
  }, [myScore]);

  const hasVarianceAlert = useMemo(() => {
    if (scoringOverview.variance == null || scoringOverview.varianceThreshold == null) {
      return false;
    }
    return scoringOverview.variance > scoringOverview.varianceThreshold;
  }, [scoringOverview]);

  useEffect(() => {
    const hydrateScoringOverview = async () => {
      if (!selectedCommitteeId) {
        setScoringOverview({ variance: null, varianceThreshold: null, finalScore: null, finalLetter: null });
        setScoringMatrix([]);
        setScoringAlerts([]);
        setSelectedAssignmentId(0);
        return;
      }
      try {
        await refreshScoringData(selectedCommitteeNumericId);
      } catch {
        setScoringOverview({ variance: null, varianceThreshold: null, finalScore: null, finalLetter: null });
      }
    };

    void hydrateScoringOverview();
  }, [selectedCommitteeId, selectedCommitteeNumericId]);

  useEffect(() => {
    const row = selectedMatrixRow;
    const relatedAlert = scoringAlerts.find((item) => item.assignmentId === (row?.assignmentId ?? 0)) ?? null;
    setScoringOverview({
      variance: row?.variance ?? relatedAlert?.value ?? null,
      varianceThreshold: relatedAlert?.threshold ?? null,
      finalScore: row?.finalScore ?? null,
      finalLetter: row?.finalGrade ?? null,
    });
    if (row) {
      setSessionLocked(Boolean(row.isLocked));
    }
  }, [selectedMatrixRow, scoringAlerts]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRoomNow(new Date());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (detailCommitteeId) {
      setDetailTab("overview");
    }
  }, [detailCommitteeId]);

  useEffect(() => {
    if (!joinedCommitteeId) {
      return;
    }
    const exists = committees.some((item) => item.id === joinedCommitteeId);
    if (!exists) {
      setJoinedCommitteeId("");
      if (activePanel === "grading") {
        setActivePanel("councils");
      }
    }
  }, [activePanel, committees, joinedCommitteeId]);

  useEffect(() => {
    if (!joinedCommitteeId) {
      return;
    }
    if (selectedCommitteeId !== joinedCommitteeId) {
      setSelectedCommitteeId(joinedCommitteeId);
    }
  }, [joinedCommitteeId, selectedCommitteeId]);

  useEffect(() => {
    if (!joinedCommitteeId) {
      setRoomView("scoring");
      return;
    }
    setRoomView("scoring");
  }, [joinedCommitteeId]);

  useEffect(() => {
    if (activePanel !== "grading" || !selectedCommitteeId) {
      return;
    }
    if (workspaceTab !== "minutes" && workspaceTab !== "review") {
      return;
    }
    void hydrateMinutes(selectedCommitteeNumericId, selectedAssignmentId || undefined);
  }, [
    activePanel,
    selectedCommitteeId,
    selectedCommitteeNumericId,
    selectedAssignmentId,
    workspaceTab,
  ]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      window.localStorage.setItem(
        "lecturer_minutes_draft",
        JSON.stringify({
          periodId: periodIdText,
          selectedCommitteeId,
          summary,
          review,
          questions,
          answers,
          strengths,
          weaknesses,
          recommendations,
        })
      );
      setLastAutoSave(new Date().toLocaleTimeString("vi-VN"));
    }, 30000);

    return () => window.clearInterval(timer);
  }, [
    selectedCommitteeId,
    summary,
    review,
    questions,
    answers,
    strengths,
    weaknesses,
    recommendations,
    periodIdText,
  ]);

  const formatSession = (session: SessionCode | null) => {
    if (session === "MORNING") {
      return "Buổi sáng";
    }
    if (session === "AFTERNOON") {
      return "Buổi chiều";
    }
    return "Chưa phân ca";
  };

  const formatRowTimeRange = (row: ScoringMatrixRow) => {
    if (row.startTime && row.endTime) {
      return `${row.startTime} - ${row.endTime}`;
    }
    if (row.startTime) {
      return `Từ ${row.startTime}`;
    }
    if (row.scheduledAt) {
      return formatDateTime(row.scheduledAt);
    }
    return "Chưa có khung giờ";
  };

  const openRoleWorkspace = (committee: Committee) => {
    if (committee.status !== "Đang họp") {
      notifyInfo("Phòng chấm chỉ mở khi hội đồng đang họp.");
      return;
    }
    setJoinedCommitteeId(committee.id);
    setSelectedCommitteeId(committee.id);
    setRoomView("scoring");
    setWorkspaceTab("scoring");
    setActivePanel("grading");
  };

  const syncCommitteeSessionStatus = (committeeId: string, nextStatus: Committee["status"]) => {
    setCommittees((prev) =>
      prev.map((committee) =>
        committee.id === committeeId ? { ...committee, status: nextStatus } : committee,
      ),
    );

    if (joinedCommitteeId === committeeId || selectedCommitteeId === committeeId) {
      setSessionLocked(nextStatus === "Đã khóa");
    }
  };

  const handleChairOpenSession = async (committee: Committee) => {
    if (committee.normalizedRole !== "CT") {
      notifyInfo("Chỉ Chủ tịch hội đồng mới có thể mở phiên.");
      return;
    }
    if (committee.status === "Đang họp") {
      notifyInfo("Phiên của hội đồng này đang mở sẵn.");
      return;
    }
    if (committee.status === "Đã khóa") {
      notifyInfo("Phiên đã khóa, không thể mở lại từ danh sách này.");
      return;
    }

    try {
      const idempotencyKey = createIdempotencyKey(periodIdText || "NA", `chair-open-${committee.id}`);
      const response = await lecturerApi.openSessionByCommittee(committee.numericId, idempotencyKey);
      if (notifyApiFailure(response as ApiResponse<unknown>, "Mở phiên hội đồng thất bại.")) {
        return;
      }

      syncCommitteeSessionStatus(committee.id, "Đang họp");
      pushTrace("open-session", `[Chair] Mở phiên hội đồng ${committee.id}.`);

      if (selectedCommitteeId === committee.id) {
        await refreshScoringData(committee.numericId);
      }

      notifySuccess(`Đã mở phiên hội đồng ${committee.id}.`);
    } catch {
      notifyError("Mở phiên hội đồng thất bại.");
    }
  };

  const handleChairCloseSession = async (committee: Committee) => {
    if (committee.normalizedRole !== "CT") {
      notifyInfo("Chỉ Chủ tịch hội đồng mới có thể đóng phiên.");
      return;
    }
    if (committee.status !== "Đang họp") {
      notifyInfo("Chỉ phiên đang họp mới có thể đóng.");
      return;
    }

    try {
      const idempotencyKey = createIdempotencyKey(periodIdText || "NA", `chair-close-${committee.id}`);
      const response = await lecturerApi.lockSessionByCommittee(committee.numericId, idempotencyKey);
      if (notifyApiFailure(response as ApiResponse<unknown>, "Đóng phiên hội đồng thất bại.")) {
        return;
      }

      syncCommitteeSessionStatus(committee.id, "Đã khóa");
      pushTrace("lock-session", `[Chair] Đóng phiên hội đồng ${committee.id}.`);

      if (selectedCommitteeId === committee.id) {
        await refreshScoringData(committee.numericId);
      }

      notifySuccess(`Đã đóng phiên hội đồng ${committee.id}.`);
    } catch (error) {
      const missingMembers = extractMissingMemberCodes(error);
      if (missingMembers.length > 0) {
        notifyError(`Thiếu điểm từ thành viên: ${missingMembers.join(", ")}`);
        return;
      }
      notifyError("Đóng phiên hội đồng thất bại.");
    }
  };

  const pushTrace = (action: string, note?: string) => {
    const idempotencyKey = createIdempotencyKey(periodIdText || "NA", action);
    setLatestActionTrace({
      action,
      periodId: periodIdText || "NA",
      idempotencyKey,
      concurrencyToken: assignmentConcurrencyToken,
      note,
      at: new Date().toLocaleString("vi-VN"),
    });
    return idempotencyKey;
  };

  const handleSubmitScore = async () => {
    if (!canSubmitScore) {
      notifyError("Vai trò hiện tại không có quyền gửi điểm độc lập.");
      return;
    }
    if (!isSessionOpened) {
      notifyError("Phiên chấm chưa mở. Vui lòng để CT mở phiên trước khi gửi điểm.");
      return;
    }
    if (!isScoreValid) {
      notifyError(ucError("UC3.2-SCORE_INVALID"));
      return;
    }
    if (isSessionClosed || sessionLocked) {
      notifyError(ucError("UC3.3-SESSION_LOCKED"));
      return;
    }
    try {
      const idempotencyKey = createIdempotencyKey(periodIdText || "NA", "lecturer-score-submit");
      const assignmentId = selectedAssignmentId;
      if (!assignmentId) {
        notifyError("Vui lòng chọn assignment cần chấm điểm.");
        return;
      }
      const response = await lecturerApi.submitIndependentScore(selectedCommitteeNumericId, {
        assignmentId,
        score: Number(myScore),
        comment: myComment,
      }, idempotencyKey);
      if (notifyApiFailure(response as ApiResponse<unknown>, "Không gửi được điểm độc lập.")) {
        return;
      }
      setSubmitted(true);
      setChairRequestedReopen(false);
      pushTrace("submit-score", "[UC3.2] Đã gửi điểm độc lập.");
      setAssignmentConcurrencyToken(createConcurrencyToken("lecturer-assignment"));
      await refreshScoringData(selectedCommitteeNumericId);
      if (response?.idempotencyReplay ?? response?.IdempotencyReplay) {
        notifyInfo("Yêu cầu gửi điểm đã được xử lý trước đó (idempotency replay).");
      } else {
        notifySuccess("Đã gửi điểm độc lập thành công.");
      }
    } catch {
      notifyError("Không gửi được điểm. Vui lòng thử lại.");
    }
  };

  const openReportDrawer = (row: ScoringMatrixRow) => {
    if (row.defenseDocuments.length === 0) {
      notifyInfo("Đề tài này chưa có tệp báo cáo để xem.");
      return;
    }
    setSelectedAssignmentId(row.assignmentId);
    setRoomView("reports");
  };

  const formatDate = (value: string | null) => {
    if (!value) {
      return "-";
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString("vi-VN");
  };

  const formatDateTime = (value: string | null) => {
    if (!value) {
      return "-";
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString("vi-VN");
  };

  const formatScore = (value: number | null) =>
    value == null ? "-" : value.toLocaleString("vi-VN", { maximumFractionDigits: 2 });

  const detailTabs: Array<{
    key: CommitteeDetailTabKey;
    label: string;
    icon: React.ReactNode;
  }> = [
    { key: "overview", label: "Tổng quan", icon: <Info size={14} /> },
    { key: "members", label: "Thành viên", icon: <Users2 size={14} /> },
    { key: "topics", label: "Đề tài", icon: <ClipboardPen size={14} /> },
  ];

  const workspaceTabs: Array<{
    key: WorkspaceTabKey;
    label: string;
    icon: React.ReactNode;
  }> = [
    { key: "scoring", label: "Chấm điểm", icon: <Star size={14} /> },
    { key: "minutes", label: "Biên bản họp", icon: <ClipboardPen size={14} /> },
    { key: "review", label: "Nhận xét phản biện", icon: <MessageSquareText size={14} /> },
  ];

  return (
    <div
      style={{
        maxWidth: 1460,
        margin: "0 auto",
        padding: 24,
        position: "relative",
        fontFamily: '"Be Vietnam Pro", "Segoe UI", Tahoma, sans-serif',
      }}
      className="lecturer-revamp-root"
    >
      <style>
        {`
          .lecturer-revamp-root {
            --lec-accent: #f37021;
            --lec-accent-strong: #d85f1a;
            --lec-ink: #111111;
            --lec-line: #ffd4b5;
            --lec-bg-soft: #fff7ed;
            color: var(--lec-ink);
            background: #ffffff;
          }
          .lecturer-revamp-root .content {
            position: relative;
            z-index: 1;
          }
          .lecturer-revamp-root h1,
          .lecturer-revamp-root h2,
          .lecturer-revamp-root h3 {
            line-height: 1.2;
            letter-spacing: -0.01em;
            margin: 0;
          }
          .lecturer-revamp-root .lec-heading {
            font-size: 33px;
            font-weight: 750;
          }
          .lecturer-revamp-root .lec-kicker {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #111111;
            font-weight: 700;
          }
          .lecturer-revamp-root .lec-value {
            font-size: 26px;
            font-weight: 800;
            color: #111111;
          }
          .lecturer-revamp-root .lec-tag-live {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            border: 1px solid #f37021;
            border-radius: 999px;
            padding: 6px 12px;
            font-size: 12px;
            font-weight: 600;
            background: #ffffff;
            color: #111111;
          }
          .lecturer-revamp-root .lec-pill {
            border: 1px solid #f37021;
            border-radius: 999px;
            background: #f37021;
            padding: 8px 14px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            font-weight: 700;
            color: #ffffff;
            cursor: pointer;
            transition: all .2s ease;
          }
          .lecturer-revamp-root .lec-pill.active {
            border-color: #d85f1a;
            color: #ffffff;
            background: #d85f1a;
          }
          .lecturer-revamp-root .lec-pill:disabled {
            opacity: 1;
            cursor: not-allowed;
            background: #f7b486;
            border-color: #f7b486;
            color: #ffffff;
          }
          .lecturer-revamp-root .lec-primary,
          .lecturer-revamp-root .lec-soft,
          .lecturer-revamp-root .lec-ghost,
          .lecturer-revamp-root .lec-accent {
            border-radius: 10px;
            min-height: 42px;
            padding: 0 14px;
            font-weight: 700;
            cursor: pointer;
            border: 1px solid #f37021;
            background: #f37021;
            color: #ffffff;
            font-size: 13px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all .2s ease;
          }
          .lecturer-revamp-root .lec-primary,
          .lecturer-revamp-root .lec-soft,
          .lecturer-revamp-root .lec-ghost,
          .lecturer-revamp-root .lec-accent {
            box-shadow: 0 8px 18px rgba(243, 112, 33, 0.22);
          }
          .lecturer-revamp-root .lec-primary:hover,
          .lecturer-revamp-root .lec-soft:hover,
          .lecturer-revamp-root .lec-ghost:hover,
          .lecturer-revamp-root .lec-accent:hover {
            background: #d85f1a;
            border-color: #d85f1a;
          }
          .lecturer-revamp-root .lec-primary:disabled,
          .lecturer-revamp-root .lec-soft:disabled,
          .lecturer-revamp-root .lec-ghost:disabled,
          .lecturer-revamp-root .lec-accent:disabled {
            cursor: not-allowed;
            background: #f7b486;
            border-color: #f7b486;
            color: #ffffff;
            box-shadow: none;
          }
          .lecturer-revamp-root .lec-input,
          .lecturer-revamp-root select,
          .lecturer-revamp-root textarea {
            border: 1px solid #f7b486;
            border-radius: 10px;
            padding: 10px 12px;
            font-size: 14px;
            width: 100%;
            background: #ffffff;
            color: #111111;
          }
          .lecturer-revamp-root textarea {
            min-height: 100px;
            resize: vertical;
          }
          .lecturer-revamp-root .lec-input:focus,
          .lecturer-revamp-root select:focus,
          .lecturer-revamp-root textarea:focus {
            outline: none;
            border-color: #f37021;
            box-shadow: 0 0 0 3px rgba(243, 112, 33, 0.18);
          }
          .lecturer-revamp-root .lec-committee-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 12px;
          }
          .lecturer-revamp-root .lec-committee-card {
            border: 1px solid #ffd4b5;
            border-radius: 14px;
            padding: 14px;
            background: linear-gradient(165deg, #ffffff 0%, #fff9f4 100%);
            display: grid;
            gap: 10px;
            box-shadow: 0 10px 24px rgba(243, 112, 33, 0.14);
            transition: transform .2s ease, box-shadow .2s ease;
          }
          .lecturer-revamp-root .lec-committee-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 14px 28px rgba(243, 112, 33, 0.18);
          }
          .lecturer-revamp-root .lec-badge-row {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }
          .lecturer-revamp-root .lec-count-badge {
            display: inline-flex;
            gap: 6px;
            align-items: center;
            border: 1px solid #fed7aa;
            border-radius: 999px;
            padding: 4px 10px;
            font-size: 12px;
            font-weight: 600;
            color: #111111;
            background: #fff7ed;
          }
          .lecturer-revamp-root .lec-info-row {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: #111111;
            line-height: 1.4;
          }
          .lecturer-revamp-root .lec-info-row svg {
            color: #f37021;
          }
          .lecturer-revamp-root .lec-workspace {
            display: grid;
            grid-template-columns: 320px minmax(0, 1fr);
            gap: 14px;
          }
          .lecturer-revamp-root .lec-left-pane,
          .lecturer-revamp-root .lec-right-pane {
            border: 1px solid #ffd4b5;
            border-radius: 14px;
            background: #ffffff;
            padding: 12px;
            box-shadow: 0 4px 14px rgba(243, 112, 33, 0.08);
          }
          .lecturer-revamp-root .lec-assign-list {
            display: grid;
            gap: 8px;
          }
          .lecturer-revamp-root .lec-assign-btn {
            border: 1px solid #ffd4b5;
            border-radius: 10px;
            padding: 10px;
            text-align: left;
            background: #ffffff;
            cursor: pointer;
            color: #111111;
          }
          .lecturer-revamp-root .lec-assign-btn.active {
            border-color: #f37021;
            background: #fff7ed;
          }
          .lecturer-revamp-root .lec-room-header {
            border: 1px solid #ffd4b5;
            border-radius: 12px;
            background: #fff7ed;
            padding: 10px 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            flex-wrap: wrap;
          }
          .lecturer-revamp-root .lec-clock-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 10px;
            border-radius: 999px;
            border: 1px solid #f37021;
            background: #ffffff;
            color: #111111;
            font-size: 12px;
            font-weight: 700;
          }
          .lecturer-revamp-root .lec-room-switch {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }
          .lecturer-revamp-root .lec-tab-bar {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-top: 10px;
            margin-bottom: 10px;
          }
          .lecturer-revamp-root .lec-score-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 10px;
          }
          .lecturer-revamp-root .lec-score-item {
            border: 1px solid #ffd4b5;
            border-radius: 12px;
            padding: 10px;
            background: #ffffff;
          }
          .lecturer-revamp-root button svg,
          .lecturer-revamp-root a svg {
            margin: 0 !important;
            vertical-align: middle !important;
            flex: 0 0 auto;
          }
          .lecturer-revamp-root .lec-committee-actions {
            display: grid;
            gap: 8px;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .lecturer-revamp-root .lec-report-screen {
            border: 1px solid #ffd4b5;
            border-radius: 12px;
            background: #ffffff;
            padding: 12px;
            display: grid;
            gap: 10px;
          }
          @media (max-width: 1060px) {
            .lecturer-revamp-root .lec-workspace {
              grid-template-columns: 1fr;
            }
            .lecturer-revamp-root .lec-committee-actions {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      <div className="content">
        <section
          style={{
            ...cardStyle,
            marginBottom: 14,
            background: "linear-gradient(145deg, #ffffff 0%, #fff7ed 100%)",
          }}
        >
          <h1 className="lec-heading" style={{ color: "#f37021", display: "flex", alignItems: "center", gap: 10 }}>
            <Gavel size={30} color="#f37021" /> Hội đồng và chấm điểm giảng viên
          </h1>
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="lec-tag-live">Đợt: {periodDisplay}</span>
            {currentPeriod && <span className="lec-tag-live">Trạng thái đợt: {currentPeriod.status}</span>}
            <span className="lec-tag-live">
              Danh sách hội đồng: {councilListLocked === true ? "Đã chốt" : councilListLocked === false ? "Đang mở" : councilLockStatus}
            </span>
            <span className="lec-tag-live">Phòng chấm: {joinedCommittee ? `Đang tham gia ${joinedCommittee.id}` : "Chưa tham gia"}</span>
          </div>
          <div style={{ marginTop: 10, fontSize: 13, color: "#334155" }}>
            Cập nhật gần nhất: {latestActionTrace?.at ?? "Chưa có"}
          </div>
        </section>

        {currentSnapshotError && (
          <section
            style={{
              ...cardStyle,
              marginBottom: 14,
              borderColor: "#fecaca",
              background: "#fff7ed",
              color: "#9a3412",
            }}
          >
            <div style={{ fontWeight: 700 }}>Không thể tải snapshot giảng viên</div>
            <div style={{ marginTop: 6, fontSize: 13 }}>{currentSnapshotError}</div>
          </section>
        )}

        <section style={{ ...cardStyle, marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
            <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 12 }}>
              <div className="lec-kicker">Đang họp</div>
              <div className="lec-value">{committeeStats.live}</div>
            </div>
            <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 12 }}>
              <div className="lec-kicker">Sắp diễn ra</div>
              <div className="lec-value">{committeeStats.upcoming}</div>
            </div>
            <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 12 }}>
              <div className="lec-kicker">Đã khóa</div>
              <div className="lec-value">{committeeStats.locked}</div>
            </div>
            <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 12 }}>
              <div className="lec-kicker">Chờ duyệt chỉnh sửa</div>
              <div className="lec-value" style={{ color: "#f37021" }}>{committeeStats.pendingRevision}</div>
            </div>
          </div>
        </section>

        <section style={{ ...cardStyle, marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {panels.map((panel) => (
              <button
                key={panel.key}
                type="button"
                className={`lec-pill ${activePanel === panel.key ? "active" : ""}`}
                onClick={() => {
                  if (panel.key === "grading" && !joinedCommitteeId) {
                    notifyInfo("Vui lòng bấm Tham gia tại hội đồng đang họp để mở phòng chấm.");
                    return;
                  }
                  setActivePanel(panel.key);
                }}
                disabled={panel.key === "grading" && !joinedCommitteeId}
                title={panel.key === "grading" && !joinedCommitteeId ? "Chỉ mở sau khi tham gia hội đồng đang họp." : undefined}
              >
                {panel.icon} {panel.label}
              </button>
            ))}
          </div>
        </section>

        {activePanel === "councils" && (
          <section style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
              <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CalendarClock size={18} /> Danh sách hội đồng của tôi
              </h2>
              {permissionSourceMissing && (
                <span className="lec-tag-live" style={{ borderColor: "#fecaca", color: "#9a3412", background: "#fff7ed" }}>
                  API chưa trả AllowedActions, hệ thống sẽ khóa thao tác ghi.
                </span>
              )}
            </div>

            <div className="lec-committee-grid">
              {loadingData && <div style={{ fontSize: 13 }}>Đang tải danh sách hội đồng...</div>}
              {!loadingData && committees.length === 0 && (
                <div style={{ fontSize: 13, color: "#475569" }}>
                  {waitingCouncilLock
                    ? "Danh sách hội đồng đang chờ chốt. Vui lòng quay lại sau khi hội đồng được khóa."
                    : "Chưa có hội đồng trong snapshot hiện tại."}
                </div>
              )}

              {committees.map((committee) => {
                const metric = committeeBadgeStats.get(committee.id) ?? {
                  total: committee.studentCount,
                  scored: 0,
                  locked: 0,
                };
                const canJoin = committee.status === "Đang họp";
                const isChairCommittee = committee.normalizedRole === "CT";

                return (
                  <article key={committee.id} className="lec-committee-card">
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ display: "grid", gap: 4 }}>
                        <div style={{ fontSize: 18, fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
                          <Building2 size={17} color="#f37021" /> {committee.id}
                        </div>
                        <div style={{ fontSize: 14, color: "#111111", marginTop: 2, fontWeight: 700 }}>{committee.name}</div>
                      </div>
                      <div style={{ display: "grid", gap: 6, justifyItems: "end" }}>
                        <span className="lec-tag-live">{committee.status}</span>
                        {joinedCommitteeId === committee.id && (
                          <span className="lec-tag-live" style={{ borderColor: "#f37021", color: "#111111", background: "#fff7ed" }}>
                            Đang tham gia
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: 6 }}>
                      <div className="lec-info-row">
                        <Users2 size={14} />
                        <span>Vai trò của tôi: <strong>{committee.roleLabel}</strong></span>
                      </div>
                      <div className="lec-info-row">
                        <CalendarDays size={14} />
                        <span>Ngày bảo vệ: <strong>{formatDate(committee.date)}</strong></span>
                      </div>
                      <div className="lec-info-row">
                        <MapPin size={14} />
                        <span>Phòng: <strong>{committee.room}</strong> · Ca: <strong>{formatSession(committee.session)}</strong></span>
                      </div>
                      <div className="lec-info-row">
                        <Clock3 size={14} />
                        <span>Khung giờ: <strong>{committee.slot ?? "Chưa cập nhật"}</strong></span>
                      </div>
                    </div>

                    <div className="lec-badge-row">
                      <span className="lec-count-badge"><FileText size={12} /> Tổng đề tài: {metric.total}</span>
                      <span className="lec-count-badge"><CheckCircle2 size={12} /> Đã có điểm: {metric.scored}</span>
                      <span className="lec-count-badge"><Lock size={12} /> Đã khóa: {metric.locked}</span>
                    </div>

                    <div className="lec-committee-actions">
                      {isChairCommittee && committee.status !== "Đã khóa" && (
                        <button
                          type="button"
                          className="lec-primary"
                          onClick={() => {
                            void (committee.status === "Đang họp"
                              ? handleChairCloseSession(committee)
                              : handleChairOpenSession(committee));
                          }}
                        >
                          {committee.status === "Đang họp" ? <Lock size={14} /> : <CalendarClock size={14} />}
                          {committee.status === "Đang họp" ? "Đóng phiên" : "Mở phiên"}
                        </button>
                      )}
                      <button
                        type="button"
                        className="lec-ghost"
                        onClick={() => {
                          setDetailCommitteeId(committee.id);
                          setSelectedCommitteeId(committee.id);
                        }}
                      >
                        <Eye size={14} /> Xem chi tiết
                      </button>
                      <button
                        type="button"
                        className="lec-primary"
                        onClick={() => openRoleWorkspace(committee)}
                        disabled={!canJoin}
                        title={!canJoin ? "Nút Tham gia chỉ mở khi Chủ tịch đã mở phiên (Đang họp)." : undefined}
                      >
                        <ArrowRight size={14} /> Tham gia phòng chấm
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {activePanel === "grading" && (
          <section style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
              <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <LayoutDashboard size={18} /> Phòng chấm điểm hội đồng
              </h2>
              {joinedCommittee ? (
                <div className="lec-room-switch">
                  <span className="lec-tag-live">{joinedCommittee.id} · {joinedCommittee.name}</span>
                  <span className="lec-clock-chip">
                    <Clock3 size={13} /> {roomNow.toLocaleTimeString("vi-VN", { hour12: false })}
                  </span>
                  <button
                    type="button"
                    className="lec-soft"
                    onClick={() => setRoomView("scoring")}
                  >
                    <PencilRuler size={14} /> Phòng chấm điểm
                  </button>
                  <button
                    type="button"
                    className="lec-soft"
                    onClick={() => setRoomView("reports")}
                    disabled={!selectedMatrixRow && sortedScoringRows.length === 0}
                  >
                    <FileText size={14} /> Phòng báo cáo
                  </button>
                  <button
                    type="button"
                    className="lec-ghost"
                    onClick={() => {
                      setJoinedCommitteeId("");
                      setSelectedCommitteeId("");
                      setRoomView("scoring");
                      setWorkspaceTab("scoring");
                      setActivePanel("councils");
                    }}
                  >
                    <ArrowRight size={14} /> Rời phòng
                  </button>
                </div>
              ) : (
                <span className="lec-tag-live" style={{ borderColor: "#fed7aa", color: "#9a3412", background: "#fff7ed" }}>
                  Chưa tham gia hội đồng đang họp
                </span>
              )}
            </div>

            {!joinedCommittee ? (
              <div
                style={{
                  border: "1px solid #fed7aa",
                  borderRadius: 12,
                  padding: 14,
                  background: "#fff7ed",
                  color: "#9a3412",
                  display: "grid",
                  gap: 10,
                }}
              >
                <div style={{ fontWeight: 700 }}>Phòng chấm chỉ xuất hiện sau khi Tham gia hội đồng.</div>
                <div style={{ fontSize: 13 }}>
                  Vui lòng chuyển sang tab Danh sách hội đồng và bấm <strong>Tham gia</strong> tại hội đồng đang ở trạng thái <strong>Đang họp</strong>.
                </div>
                <div>
                  <button type="button" className="lec-primary" onClick={() => setActivePanel("councils")}>Mở danh sách hội đồng</button>
                </div>
              </div>
            ) : !selectedCommittee ? (
              <div style={{ fontSize: 13, color: "#475569" }}>Không tìm thấy dữ liệu hội đồng đã tham gia trong snapshot hiện tại.</div>
            ) : roomView === "reports" ? (
              <div className="lec-report-screen">
                <div className="lec-room-header">
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
                      <FileText size={16} color="#f37021" /> Báo cáo đồ án tốt nghiệp
                    </div>
                    <div style={{ fontSize: 13, color: "#111111" }}>
                      Màn hình riêng để xem toàn bộ báo cáo đã phát sinh theo từng đề tài của hội đồng.
                    </div>
                  </div>
                  <button type="button" className="lec-primary" onClick={() => setRoomView("scoring")}>
                    <ArrowRight size={14} /> Quay lại phòng chấm điểm
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span className="lec-kicker">Chọn đề tài cần xem báo cáo</span>
                    <select
                      value={selectedAssignmentId || ""}
                      onChange={(event) => setSelectedAssignmentId(Number(event.target.value) || 0)}
                    >
                      {sortedScoringRows.length === 0 && <option value="">Chưa có assignment</option>}
                      {sortedScoringRows.map((row) => (
                        <option key={`report-assignment-${row.assignmentId}`} value={row.assignmentId}>
                          {row.topicTitle} · {row.studentCode} · {formatSession(row.session)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div style={{ border: "1px solid #ffd4b5", borderRadius: 10, padding: 10, background: "#fff7ed", display: "grid", gap: 6 }}>
                    <div className="lec-info-row"><Building2 size={14} /> Hội đồng: <strong>{selectedCommittee.id}</strong></div>
                    <div className="lec-info-row"><CalendarDays size={14} /> Ngày bảo vệ: <strong>{formatDate(selectedCommittee.date)}</strong></div>
                    <div className="lec-info-row"><MapPin size={14} /> Phòng: <strong>{selectedCommittee.room}</strong></div>
                  </div>
                </div>

                {!selectedMatrixRow && (
                  <div style={{ fontSize: 13, color: "#64748b" }}>Chưa chọn đề tài để xem báo cáo.</div>
                )}

                {selectedMatrixRow && (
                  <>
                    <div style={{ border: "1px solid #ffd4b5", borderRadius: 12, padding: 12, background: "#fff7ed", display: "grid", gap: 8 }}>
                      <div className="lec-info-row"><Users2 size={14} /> Sinh viên: <strong>{selectedMatrixRow.studentCode} - {selectedMatrixRow.studentName}</strong></div>
                      <div className="lec-info-row"><FileText size={14} /> Đề tài: <strong>{selectedMatrixRow.topicTitle}</strong></div>
                      <div className="lec-info-row"><Users2 size={14} /> GVHD: <strong>{selectedMatrixRow.supervisorLecturerName ?? "Chưa cập nhật"}</strong></div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {selectedMatrixRow.topicTags.length > 0 ? (
                          selectedMatrixRow.topicTags.map((tag) => (
                            <span
                              key={`report-tag-${selectedMatrixRow.assignmentId}-${tag}`}
                              style={{
                                border: "1px solid #fdba74",
                                borderRadius: 999,
                                padding: "1px 8px",
                                fontSize: 11,
                                color: "#111111",
                                background: "#ffffff",
                              }}
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: 12, color: "#94a3b8" }}>Chưa có tags đề tài</span>
                        )}
                      </div>
                    </div>

                    {selectedMatrixRow.defenseDocuments.length === 0 ? (
                      <div style={{ fontSize: 13, color: "#64748b" }}>Đề tài hiện tại chưa có báo cáo đồ án tốt nghiệp.</div>
                    ) : (
                      <div style={{ display: "grid", gap: 10 }}>
                        {selectedMatrixRow.defenseDocuments.map((document) => (
                          <article
                            key={`doc-${selectedMatrixRow.assignmentId}-${document.documentId}`}
                            style={{ border: "1px solid #ffd4b5", borderRadius: 12, padding: 12, display: "grid", gap: 8, background: "#ffffff" }}
                          >
                            <div style={{ fontWeight: 700 }}>{document.fileName}</div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>
                              {document.mimeType ?? "Tệp báo cáo"}
                              {document.uploadedAt ? ` · ${formatDateTime(document.uploadedAt)}` : ""}
                            </div>
                            {document.fileUrl ? (
                              <a
                                href={document.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="lec-primary"
                                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none", width: "fit-content" }}
                              >
                                <ExternalLink size={14} /> Xem báo cáo đồ án tốt nghiệp
                              </a>
                            ) : (
                              <button type="button" className="lec-soft" disabled>
                                Chưa có URL báo cáo
                              </button>
                            )}
                          </article>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="lec-workspace">
                <aside className="lec-left-pane">
                  <div style={{ fontWeight: 800, marginBottom: 8 }}>Danh sách đề tài theo ca</div>
                  <div style={{ fontSize: 12, color: "#475569", marginBottom: 8 }}>
                    {selectedCommittee.id} · {selectedCommittee.name}
                  </div>

                  <div className="lec-assign-list">
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>Ca sáng</div>
                    {morningRows.map((row) => (
                      <button
                        key={`morning-${row.assignmentId}`}
                        type="button"
                        className={`lec-assign-btn ${selectedAssignmentId === row.assignmentId ? "active" : ""}`}
                        onClick={() => setSelectedAssignmentId(row.assignmentId)}
                      >
                        <div style={{ fontWeight: 700 }}>{row.topicTitle}</div>
                        <div style={{ fontSize: 12, color: "#475569" }}>{row.studentCode} · {row.studentName}</div>
                        <div style={{ fontSize: 12, color: "#475569" }}>
                          GVHD: <strong>{row.supervisorLecturerName ?? "Chưa cập nhật"}</strong>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {row.topicTags.length > 0 ? (
                            row.topicTags.slice(0, 3).map((tag) => (
                              <span
                                key={`m-tag-${row.assignmentId}-${tag}`}
                                style={{
                                  border: "1px solid #fed7aa",
                                  borderRadius: 999,
                                  padding: "1px 7px",
                                  fontSize: 11,
                                  color: "#9a3412",
                                  background: "#fff7ed",
                                }}
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>Chưa có tags</span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          {row.committeeCode} · {row.committeeName} · {formatSession(row.session)} · {formatRowTimeRange(row)}
                        </div>
                      </button>
                    ))}
                    {morningRows.length === 0 && <div style={{ fontSize: 12, color: "#94a3b8" }}>Chưa có đề tài ca sáng.</div>}

                    <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginTop: 6 }}>Ca chiều</div>
                    {afternoonRows.map((row) => (
                      <button
                        key={`afternoon-${row.assignmentId}`}
                        type="button"
                        className={`lec-assign-btn ${selectedAssignmentId === row.assignmentId ? "active" : ""}`}
                        onClick={() => setSelectedAssignmentId(row.assignmentId)}
                      >
                        <div style={{ fontWeight: 700 }}>{row.topicTitle}</div>
                        <div style={{ fontSize: 12, color: "#475569" }}>{row.studentCode} · {row.studentName}</div>
                        <div style={{ fontSize: 12, color: "#475569" }}>
                          GVHD: <strong>{row.supervisorLecturerName ?? "Chưa cập nhật"}</strong>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {row.topicTags.length > 0 ? (
                            row.topicTags.slice(0, 3).map((tag) => (
                              <span
                                key={`a-tag-${row.assignmentId}-${tag}`}
                                style={{
                                  border: "1px solid #fed7aa",
                                  borderRadius: 999,
                                  padding: "1px 7px",
                                  fontSize: 11,
                                  color: "#9a3412",
                                  background: "#fff7ed",
                                }}
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>Chưa có tags</span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          {row.committeeCode} · {row.committeeName} · {formatSession(row.session)} · {formatRowTimeRange(row)}
                        </div>
                      </button>
                    ))}
                    {afternoonRows.length === 0 && <div style={{ fontSize: 12, color: "#94a3b8" }}>Chưa có đề tài ca chiều.</div>}

                    <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginTop: 6 }}>Chưa phân ca</div>
                    {unscheduledRows.map((row) => (
                      <button
                        key={`unscheduled-${row.assignmentId}`}
                        type="button"
                        className={`lec-assign-btn ${selectedAssignmentId === row.assignmentId ? "active" : ""}`}
                        onClick={() => setSelectedAssignmentId(row.assignmentId)}
                      >
                        <div style={{ fontWeight: 700 }}>{row.topicTitle}</div>
                        <div style={{ fontSize: 12, color: "#475569" }}>{row.studentCode} · {row.studentName}</div>
                        <div style={{ fontSize: 12, color: "#475569" }}>
                          GVHD: <strong>{row.supervisorLecturerName ?? "Chưa cập nhật"}</strong>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {row.topicTags.length > 0 ? (
                            row.topicTags.slice(0, 3).map((tag) => (
                              <span
                                key={`u-tag-${row.assignmentId}-${tag}`}
                                style={{
                                  border: "1px solid #fed7aa",
                                  borderRadius: 999,
                                  padding: "1px 7px",
                                  fontSize: 11,
                                  color: "#9a3412",
                                  background: "#fff7ed",
                                }}
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>Chưa có tags</span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          {row.committeeCode} · {row.committeeName} · {formatSession(row.session)} · {formatRowTimeRange(row)}
                        </div>
                      </button>
                    ))}
                    {unscheduledRows.length === 0 && <div style={{ fontSize: 12, color: "#94a3b8" }}>Không có đề tài chưa phân ca.</div>}
                  </div>
                </aside>

                <div className="lec-right-pane">
                  <div className="lec-room-header" style={{ marginBottom: 10 }}>
                    <div style={{ display: "grid", gap: 4 }}>
                      <div style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
                        <PencilRuler size={16} color="#f37021" /> Màn hình chấm điểm hội đồng
                      </div>
                      <div style={{ fontSize: 12, color: "#111111" }}>
                        Mỗi thao tác chấm điểm, biên bản và phản biện được ghi nhận theo đề tài đang chọn.
                      </div>
                    </div>
                    <button
                      type="button"
                      className="lec-primary"
                      onClick={() => {
                        if (!selectedMatrixRow) {
                          notifyInfo("Vui lòng chọn đề tài trước khi mở phòng báo cáo.");
                          return;
                        }
                        openReportDrawer(selectedMatrixRow);
                      }}
                      disabled={!selectedMatrixRow || selectedMatrixRow.defenseDocuments.length === 0}
                    >
                      <FileText size={14} /> Mở phòng báo cáo đồ án tốt nghiệp
                    </button>
                  </div>

                  <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 10, background: "#fff7ed" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8, fontSize: 13 }}>
                      <div>
                        <span className="lec-kicker">Sinh viên</span>
                        <div style={{ fontWeight: 700 }}>{selectedMatrixRow ? `${selectedMatrixRow.studentCode} - ${selectedMatrixRow.studentName}` : "-"}</div>
                      </div>
                      <div>
                        <span className="lec-kicker">Đề tài</span>
                        <div style={{ fontWeight: 700 }}>{selectedMatrixRow?.topicTitle ?? "-"}</div>
                      </div>
                      <div>
                        <span className="lec-kicker">Giảng viên hướng dẫn</span>
                        <div style={{ fontWeight: 700 }}>{selectedMatrixRow?.supervisorLecturerName ?? "Chưa cập nhật"}</div>
                      </div>
                      <div>
                        <span className="lec-kicker">Tags đề tài</span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {(selectedMatrixRow?.topicTags ?? []).length > 0 ? (
                            (selectedMatrixRow?.topicTags ?? []).slice(0, 4).map((tag) => (
                              <span
                                key={`selected-tag-${selectedMatrixRow?.assignmentId ?? 0}-${tag}`}
                                style={{
                                  border: "1px solid #fdba74",
                                  borderRadius: 999,
                                  padding: "1px 7px",
                                  fontSize: 11,
                                  color: "#9a3412",
                                  background: "#fff7ed",
                                }}
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: 12, color: "#94a3b8" }}>Chưa có tags</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="lec-kicker">Hội đồng</span>
                        <div style={{ fontWeight: 700 }}>
                          {selectedMatrixRow ? `${selectedMatrixRow.committeeCode} - ${selectedMatrixRow.committeeName}` : "-"}
                        </div>
                      </div>
                      <div>
                        <span className="lec-kicker">Trạng thái khóa điểm</span>
                        <div style={{ fontWeight: 700 }}>{selectedMatrixRow?.isLocked ? "Đã khóa" : "Đang mở"}</div>
                      </div>
                      <div>
                        <span className="lec-kicker">Điểm GVHD (Topic.Score)</span>
                        <div style={{ fontWeight: 700 }}>{formatScore(scoreGvhdDisplay)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="lec-tab-bar">
                    {workspaceTabs.map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        className={`lec-pill ${workspaceTab === tab.key ? "active" : ""}`}
                        onClick={() => setWorkspaceTab(tab.key)}
                      >
                        {tab.icon} {tab.label}
                      </button>
                    ))}
                  </div>

                  {workspaceTab === "scoring" && (
                    <div style={{ display: "grid", gap: 12 }}>
                      <div className="lec-score-grid">
                        <div className="lec-score-item">
                          <div className="lec-kicker">GVHD</div>
                          <div className="lec-value" style={{ fontSize: 22 }}>{formatScore(selectedMatrixRow?.scoreGvhd ?? scoreGvhdDisplay)}</div>
                        </div>
                        <div className="lec-score-item">
                          <div className="lec-kicker">CT</div>
                          <div className="lec-value" style={{ fontSize: 22 }}>{formatScore(selectedMatrixRow?.scoreCt ?? null)}</div>
                        </div>
                        <div className="lec-score-item">
                          <div className="lec-kicker">UVTK</div>
                          <div className="lec-value" style={{ fontSize: 22 }}>{formatScore(selectedMatrixRow?.scoreTk ?? null)}</div>
                        </div>
                        <div className="lec-score-item">
                          <div className="lec-kicker">UVPB</div>
                          <div className="lec-value" style={{ fontSize: 22 }}>{formatScore(selectedMatrixRow?.scorePb ?? null)}</div>
                        </div>
                        <div className="lec-score-item">
                          <div className="lec-kicker">Điểm tổng hợp</div>
                          <div className="lec-value" style={{ fontSize: 22 }}>{formatScore(scoringOverview.finalScore)}</div>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                        <label style={{ display: "grid", gap: 6 }}>
                          <span className="lec-kicker">Điểm cá nhân (0-10)</span>
                          <input
                            className="lec-input"
                            type="number"
                            step={0.1}
                            min={0}
                            max={10}
                            value={myScore}
                            onChange={(event) => setMyScore(event.target.value)}
                            disabled={!canSubmitScore || !isSessionOpened || isCurrentSessionLocked}
                          />
                        </label>
                        <label style={{ display: "grid", gap: 6 }}>
                          <span className="lec-kicker">Đề tài đang chấm</span>
                          <select
                            value={selectedAssignmentId || ""}
                            onChange={(event) => setSelectedAssignmentId(Number(event.target.value) || 0)}
                          >
                            {sortedScoringRows.length === 0 && <option value="">Chưa có assignment</option>}
                            {sortedScoringRows.map((row) => (
                              <option key={row.assignmentId} value={row.assignmentId}>
                                {row.topicTitle} · {row.studentCode} · {row.committeeCode}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <label style={{ display: "grid", gap: 6 }}>
                        <span className="lec-kicker">Nhận xét chấm điểm</span>
                        <textarea
                          value={myComment}
                          onChange={(event) => setMyComment(event.target.value)}
                          disabled={!canSubmitScore || !isSessionOpened || isCurrentSessionLocked}
                        />
                      </label>

                      <label style={{ display: "grid", gap: 6 }}>
                        <span className="lec-kicker">Lý do yêu cầu mở lại chấm</span>
                        <textarea
                          value={reopenReason}
                          onChange={(event) => setReopenReason(event.target.value)}
                          rows={3}
                        />
                      </label>

                      {!isScoreValid && <div style={{ color: "#b91c1c", fontSize: 13 }}>Điểm phải trong khoảng từ 0 đến 10.</div>}
                      {hasVarianceAlert && (
                        <div style={{ border: "1px solid #fecaca", borderRadius: 10, padding: 10, background: "#fff7ed", color: "#9a3412", fontSize: 13 }}>
                          Chênh lệch điểm vượt ngưỡng ({formatScore(scoringOverview.variance)} / {formatScore(scoringOverview.varianceThreshold)}).
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="lec-primary"
                          onClick={async () => {
                            await handleSubmitScore();
                            await refreshAllScoringRows();
                          }}
                          disabled={!canSubmitScore || !isSessionOpened || isCurrentSessionLocked || !isScoreValid || submitted}
                        >
                          Gửi điểm cá nhân
                        </button>

                        <button
                          type="button"
                          className="lec-soft"
                          disabled={!canRequestReopen || !selectedAssignmentId || isCurrentSessionLocked}
                          onClick={async () => {
                            if (!canRequestReopen) {
                              notifyError("Tài khoản hiện tại không có quyền REOPEN_REQUEST.");
                              return;
                            }
                            if (!selectedAssignmentId) {
                              notifyError("Vui lòng chọn assignment trước khi yêu cầu mở lại chấm.");
                              return;
                            }
                            try {
                              const idempotencyKey = createIdempotencyKey(periodIdText || "NA", "lecturer-score-reopen");
                              const response = await lecturerApi.reopenRequestByCommittee(
                                selectedCommitteeNumericId,
                                {
                                  assignmentId: selectedAssignmentId,
                                  reason: reopenReason.trim() || "Cần mở lại chấm để cập nhật đánh giá.",
                                },
                                idempotencyKey,
                              );
                              if (notifyApiFailure(response as ApiResponse<unknown>, "Không gửi được yêu cầu mở lại chấm.")) {
                                return;
                              }
                              setChairRequestedReopen(true);
                              setSubmitted(false);
                              pushTrace("reopen-score", "[UC3.3] Đã gửi yêu cầu mở lại chấm.");
                              setAssignmentConcurrencyToken(createConcurrencyToken("lecturer-assignment"));
                              await refreshScoringData(selectedCommitteeNumericId);
                              await refreshAllScoringRows();
                            } catch {
                              notifyError("Không gửi được yêu cầu mở lại chấm.");
                            }
                          }}
                        >
                          <MessageSquareText size={14} /> Yêu cầu mở lại chấm
                        </button>

                        <button
                          type="button"
                          className="lec-soft"
                          disabled={!canOpenSession || isSessionOpened || isSessionClosed}
                          onClick={async () => {
                            try {
                              const idempotencyKey = createIdempotencyKey(periodIdText || "NA", "lecturer-session-open");
                              const response = await lecturerApi.openSessionByCommittee(selectedCommitteeNumericId, idempotencyKey);
                              if (notifyApiFailure(response as ApiResponse<unknown>, "Mở phiên chấm thất bại.")) {
                                return;
                              }
                              setCommittees((prev) =>
                                prev.map((item) =>
                                  item.id === selectedCommitteeId ? { ...item, status: "Đang họp" } : item,
                                ),
                              );
                              setSessionLocked(false);
                              pushTrace("open-session", "[UC3.1] Đã mở phiên chấm.");
                              await refreshScoringData(selectedCommitteeNumericId);
                              await refreshAllScoringRows();
                            } catch {
                              notifyError("Mở phiên chấm thất bại.");
                            }
                          }}
                        >
                          <CalendarClock size={14} /> Mở phiên
                        </button>

                        <button
                          type="button"
                          className="lec-primary"
                          disabled={!canLockSession || isCurrentSessionLocked || !isSessionOpened}
                          onClick={async () => {
                            try {
                              const idempotencyKey = createIdempotencyKey(periodIdText || "NA", "lecturer-session-lock");
                              const response = await lecturerApi.lockSessionByCommittee(selectedCommitteeNumericId, idempotencyKey);
                              if (notifyApiFailure(response as ApiResponse<unknown>, "Đóng phiên chấm thất bại.")) {
                                return;
                              }
                              setSessionLocked(true);
                              setCommittees((prev) =>
                                prev.map((item) =>
                                  item.id === selectedCommitteeId ? { ...item, status: "Đã khóa" } : item,
                                ),
                              );
                              pushTrace("lock-session", "[UC3.5] Đã đóng phiên chấm.");
                              await refreshScoringData(selectedCommitteeNumericId);
                              await refreshAllScoringRows();
                            } catch (error) {
                              const missingMembers = extractMissingMemberCodes(error);
                              if (missingMembers.length > 0) {
                                notifyError(`Thiếu điểm từ thành viên: ${missingMembers.join(", ")}`);
                                return;
                              }
                              notifyError("Đóng phiên chấm thất bại.");
                            }
                          }}
                        >
                          <Lock size={14} /> Đóng phiên
                        </button>
                      </div>

                      {submitted && <div style={{ fontSize: 13, color: "#166534" }}>Đã gửi điểm thành công.</div>}
                      {chairRequestedReopen && <div style={{ fontSize: 13, color: "#9a3412" }}>Đã gửi yêu cầu mở lại chấm.</div>}
                    </div>
                  )}

                  {workspaceTab === "minutes" && (
                    <div style={{ display: "grid", gap: 10 }}>
                      <div style={{ fontSize: 13, color: "#334155" }}>
                        Form biên bản: SummaryContent, QnaDetails, Strengths, Weaknesses, Recommendations. Chỉ cho phép ghi khi API trả AllowedMinuteActions phù hợp.
                      </div>

                      <label style={{ display: "grid", gap: 6 }}>
                        <span className="lec-kicker">SummaryContent</span>
                        <textarea value={summary} onChange={(event) => setSummary(event.target.value)} readOnly={!canEditMinutes} />
                      </label>
                      <label style={{ display: "grid", gap: 6 }}>
                        <span className="lec-kicker">QnaDetails</span>
                        <textarea value={questions} onChange={(event) => setQuestions(event.target.value)} readOnly={!canEditMinutes} />
                      </label>
                      <label style={{ display: "grid", gap: 6 }}>
                        <span className="lec-kicker">Strengths</span>
                        <textarea value={strengths} onChange={(event) => setStrengths(event.target.value)} readOnly={!canEditMinutes} />
                      </label>
                      <label style={{ display: "grid", gap: 6 }}>
                        <span className="lec-kicker">Weaknesses</span>
                        <textarea value={weaknesses} onChange={(event) => setWeaknesses(event.target.value)} readOnly={!canEditMinutes} />
                      </label>
                      <label style={{ display: "grid", gap: 6 }}>
                        <span className="lec-kicker">Recommendations</span>
                        <textarea value={recommendations} onChange={(event) => setRecommendations(event.target.value)} readOnly={!canEditMinutes} />
                      </label>

                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{lastAutoSave ? `Autosave local: ${lastAutoSave}` : "Autosave local mỗi 30 giây"}</div>
                        <button
                          type="button"
                          className="lec-primary"
                          disabled={!canEditMinutes || !selectedAssignmentId}
                          onClick={async () => {
                            if (!selectedAssignmentId) {
                              notifyError("Vui lòng chọn assignment để lưu biên bản.");
                              return;
                            }
                            try {
                              const idempotencyKey = createIdempotencyKey(periodIdText || "NA", "lecturer-minutes-save");
                              const response = await lecturerApi.updateCommitteeMinutes(
                                selectedCommitteeNumericId,
                                {
                                  assignmentId: selectedAssignmentId,
                                  summaryContent: summary,
                                  reviewerComments: review,
                                  qnaDetails: questions,
                                  strengths,
                                  weaknesses,
                                  recommendations,
                                },
                                idempotencyKey,
                              );
                              if (notifyApiFailure(response as ApiResponse<unknown>, "Không lưu được biên bản.")) {
                                return;
                              }
                              setLastAutoSave(new Date().toLocaleTimeString("vi-VN"));
                              pushTrace("minutes-upsert", "Đã lưu biên bản họp.");
                              await hydrateMinutes(selectedCommitteeNumericId, selectedAssignmentId);
                              await refreshAllScoringRows();
                            } catch {
                              notifyError("Không lưu được biên bản.");
                            }
                          }}
                        >
                          <Save size={14} /> Lưu biên bản
                        </button>
                      </div>
                    </div>
                  )}

                  {workspaceTab === "review" && (
                    <div style={{ display: "grid", gap: 10 }}>
                      <div style={{ fontSize: 13, color: "#334155" }}>
                        UVPB nhập chính phần ReviewerComments; CT/UVTK theo dõi và tổng hợp từ cùng nguồn snapshot.
                      </div>

                      <label style={{ display: "grid", gap: 6 }}>
                        <span className="lec-kicker">ReviewerComments</span>
                        <textarea
                          value={review}
                          onChange={(event) => setReview(event.target.value)}
                          readOnly={!canEditReviewerComments}
                        />
                      </label>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="lec-primary"
                          disabled={!canEditReviewerComments || !selectedAssignmentId}
                          onClick={async () => {
                            if (!selectedAssignmentId) {
                              notifyError("Vui lòng chọn assignment trước khi lưu nhận xét phản biện.");
                              return;
                            }
                            try {
                              const idempotencyKey = createIdempotencyKey(periodIdText || "NA", "lecturer-review-save");
                              const response = await lecturerApi.updateCommitteeMinutes(
                                selectedCommitteeNumericId,
                                {
                                  assignmentId: selectedAssignmentId,
                                  summaryContent: summary,
                                  reviewerComments: review,
                                  qnaDetails: questions,
                                  strengths,
                                  weaknesses,
                                  recommendations,
                                },
                                idempotencyKey,
                              );
                              if (notifyApiFailure(response as ApiResponse<unknown>, "Không lưu được nhận xét phản biện.")) {
                                return;
                              }
                              pushTrace("reviewer-comments-upsert", "Đã lưu nhận xét phản biện.");
                              await hydrateMinutes(selectedCommitteeNumericId, selectedAssignmentId);
                            } catch {
                              notifyError("Không lưu được nhận xét phản biện.");
                            }
                          }}
                        >
                          <Save size={14} /> Lưu nhận xét
                        </button>
                      </div>

                      <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 10 }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Liên thông chỉnh sửa sau bảo vệ</div>
                        <div style={{ fontSize: 13, marginBottom: 8 }}>
                          Revision hiện chọn: {selectedRevisionItem.topicTitle || "-"} · {selectedRevisionItem.studentCode || "-"}
                        </div>
                        {selectedRevisionItem.revisionFileUrl && (
                          <a
                            href={normalizeUrl(selectedRevisionItem.revisionFileUrl)}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#0f172a" }}
                          >
                            <ExternalLink size={13} /> Mở tệp chỉnh sửa
                          </a>
                        )}
                        <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            className="lec-soft"
                            disabled={!canApproveRevision || !selectedRevisionItem.revisionId}
                            onClick={async () => {
                              const revisionId = selectedRevisionItem.revisionId || 0;
                              if (!revisionId) {
                                notifyError("Không tìm thấy revision để duyệt.");
                                return;
                              }
                              try {
                                const idempotencyKey = createIdempotencyKey(periodIdText || "NA", "lecturer-approve-revision");
                                const response = await lecturerApi.approveRevision(revisionId, idempotencyKey);
                                if (notifyApiFailure(response as ApiResponse<unknown>, "Không duyệt được bản chỉnh sửa.")) {
                                  return;
                                }
                                pushTrace("approve-revision", "[UC4.2] Duyệt bản chỉnh sửa.");
                                await refreshRevisionQueue();
                              } catch {
                                notifyError("Không duyệt được bản chỉnh sửa.");
                              }
                            }}
                          >
                            <CheckCircle2 size={14} /> Duyệt
                          </button>
                          <button
                            type="button"
                            className="lec-soft"
                            disabled={!canRejectRevision || !selectedRevisionItem.revisionId}
                            onClick={async () => {
                              if (!reopenReason.trim()) {
                                notifyError(ucError("UC4.2-REJECT_REASON_REQUIRED"));
                                return;
                              }
                              const revisionId = selectedRevisionItem.revisionId || 0;
                              if (!revisionId) {
                                notifyError("Không tìm thấy revision để từ chối.");
                                return;
                              }
                              try {
                                const idempotencyKey = createIdempotencyKey(periodIdText || "NA", "lecturer-reject-revision");
                                const response = await lecturerApi.rejectRevision(revisionId, reopenReason.trim(), idempotencyKey);
                                if (notifyApiFailure(response as ApiResponse<unknown>, "Không từ chối được bản chỉnh sửa.")) {
                                  return;
                                }
                                pushTrace("reject-revision", "[UC4.2] Từ chối bản chỉnh sửa.");
                                await refreshRevisionQueue();
                              } catch {
                                notifyError("Không từ chối được bản chỉnh sửa.");
                              }
                            }}
                          >
                            <XCircle size={14} /> Từ chối
                          </button>
                        </div>
                      </div>

                      <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 10 }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Danh sách revision</div>
                        {revisionQueue.length === 0 && <div style={{ fontSize: 13, color: "#64748b" }}>Không có bản chỉnh sửa chờ duyệt.</div>}
                        {revisionQueue.map((item) => (
                          <button
                            key={`revision-${item.revisionId}-${item.assignmentId ?? "na"}`}
                            type="button"
                            className="lec-assign-btn"
                            style={{ width: "100%", marginBottom: 6 }}
                            onClick={() => setRevision(item)}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                              <span style={{ fontWeight: 700 }}>{item.topicTitle}</span>
                              <span style={{ fontSize: 12, color: "#475569" }}>{item.status}</span>
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>
                              {item.studentCode} · Assignment {item.assignmentId ?? "-"} · {formatDateTime(item.lastUpdated)}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}
          </section>
        )}
      </div>

      {detailCommittee && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            zIndex: 3200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 18,
          }}
          onClick={() => setDetailCommitteeId("")}
        >
          <div
            style={{
              width: "min(860px, calc(100vw - 24px))",
              maxHeight: "calc(100vh - 36px)",
              overflowY: "auto",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: 14,
              padding: 16,
              boxShadow: "0 20px 44px rgba(2, 6, 23, 0.24)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div>
                <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Info size={18} /> Chi tiết hội đồng {detailCommittee.id}
                </h3>
                <div style={{ marginTop: 4, fontSize: 13, color: "#334155" }}>{detailCommittee.name}</div>
              </div>
              <button type="button" className="lec-ghost" onClick={() => setDetailCommitteeId("")}>Đóng</button>
            </div>

            <div className="lec-tab-bar">
              {detailTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`lec-pill ${detailTab === tab.key ? "active" : ""}`}
                  onClick={() => setDetailTab(tab.key)}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {detailTab === "overview" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 10 }}>
                  <div className="lec-kicker">Mã hội đồng</div>
                  <div style={{ fontWeight: 700 }}>{detailCommittee.id}</div>
                </div>
                <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 10 }}>
                  <div className="lec-kicker">Vai trò của tôi</div>
                  <div style={{ fontWeight: 700 }}>{detailCommittee.roleLabel}</div>
                </div>
                <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 10 }}>
                  <div className="lec-kicker">Lịch bảo vệ</div>
                  <div style={{ fontWeight: 700 }}>{formatDate(detailCommittee.date)} · {formatSession(detailCommittee.session)}</div>
                </div>
                <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 10 }}>
                  <div className="lec-kicker">Phòng</div>
                  <div style={{ fontWeight: 700 }}>{detailCommittee.room}</div>
                </div>
                <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 10 }}>
                  <div className="lec-kicker">Trạng thái phiên</div>
                  <div style={{ fontWeight: 700 }}>{detailCommittee.status}</div>
                </div>
                <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 10 }}>
                  <div className="lec-kicker">Số đề tài</div>
                  <div style={{ fontWeight: 700 }}>{committeeBadgeStats.get(detailCommittee.id)?.total ?? detailCommittee.studentCount}</div>
                </div>
              </div>
            )}

            {detailTab === "members" && (
              <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 10 }}>
                {detailCommittee.members.length === 0 && (
                  <div style={{ fontSize: 13, color: "#64748b" }}>Snapshot chưa có danh sách thành viên cho hội đồng này.</div>
                )}
                {detailCommittee.members.map((member) => (
                  <div
                    key={member.memberId}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(120px, 180px) minmax(0, 1fr)",
                      gap: 8,
                      padding: "8px 0",
                      borderBottom: "1px dashed #e2e8f0",
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{member.roleLabel}</div>
                    <div style={{ fontSize: 13 }}>
                      {member.lecturerCode ? `${member.lecturerCode} - ` : ""}
                      {member.lecturerName}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {detailTab === "topics" && (
              <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 10 }}>
                {detailCommitteeRows.length === 0 && (
                  <div style={{ fontSize: 13, color: "#64748b" }}>Chưa có assignment trong scoring matrix cho hội đồng này.</div>
                )}
                {detailCommitteeRows.map((row) => (
                  <div
                    key={`detail-topic-${row.assignmentId}`}
                    style={{
                      display: "grid",
                      gap: 4,
                      padding: "8px 0",
                      borderBottom: "1px dashed #e2e8f0",
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{row.topicTitle}</div>
                    <div style={{ fontSize: 13, color: "#475569" }}>
                      {row.studentCode} - {row.studentName} · {formatSession(row.session)} · {formatRowTimeRange(row)}
                    </div>
                    <div style={{ fontSize: 13, color: "#475569" }}>
                      GVHD: <strong>{row.supervisorLecturerName ?? "Chưa cập nhật"}</strong> · Hội đồng: <strong>{row.committeeCode} - {row.committeeName}</strong>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {row.topicTags.length > 0 ? (
                        row.topicTags.map((tag) => (
                          <span
                            key={`detail-tag-${row.assignmentId}-${tag}`}
                            style={{
                              border: "1px solid #fdba74",
                              borderRadius: 999,
                              padding: "1px 8px",
                              fontSize: 11,
                              color: "#9a3412",
                              background: "#fff7ed",
                            }}
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>Chưa có tags đề tài</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="lec-ghost" onClick={() => setDetailCommitteeId("")}>Đóng</button>
              <button
                type="button"
                className="lec-primary"
                onClick={() => {
                  setJoinedCommitteeId(detailCommittee.id);
                  setSelectedCommitteeId(detailCommittee.id);
                  setRoomView("scoring");
                  setWorkspaceTab("scoring");
                  setActivePanel("grading");
                  setDetailCommitteeId("");
                }}
                disabled={detailCommittee.status !== "Đang họp"}
              >
                <ArrowRight size={14} /> Tham gia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LecturerCommittees;
