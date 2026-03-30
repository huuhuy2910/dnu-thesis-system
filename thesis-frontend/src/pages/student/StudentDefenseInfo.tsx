import React, { useEffect, useMemo, useRef, useState } from "react";
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
  border: "1px solid #e6e9ef",
  borderRadius: 10,
  padding: 18,
  boxShadow: "0 2px 8px rgba(15,23,42,0.05)",
};

const StudentDefenseInfo: React.FC = () => {
  const { addToast } = useToast();
  const periodId = "2026.1";
  const studentBase = `/v1/defense-periods/${encodeURIComponent(periodId)}/student`;
  const studentApi = {
    getDefenseInfo: () => fetchData<ApiResponse<Record<string, unknown>>>(`${studentBase}/defense-info`, { method: "GET" }),
    getNotifications: () => fetchData<ApiResponse<Array<Record<string, unknown>>>>(`${studentBase}/notifications`, { method: "GET" }),
    submitRevisionSubmission: (formData: FormData, idempotencyKey?: string) => fetchData<ApiResponse<boolean>>(`${studentBase}/revision-submissions`, {
      method: "POST",
      body: formData,
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
    }),
    getRevisionHistory: () => fetchData<ApiResponse<Array<Record<string, unknown>>>>(`${studentBase}/revision-submissions/history`, { method: "GET" }),
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

  const notifyError = (message: string) => addToast(message, "error");
  const notifySuccess = (message: string) => addToast(message, "success");
  const notifyInfo = (message: string) => addToast(message, "info");

  const hasAllowedAction = (...actions: string[]) => {
    if (backendAllowedActions.length === 0) {
      return true;
    }
    return actions.some((action) => backendAllowedActions.includes(action));
  };

  const parseEnvelope = <T,>(response: ApiResponse<T> | null | undefined, fallback: string) => {
    if (response?.allowedActions) {
      setBackendAllowedActions(response.allowedActions);
    }
    if (response?.warnings?.length) {
      notifyInfo(response.warnings.map((item) => item.message).join(" | "));
    }
    if (!response?.success) {
      const errors = Object.values(response?.errors ?? {}).flat().filter(Boolean);
      notifyError(errors[0] || response?.message || fallback);
      return { ok: false, data: null as T | null };
    }
    if (response?.message) {
      notifyInfo(response.message);
    }
    return { ok: true, data: response.data ?? null };
  };

  const hydrateRevisionHistory = async () => {
    const historyRes = await studentApi.getRevisionHistory();
    const parsedHistory = parseEnvelope(historyRes, "Không tải được lịch sử chỉnh sửa.");
    const history = ((parsedHistory.data as Array<Record<string, unknown>> | null) ?? []) as Array<{
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
      setLoadingData(true);
      try {
        const [infoRes, notificationsRes] = await Promise.all([
          studentApi.getDefenseInfo(),
          studentApi.getNotifications(),
        ]);

        const parsedInfo = parseEnvelope(infoRes, "Không tải được thông tin bảo vệ.");
        const parsedNoti = parseEnvelope(notificationsRes, "Không tải được thông báo.");
        if (!parsedInfo.ok || !parsedNoti.ok) {
          return;
        }

        const info = (parsedInfo.data ?? {}) as Partial<typeof EMPTY_DEFENSE> & {
          members?: Array<{ role?: "CT" | "TK" | "PB" | "GVHD"; name?: string }>;
          comments?: string[];
        };
        if (Object.keys(info).length > 0) {
          setDefenseInfo((prev) => ({
            ...prev,
            ...info,
            periodId: String(info.periodId ?? prev.periodId),
            assignmentId: String(info.assignmentId ?? prev.assignmentId),
            session: info.session === "AFTERNOON" ? "AFTERNOON" : "MORNING",
            score: Number(info.score ?? prev.score),
            requiresRevision: Boolean(info.requiresRevision ?? prev.requiresRevision),
          }));
          setMembers(Array.isArray(info.members) ? info.members.map((m) => ({ role: m.role ?? "PB", name: m.name ?? "" })) : []);
          setComments(Array.isArray(info.comments) ? info.comments.filter(Boolean) : []);
        }

        const noti = ((parsedNoti.data as Array<Record<string, unknown>> | null) ?? []) as Array<{ time?: string; title?: string; type?: string }>;
        if (noti.length) {
          setNotifications(
            noti.map((item) => ({
              time: item.time ?? new Date().toLocaleString("vi-VN"),
              title: item.title ?? "Thông báo hệ thống",
              type: item.type === "warning" ? "warning" : item.type === "success" ? "success" : "info",
            }))
          );
        }

        await hydrateRevisionHistory();
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
    if (!selectedFile || !selectedFileName || !revisedContent.trim()) {
      notifyError(ucError("UC4.1-REVISION_EMPTY"));
      return;
    }
    const idempotencyKey = createIdempotencyKey(defenseInfo.periodId, "submit-revision");
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
          periodId: defenseInfo.periodId,
          idempotencyKey,
          concurrencyToken: revisionConcurrencyToken,
          note: "[UC4.1] Đã gửi bản chỉnh sửa theo assignment.",
          at: new Date().toLocaleString("vi-VN"),
        });
        setRevisionConcurrencyToken(createConcurrencyToken("student-revision"));
        await hydrateRevisionHistory();
        if (response?.idempotencyReplay) {
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
        fontFamily: '"Be Vietnam Pro", "Segoe UI", system-ui, sans-serif',
      }}
      className="student-revamp-root"
    >
      <style>
        {`
          .student-revamp-root {
            --stu-ink: #0f172a;
            --stu-muted: #64748b;
            --stu-line: #d9dde5;
            --stu-main: #f97316;
            --stu-accent: #f97316;
            font-family: "Be Vietnam Pro", "Segoe UI", system-ui, sans-serif;
            color: var(--stu-ink);
            background: #ffffff;
            border-radius: 12px;
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
            color: #64748b;
            line-height: 1.35;
          }
          .student-revamp-root .stu-value {
            font-size: 24px;
            font-weight: 700;
            line-height: 1.2;
            color: #0f172a;
          }
          .student-revamp-root .stu-meta {
            font-size: 13px;
            line-height: 1.45;
            color: #475569;
          }
          .student-revamp-root .stu-control-bar {
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
          .student-revamp-root .content { position:relative; z-index:1; }
          .student-revamp-root button {
            font-family: "Be Vietnam Pro", "Segoe UI", system-ui, sans-serif;
            font-weight: 600;
            font-size: 14px;
            border-radius: 10px;
            color: #111827;
          }
          .student-revamp-root input, .student-revamp-root textarea, .student-revamp-root select { border:1px solid var(--stu-line); border-radius:10px; padding:8px 10px; background:#fff; }
          .student-revamp-root input:focus, .student-revamp-root textarea:focus, .student-revamp-root select:focus { outline:none; border-color:var(--stu-main); box-shadow:0 0 0 3px rgba(37,99,235,.14); }
          .stu-pill {
            border: 1px solid #cfd8e3;
            border-radius:999px;
            min-height: 42px;
            padding:0 16px;
            font-weight:600;
            background:#ffffff;
            color:#334155;
            cursor:pointer;
            display:inline-flex;
            align-items:center;
            justify-content:center;
            gap:6px;
            line-height:1.15;
            position: relative;
            overflow: clip;
            transition: border-color .22s ease, background-color .22s ease, color .22s ease;
          }
          .stu-pill::after {
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
            transition: transform .22s ease;
          }
          .stu-pill:hover::after,
          .stu-pill.active::after {
            transform: scaleX(1);
          }
          .stu-pill.active { border-color:#1d4ed8; background:#eff6ff; color:#1e40af; }
          .stu-pill:hover { border-color:#94a3b8; background:#ffffff; color:#0f172a; }
          .stu-primary {
            border:1px solid #ea580c;
            border-radius:12px;
            background:#f97316;
            color:#fff;
            padding:8px 14px;
            font-weight:600;
            cursor:pointer;
            font-size:13px;
            line-height:1;
            min-height:40px;
          }
          .stu-primary:hover:not(:disabled) { background:#ea580c; border-color:#ea580c; }
          .stu-primary:disabled { background:#94A3B8; border-color:#94A3B8; cursor:not-allowed; }
          .stu-soft {
            border:1px solid #cfd8e3;
            border-radius:12px;
            background:#fff;
            color:#0f172a;
            padding:8px 14px;
            font-weight:600;
            cursor:pointer;
            font-size:13px;
            line-height:1;
            min-height:40px;
          }
          .stu-upload {
            border:1px dashed #f97316;
            border-radius:12px;
            padding:14px;
            background:#fffaf5;
            cursor:pointer;
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:8px;
            font-weight: 600;
          }
          .stu-soft:hover { background:#f8fafc; border-color:#94a3b8; }
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
          <h1 style={{ margin: 0, fontSize: 30, color: "#ea580c", display: "flex", alignItems: "center", gap: 10, fontWeight: 700 }}>
            <GraduationCap size={30} color="#ea580c" /> Thông tin bảo vệ
          </h1>
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="stu-pill active">Period: {defenseInfo.periodId}</span>
            <span className="stu-pill">Assignment: {defenseInfo.assignmentId}</span>
            <span className="stu-pill">Session: {sessionLabel}</span>
          </div>
          <div style={{ marginTop: 12, border: "1px solid #e2e8f0", borderRadius: 10, padding: 10, background: "#f8fafc", fontSize: 13, color: "#475569" }}>
            {loadingData ? "Đang tải dữ liệu từ API..." : `Cập nhật gần nhất: ${latestTrace?.at ?? "Chưa có"}`}
          </div>
        </section>

        <section style={{ ...cardStyle, marginBottom: 16 }}>
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
              <div style={{ fontSize: 22, fontWeight: 700, color: "#166534", display: "inline-flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={18} /> {defenseInfo.status}
              </div>
            </div>
            <div>
              <div className="stu-kicker">Tiến độ hoàn tất hồ sơ</div>
              <div style={{ marginTop: 8, height: 10, borderRadius: 999, background: "#FED7AA", overflow: "hidden" }}>
                <div style={{ width: `${completionRate}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#EA580C 0%,#FB923C 100%)" }} />
              </div>
              <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700, color: "#9A3412" }}>{completionRate}%</div>
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
            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, fontSize: 19, display: "flex", gap: 8, alignItems: "center" }}>
                <Calendar size={18} color="#2563EB" /> Lịch bảo vệ
              </h2>
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ padding: 10, borderRadius: 12, border: "1px solid #DBEAFE", background: "#F8FAFF" }}>
                  <div className="stu-kicker">Sinh viên</div>
                  <div style={{ fontWeight: 700 }}>{defenseInfo.studentName}</div>
                </div>
                <div style={{ padding: 10, borderRadius: 12, border: "1px solid #E2E8F0", background: "#FFFFFF" }}>
                  <div className="stu-kicker">Đề tài</div>
                  <div style={{ fontWeight: 700 }}>{defenseInfo.topic}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
                  <div style={{ padding: 10, borderRadius: 12, border: "1px solid #DBEAFE", background: "#F8FAFF" }}>
                    <div style={{ fontSize: 12, color: "#64748B" }}>Ngày</div>
                    <div style={{ fontWeight: 700 }}>{new Date(defenseInfo.defenseDate).toLocaleDateString("vi-VN")}</div>
                  </div>
                  <div style={{ padding: 10, borderRadius: 12, border: "1px solid #FED7AA", background: "#FFF7ED" }}>
                    <div style={{ fontSize: 12, color: "#9A3412" }}>Thời gian</div>
                    <div style={{ fontWeight: 700 }}>{defenseInfo.startTime} - {defenseInfo.endTime}</div>
                  </div>
                  <div style={{ padding: 10, borderRadius: 12, border: "1px solid #E2E8F0", background: "#FFFFFF" }}>
                    <div style={{ fontSize: 12, color: "#64748B" }}>Phòng</div>
                    <div style={{ fontWeight: 700 }}>{defenseInfo.room}</div>
                  </div>
                </div>
                <div style={{ padding: 10, borderRadius: 12, border: "1px solid #FED7AA", background: "#FFF7ED" }}>
                  <div style={{ fontSize: 12, color: "#9A3412" }}>Mã hội đồng</div>
                  <div style={{ fontWeight: 700 }}>{defenseInfo.committeeCode}</div>
                </div>
                <div style={{ padding: 10, borderRadius: 12, border: "1px solid #DBEAFE", background: "#F8FAFF" }}>
                  <div style={{ fontSize: 12, color: "#1E3A8A" }}>Mã assignment</div>
                  <div style={{ fontWeight: 700 }}>{defenseInfo.assignmentId}</div>
                </div>
              </div>
            </section>

            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, fontSize: 19, display: "flex", gap: 8, alignItems: "center" }}>
                <Users size={18} color="#2563EB" /> Thành viên
              </h2>
              <div style={{ display: "grid", gap: 8 }}>
                {members.map((member) => (
                  <div key={`${member.role}-${member.name}`} style={{ border: "1px solid #DBEAFE", borderRadius: 12, padding: 10, background: "#FFFFFF" }}>
                    <div style={{ color: "#64748B", fontSize: 12 }}>{member.role}</div>
                    <div style={{ fontWeight: 700 }}>{member.name}</div>
                  </div>
                ))}
                {members.length === 0 && <div style={{ color: "#64748B", fontSize: 13 }}>Chưa có danh sách thành viên từ API.</div>}
              </div>
            </section>
          </div>
        )}

        {activePanel === "result" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, fontSize: 19, display: "flex", gap: 8, alignItems: "center" }}>
                <FileText size={18} color="#2563EB" /> Kết luận hội đồng
              </h2>
              <div style={{ marginBottom: 8 }}>Điểm = (GVHD + CT + TK + PB) / 4</div>
              <div style={{ marginBottom: 10, color: "#334155" }}>
                Điểm đã làm tròn: <strong>{averageScore}</strong> · Điểm chữ: <strong>{defenseInfo.letter}</strong>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {comments.map((item, idx) => (
                  <div key={idx} style={{ border: "1px solid #DBEAFE", borderRadius: 10, padding: 10, color: "#334155" }}>
                    {item}
                  </div>
                ))}
                {comments.length === 0 && <div style={{ color: "#64748B", fontSize: 13 }}>Chưa có nhận xét hội đồng từ API.</div>}
              </div>
            </section>

            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, fontSize: 19, display: "flex", gap: 8, alignItems: "center" }}>
                <Clock3 size={18} color="#2563EB" /> Thông báo nghiệp vụ
              </h2>
              <div style={{ display: "grid", gap: 8 }}>
                {notifications.map((item: StudentNotification) => (
                  <div key={`${item.time}-${item.title}`} style={{ border: "1px solid #DBEAFE", borderRadius: 10, padding: 10 }}>
                    <div className="stu-kicker" style={{ textTransform: "none", letterSpacing: 0 }}>{item.time}</div>
                    <div style={{ fontWeight: 600 }}>{item.title}</div>
                    <div className="stu-meta" style={{ color: item.type === "success" ? "#166534" : item.type === "warning" ? "#B45309" : "#1D4ED8", fontWeight: 600 }}>
                      {item.type.toUpperCase()}
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && <div style={{ color: "#64748B", fontSize: 13 }}>Chưa có thông báo nghiệp vụ.</div>}
              </div>
            </section>
          </div>
        )}

        {activePanel === "revision" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, fontSize: 19, display: "flex", gap: 8, alignItems: "center" }}>
                <Upload size={18} color="#2563EB" /> Nộp bản chỉnh sửa
              </h2>
              {defenseInfo.requiresRevision ? (
                <>
                  <label style={{ display: "grid", gap: 6, marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: "#64748B" }}>Nội dung chỉnh sửa</span>
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
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#1E3A8A", fontWeight: 700 }}>
                      <Upload size={15} /> Chọn file đính kèm
                    </span>
                    <span style={{ color: "#334155", fontSize: 13 }}>
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
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#475569" }}>
                        <Clock3 size={16} /> Trạng thái: Chưa nộp bản chỉnh sửa.
                      </div>
                    )}
                    {latestSubmission?.status === "Pending" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#1D4ED8" }}>
                        <Clock3 size={16} /> Trạng thái: Đã nộp, đang chờ duyệt.
                      </div>
                    )}
                    {latestSubmission?.status === "Approved" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#166534" }}>
                        <CheckCircle2 size={16} /> Trạng thái: Hoàn thành 100%.
                      </div>
                    )}
                    {latestSubmission?.status === "Rejected" && (
                      <div style={{ display: "grid", gap: 6, color: "#B91C1C" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <XCircle size={16} /> Trạng thái: Bị từ chối, vui lòng nộp lại.
                        </div>
                        <div style={{ fontSize: 13, border: "1px solid #FECACA", background: "#FEF2F2", borderRadius: 8, padding: 8 }}>
                          Lý do: {latestSubmission.note || "Vui lòng cập nhật bản chỉnh sửa theo phản hồi hội đồng."}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ color: "#166534" }}>Không yêu cầu chỉnh sửa sau bảo vệ.</div>
              )}
            </section>

            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, fontSize: 19, display: "flex", gap: 8, alignItems: "center" }}>
                <CheckCircle2 size={18} color="#2563EB" /> Lịch sử nộp bản chỉnh sửa
              </h2>
              <div style={{ display: "grid", gap: 6 }}>
                {submissionHistory.map((item: SubmissionHistory) => (
                  <div key={`${item.version}-${item.uploadedAt}`} style={{ border: "1px solid #DBEAFE", borderRadius: 10, padding: 10, fontSize: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>{item.version} · {item.uploadedAt}</span>
                      <span style={{ color: item.status === "Approved" ? "#166534" : item.status === "Rejected" ? "#B91C1C" : "#1D4ED8" }}>
                        {item.status}
                      </span>
                    </div>
                    {item.note && <div style={{ color: "#B91C1C", marginTop: 4 }}>Ghi chú: {item.note}</div>}
                  </div>
                ))}
                {submissionHistory.length === 0 && <div style={{ color: "#64748B", fontSize: 13 }}>Chưa có lịch sử nộp bản chỉnh sửa.</div>}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDefenseInfo;
