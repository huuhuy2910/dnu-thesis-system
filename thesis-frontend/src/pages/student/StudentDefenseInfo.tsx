import React, { useMemo, useRef, useState } from "react";
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

const MOCK_DEFENSE = {
  studentCode: "SV220101",
  studentName: "Nguyễn Minh An",
  topic: "Ứng dụng AI trong phân loại văn bản tiếng Việt",
  defenseDate: "2026-04-22",
  startTime: "08:00",
  endTime: "09:30",
  room: "A101",
  committeeCode: "HD-2026-01",
  status: "Published",
  score: 8.4,
  letter: "B+",
  requiresRevision: true,
};

const MOCK_MEMBERS: Member[] = [
  { role: "CT", name: "PGS.TS Nguyễn Thanh Bình" },
  { role: "TK", name: "ThS. Lê Minh Đức" },
  { role: "PB", name: "TS. Trần Thu Hà" },
  { role: "GVHD", name: "TS. Phạm Trung Kiên" },
];

const MOCK_COMMENTS = [
  "Bố cục báo cáo rõ ràng, nội dung có tính ứng dụng.",
  "Cần bổ sung so sánh với mô hình baseline ở phần thực nghiệm.",
  "Kết quả kiểm thử đủ tin cậy, đạt yêu cầu bảo vệ.",
];

const MOCK_NOTIFICATIONS: StudentNotification[] = [
  {
    time: "07/03/2026 08:30",
    title: "Hội đồng đã chốt lịch bảo vệ của bạn",
    type: "success",
  },
  {
    time: "07/03/2026 10:10",
    title: "Điểm đã được công bố đồng loạt",
    type: "info",
  },
  {
    time: "07/03/2026 15:45",
    title: "Bản chỉnh sửa cần bổ sung phụ lục thực nghiệm",
    type: "warning",
  },
];

const MOCK_SUBMISSION_HISTORY: SubmissionHistory[] = [
  {
    version: "v1.0",
    uploadedAt: "07/03/2026 16:00",
    status: "Rejected",
    note: "Thiếu phụ lục số liệu benchmark",
  },
  {
    version: "v1.1",
    uploadedAt: "08/03/2026 09:20",
    status: "Pending",
  },
  {
    version: "v1.2",
    uploadedAt: "09/03/2026 11:45",
    status: "Approved",
  },
];

const cardStyle: React.CSSProperties = {
  background: "linear-gradient(155deg, rgba(255,255,255,0.99) 0%, rgba(255,247,237,0.95) 100%)",
  border: "1px solid rgba(251,146,60,0.24)",
  borderRadius: 18,
  padding: 20,
  boxShadow: "0 16px 30px rgba(154, 52, 18, 0.12)",
};

const StudentDefenseInfo: React.FC = () => {
  const [activePanel, setActivePanel] = useState<StudentPanel>("schedule");
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [revisionStatus, setRevisionStatus] = useState<"draft" | "submitted" | "approved" | "rejected">("draft");
  const [rejectionReason] = useState("Cần bổ sung phụ lục kết quả thực nghiệm chi tiết trước khi xác nhận lại.");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const averageScore = useMemo(() => MOCK_DEFENSE.score.toFixed(1), []);

  const completionRate = useMemo(() => {
    if (revisionStatus === "approved") return 100;
    if (revisionStatus === "submitted") return 80;
    if (revisionStatus === "rejected") return 55;
    return 30;
  }, [revisionStatus]);

  const submitRevision = () => {
    if (!selectedFileName) return;
    setRevisionStatus("submitted");
  };

  return (
    <div
      style={{
        maxWidth: 1320,
        margin: "0 auto",
        padding: 24,
        position: "relative",
        fontFamily: "Inter, Poppins, Roboto, sans-serif",
      }}
      className="student-revamp-root"
    >
      <style>
        {`
          .student-revamp-root {
            --stu-ink: #1f2937;
            --stu-muted: #6b7280;
            --stu-line: #fed7aa;
            --stu-main: #ea580c;
            --stu-main-2: #f97316;
            font-family: Inter, Poppins, Roboto, sans-serif;
            letter-spacing: .01em;
            color: var(--stu-ink);
          }
          .student-revamp-root h1,
          .student-revamp-root h2,
          .student-revamp-root h3 {
            letter-spacing: .01em;
            line-height: 1.25;
          }
          @keyframes stuFloatA { 0%{transform:translateY(0)} 50%{transform:translateY(-10px)} 100%{transform:translateY(0)} }
          @keyframes stuFloatB { 0%{transform:translateY(0)} 50%{transform:translateY(9px)} 100%{transform:translateY(0)} }
          @keyframes stuFade { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
          @keyframes stuGradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
          .student-revamp-root .bg-layer {
            position:absolute;
            inset:0;
            pointer-events:none;
            overflow:hidden;
            border-radius:22px;
            background:
              radial-gradient(circle at 8% 5%, rgba(251,146,60,.12) 0%, transparent 34%),
              radial-gradient(circle at 92% 88%, rgba(251,191,36,.12) 0%, transparent 30%),
              linear-gradient(180deg, #fffaf5 0%, #fffbeb 100%);
          }
          .student-revamp-root .bg-layer::before,
          .student-revamp-root .bg-layer::after { content:""; position:absolute; border-radius:999px; filter:blur(24px); opacity:.34; }
          .student-revamp-root .bg-layer::before { width:280px; height:280px; top:-60px; right:-70px; background:radial-gradient(circle,#fdba74 0%,#f97316 70%,transparent 100%); animation:stuFloatA 10s ease-in-out infinite; }
          .student-revamp-root .bg-layer::after { width:240px; height:240px; left:-70px; bottom:40px; background:radial-gradient(circle,#fde68a 0%,#f59e0b 70%,transparent 100%); animation:stuFloatB 12s ease-in-out infinite; }
          .student-revamp-root .content { position:relative; z-index:1; animation:stuFade .42s ease; }
          .student-revamp-root section { transition:all .22s ease; }
          .student-revamp-root section:hover { transform:translateY(-2px); box-shadow:0 16px 28px rgba(194,65,12,.16); border-color:#fdba74; }
          .student-revamp-root button, .student-revamp-root input, .student-revamp-root textarea, .student-revamp-root select { transition:all .2s ease; }
          .student-revamp-root button {
            font-family: Inter, Poppins, Roboto, sans-serif;
            font-weight: 600;
            font-size: 14px;
            letter-spacing: 0;
            border-radius: 10px;
            color: #1e40af;
          }
          .student-revamp-root button:hover:not(:disabled) { transform:translateY(-1px); }
          .student-revamp-root input, .student-revamp-root textarea, .student-revamp-root select { border:1px solid var(--stu-line); border-radius:10px; padding:8px 10px; background:#fff; }
          .student-revamp-root input:focus, .student-revamp-root textarea:focus, .student-revamp-root select:focus { outline:none; border-color:var(--stu-main); box-shadow:0 0 0 3px rgba(249,115,22,.16); }
          .stu-pill {
            border: 1px solid #2563eb;
            border-radius:999px;
            padding:8px 14px;
            font-weight:700;
            background:linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
            color:#1e40af;
            cursor:pointer;
            letter-spacing:0;
            display:inline-flex;
            align-items:center;
            justify-content:center;
            gap:8px;
            line-height:1.15;
            box-shadow: 0 4px 10px rgba(37, 99, 235, 0.12);
          }
          .stu-pill.active { border-color:#fb923c; background:linear-gradient(135deg, #fff7ed 0%, #ffffff 100%); color:#1e40af; box-shadow:0 4px 10px rgba(251, 146, 60, 0.14); }
          .stu-primary {
            border:1px solid #2563eb;
            border-radius:12px;
            background:linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            color:#fff;
            padding:8px 14px;
            font-weight:700;
            cursor:pointer;
            letter-spacing:0;
            box-shadow: 0 6px 14px rgba(37, 99, 235, 0.18);
            font-size:13px;
            line-height:1;
            min-height:40px;
          }
          .stu-primary:hover:not(:disabled) { background:linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%); border-color:#1d4ed8; }
          .stu-primary:disabled { background:#94A3B8; border-color:#94A3B8; cursor:not-allowed; }
          .stu-soft {
            border:1px solid #fb923c;
            border-radius:12px;
            background:linear-gradient(135deg, #ffffff 0%, #fff7ed 100%);
            color:#1e40af;
            padding:8px 14px;
            font-weight:700;
            cursor:pointer;
            letter-spacing:0;
            box-shadow: 0 4px 10px rgba(251, 146, 60, 0.12);
            font-size:13px;
            line-height:1;
            min-height:40px;
          }
          .stu-upload {
            border:1px dashed #fb923c;
            border-radius:14px;
            padding:14px;
            background:linear-gradient(145deg,#fff 0%,#fff7ed 60%,#ffedd5 100%);
            cursor:pointer;
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:8px;
            font-weight: 700;
            box-shadow: 0 8px 18px rgba(234,88,12,.12);
          }
          .stu-soft:hover { background:linear-gradient(135deg, #eff6ff 0%, #fff7ed 100%); border-color:#2563eb; }
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

      <div className="bg-layer" />

      <div className="content">
        <section
          style={{
            borderRadius: 20,
            padding: 24,
            marginBottom: 16,
            border: "1px solid rgba(251,146,60,0.24)",
            background:
              "radial-gradient(circle at 86% 18%, rgba(251,146,60,0.14) 0%, rgba(251,146,60,0) 36%), linear-gradient(120deg, #FFFFFF 0%, #FFF7ED 58%, #FFFBEB 100%)",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 31, display: "flex", alignItems: "center", gap: 10 }}>
            <GraduationCap size={30} color="#EA580C" /> Bảo vệ và kết quả của tôi
          </h1>
          <p style={{ margin: "8px 0 0", color: "#334155", maxWidth: 780 }}>
            Theo dõi lịch bảo vệ, thông tin hội đồng, kết quả chấm điểm và luồng nộp bản chỉnh sửa trong một giao diện thống nhất.
          </p>
        </section>

        <section style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div>
              <div style={{ color: "#64748B", fontSize: 12 }}>MSSV</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{MOCK_DEFENSE.studentCode}</div>
            </div>
            <div>
              <div style={{ color: "#64748B", fontSize: 12 }}>Điểm tổng kết</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{averageScore} ({MOCK_DEFENSE.letter})</div>
            </div>
            <div>
              <div style={{ color: "#64748B", fontSize: 12 }}>Trạng thái công bố</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#166534", display: "inline-flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={18} /> {MOCK_DEFENSE.status}
              </div>
            </div>
            <div>
              <div style={{ color: "#64748B", fontSize: 12 }}>Tiến độ hoàn tất hồ sơ</div>
              <div style={{ marginTop: 8, height: 10, borderRadius: 999, background: "#FED7AA", overflow: "hidden" }}>
                <div style={{ width: `${completionRate}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#EA580C 0%,#FB923C 100%)" }} />
              </div>
              <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700, color: "#9A3412" }}>{completionRate}%</div>
            </div>
          </div>
        </section>

        <section style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8, fontWeight: 600 }}>
            Chọn mục để xem lịch, kết quả hoặc thực hiện nộp chỉnh sửa theo đúng tiến độ.
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                <Calendar size={18} color="#2563EB" /> Lịch bảo vệ chính thức
              </h2>
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ padding: 10, borderRadius: 12, border: "1px solid #DBEAFE", background: "#F8FAFF" }}>
                  <div style={{ fontSize: 12, color: "#64748B" }}>Sinh viên</div>
                  <div style={{ fontWeight: 700 }}>{MOCK_DEFENSE.studentName}</div>
                </div>
                <div style={{ padding: 10, borderRadius: 12, border: "1px solid #E2E8F0", background: "#FFFFFF" }}>
                  <div style={{ fontSize: 12, color: "#64748B" }}>Đề tài</div>
                  <div style={{ fontWeight: 700 }}>{MOCK_DEFENSE.topic}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
                  <div style={{ padding: 10, borderRadius: 12, border: "1px solid #DBEAFE", background: "#F8FAFF" }}>
                    <div style={{ fontSize: 12, color: "#64748B" }}>Ngày</div>
                    <div style={{ fontWeight: 700 }}>{new Date(MOCK_DEFENSE.defenseDate).toLocaleDateString("vi-VN")}</div>
                  </div>
                  <div style={{ padding: 10, borderRadius: 12, border: "1px solid #FED7AA", background: "#FFF7ED" }}>
                    <div style={{ fontSize: 12, color: "#9A3412" }}>Thời gian</div>
                    <div style={{ fontWeight: 700 }}>{MOCK_DEFENSE.startTime} - {MOCK_DEFENSE.endTime}</div>
                  </div>
                  <div style={{ padding: 10, borderRadius: 12, border: "1px solid #E2E8F0", background: "#FFFFFF" }}>
                    <div style={{ fontSize: 12, color: "#64748B" }}>Phòng</div>
                    <div style={{ fontWeight: 700 }}>{MOCK_DEFENSE.room}</div>
                  </div>
                </div>
                <div style={{ padding: 10, borderRadius: 12, border: "1px solid #FED7AA", background: "#FFF7ED" }}>
                  <div style={{ fontSize: 12, color: "#9A3412" }}>Mã hội đồng</div>
                  <div style={{ fontWeight: 700 }}>{MOCK_DEFENSE.committeeCode}</div>
                </div>
              </div>
            </section>

            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, fontSize: 19, display: "flex", gap: 8, alignItems: "center" }}>
                <Users size={18} color="#2563EB" /> Thành viên hội đồng
              </h2>
              <div style={{ display: "grid", gap: 8 }}>
                {MOCK_MEMBERS.map((member) => (
                  <div key={`${member.role}-${member.name}`} style={{ border: "1px solid #DBEAFE", borderRadius: 12, padding: 10, background: "#FFFFFF" }}>
                    <div style={{ color: "#64748B", fontSize: 12 }}>{member.role}</div>
                    <div style={{ fontWeight: 700 }}>{member.name}</div>
                  </div>
                ))}
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
              <div style={{ marginBottom: 8 }}>
                <strong>Công thức:</strong> Điểm tổng kết = (GVHD + CT + TK + PB) / 4
              </div>
              <div style={{ marginBottom: 10, color: "#334155" }}>
                Điểm đã làm tròn: <strong>{averageScore}</strong> · Điểm chữ: <strong>{MOCK_DEFENSE.letter}</strong>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {MOCK_COMMENTS.map((item, idx) => (
                  <div key={idx} style={{ border: "1px solid #DBEAFE", borderRadius: 10, padding: 10, color: "#334155" }}>
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, fontSize: 19, display: "flex", gap: 8, alignItems: "center" }}>
                <Clock3 size={18} color="#2563EB" /> Thông báo nghiệp vụ
              </h2>
              <div style={{ display: "grid", gap: 8 }}>
                {MOCK_NOTIFICATIONS.map((item: StudentNotification) => (
                  <div key={`${item.time}-${item.title}`} style={{ border: "1px solid #DBEAFE", borderRadius: 10, padding: 10 }}>
                    <div style={{ fontSize: 12, color: "#64748B" }}>{item.time}</div>
                    <div style={{ fontWeight: 700 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: item.type === "success" ? "#166534" : item.type === "warning" ? "#B45309" : "#1D4ED8" }}>
                      {item.type.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activePanel === "revision" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, fontSize: 19, display: "flex", gap: 8, alignItems: "center" }}>
                <Upload size={18} color="#2563EB" /> UC 4.1 - Nộp bản chỉnh sửa
              </h2>
              {MOCK_DEFENSE.requiresRevision ? (
                <>
                  <div style={{ color: "#475569", fontSize: 13, marginBottom: 10 }}>
                    Upload file PDF để GVHD, CT, TK xác nhận đồng thuận.
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={(event) => setSelectedFileName(event.target.files?.[0]?.name ?? "")}
                    style={{ display: "none" }}
                  />

                  <button type="button" className="stu-upload" onClick={() => fileInputRef.current?.click()}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#1E3A8A", fontWeight: 700 }}>
                      <Upload size={15} /> Chọn file PDF
                    </span>
                    <span style={{ color: "#334155", fontSize: 13 }}>
                      {selectedFileName || "Chưa có file nào được chọn"}
                    </span>
                  </button>

                  <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                    <button type="button" className="stu-primary" onClick={submitRevision} disabled={!selectedFileName || revisionStatus === "approved"}>
                      Nộp bản chỉnh sửa
                    </button>
                    <button
                      type="button"
                      className="stu-soft"
                      style={{ borderColor: "#16A34A", color: "#166534", background: "#F0FDF4" }}
                      onClick={() => setRevisionStatus("approved")}
                    >
                      Mô phỏng duyệt
                    </button>
                    <button
                      type="button"
                      className="stu-soft"
                      style={{ borderColor: "#DC2626", color: "#B91C1C", background: "#FEF2F2" }}
                      onClick={() => setRevisionStatus("rejected")}
                    >
                      Mô phỏng từ chối
                    </button>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    {revisionStatus === "draft" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#475569" }}>
                        <Clock3 size={16} /> Trạng thái: Chưa nộp bản chỉnh sửa.
                      </div>
                    )}
                    {revisionStatus === "submitted" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#1D4ED8" }}>
                        <Clock3 size={16} /> Trạng thái: Đã nộp, đang chờ duyệt.
                      </div>
                    )}
                    {revisionStatus === "approved" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#166534" }}>
                        <CheckCircle2 size={16} /> Trạng thái: Hoàn thành 100%.
                      </div>
                    )}
                    {revisionStatus === "rejected" && (
                      <div style={{ display: "grid", gap: 6, color: "#B91C1C" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <XCircle size={16} /> Trạng thái: Bị từ chối, vui lòng nộp lại.
                        </div>
                        <div style={{ fontSize: 13, border: "1px solid #FECACA", background: "#FEF2F2", borderRadius: 8, padding: 8 }}>
                          Lý do: {rejectionReason}
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
                {MOCK_SUBMISSION_HISTORY.map((item: SubmissionHistory) => (
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
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDefenseInfo;
