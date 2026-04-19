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
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardPen,
  Clock4,
  Eye,
  ExternalLink,
  FileCheck2,
  FileText,
  Gavel,
  Info,
  Lock,
  MapPin,
  MessageSquareText,
  NotebookPen,
  PanelRightOpen,
  PencilRuler,
  ShieldAlert,
  Save,
  ShieldCheck,
  Star,
  Users2,
  XCircle,
} from "lucide-react";

type Committee = {
  id: string;
  numericId: number;
  room: string;
  session: SessionCode;
  date: string;
  slot: string;
  studentCount: number;
  status: "Sắp diễn ra" | "Đang họp" | "Đã khóa";
  normalizedRole: CommitteeRoleCode;
  roleCode: CommitteeRoleCode;
  roleLabel: string;
  roleRaw: string;
  allowedScoringActions: string[];
  allowedMinuteActions: string[];
  allowedRevisionActions: string[];
};

type CommitteeRoleCode = "CT" | "TK" | "PB" | "UV" | "UNKNOWN";

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

type PanelKey = "councils" | "minutes" | "grading" | "revision";

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
  assignmentId: number;
  assignmentCode: string;
  studentCode: string;
  studentName: string;
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
  { key: "minutes", label: "Biên bản", icon: <NotebookPen size={15} /> },
  { key: "grading", label: "Chấm điểm", icon: <PencilRuler size={15} /> },
  { key: "revision", label: "Duyệt chỉnh sửa", icon: <BookOpenCheck size={15} /> },
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
    raw === "TK" ||
    raw === "SECRETARY" ||
    raw.includes("THU KY") ||
    raw.includes("THƯ KÝ")
  ) {
    return "TK";
  }

  if (
    raw === "PB" ||
    raw === "REVIEWER" ||
    raw.includes("PHAN BIEN") ||
    raw.includes("PHẢN BIỆN")
  ) {
    return "PB";
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
    case "TK":
      return "Thư ký hội đồng";
    case "PB":
      return "Phản biện hội đồng";
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

const getDefaultPanelForRole = (roleCode: CommitteeRoleCode): PanelKey => {
  if (roleCode === "TK") {
    return "minutes";
  }
  return "grading";
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

  const getLecturerSnapshot = async () => {
    const envelope = await fetchData<ApiResponse<Record<string, unknown>>>(
      "/lecturer-defense/current/snapshot",
      {
        method: "GET",
      },
    );

    const payload = readEnvelopeData<Record<string, unknown>>(envelope);
    const periodView = mapCurrentPeriodView(
      toRecord(
        pickSnapshotSection(payload, ["period", "Period"], null),
      ),
    );

    if (!periodView) {
      throw new Error("CURRENT_PERIOD_CONTRACT_INVALID");
    }

    setPeriodId(periodView.periodId);
    setActiveDefensePeriodId(periodView.periodId);
    syncPeriodToUrl(periodView.periodId);
    setCurrentPeriod(periodView);
    setCurrentSnapshotError(null);

    const snapshot =
      toRecord(
        pickSnapshotSection(payload, ["snapshot", "Snapshot"], payload),
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
      const snapshotRes = await getLecturerSnapshot();
      const snapshot = readEnvelopeData<Record<string, unknown>>(snapshotRes);
      const minutesRows = pickSnapshotSection<Array<Record<string, unknown>>>(
        snapshot,
        ["minutes", "Minutes"],
        [],
      );
      const committeeId = Number(id);
      const filtered = (Array.isArray(minutesRows) ? minutesRows : []).filter(
        (item) =>
          Number(item.committeeId ?? item.councilId ?? 0) === committeeId ||
          String(item.committeeCode ?? "") === String(id),
      );

      return toCompatResponse(snapshotRes, filtered);
    },
    updateCommitteeMinutes: (id: string | number, payload: Record<string, unknown>, idempotencyKey?: string) =>
      fetchData<ApiResponse<boolean>>(`${lecturerBase}/minutes/upsert`, {
        method: "POST",
        body: {
          committeeId: Number(id),
          ...payload,
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
          ...payload,
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
          ...payload,
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
          reason,
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
  const [revisionQueue, setRevisionQueue] = useState<RevisionRequest[]>([]);
  const [selectedCommitteeId, setSelectedCommitteeId] = useState<string>("");
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
  const [scoringMatrix, setScoringMatrix] = useState<ScoringMatrixRow[]>([]);
  const [scoringAlerts, setScoringAlerts] = useState<ScoringAlertRow[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number>(0);
  const [reportDrawerAssignmentId, setReportDrawerAssignmentId] = useState<number | null>(null);
  const [fallbackAllowedActions, setFallbackAllowedActions] = useState<string[]>([]);

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
    const mappedMatrix: ScoringMatrixRow[] = matrixItems.map((item) => {
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

      return {
        committeeId: Number(item.committeeId ?? committeeId),
        committeeCode: String(item.committeeCode ?? selectedCommitteeId),
        assignmentId: Number(item.assignmentId ?? 0),
        assignmentCode: String(item.assignmentCode ?? "-"),
        studentCode: String(item.studentCode ?? "-"),
        studentName: String(item.studentName ?? "-"),
        finalScore: Number.isFinite(Number(item.finalScore)) ? Number(item.finalScore) : null,
        finalGrade: item.finalGrade != null ? String(item.finalGrade) : null,
        variance: Number.isFinite(Number(item.variance)) ? Number(item.variance) : null,
        isLocked: Boolean(item.isLocked),
        status: String(item.status ?? "PENDING"),
        submittedCount: Number(item.submittedCount ?? 0),
        requiredCount: Number(item.requiredCount ?? 0),
        defenseDocuments: mapDefenseDocuments(rawDocuments),
      };
    });
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

            const sessionRaw = String(
              pickSnapshotSection<unknown>(item, ["session", "Session"], "MORNING"),
            ).trim();

            return {
              id: committeeCode,
              numericId,
              room: String(pickSnapshotSection<unknown>(item, ["room", "Room"], "-") ?? "-") || "-",
              session: sessionRaw.toUpperCase() === "AFTERNOON" ? "AFTERNOON" : "MORNING",
              date: String(
                pickSnapshotSection<unknown>(item, ["defenseDate", "DefenseDate"], new Date().toISOString()),
              ).slice(0, 10),
              slot: `${String(pickSnapshotSection<unknown>(item, ["startTime", "StartTime"], "08:00"))} - ${String(pickSnapshotSection<unknown>(item, ["endTime", "EndTime"], "09:30"))}`,
              studentCount: Number(pickSnapshotSection<unknown>(item, ["studentCount", "StudentCount"], 0) ?? 0),
              status: mapCommitteeStatus(pickSnapshotSection<unknown>(item, ["status", "Status"], "")),
              normalizedRole: roleCode,
              roleCode,
              roleLabel: getRoleLabel(roleCode),
              roleRaw: String(pickSnapshotSection<unknown>(item, ["role", "Role"], "")).trim(),
              allowedScoringActions,
              allowedMinuteActions,
              allowedRevisionActions,
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
      } catch (error) {
        setCommittees([]);
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
  const reportDrawerRow = useMemo(
    () =>
      reportDrawerAssignmentId == null
        ? null
        : scoringMatrix.find((row) => row.assignmentId === reportDrawerAssignmentId) ?? null,
    [reportDrawerAssignmentId, scoringMatrix],
  );

  const selectedRoleCode = selectedCommittee?.normalizedRole ?? "UNKNOWN";
  const selectedScoringActions = selectedCommittee?.allowedScoringActions ?? [];
  const selectedMinuteActions = selectedCommittee?.allowedMinuteActions ?? [];
  const selectedRevisionActions = selectedCommittee?.allowedRevisionActions ?? [];

  const hasScoringPermissionSource =
    selectedScoringActions.length > 0 || normalizedFallbackAllowedActions.length > 0;
  const hasMinutePermissionSource =
    selectedMinuteActions.length > 0 || normalizedFallbackAllowedActions.length > 0;
  const hasRevisionPermissionSource =
    selectedRevisionActions.length > 0 || normalizedFallbackAllowedActions.length > 0;

  const isChair = selectedRoleCode === "CT";

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

  const canOpenSession =
    canOpenSessionByActions || (!hasScoringPermissionSource && isChair);
  const canSubmitScore =
    canSubmitScoreByActions || (!hasScoringPermissionSource && selectedRoleCode !== "UNKNOWN");
  const canRequestReopen =
    canRequestReopenByActions || (!hasScoringPermissionSource && isChair);
  const canLockSession =
    canLockSessionByActions || (!hasScoringPermissionSource && isChair);

  const canEditMinutesByActions = hasAllowedAction(
    selectedMinuteActions,
    "UPSERT",
    "UPSERT_MINUTES",
    "UPDATE_MINUTES",
    "EDIT_MINUTES",
  );
  const canEditMinutes =
    canEditMinutesByActions ||
    (!hasMinutePermissionSource && (selectedRoleCode === "CT" || selectedRoleCode === "TK"));

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
  const canApproveRevision =
    canApproveRevisionByActions ||
    (!hasRevisionPermissionSource && (selectedRoleCode === "CT" || selectedRoleCode === "TK"));
  const canRejectRevision =
    canRejectRevisionByActions ||
    (!hasRevisionPermissionSource && (selectedRoleCode === "CT" || selectedRoleCode === "TK"));
  const canReviewRevision = canApproveRevision || canRejectRevision;

  const isSessionOpened = selectedCommittee?.status === "Đang họp";
  const isSessionClosed = selectedCommittee?.status === "Đã khóa";
  const isCurrentSessionLocked = isSessionClosed || sessionLocked;

  const roleAwarePanels = useMemo(
    () =>
      panels.filter((panel) => {
        if (panel.key === "minutes") {
          return canEditMinutes;
        }
        if (panel.key === "revision") {
          return canReviewRevision;
        }
        return true;
      }),
    [canEditMinutes, canReviewRevision],
  );

  useEffect(() => {
    if (activePanel === "minutes" && !canEditMinutes) {
      setActivePanel("grading");
      return;
    }
    if (activePanel === "revision" && !canReviewRevision) {
      setActivePanel("grading");
    }
  }, [activePanel, canEditMinutes, canReviewRevision]);

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
    setReportDrawerAssignmentId(null);
  }, [selectedCommitteeId]);

  useEffect(() => {
    if (activePanel !== "grading") {
      setReportDrawerAssignmentId(null);
    }
  }, [activePanel]);

  useEffect(() => {
    if (!reportDrawerRow) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setReportDrawerAssignmentId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [reportDrawerRow]);

  useEffect(() => {
    if (activePanel !== "minutes" || !selectedCommitteeId) {
      return;
    }
    void hydrateMinutes(selectedCommitteeNumericId, selectedAssignmentId || undefined);
  }, [activePanel, selectedCommitteeId, selectedCommitteeNumericId, selectedAssignmentId]);

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

  const formatSession = (session: Committee["session"]) =>
    session === "MORNING" ? "MORNING (Sáng)" : "AFTERNOON (Chiều)";

  const openRoleWorkspace = (committee: Committee) => {
    const canOpenMinutesWorkspace = includesAnyAction(
      committee.allowedMinuteActions,
      "UPSERT",
      "UPSERT_MINUTES",
      "UPDATE_MINUTES",
      "EDIT_MINUTES",
    );
    setSelectedCommitteeId(committee.id);
    if (
      committee.normalizedRole === "TK" &&
      (canOpenMinutesWorkspace || committee.allowedMinuteActions.length === 0)
    ) {
      setActivePanel("minutes");
      return;
    }

    setActivePanel(getDefaultPanelForRole(committee.normalizedRole));
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
      notifyInfo("Assignment này chưa có tệp báo cáo để xem.");
      return;
    }
    setSelectedAssignmentId(row.assignmentId);
    setReportDrawerAssignmentId(row.assignmentId);
  };

  return (
    <div
      style={{
        maxWidth: 1420,
        margin: "0 auto",
        padding: 24,
        position: "relative",
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      }}
      className="lecturer-revamp-root"
    >
      <style>
        {`
          .lecturer-revamp-root {
            --lec-accent: #f37021;
            --lec-ink: #0f172a;
            --lec-muted: #64748b;
            --lec-line: #cbd5e1;
            --lec-btn-h: 44px;
            --lec-input-h: 48px;
            --lec-pill-h: 44px;
            --lec-cell-px: 12px;
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            color: var(--lec-ink);
            background: #ffffff;
            border-radius: 12px;
          }
          .lecturer-revamp-root h1,
          .lecturer-revamp-root h2,
          .lecturer-revamp-root h3 {
            line-height: 1.25;
            letter-spacing: -0.01em;
          }
          .lecturer-revamp-root .lec-kicker {
            font-size: 11px;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            font-weight: 700;
            color: #0f172a;
            line-height: 1.35;
          }
          .lecturer-revamp-root .lec-value {
            font-size: 24px;
            font-weight: 700;
            line-height: 1.2;
            color: #0f172a;
          }
          .lecturer-revamp-root .lec-meta {
            font-size: 13px;
            line-height: 1.45;
            color: #0f172a;
          }
          .lecturer-revamp-root .lec-control-bar {
            min-height: 56px;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            background: #ffffff;
            padding: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }
          .lecturer-revamp-root .content { position:relative; z-index:1; }
          .lecturer-revamp-root button {
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            font-weight: 600;
            font-size: 14px;
            border-radius: 10px;
            color: #0f172a;
          }
          .lecturer-revamp-root input, .lecturer-revamp-root textarea, .lecturer-revamp-root select { border:1px solid var(--lec-line); border-radius:10px; padding:8px 12px; background:#ffffff; font-size:16px; }
          .lecturer-revamp-root input,
          .lecturer-revamp-root select {
            height: var(--lec-input-h);
            min-height: var(--lec-input-h);
            line-height: 1.2;
          }
          .lecturer-revamp-root textarea {
            min-height: 112px;
          }
          .lecturer-revamp-root input:focus, .lecturer-revamp-root textarea:focus, .lecturer-revamp-root select:focus { outline:none; border-color:var(--lec-accent); box-shadow:0 0 0 3px rgba(243,112,33,.16); }
          .lec-pill {
            border: 1px solid #cbd5e1;
            border-radius: 999px;
            min-height: 42px;
            padding: 0 16px;
            background: #ffffff;
            font-weight: 600;
            color: #0f172a;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            line-height: 1.15;
            position: relative;
            overflow: clip;
            transition: border-color .22s ease, background-color .22s ease, color .22s ease;
          }
          .lec-pill::after {
            content: "";
            position: absolute;
            left: 14px;
            right: 14px;
            bottom: 5px;
            height: 2px;
            border-radius: 999px;
            background: #f37021;
            transform: scaleX(0);
            transform-origin: center;
            transition: transform .24s ease;
          }
          .lec-pill.active {
            border-color: #cbd5e1;
            background: #ffffff;
            color: #0f172a;
          }
          .lec-pill.active::after,
          .lec-pill:hover::after {
            transform: scaleX(1);
          }
          .lec-pill .pill-icon {
            width:20px;
            height:20px;
            border-radius:999px;
            display:inline-flex;
            align-items:center;
            justify-content:center;
            background: #ffffff;
            border: 1px solid #cbd5e1;
          }
          .lec-pill.active .pill-icon {
            background: #ffffff;
            border-color: #cbd5e1;
          }
          .lec-pill:hover {
            border-color: #cbd5e1;
            background: #ffffff;
            color: #0f172a;
          }
          .lec-primary {
              border: none;
              border-radius: 12px;
              background: #f37021;
              color: #ffffff;
              padding: 0 16px;
              font-weight: 600;
              cursor: pointer;
              font-size: 14px;
              line-height: 1.2;
              min-height: var(--lec-btn-h);
              box-shadow: 0 6px 14px rgba(243, 112, 33, 0.26);
          }
            .lec-primary:hover:not(:disabled) { background: #f37021; border-color:#f37021; transform: translateY(-1px); box-shadow: 0 10px 18px rgba(243, 112, 33, 0.28); }
            .lec-primary:disabled {
              background: #f8fafc;
              border-color: #cbd5e1;
              color: #64748b;
              box-shadow: none;
              cursor: not-allowed;
            }
            .lec-accent {
              border: 1px solid #cbd5e1;
              border-radius: 12px;
              background: #ffffff;
              color: #0f172a;
              padding: 0 16px;
              font-weight: 600;
              min-height: var(--lec-btn-h);
              cursor: pointer;
            }
            .lec-accent:hover:not(:disabled) {
              border-color: #cbd5e1;
              background: #ffffff;
              transform: translateY(-1px);
            }
            .lec-accent:disabled {
              border-color: #cbd5e1;
              background: #f8fafc;
              color: #64748b;
              box-shadow: none;
              cursor: not-allowed;
            }
            .lec-ghost {
              border: 1px solid #cbd5e1;
              border-radius: 12px;
              background: #ffffff;
              color: #0f172a;
              padding: 0 14px;
              font-weight: 600;
              min-height: var(--lec-btn-h);
              cursor: pointer;
            }
            .lec-ghost:hover:not(:disabled) {
              border-color: #cbd5e1;
              background: #ffffff;
              transform: translateY(-1px);
            }
            .lec-ghost:disabled {
              border-color: #cbd5e1;
              background: #ffffff;
              color: #0f172a;
              box-shadow: none;
              cursor: not-allowed;
            }
          .lec-soft {
            border: 1px solid #cbd5e1;
            border-radius: 12px;
            background: #ffffff;
            color: #0f172a;
            padding: 0 14px;
            font-weight: 600;
            cursor: pointer;
            font-size: 14px;
            line-height: 1.2;
            min-height: var(--lec-btn-h);
          }
          .lec-soft:hover { background: #ffffff; border-color: #cbd5e1; transform: translateY(-1px); }
          .lecturer-revamp-root textarea {
            line-height: 1.45;
          }
          .lec-primary svg,
          .lec-soft svg {
            width: 14px;
            height: 14px;
            flex: 0 0 14px;
          }
          .lecturer-revamp-root button {
            line-height: 1.15;
          }
          .lecturer-revamp-root .lec-heading {
            font-size: 34px;
            line-height: 1.16;
            font-weight: 700;
            letter-spacing: -0.015em;
          }
          .lecturer-revamp-root .lec-section-title {
            font-size: 30px;
            line-height: 1.16;
            font-weight: 650;
            letter-spacing: -0.01em;
          }
          .lecturer-revamp-root .lec-label {
            font-size: 16px;
            font-weight: 600;
            line-height: 1.35;
            color: #0f172a;
          }
          .lec-tag-live {
            display:inline-flex;
            align-items:center;
            gap:8px;
            border:1px solid #cbd5e1;
            background:#ffffff;
            color:#0f172a;
            border-radius:12px;
            font-size:12px;
            font-weight:600;
            padding:6px 10px;
          }
          .lec-matrix-table {
            width: 100%;
            border-collapse: collapse;
          }
          .lec-matrix-table th,
          .lec-matrix-table td {
            border-bottom: 1px solid #e2e8f0;
            padding: 8px 10px;
            font-size: 13px;
            text-align: left;
            color: #0f172a;
          }
          .lec-matrix-table th {
            font-size: 12px;
            font-weight: 700;
            background: #f8fafc;
            position: sticky;
            top: 0;
            z-index: 1;
          }
          .lec-report-drawer-overlay {
            position: fixed;
            inset: 0;
            border: 0;
            padding: 0;
            background: rgba(15, 23, 42, 0.35);
            cursor: pointer;
            z-index: 48;
          }
          .lec-report-drawer {
            position: fixed;
            top: 0;
            right: 0;
            height: 100vh;
            width: min(480px, 100vw);
            background: #ffffff;
            border-left: 1px solid #cbd5e1;
            box-shadow: -10px 0 30px rgba(15, 23, 42, 0.22);
            z-index: 49;
            display: grid;
            grid-template-rows: auto 1fr;
            animation: lecDrawerIn .24s ease-out;
          }
          @keyframes lecDrawerIn {
            from {
              transform: translateX(100%);
            }
            to {
              transform: translateX(0);
            }
          }
          @media (max-width: 960px) {
            .lecturer-revamp-root {
              border-radius: 0;
            }
            .lecturer-revamp-root .lec-heading {
              font-size: 30px;
            }
            .lecturer-revamp-root .lec-section-title {
              font-size: 26px;
            }
            .lecturer-revamp-root input,
            .lecturer-revamp-root select,
            .lecturer-revamp-root .lec-primary,
            .lecturer-revamp-root .lec-soft,
            .lecturer-revamp-root .lec-ghost,
            .lecturer-revamp-root .lec-accent {
              width: 100%;
            }
          }
        `}
      </style>

      <div className="content">
        <section
          style={{
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
            border: "1px solid #cbd5e1",
            background: "#ffffff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h1 className="lec-heading" style={{ margin: 0, color: "#f37021", display: "flex", alignItems: "center", gap: 10 }}>
            <Gavel size={30} color="#f37021" /> Hội đồng và chấm điểm
          </h1>
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="lec-tag-live" style={{ animation: "none" }}>
              Đợt: {periodDisplay}
            </span>
            {currentPeriod && (
              <span className="lec-tag-live" style={{ animation: "none" }}>
                Trạng thái đợt: {currentPeriod.status}
              </span>
            )}
            <span className="lec-tag-live" style={{ animation: "none" }}>
              Hội đồng: {councilListLocked === true ? "Đã chốt" : councilListLocked === false ? "Đang chờ chốt" : `Chưa xác định (${councilLockStatus})`}
            </span>
            {currentSnapshotError ? (
              <span
                className="lec-tag-live"
                style={{ animation: "none", borderColor: "#fecaca", color: "#991b1b", background: "#fef2f2" }}
              >
                Lỗi dữ liệu đợt: {currentSnapshotError}
              </span>
            ) : (
              <span className="lec-tag-live" style={{ animation: "none" }}>
                Vai trò: {selectedCommittee ? selectedCommittee.roleLabel : "Chưa chọn hội đồng"}
              </span>
            )}
          </div>
          <div style={{ marginTop: 12, border: "1px solid #cbd5e1", borderRadius: 10, padding: 10, background: "#ffffff", fontSize: 13, color: "#0f172a" }}>
            Cập nhật gần nhất: {latestActionTrace?.at ?? "Chưa có"}
          </div>
        </section>

        {currentSnapshotError && (
          <section
            style={{
              ...cardStyle,
              marginBottom: 16,
              borderColor: "#fca5a5",
              background: "#fff7ed",
              color: "#9a3412",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Không thể bootstrap snapshot hiện tại</div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>{currentSnapshotError}</div>
            <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.5 }}>
              Vui lòng làm mới trang sau khi dữ liệu mapping được cập nhật, hoặc liên hệ quản trị viên khi lỗi còn lặp lại.
            </div>
          </section>
        )}

        <section style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
            <div style={{ border: "1px solid #cbd5e1", borderRadius: 14, padding: 12, background: "#ffffff" }}>
              <div className="lec-kicker">Đang họp</div>
              <div className="lec-value" style={{ color: "#0f172a" }}>{committeeStats.live}</div>
            </div>
            <div style={{ border: "1px solid #cbd5e1", borderRadius: 14, padding: 12, background: "#ffffff" }}>
              <div className="lec-kicker">Sắp diễn ra</div>
              <div className="lec-value" style={{ color: "#0f172a" }}>{committeeStats.upcoming}</div>
            </div>
            <div style={{ border: "1px solid #cbd5e1", borderRadius: 14, padding: 12, background: "#ffffff" }}>
              <div className="lec-kicker">Đã khóa</div>
              <div className="lec-value" style={{ color: "#0f172a" }}>{committeeStats.locked}</div>
            </div>
            <div style={{ border: "1px solid #cbd5e1", borderRadius: 14, padding: 12, background: "#ffffff" }}>
              <div className="lec-kicker">Chờ duyệt chỉnh sửa</div>
              <div className="lec-value" style={{ color: "#f37021" }}>{committeeStats.pendingRevision}</div>
            </div>
          </div>
        </section>

        <section style={{ ...cardStyle, marginBottom: 16 }}>
          <div className="lec-control-bar">
            {roleAwarePanels.map((panel) => (
              <button
                key={panel.key}
                type="button"
                className={`lec-pill ${activePanel === panel.key ? "active" : ""}`}
                onClick={() => setActivePanel(panel.key)}
              >
                <span className="pill-icon">{panel.icon}</span>
                {panel.label}
              </button>
            ))}
          </div>
        </section>

        {selectedCommittee && (
          <section style={{ ...cardStyle, marginBottom: 16, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ display: "grid", gap: 4 }}>
                <div className="lec-kicker">Hội đồng đang chọn</div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{selectedCommittee.id}</div>
                <div style={{ fontSize: 13, color: "#0f172a" }}>
                  Vai trò thực thi: <strong>{selectedCommittee.roleLabel}</strong>
                </div>
              </div>
              <button
                type="button"
                className="lec-primary"
                onClick={() => openRoleWorkspace(selectedCommittee)}
                style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                <ArrowRight size={15} /> Vào giao diện theo vai trò
              </button>
            </div>
          </section>
        )}

        {activePanel === "councils" && (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <CalendarClock size={18} color="#0f172a" /> Danh sách hội đồng
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
              {loadingData && <div style={{ color: "#0f172a", fontSize: 13 }}>Đang tải danh sách hội đồng...</div>}
              {committees.map((committee) => (
                <article
                  key={committee.id}
                  style={{
                    border: committee.id === selectedCommitteeId ? "1px solid #cbd5e1" : "1px solid #cbd5e1",
                    background:
                      committee.id === selectedCommitteeId
                        ? "linear-gradient(150deg, #ffffff 0%, #ffffff 100%)"
                        : "#ffffff",
                    borderRadius: 14,
                    padding: 14,
                    textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{committee.id}</div>
                    <span className="lec-tag-live" style={{ padding: "4px 8px", minHeight: "auto" }}>
                      {committee.roleLabel}
                    </span>
                  </div>
                  <div style={{ marginTop: 4, fontSize: 13, color: "#0f172a" }}>
                    <MapPin size={13} style={{ verticalAlign: "text-bottom", marginRight: 4, color: "#0f172a" }} />
                    {committee.room} · {formatSession(committee.session)} · {new Date(committee.date).toLocaleDateString("vi-VN")}
                  </div>
                  <div style={{ marginTop: 2, fontSize: 13, color: "#0f172a" }}>
                    <Clock4 size={13} style={{ verticalAlign: "text-bottom", marginRight: 4, color: "#f37021" }} />
                    Khung giờ: {committee.slot}
                  </div>
                  <div style={{ marginTop: 2, fontSize: 13, color: "#0f172a" }}>
                    <Users2 size={13} style={{ verticalAlign: "text-bottom", marginRight: 4, color: "#0f172a" }} />
                    Số sinh viên: {committee.studentCount}
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      display: "inline-flex",
                      padding: "4px 10px",
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 700,
                      color:
                        committee.status === "Đang họp"
                          ? "#0f172a"
                          : committee.status === "Sắp diễn ra"
                            ? "#f37021"
                            : "#0f172a",
                      background:
                        committee.status === "Đang họp"
                          ? "#ffffff"
                          : committee.status === "Sắp diễn ra"
                            ? "#ffffff"
                            : "#ffffff",
                    }}
                  >
                    {committee.status}
                  </div>
                  <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="lec-ghost"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
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
                      style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                      onClick={() => openRoleWorkspace(committee)}
                    >
                      <ArrowRight size={14} /> Vào giao diện vai trò
                    </button>
                  </div>
                </article>
              ))}
              {!loadingData && committees.length === 0 && (
                <div style={{ color: "#0f172a", fontSize: 13 }}>
                  {waitingCouncilLock
                    ? "Danh sách hội đồng đang chờ chốt (councilListLocked=false). Vui lòng quay lại sau khi hội đồng được khóa."
                    : "Chưa có hội đồng từ API."}
                </div>
              )}
            </div>
          </section>
        )}

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
                width: "min(760px, calc(100vw - 24px))",
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
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                    <Info size={18} color="#0f172a" /> Chi tiết hội đồng {detailCommittee.id}
                  </h3>
                  <div style={{ marginTop: 6, fontSize: 13, color: "#0f172a" }}>
                    Vai trò của bạn: <strong>{detailCommittee.roleLabel}</strong>
                  </div>
                </div>
                <button type="button" className="lec-ghost" onClick={() => setDetailCommitteeId("")}>Đóng</button>
              </div>

              <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 10 }}>
                  <div className="lec-kicker">Mã hội đồng</div>
                  <div style={{ fontWeight: 700 }}>{detailCommittee.id}</div>
                </div>
                <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 10 }}>
                  <div className="lec-kicker">Phòng</div>
                  <div style={{ fontWeight: 700 }}>{detailCommittee.room}</div>
                </div>
                <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 10 }}>
                  <div className="lec-kicker">Phiên và ngày</div>
                  <div style={{ fontWeight: 700 }}>{formatSession(detailCommittee.session)}</div>
                  <div style={{ fontSize: 13, marginTop: 2 }}>{new Date(detailCommittee.date).toLocaleDateString("vi-VN")}</div>
                </div>
                <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 10 }}>
                  <div className="lec-kicker">Khung giờ</div>
                  <div style={{ fontWeight: 700 }}>{detailCommittee.slot}</div>
                </div>
                <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 10 }}>
                  <div className="lec-kicker">Số đề tài/SV</div>
                  <div style={{ fontWeight: 700 }}>{detailCommittee.studentCount}</div>
                </div>
                <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 10 }}>
                  <div className="lec-kicker">Trạng thái</div>
                  <div style={{ fontWeight: 700 }}>{detailCommittee.status}</div>
                </div>
              </div>

              <div style={{ marginTop: 14, border: "1px solid #cbd5e1", borderRadius: 12, padding: 10, background: "#ffffff" }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Quyền nghiệp vụ theo vai trò hiện tại</div>
                <div style={{ display: "grid", gap: 5, fontSize: 13, color: "#0f172a" }}>
                  <div>• Mở phiên chấm: {includesAnyAction(detailCommittee.allowedScoringActions, "OPEN_SESSION", "UC3.1.OPEN") ? "Được phép" : "Không"}</div>
                  <div>• Chấm điểm độc lập: {includesAnyAction(detailCommittee.allowedScoringActions, "SUBMIT", "SUBMIT_SCORE", "UC3.2.SUBMIT") ? "Được phép" : "Không"}</div>
                  <div>• Yêu cầu mở lại điểm: {includesAnyAction(detailCommittee.allowedScoringActions, "REOPEN_REQUEST", "REOPEN_SCORE", "UC3.3.REOPEN") ? "Được phép" : "Không"}</div>
                  <div>• Đóng phiên chấm: {includesAnyAction(detailCommittee.allowedScoringActions, "LOCK_SESSION", "LOCK_SCORE", "UC3.5.LOCK") ? "Được phép" : "Không"}</div>
                  <div>• Nhập biên bản: {includesAnyAction(detailCommittee.allowedMinuteActions, "UPSERT", "UPSERT_MINUTES", "UPDATE_MINUTES", "EDIT_MINUTES") ? "Được phép" : "Không"}</div>
                  <div>• Duyệt hậu bảo vệ revision: {includesAnyAction(detailCommittee.allowedRevisionActions, "APPROVE", "APPROVE_REVISION", "UC4.2.APPROVE") || includesAnyAction(detailCommittee.allowedRevisionActions, "REJECT", "REJECT_REVISION", "UC4.2.REJECT") ? "Được phép" : "Không"}</div>
                </div>
              </div>

              <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="lec-accent" onClick={() => setDetailCommitteeId("")}>Đóng</button>
                <button
                  type="button"
                  className="lec-primary"
                  style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                  onClick={() => {
                    openRoleWorkspace(detailCommittee);
                    setDetailCommitteeId("");
                  }}
                >
                  <ArrowRight size={15} /> Vào giao diện theo vai trò
                </button>
              </div>
            </div>
          </div>
        )}

        {activePanel === "minutes" && (
          <section style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
              <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <ClipboardPen size={18} color="#0f172a" /> Không gian CT/TK - Biên bản hội đồng
              </h2>
              <select value={selectedCommitteeId} onChange={(event) => setSelectedCommitteeId(event.target.value)}>
                {committees.length === 0 && <option value="">Chưa có hội đồng</option>}
                {committees.map((committee) => (
                  <option key={committee.id} value={committee.id}>
                    {committee.id} · {committee.room} · {formatSession(committee.session)}
                  </option>
                ))}
              </select>
            </div>

            <div className="lec-control-bar" style={{ marginBottom: 12 }}>
              {committees.map((committee) => (
                <button
                  key={committee.id}
                  type="button"
                  className={`lec-pill ${selectedCommitteeId === committee.id ? "active" : ""}`}
                  onClick={() => setSelectedCommitteeId(committee.id)}
                >
                  <span className="pill-icon"><Gavel size={13} /></span>
                  {committee.id}
                </button>
              ))}
              {committees.length === 0 && <div style={{ color: "#0f172a", fontSize: 13 }}>Chưa có hội đồng để nhập biên bản.</div>}
            </div>

            {!canEditMinutes && (
              <div style={{ marginBottom: 12, border: "1px solid #fecaca", borderRadius: 10, padding: 10, background: "#fff7ed", color: "#9a3412", fontSize: 13 }}>
                Vai trò hiện tại không có quyền ghi biên bản. Theo nghiệp vụ, chỉ CT hoặc TK được cập nhật biên bản hội đồng.
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
              <div style={{ display: "grid", gap: 12 }}>
                {selectedCommittee ? (
                  <div style={{ padding: 14, border: "1px solid #cbd5e1", borderRadius: 14, background: "linear-gradient(160deg, #ffffff 0%, #ffffff 100%)" }}>
                    <div style={{ fontSize: 12, color: "#0f172a", marginBottom: 4 }}>Hội đồng đang thao tác</div>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>{selectedCommittee.id}</div>
                    <div style={{ marginTop: 8, display: "grid", gap: 6, fontSize: 13, color: "#0f172a" }}>
                      <div>Phòng: {selectedCommittee.room}</div>
                      <div>Phiên: {formatSession(selectedCommittee.session)}</div>
                      <div>Ngày: {new Date(selectedCommittee.date).toLocaleDateString("vi-VN")}</div>
                      <div>Giờ: {selectedCommittee.slot}</div>
                      <div>Assignment: {selectedMatrixRow?.assignmentCode ?? "-"}</div>
                      <div>Số SV: {selectedCommittee.studentCount}</div>
                    </div>
                  </div>
                ) : null}

                <div style={{ padding: 14, border: "1px solid #cbd5e1", borderRadius: 14, background: "#ffffff" }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Mẫu nhập</div>
                  <div style={{ display: "grid", gap: 8, fontSize: 13, color: "#0f172a" }}>
                    <div>• Tóm tắt</div>
                    <div>• Hỏi đáp</div>
                    <div>• Nhận xét</div>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                <label style={{ display: "grid", gap: 6, padding: 12, border: "1px solid #cbd5e1", borderRadius: 14, background: "#ffffff" }}>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>Tóm tắt nội dung</span>
                  <textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={5} />
                </label>
                <label style={{ display: "grid", gap: 6, padding: 12, border: "1px solid #cbd5e1", borderRadius: 14, background: "#ffffff" }}>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>Ý kiến phản biện</span>
                  <textarea value={review} onChange={(event) => setReview(event.target.value)} rows={5} />
                </label>
                <label style={{ display: "grid", gap: 6, padding: 12, border: "1px solid #cbd5e1", borderRadius: 14, background: "#ffffff" }}>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>Câu hỏi</span>
                  <textarea value={questions} onChange={(event) => setQuestions(event.target.value)} rows={5} />
                </label>
                <label style={{ display: "grid", gap: 6, padding: 12, border: "1px solid #cbd5e1", borderRadius: 14, background: "#ffffff" }}>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>Trả lời</span>
                  <textarea value={answers} onChange={(event) => setAnswers(event.target.value)} rows={5} />
                </label>
                <label style={{ display: "grid", gap: 6, padding: 12, border: "1px solid #cbd5e1", borderRadius: 14, background: "#ffffff" }}>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>Điểm mạnh</span>
                  <textarea value={strengths} onChange={(event) => setStrengths(event.target.value)} rows={4} />
                </label>
                <label style={{ display: "grid", gap: 6, padding: 12, border: "1px solid #cbd5e1", borderRadius: 14, background: "#ffffff" }}>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>Điểm yếu</span>
                  <textarea value={weaknesses} onChange={(event) => setWeaknesses(event.target.value)} rows={4} />
                </label>
                <label style={{ display: "grid", gap: 6, padding: 12, border: "1px solid #cbd5e1", borderRadius: 14, background: "#ffffff" }}>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>Kiến nghị</span>
                  <textarea value={recommendations} onChange={(event) => setRecommendations(event.target.value)} rows={4} />
                </label>
              </div>
            </div>

            <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ fontSize: 13, color: "#0f172a" }}>{lastAutoSave ? `Lưu gần nhất · ${lastAutoSave}` : ""}</div>
              <button
                type="button"
                className="lec-primary"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                onClick={async () => {
                  if (!canEditMinutes) {
                    notifyError("Chỉ CT hoặc TK mới được phép lưu biên bản hội đồng.");
                    return;
                  }
                  if (!selectedCommitteeId) {
                    notifyError("Vui lòng chọn hội đồng trước khi lưu biên bản.");
                    return;
                  }
                  const assignmentId = selectedAssignmentId;
                  if (!assignmentId) {
                    notifyError("Vui lòng chọn assignment cho biên bản.");
                    return;
                  }
                  try {
                    const idempotencyKey = createIdempotencyKey(periodIdText || "NA", "lecturer-minutes-save");
                    const response = await lecturerApi.updateCommitteeMinutes(selectedCommitteeNumericId, {
                      assignmentId,
                      summaryContent: summary,
                      reviewerComments: review,
                      qnaDetails: questions,
                      strengths,
                      weaknesses,
                      recommendations,
                    }, idempotencyKey);
                    if (notifyApiFailure(response as ApiResponse<unknown>, "Không lưu được biên bản hội đồng.")) {
                      return;
                    }
                    setLastAutoSave(new Date().toLocaleTimeString("vi-VN"));
                    notifySuccess("Đã lưu biên bản hội đồng.");
                    await hydrateMinutes(selectedCommitteeNumericId, assignmentId);
                  } catch {
                    notifyError("Không lưu được biên bản hội đồng.");
                  }
                }}
                disabled={!canEditMinutes}
              >
                <Save size={15} /> Lưu bản nháp biên bản
              </button>
            </div>
          </section>
        )}

        {activePanel === "grading" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            <section style={cardStyle}>
              <h2 className="lec-section-title" style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <Star size={18} color="#0f172a" /> Chấm điểm
              </h2>
                <label style={{ display: "grid", gap: 6 }}>
                  <span className="lec-label">Điểm của tôi (0.0 - 10.0)</span>
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  max={10}
                  value={myScore}
                  onChange={(event) => setMyScore(event.target.value)}
                  disabled={submitted || isCurrentSessionLocked || !isSessionOpened}
                />
              </label>
              {!isScoreValid && <div style={{ color: "#0f172a", marginTop: 6 }}>Điểm phải nằm trong khoảng 0 đến 10.</div>}

              <label style={{ display: "grid", gap: 6, marginTop: 8 }}>
                <span className="lec-label">Nhận xét</span>
                <textarea
                  rows={4}
                  value={myComment}
                  onChange={(event) => setMyComment(event.target.value)}
                  disabled={submitted || isCurrentSessionLocked || !isSessionOpened}
                />
              </label>

              <label style={{ display: "grid", gap: 6, marginTop: 8 }}>
                <span className="lec-label">Assignment</span>
                <select
                  value={selectedAssignmentId || ""}
                  onChange={(event) => setSelectedAssignmentId(Number(event.target.value) || 0)}
                  disabled={scoringMatrix.length === 0 || isCurrentSessionLocked || !isSessionOpened}
                >
                  {scoringMatrix.length === 0 && <option value="">Chưa có assignment từ scoring/matrix</option>}
                  {scoringMatrix.map((row) => (
                    <option key={row.assignmentId} value={row.assignmentId}>
                      {row.assignmentCode} · {row.studentCode} · {row.studentName}
                    </option>
                  ))}
                </select>
              </label>

              <div style={{ marginTop: 12, border: "1px solid #cbd5e1", borderRadius: 12, overflow: "hidden", background: "#ffffff" }}>
                <div style={{ padding: 10, borderBottom: "1px solid #e2e8f0", fontWeight: 700, fontSize: 13 }}>
                  Danh sách assignment theo sinh viên
                </div>
                <div style={{ maxHeight: 270, overflowY: "auto", overflowX: "auto" }}>
                  <table className="lec-matrix-table">
                    <thead>
                      <tr>
                        <th>Assignment</th>
                        <th>Sinh viên</th>
                        <th>Nộp điểm</th>
                        <th>Điểm tổng</th>
                        <th>Báo cáo</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scoringMatrix.map((row) => {
                        const isActiveRow = row.assignmentId === selectedAssignmentId;
                        return (
                          <tr
                            key={row.assignmentId}
                            onClick={() => setSelectedAssignmentId(row.assignmentId)}
                            style={{
                              background: isActiveRow ? "#fff7ed" : "#ffffff",
                              cursor: "pointer",
                            }}
                          >
                            <td style={{ fontWeight: 700 }}>{row.assignmentCode}</td>
                            <td>
                              {row.studentCode} · {row.studentName}
                            </td>
                            <td>
                              {row.submittedCount}/{row.requiredCount}
                            </td>
                            <td>{row.finalScore ?? "-"}</td>
                            <td>
                              {row.defenseDocuments.length > 0
                                ? `${row.defenseDocuments.length} tệp`
                                : "Chưa có"}
                            </td>
                            <td>
                              <button
                                type="button"
                                className="lec-soft"
                                style={{ minHeight: 34, padding: "0 10px", display: "inline-flex", alignItems: "center", gap: 6 }}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openReportDrawer(row);
                                }}
                                disabled={row.defenseDocuments.length === 0}
                              >
                                <PanelRightOpen size={14} /> Xem báo cáo
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {scoringMatrix.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ color: "#64748b" }}>
                            Chưa có dữ liệu assignment trong scoring matrix.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="lec-primary"
                  onClick={handleSubmitScore}
                  disabled={!canSubmitScore || !isSessionOpened || isCurrentSessionLocked || !isScoreValid || submitted}
                >
                  Gửi điểm
                </button>
                <button
                  type="button"
                  className="lec-soft"
                  disabled={!canRequestReopen || !isSessionOpened || isCurrentSessionLocked}
                  onClick={async () => {
                    if (!canRequestReopen) {
                      notifyError("Chỉ CT mới được yêu cầu mở lại điểm.");
                      return;
                    }
                    if (!isSessionOpened) {
                      notifyError("Phiên chấm chưa mở. Vui lòng mở phiên trước khi yêu cầu mở lại điểm.");
                      return;
                    }
                    if (isCurrentSessionLocked) {
                      notifyError("Phiên chấm đã đóng, không thể yêu cầu mở lại từ màn hình này.");
                      return;
                    }
                    try {
                      const idempotencyKey = createIdempotencyKey(periodIdText || "NA", "lecturer-score-reopen");
                      const assignmentId = selectedAssignmentId;
                      if (!assignmentId) {
                        notifyError("Vui lòng chọn assignment cần mở lại biểu mẫu.");
                        return;
                      }
                      const response = await lecturerApi.reopenRequestByCommittee(selectedCommitteeNumericId, {
                        assignmentId,
                        reason: reopenReason.trim() || "Yêu cầu mở lại biểu mẫu",
                      }, idempotencyKey);
                      if (notifyApiFailure(response as ApiResponse<unknown>, "Không yêu cầu mở lại biểu mẫu được.")) {
                        return;
                      }
                      setChairRequestedReopen(true);
                      setSubmitted(false);
                      pushTrace("reopen-score", "[UC3.4] Chair yêu cầu mở lại biểu mẫu.");
                      setAssignmentConcurrencyToken(createConcurrencyToken("lecturer-assignment"));
                      await refreshScoringData(selectedCommitteeNumericId);
                      if (response?.idempotencyReplay ?? response?.IdempotencyReplay) {
                        notifyInfo("Yêu cầu mở lại biểu mẫu đã tồn tại (idempotency replay).");
                      } else {
                        notifyInfo("Đã yêu cầu mở lại biểu mẫu chấm điểm.");
                      }
                    } catch {
                      notifyError("Không yêu cầu mở lại biểu mẫu được. Vui lòng thử lại.");
                    }
                  }}
                >
                  <MessageSquareText size={14} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />
                  Yêu cầu mở lại biểu mẫu
                </button>
              </div>
              {!canRequestReopen && <div style={{ marginTop: 8, color: "#f37021" }}>Chỉ CT mới được quyền yêu cầu mở lại biểu mẫu điểm.</div>}
              {!isSessionOpened && !isCurrentSessionLocked && (
                <div style={{ marginTop: 8, color: "#f37021" }}>
                  Phiên chấm chưa mở. CT cần thao tác Mở phiên trước khi các thành viên gửi điểm.
                </div>
              )}

              {submitted && <div style={{ marginTop: 8, color: "#0f172a" }}>Đã gửi điểm và khóa biểu mẫu cá nhân.</div>}
              {chairRequestedReopen && <div style={{ marginTop: 8, color: "#f37021" }}>Biểu mẫu đã mở lại theo yêu cầu Chủ tịch.</div>}

              <div style={{ marginTop: 12, border: "1px solid #cbd5e1", borderRadius: 12, padding: 10, background: "#ffffff" }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Chuẩn chấm điểm bắt buộc</div>
                <div style={{ display: "grid", gap: 5, fontSize: 13, color: "#0f172a" }}>
                  <div>• Điểm hợp lệ trong khoảng 0 đến 10 cho từng assignment.</div>
                  <div>• Thành viên hội đồng chấm độc lập; không dùng bảng điểm chung.</div>
                  <div>• Nếu assignment đã lock thì không được sửa điểm.</div>
                  <div>• Khi chênh lệch điểm vượt ngưỡng, hệ thống cảnh báo và cần CT xử lý reopen theo lý do.</div>
                </div>
              </div>
            </section>

            <section style={cardStyle}>
              <h2 className="lec-section-title" style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldCheck size={18} color="#0f172a" /> Cảnh báo và chốt ca
              </h2>

              <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 10, marginBottom: 10 }}>
                <div style={{ fontWeight: 700 }}>Cảnh báo điểm lệch</div>
                <div style={{ marginTop: 6, fontSize: 14 }}>
                  Phương sai: <strong>{scoringOverview.variance ?? "-"}</strong> · Ngưỡng: {scoringOverview.varianceThreshold ?? "-"}
                </div>
                {hasVarianceAlert ? (
                  <div style={{ marginTop: 6, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                    <ShieldAlert size={16} /> Điểm lệch vượt ngưỡng, cần thảo luận lại.
                  </div>
                ) : (
                  <div style={{ marginTop: 6, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                    <CheckCircle2 size={16} /> Điểm trong ngưỡng an toàn.
                  </div>
                )}
              </div>

              <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 10, marginBottom: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 28, lineHeight: 1.16 }}>Tính điểm tổng hợp</div>
                <div style={{ color: "#0f172a", fontSize: 13 }}>
                  Dữ liệu điểm tổng hợp được lấy trực tiếp từ backend.
                </div>
                <div style={{ marginTop: 8, fontSize: 13 }}>
                  Điểm tổng: <strong>{scoringOverview.finalScore ?? "-"}</strong> · Điểm chữ: <strong>{scoringOverview.finalLetter ?? "-"}</strong>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="lec-soft"
                  style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                  onClick={async () => {
                    if (!canOpenSession) {
                      notifyError("Chỉ CT mới được quyền mở phiên chấm.");
                      return;
                    }
                    if (isSessionOpened) {
                      notifyInfo("Phiên chấm hiện đang mở.");
                      return;
                    }
                    if (isSessionClosed) {
                      notifyError("Phiên chấm đã đóng, không thể mở lại bằng thao tác mở phiên.");
                      return;
                    }
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
                      pushTrace("open-session", "[UC3.1] CT đã mở phiên chấm.");
                      setAssignmentConcurrencyToken(createConcurrencyToken("lecturer-assignment"));
                      await refreshScoringData(selectedCommitteeNumericId);
                      if (response?.idempotencyReplay ?? response?.IdempotencyReplay) {
                        notifyInfo("Yêu cầu mở phiên đã được xử lý trước đó (idempotency replay).");
                      } else {
                        notifySuccess("Đã mở phiên chấm thành công.");
                      }
                    } catch {
                      notifyError("Mở phiên chấm thất bại. Vui lòng thử lại.");
                    }
                  }}
                  disabled={!canOpenSession || isSessionOpened || isSessionClosed}
                >
                  <CalendarClock size={15} /> {isSessionOpened ? "Phiên đã mở" : "Mở phiên chấm"}
                </button>

                <button
                  type="button"
                  className="lec-primary"
                  style={{
                    background: isCurrentSessionLocked ? "#f8fafc" : "#f37021",
                    color: isCurrentSessionLocked ? "#64748b" : "#ffffff",
                    border: isCurrentSessionLocked ? "1px solid #cbd5e1" : "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                  onClick={async () => {
                    if (!canLockSession) {
                      notifyError("Chỉ CT mới có quyền đóng phiên chấm.");
                      return;
                    }
                    if (!isSessionOpened) {
                      notifyError("Phiên chấm chưa mở, không thể đóng phiên.");
                      return;
                    }
                    if (isCurrentSessionLocked) {
                      notifyInfo("Phiên chấm đã được đóng trước đó.");
                      return;
                    }
                    try {
                      const idempotencyKey = createIdempotencyKey(periodIdText || "NA", "lecturer-score-lock");
                      const response = await lecturerApi.lockSessionByCommittee(selectedCommitteeNumericId, idempotencyKey);
                      if (notifyApiFailure(response as ApiResponse<unknown>, "Khóa phiên chấm thất bại.")) {
                        return;
                      }
                      setSessionLocked(true);
                      setCommittees((prev) =>
                        prev.map((item) =>
                          item.id === selectedCommitteeId ? { ...item, status: "Đã khóa" } : item,
                        ),
                      );
                      pushTrace("lock-session", "[UC3.5] CT đã đóng phiên chấm.");
                      setAssignmentConcurrencyToken(createConcurrencyToken("lecturer-assignment"));
                      await refreshScoringData(selectedCommitteeNumericId);
                      if (response?.idempotencyReplay ?? response?.IdempotencyReplay) {
                        notifyInfo("Yêu cầu khóa phiên đã được xử lý trước đó (idempotency replay).");
                      } else {
                        notifySuccess("Đã đóng phiên chấm thành công.");
                      }
                    } catch (error) {
                      const missingMembers = extractMissingMemberCodes(error);
                      if (missingMembers.length) {
                        notifyError(`Thiếu điểm từ thành viên: ${missingMembers.join(", ")}`);
                        return;
                      }
                      notifyError("Khóa phiên chấm thất bại. Vui lòng thử lại.");
                    }
                  }}
                  disabled={isCurrentSessionLocked || !isSessionOpened || !canLockSession}
                >
                  <Lock size={15} /> {isCurrentSessionLocked ? "Phiên đã đóng" : "Đóng phiên chấm"}
                </button>
              </div>
              {!canOpenSession && <div style={{ marginTop: 8, color: "#f37021" }}>Chỉ CT mới có quyền mở phiên chấm.</div>}
              {!canLockSession && <div style={{ marginTop: 8, color: "#f37021" }}>Chỉ CT mới có quyền đóng phiên chấm.</div>}
              {!isSessionOpened && !isCurrentSessionLocked && canLockSession && (
                <div style={{ marginTop: 8, color: "#f37021" }}>Cần mở phiên chấm trước khi đóng phiên.</div>
              )}
            </section>
          </div>
        )}

        {activePanel === "revision" && (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <FileCheck2 size={18} color="#0f172a" /> Duyệt bản chỉnh sửa
            </h2>

            <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 12 }}>
              <div style={{ fontWeight: 700 }}>
                {revision.studentCode} · {revision.topicTitle}
              </div>
              <div style={{ marginTop: 6, color: "#0f172a", fontSize: 13 }}>
                Mở tệp PDF, đọc nhận xét và đưa ra quyết định duyệt.
              </div>
              <div style={{ marginTop: 6, color: "#0f172a", fontSize: 12 }}>
                Assignment: {revision.assignmentId ?? "-"}
                {revision.lastUpdated ? ` · Cập nhật: ${new Date(revision.lastUpdated).toLocaleString("vi-VN")}` : ""}
              </div>
              {revision.revisionFileUrl && (
                <a
                  href={normalizeUrl(revision.revisionFileUrl)}
                  target="_blank"
                  rel="noreferrer"
                  style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 6, color: "#0f172a", fontSize: 13 }}
                >
                  <ExternalLink size={13} /> Mở tệp chỉnh sửa
                </a>
              )}

              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="lec-soft"
                  disabled={!canApproveRevision}
                  style={{ borderColor: "#0f172a", color: "#0f172a", background: "#ffffff", display: "inline-flex", alignItems: "center", gap: 6 }}
                  onClick={async () => {
                    if (!canApproveRevision) {
                      notifyError("Chỉ CT hoặc TK mới được duyệt bản chỉnh sửa hậu bảo vệ.");
                      return;
                    }
                    try {
                      const revisionId = revision.revisionId || revision.assignmentId || 0;
                      if (!revisionId) {
                        notifyError("Không tìm thấy mã revision để duyệt.");
                        return;
                      }
                      const idempotencyKey = createIdempotencyKey(periodIdText || "NA", "lecturer-approve-revision");
                      const response = await lecturerApi.approveRevision(revisionId, idempotencyKey);
                      if (notifyApiFailure(response as ApiResponse<unknown>, "Không duyệt được bản chỉnh sửa.")) {
                        return;
                      }
                      await refreshRevisionQueue();
                      pushTrace("approve-revision", "[UC4.2] Duyệt bản chỉnh sửa.");
                      setAssignmentConcurrencyToken(createConcurrencyToken("lecturer-assignment"));
                      if (response?.idempotencyReplay ?? response?.IdempotencyReplay) {
                        notifyInfo("Yêu cầu duyệt đã được xử lý trước đó (idempotency replay).");
                      } else {
                        notifySuccess("Đã duyệt bản chỉnh sửa.");
                      }
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
                  disabled={!canRejectRevision}
                  style={{ borderColor: "#fecaca", color: "#b91c1c", background: "#ffffff", display: "inline-flex", alignItems: "center", gap: 6 }}
                  onClick={async () => {
                    if (!canRejectRevision) {
                      notifyError("Chỉ CT hoặc TK mới được từ chối bản chỉnh sửa hậu bảo vệ.");
                      return;
                    }
                    if (!reopenReason.trim()) {
                      notifyError(ucError("UC4.2-REJECT_REASON_REQUIRED"));
                      return;
                    }
                    try {
                      const revisionId = revision.revisionId || revision.assignmentId || 0;
                      if (!revisionId) {
                        notifyError("Không tìm thấy mã revision để từ chối.");
                        return;
                      }
                      const idempotencyKey = createIdempotencyKey(periodIdText || "NA", "lecturer-reject-revision");
                      const response = await lecturerApi.rejectRevision(revisionId, reopenReason.trim(), idempotencyKey);
                      if (notifyApiFailure(response as ApiResponse<unknown>, "Không từ chối được bản chỉnh sửa.")) {
                        return;
                      }
                      await refreshRevisionQueue();
                      pushTrace("reject-revision", "[UC4.2] Từ chối bản chỉnh sửa có lý do.");
                      setAssignmentConcurrencyToken(createConcurrencyToken("lecturer-assignment"));
                      if (response?.idempotencyReplay ?? response?.IdempotencyReplay) {
                        notifyInfo("Yêu cầu từ chối đã được xử lý trước đó (idempotency replay).");
                      } else {
                        notifyInfo("Đã từ chối bản chỉnh sửa kèm lý do.");
                      }
                    } catch {
                      notifyError("Không từ chối được bản chỉnh sửa.");
                    }
                  }}
                >
                  <XCircle size={14} /> Từ chối
                </button>
              </div>
              <label style={{ display: "grid", gap: 6, marginTop: 8 }}>
                <span style={{ fontSize: 12, color: "#0f172a" }}>Lý do reject (bắt buộc theo UC)</span>
                <textarea value={reopenReason} onChange={(event) => setReopenReason(event.target.value)} rows={3} />
              </label>

              <div style={{ marginTop: 8, color: revision.status === "approved" ? "#0f172a" : revision.status === "rejected" ? "#0f172a" : "#0f172a" }}>
                Trạng thái hiện tại: {revision.status}
              </div>
              {revision.reason && <div style={{ marginTop: 4, color: "#0f172a", fontSize: 13 }}>Lý do: {revision.reason}</div>}
            </div>

            <div style={{ marginTop: 12, border: "1px solid #cbd5e1", borderRadius: 12, padding: 10 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Hàng chờ duyệt</div>
              {revisionQueue.map((item) => (
                <div key={`revision-queue-${item.revisionId}-${item.assignmentId ?? "na"}`} style={{ fontSize: 12, marginBottom: 7 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span>{item.studentCode} · {item.topicTitle}</span>
                    <span style={{ color: item.status === "approved" ? "#0f172a" : item.status === "rejected" ? "#0f172a" : "#f37021" }}>
                      {item.status}
                    </span>
                  </div>
                  <div style={{ color: "#0f172a" }}>
                    Assignment: {item.assignmentId ?? "-"}
                    {item.lastUpdated ? ` · Cập nhật: ${new Date(item.lastUpdated).toLocaleString("vi-VN")}` : ""}
                  </div>
                  {item.revisionFileUrl && (
                    <a
                      href={normalizeUrl(item.revisionFileUrl)}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#0f172a" }}
                    >
                      <ExternalLink size={12} /> Tệp chỉnh sửa
                    </a>
                  )}
                  {item.reason && <div style={{ color: "#0f172a" }}>Lý do từ chối: {item.reason}</div>}
                </div>
              ))}
              {revisionQueue.length === 0 && <div style={{ fontSize: 12, color: "#0f172a" }}>Không có bản chỉnh sửa chờ duyệt.</div>}
            </div>
          </section>
        )}
      </div>

      {reportDrawerRow && (
        <>
          <button
            type="button"
            className="lec-report-drawer-overlay"
            onClick={() => setReportDrawerAssignmentId(null)}
            aria-label="Đóng panel báo cáo"
          />
          <aside className="lec-report-drawer" role="dialog" aria-modal="true" aria-label="Báo cáo assignment">
            <div style={{ padding: 14, borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Hồ sơ báo cáo assignment</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>{reportDrawerRow.assignmentCode}</div>
                <div style={{ marginTop: 4, fontSize: 13, color: "#334155" }}>
                  {reportDrawerRow.studentCode} · {reportDrawerRow.studentName}
                </div>
              </div>
              <button
                type="button"
                className="lec-soft"
                style={{ minHeight: 34, padding: "0 10px" }}
                onClick={() => setReportDrawerAssignmentId(null)}
              >
                Đóng
              </button>
            </div>

            <div style={{ padding: 14, overflowY: "auto", display: "grid", gap: 10 }}>
              {reportDrawerRow.defenseDocuments.map((documentItem) => (
                <article
                  key={`${reportDrawerRow.assignmentId}-${documentItem.documentId}`}
                  style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 12, background: "#ffffff", display: "grid", gap: 8 }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <FileText size={16} color="#f37021" style={{ marginTop: 2 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: "#0f172a", wordBreak: "break-word" }}>{documentItem.fileName}</div>
                      <div style={{ marginTop: 2, fontSize: 12, color: "#64748b" }}>
                        {documentItem.mimeType ?? "Tệp báo cáo"}
                        {documentItem.uploadedAt
                          ? ` · Tải lên ${new Date(documentItem.uploadedAt).toLocaleString("vi-VN")}`
                          : ""}
                      </div>
                    </div>
                  </div>

                  {documentItem.fileUrl ? (
                    <a
                      href={documentItem.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="lec-primary"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "center", textDecoration: "none", minHeight: 36 }}
                    >
                      <ExternalLink size={14} /> Mở báo cáo
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="lec-soft"
                      style={{ minHeight: 36 }}
                      disabled
                    >
                      Chưa có đường dẫn tải tệp
                    </button>
                  )}
                </article>
              ))}
            </div>
          </aside>
        </>
      )}
    </div>
  );
};

export default LecturerCommittees;
