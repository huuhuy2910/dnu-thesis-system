import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Archive,
  BarChart3,
  CheckCircle2,
  Download,
  Eye,
  FileSpreadsheet,
  Gavel,
  Pencil,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  Unlock,
} from "lucide-react";
// `useNavigate` removed (not needed after module button removal)
import { useToast } from "../../context/useToast";
import { FetchDataError, fetchData } from "../../api/fetchData";
import type { ApiResponse } from "../../types/api";
import {
  readEnvelopeAllowedActions,
  readEnvelopeData,
  readEnvelopeErrorMessages,
  readEnvelopeMessage,
  readEnvelopeSuccess,
  readEnvelopeWarningMessages,
} from "../../utils/api-envelope";
import {
  extractDefensePeriodId,
  getActiveDefensePeriodId,
  normalizeDefensePeriodId,
  setActiveDefensePeriodId,
} from "../../utils/defensePeriod";
import { useSearchParams } from "react-router-dom";

type RevisionStatus = "all" | "pending" | "approved" | "rejected";
type LifecycleAction = "PUBLISH" | "ROLLBACK" | "ARCHIVE" | "REOPEN";
type ReportType = "council-summary" | "form-1" | "final-term" | "sync-errors";
type ReportFormat = "csv";
type OperationsPanelKey =
  | "snapshot"
  | "lifecycle"
  | "scoring"
  | "post-defense"
  | "audit-report";

type PipelineOverview = {
  defenseTermId?: number;
  overallCompletionPercent?: number;
  totalTopics?: number;
  eligibleTopics?: number;
  assignedTopics?: number;
  scoredTopics?: number;
  pendingRevisionCount?: number;
  approvedRevisionCount?: number;
  rejectedRevisionCount?: number;
};

type AnalyticsOverview = {
  totalStudents?: number;
  average?: number;
  passRate?: number;
};

type DistributionOverview = {
  excellent?: number;
  good?: number;
  fair?: number;
  weak?: number;
};

type MonitoringSnapshot = {
  pipeline?: PipelineOverview;
  analytics?: {
    overview?: AnalyticsOverview;
    byCouncil?: Array<Record<string, unknown>>;
    distribution?: DistributionOverview;
  };
  scoring?: {
    progress?: Array<Record<string, unknown>>;
    alerts?: Array<Record<string, unknown>>;
  };
  tags?: Record<string, unknown>;
};

type ScoringMatrixRow = {
  committeeId?: number;
  committeeCode?: string;
  assignmentId?: number;
  assignmentCode?: string;
  topicCode?: string;
  topicTitle?: string;
  studentCode?: string;
  studentName?: string;
  submittedCount?: number;
  requiredCount?: number;
  isLocked?: boolean;
  finalScore?: number;
  finalGrade?: string;
  variance?: number;
  status?: string;
};

type PostDefenseItem = {
  revisionId?: number;
  assignmentId?: number;
  committeeCode?: string;
  studentCode?: string;
  studentName?: string;
  topicCode?: string;
  topicTitle?: string;
  status?: string;
  submittedAt?: string;
  reviewedAt?: string;
  note?: string;
};

type PostDefenseOverview = {
  defenseTermId?: number;
  totalRevisions?: number;
  pendingRevisions?: number;
  approvedRevisions?: number;
  rejectedRevisions?: number;
  publishedScores?: number;
  lockedScores?: number;
  items?: PostDefenseItem[];
};

type AuditOverview = {
  syncHistory?: Array<Record<string, unknown>>;
  publishHistory?: Array<Record<string, unknown>>;
  councilAuditHistory?: Array<Record<string, unknown>>;
  revisionAuditTrail?: Array<Record<string, unknown>>;
};

type ReportingOverview = {
  supportedReportTypes?: string[];
  defaultFormat?: string;
};

type OperationsSnapshotData = {
  monitoring?: MonitoringSnapshot;
  scoringMatrix?: ScoringMatrixRow[];
  progressTracking?: Record<string, unknown>;
  postDefense?: PostDefenseOverview;
  audit?: AuditOverview;
  reporting?: ReportingOverview;
};

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: 18,
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

const selectControlStyle: React.CSSProperties = {
  minHeight: 40,
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "0 34px 0 12px",
  backgroundColor: "#ffffff",
  color: "#0f172a",
  fontSize: 13,
  fontWeight: 500,
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
  backgroundImage:
    "linear-gradient(45deg, transparent 50%, #94a3b8 50%), linear-gradient(135deg, #94a3b8 50%, transparent 50%)",
  backgroundPosition:
    "calc(100% - 18px) calc(50% - 2px), calc(100% - 13px) calc(50% - 2px)",
  backgroundSize: "5px 5px, 5px 5px",
  backgroundRepeat: "no-repeat",
};

const tableHeadCellStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  borderBottom: "1px solid #e2e8f0",
  color: "#0f172a",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.02em",
  background: "#ffffff",
};

const tableCellStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderTop: "1px solid #e2e8f0",
  color: "#0f172a",
};

const actionIconButtonStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const dangerActionIconButtonStyle: React.CSSProperties = {
  ...actionIconButtonStyle,
  border: "1px solid #fecaca",
  color: "#ef4444",
};

const emptyStateCardStyle: React.CSSProperties = {
  ...cardStyle,
  borderStyle: "dashed",
  display: "grid",
  placeItems: "center",
  minHeight: 130,
  color: "#64748b",
  fontSize: 14,
  fontWeight: 600,
};

const panelTabs: Array<{
  key: OperationsPanelKey;
  label: string;
  icon: React.ReactNode;
}> = [
  { key: "snapshot", label: "Tổng quan", icon: <Search size={15} /> },
  { key: "lifecycle", label: "Vòng đời", icon: <Activity size={15} /> },
  { key: "scoring", label: "Chấm điểm", icon: <BarChart3 size={15} /> },
  {
    key: "post-defense",
    label: "Hậu bảo vệ",
    icon: <FileSpreadsheet size={15} />,
  },
  {
    key: "audit-report",
    label: "Kiểm toán & báo cáo",
    icon: <Download size={15} />,
  },
];

type ToneStyle = {
  bg: string;
  border: string;
  text: string;
};

const normalizeStatusKey = (value: string | null | undefined) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

const statusToneMap: Record<string, ToneStyle> = {
  APPROVED: { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534" },
  PENDING: { bg: "#fffbeb", border: "#fde68a", text: "#92400e" },
  REJECTED: { bg: "#fef2f2", border: "#fecaca", text: "#991b1b" },
  LOCKED: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
  IN_PROGRESS: { bg: "#fff7ed", border: "#fed7aa", text: "#c2410c" },
  DRAFT: { bg: "#f8fafc", border: "#cbd5e1", text: "#475569" },
  READY: { bg: "#111827", border: "#111827", text: "#ffffff" },
  FINALIZED: { bg: "#fff7ed", border: "#fed7aa", text: "#c2410c" },
  PUBLISHED: { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534" },
  ARCHIVED: { bg: "#f8fafc", border: "#cbd5e1", text: "#475569" },
  WARNING: { bg: "#fffbeb", border: "#fde68a", text: "#92400e" },
};

const statusLabelMap: Record<string, string> = {
  APPROVED: "Đã duyệt",
  PENDING: "Chờ xử lý",
  REJECTED: "Từ chối",
  LOCKED: "Đã khóa",
  IN_PROGRESS: "Đang xử lý",
  DRAFT: "Nháp",
  READY: "Ready",
  FINALIZED: "Đã chốt",
  PUBLISHED: "Đã công bố",
  ARCHIVED: "Đã lưu trữ",
  WARNING: "Cảnh báo",
};

const getStatusTone = (value: string | null | undefined): ToneStyle => {
  const normalized = normalizeStatusKey(value);
  return statusToneMap[normalized] ?? statusToneMap.DRAFT;
};

const getStatusLabel = (value: string | null | undefined) => {
  const normalized = normalizeStatusKey(value);
  return statusLabelMap[normalized] ?? (String(value ?? "-").trim() || "-");
};

const reportTypeOptions: Array<{ value: ReportType; label: string; description: string }> = [
  {
    value: "council-summary",
    label: "Tổng hợp hội đồng",
    description: "Danh sách hội đồng, phòng, trạng thái và tiến độ tổng hợp.",
  },
  {
    value: "form-1",
    label: "Form-1",
    description: "Xuất theo một hội đồng cụ thể khi cần kiểm tra chi tiết.",
  },
  {
    value: "final-term",
    label: "Kết quả cuối kỳ",
    description: "Bộ dữ liệu kết quả, điểm và trạng thái sau chốt.",
  },
  {
    value: "sync-errors",
    label: "Lỗi đồng bộ",
    description: "Danh sách các bản ghi cần rà soát hoặc đồng bộ lại.",
  },
];

const distributionPalette: Record<string, string> = {
  "Xuất sắc": "#16a34a",
  "Khá": "#0ea5e9",
  "Đạt": "#f59e0b",
  "Cần cải thiện": "#ef4444",
};

const CommitteeOperationsManagement: React.FC = () => {
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const queryPeriodId = normalizeDefensePeriodId(searchParams.get("periodId"));
  const [periodId, setPeriodId] = useState<number | null>(
    () => queryPeriodId ?? getActiveDefensePeriodId(),
  );
  const defensePeriodBase = periodId ? `/defense-periods/${periodId}` : "";
  const missingPeriodWarningRef = useRef(false);

  const [snapshot, setSnapshot] = useState<OperationsSnapshotData | null>(null);
  const [loadingSnapshot, setLoadingSnapshot] = useState(false);
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);
  const [backendAllowedActions, setBackendAllowedActions] = useState<string[]>(
    [],
  );
  const [lastLoadedAt, setLastLoadedAt] = useState<string>("");

  const [committeeIdFilter, setCommitteeIdFilter] = useState("");
  const [revisionStatus, setRevisionStatus] = useState<RevisionStatus>("all");
  const [revisionKeyword, setRevisionKeyword] = useState("");
  const [revisionPage, setRevisionPage] = useState(1);
  const [revisionSize, setRevisionSize] = useState(20);
  const [auditSize, setAuditSize] = useState(50);

  const [reportType, setReportType] = useState<ReportType>("council-summary");
  const [reportFormat, setReportFormat] = useState<ReportFormat>("csv");
  const [reportCouncilId, setReportCouncilId] = useState("");
  const [activePanel, setActivePanel] =
    useState<OperationsPanelKey>("snapshot");

  const isNoDataMessage = (message: string) => {
    const normalized = message
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    return (
      normalized.includes("khong co du lieu") ||
      normalized.includes("chua co du lieu") ||
      normalized.includes("no data") ||
      normalized.includes("not found") ||
      normalized.includes("khong tim thay")
    );
  };

  const isNoDataEnvelope = (response: ApiResponse<unknown> | null | undefined) => {
    const status = Number(response?.httpStatusCode ?? response?.HttpStatusCode ?? 0);
    const message = String(readEnvelopeMessage(response) ?? "");
    return status === 204 || status === 404 || isNoDataMessage(message);
  };

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

  useEffect(() => {
    if (queryPeriodId && queryPeriodId !== periodId) {
      setPeriodId(queryPeriodId);
    }
  }, [periodId, queryPeriodId]);

  useEffect(() => {
    setActiveDefensePeriodId(periodId);
  }, [periodId]);

  useEffect(() => {
    if (periodId != null) {
      return;
    }

    let cancelled = false;

    const resolvePeriod = async () => {
      try {
        const response = await fetchData<ApiResponse<unknown>>("/defense-periods", {
          method: "GET",
        });
        const payload = readEnvelopeData<unknown>(response);
        const fallbackPeriodId = extractDefensePeriodId(payload);
        if (!cancelled && fallbackPeriodId != null) {
          setPeriodId(fallbackPeriodId);
          setActiveDefensePeriodId(fallbackPeriodId);
        }
      } catch {
        // Keep explicit warning state when no period can be resolved.
      }
    };

    void resolvePeriod();

    return () => {
      cancelled = true;
    };
  }, [periodId]);

  const buildIdempotencyKey = (prefix: string) =>
    `${prefix}-${periodId ?? "NA"}-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

  const parseEnvelope = useCallback(
    <T,>(
      response: ApiResponse<T> | null | undefined,
      fallback: string,
      options?: { silentNoData?: boolean },
    ) => {
      if (!response) {
        notifyError(fallback);
        return { ok: false, data: null as T | null };
      }

      const allowedActions = readEnvelopeAllowedActions(response);
      if (allowedActions.length > 0) {
        setBackendAllowedActions(allowedActions);
      }

      const warningMessages = readEnvelopeWarningMessages(response);
      if (warningMessages.length > 0) {
        notifyWarning(warningMessages.join(" | "));
      }

      const success = readEnvelopeSuccess(response);
      const message = readEnvelopeMessage(response);
      if (!success) {
        if (options?.silentNoData && isNoDataEnvelope(response)) {
          return { ok: true, data: null as T | null };
        }
        const errors = readEnvelopeErrorMessages(response);
        notifyError(errors[0] || message || fallback);
        return { ok: false, data: null as T | null };
      }

      if (message) {
        notifyInfo(message);
      }

      return {
        ok: true,
        data: readEnvelopeData<T>(response),
      };
    },
    [notifyError, notifyInfo, notifyWarning],
  );

  const hasAllowedAction = (...actions: string[]) =>
    backendAllowedActions.length === 0 ||
    actions.some((action) => backendAllowedActions.includes(action));

  const canPublish = hasAllowedAction("PUBLISH", "UC2.PUBLISH", "UC2.5.PUBLISH");
  const canRollback = hasAllowedAction("ROLLBACK", "UC2.6.ROLLBACK");
  const canArchive = hasAllowedAction("ARCHIVE", "UC2.7.ARCHIVE");
  const canReopen = hasAllowedAction("REOPEN", "UC2.8.REOPEN");

  const loadOperationsSnapshot = useCallback(async () => {
    if (!periodId) {
      setSnapshot({});
      if (!missingPeriodWarningRef.current) {
        notifyWarning("Chua chon dot bao ve. Vui long chon dot tai module Quan ly dot truoc khi thao tac.");
        missingPeriodWarningRef.current = true;
      }
      return;
    }

    missingPeriodWarningRef.current = false;

    const params = new URLSearchParams();
    if (committeeIdFilter.trim()) {
      const numericValue = Number(committeeIdFilter.trim());
      if (Number.isFinite(numericValue) && numericValue > 0) {
        params.set("committeeId", String(Math.floor(numericValue)));
      }
    }
    params.set("revisionStatus", revisionStatus);
    if (revisionKeyword.trim()) {
      params.set("revisionKeyword", revisionKeyword.trim());
    }
    params.set("revisionPage", String(Math.max(1, revisionPage)));
    params.set("revisionSize", String(Math.min(200, Math.max(1, revisionSize))));
    params.set("auditSize", String(Math.min(500, Math.max(1, auditSize))));

    setLoadingSnapshot(true);
    try {
      const response = await fetchData<ApiResponse<OperationsSnapshotData>>(
        `${defensePeriodBase}/operations/snapshot?${params.toString()}`,
        { method: "GET" },
      );
      const parsed = parseEnvelope(
        response,
        "Không tải được snapshot điều hành chấm điểm.",
        { silentNoData: true },
      );
      if (!parsed.ok) {
        return;
      }

      if (!parsed.data) {
        setSnapshot({});
        setLastLoadedAt(new Date().toLocaleString("vi-VN"));
        return;
      }

      setSnapshot(parsed.data);
      setLastLoadedAt(new Date().toLocaleString("vi-VN"));

      const reporting = parsed.data.reporting;
      const supported = Array.isArray(reporting?.supportedReportTypes)
        ? reporting.supportedReportTypes
        : [];
      if (supported.length > 0 && !supported.includes(reportType)) {
        setReportType(supported[0] as ReportType);
      }
      if (reporting?.defaultFormat && reporting.defaultFormat !== reportFormat) {
        setReportFormat(reporting.defaultFormat as ReportFormat);
      }
    } catch (error) {
      if (error instanceof FetchDataError && (error.status === 404 || error.status === 204)) {
        setSnapshot({});
        setLastLoadedAt(new Date().toLocaleString("vi-VN"));
        return;
      }
      notifyError("Không tải được dữ liệu vận hành từ API.");
    } finally {
      setLoadingSnapshot(false);
    }
  }, [
    auditSize,
    committeeIdFilter,
    defensePeriodBase,
    periodId,
    notifyError,
    notifyWarning,
    parseEnvelope,
    reportFormat,
    reportType,
    revisionKeyword,
    revisionPage,
    revisionSize,
    revisionStatus,
  ]);

  useEffect(() => {
    void loadOperationsSnapshot();
  }, [loadOperationsSnapshot]);

  const triggerLifecycle = async (action: LifecycleAction) => {
    if (!periodId) {
      notifyWarning("Chua chon dot bao ve. Vui long chon dot tai module Quan ly dot.");
      return;
    }

    if (
      action === "PUBLISH" &&
      !hasAllowedAction("PUBLISH", "UC2.PUBLISH", "UC2.5.PUBLISH")
    ) {
      notifyWarning("Backend chưa cho phép công bố điểm ở trạng thái hiện tại.");
      return;
    }
    if (
      action === "ROLLBACK" &&
      !hasAllowedAction("ROLLBACK", "UC2.6.ROLLBACK")
    ) {
      notifyWarning("Backend chưa cho phép rollback ở trạng thái hiện tại.");
      return;
    }
    if (
      action === "ARCHIVE" &&
      !hasAllowedAction("ARCHIVE", "UC2.7.ARCHIVE")
    ) {
      notifyWarning("Backend chưa cho phép lưu trữ đợt ở trạng thái hiện tại.");
      return;
    }
    if (
      action === "REOPEN" &&
      !hasAllowedAction("REOPEN", "UC2.8.REOPEN")
    ) {
      notifyWarning("Backend chưa cho phép mở lại đợt ở trạng thái hiện tại.");
      return;
    }

    const idempotencyKey = buildIdempotencyKey(action);
    const payload: Record<string, unknown> = {
      action,
      idempotencyKey,
    };

    if (action === "ROLLBACK") {
      const target = window.prompt(
        "Nhập target rollback: PUBLISH | FINALIZE | ALL",
        "PUBLISH",
      );
      if (!target) {
        return;
      }
      const normalizedTarget = target.trim().toUpperCase();
      if (!["PUBLISH", "FINALIZE", "ALL"].includes(normalizedTarget)) {
        notifyError("Target rollback không hợp lệ.");
        return;
      }
      const reason = window.prompt("Nhập lý do rollback", "Điều chỉnh điểm");
      if (!reason || !reason.trim()) {
        notifyError("Rollback bắt buộc nhập lý do.");
        return;
      }
      payload.rollback = {
        target: normalizedTarget,
        reason: reason.trim(),
        forceUnlockScores: true,
      };
    }

    try {
      setActionInFlight(`Lifecycle ${action}`);
      const response = await fetchData<ApiResponse<Record<string, unknown>>>(
        `${defensePeriodBase}/lifecycle`,
        {
          method: "POST",
          body: payload,
          headers: { "Idempotency-Key": idempotencyKey },
        },
      );
      const parsed = parseEnvelope(
        response,
        `Lifecycle ${action} thất bại. Vui lòng thử lại.`,
      );
      if (!parsed.ok) {
        return;
      }

      if (response.idempotencyReplay ?? response.IdempotencyReplay) {
        notifyInfo(`Yêu cầu ${action} đã được xử lý trước đó.`);
      } else {
        notifySuccess(`Đã thực thi ${action} thành công.`);
      }
      await loadOperationsSnapshot();
    } catch {
      notifyError(`Không thể thực thi ${action}.`);
    } finally {
      setActionInFlight(null);
    }
  };

  const exportReport = () => {
    if (!periodId) {
      notifyWarning("Chua chon dot bao ve. Vui long chon dot tai module Quan ly dot.");
      return;
    }

    if (reportType === "form-1" && !reportCouncilId.trim()) {
      notifyError("Báo cáo form-1 bắt buộc nhập councilId.");
      return;
    }

    const params = new URLSearchParams({
      reportType,
      format: reportFormat,
    });
    if (reportType === "form-1") {
      params.set("councilId", reportCouncilId.trim());
    }

    window.open(
      `${defensePeriodBase}/reports/export?${params.toString()}`,
      "_blank",
      "noopener,noreferrer",
    );
    notifyInfo("Đã gửi yêu cầu mở file báo cáo.");
  };

  const pipeline = snapshot?.monitoring?.pipeline;
  const analytics = snapshot?.monitoring?.analytics;
  const scoringMatrix = snapshot?.scoringMatrix ?? [];
  const postDefense = snapshot?.postDefense;
  const audit = snapshot?.audit;

  const distributionRows = useMemo(() => {
    const distribution = analytics?.distribution;
    return [
      { label: "Xuất sắc", value: Number(distribution?.excellent ?? 0) },
      { label: "Khá", value: Number(distribution?.good ?? 0) },
      { label: "Đạt", value: Number(distribution?.fair ?? 0) },
      { label: "Cần cải thiện", value: Number(distribution?.weak ?? 0) },
    ];
  }, [analytics?.distribution]);

  const distributionTotal = useMemo(
    () => distributionRows.reduce((sum, item) => sum + item.value, 0),
    [distributionRows],
  );

  const distributionPeak = useMemo(
    () => Math.max(1, ...distributionRows.map((item) => item.value)),
    [distributionRows],
  );

  const hasSnapshotContent = useMemo(
    () =>
      Boolean(
        pipeline ||
          analytics?.overview ||
          scoringMatrix.length > 0 ||
          (postDefense?.items?.length ?? 0) > 0 ||
          (audit?.syncHistory?.length ?? 0) > 0 ||
          (audit?.publishHistory?.length ?? 0) > 0 ||
          (audit?.councilAuditHistory?.length ?? 0) > 0 ||
          (audit?.revisionAuditTrail?.length ?? 0) > 0,
      ),
    [
      analytics?.overview,
      audit?.councilAuditHistory?.length,
      audit?.publishHistory?.length,
      audit?.revisionAuditTrail?.length,
      audit?.syncHistory?.length,
      pipeline,
      postDefense?.items?.length,
      scoringMatrix.length,
    ],
  );

  const formatNumber = (value: unknown) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value.toLocaleString("vi-VN");
    }
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed.toLocaleString("vi-VN");
    }
    return "0";
  };

  const renderAuditRows = (
    title: string,
    rows: Array<Record<string, unknown>>,
    primaryField: string,
    secondaryField: string,
  ) => (
    <section style={cardStyle}>
      <h3 style={{ marginTop: 0, fontSize: 16, color: "#0f172a" }}>{title}</h3>
      {rows.length === 0 ? (
        <div style={{ fontSize: 13, color: "#0f172a" }}>
          Chưa có dữ liệu để hiển thị.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {rows.slice(0, Math.min(rows.length, auditSize)).map((row, idx) => (
            <div
              key={`${title}-${idx}`}
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: 10,
                padding: "8px 10px",
                background: "#ffffff",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                {String(row[primaryField] ?? "-")}
              </div>
              <div style={{ fontSize: 12, color: "#0f172a", marginTop: 3 }}>
                {String(row[secondaryField] ?? "-")}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div
      style={{
        maxWidth: 1360,
        margin: "0 auto",
        padding: 20,
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      }}
    >
      <section
        style={{
          ...cardStyle,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#0f172a",
                fontWeight: 700,
              }}
            >
              FIT DNU · Điều hành chấm điểm
            </div>
            <h1
              style={{
                margin: "6px 0 0 0",
                fontSize: 26,
                lineHeight: 1.25,
                color: "#0f172a",
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <Gavel size={22} color="#f37021" /> Điều hành chấm điểm - Hậu bảo vệ
            </h1>
            <div
              style={{
                marginTop: 8,
                fontSize: 13,
                color: "#0f172a",
                lineHeight: 1.6,
              }}
            >
              Theo dõi scoring matrix, revision queue, audit trail và điều phối lifecycle hậu bảo vệ.
            </div>
          </div>

          <div
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: 12,
              padding: "10px 12px",
              background: "#ffffff",
              minWidth: 260,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#0f172a",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              Snapshot
            </div>
            <div style={{ marginTop: 6, fontSize: 13, color: "#0f172a" }}>
              {loadingSnapshot
                ? "Đang tải dữ liệu..."
                : `Lần tải: ${lastLoadedAt || "Chưa có"}`}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: "#0f172a" }}>
              Action: {actionInFlight ?? "Idle"}
            </div>
          </div>
        </div>
      </section>

      {/* Module navigation buttons removed (Phân công / Điều hành) */}

      <section style={{ ...cardStyle, marginBottom: 14, borderColor: "#cbd5e1" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {panelTabs.map((tab) => {
            const isActive = activePanel === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActivePanel(tab.key)}
                style={{
                  border: `1px solid ${isActive ? "#f37021" : "#cbd5e1"}`,
                  borderRadius: 10,
                  background: "#ffffff",
                  color: isActive ? "#f37021" : "#0f172a",
                  minHeight: 38,
                  padding: "0 12px",
                  fontWeight: 700,
                  fontSize: 13,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  transition: "all .2s ease",
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      <section style={{ ...cardStyle, marginBottom: 16 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: 10,
          }}
        >
          <div
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: 10,
              padding: 10,
              background: "#ffffff",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#0f172a",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              Tiến độ toàn đợt
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>
              {formatNumber(pipeline?.overallCompletionPercent)}%
            </div>
          </div>
          <div
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: 10,
              padding: 10,
              background: "#ffffff",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#0f172a",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              Đề tài đã chấm
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>
              {formatNumber(pipeline?.scoredTopics)}
            </div>
          </div>
          <div
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: 10,
              padding: 10,
              background: "#ffffff",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#0f172a",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              Revision đang chờ
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>
              {formatNumber(pipeline?.pendingRevisionCount)}
            </div>
          </div>
          <div
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: 10,
              padding: 10,
              background: "#ffffff",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#0f172a",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              Điểm trung bình
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>
              {formatNumber(analytics?.overview?.average)}
            </div>
          </div>
          <div
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: 10,
              padding: 10,
              background: "#ffffff",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#0f172a",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              Tỷ lệ đạt
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>
              {formatNumber(analytics?.overview?.passRate)}%
            </div>
          </div>
        </div>
      </section>

      {!loadingSnapshot && !hasSnapshotContent && (
        <section style={{ ...emptyStateCardStyle, marginBottom: 16 }}>
          Chưa có dữ liệu để hiển thị.
        </section>
      )}

      {activePanel === "snapshot" && (
        <section style={{ ...cardStyle, marginBottom: 16 }}>
          <h2
            style={{
              marginTop: 0,
              fontSize: 17,
              color: "#0f172a",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Search size={16} color="#f37021" /> Bộ lọc snapshot vận hành
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: 10,
            }}
          >
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#0f172a", fontWeight: 600 }}>
                Committee ID
              </span>
              <input
                value={committeeIdFilter}
                onChange={(event) => setCommitteeIdFilter(event.target.value)}
                placeholder="Ví dụ: 3"
                style={{
                  minHeight: 36,
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                  padding: "0 10px",
                }}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#0f172a", fontWeight: 600 }}>
                Revision status
              </span>
              <select
                value={revisionStatus}
                onChange={(event) =>
                  setRevisionStatus(event.target.value as RevisionStatus)
                }
                style={selectControlStyle}
              >
                <option value="all">all</option>
                <option value="pending">pending</option>
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
              </select>
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#0f172a", fontWeight: 600 }}>
                Từ khóa revision
              </span>
              <input
                value={revisionKeyword}
                onChange={(event) => setRevisionKeyword(event.target.value)}
                placeholder="MSSV / tên / đề tài"
                style={{
                  minHeight: 36,
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                  padding: "0 10px",
                }}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#0f172a", fontWeight: 600 }}>
                Revision page
              </span>
              <input
                type="number"
                min={1}
                max={200}
                value={revisionPage}
                onChange={(event) =>
                  setRevisionPage(Number(event.target.value) || 1)
                }
                style={{
                  minHeight: 36,
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                  padding: "0 10px",
                }}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#0f172a", fontWeight: 600 }}>
                Revision size
              </span>
              <input
                type="number"
                min={1}
                max={200}
                value={revisionSize}
                onChange={(event) =>
                  setRevisionSize(Number(event.target.value) || 20)
                }
                style={{
                  minHeight: 36,
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                  padding: "0 10px",
                }}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#0f172a", fontWeight: 600 }}>
                Audit size
              </span>
              <input
                type="number"
                min={1}
                max={500}
                value={auditSize}
                onChange={(event) => setAuditSize(Number(event.target.value) || 50)}
                style={{
                  minHeight: 36,
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                  padding: "0 10px",
                }}
              />
            </label>
          </div>

          <div
            style={{
              marginTop: 12,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              onClick={() => void loadOperationsSnapshot()}
              style={{
                border: "none",
                background: "#f37021",
                color: "#ffffff",
                borderRadius: 10,
                minHeight: 36,
                padding: "0 12px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <RefreshCw size={14} /> Tải snapshot
            </button>
            <span style={{ fontSize: 12, color: "#0f172a" }}>
              Áp dụng bộ lọc trước khi truy xuất snapshot để giảm tải dữ liệu.
            </span>
          </div>
        </section>
      )}

      {activePanel === "lifecycle" && (
        <section style={{ ...cardStyle, marginBottom: 16 }}>
          <h2
            style={{
              marginTop: 0,
              fontSize: 17,
              color: "#0f172a",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Activity size={16} color="#f37021" /> Lifecycle hậu bảo vệ
          </h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => void triggerLifecycle("PUBLISH")}
              disabled={Boolean(actionInFlight) || !canPublish}
              style={{
                border: "none",
                background: "#f37021",
                color: "#ffffff",
                borderRadius: 10,
                minHeight: 36,
                padding: "0 12px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: Boolean(actionInFlight) || !canPublish ? "not-allowed" : "pointer",
                opacity: Boolean(actionInFlight) || !canPublish ? 0.6 : 1,
              }}
            >
              <CheckCircle2 size={14} /> Publish điểm
            </button>
            <button
              type="button"
              onClick={() => void triggerLifecycle("ROLLBACK")}
              disabled={Boolean(actionInFlight) || !canRollback}
              style={{
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                borderRadius: 10,
                minHeight: 36,
                padding: "0 12px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: Boolean(actionInFlight) || !canRollback ? "not-allowed" : "pointer",
                opacity: Boolean(actionInFlight) || !canRollback ? 0.6 : 1,
              }}
            >
              <RotateCcw size={14} /> Rollback
            </button>
            <button
              type="button"
              onClick={() => void triggerLifecycle("ARCHIVE")}
              disabled={Boolean(actionInFlight) || !canArchive}
              style={{
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                borderRadius: 10,
                minHeight: 36,
                padding: "0 12px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: Boolean(actionInFlight) || !canArchive ? "not-allowed" : "pointer",
                opacity: Boolean(actionInFlight) || !canArchive ? 0.6 : 1,
              }}
            >
              <Archive size={14} /> Archive đợt
            </button>
            <button
              type="button"
              onClick={() => void triggerLifecycle("REOPEN")}
              disabled={Boolean(actionInFlight) || !canReopen}
              style={{
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                borderRadius: 10,
                minHeight: 36,
                padding: "0 12px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: Boolean(actionInFlight) || !canReopen ? "not-allowed" : "pointer",
                opacity: Boolean(actionInFlight) || !canReopen ? 0.6 : 1,
              }}
            >
              <Unlock size={14} /> Reopen
            </button>
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              color: "#0f172a",
              border: "1px solid #cbd5e1",
              borderRadius: 10,
              background: "#ffffff",
              padding: "8px 10px",
            }}
          >
            Khuyến nghị: luôn tải lại snapshot sau mỗi lifecycle để đối soát trạng thái mới nhất.
          </div>
        </section>
      )}

      {activePanel === "scoring" && (
        <section style={{ ...cardStyle, marginBottom: 16 }}>
          <h2
            style={{
              marginTop: 0,
              fontSize: 17,
              color: "#0f172a",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <BarChart3 size={16} color="#f37021" /> Scoring matrix
          </h2>
          <div
            style={{
              overflowX: "auto",
              border: "1px solid #cbd5e1",
              borderRadius: 12,
            }}
          >
            <table
              style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
            >
              <thead>
                <tr>
                  <th style={tableHeadCellStyle}>
                    Hội đồng
                  </th>
                  <th style={tableHeadCellStyle}>
                    SV
                  </th>
                  <th style={tableHeadCellStyle}>
                    Đề tài
                  </th>
                  <th style={tableHeadCellStyle}>
                    Tiến độ
                  </th>
                  <th style={tableHeadCellStyle}>
                    Điểm
                  </th>
                  <th style={tableHeadCellStyle}>Trạng thái</th>
                  <th style={tableHeadCellStyle}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {scoringMatrix.map((row, index) => (
                  <tr key={`${row.assignmentId ?? index}-${row.studentCode ?? ""}`}>
                    <td style={tableCellStyle}>
                      {row.committeeCode ?? row.committeeId ?? "-"}
                    </td>
                    <td style={tableCellStyle}>
                      <div style={{ fontWeight: 700 }}>{row.studentCode ?? "-"}</div>
                      <div style={{ color: "#0f172a", fontSize: 12 }}>
                        {row.studentName ?? "-"}
                      </div>
                    </td>
                    <td style={tableCellStyle}>
                      <div style={{ fontWeight: 700 }}>{row.topicCode ?? "-"}</div>
                      <div style={{ color: "#0f172a", fontSize: 12 }}>
                        {row.topicTitle ?? "-"}
                      </div>
                    </td>
                    <td style={tableCellStyle}>
                      {formatNumber(row.submittedCount)}/
                      {formatNumber(row.requiredCount)}
                    </td>
                    <td style={tableCellStyle}>
                      {row.finalScore != null
                        ? `${row.finalScore} (${row.finalGrade ?? "-"})`
                        : "-"}
                    </td>
                    <td style={tableCellStyle}>
                      {(() => {
                        const statusValue = row.status ?? (row.isLocked ? "LOCKED" : "IN_PROGRESS");
                        const statusTone = getStatusTone(statusValue);
                        return (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              borderRadius: 999,
                              border: `1px solid ${statusTone.border}`,
                              background: statusTone.bg,
                              color: statusTone.text,
                              padding: "5px 10px",
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            {getStatusLabel(statusValue)}
                          </span>
                        );
                      })()}
                    </td>
                    <td style={tableCellStyle}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <button type="button" style={actionIconButtonStyle} title="Xem chi tiết">
                          <Eye size={14} />
                        </button>
                        <button type="button" style={actionIconButtonStyle} title="Chỉnh sửa">
                          <Pencil size={14} />
                        </button>
                        <button type="button" style={dangerActionIconButtonStyle} title="Xóa">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {scoringMatrix.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        padding: 12,
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

          <div
            style={{
              marginTop: 14,
              border: "1px solid #cbd5e1",
              borderRadius: 10,
              padding: 12,
              background: "#ffffff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: "#0f172a",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                }}
              >
                Phân bố chất lượng
              </div>
              <div style={{ fontSize: 12, color: "#0f172a" }}>
                Tổng số: {formatNumber(distributionTotal)}
              </div>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {distributionRows.map((item) => {
                const percent = Math.round((item.value / distributionPeak) * 100);
                const barColor = distributionPalette[item.label] ?? "#f37021";

                return (
                  <div key={item.label} style={{ display: "grid", gap: 6 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                        fontSize: 13,
                        color: "#0f172a",
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>{item.label}</span>
                      <strong>{formatNumber(item.value)}</strong>
                    </div>
                    <div
                      style={{
                        height: 10,
                        borderRadius: 999,
                        background: "#e2e8f0",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${percent}%`,
                          minWidth: item.value > 0 ? 8 : 0,
                          height: "100%",
                          background: barColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {activePanel === "post-defense" && (
        <section style={{ ...cardStyle, marginBottom: 16 }}>
          <h2
            style={{
              marginTop: 0,
              fontSize: 17,
              color: "#0f172a",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <FileSpreadsheet size={16} color="#f37021" /> Hậu bảo vệ - revision queue
          </h2>
          <div
            style={{ marginBottom: 10, display: "flex", gap: 8, flexWrap: "wrap" }}
          >
            <div style={{ fontSize: 12, color: "#0f172a" }}>
              Total: {formatNumber(postDefense?.totalRevisions)}
            </div>
            <div style={{ fontSize: 12, color: "#f37021" }}>
              Pending: {formatNumber(postDefense?.pendingRevisions)}
            </div>
            <div style={{ fontSize: 12, color: "#0f172a" }}>
              Approved: {formatNumber(postDefense?.approvedRevisions)}
            </div>
            <div style={{ fontSize: 12, color: "#0f172a" }}>
              Rejected: {formatNumber(postDefense?.rejectedRevisions)}
            </div>
          </div>
          <div
            style={{
              overflowX: "auto",
              border: "1px solid #cbd5e1",
              borderRadius: 12,
            }}
          >
            <table
              style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
            >
              <thead>
                <tr>
                  <th style={tableHeadCellStyle}>
                    Revision
                  </th>
                  <th style={tableHeadCellStyle}>
                    Sinh viên
                  </th>
                  <th style={tableHeadCellStyle}>
                    Đề tài
                  </th>
                  <th style={tableHeadCellStyle}>
                    Trạng thái
                  </th>
                  <th style={tableHeadCellStyle}>
                    Thời gian
                  </th>
                  <th style={tableHeadCellStyle}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {(postDefense?.items ?? []).map((item, index) => (
                  <tr key={`${item.revisionId ?? index}-${item.assignmentId ?? ""}`}>
                    <td style={tableCellStyle}>
                      #{String(item.revisionId ?? "-")}
                    </td>
                    <td style={tableCellStyle}>
                      <div style={{ fontWeight: 700 }}>{item.studentCode ?? "-"}</div>
                      <div style={{ color: "#0f172a", fontSize: 12 }}>
                        {item.studentName ?? "-"}
                      </div>
                    </td>
                    <td style={tableCellStyle}>
                      <div style={{ fontWeight: 700 }}>{item.topicCode ?? "-"}</div>
                      <div style={{ color: "#0f172a", fontSize: 12 }}>
                        {item.topicTitle ?? "-"}
                      </div>
                    </td>
                    <td style={tableCellStyle}>
                      {(() => {
                        const statusValue = item.status ?? "PENDING";
                        const statusTone = getStatusTone(statusValue);
                        return (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              borderRadius: 999,
                              border: `1px solid ${statusTone.border}`,
                              background: statusTone.bg,
                              color: statusTone.text,
                              padding: "5px 10px",
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            {getStatusLabel(statusValue)}
                          </span>
                        );
                      })()}
                    </td>
                    <td style={tableCellStyle}>
                      <div>{item.submittedAt ?? "-"}</div>
                      <div style={{ color: "#0f172a", fontSize: 12 }}>
                        Review: {item.reviewedAt ?? "-"}
                      </div>
                    </td>
                    <td style={tableCellStyle}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <button type="button" style={actionIconButtonStyle} title="Xem chi tiết">
                          <Eye size={14} />
                        </button>
                        <button type="button" style={actionIconButtonStyle} title="Chỉnh sửa">
                          <Pencil size={14} />
                        </button>
                        <button type="button" style={dangerActionIconButtonStyle} title="Xóa">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(postDefense?.items ?? []).length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: 12,
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
        </section>
      )}

      {activePanel === "audit-report" && (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 16,
          }}
        >
          <section style={cardStyle}>
            <h2
              style={{
                marginTop: 0,
                fontSize: 17,
                color: "#0f172a",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Activity size={16} color="#f37021" /> Audit trail
            </h2>
            <div style={{ display: "grid", gap: 10 }}>
              {renderAuditRows(
                "Sync history",
                audit?.syncHistory ?? [],
                "timestamp",
                "action",
              )}
              {renderAuditRows(
                "Publish history",
                audit?.publishHistory ?? [],
                "publishedAt",
                "status",
              )}
              {renderAuditRows(
                "Council audit",
                audit?.councilAuditHistory ?? [],
                "action",
                "timestamp",
              )}
              {renderAuditRows(
                "Revision audit",
                audit?.revisionAuditTrail ?? [],
                "revisionId",
                "action",
              )}
            </div>
          </section>

          <section style={cardStyle}>
            <h2
              style={{
                marginTop: 0,
                fontSize: 17,
                color: "#0f172a",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Download size={16} color="#f37021" /> Xuất báo cáo
            </h2>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "grid", gap: 8 }}>
                <div
                  style={{
                    fontSize: 12,
                    color: "#0f172a",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                  }}
                >
                  Chọn loại file xuất
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                    gap: 8,
                  }}
                >
                  {reportTypeOptions.map((option) => {
                    const isActive = reportType === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setReportType(option.value)}
                        style={{
                          border: `1px solid ${isActive ? "#f37021" : "#cbd5e1"}`,
                          borderRadius: 10,
                          background: isActive ? "#fff7ed" : "#ffffff",
                          color: isActive ? "#9a3412" : "#0f172a",
                          minHeight: 52,
                          padding: "10px 12px",
                          fontWeight: 700,
                          fontSize: 13,
                          textAlign: "left",
                          cursor: "pointer",
                          display: "grid",
                          gap: 4,
                        }}
                      >
                        <span>{option.label}</span>
                        <span style={{ fontSize: 11, fontWeight: 500, lineHeight: 1.4 }}>
                          {option.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 10,
                }}
              >
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, color: "#0f172a", fontWeight: 600 }}>
                    Format
                  </span>
                  <select
                    value={reportFormat}
                    onChange={(event) => setReportFormat(event.target.value as ReportFormat)}
                    style={selectControlStyle}
                  >
                    <option value="csv">csv</option>
                  </select>
                </label>

                {reportType === "form-1" && (
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: 12, color: "#0f172a", fontWeight: 600 }}>
                      Council ID (bắt buộc khi form-1)
                    </span>
                    <input
                      value={reportCouncilId}
                      onChange={(event) => setReportCouncilId(event.target.value)}
                      placeholder="Ví dụ: 3"
                      style={{
                        minHeight: 36,
                        border: "1px solid #cbd5e1",
                        borderRadius: 10,
                        padding: "0 10px",
                      }}
                    />
                  </label>
                )}
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: "#0f172a",
                  lineHeight: 1.5,
                }}
              >
                Chọn một loại file rồi bấm xuất để mở báo cáo riêng trong tab mới.
              </div>

              <button
                type="button"
                onClick={exportReport}
                style={{
                  border: "none",
                  background: "#f37021",
                  color: "#ffffff",
                  borderRadius: 10,
                  minHeight: 36,
                  padding: "0 12px",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  cursor: "pointer",
                }}
              >
                <Download size={14} /> Xuất file
              </button>
            </div>
          </section>
        </section>
      )}
    </div>
  );
};

export default CommitteeOperationsManagement;
