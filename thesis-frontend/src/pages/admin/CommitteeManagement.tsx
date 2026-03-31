import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronRight,
  Download,
  X,
  FileSpreadsheet,
  Gavel,
  GraduationCap,
  Lock,
  Mail,
  Eye,
  RefreshCw,
  Pencil,
  Plus,
  Save,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UploadCloud,
  Users,
  Workflow,
} from "lucide-react";
import { useToast } from "../../context/useToast";
import { fetchData } from "../../api/fetchData";
import type { ApiResponse } from "../../types/api";

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
  lecturerCode?: string;
  lecturerName?: string;
  degree?: string | null;
  tagCodes?: string[];
  availability?: boolean;
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

type RollbackAvailabilityResponse = {
  canRollbackPublish?: boolean;
  canRollbackFinalize?: boolean;
  canRollbackAll?: boolean;
  blockers?: string[];
};

type EligibleStudent = {
  studentCode: string;
  topicCode?: string;
  studentName: string;
  topicTitle: string;
  supervisorCode: string;
  tags: string[];
  isEligible: boolean;
  valid: boolean;
  error?: string;
};

type LecturerCapability = {
  lecturerCode: string;
  lecturerName: string;
  tags: string[];
  busySlots: string[];
  warning?: string;
};

type SyncAuditLog = {
  timestamp: string;
  action: string;
  result: "Success" | "Partial" | "Timeout";
  records: string;
};

type ExportJob = {
  id: string;
  scope: string;
  status: "Done" | "Running" | "Retry";
  duration: string;
};

type PublishBatch = {
  id: string;
  term: string;
  totalStudents: number;
  publishedAt: string;
  status: "Published" | "Draft";
};

type ScoreStatisticRow = {
  councilId: string;
  room: string;
  session: "Sáng" | "Chiều";
  studentCode: string;
  studentName: string;
  topicTitle: string;
  score: number;
  grade: string;
};

type CouncilMember = {
  role: string;
  lecturerCode: string;
  lecturerName: string;
};

type CouncilAssignment = {
  assignmentId: number;
  studentCode: string;
  topicCode?: string;
  sessionCode?: "MORNING" | "AFTERNOON";
  orderIndex?: number;
};

type CouncilDraft = {
  id: string;
  concurrencyToken?: string;
  room: string;
  defenseDate: string;
  session: "Sang" | "Chieu";
  slotId: string;
  councilTags: string[];
  morningStudents: string[];
  afternoonStudents: string[];
  assignments?: CouncilAssignment[];
  forbiddenLecturers: string[];
  members: CouncilMember[];
  warning?: string;
};

type CommitteeStatus = "Draft" | "Ready" | "Warning" | "Published";

type CouncilRow = CouncilDraft & {
  memberCount: number;
  status: CommitteeStatus;
};

type StageKey = "prepare" | "grouping" | "assignment" | "operation" | "publish";

const FIXED_TOPICS_PER_SESSION = 4;
const FIXED_MEMBERS_PER_COUNCIL = 4;
const COUNCIL_CONFIG_OPTIONS = [3, 4, 5, 6, 7];

const stages: Array<{ key: StageKey; label: string; icon: React.ReactNode }> = [
  {
    key: "prepare",
    label: "Khởi tạo dữ liệu",
    icon: <UploadCloud size={16} />,
  },
  { key: "grouping", label: "Cấu hình hội đồng", icon: <Sparkles size={16} /> },
  { key: "assignment", label: "Phân công", icon: <Workflow size={16} /> },
  { key: "operation", label: "Điều hành chấm điểm", icon: <Gavel size={16} /> },
  { key: "publish", label: "Hậu bảo vệ", icon: <FileSpreadsheet size={16} /> },
];

const baseCard: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e6e9ef",
  borderRadius: 10,
  padding: 18,
  boxShadow: "0 2px 8px rgba(15,23,42,0.05)",
};

const CommitteeManagement: React.FC = () => {
  const { addToast } = useToast();
  const [activeStage, setActiveStage] = useState<StageKey>("prepare");

  const [students, setStudents] = useState<EligibleStudent[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "success" | "timeout">(
    "idle",
  );

  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
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
  const [loadingAutoGenerateConfig, setLoadingAutoGenerateConfig] =
    useState(false);
  const [availableAutoRooms, setAvailableAutoRooms] = useState<string[]>([]);
  const [availableAutoTopics, setAvailableAutoTopics] = useState<
    AutoGenerateTopicDto[]
  >([]);
  const [availableAutoLecturers, setAvailableAutoLecturers] = useState<
    AutoGenerateLecturerDto[]
  >([]);
  const [selectedAutoTopicIds, setSelectedAutoTopicIds] = useState<
    Array<number | string>
  >([]);
  const [selectedAutoLecturerIds, setSelectedAutoLecturerIds] = useState<
    Array<number | string>
  >([]);
  const [topicSearchKeyword, setTopicSearchKeyword] = useState("");
  const [autoGroupByTag, setAutoGroupByTag] = useState(true);
  const [autoPrioritizeMatchTag, setAutoPrioritizeMatchTag] = useState(true);
  const [autoRequireChairDegree, setAutoRequireChairDegree] = useState("PhD");
  const [autoAvoidSupervisorConflict, setAutoAvoidSupervisorConflict] =
    useState(true);
  const [autoAvoidLecturerOverlap, setAutoAvoidLecturerOverlap] =
    useState(true);
  const [searchCouncil, setSearchCouncil] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [roomFilter, setRoomFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [councilPage, setCouncilPage] = useState(1);
  const [selectedCouncilId, setSelectedCouncilId] = useState<string>("");
  const [manualMode, setManualMode] = useState<"create" | "edit" | null>(null);
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1);
  const [manualId, setManualId] = useState("HD-2026-04");
  const [manualDefenseDate, setManualDefenseDate] = useState("2026-04-24");
  const [manualRoom, setManualRoom] = useState("");
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
  const [manualMembers, setManualMembers] = useState<CouncilMember[]>([
    { role: "CT", lecturerCode: "", lecturerName: "" },
    { role: "TK", lecturerCode: "", lecturerName: "" },
    { role: "PB", lecturerCode: "", lecturerName: "" },
    { role: "UV", lecturerCode: "", lecturerName: "" },
  ]);
  const [manualSnapshot, setManualSnapshot] = useState<{
    id: string;
    concurrencyToken?: string;
    defenseDate: string;
    room: string;
    tags: string[];
    morning: string[];
    afternoon: string[];
    members: CouncilMember[];
  } | null>(null);
  const [manualReadOnly, setManualReadOnly] = useState(false);

  const notifyError = useCallback((message: string) => addToast(message, "error"), [addToast]);
  const notifySuccess = useCallback((message: string) => addToast(message, "success"), [addToast]);
  const notifyWarning = useCallback((message: string) => addToast(message, "warning"), [addToast]);
  const notifyInfo = useCallback((message: string) => addToast(message, "info"), [addToast]);

  const [varianceThreshold, setVarianceThreshold] = useState(1.5);
  const [currentVariance, setCurrentVariance] = useState(1.7);
  const [allowFinalizeAfterWarning, setAllowFinalizeAfterWarning] =
    useState(false);

  const [isFinalized, setIsFinalized] = useState(false);
  const [emailFailed] = useState(1);
  const [published, setPublished] = useState(false);
  const [loadingRollbackAvailability, setLoadingRollbackAvailability] =
    useState(false);
  const [rollbackWorking, setRollbackWorking] = useState(false);
  const [rollbackAvailability, setRollbackAvailability] =
    useState<RollbackAvailabilityResponse | null>(null);
  const [backendAllowedActions, setBackendAllowedActions] = useState<string[]>(
    [],
  );
  const [stateHydrated, setStateHydrated] = useState(false);
  const [readinessReady, setReadinessReady] = useState(true);
  const [readinessNote, setReadinessNote] = useState<string>("");
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);
  const [apiSignal, setApiSignal] = useState<{
    at: string;
    traceId?: string;
    concurrencyToken?: string;
    idempotencyReplay?: boolean;
    message?: string;
  } | null>(null);
  const [lecturerCapabilities, setLecturerCapabilities] = useState<
    LecturerCapability[]
  >([]);
  const [syncAuditLogs, setSyncAuditLogs] = useState<SyncAuditLog[]>([]);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [publishBatches, setPublishBatches] = useState<PublishBatch[]>([]);
  const [scoreRows, setScoreRows] = useState<ScoreStatisticRow[]>([]);
  const selectedRoomsRef = useRef(selectedRooms);
  const autoStartDateRef = useRef(autoStartDate);

  useEffect(() => {
    selectedRoomsRef.current = selectedRooms;
  }, [selectedRooms]);

  useEffect(() => {
    autoStartDateRef.current = autoStartDate;
  }, [autoStartDate]);

  const defensePeriodId = "2026.1";
  const defensePeriodBase = `/v1/defense-periods/${encodeURIComponent(defensePeriodId)}`;
  const makeIdempotencyKey = (prefix: string) =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
  const adminApi = useMemo(() => ({
    sync: (idempotencyKey?: string) =>
      fetchData<ApiResponse<Record<string, unknown>>>(
        `${defensePeriodBase}/sync`,
        {
          method: "POST",
          body: {
            retryOnFailure: true,
            idempotencyKey: idempotencyKey ?? makeIdempotencyKey("SYNC"),
          },
          headers: {
            "Idempotency-Key": idempotencyKey ?? makeIdempotencyKey("SYNC"),
          },
        },
      ),
    getStudents: (eligible?: boolean) =>
      fetchData<ApiResponse<Record<string, unknown>[]>>(
        `${defensePeriodBase}/students${typeof eligible === "boolean" ? `?eligible=${eligible}` : ""}`,
        { method: "GET" },
      ),
    getEligibleTopics: (eligibleOnly?: boolean) =>
      fetchData<ApiResponse<Record<string, unknown>[]>>(
        `${defensePeriodBase}/eligible-topics${typeof eligibleOnly === "boolean" ? `?eligibleOnly=${eligibleOnly}` : ""}`,
        { method: "GET" },
      ),
    getConfig: () =>
      fetchData<ApiResponse<Record<string, unknown>>>(
        `${defensePeriodBase}/config`,
        { method: "GET" },
      ),
    getState: () =>
      fetchData<ApiResponse<Record<string, unknown>>>(
        `${defensePeriodBase}/state`,
        { method: "GET" },
      ),
    getReadinessCheck: () =>
      fetchData<ApiResponse<Record<string, unknown>>>(
        `${defensePeriodBase}/readiness-check`,
        { method: "GET" },
      ),
    getRollbackAvailability: () =>
      fetchData<ApiResponse<Record<string, unknown>>>(
        `${defensePeriodBase}/rollback/availability`,
        { method: "GET" },
      ),
    getSyncErrors: () =>
      fetchData<ApiResponse<Record<string, unknown>[]>>(
        `${defensePeriodBase}/sync/errors`,
        { method: "GET" },
      ),
    getEligibilityErrors: () =>
      fetchData<ApiResponse<Record<string, unknown>[]>>(
        `${defensePeriodBase}/eligibility-errors`,
        { method: "GET" },
      ),
    getSyncHistory: (size = 20) =>
      fetchData<ApiResponse<Record<string, unknown>[]>>(
        `${defensePeriodBase}/sync-history?size=${size}`,
        { method: "GET" },
      ),
    getLecturerCapabilities: () =>
      fetchData<ApiResponse<Record<string, unknown>[]>>(
        `${defensePeriodBase}/lecturer-capabilities`,
        { method: "GET" },
      ),
    getLecturerBusyTimes: () =>
      fetchData<ApiResponse<Record<string, unknown>[]>>(
        `${defensePeriodBase}/lecturer-busy-times`,
        { method: "GET" },
      ),
    updateLecturerBusyTimes: (lecturerCode: string, busySlots: string[]) =>
      fetchData<ApiResponse<boolean>>(
        `${defensePeriodBase}/lecturer-busy-times/${encodeURIComponent(lecturerCode)}`,
        { method: "PUT", body: { busySlots } },
      ),
    updateConfig: (payload: {
      rooms: string[];
      morningStart: string;
      afternoonStart: string;
      softMaxCapacity: number;
    }) =>
      fetchData<ApiResponse<boolean>>(`${defensePeriodBase}/config`, {
        method: "PUT",
        body: payload,
      }),
    lockCapabilities: () =>
      fetchData<ApiResponse<boolean>>(
        `${defensePeriodBase}/lecturer-capabilities/lock`,
        { method: "PUT", body: {} },
      ),
    confirmCouncilConfig: (payload: {
      topicsPerSessionConfig: number;
      membersPerCouncilConfig: number;
      tags: string[];
    }) =>
      fetchData<ApiResponse<boolean>>(
        `${defensePeriodBase}/council-config/confirm`,
        { method: "POST", body: payload },
      ),
    generateCouncils: (
      payload: Record<string, unknown>,
      idempotencyKey?: string,
    ) =>
      fetchData<ApiResponse<Record<string, unknown>[]>>(
        `${defensePeriodBase}/councils/generate`,
        {
          method: "POST",
          body: {
            ...payload,
            idempotencyKey: idempotencyKey ?? makeIdempotencyKey("GEN"),
          },
          headers: {
            "Idempotency-Key": idempotencyKey ?? makeIdempotencyKey("GEN"),
          },
        },
      ),
    autoGenerateCouncils: (
      payload: Record<string, unknown>,
      idempotencyKey?: string,
    ) =>
      fetchData<ApiResponse<Record<string, unknown>>>(
        `${defensePeriodBase}/committees/auto-generate`,
        {
          method: "POST",
          body: {
            ...payload,
            idempotencyKey: idempotencyKey ?? makeIdempotencyKey("AUTOGEN"),
          },
          headers: {
            "Idempotency-Key": idempotencyKey ?? makeIdempotencyKey("AUTOGEN"),
          },
        },
      ),
    getAutoGenerateConfig: () =>
      fetchData<ApiResponse<Record<string, unknown>>>(
        `${defensePeriodBase}/auto-generate/config`,
        { method: "GET" },
      ),
    simulateAutoGenerate: (payload: Record<string, unknown>) =>
      fetchData<ApiResponse<Record<string, unknown>>>(
        `${defensePeriodBase}/auto-generate/simulate`,
        { method: "POST", body: payload },
      ),
    getCouncils: (query?: Record<string, string | number>) =>
      fetchData<ApiResponse<Record<string, unknown>>>(
        `${defensePeriodBase}/councils${query ? `?${new URLSearchParams(Object.entries(query).map(([k, v]) => [k, String(v)])).toString()}` : ""}`,
        { method: "GET" },
      ),
    getCouncilById: (councilId: string) =>
      fetchData<ApiResponse<Record<string, unknown>>>(
        `${defensePeriodBase}/councils/${encodeURIComponent(councilId)}`,
        { method: "GET" },
      ),
    getTagTopics: (tagCode?: string) =>
      fetchData<ApiResponse<Record<string, unknown>[]>>(
        `${defensePeriodBase}/tags/topics${tagCode ? `?tagCode=${encodeURIComponent(tagCode)}` : ""}`,
        { method: "GET" },
      ),
    getTagLecturers: (tagCode?: string) =>
      fetchData<ApiResponse<Record<string, unknown>[]>>(
        `${defensePeriodBase}/tags/lecturers${tagCode ? `?tagCode=${encodeURIComponent(tagCode)}` : ""}`,
        { method: "GET" },
      ),
    getTagCommittees: (tagCode?: string) =>
      fetchData<ApiResponse<Record<string, unknown>[]>>(
        `${defensePeriodBase}/tags/committees${tagCode ? `?tagCode=${encodeURIComponent(tagCode)}` : ""}`,
        { method: "GET" },
      ),
    getTagOverview: () =>
      fetchData<ApiResponse<Record<string, unknown>>>(
        `${defensePeriodBase}/tags/overview`,
        { method: "GET" },
      ),
    createCouncil: (payload: Record<string, unknown>) =>
      fetchData<ApiResponse<Record<string, unknown>>>(
        `${defensePeriodBase}/councils`,
        { method: "POST", body: payload },
      ),
    updateCouncil: (councilId: string, payload: Record<string, unknown>) =>
      fetchData<ApiResponse<Record<string, unknown>>>(
        `${defensePeriodBase}/councils/${encodeURIComponent(councilId)}`,
        { method: "PUT", body: payload },
      ),
    deleteCouncil: (councilId: string, concurrencyToken?: string) =>
      fetchData<ApiResponse<boolean>>(
        `${defensePeriodBase}/councils/${encodeURIComponent(councilId)}`,
        {
          method: "DELETE",
          body: concurrencyToken ? { concurrencyToken } : undefined,
        },
      ),
    addCouncilMember: (councilId: string, payload: Record<string, unknown>) =>
      fetchData<ApiResponse<Record<string, unknown>>>(
        `${defensePeriodBase}/councils/${encodeURIComponent(councilId)}/members`,
        {
          method: "POST",
          body: payload,
        },
      ),
    updateCouncilMember: (
      councilId: string,
      lecturerCode: string,
      payload: Record<string, unknown>,
    ) =>
      fetchData<ApiResponse<Record<string, unknown>>>(
        `${defensePeriodBase}/councils/${encodeURIComponent(councilId)}/members/${encodeURIComponent(lecturerCode)}`,
        {
          method: "PATCH",
          body: payload,
        },
      ),
    removeCouncilMember: (
      councilId: string,
      lecturerCode: string,
      concurrencyToken: string,
    ) =>
      fetchData<ApiResponse<boolean>>(
        `${defensePeriodBase}/councils/${encodeURIComponent(councilId)}/members/${encodeURIComponent(lecturerCode)}?concurrencyToken=${encodeURIComponent(concurrencyToken)}`,
        {
          method: "DELETE",
        },
      ),
    addCouncilTopic: (councilId: string, payload: Record<string, unknown>) =>
      fetchData<ApiResponse<Record<string, unknown>>>(
        `${defensePeriodBase}/councils/${encodeURIComponent(councilId)}/topics`,
        {
          method: "POST",
          body: payload,
        },
      ),
    updateCouncilTopic: (
      councilId: string,
      assignmentId: number,
      payload: Record<string, unknown>,
    ) =>
      fetchData<ApiResponse<Record<string, unknown>>>(
        `${defensePeriodBase}/councils/${encodeURIComponent(councilId)}/topics/${assignmentId}`,
        {
          method: "PATCH",
          body: payload,
        },
      ),
    removeCouncilTopic: (
      councilId: string,
      assignmentId: number,
      concurrencyToken: string,
    ) =>
      fetchData<ApiResponse<boolean>>(
        `${defensePeriodBase}/councils/${encodeURIComponent(councilId)}/topics/${assignmentId}?concurrencyToken=${encodeURIComponent(concurrencyToken)}`,
        {
          method: "DELETE",
        },
      ),
    getAutoCouncilCode: () =>
      fetchData<ApiResponse<Record<string, unknown>>>(
        `${defensePeriodBase}/councils/auto-code`,
        { method: "GET" },
      ),
    finalize: (allowFinalizeAfterWarning: boolean, idempotencyKey?: string) =>
      fetchData<ApiResponse<boolean>>(`${defensePeriodBase}/finalize`, {
        method: "POST",
        body: {
          allowFinalizeAfterWarning,
          idempotencyKey: idempotencyKey ?? makeIdempotencyKey("FINALIZE"),
        },
        headers: {
          "Idempotency-Key": idempotencyKey ?? makeIdempotencyKey("FINALIZE"),
        },
      }),
    rollback: (payload: Record<string, unknown>, idempotencyKey?: string) =>
      fetchData<ApiResponse<Record<string, unknown>>>(
        `${defensePeriodBase}/rollback`,
        {
          method: "POST",
          body: {
            ...payload,
            idempotencyKey: idempotencyKey ?? makeIdempotencyKey("ROLLBACK"),
          },
          headers: {
            "Idempotency-Key": idempotencyKey ?? makeIdempotencyKey("ROLLBACK"),
          },
        },
      ),
    publishScores: (idempotencyKey?: string) =>
      fetchData<ApiResponse<boolean>>(`${defensePeriodBase}/publish-scores`, {
        method: "POST",
        body: {
          idempotencyKey: idempotencyKey ?? makeIdempotencyKey("PUBLISH"),
        },
        headers: {
          "Idempotency-Key": idempotencyKey ?? makeIdempotencyKey("PUBLISH"),
        },
      }),
    analyticsOverview: () =>
      fetchData<ApiResponse<Record<string, unknown>>>(
        `${defensePeriodBase}/analytics/overview`,
        { method: "GET" },
      ),
    analyticsByCouncil: () =>
      fetchData<ApiResponse<Record<string, unknown>[]>>(
        `${defensePeriodBase}/analytics/by-council`,
        { method: "GET" },
      ),
    analyticsDistribution: () =>
      fetchData<ApiResponse<Record<string, unknown>>>(
        `${defensePeriodBase}/analytics/distribution`,
        { method: "GET" },
      ),
    scoringMatrix: (committeeId?: string) =>
      fetchData<ApiResponse<Record<string, unknown>[]>>(
        `${defensePeriodBase}/scoring/matrix${committeeId ? `?committeeId=${encodeURIComponent(committeeId)}` : ""}`,
        { method: "GET" },
      ),
    scoringProgress: (committeeId?: string) =>
      fetchData<ApiResponse<Record<string, unknown>[]>>(
        `${defensePeriodBase}/scoring/progress${committeeId ? `?committeeId=${encodeURIComponent(committeeId)}` : ""}`,
        { method: "GET" },
      ),
    scoringAlerts: (committeeId?: string) =>
      fetchData<ApiResponse<Record<string, unknown>[]>>(
        `${defensePeriodBase}/scoring/alerts${committeeId ? `?committeeId=${encodeURIComponent(committeeId)}` : ""}`,
        { method: "GET" },
      ),
    reportsExportHistory: () =>
      fetchData<ApiResponse<Record<string, unknown>[]>>(
        `${defensePeriodBase}/reports/export-history`,
        { method: "GET" },
      ),
    publishHistory: () =>
      fetchData<ApiResponse<Record<string, unknown>[]>>(
        `${defensePeriodBase}/publish-history`,
        { method: "GET" },
      ),
    councilsAuditHistory: (councilId?: string) =>
      fetchData<ApiResponse<Record<string, unknown>[]>>(
        `${defensePeriodBase}/councils/audit-history${councilId ? `?councilId=${encodeURIComponent(councilId)}` : ""}`,
        { method: "GET" },
      ),
    revisionAuditTrail: (revisionId: string) =>
      fetchData<ApiResponse<Record<string, unknown>[]>>(
        `${defensePeriodBase}/revisions/${encodeURIComponent(revisionId)}/audit-trail`,
        { method: "GET" },
      ),
    reportCouncilSummaryUrl: (format: "xlsx" | "csv" | "pdf") =>
      `${defensePeriodBase}/reports/council-summary?format=${format}`,
    reportForm1Url: (councilId: string, format: "xlsx" | "csv" | "pdf") =>
      `${defensePeriodBase}/reports/form-1?councilId=${encodeURIComponent(councilId)}&format=${format}`,
    reportFinalTermUrl: (councilId: string, format: "xlsx" | "csv" | "pdf") =>
      `${defensePeriodBase}/reports/final-term?councilId=${encodeURIComponent(councilId)}&format=${format}`,
    syncErrorsExportUrl: (format: "xlsx" | "csv" | "json") =>
      `${defensePeriodBase}/sync/errors/export?format=${format}`,
  }), [defensePeriodBase]);
  const parseApiEnvelope = useCallback(<T,>(
    response: ApiResponse<T> | null | undefined,
  ) => {
    if (!response) {
      return { ok: false, data: null as T | null };
    }
    setApiSignal({
      at: new Date().toLocaleTimeString("vi-VN"),
      traceId: response.traceId,
      concurrencyToken: response.concurrencyToken ?? undefined,
      idempotencyReplay: response.idempotencyReplay,
      message: response.message ?? undefined,
    });
    if (response.allowedActions) {
      setBackendAllowedActions(response.allowedActions);
    }
    if (response.message) {
      notifyInfo(response.message);
    }
    if (response.warnings?.length) {
      notifyWarning(response.warnings.map((w) => w.message).join(" | "));
    }
    if (!response.success && response.errors) {
      const messages = Object.values(response.errors).flat().filter(Boolean);
      if (messages.length) {
        notifyError(messages.join(" | "));
      }
    }
    return { ok: Boolean(response.success), data: response.data ?? null };
  }, [notifyError, notifyInfo, notifyWarning]);

  const [exportMinutes, setExportMinutes] = useState(true);
  const [exportScores, setExportScores] = useState(true);

  const hydrateReadinessState = (
    payload: Record<string, unknown> | null | undefined,
  ) => {
    const marker =
      payload?.readiness ??
      payload?.status ??
      payload?.result ??
      payload?.state;
    const explicitReady = payload?.isReady;
    const inferredReady =
      typeof explicitReady === "boolean"
        ? explicitReady
        : typeof marker === "string"
          ? ["READY", "PASS", "OK", "GREEN"].includes(marker.toUpperCase())
          : true;

    setReadinessReady(inferredReady);
    setReadinessNote(payload?.message ? String(payload.message) : "");
  };

  const hasAllowedAction = (action: string) =>
    backendAllowedActions.length === 0 ||
    backendAllowedActions.includes(action);

  useEffect(() => {
    const hydrateFromBackend = async () => {
      try {
        const [
          stateRes,
          readinessRes,
          configRes,
          councilsRes,
          studentsRes,
          capabilityRes,
          syncHistoryRes,
          exportHistoryRes,
          publishHistoryRes,
          scoringMatrixRes,
        ] = await Promise.all([
          adminApi.getState() as Promise<
            ApiResponse<{
              lecturerCapabilitiesLocked: boolean;
              councilConfigConfirmed: boolean;
              finalized: boolean;
              scoresPublished: boolean;
              allowedActions: string[];
            }>
          >,
          adminApi.getReadinessCheck(),
          adminApi.getConfig() as Promise<
            ApiResponse<{
              rooms: string[];
              morningStart: string;
              afternoonStart: string;
              softMaxCapacity: number;
              topicsPerSessionConfig: number;
              membersPerCouncilConfig: number;
              tags: string[];
            }>
          >,
          adminApi.getCouncils() as Promise<
            ApiResponse<{ items: Array<Record<string, unknown>> }>
          >,
          adminApi.getStudents(true),
          adminApi.getLecturerCapabilities(),
          adminApi.getSyncHistory(),
          adminApi.reportsExportHistory(),
          adminApi.publishHistory(),
          adminApi.scoringMatrix(),
        ]);
        parseApiEnvelope(stateRes);
        parseApiEnvelope(readinessRes);
        parseApiEnvelope(configRes);
        parseApiEnvelope(councilsRes);

        const stateData = stateRes?.data;
        const readinessData = readinessRes?.data as
          | Record<string, unknown>
          | null
          | undefined;
        const configData = configRes?.data;
        const councilsData = councilsRes?.data;
        const studentsData = (studentsRes?.data ?? []) as Array<
          Record<string, unknown>
        >;
        const capabilityData = (capabilityRes?.data ?? []) as Array<
          Record<string, unknown>
        >;
        const syncHistoryData = (syncHistoryRes?.data ?? []) as Array<
          Record<string, unknown>
        >;
        const exportHistoryData = (exportHistoryRes?.data ?? []) as Array<
          Record<string, unknown>
        >;
        const publishHistoryData = (publishHistoryRes?.data ?? []) as Array<
          Record<string, unknown>
        >;

        setStudents(
          studentsData.map((item) => ({
            studentCode: String(item.studentCode ?? ""),
            topicCode: item.topicCode ? String(item.topicCode) : undefined,
            studentName: String(item.studentName ?? ""),
            topicTitle: String(item.topicTitle ?? ""),
            supervisorCode: String(item.supervisorCode ?? ""),
            tags: Array.isArray(item.tags) ? (item.tags as string[]) : [],
            isEligible: Boolean(item.isEligible ?? true),
            valid: Boolean(item.valid ?? true),
            error: item.error ? String(item.error) : undefined,
          })),
        );

        setLecturerCapabilities(
          capabilityData.map((item) => ({
            lecturerCode: String(item.lecturerCode ?? ""),
            lecturerName: String(item.lecturerName ?? ""),
            tags: Array.isArray(item.tags) ? (item.tags as string[]) : [],
            busySlots: Array.isArray(item.busySlots)
              ? (item.busySlots as string[])
              : [],
            warning: item.warning ? String(item.warning) : undefined,
          })),
        );

        setSyncAuditLogs(
          syncHistoryData.map((item) => ({
            timestamp: String(item.timestamp ?? item.createdAt ?? ""),
            action: String(item.action ?? "Sync"),
            result:
              item.result === "Success" ||
              item.result === "Partial" ||
              item.result === "Timeout"
                ? (item.result as "Success" | "Partial" | "Timeout")
                : "Success",
            records: String(item.records ?? item.totalCount ?? "0"),
          })),
        );

        setExportJobs(
          exportHistoryData.map((item) => ({
            id: String(item.id ?? ""),
            scope: String(item.scope ?? item.reportName ?? ""),
            status:
              item.status === "Running" || item.status === "Retry"
                ? (item.status as "Running" | "Retry")
                : "Done",
            duration: String(item.duration ?? ""),
          })),
        );

        setPublishBatches(
          publishHistoryData.map((item) => ({
            id: String(item.id ?? ""),
            term: String(item.term ?? ""),
            totalStudents: Number(item.totalStudents ?? 0),
            publishedAt: String(item.publishedAt ?? "--"),
            status: item.status === "Published" ? "Published" : "Draft",
          })),
        );

        const scoringMatrixData = (scoringMatrixRes?.data ?? []) as Array<
          Record<string, unknown>
        >;
        setScoreRows(
          scoringMatrixData.map((item) => {
            const score = Number(item.score ?? item.finalScore ?? 0);
            return {
              councilId: String(
                item.councilId ?? item.committeeId ?? item.committeeCode ?? "",
              ),
              room: String(item.room ?? "-"),
              session:
                String(item.session ?? "Sáng")
                  .toUpperCase()
                  .includes("CHIEU") ||
                String(item.session ?? "")
                  .toUpperCase()
                  .includes("AFTERNOON")
                  ? "Chiều"
                  : "Sáng",
              studentCode: String(item.studentCode ?? ""),
              studentName: String(item.studentName ?? "-"),
              topicTitle: String(item.topicTitle ?? "-"),
              score: Number.isFinite(score) ? score : 0,
              grade: String(item.grade ?? item.finalLetter ?? "-"),
            };
          }),
        );

        if (stateData) {
          setBackendAllowedActions(stateData.allowedActions ?? []);
          setCapabilitiesLocked(Boolean(stateData.lecturerCapabilitiesLocked));
          setCouncilConfigConfirmed(Boolean(stateData.councilConfigConfirmed));
          setIsFinalized(Boolean(stateData.finalized));
          setPublished(Boolean(stateData.scoresPublished));
        }

        hydrateReadinessState(readinessData);

        if (configData) {
          setSelectedRooms(configData.rooms ?? []);
          setMorningStart(configData.morningStart ?? "08:00");
          setAfternoonStart(configData.afternoonStart ?? "13:30");
          setMaxCapacity(Number(configData.softMaxCapacity ?? 4));
          setTopicsPerSessionConfig(
            Number(configData.topicsPerSessionConfig ?? 4),
          );
          setMembersPerCouncilConfig(
            Number(configData.membersPerCouncilConfig ?? 4),
          );
          setConfigCouncilTags(configData.tags ?? []);
          setConfigSaved(true);
        }

        const rawItems = (councilsData?.items ?? []) as Array<{
          committeeCode?: string;
          concurrencyToken?: string;
          room?: string;
          defenseDate?: string | null;
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

        if (rawItems.length > 0) {
          const mapped: CouncilDraft[] = rawItems.map((item, index) => ({
            id:
              item.committeeCode ?? `HD-${String(index + 1).padStart(2, "0")}`,
            concurrencyToken: item.concurrencyToken
              ? String(item.concurrencyToken)
              : undefined,
            room: item.room ?? selectedRoomsRef.current[0] ?? "",
            defenseDate: item.defenseDate
              ? String(item.defenseDate).slice(0, 10)
              : autoStartDateRef.current,
            session: "Sang",
            slotId: `${item.committeeCode ?? `HD-${index + 1}`}-FULLDAY`,
            councilTags: item.councilTags ?? [],
            morningStudents: (item.morningStudents ?? [])
              .map((s) => s.studentCode ?? "")
              .filter(Boolean),
            afternoonStudents: (item.afternoonStudents ?? [])
              .map((s) => s.studentCode ?? "")
              .filter(Boolean),
            assignments: (item.assignments ?? [])
              .map((assignment) => ({
                assignmentId: Number(assignment.assignmentId ?? 0),
                studentCode: String(assignment.studentCode ?? ""),
                topicCode: assignment.topicCode
                  ? String(assignment.topicCode)
                  : undefined,
                sessionCode: (Number(
                  assignment.session ?? assignment.sessionCode,
                ) === 2
                  ? "AFTERNOON"
                  : "MORNING") as "AFTERNOON" | "MORNING",
                orderIndex: Number(assignment.orderIndex ?? 0) || undefined,
              }))
              .filter(
                (assignment) =>
                  assignment.assignmentId > 0 && assignment.studentCode,
              ),
            forbiddenLecturers: item.forbiddenLecturers ?? [],
            members: (item.members ?? []).map((m) => ({
              role: m.role ?? "UV",
              lecturerCode: m.lecturerCode ?? "",
              lecturerName: m.lecturerName ?? "",
            })),
            warning: item.warning ?? undefined,
          }));
          setDrafts(mapped);
          setSelectedCouncilId(mapped[0]?.id ?? "");
        }
      } catch {
        notifyWarning(
          "Không tải được state/config từ BE, hệ thống dùng dữ liệu màn hình hiện tại.",
        );
      } finally {
        setStateHydrated(true);
      }
    };

    void hydrateFromBackend();
  }, [adminApi, defensePeriodId, notifyWarning, parseApiEnvelope]);

  const activeStageIndex = useMemo(
    () =>
      Math.max(
        0,
        stages.findIndex((item) => item.key === activeStage),
      ),
    [activeStage],
  );

  const activeStageLabel = useMemo(
    () => stages[activeStageIndex]?.label ?? "-",
    [activeStageIndex],
  );

  const validRows = useMemo(
    () => students.filter((item: EligibleStudent) => item.valid),
    [students],
  );

  const hasTimeConflict = useMemo(
    () => morningEnd >= afternoonStart,
    [morningEnd, afternoonStart],
  );

  const hasDateRangeConflict = useMemo(
    () => autoEndDate < autoStartDate,
    [autoStartDate, autoEndDate],
  );

  const normalizeRoleText = (role: string) =>
    role
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toUpperCase();

  const isChairRole = (role: string) => {
    const normalized = normalizeRoleText(role);
    return (
      normalized === "CT" ||
      normalized === "CHAIR" ||
      normalized.includes("CHU TICH")
    );
  };

  const isSecretaryRole = (role: string) => {
    const normalized = normalizeRoleText(role);
    return (
      normalized === "TK" ||
      normalized === "SECRETARY" ||
      normalized.includes("THU KY")
    );
  };

  const allTags = useMemo(() => {
    const values = new Set<string>();
    students.forEach((item: EligibleStudent) =>
      item.tags.forEach((tag) => values.add(tag)),
    );
    lecturerCapabilities.forEach((item: LecturerCapability) =>
      item.tags.forEach((tag) => values.add(tag)),
    );
    return Array.from(values).sort();
  }, [students, lecturerCapabilities]);

  const eligibleStudents = useMemo(
    () =>
      validRows.filter(
        (item: EligibleStudent) =>
          item.isEligible && Boolean(item.supervisorCode),
      ),
    [validRows],
  );

  const canCreateCouncils =
    configSaved &&
    councilConfigConfirmed &&
    capabilitiesLocked &&
    !hasTimeConflict &&
    !hasDateRangeConflict &&
    selectedRooms.length > 0;

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
        const status: CommitteeStatus = published
          ? "Published"
          : hasWarning
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
    [drafts, isFinalized, published],
  );

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

  const availableRooms = useMemo(
    () => Array.from(new Set(councilRows.map((item) => item.room))),
    [councilRows],
  );

  const roomOptions = useMemo(() => {
    const values = new Set<string>();
    selectedRooms.forEach((room) => values.add(room));
    availableRooms.forEach((room) => values.add(room));
    availableAutoRooms.forEach((room) => values.add(room));
    return Array.from(values).filter(Boolean).sort();
  }, [selectedRooms, availableRooms, availableAutoRooms]);

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
    return `HD-2026-${String(max + 1).padStart(2, "0")}`;
  }, [editableDrafts]);

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
      const tags = (topic.tagCodes ?? []).join(" ").toLowerCase();
      return (
        code.includes(keyword) ||
        title.includes(keyword) ||
        tags.includes(keyword)
      );
    });
  }, [availableAutoTopics, topicSearchKeyword]);

  const mapApiCommitteeToDraft = (
    item: AutoGenerateCommitteeApi,
    index: number,
  ): CouncilDraft => {
    const code =
      item.committeeCode ||
      `HD-${defensePeriodId}-${String(index + 1).padStart(2, "0")}`;
    const assignments = Array.isArray(item.assignments) ? item.assignments : [];
    const morningStudents = assignments
      .filter(
        (assignment) =>
          Number(assignment.session) === 1 || Number(assignment.session) === 0,
      )
      .map((assignment) => assignment.studentCode ?? "")
      .filter(Boolean);
    const afternoonStudents = assignments
      .filter((assignment) => Number(assignment.session) === 2)
      .map((assignment) => assignment.studentCode ?? "")
      .filter(Boolean);
    const members: CouncilMember[] = (item.members ?? []).map((member) => ({
      role: member.role ?? "UV",
      lecturerCode: member.lecturerCode ?? "",
      lecturerName:
        member.lecturerName ?? getLecturerNameByCode(member.lecturerCode ?? ""),
    }));
    const assignmentRows: CouncilAssignment[] = assignments
      .map((assignment) => ({
        assignmentId: Number(
          (assignment as Record<string, unknown>).assignmentId ?? 0,
        ),
        studentCode: String(assignment.studentCode ?? ""),
        topicCode: (assignment as Record<string, unknown>).topicCode
          ? String((assignment as Record<string, unknown>).topicCode)
          : undefined,
        sessionCode: (Number(assignment.session) === 2
          ? "AFTERNOON"
          : "MORNING") as "AFTERNOON" | "MORNING",
        orderIndex:
          Number((assignment as Record<string, unknown>).orderIndex ?? 0) ||
          undefined,
      }))
      .filter((assignment) => assignment.studentCode);

    return {
      id: code,
      concurrencyToken: item.concurrencyToken ?? undefined,
      room: item.room ?? selectedRooms[0] ?? roomOptions[0] ?? "",
      defenseDate: item.defenseDate ?? autoStartDate,
      session: "Sang",
      slotId: `${code}-AUTO`,
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
    const councilsRes = (await adminApi.getCouncils()) as ApiResponse<{
      items?: Array<Record<string, unknown>>;
    }>;
    const parsed = parseApiEnvelope(councilsRes);
    if (!parsed.ok) {
      return [] as CouncilDraft[];
    }
    const rawItems = (parsed.data?.items ?? []) as Array<{
      committeeCode?: string;
      concurrencyToken?: string;
      room?: string;
      defenseDate?: string | null;
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
    const mapped: CouncilDraft[] = rawItems.map((item, index) => ({
      id: item.committeeCode ?? `HD-${String(index + 1).padStart(2, "0")}`,
      concurrencyToken: item.concurrencyToken
        ? String(item.concurrencyToken)
        : undefined,
      room: item.room ?? selectedRooms[0] ?? "",
      defenseDate: item.defenseDate
        ? String(item.defenseDate).slice(0, 10)
        : autoStartDate,
      session: "Sang",
      slotId: `${item.committeeCode ?? `HD-${index + 1}`}-FULLDAY`,
      councilTags: item.councilTags ?? [],
      morningStudents: (item.morningStudents ?? [])
        .map((s) => s.studentCode ?? "")
        .filter(Boolean),
      afternoonStudents: (item.afternoonStudents ?? [])
        .map((s) => s.studentCode ?? "")
        .filter(Boolean),
      assignments: (item.assignments ?? [])
        .map((assignment) => ({
          assignmentId: Number(assignment.assignmentId ?? 0),
          studentCode: String(assignment.studentCode ?? ""),
          topicCode: assignment.topicCode
            ? String(assignment.topicCode)
            : undefined,
          sessionCode: (Number(assignment.session ?? assignment.sessionCode) ===
          2
            ? "AFTERNOON"
            : "MORNING") as "AFTERNOON" | "MORNING",
          orderIndex: Number(assignment.orderIndex ?? 0) || undefined,
        }))
        .filter(
          (assignment) => assignment.assignmentId > 0 && assignment.studentCode,
        ),
      forbiddenLecturers: item.forbiddenLecturers ?? [],
      members: (item.members ?? []).map((m) => ({
        role: m.role ?? "UV",
        lecturerCode: m.lecturerCode ?? "",
        lecturerName: m.lecturerName ?? "",
      })),
      warning: item.warning ?? undefined,
    }));
    setDrafts(mapped);
    setSelectedCouncilId((prev) =>
      mapped.some((item) => item.id === prev) ? prev : (mapped[0]?.id ?? ""),
    );
    return mapped;
  };

  const buildCouncilUpsertPayload = (
    draft: CouncilDraft,
    concurrencyToken?: string,
  ) => ({
    committeeCode: draft.id,
    room: draft.room,
    councilTags: draft.councilTags,
    morningStudentCodes: draft.morningStudents,
    afternoonStudentCodes: draft.afternoonStudents,
    members: draft.members.map((member) => ({
      role: member.role,
      lecturerCode: member.lecturerCode,
    })),
    ...(concurrencyToken ? { concurrencyToken } : {}),
  });

  const getSessionSlotMeta = (studentCode: string) => {
    const inMorning = manualMorningStudents.includes(studentCode);
    const pool = inMorning ? manualMorningStudents : manualAfternoonStudents;
    const sessionCode: "MORNING" | "AFTERNOON" = inMorning
      ? "MORNING"
      : "AFTERNOON";
    const orderIndex = Math.max(1, pool.indexOf(studentCode) + 1);
    const startTime = inMorning ? morningStart : afternoonStart;
    const endTime = inMorning ? morningEnd : afternoonEnd;
    return { sessionCode, orderIndex, startTime, endTime };
  };

  const fetchCouncilAssignmentMap = async (councilId: string) => {
    const detailRes = await adminApi.getCouncilById(councilId);
    const parsed = parseApiEnvelope(detailRes);
    if (!parsed.ok || !parsed.data) {
      return new Map<string, CouncilAssignment>();
    }

    const detail = parsed.data as Record<string, unknown>;
    const rawAssignments = (detail.assignments ?? detail.topics ?? []) as Array<
      Record<string, unknown>
    >;
    const map = new Map<string, CouncilAssignment>();

    rawAssignments.forEach((item) => {
      const studentCode = String(item.studentCode ?? "");
      const assignmentId = Number(item.assignmentId ?? 0);
      if (!studentCode || assignmentId <= 0) {
        return;
      }
      map.set(studentCode, {
        assignmentId,
        studentCode,
        topicCode: item.topicCode ? String(item.topicCode) : undefined,
        sessionCode:
          Number(item.session ?? item.sessionCode) === 2
            ? "AFTERNOON"
            : "MORNING",
        orderIndex: Number(item.orderIndex ?? 0) || undefined,
      });
    });

    return map;
  };

  const loadAutoGenerateConfig = async () => {
    setLoadingAutoGenerateConfig(true);
    try {
      const configRes = await fetchData<
        ApiResponse<{
          rooms: string[];
          topics: Array<Record<string, unknown>>;
          lecturers: Array<Record<string, unknown>>;
        }>
      >(`${defensePeriodBase}/auto-generate/config`, { method: "GET" });
      const parsed = parseApiEnvelope(configRes);
      if (!parsed.ok) {
        return;
      }
      const rooms = (configRes?.data?.rooms ?? []).filter(Boolean);
      const topics = (
        (configRes?.data?.topics ?? []) as AutoGenerateTopicDto[]
      ).filter((topic) => !!(topic.topicCode || topic.topicId));
      const lecturers = (
        (configRes?.data?.lecturers ?? []) as AutoGenerateLecturerDto[]
      ).filter(
        (lecturer) =>
          (lecturer.availability ?? true) &&
          !!(lecturer.lecturerCode || lecturer.lecturerId),
      );

      setAvailableAutoRooms(rooms.length ? rooms : selectedRooms);
      setSelectedRooms((prev) =>
        prev.length
          ? prev.filter((room) => rooms.includes(room))
          : rooms.slice(0, 2),
      );
      setAvailableAutoTopics(topics);
      setAvailableAutoLecturers(lecturers);
      setSelectedAutoTopicIds(
        topics
          .map((topic) => topic.topicId ?? topic.topicCode ?? "")
          .slice(0, 12),
      );
      setSelectedAutoLecturerIds(
        lecturers.map(
          (lecturer) => lecturer.lecturerId ?? lecturer.lecturerCode ?? "",
        ),
      );
    } catch {
      notifyWarning(
        "Không tải được dữ liệu cấu hình tự động từ BE. Sử dụng dữ liệu hiện tại để tiếp tục.",
      );
      setAvailableAutoRooms(selectedRooms);
      setAvailableAutoTopics(
        eligibleStudents.map((student) => ({
          topicId: student.studentCode,
          topicCode: student.studentCode,
          title: student.topicTitle,
          tagCodes: student.tags,
          studentCode: student.studentCode,
          supervisorCode: student.supervisorCode,
        })),
      );
      setAvailableAutoLecturers(
        lecturerCapabilities.map((lecturer) => ({
          lecturerId: lecturer.lecturerCode,
          lecturerCode: lecturer.lecturerCode,
          lecturerName: lecturer.lecturerName,
          degree: "",
          tagCodes: lecturer.tags,
          availability: true,
        })),
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

  const toggleAutoLecturer = (lecturerId: number | string) => {
    setSelectedAutoLecturerIds((prev) =>
      prev.includes(lecturerId)
        ? prev.filter((id) => id !== lecturerId)
        : [...prev, lecturerId],
    );
  };

  const submitAutoGenerate = async () => {
    if (selectedRooms.length === 0) {
      notifyError("Cần chọn ít nhất 1 phòng để tạo hội đồng tự động.");
      return;
    }
    if (selectedAutoTopicIds.length === 0) {
      notifyError("Cần chọn ít nhất 1 đề tài hợp lệ.");
      return;
    }
    if (selectedAutoLecturerIds.length === 0) {
      notifyError("Cần chọn ít nhất 1 giảng viên hợp lệ.");
      return;
    }

    const payload = {
      selectedRooms,
      tags: configCouncilTags,
      strategy: {
        groupByTag: autoGroupByTag,
        maxPerSession: topicsPerSessionConfig,
        prioritizeMatchTag: autoPrioritizeMatchTag,
        heuristicWeights: {
          tagMatchWeight: 0.5,
          workloadWeight: 0.2,
          availabilityWeight: 0.15,
          fairnessWeight: 0.15,
          consecutiveCommitteePenaltyWeight: 0.2,
        },
      },
      constraints: {
        avoidSupervisorConflict: autoAvoidSupervisorConflict,
        avoidLecturerOverlap: autoAvoidLecturerOverlap,
        requireRoles: ["CT", "TK"],
      },
    };

    setAssignmentLoading(true);
    setActionInFlight("Tạo hội đồng tự động");
    try {
      const idempotencyKey = makeIdempotencyKey("AUTOGEN");
      const response = await fetchData<ApiResponse<Record<string, unknown>>>(
        `${defensePeriodBase}/committees/auto-generate`,
        {
          method: "POST",
          body: {
            ...payload,
            idempotencyKey,
          },
          headers: {
            "Idempotency-Key": idempotencyKey,
          },
        },
      );
      const parsed = parseApiEnvelope(response);
      if (!parsed.ok) {
        return;
      }

      const generated = (
        (response?.data as { committees?: AutoGenerateCommitteeApi[] } | null)
          ?.committees ?? []
      ).map(mapApiCommitteeToDraft);
      setDrafts(generated);
      setSelectedCouncilId(generated[0]?.id ?? "");
      setCouncilPage(1);
      setShowAutoGenerateModal(false);
      const warnings =
        (response?.data as { warnings?: string[] } | null)?.warnings ?? [];
      if (warnings.length) {
        notifyWarning(
          `Tạo tự động hoàn tất với cảnh báo: ${warnings.join(" ")}`,
        );
      } else if (response?.idempotencyReplay) {
        notifyInfo(
          "Yêu cầu tạo tự động đã được xử lý trước đó (idempotency replay).",
        );
      } else {
        notifySuccess(
          `Đã tạo ${(response?.data as { committeesCreated?: number } | null)?.committeesCreated ?? generated.length} hội đồng, phân công ${(response?.data as { topicsAssigned?: number } | null)?.topicsAssigned ?? 0} đề tài.`,
        );
      }
    } catch {
      notifyError(
        "Tạo hội đồng tự động thất bại. Vui lòng kiểm tra cấu hình và thử lại.",
      );
    } finally {
      setAssignmentLoading(false);
      setActionInFlight(null);
    }
  };

  const loadRollbackAvailability = async () => {
    setLoadingRollbackAvailability(true);
    setActionInFlight("Kiểm tra rollback availability");
    try {
      const response = await fetchData<
        ApiResponse<RollbackAvailabilityResponse>
      >(`${defensePeriodBase}/rollback/availability`, {
        method: "GET",
      });
      const parsed = parseApiEnvelope(response);
      if (!parsed.ok) {
        return;
      }
      setRollbackAvailability(parsed.data ?? null);
    } catch {
      notifyError("Không tải được trạng thái rollback availability.");
    } finally {
      setLoadingRollbackAvailability(false);
      setActionInFlight(null);
    }
  };

  const executeRollback = async () => {
    const target = window.prompt(
      "Nhập target rollback: PUBLISH | FINALIZE | ALL",
      "PUBLISH",
    );
    if (!target) return;
    const normalizedTarget = target.trim().toUpperCase();
    if (!["PUBLISH", "FINALIZE", "ALL"].includes(normalizedTarget)) {
      notifyWarning(
        "Target rollback không hợp lệ. Chỉ nhận PUBLISH, FINALIZE hoặc ALL.",
      );
      return;
    }

    const reason = window.prompt(
      "Nhập lý do rollback",
      "Điều chỉnh nghiệp vụ theo yêu cầu hội đồng",
    );
    if (!reason || !reason.trim()) {
      notifyError("Rollback bắt buộc nhập lý do.");
      return;
    }

    if (!window.confirm(`Xác nhận rollback target ${normalizedTarget}?`))
      return;

    setRollbackWorking(true);
    setActionInFlight("Rollback đợt bảo vệ");
    try {
      const idempotencyKey = makeIdempotencyKey("ROLLBACK");
      const response = await fetchData<
        ApiResponse<{
          periodStatusAfter?: string;
          updatedCommitteeCount?: number;
        }>
      >(`${defensePeriodBase}/rollback`, {
        method: "POST",
        body: {
          target: normalizedTarget as "PUBLISH" | "FINALIZE" | "ALL",
          reason: reason.trim(),
          forceUnlockScores: true,
          idempotencyKey,
        },
        headers: {
          "Idempotency-Key": idempotencyKey,
        },
      });
      const parsed = parseApiEnvelope(response);
      if (!parsed.ok) {
        return;
      }

      const statusAfter = parsed.data?.periodStatusAfter ?? "Preparing";
      setIsFinalized(statusAfter.toUpperCase() === "FINALIZED");
      setPublished(statusAfter.toUpperCase() === "PUBLISHED");
      await loadRollbackAvailability();
      if (response?.idempotencyReplay) {
        notifyInfo("Rollback đã được xử lý trước đó (idempotency replay).");
      } else {
        notifySuccess(
          `Rollback thành công. Trạng thái sau rollback: ${statusAfter}. Cập nhật ${parsed.data?.updatedCommitteeCount ?? 0} hội đồng.`,
        );
      }
    } catch {
      notifyError("Rollback thất bại. Vui lòng kiểm tra điều kiện và thử lại.");
    } finally {
      setRollbackWorking(false);
      setActionInFlight(null);
    }
  };

  const scoreOverview = useMemo(() => {
    if (!scoreRows.length) {
      return {
        totalStudents: 0,
        average: 0,
        passRate: 0,
        highest: null as ScoreStatisticRow | null,
        lowest: null as ScoreStatisticRow | null,
      };
    }
    const total = scoreRows.length;
    const average =
      Math.round(
        (scoreRows.reduce((sum, row) => sum + row.score, 0) / total) * 100,
      ) / 100;
    const passRate =
      Math.round(
        (scoreRows.filter((row) => row.score >= 5).length / total) * 1000,
      ) / 10;
    const highest = scoreRows.reduce(
      (best, row) => (row.score > best.score ? row : best),
      scoreRows[0],
    );
    const lowest = scoreRows.reduce(
      (worst, row) => (row.score < worst.score ? row : worst),
      scoreRows[0],
    );
    return { totalStudents: total, average, passRate, highest, lowest };
  }, [scoreRows]);

  const councilScoreSummaries = useMemo(() => {
    return councilRows.map((council) => {
      const rows = scoreRows.filter((item) => item.councilId === council.id);
      const avg = rows.length
        ? Math.round(
            (rows.reduce((sum, item) => sum + item.score, 0) / rows.length) *
              100,
          ) / 100
        : 0;
      const max = rows.length ? Math.max(...rows.map((item) => item.score)) : 0;
      const min = rows.length ? Math.min(...rows.map((item) => item.score)) : 0;
      return {
        id: council.id,
        room: council.room,
        tags: council.councilTags.join(", "),
        studentCount: rows.length,
        avg,
        max,
        min,
      };
    });
  }, [councilRows, scoreRows]);

  const scoreDistribution = useMemo(() => {
    const total = Math.max(1, scoreRows.length);
    const excellent = scoreRows.filter((row) => row.score >= 8.5).length;
    const good = scoreRows.filter(
      (row) => row.score >= 7 && row.score < 8.5,
    ).length;
    const fair = scoreRows.filter(
      (row) => row.score >= 5.5 && row.score < 7,
    ).length;
    const weak = scoreRows.filter((row) => row.score < 5.5).length;
    return [
      {
        label: "Xuất sắc (>= 8.5)",
        count: excellent,
        color: "#166534",
        pct: Math.round((excellent / total) * 1000) / 10,
      },
      {
        label: "Khá (7.0 - 8.4)",
        count: good,
        color: "#1d4ed8",
        pct: Math.round((good / total) * 1000) / 10,
      },
      {
        label: "Đạt (5.5 - 6.9)",
        count: fair,
        color: "#b45309",
        pct: Math.round((fair / total) * 1000) / 10,
      },
      {
        label: "Cần cải thiện (< 5.5)",
        count: weak,
        color: "#b91c1c",
        pct: Math.round((weak / total) * 1000) / 10,
      },
    ];
  }, [scoreRows]);

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
    const stateRes = await fetchData<
      ApiResponse<{
        lecturerCapabilitiesLocked: boolean;
        councilConfigConfirmed: boolean;
        finalized: boolean;
        scoresPublished: boolean;
        allowedActions: string[];
      }>
    >(`${defensePeriodBase}/state`, { method: "GET" });
    const parsed = parseApiEnvelope(stateRes);
    const stateData = parsed.data;
    if (!stateData) {
      return;
    }

    setBackendAllowedActions(stateData.allowedActions ?? []);
    setCapabilitiesLocked(Boolean(stateData.lecturerCapabilitiesLocked));
    setCouncilConfigConfirmed(Boolean(stateData.councilConfigConfirmed));
    setIsFinalized(Boolean(stateData.finalized));
    setPublished(Boolean(stateData.scoresPublished));

    const readinessRes = await adminApi.getReadinessCheck();
    const readinessParsed = parseApiEnvelope(readinessRes);
    if (readinessParsed.ok) {
      hydrateReadinessState(
        (readinessParsed.data ?? {}) as Record<string, unknown>,
      );
    }
  };

  const syncData = async () => {
    setSyncing(true);
    setActionInFlight("Đồng bộ dữ liệu");
    setSyncStatus("idle");
    try {
      const idempotencyKey = makeIdempotencyKey("SYNC");
      const response = await fetchData<ApiResponse<Record<string, unknown>>>(
        `${defensePeriodBase}/sync`,
        {
          method: "POST",
          body: {
            retryOnFailure: true,
            idempotencyKey,
          },
          headers: {
            "Idempotency-Key": idempotencyKey,
          },
        },
      );
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
        ((studentParsed.data ?? []) as Array<Record<string, unknown>>).map(
          (item) => ({
            studentCode: String(item.studentCode ?? ""),
            topicCode: item.topicCode ? String(item.topicCode) : undefined,
            studentName: String(item.studentName ?? ""),
            topicTitle: String(item.topicTitle ?? ""),
            supervisorCode: String(item.supervisorCode ?? ""),
            tags: Array.isArray(item.tags) ? (item.tags as string[]) : [],
            isEligible: Boolean(item.isEligible ?? true),
            valid: Boolean(item.valid ?? true),
            error: item.error ? String(item.error) : undefined,
          }),
        ),
      );
      setSyncedAt(new Date().toLocaleString("vi-VN"));
      setSyncStatus("success");
      if (response?.warnings?.length) {
        notifyWarning(
          `Đồng bộ hoàn tất với cảnh báo: ${response.warnings.map((w) => w.message).join(" | ")}`,
        );
      } else if (response?.idempotencyReplay) {
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

  const simulateTimeout = () => {
    setSyncStatus("timeout");
    setSyncedAt(new Date().toLocaleString("vi-VN"));
    notifyWarning("Kết nối API đồng bộ bị timeout.");
  };

  const toggleRoom = (room: string) => {
    setConfigSaved(false);
    setSelectedRooms((prev: string[]) =>
      prev.includes(room)
        ? prev.filter((value: string) => value !== room)
        : [...prev, room],
    );
  };

  const saveConfig = async () => {
    if (hasTimeConflict || hasDateRangeConflict || selectedRooms.length === 0) {
      setConfigSaved(false);
      notifyError(
        "Không thể lưu cấu hình: kiểm tra ca thời gian, khoảng ngày và danh sách phòng.",
      );
      return;
    }
    try {
      setActionInFlight("Lưu cấu hình đợt");
      const response = await fetchData<ApiResponse<unknown>>(
        `${defensePeriodBase}/config`,
        {
          method: "PUT",
          body: {
            rooms: selectedRooms,
            morningStart,
            afternoonStart,
            softMaxCapacity: maxCapacity,
          },
        },
      );
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
    if (configCouncilTags.length === 0) {
      setCouncilConfigConfirmed(false);
      notifyWarning(
        "Vui lòng chọn ít nhất 1 tag hội đồng trước khi lưu cấu hình.",
      );
      return;
    }
    try {
      setActionInFlight("Lưu cấu hình hội đồng");
      const response = await fetchData<ApiResponse<boolean>>(
        `${defensePeriodBase}/council-config/confirm`,
        {
          method: "POST",
          body: {
            topicsPerSessionConfig,
            membersPerCouncilConfig,
            tags: configCouncilTags,
          },
        },
      );
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

  const lockCapabilities = async () => {
    try {
      setActionInFlight("Chốt năng lực giảng viên");
      const response = await fetchData<ApiResponse<boolean>>(
        `${defensePeriodBase}/lecturer-capabilities/lock`,
        {
          method: "PUT",
          body: {},
        },
      );
      const parsed = parseApiEnvelope(response);
      if (!parsed.ok) {
        return;
      }
      setCapabilitiesLocked(Boolean(parsed.data));
      notifySuccess("Đã chốt lịch bận và tag năng lực giảng viên.");
    } catch {
      notifyError("Chốt năng lực thất bại. Vui lòng thử lại.");
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
    if (!readinessReady) {
      notifyWarning(
        readinessNote ||
          "Readiness check chưa đạt, chưa thể chuyển sang bước phân hội đồng.",
      );
      return;
    }
    if (!canCreateCouncils) {
      notifyWarning(
        "Chưa đủ điều kiện để tạo hội đồng. Hãy hoàn tất khởi tạo, cấu hình và chốt năng lực.",
      );
      return;
    }
    setShowAutoGenerateModal(true);
    await loadAutoGenerateConfig();
  };

  const finalize = async () => {
    if (!drafts.length) {
      notifyWarning("Chưa có hội đồng nháp để chốt.");
      return;
    }
    if (hasUnresolvedWarning && !allowFinalizeAfterWarning) {
      notifyWarning(
        "Còn cảnh báo chưa xử lý. Bật tùy chọn cho phép chốt nếu muốn tiếp tục.",
      );
      return;
    }
    try {
      setActionInFlight("Finalize kỳ bảo vệ");
      const idempotencyKey = makeIdempotencyKey("FINALIZE");
      const response = await fetchData<ApiResponse<boolean>>(
        `${defensePeriodBase}/finalize`,
        {
          method: "POST",
          body: {
            allowFinalizeAfterWarning,
            idempotencyKey,
          },
          headers: {
            "Idempotency-Key": idempotencyKey,
          },
        },
      );
      const parsed = parseApiEnvelope(response);
      if (!parsed.ok) {
        return;
      }
      await refreshBackendState();
      if (response?.idempotencyReplay) {
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

  const publishAllScores = async () => {
    if (!isFinalized) {
      notifyWarning("Chỉ có thể công bố điểm sau khi đã chốt danh sách.");
      return;
    }
    try {
      setActionInFlight("Publish điểm");
      const idempotencyKey = makeIdempotencyKey("PUBLISH");
      const response = await fetchData<ApiResponse<boolean>>(
        `${defensePeriodBase}/publish-scores`,
        {
          method: "POST",
          body: { idempotencyKey },
          headers: {
            "Idempotency-Key": idempotencyKey,
          },
        },
      );
      const parsed = parseApiEnvelope(response);
      if (!parsed.ok) {
        return;
      }
      await refreshBackendState();
      if (response?.idempotencyReplay) {
        notifyInfo(
          "Yêu cầu công bố điểm đã được xử lý trước đó (idempotency replay).",
        );
      } else {
        notifySuccess("Đã công bố điểm đồng loạt.");
      }
    } catch {
      notifyError("Công bố điểm thất bại. Vui lòng thử lại.");
    } finally {
      setActionInFlight(null);
    }
  };

  const getLecturerNameByCode = (lecturerCode: string) =>
    lecturerCapabilities.find(
      (item: LecturerCapability) => item.lecturerCode === lecturerCode,
    )?.lecturerName ?? "";

  const buildStudentView = (codes: string[]) =>
    codes.map((studentCode) => {
      const student = findStudentByCode(studentCode);
      const supervisorCode = student?.supervisorCode ?? "";
      const supervisorName = supervisorCode
        ? getLecturerNameByCode(supervisorCode) || supervisorCode
        : "Chưa gán";
      return {
        studentCode,
        studentName: student?.studentName ?? "-",
        topicTitle: student?.topicTitle ?? "-",
        supervisorName,
      };
    });

  const allEligibleStudentCodes = useMemo(
    () => eligibleStudents.map((item: EligibleStudent) => item.studentCode),
    [eligibleStudents],
  );

  const resetManualForm = (defaultId?: string) => {
    const autoPicked = pickStudentsByTags(
      configCouncilTags.length ? configCouncilTags : allTags.slice(0, 2),
    );
    setManualId(defaultId ?? nextGeneratedCouncilId);
    setManualDefenseDate("2026-04-24");
    setManualRoom(selectedRooms[0] ?? roomOptions[0] ?? "");
    setManualCouncilTags(
      configCouncilTags.length ? configCouncilTags : allTags.slice(0, 2),
    );
    setManualMorningStudents(autoPicked.morning);
    setManualAfternoonStudents(autoPicked.afternoon);
    const selectedCodes = [...autoPicked.morning, ...autoPicked.afternoon];
    setManualRelatedStudents(selectedCodes);
    setManualUnrelatedStudents(
      allEligibleStudentCodes.filter((code) => !selectedCodes.includes(code)),
    );
    setManualMembers([
      { role: "CT", lecturerCode: "", lecturerName: "" },
      { role: "TK", lecturerCode: "", lecturerName: "" },
      { role: "PB", lecturerCode: "", lecturerName: "" },
      { role: "UV", lecturerCode: "", lecturerName: "" },
    ]);
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
    setCouncilConfigConfirmed(false);
    setConfigCouncilTags((prev: string[]) =>
      prev.includes(tag)
        ? prev.filter((item: string) => item !== tag)
        : [...prev, tag],
    );
  };

  const toggleManualCouncilTag = (tag: string) => {
    setManualCouncilTags((prev: string[]) => {
      const next = prev.includes(tag)
        ? prev.filter((item: string) => item !== tag)
        : [...prev, tag];
      const autoPicked = pickStudentsByTags(next);
      setManualMorningStudents(autoPicked.morning);
      setManualAfternoonStudents(autoPicked.afternoon);
      const selectedCodes = [...autoPicked.morning, ...autoPicked.afternoon];
      setManualRelatedStudents(selectedCodes);
      setManualUnrelatedStudents(
        allEligibleStudentCodes.filter((code) => !selectedCodes.includes(code)),
      );
      return next;
    });
  };

  const recomputeSessionStudents = (relatedCodes: string[]) => {
    const mid = Math.ceil(relatedCodes.length / 2);
    setManualMorningStudents(relatedCodes.slice(0, mid));
    setManualAfternoonStudents(relatedCodes.slice(mid));
  };

  const moveTopicToRelated = (studentCode: string) => {
    const nextRelated = [...manualRelatedStudents, studentCode];
    setManualRelatedStudents(nextRelated);
    setManualUnrelatedStudents((prev) =>
      prev.filter((code) => code !== studentCode),
    );
    recomputeSessionStudents(nextRelated);
  };

  const moveTopicToUnrelated = (studentCode: string) => {
    const nextRelated = manualRelatedStudents.filter(
      (code) => code !== studentCode,
    );
    setManualRelatedStudents(nextRelated);
    setManualUnrelatedStudents((prev) => [studentCode, ...prev]);
    recomputeSessionStudents(nextRelated);
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
    setManualId(target.id);
    setManualDefenseDate(target.defenseDate);
    setManualRoom(target.room);
    setManualCouncilTags(target.councilTags);
    setManualMorningStudents(target.morningStudents);
    setManualAfternoonStudents(target.afternoonStudents);
    const selectedCodes = [
      ...target.morningStudents,
      ...target.afternoonStudents,
    ];
    setManualRelatedStudents(selectedCodes);
    setManualUnrelatedStudents(
      allEligibleStudentCodes.filter((code) => !selectedCodes.includes(code)),
    );
    setManualMembers(target.members.map((member) => ({ ...member })));
    setCreateStep(1);
    setManualSnapshot({
      id: target.id,
      concurrencyToken: target.concurrencyToken,
      defenseDate: target.defenseDate,
      room: target.room,
      tags: [...target.councilTags],
      morning: [...target.morningStudents],
      afternoon: [...target.afternoonStudents],
      members: target.members.map((member) => ({ ...member })),
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
    const lecturerName = getLecturerNameByCode(lecturerCode);
    setManualMembers((prev: CouncilMember[]) =>
      prev.map((member: CouncilMember, idx: number) =>
        idx === index
          ? {
              ...member,
              lecturerCode,
              lecturerName,
            }
          : member,
      ),
    );
  };

  const addManualMemberSlot = () => {
    setManualMembers((prev) => [
      ...prev,
      {
        role: `UV${prev.length - 2 > 0 ? prev.length - 2 : ""}`,
        lecturerCode: "",
        lecturerName: "",
      },
    ]);
  };

  const removeManualMemberSlot = (index: number) => {
    setManualMembers((prev) => prev.filter((_, idx) => idx !== index));
  };

  const proceedCreateStep = (targetStep: 1 | 2 | 3) => {
    if (
      targetStep === 2 &&
      (!manualId.trim() || !manualDefenseDate || !manualRoom)
    ) {
      notifyError(
        "Bước 1 chưa đầy đủ: vui lòng nhập mã hội đồng, ngày và phòng.",
      );
      return;
    }
    if (targetStep === 3 && manualMembers.length === 0) {
      notifyError("Bước 2 chưa hợp lệ: cần ít nhất 1 thành viên hội đồng.");
      return;
    }
    if (targetStep === 3) {
      const chairCount = manualMembers.filter((item) =>
        isChairRole(item.role),
      ).length;
      const secretaryCount = manualMembers.filter((item) =>
        isSecretaryRole(item.role),
      ).length;
      if (chairCount !== 1 || secretaryCount !== 1) {
        notifyError(
          "Không thể sang bước 3: hội đồng phải có đúng 1 Chủ tịch và đúng 1 Thư ký.",
        );
        return;
      }
      const missingMemberInfo = manualMembers.some(
        (item) => !item.role.trim() || !item.lecturerCode,
      );
      if (missingMemberInfo) {
        notifyError(
          "Bước 2 chưa hoàn tất: mỗi slot phải có vai trò và giảng viên.",
        );
        return;
      }
    }
    if (targetStep === 3) {
      const duplicateLecturer = new Set<string>();
      for (const item of manualMembers) {
        if (!item.lecturerCode) continue;
        if (duplicateLecturer.has(item.lecturerCode)) {
          notifyError(
            "Một giảng viên không thể giữ nhiều vai trò trong cùng hội đồng.",
          );
          return;
        }
        duplicateLecturer.add(item.lecturerCode);
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
    setManualDefenseDate(manualSnapshot.defenseDate);
    setManualRoom(manualSnapshot.room);
    setManualCouncilTags([...manualSnapshot.tags]);
    setManualMorningStudents([...manualSnapshot.morning]);
    setManualAfternoonStudents([...manualSnapshot.afternoon]);
    const selectedCodes = [
      ...manualSnapshot.morning,
      ...manualSnapshot.afternoon,
    ];
    setManualRelatedStudents(selectedCodes);
    setManualUnrelatedStudents(
      allEligibleStudentCodes.filter((code) => !selectedCodes.includes(code)),
    );
    setManualMembers(manualSnapshot.members.map((member) => ({ ...member })));
    setManualReadOnly(true);
    notifyInfo("Đã hủy chỉnh sửa và khôi phục dữ liệu gốc.");
  };

  const saveManualCouncil = async () => {
    if (!manualId.trim()) {
      notifyError("Mã hội đồng không được để trống.");
      return;
    }

    if (!manualDefenseDate) {
      notifyError("Vui lòng chọn ngày bảo vệ.");
      return;
    }

    if (manualRelatedStudents.length === 0) {
      notifyError("Vui lòng chọn ít nhất 1 đề tài liên quan cho hội đồng.");
      return;
    }

    if (manualCouncilTags.length === 0) {
      notifyError("Vui lòng chọn ít nhất 1 tag cho hội đồng.");
      return;
    }

    const missingRoles = manualMembers.filter(
      (item: CouncilMember) => !item.lecturerCode || !item.role.trim(),
    );
    if (missingRoles.length > 0) {
      notifyError(
        "Vui lòng nhập vai trò và chọn giảng viên cho tất cả slot thành viên.",
      );
      return;
    }

    const chairCount = manualMembers.filter((item) =>
      isChairRole(item.role),
    ).length;
    const secretaryCount = manualMembers.filter((item) =>
      isSecretaryRole(item.role),
    ).length;
    if (chairCount !== 1 || secretaryCount !== 1) {
      notifyError(
        "Không thể lưu: hội đồng bắt buộc có đúng 1 Chủ tịch và đúng 1 Thư ký.",
      );
      return;
    }

    const unique = new Set(
      manualMembers.map((item: CouncilMember) => item.lecturerCode),
    );
    if (unique.size !== manualMembers.length) {
      notifyError(
        "Một giảng viên không thể giữ đồng thời nhiều vai trò trong cùng hội đồng.",
      );
      return;
    }

    const blockedSupervisors = new Set<string>();
    [...manualMorningStudents, ...manualAfternoonStudents].forEach(
      (studentCode: string) => {
        const supervisorCode = findStudentByCode(studentCode)?.supervisorCode;
        if (supervisorCode) blockedSupervisors.add(supervisorCode);
      },
    );
    const violating = manualMembers.find((member: CouncilMember) =>
      blockedSupervisors.has(member.lecturerCode),
    );
    if (violating) {
      notifyError(
        `Vi phạm ràng buộc: ${violating.lecturerCode} là GVHD của sinh viên trong hội đồng.`,
      );
      return;
    }

    if (
      manualMode !== "edit" &&
      editableDrafts.some((item: CouncilDraft) => item.id === manualId.trim())
    ) {
      notifyError("Mã hội đồng đã tồn tại. Vui lòng nhập mã khác.");
      return;
    }

    const draft: CouncilDraft = {
      id: manualId.trim(),
      concurrencyToken:
        manualMode === "edit" ? selectedCouncil?.concurrencyToken : undefined,
      room: manualRoom,
      defenseDate: manualDefenseDate,
      session: "Sang",
      slotId: `${manualId.trim()}-FULLDAY`,
      councilTags: manualCouncilTags,
      morningStudents: manualMorningStudents,
      afternoonStudents: manualAfternoonStudents,
      forbiddenLecturers: Array.from(blockedSupervisors),
      members: manualMembers,
      warning: undefined,
    };

    try {
      setActionInFlight(
        manualMode === "edit"
          ? `Cập nhật hội đồng ${draft.id}`
          : `Tạo hội đồng ${draft.id}`,
      );
      if (manualMode === "edit" && selectedCouncil) {
        let currentToken =
          selectedCouncil.concurrencyToken ?? manualSnapshot?.concurrencyToken;
        const previousMembers = manualSnapshot?.members ?? [];
        const previousMorning = manualSnapshot?.morning ?? [];
        const previousAfternoon = manualSnapshot?.afternoon ?? [];
        const previousStudentCodes = [...previousMorning, ...previousAfternoon];
        const nextStudentCodes = [
          ...manualMorningStudents,
          ...manualAfternoonStudents,
        ];

        const metadataChanged =
          manualRoom !== (manualSnapshot?.room ?? selectedCouncil.room) ||
          JSON.stringify([...manualCouncilTags].sort()) !==
            JSON.stringify(
              [...(manualSnapshot?.tags ?? selectedCouncil.councilTags)].sort(),
            );

        if (metadataChanged) {
          const metadataResponse = await adminApi.updateCouncil(
            selectedCouncil.id,
            buildCouncilUpsertPayload(
              {
                ...draft,
                members: previousMembers,
                morningStudents: previousMorning,
                afternoonStudents: previousAfternoon,
              },
              currentToken,
            ),
          );
          const metadataParsed = parseApiEnvelope(metadataResponse);
          if (!metadataParsed.ok) {
            return;
          }
          const refreshed = await reloadCouncilsFromBackend();
          currentToken =
            refreshed.find((item) => item.id === selectedCouncil.id)
              ?.concurrencyToken ?? currentToken;
        }

        const previousMemberMap = new Map(
          previousMembers.map((member) => [member.lecturerCode, member]),
        );
        const nextMemberMap = new Map(
          manualMembers.map((member) => [member.lecturerCode, member]),
        );

        for (const [lecturerCode] of previousMemberMap) {
          if (!nextMemberMap.has(lecturerCode) && currentToken) {
            const removeResponse = await adminApi.removeCouncilMember(
              selectedCouncil.id,
              lecturerCode,
              currentToken,
            );
            const removeParsed = parseApiEnvelope(removeResponse);
            if (!removeParsed.ok) {
              return;
            }
            const refreshed = await reloadCouncilsFromBackend();
            currentToken =
              refreshed.find((item) => item.id === selectedCouncil.id)
                ?.concurrencyToken ?? currentToken;
          }
        }

        for (const [lecturerCode, member] of nextMemberMap) {
          const previous = previousMemberMap.get(lecturerCode);
          if (!previous) {
            const addResponse = await adminApi.addCouncilMember(
              selectedCouncil.id,
              {
                concurrencyToken: currentToken,
                role: member.role,
                lecturerCode,
              },
            );
            const addParsed = parseApiEnvelope(addResponse);
            if (!addParsed.ok) {
              return;
            }
            const refreshed = await reloadCouncilsFromBackend();
            currentToken =
              refreshed.find((item) => item.id === selectedCouncil.id)
                ?.concurrencyToken ?? currentToken;
            continue;
          }
          if (previous.role !== member.role) {
            const updateResponse = await adminApi.updateCouncilMember(
              selectedCouncil.id,
              lecturerCode,
              {
                concurrencyToken: currentToken,
                role: member.role,
                lecturerCode,
              },
            );
            const updateParsed = parseApiEnvelope(updateResponse);
            if (!updateParsed.ok) {
              return;
            }
            const refreshed = await reloadCouncilsFromBackend();
            currentToken =
              refreshed.find((item) => item.id === selectedCouncil.id)
                ?.concurrencyToken ?? currentToken;
          }
        }

        const assignmentMap = await fetchCouncilAssignmentMap(
          selectedCouncil.id,
        );
        const previousSet = new Set(previousStudentCodes);
        const nextSet = new Set(nextStudentCodes);

        for (const studentCode of previousSet) {
          if (!nextSet.has(studentCode) && currentToken) {
            const assignment = assignmentMap.get(studentCode);
            if (!assignment) {
              continue;
            }
            const removeResponse = await adminApi.removeCouncilTopic(
              selectedCouncil.id,
              assignment.assignmentId,
              currentToken,
            );
            const removeParsed = parseApiEnvelope(removeResponse);
            if (!removeParsed.ok) {
              return;
            }
            const refreshed = await reloadCouncilsFromBackend();
            currentToken =
              refreshed.find((item) => item.id === selectedCouncil.id)
                ?.concurrencyToken ?? currentToken;
          }
        }

        for (const studentCode of nextSet) {
          const slot = getSessionSlotMeta(studentCode);
          const assignment = assignmentMap.get(studentCode);
          const student = findStudentByCode(studentCode);
          if (!assignment) {
            const addResponse = await adminApi.addCouncilTopic(
              selectedCouncil.id,
              {
                concurrencyToken: currentToken,
                topicCode: student?.topicCode ?? studentCode,
                scheduledAt: manualDefenseDate,
                sessionCode: slot.sessionCode,
                startTime: slot.startTime,
                endTime: slot.endTime,
                orderIndex: slot.orderIndex,
              },
            );
            const addParsed = parseApiEnvelope(addResponse);
            if (!addParsed.ok) {
              return;
            }
            const refreshed = await reloadCouncilsFromBackend();
            currentToken =
              refreshed.find((item) => item.id === selectedCouncil.id)
                ?.concurrencyToken ?? currentToken;
            continue;
          }

          if (
            assignment.sessionCode !== slot.sessionCode ||
            assignment.orderIndex !== slot.orderIndex
          ) {
            const updateResponse = await adminApi.updateCouncilTopic(
              selectedCouncil.id,
              assignment.assignmentId,
              {
                concurrencyToken: currentToken,
                scheduledAt: manualDefenseDate,
                sessionCode: slot.sessionCode,
                startTime: slot.startTime,
                endTime: slot.endTime,
                orderIndex: slot.orderIndex,
              },
            );
            const updateParsed = parseApiEnvelope(updateResponse);
            if (!updateParsed.ok) {
              return;
            }
            const refreshed = await reloadCouncilsFromBackend();
            currentToken =
              refreshed.find((item) => item.id === selectedCouncil.id)
                ?.concurrencyToken ?? currentToken;
          }
        }

        notifySuccess(`Đã cập nhật hội đồng ${draft.id}.`);
      } else {
        const response = await adminApi.createCouncil(
          buildCouncilUpsertPayload(draft),
        );
        const parsed = parseApiEnvelope(response);
        if (!parsed.ok) {
          return;
        }
        notifySuccess(`Đã tạo hội đồng thủ công ${draft.id}.`);
      }

      await reloadCouncilsFromBackend();
      await refreshBackendState();
      setManualMode(null);
      setManualReadOnly(false);
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

  const downloadCsv = (
    fileName: string,
    headers: string[],
    rows: Array<Array<string | number>>,
  ) => {
    const lines = [headers, ...rows].map((line) =>
      line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
    );
    const blob = new Blob([`\uFEFF${lines.join("\n")}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const openPrintableReport = (title: string, bodyRows: string) => {
    const printWindow = window.open("", "_blank", "width=1024,height=768");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            h1 { margin: 0 0 10px 0; font-size: 22px; }
            p { margin: 0 0 12px 0; color: #334155; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; font-size: 12px; text-align: left; }
            th { background: #f1f5f9; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>Ngày xuất: ${new Date().toLocaleString("vi-VN")}</p>
          ${bodyRows}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const exportCouncilSummary = () => {
    if (!councilRows.length) return;

    const headers = [
      "TT",
      "Mã SV",
      "Họ tên",
      "Người hướng dẫn",
      "Hội đồng",
      "Tags hội đồng",
      "Chủ tịch HD",
      "Nơi công tác CT",
      "Ủy viên thư ký",
      "Nơi công tác TK",
      "Ủy viên phản biện",
      "Nơi công tác PB",
      "Ủy viên",
      "Nơi công tác UV",
      "Buổi",
      "Ngày",
    ];

    const allLines: Array<Array<string | number>> = [];
    let index = 1;
    const exportDate = new Date().toLocaleDateString("vi-VN");

    councilRows.forEach((council) => {
      const chair =
        council.members.find((member: CouncilMember) => member.role === "CT")
          ?.lecturerName ?? "-";
      const secretary =
        council.members.find((member: CouncilMember) => member.role === "TK")
          ?.lecturerName ?? "-";
      const reviewer =
        council.members.find((member: CouncilMember) => member.role === "PB")
          ?.lecturerName ?? "-";
      const member =
        council.members.find(
          (memberItem: CouncilMember) => memberItem.role === "UV",
        )?.lecturerName ?? "-";

      const rows = [
        ...council.morningStudents.map((studentCode) => ({
          studentCode,
          session: "Sáng",
        })),
        ...council.afternoonStudents.map((studentCode) => ({
          studentCode,
          session: "Chiều",
        })),
      ];

      rows.forEach((item) => {
        const student = findStudentByCode(item.studentCode);
        const supervisorName = student?.supervisorCode
          ? getLecturerNameByCode(student.supervisorCode) ||
            student.supervisorCode
          : "-";
        const line = [
          String(index),
          student?.studentCode ?? item.studentCode,
          student?.studentName ?? "-",
          supervisorName,
          council.id,
          council.councilTags.join("; "),
          chair,
          "ĐH Đại Nam",
          secretary,
          "ĐH Đại Nam",
          reviewer,
          "ĐH Đại Nam",
          member,
          "ĐH Đại Nam",
          item.session,
          exportDate,
        ];
        allLines.push(line);
        index += 1;
      });
    });

    downloadCsv(
      `tong-hop-hoi-dong-${new Date().getTime()}.csv`,
      headers,
      allLines,
    );
  };

  const exportCouncilSummaryPdf = () => {
    const rows = councilScoreSummaries
      .map(
        (item) =>
          `<tr><td>${item.id}</td><td>${item.room}</td><td>${item.tags || "-"}</td><td>${item.studentCount}</td><td>${item.avg}</td><td>${item.max}</td><td>${item.min}</td></tr>`,
      )
      .join("");
    openPrintableReport(
      "Báo cáo tổng hợp theo hội đồng",
      `<table><thead><tr><th>Hội đồng</th><th>Phòng</th><th>Tags</th><th>Số SV</th><th>Điểm TB</th><th>Cao nhất</th><th>Thấp nhất</th></tr></thead><tbody>${rows}</tbody></table>`,
    );
  };

  const exportForm1Excel = () => {
    const selected =
      councilRows.find((item) => item.id === selectedCouncilId) ??
      councilRows[0];
    if (!selected) return;
    const headers = [
      "Hội đồng",
      "Phòng",
      "Buổi",
      "Mã SV",
      "Họ tên",
      "Đề tài",
      "Điểm",
      "Xếp loại",
    ];
    const rows = scoreRows
      .filter((row) => row.councilId === selected.id)
      .map((row) => [
        selected.id,
        selected.room,
        row.session,
        row.studentCode,
        row.studentName,
        row.topicTitle,
        row.score,
        row.grade,
      ]);
    downloadCsv(`form-1-${selected.id}.csv`, headers, rows);
  };

  const exportForm1Pdf = () => {
    const selected =
      councilRows.find((item) => item.id === selectedCouncilId) ??
      councilRows[0];
    if (!selected) return;
    const rows = scoreRows
      .filter((row) => row.councilId === selected.id)
      .map(
        (row) =>
          `<tr><td>${row.session}</td><td>${row.studentCode}</td><td>${row.studentName}</td><td>${row.topicTitle}</td><td>${row.score}</td><td>${row.grade}</td></tr>`,
      )
      .join("");
    openPrintableReport(
      `Mẫu Form 1 - ${selected.id}`,
      `<p>Phòng: ${selected.room} · Tags: ${selected.councilTags.join(", ") || "-"}</p><table><thead><tr><th>Buổi</th><th>Mã SV</th><th>Họ tên</th><th>Đề tài</th><th>Điểm</th><th>Xếp loại</th></tr></thead><tbody>${rows}</tbody></table>`,
    );
  };

  const exportFinalTermExcel = () => {
    const headers = [
      "Hội đồng",
      "Phòng",
      "Số SV",
      "Điểm TB",
      "Điểm cao nhất",
      "Điểm thấp nhất",
      "Tổng SV toàn đợt",
      "Điểm TB toàn đợt",
      "Tỷ lệ đạt (%)",
      "SV điểm cao nhất",
      "SV điểm thấp nhất",
    ];
    const rows = councilScoreSummaries.map((item) => [
      item.id,
      item.room,
      item.studentCount,
      item.avg,
      item.max,
      item.min,
      scoreOverview.totalStudents,
      scoreOverview.average,
      scoreOverview.passRate,
      scoreOverview.highest
        ? `${scoreOverview.highest.studentCode} - ${scoreOverview.highest.score}`
        : "-",
      scoreOverview.lowest
        ? `${scoreOverview.lowest.studentCode} - ${scoreOverview.lowest.score}`
        : "-",
    ]);
    downloadCsv(`bao-cao-cuoi-ky-${new Date().getTime()}.csv`, headers, rows);
  };

  const exportFinalTermPdf = () => {
    const summaryRows = councilScoreSummaries
      .map(
        (item) =>
          `<tr><td>${item.id}</td><td>${item.room}</td><td>${item.studentCount}</td><td>${item.avg}</td><td>${item.max}</td><td>${item.min}</td></tr>`,
      )
      .join("");
    const highlight = `
      <p>Tổng sinh viên: <strong>${scoreOverview.totalStudents}</strong> · Điểm TB: <strong>${scoreOverview.average}</strong> · Tỷ lệ đạt: <strong>${scoreOverview.passRate}%</strong></p>
      <p>Điểm cao nhất: <strong>${scoreOverview.highest ? `${scoreOverview.highest.studentCode} - ${scoreOverview.highest.studentName} (${scoreOverview.highest.score})` : "-"}</strong></p>
      <p>Điểm thấp nhất: <strong>${scoreOverview.lowest ? `${scoreOverview.lowest.studentCode} - ${scoreOverview.lowest.studentName} (${scoreOverview.lowest.score})` : "-"}</strong></p>
    `;
    openPrintableReport(
      "Báo cáo cuối kỳ tổng hợp theo hội đồng",
      `${highlight}<table><thead><tr><th>Hội đồng</th><th>Phòng</th><th>Số SV</th><th>Điểm TB</th><th>Cao nhất</th><th>Thấp nhất</th></tr></thead><tbody>${summaryRows}</tbody></table>`,
    );
  };

  return (
    <div
      style={{
        maxWidth: 1480,
        margin: "0 auto",
        padding: 24,
        fontFamily: '"Be Vietnam Pro", "Segoe UI", system-ui, sans-serif',
        position: "relative",
      }}
      className="committee-root"
    >
      <style>
        {`
          .committee-root {
            --adm-ink: #0f172a;
            --adm-muted: #475569;
            --adm-main: #f97316;
            --adm-accent: #f97316;
            --adm-line: #d9dde5;
            font-family: "Be Vietnam Pro", "Segoe UI", system-ui, sans-serif;
            color: var(--adm-ink);
            background: #ffffff;
            border-radius: 12px;
          }
          .committee-root h1,
          .committee-root h2,
          .committee-root h3 {
            line-height: 1.25;
            letter-spacing: -0.01em;
          }
          .committee-root .committee-kicker {
            font-size: 11px;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            font-weight: 700;
            color: #64748b;
            line-height: 1.35;
          }
          .committee-root .committee-value {
            font-size: 24px;
            font-weight: 700;
            line-height: 1.2;
            color: #0f172a;
          }
          .committee-toolbar {
            min-height: 56px;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            background: #f8fafc;
            padding: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }
          .stage-menu-btn {
            border: 1px solid #cbd5e1;
            background: #ffffff;
            color: #334155;
            border-radius: 999px;
            min-height: 42px;
            padding: 0 16px;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            gap: 7px;
            cursor: pointer;
            position: relative;
            transition: border-color .2s ease, background-color .2s ease, color .2s ease;
          }
          .stage-menu-btn::after {
            content: "";
            position: absolute;
            left: 14px;
            right: 14px;
            bottom: 5px;
            height: 2px;
            border-radius: 999px;
            background: #f97316;
            transform: scaleX(0);
            transform-origin: center;
            transition: transform .2s ease;
          }
          .stage-menu-btn:hover {
            border-color: #94a3b8;
            background: #ffffff;
            color: #0f172a;
          }
          .stage-menu-btn:hover::after,
          .stage-menu-btn.active::after {
            transform: scaleX(1);
          }
          .stage-menu-btn.active {
            border-color: #1d4ed8;
            background: #eff6ff;
            color: #1e40af;
          }
          .committee-hero {
            border-radius: 14px;
            padding: 22px;
            color: #0f172a;
            background: linear-gradient(115deg, #ffffff 0%, #f8fbff 55%, #fff7ed 100%);
            border: 1px solid #e6e9ef;
          }
          .committee-hero-grid {
            display: flex;
            justify-content: space-between;
            gap: 18px;
            flex-wrap: wrap;
          }
          .committee-hero-title {
            margin: 0;
            font-size: 52px;
            color: #ea580c;
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 800;
            line-height: 1.08;
            letter-spacing: -0.02em;
          }
          .committee-hero-sub {
            margin-top: 8px;
            color: #475569;
            font-size: 13px;
          }
          .committee-hero-stats {
            display: grid;
            grid-template-columns: repeat(3, minmax(140px, 1fr));
            gap: 10px;
            min-width: 420px;
          }
          .committee-hero-stat {
            background: #ffffff;
            border-radius: 14px;
            padding: 12px;
            border: 1px solid #dbeafe;
          }
          .committee-hero-stat .label {
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 4px;
            font-weight: 700;
          }
          .committee-hero-stat .value {
            font-size: 26px;
            font-weight: 700;
            line-height: 1.15;
          }
          .workflow-card {
            margin-top: 16px;
            border-radius: 14px;
            border: 1px solid #e2e8f0;
            background: #ffffff;
            padding: 12px;
          }
          .workflow-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
            margin-bottom: 10px;
            flex-wrap: wrap;
          }
          .workflow-title {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
          }
          .workflow-chip {
            font-size: 12px;
            border: 1px solid #dbeafe;
            color: #1e40af;
            background: #eff6ff;
            border-radius: 999px;
            padding: 4px 10px;
            font-weight: 600;
          }
          @media (max-width: 980px) {
            .committee-hero-title {
              font-size: 36px;
            }
            .committee-hero-stats {
              min-width: 100%;
              grid-template-columns: repeat(3, minmax(120px, 1fr));
            }
          }
          .committee-action-row {
            display: flex;
            gap: 10px;
            margin-bottom: 12px;
            flex-wrap: wrap;
          }
          .committee-danger-inline-btn {
            border: 1px solid #dc2626;
            border-radius: 12px;
            background: #fef2f2;
            color: #b91c1c;
            min-height: 44px;
            padding: 0 16px;
            font-weight: 700;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: border-color .2s ease, background-color .2s ease, transform .2s ease;
          }
          .committee-danger-inline-btn:hover {
            border-color: #b91c1c;
            background: #fee2e2;
            transform: translateY(-1px);
          }
          .committee-content {
            position: relative;
            z-index: 1;
          }
          .committee-primary-btn {
            border: 1px solid #ea580c;
            border-radius: 12px;
            background: #f97316;
            color: #fff;
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
            color: #ffffff !important;
          }
          .committee-content .committee-ghost-btn {
            color: #1e40af !important;
          }
          .committee-content .committee-danger-btn {
            color: #b91c1c !important;
          }
          .committee-primary-btn:hover {
            background: #ea580c;
            border-color: #ea580c;
            transform: translateY(-1px);
          }
          .committee-primary-btn:disabled {
            border-color: #94a3b8;
            background: #94a3b8;
            color: #ffffff !important;
            box-shadow: none;
            cursor: not-allowed;
          }
          .committee-accent-btn {
            border: 1px solid #cfd6e0;
            border-radius: 12px;
            background: #ffffff;
            color: #ffffff;
            padding: 8px 14px;
            font-weight: 600;
            min-height: 40px;
            cursor: pointer;
          }
          .committee-content .committee-accent-btn {
            color: #0f172a !important;
          }
          .committee-accent-btn:hover:not(:disabled) {
            border-color: #94a3b8;
            background: #f8fafc;
          }
          .committee-accent-btn:disabled {
            border-color: #94a3b8;
            background: #94a3b8;
            color: #ffffff;
            cursor: not-allowed;
          }
          .committee-ghost-btn {
            border: 1px solid #cbd5e1;
            border-radius: 12px;
            background: #ffffff;
            color: #0f172a;
            padding: 8px 12px;
            font-weight: 600;
            min-height: 40px;
            cursor: pointer;
          }
          .committee-ghost-btn:hover:not(:disabled) {
            border-color: #94a3b8;
            background: #f8fafc;
          }
          .committee-danger-btn {
            border: 1px solid #dc2626;
            border-radius: 12px;
            background: #fef2f2;
            color: #b91c1c;
            padding: 8px 12px;
            font-weight: 600;
            min-height: 40px;
            cursor: pointer;
          }
          .committee-danger-btn:hover:not(:disabled) {
            border-color: #b91c1c;
            background: #fee2e2;
          }
          .committee-danger-btn:disabled {
            border-color: #fecaca;
            background: #fef2f2;
            color: #fca5a5;
            cursor: not-allowed;
          }
          .committee-icon-btn {
            width: 34px;
            height: 34px;
            min-height: 34px;
            border-radius: 9px;
            padding: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0;
          }
          .committee-icon-btn:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 10px rgba(15, 23, 42, 0.12);
          }
          .committee-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            z-index: 40;
          }
          .committee-modal {
            width: min(980px, 100%);
            max-height: 88vh;
            overflow: auto;
            border-radius: 12px;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            padding: 16px;
            color: #1e293b;
            font-family: "Be Vietnam Pro", "Segoe UI", system-ui, sans-serif;
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
            color: #475569;
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
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            background: #f8fafc;
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
            background-image: linear-gradient(45deg, transparent 50%, #475569 50%), linear-gradient(135deg, #475569 50%, transparent 50%);
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
          .committee-modal input:focus,
          .committee-modal select:focus {
            outline: none;
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.14);
          }
          .committee-content select:focus {
            outline: none;
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.14);
          }
          .committee-content select option,
          .committee-modal select option {
            background: #ffffff;
            color: #0f172a;
            font-size: 14px;
          }
          .committee-content select option:checked,
          .committee-modal select option:checked {
            background: #dbeafe;
            color: #1e3a8a;
            font-weight: 700;
          }
          .committee-modal-label {
            font-size: 12px;
            color: #64748b;
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
            border: 1px solid #e2e8f0;
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
            background: #f8fafc;
            color: #475569;
            font-size: 12px;
            font-weight: 600;
          }
          .committee-status-dot {
            width: 9px;
            height: 9px;
            border-radius: 999px;
            background: #0f766e;
          }
          .committee-content button,
          .committee-content input,
          .committee-content textarea,
          .committee-content select {
            transition: all 0.22s ease;
          }
          .committee-content button {
            font-family: "Be Vietnam Pro", "Segoe UI", system-ui, sans-serif;
            font-weight: 600;
            font-size: 13px;
            border-radius: 12px;
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
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.14);
          }
          .committee-content table tbody tr {
            transition: background-color 0.2s ease;
          }
          .committee-content table tbody tr:hover {
            background: #f0fdfa;
          }
          .committee-data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          .committee-data-table thead {
            background: #f8fafc;
          }
          .committee-data-table thead th {
            text-align: left;
            padding: 11px 12px;
            border-bottom: 1px solid #e2e8f0;
            color: #475569;
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
          .prepare-card {
            border-radius: 14px;
            padding: 20px;
            background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
          }
          .prepare-card-title {
            margin: 0;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 24px;
            line-height: 1.18;
            font-weight: 700;
            letter-spacing: -0.01em;
          }
          .prepare-sub {
            margin-top: 6px;
            color: #64748b;
            font-size: 13px;
          }
          .prepare-sync-toolbar {
            display: flex;
            gap: 10px;
            margin-top: 14px;
            margin-bottom: 12px;
            flex-wrap: wrap;
          }
          .prepare-sync-status {
            display: grid;
            gap: 6px;
          }
          .prepare-table-wrap {
            margin-top: 14px;
            max-height: 300px;
            overflow: auto;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            background: #ffffff;
          }
          .prepare-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          .prepare-table thead {
            background: #f8fafc;
          }
          .prepare-table thead th {
            text-align: left;
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 12px;
            color: #475569;
            font-weight: 700;
          }
          .prepare-table tbody td {
            padding: 10px 12px;
            border-top: 1px solid #e2e8f0;
            color: #0f172a;
            vertical-align: top;
          }
          .prepare-table tbody tr.row-invalid {
            background: #fef2f2;
          }
          .prepare-link-btn {
            margin-top: 12px;
            border: 0;
            background: transparent;
            color: #1d4ed8;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            padding: 0;
          }
          .prepare-room-title {
            font-size: 16px;
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
            min-height: 42px;
            padding: 0 16px;
            background: #ffffff;
            color: #1e3a8a;
            font-weight: 700;
            cursor: pointer;
            transition: border-color .2s ease, background-color .2s ease, transform .2s ease;
          }
          .prepare-room-chip:hover {
            border-color: #94a3b8;
            transform: translateY(-1px);
          }
          .prepare-room-chip.active {
            border-color: #1d4ed8;
            background: #dbeafe;
          }
          .prepare-time-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 10px;
          }
          .prepare-field {
            display: grid;
            gap: 6px;
          }
          .prepare-field span {
            font-size: 13px;
            color: #334155;
            font-weight: 600;
          }
          .prepare-warning {
            color: #b91c1c;
            margin-top: 10px;
            font-size: 13px;
            font-weight: 600;
          }
          .prepare-history {
            margin-top: 14px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 10px;
            background: #f8fafc;
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
            color: #334155;
          }
          .section-card-sm {
            border-radius: 14px;
            padding: 16px;
            background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
            font-size: 13px;
          }
          .section-title-sm {
            margin-top: 0;
            display: flex;
            gap: 8px;
            align-items: center;
            font-size: 22px;
            line-height: 1.2;
            letter-spacing: -0.01em;
            font-weight: 700;
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
          .committee-content button:not(.committee-primary-btn):not(.committee-accent-btn):not(.committee-ghost-btn):not(.committee-danger-btn):not(.stage-menu-btn) {
            border: 1px solid #fb923c;
            background: #fff7ed;
            color: #1e40af;
            min-height: 40px;
          }
          .committee-content button:not(.committee-primary-btn):not(.committee-accent-btn):not(.committee-ghost-btn):not(.committee-danger-btn):not(.stage-menu-btn):disabled {
            border-color: #cbd5e1;
            background: #f1f5f9;
            color: #64748b;
            cursor: not-allowed;
          }
          .committee-content button:not(.committee-primary-btn):not(.committee-accent-btn):not(.committee-ghost-btn):not(.committee-danger-btn):not(.stage-menu-btn):hover:not(:disabled) {
            border-color: #2563eb;
            background: #ffedd5;
          }
        `}
      </style>
      <div className="committee-content">
        <section className="committee-hero">
          <div className="committee-hero-grid">
            <div>
              <h1 className="committee-hero-title">
                <GraduationCap size={34} color="#ea580c" /> Quản lý hội đồng bảo
                vệ
              </h1>
              <div className="committee-hero-sub">
                Điều phối quy trình tạo hội đồng, phân công và công bố kết quả
                theo từng giai đoạn.
              </div>
            </div>
            <div className="committee-hero-stats">
              <div className="committee-hero-stat">
                <div className="label">Hồ sơ hợp lệ</div>
                <div className="value">{validRows.length}</div>
              </div>
              <div className="committee-hero-stat">
                <div className="label">Hội đồng nháp</div>
                <div className="value">{drafts.length}</div>
              </div>
              <div
                className="committee-hero-stat"
                style={{ borderColor: "#FED7AA" }}
              >
                <div className="label">Trạng thái đợt</div>
                <div
                  style={{
                    fontSize: 30,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span className="committee-status-dot" />
                  {isFinalized ? "Đã chốt" : "Đang nháp"}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="workflow-card">
          <div className="workflow-head">
            <div className="workflow-title">
              Quy trình điều hành theo 5 bước
            </div>
            <div className="workflow-chip">
              Đang ở bước {activeStageIndex + 1}: {activeStageLabel}
            </div>
          </div>
          <div className="committee-toolbar">
            {stages.map((stage, idx) => (
              <button
                key={stage.key}
                type="button"
                className={`stage-menu-btn ${activeStage === stage.key ? "active" : ""}`}
                onClick={() => setActiveStage(stage.key)}
              >
                {stage.icon}
                {idx + 1}. {stage.label}
                {idx < stages.length - 1 && <ChevronRight size={14} />}
              </button>
            ))}
          </div>
        </section>

        <section
          style={{
            marginTop: 12,
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            background: "#F8FAFC",
            padding: 12,
            display: "grid",
            gap: 6,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
            API UX Signal
          </div>
          <div
            style={{
              fontSize: 12,
              color: readinessReady ? "#166534" : "#B45309",
            }}
          >
            Readiness: {readinessReady ? "READY" : "NOT_READY"}
            {readinessNote ? ` · ${readinessNote}` : ""}
          </div>
          <div style={{ fontSize: 12, color: "#475569" }}>
            Action: {actionInFlight ?? "Idle"}
            {apiSignal?.idempotencyReplay ? " · Idempotency replay" : ""}
          </div>
          <div style={{ fontSize: 12, color: "#64748B" }}>
            Trace: {apiSignal?.traceId ?? "-"} · Token:{" "}
            {apiSignal?.concurrencyToken ?? "-"} · Last update:{" "}
            {apiSignal?.at ?? "-"}
          </div>
        </section>

        {activeStage === "prepare" && (
          <div
            style={{
              marginTop: 16,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: 16,
            }}
          >
            <section style={baseCard} className="prepare-card">
              <h2 className="prepare-card-title">
                <UploadCloud size={18} color="#1D4ED8" /> Đồng bộ dữ liệu
              </h2>
              <div className="prepare-sub">
                Đồng bộ dữ liệu sinh viên đủ điều kiện và kiểm tra trạng thái
                hợp lệ.
              </div>
              <div className="prepare-sync-toolbar">
                <button
                  type="button"
                  onClick={syncData}
                  disabled={
                    syncing ||
                    !stateHydrated ||
                    !hasAllowedAction("SYNC") ||
                    Boolean(actionInFlight)
                  }
                  className="committee-primary-btn"
                >
                  <RefreshCw size={15} />{" "}
                  {syncing ? "Đang đồng bộ..." : "Kích hoạt đồng bộ"}
                </button>
                <button
                  type="button"
                  onClick={simulateTimeout}
                  className="committee-danger-inline-btn"
                >
                  Mô phỏng timeout
                </button>
              </div>

              <div className="prepare-sync-status">
                {syncedAt && (
                  <div style={{ color: "#64748B", fontSize: 13 }}>
                    Lần đồng bộ: {syncedAt}
                  </div>
                )}
                {syncStatus === "success" && (
                  <div
                    style={{
                      color: "#166534",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <CheckCircle2 size={16} /> Đồng bộ thành công.
                  </div>
                )}
                {syncStatus === "timeout" && (
                  <div
                    style={{
                      color: "#B91C1C",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <AlertTriangle size={16} /> Kết nối API bị timeout.
                  </div>
                )}
              </div>

              <div className="prepare-table-wrap">
                <table className="prepare-table">
                  <thead>
                    <tr>
                      <th>MSSV</th>
                      <th>Đề tài</th>
                      <th>GVHD</th>
                      <th>Tag</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((item: EligibleStudent) => (
                      <tr
                        key={item.studentCode}
                        className={item.valid ? "" : "row-invalid"}
                      >
                        <td>{item.studentCode}</td>
                        <td>{item.topicTitle}</td>
                        <td>{item.supervisorCode || "-"}</td>
                        <td>{item.tags.join(", ") || "-"}</td>
                        <td>{item.valid ? "Hợp lệ" : item.error}</td>
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          style={{
                            padding: 12,
                            textAlign: "center",
                            color: "#64748B",
                          }}
                        >
                          Chưa có dữ liệu sinh viên từ API.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <button type="button" className="prepare-link-btn">
                <Download size={16} /> Xuất CSV dữ liệu lỗi
              </button>
            </section>

            <section style={baseCard} className="prepare-card">
              <h2 className="prepare-card-title">
                <Settings2 size={18} color="#1D4ED8" /> Cấu hình đợt
              </h2>
              <div className="prepare-sub">
                Thiết lập phòng, ca bảo vệ và năng lực vận hành mỗi ngày.
              </div>
              <div className="prepare-room-title">Phòng sử dụng</div>
              <div className="prepare-room-list">
                {roomOptions.map((room: string) => (
                  <button
                    key={room}
                    type="button"
                    onClick={() => toggleRoom(room)}
                    className={`prepare-room-chip ${selectedRooms.includes(room) ? "active" : ""}`}
                  >
                    {room}
                  </button>
                ))}
                {roomOptions.length === 0 && (
                  <div style={{ fontSize: 12, color: "#64748B" }}>
                    Chưa có danh sách phòng từ API. Vui lòng cập nhật cấu hình
                    đợt.
                  </div>
                )}
              </div>

              <div className="prepare-time-grid">
                <label className="prepare-field">
                  <span>Ca sáng</span>
                  <input
                    type="time"
                    value={morningStart}
                    onChange={(e) => setMorningStart(e.target.value)}
                  />
                </label>
                <label className="prepare-field">
                  <span>Kết thúc ca sáng</span>
                  <input
                    type="time"
                    value={morningEnd}
                    onChange={(e) => setMorningEnd(e.target.value)}
                  />
                </label>
                <label className="prepare-field">
                  <span>Ca chiều</span>
                  <input
                    type="time"
                    value={afternoonStart}
                    onChange={(e) => setAfternoonStart(e.target.value)}
                  />
                </label>
                <label className="prepare-field">
                  <span>Kết thúc ca chiều</span>
                  <input
                    type="time"
                    value={afternoonEnd}
                    onChange={(e) => setAfternoonEnd(e.target.value)}
                  />
                </label>
                <label className="prepare-field">
                  <span>Tạo tự động từ ngày</span>
                  <input
                    type="date"
                    value={autoStartDate}
                    onChange={(e) => setAutoStartDate(e.target.value)}
                  />
                </label>
                <label className="prepare-field">
                  <span>Đến ngày</span>
                  <input
                    type="date"
                    value={autoEndDate}
                    onChange={(e) => setAutoEndDate(e.target.value)}
                  />
                </label>
              </div>

              <label className="prepare-field" style={{ marginTop: 10 }}>
                <span>Số hội đồng tối đa/ngày</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={maxCapacity}
                  onChange={(e) => {
                    setConfigSaved(false);
                    setMaxCapacity(Number(e.target.value));
                  }}
                />
              </label>

              {hasTimeConflict && (
                <div className="prepare-warning">
                  Ca sáng và chiều đang giao nhau.
                </div>
              )}
              {hasDateRangeConflict && (
                <div className="prepare-warning">
                  Khoảng ngày không hợp lệ: ngày kết thúc phải lớn hơn hoặc bằng
                  ngày bắt đầu.
                </div>
              )}

              <button
                type="button"
                onClick={saveConfig}
                disabled={
                  !stateHydrated ||
                  !hasAllowedAction("UPDATE_CONFIG") ||
                  Boolean(actionInFlight)
                }
                className="committee-primary-btn"
                style={{
                  marginTop: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Save size={15} /> Lưu cấu hình
              </button>
              {configSaved && (
                <div style={{ marginTop: 8, color: "#166534" }}>
                  Đã lưu cấu hình tham số đợt bảo vệ.
                </div>
              )}

              <div className="prepare-history">
                <div className="prepare-history-title">Lịch sử đồng bộ</div>
                {syncAuditLogs.map((log: SyncAuditLog) => (
                  <div
                    key={`${log.timestamp}-${log.action}`}
                    className="prepare-history-row"
                  >
                    <span>{log.timestamp}</span>
                    <span
                      style={{
                        color:
                          log.result === "Success"
                            ? "#166534"
                            : log.result === "Partial"
                              ? "#B45309"
                              : "#B91C1C",
                      }}
                    >
                      {log.result} · {log.records}
                    </span>
                  </div>
                ))}
                {syncAuditLogs.length === 0 && (
                  <div style={{ fontSize: 12, color: "#64748B" }}>
                    Chưa có lịch sử đồng bộ.
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {activeStage === "grouping" && (
          <div
            style={{
              marginTop: 16,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: 16,
            }}
          >
            <section style={baseCard} className="section-card-sm">
              <h2 className="section-title-sm">
                <Users size={18} color="#1D4ED8" /> Năng lực giảng viên
              </h2>
              <div
                style={{
                  maxHeight: 300,
                  overflow: "auto",
                  border: "1px solid #E2E8F0",
                  borderRadius: 12,
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 13,
                  }}
                >
                  <thead style={{ background: "#F8FAFC" }}>
                    <tr>
                      <th style={{ textAlign: "left", padding: 9 }}>
                        Giảng viên
                      </th>
                      <th style={{ textAlign: "left", padding: 9 }}>Tag</th>
                      <th style={{ textAlign: "left", padding: 9 }}>
                        Busy slot
                      </th>
                      <th style={{ textAlign: "left", padding: 9 }}>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lecturerCapabilities.map((item: LecturerCapability) => (
                      <tr key={item.lecturerCode}>
                        <td
                          style={{ borderTop: "1px solid #E2E8F0", padding: 9 }}
                        >
                          {item.lecturerName}
                        </td>
                        <td
                          style={{ borderTop: "1px solid #E2E8F0", padding: 9 }}
                        >
                          {item.tags.join(", ") || "-"}
                        </td>
                        <td
                          style={{ borderTop: "1px solid #E2E8F0", padding: 9 }}
                        >
                          {item.busySlots.join(", ")}
                        </td>
                        <td
                          style={{
                            borderTop: "1px solid #E2E8F0",
                            padding: 9,
                            color: item.warning ? "#B45309" : "#64748B",
                          }}
                        >
                          {item.warning || "OK"}
                        </td>
                      </tr>
                    ))}
                    {lecturerCapabilities.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          style={{
                            borderTop: "1px solid #E2E8F0",
                            padding: 12,
                            textAlign: "center",
                            color: "#64748B",
                          }}
                        >
                          Chưa có dữ liệu năng lực giảng viên từ API.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={lockCapabilities}
                disabled={
                  !stateHydrated ||
                  capabilitiesLocked ||
                  !hasAllowedAction("LOCK_CAPABILITIES") ||
                  Boolean(actionInFlight)
                }
                className="committee-primary-btn"
                style={{ marginTop: 10 }}
              >
                Chốt năng lực
              </button>
              {capabilitiesLocked && (
                <div style={{ marginTop: 8, color: "#166534" }}>
                  Đã chốt lịch bận và tag năng lực.
                </div>
              )}
            </section>

            <section style={baseCard} className="section-card-sm">
              <h2 className="section-title-sm">
                <Sparkles size={18} color="#1D4ED8" /> Cấu hình hội đồng
              </h2>
              <div style={{ color: "#475569", fontSize: 13, marginBottom: 10 }}>
                Thiết lập tham số.
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>
                    Số đề tài/buổi
                  </span>
                  <select
                    value={topicsPerSessionConfig}
                    onChange={(event) => {
                      setTopicsPerSessionConfig(Number(event.target.value));
                      setCouncilConfigConfirmed(false);
                    }}
                  >
                    {COUNCIL_CONFIG_OPTIONS.map((value) => (
                      <option key={`topics-${value}`} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>
                    Số thành viên/hội đồng
                  </span>
                  <select
                    value={membersPerCouncilConfig}
                    onChange={(event) => {
                      setMembersPerCouncilConfig(Number(event.target.value));
                      setCouncilConfigConfirmed(false);
                    }}
                  >
                    {COUNCIL_CONFIG_OPTIONS.map((value) => (
                      <option key={`members-${value}`} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  color: "#475569",
                  fontWeight: 600,
                }}
              >
                Tags hội đồng
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginTop: 6,
                }}
              >
                {allTags.map((tag: string) => (
                  <button
                    key={`cfg-tag-${tag}`}
                    type="button"
                    onClick={() => toggleConfigCouncilTag(tag)}
                    className="committee-ghost-btn"
                    style={{
                      minHeight: 34,
                      padding: "6px 10px",
                      borderColor: configCouncilTags.includes(tag)
                        ? "#1D4ED8"
                        : "#CBD5E1",
                      background: configCouncilTags.includes(tag)
                        ? "#DBEAFE"
                        : "#fff",
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <div
                style={{
                  marginTop: 12,
                  border: "1px solid #E2E8F0",
                  borderRadius: 10,
                  background: "#F8FAFC",
                  padding: 10,
                  fontSize: 13,
                  color: "#334155",
                }}
              >
                {topicsPerSessionConfig} đề tài/buổi · {membersPerCouncilConfig}{" "}
                thành viên/hội đồng · {configCouncilTags.length} tag
              </div>

              <button
                type="button"
                onClick={saveCouncilConfig}
                disabled={
                  !stateHydrated ||
                  !hasAllowedAction("CONFIRM_COUNCIL_CONFIG") ||
                  Boolean(actionInFlight)
                }
                className="committee-primary-btn"
                style={{ marginTop: 10 }}
              >
                <Save size={15} /> Lưu cấu hình
              </button>
              {councilConfigConfirmed && (
                <div style={{ marginTop: 8, color: "#166534" }}>
                  Đã lưu cấu hình.
                </div>
              )}
            </section>
          </div>
        )}

        {activeStage === "assignment" && (
          <div style={{ marginTop: 16, display: "grid", gap: 16 }}>
            <section style={baseCard} className="section-card-sm">
              <h2 className="section-title-sm">
                <Gavel size={18} color="#1D4ED8" /> Trung tâm quản lý hội đồng
              </h2>
              <div style={{ color: "#475569", fontSize: 13, marginBottom: 10 }}>
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
                    style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}
                  >
                    Tìm hội đồng
                  </span>
                  <div style={{ position: "relative" }}>
                    <Search
                      size={14}
                      color="#64748B"
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
                        border: "1px solid #CBD5E1",
                      }}
                    />
                  </div>
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span
                    style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}
                  >
                    Lọc theo tags
                  </span>
                  <select
                    value={tagFilter}
                    onChange={(event) => {
                      setTagFilter(event.target.value);
                      setCouncilPage(1);
                    }}
                  >
                    <option value="all">Tất cả tags</option>
                    {allTags.map((tag) => (
                      <option key={`filter-tag-${tag}`} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span
                    style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}
                  >
                    Lọc theo phòng
                  </span>
                  <select
                    value={roomFilter}
                    onChange={(event) => {
                      setRoomFilter(event.target.value);
                      setCouncilPage(1);
                    }}
                  >
                    <option value="all">Tất cả phòng</option>
                    {availableRooms.map((room) => (
                      <option key={room} value={room}>
                        {room}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span
                    style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}
                  >
                    Lọc theo ngày
                  </span>
                  <select
                    value={dateFilter}
                    onChange={(event) => {
                      setDateFilter(event.target.value);
                      setCouncilPage(1);
                    }}
                  >
                    <option value="all">Tất cả ngày</option>
                    {availableDates.map((date) => (
                      <option key={date} value={date}>
                        {new Date(date).toLocaleDateString("vi-VN")}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div
                style={{
                  marginBottom: 10,
                  border: "1px solid #E2E8F0",
                  borderRadius: 10,
                  padding: 10,
                  background: "#F8FAFC",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 12,
                    color: "#334155",
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
                        border: "1px solid #CBD5E1",
                        borderRadius: 999,
                        padding: "4px 10px",
                        fontSize: 12,
                        color: "#334155",
                        background: "#fff",
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
                <div style={{ color: "#334155", fontSize: 13 }}>
                  Hiển thị <strong>{pagedCouncilRows.length}</strong> /{" "}
                  {filteredCouncilRows.length} hội đồng
                  {selectedCouncilId ? (
                    <span
                      style={{
                        marginLeft: 8,
                        color: "#1D4ED8",
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
                      color: "#64748B",
                      fontSize: 12,
                    }}
                  >
                    <SlidersHorizontal size={14} /> Bộ lọc vận hành thời gian
                    thực
                  </div>
                  <button
                    type="button"
                    className="committee-ghost-btn"
                    onClick={exportCouncilSummary}
                  >
                    <Download size={14} /> Xuất file tổng hợp
                  </button>
                  <button
                    type="button"
                    className="committee-primary-btn"
                    onClick={startCreateCouncil}
                  >
                    <Plus size={14} /> Thêm hội đồng thủ công
                  </button>
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #E2E8F0",
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
                              ? "#eff6ff"
                              : "transparent",
                          cursor: "pointer",
                        }}
                      >
                        <td style={{ fontWeight: 700 }}>{row.id}</td>
                        <td>
                          {new Date(row.defenseDate).toLocaleDateString(
                            "vi-VN",
                          )}
                        </td>
                        <td>{row.room}</td>
                        <td>{row.councilTags.join(", ") || "-"}</td>
                        <td>
                          {row.morningStudents.length}/
                          {FIXED_TOPICS_PER_SESSION}
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
                                row.status === "Published"
                                  ? "#DCFCE7"
                                  : row.status === "Ready"
                                    ? "#DBEAFE"
                                    : row.status === "Warning"
                                      ? "#FEF3C7"
                                      : "#F1F5F9",
                              color:
                                row.status === "Published"
                                  ? "#166534"
                                  : row.status === "Ready"
                                    ? "#1E40AF"
                                    : row.status === "Warning"
                                      ? "#B45309"
                                      : "#475569",
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
                            color: "#64748B",
                          }}
                        >
                          Không tìm thấy hội đồng phù hợp với bộ lọc.
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
                  <div style={{ color: "#64748B", fontSize: 12 }}>
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
            </section>

            <section style={baseCard} className="section-card-sm">
              <h2 className="section-title-sm">
                <Workflow size={18} color="#1D4ED8" /> Tạo hội đồng
              </h2>
              <button
                type="button"
                onClick={runAssignment}
                disabled={
                  !stateHydrated ||
                  !hasAllowedAction("GENERATE_COUNCILS") ||
                  !canCreateCouncils ||
                  assignmentLoading ||
                  Boolean(actionInFlight)
                }
                className="committee-primary-btn"
              >
                {assignmentLoading ? "Đang tạo..." : "Tạo hội đồng"}
              </button>
              <div
                style={{
                  marginTop: 12,
                  border: "1px solid #E2E8F0",
                  borderRadius: 12,
                  padding: 12,
                  background: "#F8FAFC",
                  color: "#334155",
                  fontSize: 13,
                }}
              >
                {drafts.length
                  ? `Đã tạo ${drafts.length} hội đồng nháp.`
                  : "Chưa có dữ liệu nháp."}
              </div>
            </section>
          </div>
        )}

        {activeStage === "operation" && (
          <div
            style={{
              marginTop: 16,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 16,
            }}
          >
            <section style={baseCard} className="section-card-sm">
              <h2 className="section-title-sm">
                <AlertTriangle size={18} color="#1D4ED8" /> Cảnh báo điểm lệch
              </h2>
              <label style={{ display: "grid", gap: 4, marginBottom: 8 }}>
                Ngưỡng cảnh báo
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  value={varianceThreshold}
                  onChange={(event) =>
                    setVarianceThreshold(Number(event.target.value))
                  }
                />
              </label>
              <label style={{ display: "grid", gap: 4 }}>
                Phương sai hiện tại
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  value={currentVariance}
                  onChange={(event) =>
                    setCurrentVariance(Number(event.target.value))
                  }
                />
              </label>
              {currentVariance > varianceThreshold ? (
                <div
                  style={{ marginTop: 8, color: "#B91C1C", fontWeight: 700 }}
                >
                  CẢNH BÁO ĐIỂM LỆCH: Yêu cầu hội đồng điều chỉnh.
                </div>
              ) : (
                <div
                  style={{ marginTop: 8, color: "#166534", fontWeight: 700 }}
                >
                  Điểm nằm trong ngưỡng an toàn.
                </div>
              )}
            </section>

            <section style={baseCard} className="section-card-sm">
              <h2 className="section-title-sm">
                <Lock size={18} color="#1D4ED8" /> Chốt danh sách
              </h2>
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
                  Cho phép chốt
                </label>
              )}
              <button
                type="button"
                onClick={finalize}
                disabled={
                  !stateHydrated ||
                  !hasAllowedAction("FINALIZE") ||
                  !drafts.length ||
                  Boolean(actionInFlight)
                }
                className="committee-accent-btn"
                style={{ marginTop: 10 }}
              >
                Chốt
              </button>
              <div
                style={{
                  marginTop: 8,
                  color: isFinalized ? "#166534" : "#64748B",
                }}
              >
                {isFinalized ? "Đã chốt." : "Chưa chốt."}
              </div>
              {isFinalized && (
                <div
                  style={{
                    marginTop: 10,
                    border: "1px solid #E2E8F0",
                    borderRadius: 10,
                    padding: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 4,
                    }}
                  >
                    <Mail size={15} /> Email
                  </div>
                  <div style={{ fontSize: 13, color: "#64748B" }}>
                    Đã gửi: 95 · Retry: {emailFailed} · Timeout SMTP:{" "}
                    {emailFailed}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {activeStage === "publish" && (
          <div
            style={{
              marginTop: 16,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 16,
            }}
          >
            <section style={baseCard} className="section-card-sm">
              <h2 className="section-title-sm">
                <Download size={18} color="#1D4ED8" /> Xuất hồ sơ
              </h2>
              <div
                style={{
                  border: "1px solid #E2E8F0",
                  borderRadius: 10,
                  padding: 10,
                  marginBottom: 10,
                }}
              >
                <div style={{ fontWeight: 700 }}>
                  SV220101 - Ứng dụng AI trong phân loại văn bản
                </div>
                <div style={{ fontSize: 13, color: "#64748B" }}>
                  GVHD ✓ · TK ✓ · CT chờ duyệt
                </div>
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                <label
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <input
                    type="checkbox"
                    checked={exportMinutes}
                    onChange={(event) => setExportMinutes(event.target.checked)}
                  />
                  Xuất biên bản
                </label>
                <label
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <input
                    type="checkbox"
                    checked={exportScores}
                    onChange={(event) => setExportScores(event.target.checked)}
                  />
                  Xuất bảng điểm
                </label>
              </div>
              <button
                type="button"
                className="committee-primary-btn"
                style={{ marginTop: 10 }}
                onClick={exportCouncilSummary}
              >
                <Download size={15} /> Xuất bảng tổng hợp (Excel/CSV)
              </button>
              <button
                type="button"
                className="committee-ghost-btn"
                style={{ marginTop: 8 }}
                onClick={exportCouncilSummaryPdf}
              >
                <Download size={15} /> Xuất bảng tổng hợp (PDF)
              </button>

              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                <button
                  type="button"
                  className="committee-ghost-btn"
                  onClick={exportForm1Excel}
                >
                  <FileSpreadsheet size={15} /> Xuất mẫu báo cáo Form 1 (Excel)
                </button>
                <button
                  type="button"
                  className="committee-ghost-btn"
                  onClick={exportForm1Pdf}
                >
                  <Download size={15} /> Xuất mẫu báo cáo Form 1 (PDF)
                </button>
                <button
                  type="button"
                  className="committee-ghost-btn"
                  onClick={exportFinalTermExcel}
                >
                  <FileSpreadsheet size={15} /> Xuất báo cáo cuối kỳ theo hội
                  đồng (Excel)
                </button>
                <button
                  type="button"
                  className="committee-ghost-btn"
                  onClick={exportFinalTermPdf}
                >
                  <Download size={15} /> Xuất báo cáo cuối kỳ theo hội đồng
                  (PDF)
                </button>
              </div>

              <div
                style={{
                  marginTop: 10,
                  border: "1px solid #E2E8F0",
                  borderRadius: 10,
                  padding: 10,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                  Nhật ký batch export
                </div>
                {exportJobs.map((job: ExportJob) => (
                  <div
                    key={job.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      marginBottom: 4,
                    }}
                  >
                    <span>
                      {job.id} · {job.scope}
                    </span>
                    <span
                      style={{
                        color:
                          job.status === "Done"
                            ? "#166534"
                            : job.status === "Running"
                              ? "#1D4ED8"
                              : "#B45309",
                      }}
                    >
                      {job.status} · {job.duration}
                    </span>
                  </div>
                ))}
                {exportJobs.length === 0 && (
                  <div style={{ fontSize: 12, color: "#64748B" }}>
                    Chưa có batch export.
                  </div>
                )}
              </div>
            </section>

            <section style={baseCard} className="section-card-sm">
              <h2 className="section-title-sm">
                <Building2 size={18} color="#1D4ED8" /> Công bố điểm
              </h2>
              <button
                type="button"
                onClick={publishAllScores}
                disabled={
                  !stateHydrated ||
                  !isFinalized ||
                  !hasAllowedAction("PUBLISH_SCORES") ||
                  Boolean(actionInFlight)
                }
                className="committee-primary-btn"
              >
                Công bố điểm đồng loạt
              </button>
              <div
                style={{
                  marginTop: 8,
                  color: published ? "#166534" : "#64748B",
                }}
              >
                {published ? "Điểm đã được publish." : "Chưa công bố điểm."}
              </div>

              <div
                style={{
                  marginTop: 10,
                  border: "1px solid #E2E8F0",
                  borderRadius: 10,
                  padding: 10,
                  background: "#F8FAFC",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontWeight: 700 }}>Rollback</div>
                  <button
                    type="button"
                    className="committee-ghost-btn"
                    onClick={loadRollbackAvailability}
                    disabled={
                      loadingRollbackAvailability ||
                      !stateHydrated ||
                      !hasAllowedAction("ROLLBACK") ||
                      Boolean(actionInFlight)
                    }
                  >
                    {loadingRollbackAvailability
                      ? "Đang tải..."
                      : "Kiểm tra trạng thái"}
                  </button>
                </div>
                {rollbackAvailability ? (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#334155",
                      display: "grid",
                      gap: 4,
                    }}
                  >
                    <div>
                      PUBLISH:{" "}
                      {rollbackAvailability.canRollbackPublish
                        ? "Cho phép"
                        : "Không"}
                    </div>
                    <div>
                      FINALIZE:{" "}
                      {rollbackAvailability.canRollbackFinalize
                        ? "Cho phép"
                        : "Không"}
                    </div>
                    <div>
                      ALL:{" "}
                      {rollbackAvailability.canRollbackAll
                        ? "Cho phép"
                        : "Không"}
                    </div>
                    {!!rollbackAvailability.blockers?.length && (
                      <div style={{ color: "#B45309" }}>
                        Blockers: {rollbackAvailability.blockers.join(" | ")}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "#64748B" }}>
                    Chưa tải trạng thái rollback.
                  </div>
                )}
                <button
                  type="button"
                  className="committee-danger-btn"
                  style={{ marginTop: 8 }}
                  onClick={executeRollback}
                  disabled={
                    rollbackWorking ||
                    !stateHydrated ||
                    !hasAllowedAction("ROLLBACK") ||
                    Boolean(actionInFlight)
                  }
                >
                  {rollbackWorking ? "Đang rollback..." : "Rollback"}
                </button>
              </div>

              <div
                style={{
                  marginTop: 12,
                  border: "1px solid #E2E8F0",
                  borderRadius: 10,
                  padding: 10,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                  Lịch sử công bố điểm
                </div>
                {publishBatches.map((batch: PublishBatch) => (
                  <div
                    key={batch.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      marginBottom: 4,
                    }}
                  >
                    <span>
                      {batch.id} · {batch.term} · {batch.totalStudents} SV
                    </span>
                    <span
                      style={{
                        color:
                          batch.status === "Published" ? "#166534" : "#B45309",
                      }}
                    >
                      {batch.status}{" "}
                      {batch.publishedAt !== "--"
                        ? `· ${batch.publishedAt}`
                        : ""}
                    </span>
                  </div>
                ))}
                {publishBatches.length === 0 && (
                  <div style={{ fontSize: 12, color: "#64748B" }}>
                    Chưa có lịch sử publish.
                  </div>
                )}
              </div>

              <div
                style={{
                  marginTop: 10,
                  borderRadius: 10,
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  padding: 10,
                  fontSize: 13,
                  color: "#334155",
                }}
              >
                Luồng đã đồng bộ cho Admin, Giảng viên, Sinh viên.
              </div>

              <div
                style={{
                  marginTop: 12,
                  border: "1px solid #E2E8F0",
                  borderRadius: 12,
                  padding: 12,
                  background: "#FFFFFF",
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Thống kê</div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      border: "1px solid #DBEAFE",
                      borderRadius: 10,
                      padding: 8,
                    }}
                  >
                    <div style={{ fontSize: 12, color: "#64748B" }}>
                      Tổng sinh viên
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 22 }}>
                      {scoreOverview.totalStudents}
                    </div>
                  </div>
                  <div
                    style={{
                      border: "1px solid #DBEAFE",
                      borderRadius: 10,
                      padding: 8,
                    }}
                  >
                    <div style={{ fontSize: 12, color: "#64748B" }}>
                      Điểm trung bình
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 22 }}>
                      {scoreOverview.average}
                    </div>
                  </div>
                  <div
                    style={{
                      border: "1px solid #DBEAFE",
                      borderRadius: 10,
                      padding: 8,
                    }}
                  >
                    <div style={{ fontSize: 12, color: "#64748B" }}>
                      Tỷ lệ đạt
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 22 }}>
                      {scoreOverview.passRate}%
                    </div>
                  </div>
                  <div
                    style={{
                      border: "1px solid #DBEAFE",
                      borderRadius: 10,
                      padding: 8,
                    }}
                  >
                    <div style={{ fontSize: 12, color: "#64748B" }}>
                      Điểm cao nhất/thấp nhất
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>
                      {scoreOverview.highest?.score ?? "-"} /{" "}
                      {scoreOverview.lowest?.score ?? "-"}
                    </div>
                  </div>
                </div>

                <div
                  style={{ fontSize: 12, color: "#334155", marginBottom: 10 }}
                >
                  Top:{" "}
                  {scoreOverview.highest
                    ? `${scoreOverview.highest.studentCode}`
                    : "-"}{" "}
                  · Bottom:{" "}
                  {scoreOverview.lowest
                    ? `${scoreOverview.lowest.studentCode}`
                    : "-"}
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  {scoreDistribution.map((item) => (
                    <div key={item.label}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 12,
                          marginBottom: 4,
                        }}
                      >
                        <span>{item.label}</span>
                        <span>
                          {item.count} SV · {item.pct}%
                        </span>
                      </div>
                      <div
                        style={{
                          height: 8,
                          borderRadius: 999,
                          background: "#E2E8F0",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${item.pct}%`,
                            height: "100%",
                            background: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: 12,
                    maxHeight: 220,
                    overflow: "auto",
                    border: "1px solid #E2E8F0",
                    borderRadius: 10,
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: 12,
                    }}
                  >
                    <thead style={{ background: "#F8FAFC" }}>
                      <tr>
                        <th style={{ textAlign: "left", padding: 8 }}>
                          Hội đồng
                        </th>
                        <th style={{ textAlign: "left", padding: 8 }}>Phòng</th>
                        <th style={{ textAlign: "left", padding: 8 }}>Số SV</th>
                        <th style={{ textAlign: "left", padding: 8 }}>TB</th>
                        <th style={{ textAlign: "left", padding: 8 }}>
                          Cao nhất
                        </th>
                        <th style={{ textAlign: "left", padding: 8 }}>
                          Thấp nhất
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {councilScoreSummaries.map((item) => (
                        <tr key={`score-summary-${item.id}`}>
                          <td
                            style={{
                              padding: 8,
                              borderTop: "1px solid #E2E8F0",
                              fontWeight: 700,
                            }}
                          >
                            {item.id}
                          </td>
                          <td
                            style={{
                              padding: 8,
                              borderTop: "1px solid #E2E8F0",
                            }}
                          >
                            {item.room}
                          </td>
                          <td
                            style={{
                              padding: 8,
                              borderTop: "1px solid #E2E8F0",
                            }}
                          >
                            {item.studentCount}
                          </td>
                          <td
                            style={{
                              padding: 8,
                              borderTop: "1px solid #E2E8F0",
                            }}
                          >
                            {item.avg}
                          </td>
                          <td
                            style={{
                              padding: 8,
                              borderTop: "1px solid #E2E8F0",
                            }}
                          >
                            {item.max}
                          </td>
                          <td
                            style={{
                              padding: 8,
                              borderTop: "1px solid #E2E8F0",
                            }}
                          >
                            {item.min}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        )}

        {showAutoGenerateModal && (
          <div
            className="committee-modal-overlay"
            onClick={() => setShowAutoGenerateModal(false)}
          >
            <div
              className="committee-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="committee-modal-head">
                <div>
                  <div className="committee-modal-title">
                    Auto Generate Committee
                  </div>
                  <div className="committee-modal-sub">
                    FE gửi cấu hình, BE xử lý ràng buộc và trả kết quả phân
                    công.
                  </div>
                </div>
                <button
                  type="button"
                  className="committee-ghost-btn committee-icon-btn"
                  onClick={() => setShowAutoGenerateModal(false)}
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    Phòng sử dụng
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {availableAutoRooms.map((room) => {
                      const checked = selectedRooms.includes(room);
                      return (
                        <label
                          key={`auto-room-${room}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 12,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setSelectedRooms((prev) =>
                                checked
                                  ? prev.filter((item) => item !== room)
                                  : [...prev, room],
                              );
                            }}
                          />
                          {room}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>
                    Số đề tài tối đa / buổi
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={topicsPerSessionConfig}
                    onChange={(event) =>
                      setTopicsPerSessionConfig(Number(event.target.value))
                    }
                  />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>
                    Tìm đề tài
                  </span>
                  <input
                    type="text"
                    value={topicSearchKeyword}
                    onChange={(event) =>
                      setTopicSearchKeyword(event.target.value)
                    }
                    placeholder="Mã đề tài / tên / tag"
                  />
                </label>

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    Chọn đề tài ({selectedAutoTopicIds.length}/
                    {filteredAutoTopics.length})
                  </div>
                  <div
                    style={{
                      maxHeight: 140,
                      overflow: "auto",
                      border: "1px solid #E2E8F0",
                      borderRadius: 8,
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
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 12,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleAutoTopic(id)}
                          />
                          <span>
                            {topic.topicCode ?? topic.topicId} -{" "}
                            {topic.title ?? "(Không tiêu đề)"}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    Chọn giảng viên ({selectedAutoLecturerIds.length}/
                    {availableAutoLecturers.length})
                  </div>
                  <div
                    style={{
                      maxHeight: 140,
                      overflow: "auto",
                      border: "1px solid #E2E8F0",
                      borderRadius: 8,
                      padding: 8,
                      display: "grid",
                      gap: 6,
                    }}
                  >
                    {availableAutoLecturers.map((lecturer) => {
                      const id =
                        lecturer.lecturerId ?? lecturer.lecturerCode ?? "";
                      const checked = selectedAutoLecturerIds.includes(id);
                      return (
                        <label
                          key={`lecturer-${id}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 12,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleAutoLecturer(id)}
                          />
                          <span>
                            {lecturer.lecturerCode ?? lecturer.lecturerId} -{" "}
                            {lecturer.lecturerName ?? "-"}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    Chiến lược và ràng buộc
                  </div>
                  <label
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <input
                      type="checkbox"
                      checked={autoGroupByTag}
                      onChange={(event) =>
                        setAutoGroupByTag(event.target.checked)
                      }
                    />
                    Group by tag
                  </label>
                  <label
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <input
                      type="checkbox"
                      checked={autoPrioritizeMatchTag}
                      onChange={(event) =>
                        setAutoPrioritizeMatchTag(event.target.checked)
                      }
                    />
                    Prioritize match tag
                  </label>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span>Yêu cầu học vị Chủ tịch</span>
                    <input
                      type="text"
                      value={autoRequireChairDegree}
                      onChange={(event) =>
                        setAutoRequireChairDegree(event.target.value)
                      }
                    />
                  </label>
                  <label
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <input
                      type="checkbox"
                      checked={autoAvoidSupervisorConflict}
                      onChange={(event) =>
                        setAutoAvoidSupervisorConflict(event.target.checked)
                      }
                    />
                    Tránh xung đột GVHD
                  </label>
                  <label
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <input
                      type="checkbox"
                      checked={autoAvoidLecturerOverlap}
                      onChange={(event) =>
                        setAutoAvoidLecturerOverlap(event.target.checked)
                      }
                    />
                    Tránh trùng lịch giảng viên
                  </label>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 8,
                  }}
                >
                  <button
                    type="button"
                    className="committee-ghost-btn"
                    onClick={() => setShowAutoGenerateModal(false)}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="committee-primary-btn"
                    onClick={submitAutoGenerate}
                    disabled={
                      assignmentLoading ||
                      loadingAutoGenerateConfig ||
                      !stateHydrated ||
                      !hasAllowedAction("GENERATE_COUNCILS") ||
                      Boolean(actionInFlight)
                    }
                  >
                    {assignmentLoading
                      ? "Đang tạo..."
                      : loadingAutoGenerateConfig
                        ? "Đang tải cấu hình..."
                        : "Tạo tự động"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {manualMode && (
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
                      ? "Thực hiện lần lượt 3 bước để hoàn tất hội đồng."
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
                        title={
                          manualMode === "create"
                            ? "Lưu hội đồng mới"
                            : "Lưu cập nhật"
                        }
                        aria-label={
                          manualMode === "create"
                            ? "Lưu hội đồng mới"
                            : "Lưu cập nhật"
                        }
                        disabled={Boolean(actionInFlight)}
                      >
                        <Save size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {manualMode === "create" && (
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
                {(manualMode === "edit" || createStep === 1) && (
                  <div className="committee-modal-grid-3">
                    <label className="committee-modal-card">
                      <span className="committee-modal-label">Mã hội đồng</span>
                      {manualReadOnly ? (
                        <div className="committee-modal-value">
                          {manualId || "-"}
                        </div>
                      ) : (
                        <input
                          value={manualId}
                          onChange={(event) => setManualId(event.target.value)}
                          placeholder="VD: HD-2026-08"
                        />
                      )}
                    </label>

                    <label className="committee-modal-card">
                      <span className="committee-modal-label">Ngày bảo vệ</span>
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
                          onChange={(event) =>
                            setManualDefenseDate(event.target.value)
                          }
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
                        <select
                          value={manualRoom}
                          onChange={(event) =>
                            setManualRoom(event.target.value)
                          }
                        >
                          {roomOptions.length === 0 && (
                            <option value="">Chưa có phòng từ API</option>
                          )}
                          {roomOptions.map((room) => (
                            <option key={room} value={room}>
                              {room}
                            </option>
                          ))}
                        </select>
                      )}
                    </label>

                    <label className="committee-modal-card">
                      <span className="committee-modal-label">
                        Lịch hội đồng
                      </span>
                      <div className="committee-modal-value">Cả ngày</div>
                    </label>
                  </div>
                )}

                {(manualMode === "edit" || createStep === 1) && (
                  <div className="committee-modal-card">
                    <span className="committee-modal-label">Tags hội đồng</span>
                    {manualReadOnly ? (
                      <div className="committee-modal-value">
                        {manualCouncilTags.join(", ") || "-"}
                      </div>
                    ) : (
                      <div
                        style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                      >
                        {allTags.map((tag: string) => (
                          <button
                            key={`manual-tag-${tag}`}
                            type="button"
                            className="committee-ghost-btn"
                            onClick={() => toggleManualCouncilTag(tag)}
                            style={{
                              minHeight: 34,
                              padding: "6px 10px",
                              borderColor: manualCouncilTags.includes(tag)
                                ? "#1D4ED8"
                                : "#CBD5E1",
                              background: manualCouncilTags.includes(tag)
                                ? "#DBEAFE"
                                : "#fff",
                            }}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {(manualMode === "edit" || createStep === 2) && (
                  <div className="committee-modal-card">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 8,
                      }}
                    >
                      <span className="committee-modal-label">
                        Danh sách thành viên hội đồng
                      </span>
                      {!manualReadOnly && (
                        <button
                          type="button"
                          className="committee-ghost-btn"
                          style={{ minHeight: 30, padding: "4px 10px" }}
                          onClick={addManualMemberSlot}
                        >
                          <Plus size={13} /> Thêm slot thành viên
                        </button>
                      )}
                    </div>
                    <div className="committee-modal-grid-3">
                      {manualMembers.map(
                        (member: CouncilMember, idx: number) => {
                          return (
                            <label
                              key={`${member.role}-${idx}`}
                              className="committee-modal-card"
                            >
                              <span className="committee-modal-label">
                                Vai trò thành viên #{idx + 1}
                              </span>
                              {manualReadOnly ? (
                                <div className="committee-modal-value">
                                  {member?.lecturerCode
                                    ? `${member.lecturerCode} - ${member.lecturerName}`
                                    : "-"}
                                </div>
                              ) : (
                                <>
                                  <input
                                    value={member.role}
                                    onChange={(event) => {
                                      const role = event.target.value;
                                      setManualMembers((prev) =>
                                        prev.map((item, i) =>
                                          i === idx ? { ...item, role } : item,
                                        ),
                                      );
                                    }}
                                    placeholder="VD: CT / TK / PB / UV1"
                                    style={{ marginBottom: 6 }}
                                  />
                                  <select
                                    value={member?.lecturerCode ?? ""}
                                    onChange={(event) =>
                                      updateManualMember(
                                        idx,
                                        event.target.value,
                                      )
                                    }
                                  >
                                    <option value="">Chọn giảng viên</option>
                                    {lecturerCapabilities.map(
                                      (lecturer: LecturerCapability) => (
                                        <option
                                          key={`${idx}-${lecturer.lecturerCode}`}
                                          value={lecturer.lecturerCode}
                                        >
                                          {lecturer.lecturerCode} -{" "}
                                          {lecturer.lecturerName}
                                        </option>
                                      ),
                                    )}
                                  </select>
                                  {manualMembers.length > 1 && (
                                    <button
                                      type="button"
                                      className="committee-danger-btn"
                                      style={{
                                        minHeight: 30,
                                        padding: "4px 10px",
                                        marginTop: 6,
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
                            </label>
                          );
                        },
                      )}
                    </div>
                  </div>
                )}

                {(manualMode === "edit" || createStep === 3) && (
                  <div className="committee-modal-card">
                    <span className="committee-modal-label">
                      Danh sách đề tài
                    </span>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(260px, 1fr))",
                        gap: 10,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            marginBottom: 6,
                            color: "#1E3A8A",
                          }}
                        >
                          Đề tài liên quan
                        </div>
                        <div
                          style={{
                            border: "1px solid #DBEAFE",
                            borderRadius: 10,
                            padding: 8,
                            minHeight: 220,
                            background: "#F8FAFF",
                          }}
                        >
                          {buildStudentView(manualRelatedStudents).map(
                            (item) => (
                              <div
                                key={`related-${item.studentCode}`}
                                style={{
                                  border: "1px solid #E2E8F0",
                                  borderRadius: 8,
                                  padding: 8,
                                  marginBottom: 8,
                                  background: "#fff",
                                }}
                              >
                                <div style={{ fontWeight: 700, fontSize: 12 }}>
                                  {item.studentCode} · {item.studentName}
                                </div>
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: "#475569",
                                    marginTop: 2,
                                  }}
                                >
                                  {item.topicTitle}
                                </div>
                                {!manualReadOnly && (
                                  <button
                                    type="button"
                                    className="committee-danger-btn"
                                    style={{
                                      minHeight: 28,
                                      padding: "2px 8px",
                                      marginTop: 6,
                                    }}
                                    onClick={() =>
                                      moveTopicToUnrelated(item.studentCode)
                                    }
                                  >
                                    <X size={12} /> Bỏ liên quan
                                  </button>
                                )}
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            marginBottom: 6,
                            color: "#475569",
                          }}
                        >
                          Đề tài không liên quan
                        </div>
                        <div
                          style={{
                            border: "1px solid #E2E8F0",
                            borderRadius: 10,
                            padding: 8,
                            minHeight: 220,
                            background: "#fff",
                          }}
                        >
                          {buildStudentView(manualUnrelatedStudents).map(
                            (item) => (
                              <div
                                key={`unrelated-${item.studentCode}`}
                                style={{
                                  border: "1px solid #E2E8F0",
                                  borderRadius: 8,
                                  padding: 8,
                                  marginBottom: 8,
                                  background: "#fff",
                                }}
                              >
                                <div style={{ fontWeight: 700, fontSize: 12 }}>
                                  {item.studentCode} · {item.studentName}
                                </div>
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: "#475569",
                                    marginTop: 2,
                                  }}
                                >
                                  {item.topicTitle}
                                </div>
                                {!manualReadOnly && (
                                  <button
                                    type="button"
                                    className="committee-ghost-btn"
                                    style={{
                                      minHeight: 28,
                                      padding: "2px 8px",
                                      marginTop: 6,
                                    }}
                                    onClick={() =>
                                      moveTopicToRelated(item.studentCode)
                                    }
                                  >
                                    <Plus size={12} /> Thêm liên quan
                                  </button>
                                )}
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                    {!manualReadOnly && (
                      <div
                        style={{
                          marginTop: 10,
                          fontSize: 12,
                          color: "#334155",
                        }}
                      >
                        Đề tài đã chọn: {manualRelatedStudents.length} · Buổi
                        sáng: {manualMorningStudents.length} · Buổi chiều:{" "}
                        {manualAfternoonStudents.length}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: 16,
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => setActiveStage("prepare")}
              className="committee-ghost-btn"
            >
              Quay về khởi tạo
            </button>
            <button
              type="button"
              onClick={() => setActiveStage("publish")}
              className="committee-primary-btn"
              style={{ padding: "8px 12px" }}
            >
              Đi đến công bố
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommitteeManagement;
