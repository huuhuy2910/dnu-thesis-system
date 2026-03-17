import React, { useEffect, useMemo, useState } from "react";
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
  Sparkles,
  Star,
  Users2,
  XCircle,
} from "lucide-react";

type Committee = {
  id: string;
  room: string;
  session: "Sáng" | "Chiều";
  date: string;
  slot: string;
  studentCount: number;
  status: "Sắp diễn ra" | "Đang họp" | "Đã khóa";
};

type RevisionRequest = {
  studentCode: string;
  topicTitle: string;
  status: "pending" | "approved" | "rejected";
  reason?: string;
};

type PanelKey = "councils" | "minutes" | "grading" | "revision";

const COMMITTEES: Committee[] = [
  {
    id: "HD-2026-01",
    room: "A101",
    session: "Sáng",
    date: "2026-04-22",
    slot: "08:00 - 09:30",
    studentCount: 4,
    status: "Đang họp",
  },
  {
    id: "HD-2026-03",
    room: "B201",
    session: "Sáng",
    date: "2026-04-22",
    slot: "09:45 - 11:15",
    studentCount: 4,
    status: "Sắp diễn ra",
  },
  {
    id: "HD-2026-06",
    room: "A102",
    session: "Chiều",
    date: "2026-04-22",
    slot: "13:30 - 15:00",
    studentCount: 4,
    status: "Đã khóa",
  },
];

const REVISION_QUEUE: RevisionRequest[] = [
  {
    studentCode: "SV220101",
    topicTitle: "Ứng dụng AI trong phân loại văn bản tiếng Việt",
    status: "pending",
  },
  {
    studentCode: "SV220085",
    topicTitle: "Hệ thống giám sát môi trường bằng IoT",
    status: "approved",
  },
  {
    studentCode: "SV220077",
    topicTitle: "Mô hình phát hiện bất thường trong log hệ thống",
    status: "rejected",
    reason: "Cần bổ sung phần đánh giá benchmark chi tiết.",
  },
];

const panels: Array<{ key: PanelKey; label: string; icon: React.ReactNode }> = [
  { key: "councils", label: "Hội đồng của tôi", icon: <Users2 size={15} /> },
  { key: "minutes", label: "Biên bản", icon: <NotebookPen size={15} /> },
  { key: "grading", label: "Chấm điểm", icon: <PencilRuler size={15} /> },
  { key: "revision", label: "Duyệt chỉnh sửa", icon: <BookOpenCheck size={15} /> },
];

const cardStyle: React.CSSProperties = {
  background: "linear-gradient(155deg, rgba(255,255,255,0.97) 0%, rgba(238,247,255,0.96) 100%)",
  border: "1px solid rgba(6, 182, 212, 0.28)",
  borderRadius: 18,
  padding: 20,
  boxShadow: "0 16px 30px rgba(15, 23, 42, 0.12)",
};

const LecturerCommittees: React.FC = () => {
  const [activePanel, setActivePanel] = useState<PanelKey>("councils");
  const [selectedCommitteeId, setSelectedCommitteeId] = useState<string>(COMMITTEES[0].id);

  const [summary, setSummary] = useState("Sinh viên trình bày rõ phạm vi và mục tiêu đề tài.");
  const [review, setReview] = useState("Cần bổ sung đánh giá hiệu năng theo từng nhóm dữ liệu.");
  const [questions, setQuestions] = useState("1) Baseline đang dùng là gì? 2) Kết quả theo từng lớp dữ liệu?");
  const [answers, setAnswers] = useState("Sinh viên trả lời đúng trọng tâm và có minh chứng số liệu.");
  const [lastAutoSave, setLastAutoSave] = useState<string | null>(null);

  const [myScore, setMyScore] = useState("8.5");
  const [myComment, setMyComment] = useState("Đề tài đạt yêu cầu, có tiềm năng ứng dụng thực tế.");
  const [submitted, setSubmitted] = useState(false);
  const [chairRequestedReopen, setChairRequestedReopen] = useState(false);
  const [sessionLocked, setSessionLocked] = useState(false);

  const [gvhdScore, setGvhdScore] = useState("8.0");
  const [ctScore, setCtScore] = useState("8.5");
  const [tkScore, setTkScore] = useState("8.0");
  const [pbScore, setPbScore] = useState("9.0");

  const [revision, setRevision] = useState<RevisionRequest>(REVISION_QUEUE[0]);

  const committeeStats = useMemo(() => {
    const live = COMMITTEES.filter((item) => item.status === "Đang họp").length;
    const upcoming = COMMITTEES.filter((item) => item.status === "Sắp diễn ra").length;
    const locked = COMMITTEES.filter((item) => item.status === "Đã khóa").length;
    const pendingRevision = REVISION_QUEUE.filter((item) => item.status === "pending").length;
    return { live, upcoming, locked, pendingRevision };
  }, []);

  const selectedCommittee = useMemo(
    () => COMMITTEES.find((item) => item.id === selectedCommitteeId) ?? null,
    [selectedCommitteeId]
  );

  const isScoreValid = useMemo(() => {
    const num = Number(myScore);
    return Number.isFinite(num) && num >= 0 && num <= 10;
  }, [myScore]);

  const finalScore = useMemo(() => {
    const scores = [gvhdScore, ctScore, tkScore, pbScore].map(Number);
    if (!scores.every((item) => Number.isFinite(item))) return null;
    return Math.round(((scores[0] + scores[1] + scores[2] + scores[3]) / 4) * 10) / 10;
  }, [gvhdScore, ctScore, tkScore, pbScore]);

  const finalLetter = useMemo(() => {
    if (finalScore == null) return "-";
    if (finalScore >= 8.5) return "A";
    if (finalScore >= 7.0) return "B";
    if (finalScore >= 5.5) return "C";
    if (finalScore >= 4.0) return "D";
    return "F";
  }, [finalScore]);

  const variance = 1.7;
  const varianceThreshold = 1.5;
  const hasVarianceAlert = variance > varianceThreshold;

  useEffect(() => {
    const timer = window.setInterval(() => {
      window.localStorage.setItem(
        "lecturer_minutes_draft",
        JSON.stringify({ selectedCommitteeId, summary, review, questions, answers })
      );
      setLastAutoSave(new Date().toLocaleTimeString("vi-VN"));
    }, 30000);

    return () => window.clearInterval(timer);
  }, [selectedCommitteeId, summary, review, questions, answers]);

  const handleSubmitScore = () => {
    if (!isScoreValid || sessionLocked) return;
    setSubmitted(true);
    setChairRequestedReopen(false);
  };

  return (
    <div
      style={{
        maxWidth: 1420,
        margin: "0 auto",
        padding: 24,
        position: "relative",
        fontFamily: "Inter, Poppins, Roboto, sans-serif",
      }}
      className="lecturer-revamp-root"
    >
      <style>
        {`
          .lecturer-revamp-root {
            --lec-bg-1: #f6fbff;
            --lec-bg-2: #ecfeff;
            --lec-accent: #0891b2;
            --lec-ink: #0f172a;
            --lec-muted: #475569;
            --lec-line: #bae6fd;
            font-family: Inter, Poppins, Roboto, sans-serif;
            letter-spacing: .01em;
            color: var(--lec-ink);
          }
          .lecturer-revamp-root h1,
          .lecturer-revamp-root h2,
          .lecturer-revamp-root h3 {
            letter-spacing: .01em;
            line-height: 1.25;
          }
          @keyframes lecFloatA { 0%{transform:translateY(0)} 50%{transform:translateY(-10px)} 100%{transform:translateY(0)} }
          @keyframes lecFloatB { 0%{transform:translateY(0)} 50%{transform:translateY(10px)} 100%{transform:translateY(0)} }
          @keyframes lecFade { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
          @keyframes lecGradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes lecGlowPulse {
            0% { box-shadow: 0 0 0 0 rgba(2,132,199,.32); }
            100% { box-shadow: 0 0 0 14px rgba(2,132,199,0); }
          }
          .lecturer-revamp-root .bg-layer {
            position:absolute;
            inset:0;
            pointer-events:none;
            overflow:hidden;
            border-radius:22px;
            background:
              radial-gradient(circle at 10% 6%, rgba(6,182,212,.10) 0%, transparent 34%),
              radial-gradient(circle at 85% 94%, rgba(37,99,235,.08) 0%, transparent 36%),
              linear-gradient(180deg, var(--lec-bg-1) 0%, var(--lec-bg-2) 100%);
          }
          .lecturer-revamp-root .bg-layer::before,
          .lecturer-revamp-root .bg-layer::after { content:""; position:absolute; border-radius:999px; filter:blur(26px); opacity:.36; }
          .lecturer-revamp-root .bg-layer::before { width:280px; height:280px; right:-70px; top:-40px; background:radial-gradient(circle,#67e8f9 0%,#0e7490 72%,transparent 100%); animation:lecFloatA 10s ease-in-out infinite; }
          .lecturer-revamp-root .bg-layer::after { width:240px; height:240px; left:-60px; bottom:70px; background:radial-gradient(circle,#93c5fd 0%,#2563eb 72%,transparent 100%); animation:lecFloatB 12s ease-in-out infinite; }
          .lecturer-revamp-root .content { position:relative; z-index:1; animation:lecFade .4s ease; }
          .lecturer-revamp-root section { transition:all .22s ease; }
          .lecturer-revamp-root section:hover { transform:translateY(-2px); box-shadow:0 20px 34px rgba(15,23,42,.16); border-color:#67e8f9; }
          .lecturer-revamp-root button, .lecturer-revamp-root input, .lecturer-revamp-root textarea, .lecturer-revamp-root select { transition:all .2s ease; }
          .lecturer-revamp-root button {
            font-family: Inter, Poppins, Roboto, sans-serif;
            font-weight: 600;
            font-size: 14px;
            letter-spacing: 0;
            border-radius: 10px;
            color: #1e40af;
          }
          .lecturer-revamp-root button:hover:not(:disabled) { transform:translateY(-1px); }
          .lecturer-revamp-root input, .lecturer-revamp-root textarea, .lecturer-revamp-root select { border:1px solid var(--lec-line); border-radius:10px; padding:8px 10px; background:#fff; }
          .lecturer-revamp-root input:focus, .lecturer-revamp-root textarea:focus, .lecturer-revamp-root select:focus { outline:none; border-color:var(--lec-accent); box-shadow:0 0 0 3px rgba(8,145,178,.15); }
          .lec-pill {
            border: 1px solid #2563eb;
            border-radius: 999px;
            padding: 8px 14px;
            background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
            font-weight: 700;
            color: #1e40af;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            line-height: 1.2;
            box-shadow: 0 4px 10px rgba(37, 99, 235, 0.12);
          }
          .lec-pill.active {
            border-color: #fb923c;
            background: linear-gradient(135deg, #fff7ed 0%, #ffffff 100%);
            color: #1e40af;
            box-shadow: 0 4px 10px rgba(251, 146, 60, 0.14);
          }
          .lec-pill .pill-icon {
            width:22px;
            height:22px;
            border-radius:999px;
            display:inline-flex;
            align-items:center;
            justify-content:center;
            background: #eff6ff;
            border: 1px solid #bfdbfe;
          }
          .lec-pill.active .pill-icon {
            background: #ffffff;
            border-color: #93c5fd;
          }
          .lec-primary {
              border: 1px solid #1e40af;
              border-radius: 12px;
              background: linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%);
              color: #fff;
              padding: 8px 14px;
              font-weight: 700;
              cursor: pointer;
              box-shadow: 0 6px 14px rgba(30, 64, 175, 0.22);
              font-size: 13px;
              line-height: 1;
              min-height: 40px;
          }
          .lec-primary:hover:not(:disabled) { background: linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%); border-color:#1d4ed8; }
            .lec-primary:disabled {
              background: #94a3b8;
              border-color: #94a3b8;
              color: #fff;
              box-shadow: none;
              cursor: not-allowed;
            }
            .lec-accent {
              border: 1px solid #ea580c;
              border-radius: 12px;
              background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
              color: #fff;
              padding: 8px 14px;
              font-weight: 700;
              min-height: 40px;
              box-shadow: 0 6px 14px rgba(234, 88, 12, 0.22);
              cursor: pointer;
            }
            .lec-accent:hover:not(:disabled) {
              border-color: #c2410c;
              background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
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
              border-radius: 10px;
              background: #fff;
              color: #1e40af;
              padding: 8px 12px;
              font-weight: 700;
              min-height: 40px;
              box-shadow: 0 4px 10px rgba(15, 23, 42, 0.06);
              cursor: pointer;
            }
            .lec-ghost:hover:not(:disabled) {
              border-color: #2563eb;
              background: #eff6ff;
            }
            .lec-ghost:disabled {
              border-color: #e5e7eb;
              background: #f1f5f9;
              color: #64748b;
              box-shadow: none;
              cursor: not-allowed;
            }
          .lec-soft {
            border: 1px solid #fb923c;
            border-radius: 12px;
            background: linear-gradient(135deg, #ffffff 0%, #fff7ed 100%);
            color: #1e40af;
            padding: 8px 14px;
            font-weight: 700;
            cursor: pointer;
            letter-spacing: 0;
            box-shadow: 0 4px 10px rgba(251, 146, 60, 0.12);
            font-size: 13px;
            line-height: 1;
            min-height: 40px;
          }
          .lec-soft:hover { background: linear-gradient(135deg, #eff6ff 0%, #fff7ed 100%); border-color:#2563eb; }
          .lec-primary svg,
          .lec-soft svg {
            width: 14px;
            height: 14px;
            flex: 0 0 14px;
          }
          .lecturer-revamp-root button {
            line-height: 1.15;
          }
          .lec-tag-live {
            display:inline-flex;
            align-items:center;
            gap:8px;
            border:1px solid #67e8f9;
            background:#ecfeff;
            color:#0f3d56;
            border-radius:999px;
            font-size:12px;
            font-weight:700;
            padding:6px 10px;
            animation: lecGlowPulse 2.2s infinite;
          }
        `}
      </style>

      <div className="bg-layer" />

      <div className="content">
        <section
          style={{
            borderRadius: 20,
            padding: 24,
            marginBottom: 16,
            border: "1px solid rgba(6,182,212,0.25)",
            background:
              "radial-gradient(circle at 85% 20%, rgba(8,145,178,0.14) 0%, rgba(8,145,178,0) 34%), linear-gradient(120deg, #FFFFFF 0%, #F0F9FF 58%, #ECFEFF 100%)",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 30, display: "flex", alignItems: "center", gap: 10 }}>
            <Gavel size={30} color="#0284C7" /> Ca bảo vệ và chấm điểm trực tuyến
          </h1>
          <p style={{ margin: "8px 0 0", color: "#334155", maxWidth: 860 }}>
            Không gian làm việc chuyên biệt cho Giảng viên: quản lý hội đồng, nhập biên bản theo từng hội đồng, chấm điểm độc lập và duyệt bản chỉnh sửa.
          </p>
          <div style={{ marginTop: 10 }}>
            <span className="lec-tag-live">
              <Sparkles size={13} /> Trải nghiệm thao tác theo hội đồng thời gian thực
            </span>
          </div>
        </section>

        <section style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
            <div style={{ border: "1px solid #BAE6FD", borderRadius: 14, padding: 12, background: "#FFFFFF" }}>
              <div style={{ fontSize: 12, color: "#475569" }}>Đang họp</div>
              <div style={{ fontWeight: 800, fontSize: 26, color: "#0e7490" }}>{committeeStats.live}</div>
            </div>
            <div style={{ border: "1px solid #BAE6FD", borderRadius: 14, padding: 12, background: "#FFFFFF" }}>
              <div style={{ fontSize: 12, color: "#475569" }}>Sắp diễn ra</div>
              <div style={{ fontWeight: 800, fontSize: 26, color: "#0369a1" }}>{committeeStats.upcoming}</div>
            </div>
            <div style={{ border: "1px solid #BAE6FD", borderRadius: 14, padding: 12, background: "#FFFFFF" }}>
              <div style={{ fontSize: 12, color: "#475569" }}>Đã khóa</div>
              <div style={{ fontWeight: 800, fontSize: 26, color: "#0f172a" }}>{committeeStats.locked}</div>
            </div>
            <div style={{ border: "1px solid #BAE6FD", borderRadius: 14, padding: 12, background: "#FFFFFF" }}>
              <div style={{ fontSize: 12, color: "#475569" }}>Chờ duyệt chỉnh sửa</div>
              <div style={{ fontWeight: 800, fontSize: 26, color: "#b45309" }}>{committeeStats.pendingRevision}</div>
            </div>
          </div>
        </section>

        <section style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "#475569", marginBottom: 8, fontWeight: 600 }}>
            Chọn khu vực thao tác theo nhiệm vụ hiện tại của giảng viên.
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
              <CalendarClock size={18} color="#0284C7" /> Danh sách hội đồng phụ trách
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
              {COMMITTEES.map((committee) => (
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
                  <div style={{ fontWeight: 800, color: "#0F172A" }}>{committee.id}</div>
                  <div style={{ marginTop: 4, fontSize: 13, color: "#334155" }}>
                    <MapPin size={13} style={{ verticalAlign: "text-bottom", marginRight: 4, color: "#0284C7" }} />
                    {committee.room} · {committee.session} · {new Date(committee.date).toLocaleDateString("vi-VN")}
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
            </div>
          </section>
        )}

        {activePanel === "minutes" && (
          <section style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
              <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <ClipboardPen size={18} color="#0284C7" /> UC 3.1 - Nhập biên bản theo hội đồng
              </h2>
              <select value={selectedCommitteeId} onChange={(event) => setSelectedCommitteeId(event.target.value)}>
                {COMMITTEES.map((committee) => (
                  <option key={committee.id} value={committee.id}>
                    {committee.id} · {committee.room} · {committee.session}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {COMMITTEES.map((committee) => (
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
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
              <div style={{ display: "grid", gap: 12 }}>
                {selectedCommittee ? (
                  <div style={{ padding: 14, border: "1px solid #DBEAFE", borderRadius: 14, background: "linear-gradient(160deg, #F8FAFF 0%, #FFFFFF 100%)" }}>
                    <div style={{ fontSize: 12, color: "#64748B", marginBottom: 4 }}>Hội đồng đang thao tác</div>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>{selectedCommittee.id}</div>
                    <div style={{ marginTop: 8, display: "grid", gap: 6, fontSize: 13, color: "#334155" }}>
                      <div><strong>Phòng:</strong> {selectedCommittee.room}</div>
                      <div><strong>Phiên:</strong> {selectedCommittee.session}</div>
                      <div><strong>Ngày:</strong> {new Date(selectedCommittee.date).toLocaleDateString("vi-VN")}</div>
                      <div><strong>Khung giờ:</strong> {selectedCommittee.slot}</div>
                      <div><strong>Số sinh viên:</strong> {selectedCommittee.studentCount}</div>
                    </div>
                  </div>
                ) : null}

                <div style={{ padding: 14, border: "1px solid #E2E8F0", borderRadius: 14, background: "#FFFFFF" }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Mẫu nhập nhanh</div>
                  <div style={{ display: "grid", gap: 8, fontSize: 13, color: "#475569" }}>
                    <div>• Tóm tắt mục tiêu, phương pháp và kết quả chính.</div>
                    <div>• Ghi rõ câu hỏi phản biện và phần trả lời nổi bật.</div>
                    <div>• Biên bản sẽ tự động lưu theo hội đồng đang chọn.</div>
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
              </div>
            </div>

            <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ fontSize: 13, color: "#64748B" }}>Tự động lưu mỗi 30 giây {lastAutoSave ? `· ${lastAutoSave}` : ""}</div>
              <button type="button" className="lec-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Save size={15} /> Lưu bản nháp biên bản
              </button>
            </div>
          </section>
        )}

        {activePanel === "grading" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <Star size={18} color="#0284C7" /> UC 3.2 - Chấm điểm độc lập
              </h2>
              <label style={{ display: "grid", gap: 5 }}>
                Điểm của tôi (0.0 - 10.0)
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

              <label style={{ display: "grid", gap: 5, marginTop: 8 }}>
                Nhận xét
                <textarea
                  rows={4}
                  value={myComment}
                  onChange={(event) => setMyComment(event.target.value)}
                  disabled={submitted || sessionLocked}
                />
              </label>

              <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="lec-primary"
                  onClick={handleSubmitScore}
                  disabled={!isScoreValid || submitted || sessionLocked}
                >
                  Gửi điểm
                </button>
                <button
                  type="button"
                  className="lec-soft"
                  onClick={() => {
                    setChairRequestedReopen(true);
                    setSubmitted(false);
                  }}
                >
                  <MessageSquareText size={14} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />
                  Yêu cầu mở lại biểu mẫu
                </button>
              </div>

              {submitted && <div style={{ marginTop: 8, color: "#166534" }}>Đã gửi điểm và khóa biểu mẫu cá nhân.</div>}
              {chairRequestedReopen && <div style={{ marginTop: 8, color: "#B45309" }}>Biểu mẫu đã mở lại theo yêu cầu Chủ tịch.</div>}
            </section>

            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldCheck size={18} color="#0284C7" /> UC 3.3 - UC 3.5: Cảnh báo và chốt ca
              </h2>

              <div style={{ border: "1px solid #DBEAFE", borderRadius: 12, padding: 10, marginBottom: 10 }}>
                <div style={{ fontWeight: 700 }}>Cảnh báo điểm lệch</div>
                <div style={{ marginTop: 6, fontSize: 14 }}>
                  Phương sai: <strong>{variance.toFixed(1)}</strong> · Ngưỡng: {varianceThreshold}
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
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Tính điểm tổng hợp</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 6 }}>
                  <input type="number" value={gvhdScore} onChange={(event) => setGvhdScore(event.target.value)} placeholder="GVHD" />
                  <input type="number" value={ctScore} onChange={(event) => setCtScore(event.target.value)} placeholder="CT" />
                  <input type="number" value={tkScore} onChange={(event) => setTkScore(event.target.value)} placeholder="TK" />
                  <input type="number" value={pbScore} onChange={(event) => setPbScore(event.target.value)} placeholder="PB" />
                </div>
                <div style={{ marginTop: 8, fontSize: 13 }}>
                  Điểm tổng: <strong>{finalScore ?? "-"}</strong> · Điểm chữ: <strong>{finalLetter}</strong>
                </div>
              </div>

              <button
                type="button"
                className="lec-primary"
                style={{ background: sessionLocked ? "#94A3B8" : "linear-gradient(135deg,#334155 0%, #1E293B 100%)", display: "inline-flex", alignItems: "center", gap: 8 }}
                onClick={() => setSessionLocked(true)}
                disabled={sessionLocked}
              >
                <Lock size={15} /> {sessionLocked ? "Đã khóa ca bảo vệ" : "Khóa hội đồng"}
              </button>
            </section>
          </div>
        )}

        {activePanel === "revision" && (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <FileCheck2 size={18} color="#0284C7" /> UC 4.1 - Duyệt bản chỉnh sửa
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
                  style={{ borderColor: "#16A34A", color: "#166534", background: "#F0FDF4", display: "inline-flex", alignItems: "center", gap: 6 }}
                  onClick={() => setRevision({ ...revision, status: "approved", reason: undefined })}
                >
                  <CheckCircle2 size={14} /> Duyệt
                </button>
                <button
                  type="button"
                  className="lec-soft"
                  style={{ borderColor: "#DC2626", color: "#B91C1C", background: "#FEF2F2", display: "inline-flex", alignItems: "center", gap: 6 }}
                  onClick={() =>
                    setRevision({
                      ...revision,
                      status: "rejected",
                      reason: "Cần bổ sung phụ lục kết quả so sánh với mô hình baseline.",
                    })
                  }
                >
                  <XCircle size={14} /> Từ chối
                </button>
              </div>

              <div style={{ marginTop: 8, color: revision.status === "approved" ? "#166534" : revision.status === "rejected" ? "#B91C1C" : "#475569" }}>
                Trạng thái hiện tại: {revision.status}
              </div>
              {revision.reason && <div style={{ marginTop: 4, color: "#B91C1C", fontSize: 13 }}>Lý do: {revision.reason}</div>}
            </div>

            <div style={{ marginTop: 12, border: "1px solid #DBEAFE", borderRadius: 12, padding: 10 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Hàng chờ duyệt</div>
              {REVISION_QUEUE.map((item) => (
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
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default LecturerCommittees;
