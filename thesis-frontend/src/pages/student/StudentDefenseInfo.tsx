import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  createConcurrencyToken,
  createIdempotencyKey,
  ucError,
  type SessionCode,
  type WorkflowActionTrace,
} from "../../types/defense-workflow-contract";
import { useToast } from "../../context/useToast";
import { fetchData } from "../../api/fetchData";
import type { ApiResponse } from "../../types/api";
import { readEnvelopeData } from "../../utils/api-envelope";
import {
  extractDefensePeriodId,
  getActiveDefensePeriodId,
  normalizeDefensePeriodId,
  setActiveDefensePeriodId,
} from "../../utils/defensePeriod";

import {
  Bell,
  Calendar,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  Upload,
  Users,
  XCircle,
} from "lucide-react";

type Member = {
  role: "CT" | "TK" | "PB" | "GVHD";
  name: string;
};

type StudentNotification = {
  time: string;
  title: string;
  type: "info" | "warning" | "success";
};

type SubmissionHistory = {
  version: string;
  uploadedAt: string;
  status: "Pending" | "Approved" | "Rejected";
  note?: string;
};

type StudentPanel = "schedule" | "result" | "revision";

const EMPTY_DEFENSE = {
  periodId: "",
  assignmentId: "",
  studentCode: "",
  studentName: "",
  topic: "",
  defenseDate: "",
  startTime: "",
  endTime: "",
  session: "MORNING" as SessionCode,
  room: "",
  committeeCode: "",
  status: "",
  score: 0,
  letter: "",
  requiresRevision: false,
};

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  padding: 18,
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

const StudentDefenseInfo: React.FC = () => {
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const queryPeriodId = normalizeDefensePeriodId(searchParams.get("periodId"));
  const [periodId, setPeriodId] = useState<number | null>(
    () => queryPeriodId ?? getActiveDefensePeriodId(),
  );
  const periodIdText = String(periodId ?? "");
  const studentBase = periodId ? `/defense-periods/${periodId}/student` : "";
  const studentApi = {
    getSnapshot: () =>
      fetchData<ApiResponse<Record<string, unknown>>>(`${studentBase}/snapshot`, {
        method: "GET",
      }),
    submitRevisionSubmission: (formData: FormData, idempotencyKey?: string) => fetchData<ApiResponse<boolean>>(`${studentBase}/revisions`, {
      method: "POST",
      body: formData,
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
    }),
  };
  const [activePanel, setActivePanel] = useState<StudentPanel>("schedule");
  const [defenseInfo, setDefenseInfo] = useState(EMPTY_DEFENSE);
  const [members, setMembers] = useState<Member[]>([]);
  const [comments, setComments] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [submissionHistory, setSubmissionHistory] = useState<SubmissionHistory[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [revisedContent, setRevisedContent] = useState<string>("Em đã bổ sung phụ lục benchmark và đối sánh mô hình.");
  const [revisionConcurrencyToken, setRevisionConcurrencyToken] = useState(
    createConcurrencyToken("student-revision")
  );
  const [latestTrace, setLatestTrace] = useState<WorkflowActionTrace | null>(null);
  const [backendAllowedActions, setBackendAllowedActions] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const missingPeriodWarningRef = useRef(false);

  const notifyError = (message: string) => addToast(message, "error");
  const notifySuccess = (message: string) => addToast(message, "success");
  const notifyInfo = (message: string) => addToast(message, "info");

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

  const hasAllowedAction = (...actions: string[]) => {
    if (backendAllowedActions.length === 0) {
      return true;
    }
    return actions.some((action) => backendAllowedActions.includes(action));
  };

  const parseEnvelope = <T,>(response: ApiResponse<T> | null | undefined, fallback: string) => {
    const allowedActions = response?.allowedActions ?? response?.AllowedActions;
    if (allowedActions) {
      setBackendAllowedActions(allowedActions);
    }

    const warnings = (response?.warnings ?? response?.Warnings ?? [])
      .map((item) =>
        String(
          (item as { message?: string }).message ??
            (item as { Message?: string }).Message ??
            "",
        ),
      )
      .filter(Boolean);
    if (warnings.length) {
      notifyInfo(warnings.join(" | "));
    }

    const success = Boolean(response?.success ?? response?.Success);
    const errors = Object.values(response?.errors ?? response?.Errors ?? {})
      .flat()
      .filter(Boolean);
    const message = response?.message ?? response?.Message;
    if (!success) {
      notifyError(errors[0] || message || fallback);
      return { ok: false, data: null as T | null };
    }

    if (message) {
      notifyInfo(message);
    }

    return { ok: true, data: (response?.data ?? response?.Data ?? null) as T | null };
  };

  const hydrateRevisionHistory = (historyRows: Array<Record<string, unknown>>) => {
    const history = historyRows as Array<{
      version?: string;
      uploadedAt?: string;
      status?: string;
      note?: string;
    }>;
    setSubmissionHistory(
      history.map((item) => ({
        version: item.version ?? "v1.0",
        uploadedAt: item.uploadedAt ?? new Date().toLocaleString("vi-VN"),
        status: item.status === "Approved" ? "Approved" : item.status === "Rejected" ? "Rejected" : "Pending",
        note: item.note,
      }))
    );
  };

  useEffect(() => {
    const hydrateStudentData = async () => {
      if (!periodId) {
        setLoadingData(false);
        if (!missingPeriodWarningRef.current) {
          notifyInfo("Chua chon dot bao ve. Vui long chon dot de tai du lieu.");
          missingPeriodWarningRef.current = true;
        }
        return;
      }

      missingPeriodWarningRef.current = false;
      setLoadingData(true);
      try {
        const snapshotRes = await studentApi.getSnapshot();
        const parsedSnapshot = parseEnvelope(
          snapshotRes,
          "Không tải được snapshot sinh viên.",
        );
        if (!parsedSnapshot.ok || !parsedSnapshot.data) {
          return;
        }

        const snapshot = parsedSnapshot.data as Record<string, unknown>;
        const info = (snapshot.defenseInfo ?? snapshot.DefenseInfo ?? {}) as Partial<
          typeof EMPTY_DEFENSE
        >;
        const infoRecord = info as Partial<typeof EMPTY_DEFENSE> & {
          members?: Array<{ role?: "CT" | "TK" | "PB" | "GVHD"; name?: string }>;
          comments?: string[];
        };

        if (Object.keys(infoRecord).length > 0) {
          setDefenseInfo((prev) => ({
            ...prev,
            ...infoRecord,
            periodId: String(infoRecord.periodId ?? prev.periodId),
            assignmentId: String(infoRecord.assignmentId ?? prev.assignmentId),
            session:
              infoRecord.session === "AFTERNOON" ? "AFTERNOON" : "MORNING",
            score: Number(infoRecord.score ?? prev.score),
            requiresRevision: Boolean(
              infoRecord.requiresRevision ?? prev.requiresRevision,
            ),
          }));
          setMembers(
            Array.isArray(infoRecord.members)
              ? infoRecord.members.map((m) => ({
                  role: m.role ?? "PB",
                  name: m.name ?? "",
                }))
              : [],
          );
          setComments(
            Array.isArray(infoRecord.comments)
              ? infoRecord.comments.filter(Boolean)
              : [],
          );
        }

        const noti = (snapshot.notifications ?? snapshot.Notifications ?? []) as Array<
          Record<string, unknown>
        >;
        if (noti.length) {
          setNotifications(
            noti.map((item) => ({
              time: String(item.time ?? item.Time ?? new Date().toLocaleString("vi-VN")),
              title: String(item.title ?? item.Title ?? "Thông báo hệ thống"),
              type:
                String(item.type ?? item.Type).toLowerCase() === "warning"
                  ? "warning"
                  : String(item.type ?? item.Type).toLowerCase() === "success"
                    ? "success"
                    : "info",
            }))
          );
        }

        const revisionHistoryRows = (snapshot.revisionHistory ?? snapshot.RevisionHistory ?? []) as Array<
          Record<string, unknown>
        >;
        hydrateRevisionHistory(revisionHistoryRows);
      } catch {
        notifyError("Không tải được dữ liệu sinh viên từ API.");
      } finally {
        setLoadingData(false);
      }
    };

    void hydrateStudentData();
  }, [periodId]);

  const averageScore = useMemo(() => defenseInfo.score.toFixed(1), [defenseInfo.score]);

  const latestSubmission = useMemo(() => submissionHistory[0] ?? null, [submissionHistory]);

  const completionRate = useMemo(() => {
    if (!defenseInfo.requiresRevision) return 100;
    if (!latestSubmission) return 30;
    if (latestSubmission.status === "Approved") return 100;
    if (latestSubmission.status === "Rejected") return 55;
    return 80;
  }, [defenseInfo.requiresRevision, latestSubmission]);

  const submitRevision = () => {
    if (!periodId) {
      notifyError("Chua chon dot bao ve. Vui long chon dot truoc khi nop chinh sua.");
      return;
    }

    if (!selectedFile || !selectedFileName || !revisedContent.trim()) {
      notifyError(ucError("UC4.1-REVISION_EMPTY"));
      return;
    }
    const idempotencyKey = createIdempotencyKey(periodIdText || defenseInfo.periodId || "NA", "submit-revision");
    const assignmentId = Number(String(defenseInfo.assignmentId).replace(/\D+/g, "")) || 1;

    const formData = new FormData();
    formData.append("assignmentId", String(assignmentId));
    formData.append("revisedContent", revisedContent.trim());
    formData.append("file", selectedFile);

    studentApi.submitRevisionSubmission(formData, idempotencyKey)
      .then(async (response) => {
        const parsed = parseEnvelope(response, "Nộp bản chỉnh sửa thất bại.");
        if (!parsed.ok) {
          return;
        }
        setLatestTrace({
          action: "submit-revision",
          periodId: periodIdText || defenseInfo.periodId || "NA",
          idempotencyKey,
          concurrencyToken: revisionConcurrencyToken,
          note: "[UC4.1] Đã gửi bản chỉnh sửa theo assignment.",
          at: new Date().toLocaleString("vi-VN"),
        });
        setRevisionConcurrencyToken(createConcurrencyToken("student-revision"));
        const snapshotRes = await studentApi.getSnapshot();
        const parsedSnapshot = parseEnvelope(
          snapshotRes,
          "Không tải được snapshot sau khi nộp chỉnh sửa.",
        );
        if (parsedSnapshot.ok && parsedSnapshot.data) {
          const snapshot = parsedSnapshot.data as Record<string, unknown>;
          hydrateRevisionHistory(
            (snapshot.revisionHistory ?? snapshot.RevisionHistory ?? []) as Array<
              Record<string, unknown>
            >,
          );
        }
        if (response?.idempotencyReplay ?? response?.IdempotencyReplay) {
          notifyInfo("Yêu cầu nộp chỉnh sửa đã được xử lý trước đó (idempotency replay).");
        } else {
          notifySuccess("Đã nộp bản chỉnh sửa, đang chờ duyệt.");
        }
      })
      .catch(() => {
        notifyError("Nộp bản chỉnh sửa thất bại. Vui lòng thử lại.");
      });
  };

  const sessionLabel = defenseInfo.session === "MORNING" ? "MORNING (Sáng)" : "AFTERNOON (Chiều)";

  return (
    <div
      style={{
        maxWidth: 1320,
        margin: "0 auto",
        padding: 24,
        position: "relative",
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      }}
      className="student-revamp-root"
    >
      <style>
        {`
          .student-revamp-root {
            --stu-ink: #0f172a;
            --stu-muted: #64748b;
            --stu-line: #cbd5e1;
            --stu-main: #f37021;
            --stu-main-soft: #ffffff;
            --stu-accent: #f37021;
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            color: var(--stu-ink);
            background: radial-gradient(circle at top left, #ffffff 0%, #ffffff 38%);
            border-radius: 14px;
          }
          .student-revamp-root h1,
          .student-revamp-root h2,
          .student-revamp-root h3 {
            line-height: 1.25;
            letter-spacing: -0.01em;
          }
          .student-revamp-root .stu-kicker {
            font-size: 11px;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            font-weight: 700;
            color: #0f172a;
            line-height: 1.35;
          }
          .student-revamp-root .stu-value {
            font-size: 22px;
            font-weight: 700;
            line-height: 1.35;
            color: #0f172a;
            letter-spacing: -0.01em;
          }
          .student-revamp-root .stu-meta {
            font-size: 13px;
            line-height: 1.6;
            color: #0f172a;
          }
          .student-revamp-root .stu-control-bar {
            min-height: 56px;
            border: 1px solid #cbd5e1;
            border-radius: 12px;
            background: #ffffff;
            padding: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }
          .student-revamp-root .content { position:relative; z-index:1; }
          .student-revamp-root button {
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            font-weight: 600;
            font-size: 13px;
            border-radius: 10px;
            color: #0f172a;
          }
          .student-revamp-root input, .student-revamp-root textarea, .student-revamp-root select { border:1px solid var(--stu-line); border-radius:8px; padding:10px 12px; background:#ffffff; }
          .student-revamp-root input:focus, .student-revamp-root textarea:focus, .student-revamp-root select:focus { outline:none; border-color:var(--stu-main); box-shadow:0 0 0 3px rgba(243, 112, 33, .16); }
          .stu-pill {
            border: 1px solid #cbd5e1;
            border-radius:999px;
            min-height: 42px;
            padding:0 16px;
            font-weight:600;
            background:#ffffff;
            color:#0f172a;
            cursor:pointer;
            display:inline-flex;
            align-items:center;
            justify-content:center;
            gap:6px;
            line-height:1.15;
            position: relative;
            overflow: clip;
            transition: border-color .22s ease, background-color .22s ease, color .22s ease, transform .22s ease, box-shadow .22s ease;
          }
          .stu-pill::after {
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
            transition: transform .22s ease;
          }
          .stu-pill:hover::after,
          .stu-pill.active::after {
            transform: scaleX(1);
          }
          .stu-pill.active { border-color:#cbd5e1; background:#ffffff; color:#0f172a; box-shadow:none; }
          .stu-pill:hover { border-color:#cbd5e1; background:#ffffff; color:#0f172a; transform: translateY(-1px); }
          .stu-primary {
            border:none;
            border-radius:12px;
            background:#f37021;
            color:#ffffff;
            padding:8px 14px;
            font-weight:600;
            cursor:pointer;
            font-size:13px;
            line-height:1;
            min-height:40px;
          }
          .stu-primary:hover:not(:disabled) { background:#f37021; border-color:#f37021; }
          .stu-primary:disabled { background:#f8fafc; border:1px solid #cbd5e1; color:#64748b; cursor:not-allowed; }
          .stu-soft {
            border:1px solid #cbd5e1;
            border-radius:12px;
            background:#ffffff;
            color:#0f172a;
            padding:8px 14px;
            font-weight:600;
            cursor:pointer;
            font-size:13px;
            line-height:1;
            min-height:40px;
            transition: border-color .22s ease, background-color .22s ease, transform .22s ease, box-shadow .22s ease;
          }
          .stu-soft:hover { background:#ffffff; border-color:#cbd5e1; transform: translateY(-1px); box-shadow: 0 4px 10px rgba(0,0,0,.08); }
          .stu-upload {
            border:1px dashed #cbd5e1;
            border-radius:14px;
            padding:14px;
            background:linear-gradient(180deg,#ffffff 0%,#ffffff 100%);
            cursor:pointer;
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:8px;
            font-weight: 600;
            transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
          }
          .stu-upload:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(0,0,0,.08); border-color:#cbd5e1; }
          .student-revamp-root textarea {
            line-height: 1.45;
          }
          .stu-primary svg,
          .stu-soft svg,
          .stu-upload svg {
            width: 14px;
            height: 14px;
            flex: 0 0 14px;
          }
          .student-revamp-root button {
            line-height: 1.15;
          }
          .stu-panel {
            border: 1px solid #cbd5e1;
            border-radius: 14px;
            padding: 18px;
            background: linear-gradient(180deg, #ffffff 0%, #ffffff 100%);
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          }
          .stu-list {
            display: grid;
            gap: 10px;
          }
          .stu-list-item {
            border: 1px solid #cbd5e1;
            border-radius: 12px;
            padding: 12px 14px;
            background: #ffffff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.06);
            transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease, background-color .22s ease;
          }
          .stu-list-item:hover {
            transform: translateY(-1px);
            border-color: #cbd5e1;
            background: #ffffff;
            box-shadow: 0 6px 14px rgba(0,0,0,0.08);
          }
          .stu-list-item-title {
            font-size: 13px;
            font-weight: 700;
            color: #0f172a;
            line-height: 1.45;
          }
          .stu-list-item-sub {
            margin-top: 4px;
            font-size: 12px;
            color: #0f172a;
            line-height: 1.55;
          }
          .stu-list-empty {
            border: 1px dashed #cbd5e1;
            border-radius: 12px;
            padding: 14px;
            background: #ffffff;
            color: #0f172a;
            font-size: 13px;
            line-height: 1.55;
          }
          .stu-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 5px 10px;
            border-radius: 999px;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            color: #0f172a;
            font-size: 12px;
            font-weight: 700;
            line-height: 1;
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
          <h1 style={{ margin: 0, fontSize: 30, color: "#f37021", display: "flex", alignItems: "center", gap: 10, fontWeight: 700 }}>
            <GraduationCap size={30} color="#f37021" /> Thông tin bảo vệ
          </h1>
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="stu-pill active">Period: {defenseInfo.periodId}</span>
            <span className="stu-pill">Assignment: {defenseInfo.assignmentId}</span>
            <span className="stu-pill">Session: {sessionLabel}</span>
          </div>
          <div style={{ marginTop: 12, border: "1px solid #cbd5e1", borderRadius: 10, padding: 10, background: "#ffffff", fontSize: 13, color: "#0f172a" }}>
            {loadingData ? "Đang tải dữ liệu từ API..." : `Cập nhật gần nhất: ${latestTrace?.at ?? "Chưa có"}`}
          </div>
        </section>

        <section className="stu-panel" style={{ marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div>
              <div className="stu-kicker">MSSV</div>
              <div className="stu-value">{defenseInfo.studentCode}</div>
            </div>
            <div>
              <div className="stu-kicker">Điểm tổng kết</div>
              <div className="stu-value">{averageScore} ({defenseInfo.letter})</div>
            </div>
            <div>
              <div className="stu-kicker">Trạng thái công bố</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", display: "inline-flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={18} /> {defenseInfo.status}
              </div>
            </div>
            <div>
              <div className="stu-kicker">Tiến độ hoàn tất hồ sơ</div>
              <div style={{ marginTop: 8, height: 10, borderRadius: 999, background: "#f37021", overflow: "hidden" }}>
                <div style={{ width: `${completionRate}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#f37021 0%,#f37021 100%)" }} />
              </div>
              <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{completionRate}%</div>
            </div>
          </div>
        </section>

        <section style={{ ...cardStyle, marginBottom: 16 }}>
          <div className="stu-control-bar">
            <button type="button" className={`stu-pill ${activePanel === "schedule" ? "active" : ""}`} onClick={() => setActivePanel("schedule")}>
              <Calendar size={15} /> Lịch & hội đồng
            </button>
            <button type="button" className={`stu-pill ${activePanel === "result" ? "active" : ""}`} onClick={() => setActivePanel("result")}>
              <Bell size={15} /> Kết quả & thông báo
            </button>
            <button type="button" className={`stu-pill ${activePanel === "revision" ? "active" : ""}`} onClick={() => setActivePanel("revision")}>
              <Upload size={15} /> Nộp chỉnh sửa
            </button>
          </div>
        </section>

        {activePanel === "schedule" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            <section className="stu-panel">
              <h2 style={{ marginTop: 0, fontSize: 19, display: "flex", gap: 8, alignItems: "center" }}>
                <Calendar size={18} color="#0f172a" /> Lịch bảo vệ
              </h2>
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ padding: 10, borderRadius: 12, border: "1px solid #cbd5e1", background: "#ffffff" }}>
                  <div className="stu-kicker">Sinh viên</div>
                  <div style={{ fontWeight: 700 }}>{defenseInfo.studentName}</div>
                </div>
                <div style={{ padding: 10, borderRadius: 12, border: "1px solid #cbd5e1", background: "#ffffff" }}>
                  <div className="stu-kicker">Đề tài</div>
                  <div style={{ fontWeight: 700 }}>{defenseInfo.topic}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
                  <div style={{ padding: 10, borderRadius: 12, border: "1px solid #cbd5e1", background: "#ffffff" }}>
                    <div style={{ fontSize: 12, color: "#0f172a" }}>Ngày</div>
                    <div style={{ fontWeight: 700 }}>{new Date(defenseInfo.defenseDate).toLocaleDateString("vi-VN")}</div>
                  </div>
                  <div style={{ padding: 10, borderRadius: 12, border: "1px solid #cbd5e1", background: "#ffffff" }}>
                    <div style={{ fontSize: 12, color: "#0f172a" }}>Thời gian</div>
                    <div style={{ fontWeight: 700 }}>{defenseInfo.startTime} - {defenseInfo.endTime}</div>
                  </div>
                  <div style={{ padding: 10, borderRadius: 12, border: "1px solid #cbd5e1", background: "#ffffff" }}>
                    <div style={{ fontSize: 12, color: "#0f172a" }}>Phòng</div>
                    <div style={{ fontWeight: 700 }}>{defenseInfo.room}</div>
                  </div>
                </div>
                <div style={{ padding: 10, borderRadius: 12, border: "1px solid #cbd5e1", background: "#ffffff" }}>
                  <div style={{ fontSize: 12, color: "#0f172a" }}>Mã hội đồng</div>
                  <div style={{ fontWeight: 700 }}>{defenseInfo.committeeCode}</div>
                </div>
                <div style={{ padding: 10, borderRadius: 12, border: "1px solid #cbd5e1", background: "#ffffff" }}>
                  <div style={{ fontSize: 12, color: "#0f172a" }}>Mã assignment</div>
                  <div style={{ fontWeight: 700 }}>{defenseInfo.assignmentId}</div>
                </div>
              </div>
            </section>

            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, fontSize: 19, display: "flex", gap: 8, alignItems: "center" }}>
                <Users size={18} color="#0f172a" /> Thành viên
              </h2>
              <div className="stu-list">
                {members.map((member) => (
                  <div key={`${member.role}-${member.name}`} className="stu-list-item">
                    <div className="stu-badge">{member.role}</div>
                    <div className="stu-list-item-title">{member.name}</div>
                  </div>
                ))}
                {members.length === 0 && <div className="stu-list-empty">Chưa có danh sách thành viên từ API.</div>}
              </div>
            </section>
          </div>
        )}

        {activePanel === "result" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            <section className="stu-panel">
              <h2 style={{ marginTop: 0, fontSize: 19, display: "flex", gap: 8, alignItems: "center" }}>
                <FileText size={18} color="#0f172a" /> Kết luận hội đồng
              </h2>
              <div style={{ marginBottom: 8 }}>Điểm = (GVHD + CT + TK + PB) / 4</div>
              <div style={{ marginBottom: 10, color: "#0f172a" }}>
                Điểm đã làm tròn: <strong>{averageScore}</strong> · Điểm chữ: <strong>{defenseInfo.letter}</strong>
              </div>
              <div className="stu-list">
                {comments.map((item, idx) => (
                  <div key={idx} className="stu-list-item">
                    <div className="stu-list-item-title">Nhận xét {idx + 1}</div>
                    <div className="stu-list-item-sub">{item}</div>
                  </div>
                ))}
                {comments.length === 0 && <div className="stu-list-empty">Chưa có nhận xét hội đồng từ API.</div>}
              </div>
            </section>

            <section className="stu-panel">
              <h2 style={{ marginTop: 0, fontSize: 19, display: "flex", gap: 8, alignItems: "center" }}>
                <Clock3 size={18} color="#0f172a" /> Thông báo nghiệp vụ
              </h2>
              <div className="stu-list">
                {notifications.map((item: StudentNotification) => (
                  <div key={`${item.time}-${item.title}`} className="stu-list-item">
                    <div className="stu-kicker" style={{ textTransform: "none", letterSpacing: 0 }}>{item.time}</div>
                    <div className="stu-list-item-title">{item.title}</div>
                    <div className="stu-list-item-sub" style={{ color: item.type === "success" ? "#0f172a" : item.type === "warning" ? "#f37021" : "#0f172a", fontWeight: 600 }}>
                      {item.type.toUpperCase()}
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && <div className="stu-list-empty">Chưa có thông báo nghiệp vụ.</div>}
              </div>
            </section>
          </div>
        )}

        {activePanel === "revision" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            <section className="stu-panel">
              <h2 style={{ marginTop: 0, fontSize: 19, display: "flex", gap: 8, alignItems: "center" }}>
                <Upload size={18} color="#0f172a" /> Nộp bản chỉnh sửa
              </h2>
              {defenseInfo.requiresRevision ? (
                <>
                  <label style={{ display: "grid", gap: 6, marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: "#0f172a" }}>Nội dung chỉnh sửa</span>
                    <textarea value={revisedContent} onChange={(event) => setRevisedContent(event.target.value)} rows={4} />
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      const fileName = file?.name ?? "";
                      setSelectedFile(file);
                      setSelectedFileName(fileName);
                      if (fileName) {
                        notifyInfo(`Đã chọn tệp: ${fileName}`);
                      }
                    }}
                    style={{ display: "none" }}
                  />

                  <button type="button" className="stu-upload" onClick={() => fileInputRef.current?.click()}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#0f172a", fontWeight: 700 }}>
                      <Upload size={15} /> Chọn file đính kèm
                    </span>
                    <span style={{ color: "#0f172a", fontSize: 13 }}>
                      {selectedFileName || "Chưa có file nào được chọn"}
                    </span>
                  </button>

                  <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                    <button type="button" className="stu-primary" onClick={submitRevision} disabled={!selectedFileName || !revisedContent.trim() || latestSubmission?.status === "Approved" || !hasAllowedAction("SUBMIT_REVISION", "UC4.1.SUBMIT") }>
                      Nộp bản chỉnh sửa
                    </button>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    {!latestSubmission && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#0f172a" }}>
                        <Clock3 size={16} /> Trạng thái: Chưa nộp bản chỉnh sửa.
                      </div>
                    )}
                    {latestSubmission?.status === "Pending" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#0f172a" }}>
                        <Clock3 size={16} /> Trạng thái: Đã nộp, đang chờ duyệt.
                      </div>
                    )}
                    {latestSubmission?.status === "Approved" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#0f172a" }}>
                        <CheckCircle2 size={16} /> Trạng thái: Hoàn thành 100%.
                      </div>
                    )}
                    {latestSubmission?.status === "Rejected" && (
                      <div style={{ display: "grid", gap: 6, color: "#0f172a" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <XCircle size={16} /> Trạng thái: Bị từ chối, vui lòng nộp lại.
                        </div>
                        <div style={{ fontSize: 13, border: "1px solid #cbd5e1", background: "#ffffff", borderRadius: 8, padding: 8 }}>
                          Lý do: {latestSubmission.note || "Vui lòng cập nhật bản chỉnh sửa theo phản hồi hội đồng."}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ color: "#0f172a" }}>Không yêu cầu chỉnh sửa sau bảo vệ.</div>
              )}
            </section>

            <section className="stu-panel">
              <h2 style={{ marginTop: 0, fontSize: 19, display: "flex", gap: 8, alignItems: "center" }}>
                <CheckCircle2 size={18} color="#0f172a" /> Lịch sử nộp bản chỉnh sửa
              </h2>
              <div className="stu-list">
                {submissionHistory.map((item: SubmissionHistory) => (
                  <div key={`${item.version}-${item.uploadedAt}`} className="stu-list-item">
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                      <span className="stu-list-item-title">{item.version}</span>
                      <span className="stu-badge" style={{ color: item.status === "Approved" ? "#0f172a" : item.status === "Rejected" ? "#0f172a" : "#0f172a", background: item.status === "Approved" ? "#ffffff" : item.status === "Rejected" ? "#ffffff" : "#ffffff", borderColor: item.status === "Approved" ? "#0f172a" : item.status === "Rejected" ? "#0f172a" : "#0f172a" }}>
                        {item.status}
                      </span>
                    </div>
                    <div className="stu-list-item-sub">{item.uploadedAt}</div>
                    {item.note && <div className="stu-list-item-sub" style={{ color: "#0f172a" }}>Ghi chú: {item.note}</div>}
                  </div>
                ))}
                {submissionHistory.length === 0 && <div className="stu-list-empty">Chưa có lịch sử nộp bản chỉnh sửa.</div>}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDefenseInfo;
