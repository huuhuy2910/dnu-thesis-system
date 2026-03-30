import React, { useEffect, useMemo, useState } from "react";
import {
  createConcurrencyToken,
  createIdempotencyKey,
  ucError,
  type SessionCode,
  type WorkflowActionTrace,
} from "../../types/defense-workflow-contract";
import { useToast } from "../../context/useToast";
import { FetchDataError, fetchData } from "../../api/fetchData";
import type { ApiResponse } from "../../types/api";

import {
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardPen,
  Clock4,
  FileCheck2,
  Gavel,
  Lock,
  MapPin,
  MessageSquareText,
  NotebookPen,
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
  room: string;
  session: SessionCode;
  date: string;
  slot: string;
  studentCount: number;
  status: "Sắp diễn ra" | "Đang họp" | "Đã khóa";
  role: string;
};

type RoleCode = "Chair" | "Secretary" | "Member";

type RevisionRequest = {
  revisionId: number;
  studentCode: string;
  topicTitle: string;
  status: "pending" | "approved" | "rejected";
  reason?: string;
};

type PanelKey = "councils" | "minutes" | "grading" | "revision";

const EMPTY_REVISION: RevisionRequest = {
  revisionId: 0,
  studentCode: "",
  topicTitle: "",
  status: "pending",
};

type ScoringOverview = {
  variance: number | null;
  varianceThreshold: number | null;
  finalScore: number | null;
  finalLetter: string | null;
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
  border: "1px solid #e6e9ef",
  borderRadius: 10,
  padding: 18,
  boxShadow: "0 2px 8px rgba(15,23,42,0.05)",
};

const LecturerCommittees: React.FC = () => {
  const { addToast } = useToast();
  const periodId = "2026.1";
  const periodBase = `/v1/defense-periods/${encodeURIComponent(periodId)}`;
  const lecturerBase = `${periodBase}/lecturer`;
  const lecturerApi = {
    getCommittees: () => fetchData<ApiResponse<Record<string, unknown>>>(`${lecturerBase}/committees`, { method: "GET" }),
    getCommitteeMinutes: (id: string | number) => fetchData<ApiResponse<Record<string, unknown>[]>>(`${lecturerBase}/committees/${id}/minutes`, { method: "GET" }),
    updateCommitteeMinutes: (id: string | number, payload: Record<string, unknown>, idempotencyKey?: string) =>
      fetchData<ApiResponse<boolean>>(`${lecturerBase}/committees/${id}/minutes`, {
        method: "PUT",
        body: payload,
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
    submitIndependentScore: (id: string | number, payload: Record<string, unknown>, idempotencyKey?: string) =>
      fetchData<ApiResponse<boolean>>(`${lecturerBase}/committees/${id}/scores/independent`, {
        method: "POST",
        body: payload,
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
    reopenRequestByCommittee: (id: string | number, payload: Record<string, unknown>, idempotencyKey?: string) =>
      fetchData<ApiResponse<boolean>>(`${lecturerBase}/committees/${id}/scores/reopen-request`, {
        method: "POST",
        body: payload,
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
    lockSessionByCommittee: (id: string | number, idempotencyKey?: string) =>
      fetchData<ApiResponse<boolean>>(`${lecturerBase}/committees/${id}/lock-session`, {
        method: "POST",
        body: {},
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
    getRevisionQueue: () => fetchData<ApiResponse<Record<string, unknown>[]>>(`${lecturerBase}/revision-queue`, { method: "GET" }),
    getScoringMatrix: (committeeId?: string | number) => fetchData<ApiResponse<Record<string, unknown>[]>>(`${lecturerBase}/scoring/matrix${committeeId != null ? `?committeeId=${committeeId}` : ""}`, { method: "GET" }),
    getScoringAlerts: (committeeId?: string | number) => fetchData<ApiResponse<Record<string, unknown>[]>>(`${lecturerBase}/scoring/alerts${committeeId != null ? `?committeeId=${committeeId}` : ""}`, { method: "GET" }),
    approveRevision: (revisionId: number, idempotencyKey?: string) => fetchData<ApiResponse<boolean>>(`${lecturerBase}/revisions/${revisionId}/approve`, { method: "POST", body: idempotencyKey ? { idempotencyKey } : {}, headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined }),
    rejectRevision: (revisionId: number, reason: string, idempotencyKey?: string) => fetchData<ApiResponse<boolean>>(`${lecturerBase}/revisions/${revisionId}/reject`, { method: "POST", body: { reason, ...(idempotencyKey ? { idempotencyKey } : {}) }, headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined }),
  };
  const currentRole: RoleCode = "Chair";
  const notifyError = (message: string) => addToast(message, "error");
  const notifySuccess = (message: string) => addToast(message, "success");
  const notifyInfo = (message: string) => addToast(message, "info");

  const [activePanel, setActivePanel] = useState<PanelKey>("councils");
  const [committees, setCommittees] = useState<Committee[]>([]);
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
  const [backendAllowedActions, setBackendAllowedActions] = useState<string[]>([]);

  const parseErrors = (errors: Record<string, string[]> | null | undefined) =>
    Object.values(errors ?? {}).flat().filter(Boolean);

  const hasAllowedAction = (...actions: string[]) => {
    if (backendAllowedActions.length === 0) {
      return true;
    }
    return actions.some((action) => backendAllowedActions.includes(action));
  };

  const notifyApiFailure = (response: ApiResponse<unknown> | null | undefined, fallback: string) => {
    if (response?.allowedActions) {
      setBackendAllowedActions(response.allowedActions);
    }
    if (response?.warnings?.length) {
      notifyInfo(response.warnings.map((item) => item.message).join(" | "));
    }
    if (!response?.success) {
      const messages = parseErrors(response?.errors);
      notifyError(messages[0] || response?.message || fallback);
      return true;
    }
    if (response?.message) {
      notifyInfo(response.message);
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
    rows.map((item) => ({
      revisionId: Number(item.revisionId ?? 0),
      studentCode: String(item.studentCode ?? "-"),
      topicTitle: String(item.topicTitle ?? "-"),
      status:
        String(item.status ?? "PENDING") === "APPROVED"
          ? "approved"
          : String(item.status ?? "PENDING") === "REJECTED"
            ? "rejected"
            : "pending",
      reason: item.reason != null ? String(item.reason) : undefined,
    }));

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
    const mappedMatrix: ScoringMatrixRow[] = matrixItems.map((item) => ({
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
    }));
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
          lecturerApi.getCommittees() as Promise<ApiResponse<{ items?: Array<Record<string, unknown>> }>>,
          lecturerApi.getRevisionQueue(),
        ]);

        if (committeeRes?.allowedActions) {
          setBackendAllowedActions(committeeRes.allowedActions);
        }

        const committeeItems =
          ((committeeRes?.data as { items?: Array<Record<string, unknown>> } | null)?.items ?? []) as Array<{
            committeeCode?: string;
            room?: string;
            session?: string;
            defenseDate?: string;
            startTime?: string;
            endTime?: string;
            studentCount?: number;
            status?: string;
            role?: string;
          }>;

        if (committeeItems.length) {
          const mapped = committeeItems.map((item, index) => ({
            id: item.committeeCode ?? `HD-${index + 1}`,
            room: item.room ?? "-",
            session: item.session === "AFTERNOON" ? "AFTERNOON" : "MORNING",
            date: item.defenseDate ? String(item.defenseDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
            slot: `${item.startTime ?? "08:00"} - ${item.endTime ?? "09:30"}`,
            studentCount: Number(item.studentCount ?? 0),
            status: item.status === "LOCKED" ? "Đã khóa" : item.status === "LIVE" ? "Đang họp" : "Sắp diễn ra",
            role: item.role ?? "Member",
          })) satisfies Committee[];
          setCommittees(mapped);
          setSelectedCommitteeId((prev) => (mapped.some((item) => item.id === prev) ? prev : mapped[0]?.id ?? ""));
        }

        if (!notifyApiFailure(revisionRes as ApiResponse<unknown>, "Không tải được hàng chờ chỉnh sửa.")) {
          const mappedRevisions = mapRevisionQueueRows((revisionRes?.data ?? []) as Array<Record<string, unknown>>);
          setRevisionQueue(mappedRevisions);
          setRevision(mappedRevisions[0] ?? EMPTY_REVISION);
        }
      } catch {
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

  const selectedCommittee = useMemo(
    () => committees.find((item) => item.id === selectedCommitteeId) ?? null,
    [committees, selectedCommitteeId]
  );
  const selectedCommitteeNumericId = useMemo(() => {
    const parsed = Number(String(selectedCommitteeId).replace(/\D+/g, ""));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }, [selectedCommitteeId]);

  const selectedMatrixRow = useMemo(
    () => scoringMatrix.find((row) => row.assignmentId === selectedAssignmentId) ?? null,
    [scoringMatrix, selectedAssignmentId]
  );

  const isChair = useMemo(() => {
    const role = String(selectedCommittee?.role ?? "").trim().toUpperCase();
    return role === "CHAIR" || role === "CT" || role.includes("CHU TICH");
  }, [selectedCommittee]);

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
          periodId,
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
    periodId,
  ]);

  const formatSession = (session: Committee["session"]) =>
    session === "MORNING" ? "MORNING (Sáng)" : "AFTERNOON (Chiều)";

  const pushTrace = (action: string, note?: string) => {
    const idempotencyKey = createIdempotencyKey(periodId, action);
    setLatestActionTrace({
      action,
      periodId,
      idempotencyKey,
      concurrencyToken: assignmentConcurrencyToken,
      note,
      at: new Date().toLocaleString("vi-VN"),
    });
    return idempotencyKey;
  };

  const handleSubmitScore = async () => {
    if (!isScoreValid) {
      notifyError(ucError("UC3.2-SCORE_INVALID"));
      return;
    }
    if (sessionLocked) {
      notifyError(ucError("UC3.3-SESSION_LOCKED"));
      return;
    }
    try {
      const idempotencyKey = createIdempotencyKey(periodId, "lecturer-score-submit");
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
      if (response?.idempotencyReplay) {
        notifyInfo("Yêu cầu gửi điểm đã được xử lý trước đó (idempotency replay).");
      } else {
        notifySuccess("Đã gửi điểm độc lập thành công.");
      }
    } catch {
      notifyError("Không gửi được điểm. Vui lòng thử lại.");
    }
  };

  return (
    <div
      style={{
        maxWidth: 1420,
        margin: "0 auto",
        padding: 24,
        position: "relative",
        fontFamily: '"Be Vietnam Pro", "Segoe UI", system-ui, sans-serif',
      }}
      className="lecturer-revamp-root"
    >
      <style>
        {`
          .lecturer-revamp-root {
            --lec-accent: #1d4ed8;
            --lec-ink: #0f172a;
            --lec-muted: #475569;
            --lec-line: #d9dde5;
            --lec-btn-h: 44px;
            --lec-input-h: 48px;
            --lec-pill-h: 44px;
            --lec-cell-px: 12px;
            font-family: "Be Vietnam Pro", "Segoe UI", system-ui, sans-serif;
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
            color: #64748b;
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
            color: #475569;
          }
          .lecturer-revamp-root .lec-control-bar {
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
          .lecturer-revamp-root .content { position:relative; z-index:1; }
          .lecturer-revamp-root button {
            font-family: "Be Vietnam Pro", "Segoe UI", system-ui, sans-serif;
            font-weight: 600;
            font-size: 14px;
            border-radius: 10px;
            color: #111827;
          }
          .lecturer-revamp-root input, .lecturer-revamp-root textarea, .lecturer-revamp-root select { border:1px solid var(--lec-line); border-radius:10px; padding:8px 12px; background:#fff; font-size:16px; }
          .lecturer-revamp-root input,
          .lecturer-revamp-root select {
            height: var(--lec-input-h);
            min-height: var(--lec-input-h);
            line-height: 1.2;
          }
          .lecturer-revamp-root textarea {
            min-height: 112px;
          }
          .lecturer-revamp-root input:focus, .lecturer-revamp-root textarea:focus, .lecturer-revamp-root select:focus { outline:none; border-color:var(--lec-accent); box-shadow:0 0 0 3px rgba(37,99,235,.14); }
          .lec-pill {
            border: 1px solid #cfd8e3;
            border-radius: 999px;
            min-height: 42px;
            padding: 0 16px;
            background: #ffffff;
            font-weight: 600;
            color: #334155;
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
            background: #f97316;
            transform: scaleX(0);
            transform-origin: center;
            transition: transform .24s ease;
          }
          .lec-pill.active {
            border-color: #1d4ed8;
            background: #eff6ff;
            color: #1e40af;
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
            background: #f8fafc;
            border: 1px solid #dbe2ea;
          }
          .lec-pill.active .pill-icon {
            background: #ffffff;
            border-color: #93c5fd;
          }
          .lec-pill:hover {
            border-color: #94a3b8;
            background: #ffffff;
            color: #0f172a;
          }
          .lec-primary {
              border: 1px solid #ea580c;
              border-radius: 12px;
              background: #f97316;
              color: #fff;
              padding: 0 16px;
              font-weight: 600;
              cursor: pointer;
              font-size: 14px;
              line-height: 1.2;
              min-height: var(--lec-btn-h);
              box-shadow: 0 6px 14px rgba(249, 115, 22, 0.26);
          }
            .lec-primary:hover:not(:disabled) { background: #ea580c; border-color:#ea580c; transform: translateY(-1px); box-shadow: 0 10px 18px rgba(234, 88, 12, 0.28); }
            .lec-primary:disabled {
              background: #94a3b8;
              border-color: #94a3b8;
              color: #fff;
              box-shadow: none;
              cursor: not-allowed;
            }
            .lec-accent {
              border: 1px solid #1e40af;
              border-radius: 12px;
              background: #1d4ed8;
              color: #fff;
              padding: 0 16px;
              font-weight: 600;
              min-height: var(--lec-btn-h);
              cursor: pointer;
            }
            .lec-accent:hover:not(:disabled) {
              border-color: #1e3a8a;
              background: #1e40af;
              transform: translateY(-1px);
            }
            .lec-accent:disabled {
              border-color: #fdba74;
              background: #fdba74;
              color: #fff;
              box-shadow: none;
              cursor: not-allowed;
            }
            .lec-ghost {
              border: 1px solid #cbd5e1;
              border-radius: 12px;
              background: #fff;
              color: #111827;
              padding: 0 14px;
              font-weight: 600;
              min-height: var(--lec-btn-h);
              cursor: pointer;
            }
            .lec-ghost:hover:not(:disabled) {
              border-color: #2563eb;
              background: #eff6ff;
              transform: translateY(-1px);
            }
            .lec-ghost:disabled {
              border-color: #e5e7eb;
              background: #f1f5f9;
              color: #64748b;
              box-shadow: none;
              cursor: not-allowed;
            }
          .lec-soft {
            border: 1px solid #cfd8e3;
            border-radius: 12px;
            background: #ffffff;
            color: #111827;
            padding: 0 14px;
            font-weight: 600;
            cursor: pointer;
            font-size: 14px;
            line-height: 1.2;
            min-height: var(--lec-btn-h);
          }
          .lec-soft:hover { background: #f8fafc; border-color:#94a3b8; transform: translateY(-1px); }
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
            border:1px solid #d7dfea;
            background:#ffffff;
            color:#475569;
            border-radius:12px;
            font-size:12px;
            font-weight:600;
            padding:6px 10px;
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
            border: "1px solid #e6e9ef",
            background: "#ffffff",
          }}
        >
          <h1 className="lec-heading" style={{ margin: 0, color: "#ea580c", display: "flex", alignItems: "center", gap: 10 }}>
            <Gavel size={30} color="#ea580c" /> Hội đồng và chấm điểm
          </h1>
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="lec-tag-live" style={{ animation: "none" }}>
              Period: {periodId}
            </span>
            <span className="lec-tag-live" style={{ animation: "none" }}>
              Vai trò: {selectedCommittee?.role ?? currentRole}
            </span>
          </div>
          <div style={{ marginTop: 12, border: "1px solid #e2e8f0", borderRadius: 10, padding: 10, background: "#f8fafc", fontSize: 13, color: "#475569" }}>
            Cập nhật gần nhất: {latestActionTrace?.at ?? "Chưa có"}
          </div>
        </section>

        <section style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
            <div style={{ border: "1px solid #BAE6FD", borderRadius: 14, padding: 12, background: "#FFFFFF" }}>
              <div className="lec-kicker">Đang họp</div>
              <div className="lec-value" style={{ color: "#0e7490" }}>{committeeStats.live}</div>
            </div>
            <div style={{ border: "1px solid #BAE6FD", borderRadius: 14, padding: 12, background: "#FFFFFF" }}>
              <div className="lec-kicker">Sắp diễn ra</div>
              <div className="lec-value" style={{ color: "#0369a1" }}>{committeeStats.upcoming}</div>
            </div>
            <div style={{ border: "1px solid #BAE6FD", borderRadius: 14, padding: 12, background: "#FFFFFF" }}>
              <div className="lec-kicker">Đã khóa</div>
              <div className="lec-value" style={{ color: "#0f172a" }}>{committeeStats.locked}</div>
            </div>
            <div style={{ border: "1px solid #BAE6FD", borderRadius: 14, padding: 12, background: "#FFFFFF" }}>
              <div className="lec-kicker">Chờ duyệt chỉnh sửa</div>
              <div className="lec-value" style={{ color: "#b45309" }}>{committeeStats.pendingRevision}</div>
            </div>
          </div>
        </section>

        <section style={{ ...cardStyle, marginBottom: 16 }}>
          <div className="lec-control-bar">
            {panels.map((panel) => (
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

        {activePanel === "councils" && (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <CalendarClock size={18} color="#0284C7" /> Danh sách hội đồng
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
              {loadingData && <div style={{ color: "#64748B", fontSize: 13 }}>Đang tải danh sách hội đồng...</div>}
              {committees.map((committee) => (
                <button
                  key={committee.id}
                  type="button"
                  onClick={() => {
                    setSelectedCommitteeId(committee.id);
                    setActivePanel("minutes");
                  }}
                  style={{
                    border: committee.id === selectedCommitteeId ? "1px solid #0284C7" : "1px solid #DBEAFE",
                    background:
                      committee.id === selectedCommitteeId
                        ? "linear-gradient(150deg, #EFF6FF 0%, #FFF7ED 100%)"
                        : "#FFFFFF",
                    borderRadius: 14,
                    padding: 14,
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 700, color: "#0F172A" }}>{committee.id}</div>
                  <div style={{ marginTop: 4, fontSize: 13, color: "#334155" }}>
                    <MapPin size={13} style={{ verticalAlign: "text-bottom", marginRight: 4, color: "#0284C7" }} />
                    {committee.room} · {formatSession(committee.session)} · {new Date(committee.date).toLocaleDateString("vi-VN")}
                  </div>
                  <div style={{ marginTop: 2, fontSize: 13, color: "#334155" }}>
                    <Clock4 size={13} style={{ verticalAlign: "text-bottom", marginRight: 4, color: "#F97316" }} />
                    Khung giờ: {committee.slot}
                  </div>
                  <div style={{ marginTop: 2, fontSize: 13, color: "#334155" }}>
                    <Users2 size={13} style={{ verticalAlign: "text-bottom", marginRight: 4, color: "#0284C7" }} />
                    Số sinh viên: {committee.studentCount}
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      display: "inline-flex",
                      padding: "4px 10px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                      color:
                        committee.status === "Đang họp"
                          ? "#0369A1"
                          : committee.status === "Sắp diễn ra"
                            ? "#B45309"
                            : "#166534",
                      background:
                        committee.status === "Đang họp"
                          ? "#E0F2FE"
                          : committee.status === "Sắp diễn ra"
                            ? "#FFEDD5"
                            : "#DCFCE7",
                    }}
                  >
                    {committee.status}
                  </div>
                </button>
              ))}
              {!loadingData && committees.length === 0 && (
                <div style={{ color: "#64748B", fontSize: 13 }}>Chưa có hội đồng từ API.</div>
              )}
            </div>
          </section>
        )}

        {activePanel === "minutes" && (
          <section style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
              <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <ClipboardPen size={18} color="#0284C7" /> Nhập biên bản hội đồng
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
              {committees.length === 0 && <div style={{ color: "#64748B", fontSize: 13 }}>Chưa có hội đồng để nhập biên bản.</div>}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
              <div style={{ display: "grid", gap: 12 }}>
                {selectedCommittee ? (
                  <div style={{ padding: 14, border: "1px solid #DBEAFE", borderRadius: 14, background: "linear-gradient(160deg, #F8FAFF 0%, #FFFFFF 100%)" }}>
                    <div style={{ fontSize: 12, color: "#64748B", marginBottom: 4 }}>Hội đồng đang thao tác</div>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>{selectedCommittee.id}</div>
                    <div style={{ marginTop: 8, display: "grid", gap: 6, fontSize: 13, color: "#334155" }}>
                      <div>Phòng: {selectedCommittee.room}</div>
                      <div>Phiên: {formatSession(selectedCommittee.session)}</div>
                      <div>Ngày: {new Date(selectedCommittee.date).toLocaleDateString("vi-VN")}</div>
                      <div>Giờ: {selectedCommittee.slot}</div>
                      <div>Assignment: {selectedMatrixRow?.assignmentCode ?? "-"}</div>
                      <div>Số SV: {selectedCommittee.studentCount}</div>
                    </div>
                  </div>
                ) : null}

                <div style={{ padding: 14, border: "1px solid #E2E8F0", borderRadius: 14, background: "#FFFFFF" }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Mẫu nhập</div>
                  <div style={{ display: "grid", gap: 8, fontSize: 13, color: "#475569" }}>
                    <div>• Tóm tắt</div>
                    <div>• Hỏi đáp</div>
                    <div>• Nhận xét</div>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                <label style={{ display: "grid", gap: 6, padding: 12, border: "1px solid #DBEAFE", borderRadius: 14, background: "#FFFFFF" }}>
                  <span style={{ fontWeight: 700, color: "#0F172A" }}>Tóm tắt nội dung</span>
                  <textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={5} />
                </label>
                <label style={{ display: "grid", gap: 6, padding: 12, border: "1px solid #DBEAFE", borderRadius: 14, background: "#FFFFFF" }}>
                  <span style={{ fontWeight: 700, color: "#0F172A" }}>Ý kiến phản biện</span>
                  <textarea value={review} onChange={(event) => setReview(event.target.value)} rows={5} />
                </label>
                <label style={{ display: "grid", gap: 6, padding: 12, border: "1px solid #DBEAFE", borderRadius: 14, background: "#FFFFFF" }}>
                  <span style={{ fontWeight: 700, color: "#0F172A" }}>Câu hỏi</span>
                  <textarea value={questions} onChange={(event) => setQuestions(event.target.value)} rows={5} />
                </label>
                <label style={{ display: "grid", gap: 6, padding: 12, border: "1px solid #DBEAFE", borderRadius: 14, background: "#FFFFFF" }}>
                  <span style={{ fontWeight: 700, color: "#0F172A" }}>Trả lời</span>
                  <textarea value={answers} onChange={(event) => setAnswers(event.target.value)} rows={5} />
                </label>
                <label style={{ display: "grid", gap: 6, padding: 12, border: "1px solid #FED7AA", borderRadius: 14, background: "#FFFFFF" }}>
                  <span style={{ fontWeight: 700, color: "#9A3412" }}>Điểm mạnh</span>
                  <textarea value={strengths} onChange={(event) => setStrengths(event.target.value)} rows={4} />
                </label>
                <label style={{ display: "grid", gap: 6, padding: 12, border: "1px solid #FED7AA", borderRadius: 14, background: "#FFFFFF" }}>
                  <span style={{ fontWeight: 700, color: "#9A3412" }}>Điểm yếu</span>
                  <textarea value={weaknesses} onChange={(event) => setWeaknesses(event.target.value)} rows={4} />
                </label>
                <label style={{ display: "grid", gap: 6, padding: 12, border: "1px solid #FED7AA", borderRadius: 14, background: "#FFFFFF" }}>
                  <span style={{ fontWeight: 700, color: "#9A3412" }}>Kiến nghị</span>
                  <textarea value={recommendations} onChange={(event) => setRecommendations(event.target.value)} rows={4} />
                </label>
              </div>
            </div>

            <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ fontSize: 13, color: "#64748B" }}>{lastAutoSave ? `Lưu gần nhất · ${lastAutoSave}` : ""}</div>
              <button
                type="button"
                className="lec-primary"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                onClick={async () => {
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
                    const idempotencyKey = createIdempotencyKey(periodId, "lecturer-minutes-save");
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
                disabled={!hasAllowedAction("UPDATE_MINUTES", "EDIT_MINUTES")}
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
                <Star size={18} color="#0284C7" /> Chấm điểm
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
                  disabled={submitted || sessionLocked}
                />
              </label>
              {!isScoreValid && <div style={{ color: "#B91C1C", marginTop: 6 }}>Điểm phải nằm trong khoảng 0 đến 10.</div>}

              <label style={{ display: "grid", gap: 6, marginTop: 8 }}>
                <span className="lec-label">Nhận xét</span>
                <textarea
                  rows={4}
                  value={myComment}
                  onChange={(event) => setMyComment(event.target.value)}
                  disabled={submitted || sessionLocked}
                />
              </label>

              <label style={{ display: "grid", gap: 6, marginTop: 8 }}>
                <span className="lec-label">Assignment</span>
                <select
                  value={selectedAssignmentId || ""}
                  onChange={(event) => setSelectedAssignmentId(Number(event.target.value) || 0)}
                  disabled={scoringMatrix.length === 0 || sessionLocked}
                >
                  {scoringMatrix.length === 0 && <option value="">Chưa có assignment từ scoring/matrix</option>}
                  {scoringMatrix.map((row) => (
                    <option key={row.assignmentId} value={row.assignmentId}>
                      {row.assignmentCode} · {row.studentCode} · {row.studentName}
                    </option>
                  ))}
                </select>
              </label>

              <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="lec-primary"
                  onClick={handleSubmitScore}
                  disabled={!isScoreValid || submitted || sessionLocked || !hasAllowedAction("SUBMIT_SCORE", "UC3.2.SUBMIT")}
                >
                  Gửi điểm
                </button>
                <button
                  type="button"
                  className="lec-soft"
                  disabled={!isChair || !hasAllowedAction("REOPEN_SCORE", "UC3.3.REOPEN")}
                  onClick={async () => {
                    if (!isChair) {
                      notifyError(ucError("UC3.4-CHAIR_ONLY"));
                      return;
                    }
                    try {
                      const idempotencyKey = createIdempotencyKey(periodId, "lecturer-score-reopen");
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
                      if (response?.idempotencyReplay) {
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
              {!isChair && <div style={{ marginTop: 8, color: "#B45309" }}>Chỉ Chair mới được yêu cầu mở lại.</div>}

              {submitted && <div style={{ marginTop: 8, color: "#166534" }}>Đã gửi điểm và khóa biểu mẫu cá nhân.</div>}
              {chairRequestedReopen && <div style={{ marginTop: 8, color: "#B45309" }}>Biểu mẫu đã mở lại theo yêu cầu Chủ tịch.</div>}
            </section>

            <section style={cardStyle}>
              <h2 className="lec-section-title" style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldCheck size={18} color="#0284C7" /> Cảnh báo và chốt ca
              </h2>

              <div style={{ border: "1px solid #DBEAFE", borderRadius: 12, padding: 10, marginBottom: 10 }}>
                <div style={{ fontWeight: 700 }}>Cảnh báo điểm lệch</div>
                <div style={{ marginTop: 6, fontSize: 14 }}>
                  Phương sai: <strong>{scoringOverview.variance ?? "-"}</strong> · Ngưỡng: {scoringOverview.varianceThreshold ?? "-"}
                </div>
                {hasVarianceAlert ? (
                  <div style={{ marginTop: 6, color: "#B91C1C", display: "flex", alignItems: "center", gap: 6 }}>
                    <ShieldAlert size={16} /> Điểm lệch vượt ngưỡng, cần thảo luận lại.
                  </div>
                ) : (
                  <div style={{ marginTop: 6, color: "#166534", display: "flex", alignItems: "center", gap: 6 }}>
                    <CheckCircle2 size={16} /> Điểm trong ngưỡng an toàn.
                  </div>
                )}
              </div>

              <div style={{ border: "1px solid #DBEAFE", borderRadius: 12, padding: 10, marginBottom: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 28, lineHeight: 1.16 }}>Tính điểm tổng hợp</div>
                <div style={{ color: "#64748B", fontSize: 13 }}>
                  Dữ liệu điểm tổng hợp được lấy trực tiếp từ backend.
                </div>
                <div style={{ marginTop: 8, fontSize: 13 }}>
                  Điểm tổng: <strong>{scoringOverview.finalScore ?? "-"}</strong> · Điểm chữ: <strong>{scoringOverview.finalLetter ?? "-"}</strong>
                </div>
              </div>

              <button
                type="button"
                className="lec-primary"
                style={{ background: sessionLocked ? "#94A3B8" : "linear-gradient(135deg,#334155 0%, #1E293B 100%)", display: "inline-flex", alignItems: "center", gap: 8 }}
                onClick={async () => {
                  if (!isChair) {
                    notifyError(ucError("UC3.4-CHAIR_ONLY"));
                    return;
                  }
                  try {
                    const idempotencyKey = createIdempotencyKey(periodId, "lecturer-score-lock");
                    const response = await lecturerApi.lockSessionByCommittee(selectedCommitteeNumericId, idempotencyKey);
                    if (notifyApiFailure(response as ApiResponse<unknown>, "Khóa phiên chấm thất bại.")) {
                      return;
                    }
                    setSessionLocked(true);
                    pushTrace("lock-session", "[UC3.5] Chair đã khóa phiên chấm.");
                    setAssignmentConcurrencyToken(createConcurrencyToken("lecturer-assignment"));
                    await refreshScoringData(selectedCommitteeNumericId);
                    if (response?.idempotencyReplay) {
                      notifyInfo("Yêu cầu khóa phiên đã được xử lý trước đó (idempotency replay).");
                    } else {
                      notifySuccess("Đã khóa hội đồng chấm điểm.");
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
                disabled={sessionLocked || !isChair || !hasAllowedAction("LOCK_SCORE", "LOCK_SESSION", "UC3.5.LOCK")}
              >
                <Lock size={15} /> {sessionLocked ? "Đã khóa ca bảo vệ" : "Khóa hội đồng"}
              </button>
              {!isChair && <div style={{ marginTop: 8, color: "#B45309" }}>Chỉ Chair mới có quyền khóa phiên chấm.</div>}
            </section>
          </div>
        )}

        {activePanel === "revision" && (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <FileCheck2 size={18} color="#0284C7" /> Duyệt bản chỉnh sửa
            </h2>

            <div style={{ border: "1px solid #DBEAFE", borderRadius: 12, padding: 12 }}>
              <div style={{ fontWeight: 700 }}>
                {revision.studentCode} · {revision.topicTitle}
              </div>
              <div style={{ marginTop: 6, color: "#64748B", fontSize: 13 }}>
                Mở tệp PDF, đọc nhận xét và đưa ra quyết định duyệt.
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="lec-soft"
                  disabled={!isChair || !hasAllowedAction("APPROVE_REVISION", "UC4.2.APPROVE")}
                  style={{ borderColor: "#16A34A", color: "#166534", background: "#F0FDF4", display: "inline-flex", alignItems: "center", gap: 6 }}
                  onClick={async () => {
                    if (!isChair) {
                      notifyError(ucError("UC3.4-CHAIR_ONLY"));
                      return;
                    }
                    try {
                      const revisionId = revision.revisionId || Number(String(revision.studentCode).replace(/\D+/g, "")) || 1;
                      const idempotencyKey = createIdempotencyKey(periodId, "lecturer-approve-revision");
                      const response = await lecturerApi.approveRevision(revisionId, idempotencyKey);
                      if (notifyApiFailure(response as ApiResponse<unknown>, "Không duyệt được bản chỉnh sửa.")) {
                        return;
                      }
                      await refreshRevisionQueue();
                      pushTrace("approve-revision", "[UC4.2] Duyệt bản chỉnh sửa.");
                      setAssignmentConcurrencyToken(createConcurrencyToken("lecturer-assignment"));
                      if (response?.idempotencyReplay) {
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
                  disabled={!isChair || !hasAllowedAction("REJECT_REVISION", "UC4.2.REJECT")}
                  style={{ borderColor: "#DC2626", color: "#B91C1C", background: "#FEF2F2", display: "inline-flex", alignItems: "center", gap: 6 }}
                  onClick={async () => {
                    if (!isChair) {
                      notifyError(ucError("UC3.4-CHAIR_ONLY"));
                      return;
                    }
                    if (!reopenReason.trim()) {
                      notifyError(ucError("UC4.2-REJECT_REASON_REQUIRED"));
                      return;
                    }
                    try {
                      const revisionId = revision.revisionId || Number(String(revision.studentCode).replace(/\D+/g, "")) || 1;
                      const idempotencyKey = createIdempotencyKey(periodId, "lecturer-reject-revision");
                      const response = await lecturerApi.rejectRevision(revisionId, reopenReason.trim(), idempotencyKey);
                      if (notifyApiFailure(response as ApiResponse<unknown>, "Không từ chối được bản chỉnh sửa.")) {
                        return;
                      }
                      await refreshRevisionQueue();
                      pushTrace("reject-revision", "[UC4.2] Từ chối bản chỉnh sửa có lý do.");
                      setAssignmentConcurrencyToken(createConcurrencyToken("lecturer-assignment"));
                      if (response?.idempotencyReplay) {
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
                <span style={{ fontSize: 12, color: "#64748B" }}>Lý do reject (bắt buộc theo UC)</span>
                <textarea value={reopenReason} onChange={(event) => setReopenReason(event.target.value)} rows={3} />
              </label>

              <div style={{ marginTop: 8, color: revision.status === "approved" ? "#166534" : revision.status === "rejected" ? "#B91C1C" : "#475569" }}>
                Trạng thái hiện tại: {revision.status}
              </div>
              {revision.reason && <div style={{ marginTop: 4, color: "#B91C1C", fontSize: 13 }}>Lý do: {revision.reason}</div>}
            </div>

            <div style={{ marginTop: 12, border: "1px solid #DBEAFE", borderRadius: 12, padding: 10 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Hàng chờ duyệt</div>
              {revisionQueue.map((item) => (
                <div key={`${item.studentCode}-${item.topicTitle}`} style={{ fontSize: 12, marginBottom: 7 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span>{item.studentCode} · {item.topicTitle}</span>
                    <span style={{ color: item.status === "approved" ? "#166534" : item.status === "rejected" ? "#B91C1C" : "#B45309" }}>
                      {item.status}
                    </span>
                  </div>
                  {item.reason && <div style={{ color: "#B91C1C" }}>Lý do từ chối: {item.reason}</div>}
                </div>
              ))}
              {revisionQueue.length === 0 && <div style={{ fontSize: 12, color: "#64748B" }}>Không có bản chỉnh sửa chờ duyệt.</div>}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default LecturerCommittees;
