import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
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

type EligibleStudent = {
  studentCode: string;
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

type CouncilRole = "CT" | "TK" | "PB" | "UV";

type CouncilMember = {
  role: CouncilRole;
  lecturerCode: string;
  lecturerName: string;
};

type CouncilDraft = {
  id: string;
  room: string;
  session: "Sang" | "Chieu";
  slotId: string;
  councilTags: string[];
  morningStudents: string[];
  afternoonStudents: string[];
  forbiddenLecturers: string[];
  members: CouncilMember[];
  warning?: string;
};

type CommitteeStatus = "Draft" | "Ready" | "Warning" | "Published";

type StageKey = "prepare" | "grouping" | "assignment" | "operation" | "publish";

const MOCK_STUDENTS: EligibleStudent[] = [
  {
    studentCode: "SV220101",
    studentName: "Nguyễn Minh An",
    topicTitle: "Ứng dụng AI trong phân loại văn bản tiếng Việt",
    supervisorCode: "GV018",
    tags: ["AI", "NLP"],
    isEligible: true,
    valid: true,
  },
  {
    studentCode: "SV220102",
    studentName: "Trần Thu Trang",
    topicTitle: "Hệ thống Web quản lý thực tập doanh nghiệp",
    supervisorCode: "GV022",
    tags: ["Web"],
    isEligible: true,
    valid: true,
  },
  {
    studentCode: "SV220103",
    studentName: "Lê Quốc Bảo",
    topicTitle: "Nhận diện đối tượng cho camera IoT",
    supervisorCode: "GV031",
    tags: ["IoT", "AI"],
    isEligible: true,
    valid: true,
  },
  {
    studentCode: "SV220104",
    studentName: "Phạm Thanh Huy",
    topicTitle: "Khai phá log hệ thống bằng học máy",
    supervisorCode: "",
    tags: ["Data"],
    isEligible: true,
    valid: false,
    error: "Thiếu ID GVHD",
  },
  {
    studentCode: "SV220105",
    studentName: "Đỗ Ngọc Mai",
    topicTitle: "Tối ưu kiến trúc microservices cho LMS",
    supervisorCode: "GV011",
    tags: [],
    isEligible: true,
    valid: false,
    error: "Thiếu tag chuyên ngành",
  },
  {
    studentCode: "SV220106",
    studentName: "Bùi Đức Nam",
    topicTitle: "Ứng dụng blockchain lưu trữ biên bản số",
    supervisorCode: "GV025",
    tags: ["Blockchain"],
    isEligible: true,
    valid: true,
  },
  {
    studentCode: "SV220107",
    studentName: "Vũ Hải Đăng",
    topicTitle: "Dashboard phân tích phổ điểm theo khóa",
    supervisorCode: "GV019",
    tags: ["Data", "Web"],
    isEligible: true,
    valid: true,
  },
  {
    studentCode: "SV220108",
    studentName: "Lý Hoàng Phúc",
    topicTitle: "Hệ thống kiểm soát truy cập thông minh",
    supervisorCode: "GV017",
    tags: ["Security", "IoT"],
    isEligible: true,
    valid: true,
  },
  {
    studentCode: "SV220109",
    studentName: "Ngô Đức Thành",
    topicTitle: "Tối ưu lịch bảo vệ bằng meta-heuristic",
    supervisorCode: "GV050",
    tags: ["Optimization", "AI"],
    isEligible: true,
    valid: true,
  },
  {
    studentCode: "SV220110",
    studentName: "Phan Thảo Vy",
    topicTitle: "Phân tích log an toàn thông tin theo thời gian thực",
    supervisorCode: "GV017",
    tags: ["Security", "Data"],
    isEligible: true,
    valid: true,
  },
  {
    studentCode: "SV220111",
    studentName: "Đinh Văn Nam",
    topicTitle: "Ứng dụng AR hỗ trợ trình bày đồ án",
    supervisorCode: "GV044",
    tags: ["AR", "UX"],
    isEligible: false,
    valid: true,
  },
  {
    studentCode: "SV220112",
    studentName: "Huỳnh Khánh Linh",
    topicTitle: "Hệ thống chatbot tư vấn quy trình bảo vệ",
    supervisorCode: "GV022",
    tags: ["NLP", "Web"],
    isEligible: true,
    valid: true,
  },
];

const MOCK_CAPABILITIES: LecturerCapability[] = [
  {
    lecturerCode: "GV018",
    lecturerName: "PGS.TS Nguyễn Thanh Bình",
    tags: ["AI", "Data"],
    busySlots: ["T2-C", "T3-S"],
  },
  {
    lecturerCode: "GV022",
    lecturerName: "TS. Trần Thu Hà",
    tags: ["Web"],
    busySlots: ["T4-S"],
  },
  {
    lecturerCode: "GV031",
    lecturerName: "TS. Đỗ Quang Huy",
    tags: [],
    busySlots: ["T5-C"],
    warning: "Chưa chọn tag chuyên môn",
  },
  {
    lecturerCode: "GV025",
    lecturerName: "ThS. Vũ Hồng Anh",
    tags: ["Security", "IoT"],
    busySlots: ["T6-S", "T6-C"],
  },
  {
    lecturerCode: "GV040",
    lecturerName: "TS. Phạm Trung Kiên",
    tags: ["Data", "Optimization"],
    busySlots: ["T3-C", "T5-S"],
  },
  {
    lecturerCode: "GV041",
    lecturerName: "TS. Nguyễn Thu Hà",
    tags: ["NLP", "AI"],
    busySlots: ["T2-S", "T4-C"],
  },
  {
    lecturerCode: "GV044",
    lecturerName: "ThS. Lê Tuấn Anh",
    tags: ["UX", "Web"],
    busySlots: ["T5-C"],
  },
  {
    lecturerCode: "GV050",
    lecturerName: "TS. Trần Quốc Đạt",
    tags: ["Optimization", "Algorithm"],
    busySlots: ["T6-S"],
  },
];

const INITIAL_DRAFTS: CouncilDraft[] = [
  {
    id: "HD-2026-01",
    room: "A101",
    session: "Sang",
    slotId: "FULLDAY-01",
    councilTags: ["AI", "Data"],
    morningStudents: ["SV220101", "SV220103", "SV220107", "SV220109"],
    afternoonStudents: ["SV220102", "SV220106", "SV220108", "SV220110"],
    forbiddenLecturers: ["GV018"],
    members: [
      { role: "CT", lecturerCode: "GV022", lecturerName: "TS. Trần Thu Hà" },
      { role: "TK", lecturerCode: "GV025", lecturerName: "ThS. Vũ Hồng Anh" },
      { role: "PB", lecturerCode: "GV031", lecturerName: "TS. Đỗ Quang Huy" },
      { role: "UV", lecturerCode: "GV040", lecturerName: "TS. Phạm Trung Kiên" },
    ],
  },
  {
    id: "HD-2026-02",
    room: "A102",
    session: "Chieu",
    slotId: "FULLDAY-02",
    councilTags: ["Web", "NLP"],
    morningStudents: ["SV220102", "SV220106", "SV220112", "SV220107"],
    afternoonStudents: ["SV220101", "SV220103", "SV220109", "SV220110"],
    forbiddenLecturers: ["GV022"],
    members: [
      { role: "CT", lecturerCode: "GV018", lecturerName: "PGS.TS Nguyễn Thanh Bình" },
      { role: "TK", lecturerCode: "GV019", lecturerName: "ThS. Lê Minh Đức" },
      { role: "PB", lecturerCode: "GV041", lecturerName: "TS. Nguyễn Thu Hà" },
      { role: "UV", lecturerCode: "GV031", lecturerName: "TS. Đỗ Quang Huy" },
    ],
    warning: "Cân bằng tải đang lệch ở vai trò Chủ tịch",
  },
  {
    id: "HD-2026-03",
    room: "B201",
    session: "Sang",
    slotId: "FULLDAY-03",
    councilTags: ["Security", "IoT"],
    morningStudents: ["SV220108", "SV220110", "SV220103", "SV220101"],
    afternoonStudents: ["SV220106", "SV220107", "SV220109", "SV220112"],
    forbiddenLecturers: ["GV017"],
    members: [
      { role: "CT", lecturerCode: "GV040", lecturerName: "TS. Phạm Trung Kiên" },
      { role: "TK", lecturerCode: "GV044", lecturerName: "ThS. Lê Tuấn Anh" },
      { role: "PB", lecturerCode: "GV041", lecturerName: "TS. Nguyễn Thu Hà" },
      { role: "UV", lecturerCode: "GV022", lecturerName: "TS. Trần Thu Hà" },
    ],
  },
];

const MOCK_SYNC_AUDIT_LOGS: SyncAuditLog[] = [
  {
    timestamp: "07/03/2026 09:00:12",
    action: "Sync Eligible Students",
    result: "Success",
    records: "500/500",
  },
  {
    timestamp: "07/03/2026 09:15:48",
    action: "Sync Eligible Students",
    result: "Partial",
    records: "486/500 (14 loi)",
  },
  {
    timestamp: "07/03/2026 10:02:11",
    action: "Sync Eligible Students",
    result: "Timeout",
    records: "0/500",
  },
];

const MOCK_EXPORT_JOBS: ExportJob[] = [
  { id: "EXP-001", scope: "Bien ban + Bang diem - K2026.1", status: "Done", duration: "24s" },
  { id: "EXP-002", scope: "Bien ban - K2026.1", status: "Running", duration: "12s" },
  { id: "EXP-003", scope: "Bang diem - K2025.2", status: "Retry", duration: "38s" },
];

const MOCK_PUBLISH_BATCHES: PublishBatch[] = [
  {
    id: "PUB-2026-01",
    term: "Dot 2026.1",
    totalStudents: 128,
    publishedAt: "07/03/2026 14:10",
    status: "Published",
  },
  {
    id: "PUB-2026-02",
    term: "Dot 2026.2",
    totalStudents: 132,
    publishedAt: "--",
    status: "Draft",
  },
];

const ROOMS = ["A101", "A102", "B201", "B202", "Lab-IoT"];
const FIXED_TOPICS_PER_SESSION = 4;
const FIXED_MEMBERS_PER_COUNCIL = 4;
const COUNCIL_CONFIG_OPTIONS = [3, 4, 5, 6, 7];

const stages: Array<{ key: StageKey; label: string; icon: React.ReactNode }> = [
  { key: "prepare", label: "Khởi tạo dữ liệu", icon: <UploadCloud size={16} /> },
  { key: "grouping", label: "Cấu hình hội đồng", icon: <Sparkles size={16} /> },
  { key: "assignment", label: "Phân công", icon: <Workflow size={16} /> },
  { key: "operation", label: "Điều hành chấm điểm", icon: <Gavel size={16} /> },
  { key: "publish", label: "Hậu bảo vệ", icon: <FileSpreadsheet size={16} /> },
];

const baseCard: React.CSSProperties = {
  background: "linear-gradient(155deg, rgba(255,255,255,0.97) 0%, rgba(241,245,249,0.96) 100%)",
  border: "1px solid rgba(30, 41, 59, 0.22)",
  borderRadius: 18,
  padding: 20,
  boxShadow: "0 20px 36px rgba(15, 23, 42, 0.14)",
  backdropFilter: "blur(8px)",
};

const CommitteeManagement: React.FC = () => {
  const [activeStage, setActiveStage] = useState<StageKey>("prepare");

  const [students, setStudents] = useState<EligibleStudent[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "success" | "timeout">("idle");

  const [selectedRooms, setSelectedRooms] = useState<string[]>(["A101", "A102"]);
  const [morningStart, setMorningStart] = useState("08:00");
  const [morningEnd, setMorningEnd] = useState("11:30");
  const [afternoonStart, setAfternoonStart] = useState("13:30");
  const [afternoonEnd, setAfternoonEnd] = useState("17:00");
  const [maxCapacity, setMaxCapacity] = useState(4);
  const [configSaved, setConfigSaved] = useState(false);
  const [councilConfigConfirmed, setCouncilConfigConfirmed] = useState(false);
  const [topicsPerSessionConfig, setTopicsPerSessionConfig] = useState(4);
  const [membersPerCouncilConfig, setMembersPerCouncilConfig] = useState(4);
  const [configCouncilTags, setConfigCouncilTags] = useState<string[]>(["AI", "Web"]);

  const [capabilitiesLocked, setCapabilitiesLocked] = useState(false);

  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [drafts, setDrafts] = useState<CouncilDraft[]>([]);
  const [kanbanMessage, setKanbanMessage] = useState<string>("");
  const [searchCouncil, setSearchCouncil] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [roomFilter, setRoomFilter] = useState<string>("all");
  const [councilPage, setCouncilPage] = useState(1);
  const [selectedCouncilId, setSelectedCouncilId] = useState<string>("");
  const [manualMode, setManualMode] = useState<"create" | "edit" | null>(null);
  const [manualId, setManualId] = useState("HD-2026-04");
  const [manualRoom, setManualRoom] = useState(ROOMS[0]);
  const [manualCouncilTags, setManualCouncilTags] = useState<string[]>([]);
  const [manualMorningStudents, setManualMorningStudents] = useState<string[]>([]);
  const [manualAfternoonStudents, setManualAfternoonStudents] = useState<string[]>([]);
  const [manualMembers, setManualMembers] = useState<CouncilMember[]>([
    { role: "CT", lecturerCode: "", lecturerName: "" },
    { role: "TK", lecturerCode: "", lecturerName: "" },
    { role: "PB", lecturerCode: "", lecturerName: "" },
    { role: "UV", lecturerCode: "", lecturerName: "" },
  ]);
  const [manualError, setManualError] = useState("");
  const [manualReadOnly, setManualReadOnly] = useState(false);

  const [varianceThreshold, setVarianceThreshold] = useState(1.5);
  const [currentVariance, setCurrentVariance] = useState(1.7);
  const [allowFinalizeAfterWarning, setAllowFinalizeAfterWarning] = useState(false);

  const [isFinalized, setIsFinalized] = useState(false);
  const [emailFailed] = useState(1);
  const [published, setPublished] = useState(false);

  const [exportMinutes, setExportMinutes] = useState(true);
  const [exportScores, setExportScores] = useState(true);

  const validRows = useMemo(
    () => students.filter((item: EligibleStudent) => item.valid),
    [students]
  );

  const hasTimeConflict = useMemo(
    () => morningEnd >= afternoonStart,
    [morningEnd, afternoonStart]
  );

  const allTags = useMemo(() => {
    const values = new Set<string>();
    MOCK_STUDENTS.forEach((item: EligibleStudent) => item.tags.forEach((tag) => values.add(tag)));
    MOCK_CAPABILITIES.forEach((item: LecturerCapability) => item.tags.forEach((tag) => values.add(tag)));
    return Array.from(values).sort();
  }, []);

  const eligibleStudents = useMemo(() => {
    const source = validRows.length
      ? validRows
      : MOCK_STUDENTS.filter((item: EligibleStudent) => item.isEligible && item.valid);
    return source;
  }, [validRows]);

  const canCreateCouncils = useMemo(
    () => eligibleStudents.length > 0 && configSaved && capabilitiesLocked && councilConfigConfirmed,
    [eligibleStudents.length, configSaved, capabilitiesLocked, councilConfigConfirmed]
  );

  const hasUnresolvedWarning = useMemo(
    () => drafts.some((draft: CouncilDraft) => !!draft.warning),
    [drafts]
  );

  const councilRows = useMemo(() => {
    const source = drafts.length ? drafts : INITIAL_DRAFTS;
    return source.map((council: CouncilDraft) => {
      let status: CommitteeStatus = "Draft";
      if (isFinalized && published) {
        status = "Published";
      } else if (council.warning) {
        status = "Warning";
      } else if (drafts.length > 0) {
        status = "Ready";
      }

      return {
        ...council,
        status,
        memberCount: council.members.length,
      };
    });
  }, [drafts, isFinalized, published]);

  const availableRooms = useMemo(() => {
    const unique = Array.from(new Set(councilRows.map((item) => item.room)));
    return unique.sort();
  }, [councilRows]);

  const filteredCouncilRows = useMemo(() => {
    const keyword = searchCouncil.trim().toLowerCase();
    return councilRows.filter((item) => {
      const matchKeyword =
        keyword.length === 0 ||
        item.id.toLowerCase().includes(keyword) ||
        item.slotId.toLowerCase().includes(keyword);
      const matchTag = tagFilter === "all" || item.councilTags.includes(tagFilter);
      const matchRoom = roomFilter === "all" || item.room === roomFilter;
      return matchKeyword && matchTag && matchRoom;
    });
  }, [councilRows, searchCouncil, tagFilter, roomFilter]);

  const councilTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredCouncilRows.length / 10)),
    [filteredCouncilRows.length]
  );

  const pagedCouncilRows = useMemo(() => {
    const safePage = Math.min(councilPage, councilTotalPages);
    const start = (safePage - 1) * 10;
    return filteredCouncilRows.slice(start, start + 10);
  }, [filteredCouncilRows, councilPage, councilTotalPages]);

  const editableDrafts = useMemo(
    () => (drafts.length ? drafts : INITIAL_DRAFTS),
    [drafts]
  );

  const selectedCouncil = useMemo(
    () => editableDrafts.find((item: CouncilDraft) => item.id === selectedCouncilId) ?? null,
    [editableDrafts, selectedCouncilId]
  );

  const nextGeneratedCouncilId = useMemo(() => {
    const values = editableDrafts
      .map((item: CouncilDraft) => Number(item.id.split("-").at(-1)))
      .filter((value: number) => Number.isFinite(value));
    const max = values.length ? Math.max(...values) : 0;
    return `HD-2026-${String(max + 1).padStart(2, "0")}`;
  }, [editableDrafts]);

  const scoreRows = useMemo(() => {
    const hashScore = (seed: string) => {
      let hash = 0;
      for (let i = 0; i < seed.length; i += 1) {
        hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
      }
      const score = 6 + (hash % 41) / 10;
      return Math.min(10, Math.round(score * 10) / 10);
    };
    const toGrade = (value: number) => {
      if (value >= 8.5) return "A";
      if (value >= 7) return "B";
      if (value >= 5.5) return "C";
      if (value >= 4) return "D";
      return "F";
    };

    const rows: ScoreStatisticRow[] = [];
    councilRows.forEach((council) => {
      const morning = council.morningStudents.map((studentCode) => ({ studentCode, session: "Sáng" as const }));
      const afternoon = council.afternoonStudents.map((studentCode) => ({ studentCode, session: "Chiều" as const }));
      [...morning, ...afternoon].forEach((item) => {
        const student = findStudentByCode(item.studentCode);
        const score = hashScore(`${council.id}-${item.studentCode}-${item.session}`);
        rows.push({
          councilId: council.id,
          room: council.room,
          session: item.session,
          studentCode: item.studentCode,
          studentName: student?.studentName ?? "-",
          topicTitle: student?.topicTitle ?? "-",
          score,
          grade: toGrade(score),
        });
      });
    });
    return rows;
  }, [councilRows]);

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
    const average = Math.round((scoreRows.reduce((sum, row) => sum + row.score, 0) / total) * 100) / 100;
    const passRate = Math.round((scoreRows.filter((row) => row.score >= 5).length / total) * 1000) / 10;
    const highest = scoreRows.reduce((best, row) => (row.score > best.score ? row : best), scoreRows[0]);
    const lowest = scoreRows.reduce((worst, row) => (row.score < worst.score ? row : worst), scoreRows[0]);
    return { totalStudents: total, average, passRate, highest, lowest };
  }, [scoreRows]);

  const councilScoreSummaries = useMemo(() => {
    return councilRows.map((council) => {
      const rows = scoreRows.filter((item) => item.councilId === council.id);
      const avg = rows.length ? Math.round((rows.reduce((sum, item) => sum + item.score, 0) / rows.length) * 100) / 100 : 0;
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
    const good = scoreRows.filter((row) => row.score >= 7 && row.score < 8.5).length;
    const fair = scoreRows.filter((row) => row.score >= 5.5 && row.score < 7).length;
    const weak = scoreRows.filter((row) => row.score < 5.5).length;
    return [
      { label: "Xuất sắc (>= 8.5)", count: excellent, color: "#166534", pct: Math.round((excellent / total) * 1000) / 10 },
      { label: "Khá (7.0 - 8.4)", count: good, color: "#1d4ed8", pct: Math.round((good / total) * 1000) / 10 },
      { label: "Đạt (5.5 - 6.9)", count: fair, color: "#b45309", pct: Math.round((fair / total) * 1000) / 10 },
      { label: "Cần cải thiện (< 5.5)", count: weak, color: "#b91c1c", pct: Math.round((weak / total) * 1000) / 10 },
    ];
  }, [scoreRows]);

  const findStudentByCode = (studentCode: string) =>
    MOCK_STUDENTS.find((item: EligibleStudent) => item.studentCode === studentCode) ?? null;

  const pickStudentsByTags = (tags: string[], excludedCodes?: Set<string>) => {
    const excluded = excludedCodes ?? new Set<string>();
    const matched = eligibleStudents.filter(
      (item: EligibleStudent) =>
        !excluded.has(item.studentCode) && (tags.length === 0 || item.tags.some((tag: string) => tags.includes(tag)))
    );
    const fallback = eligibleStudents.filter(
      (item: EligibleStudent) => !excluded.has(item.studentCode) && !matched.some((picked) => picked.studentCode === item.studentCode)
    );
    const picked = [...matched, ...fallback].slice(0, FIXED_TOPICS_PER_SESSION * 2);
    return {
      morning: picked.slice(0, FIXED_TOPICS_PER_SESSION).map((item: EligibleStudent) => item.studentCode),
      afternoon: picked.slice(FIXED_TOPICS_PER_SESSION, FIXED_TOPICS_PER_SESSION * 2).map((item: EligibleStudent) => item.studentCode),
    };
  };

  const pickMembersByTags = (
    tags: string[],
    blockedSupervisors: Set<string>,
    excludedLecturers: Set<string>
  ) => {
    const tagMatched = MOCK_CAPABILITIES.filter(
      (item: LecturerCapability) =>
        !excludedLecturers.has(item.lecturerCode) &&
        !blockedSupervisors.has(item.lecturerCode) &&
        (tags.length === 0 || item.tags.some((tag: string) => tags.includes(tag)))
    );
    const fallback = MOCK_CAPABILITIES.filter(
      (item: LecturerCapability) =>
        !excludedLecturers.has(item.lecturerCode) &&
        !blockedSupervisors.has(item.lecturerCode) &&
        !tagMatched.some((picked) => picked.lecturerCode === item.lecturerCode)
    );
    const picked = [...tagMatched, ...fallback].slice(0, FIXED_MEMBERS_PER_COUNCIL);
    return (["CT", "TK", "PB", "UV"] as CouncilRole[]).map((role: CouncilRole, idx: number) => ({
      role,
      lecturerCode: picked[idx]?.lecturerCode ?? "",
      lecturerName: picked[idx]?.lecturerName ?? "",
    }));
  };

  const syncData = () => {
    setSyncing(true);
    setSyncStatus("idle");
    setTimeout(() => {
      setStudents(MOCK_STUDENTS.filter((item: EligibleStudent) => item.isEligible));
      setSyncedAt(new Date().toLocaleString("vi-VN"));
      setSyncStatus("success");
      setSyncing(false);
    }, 650);
  };

  const simulateTimeout = () => {
    setSyncStatus("timeout");
    setSyncedAt(new Date().toLocaleString("vi-VN"));
  };

  const toggleRoom = (room: string) => {
    setConfigSaved(false);
    setSelectedRooms((prev: string[]) =>
      prev.includes(room)
        ? prev.filter((value: string) => value !== room)
        : [...prev, room]
    );
  };

  const saveConfig = () => {
    if (hasTimeConflict || selectedRooms.length === 0) {
      setConfigSaved(false);
      return;
    }
    setConfigSaved(true);
  };

  const saveCouncilConfig = () => {
    if (configCouncilTags.length === 0) {
      setCouncilConfigConfirmed(false);
      return;
    }
    setCouncilConfigConfirmed(true);
    setKanbanMessage(
      `Đã lưu tham số cấu hình (${topicsPerSessionConfig} đề tài/buổi, ${membersPerCouncilConfig} thành viên). Khi tạo chính thức hệ thống chuẩn hóa 2 buổi, mỗi buổi 4 đề tài và 4 thành viên.`
    );
  };

  const lockCapabilities = () => {
    setCapabilitiesLocked(true);
  };

  const runAssignment = () => {
    if (!canCreateCouncils) return;
    setAssignmentLoading(true);
    setTimeout(() => {
      const generated: CouncilDraft[] = [];
      const usedStudentCodes = new Set<string>();
      const usedLecturerCodes = new Set<string>();
      const targetRooms = selectedRooms.length ? selectedRooms : [ROOMS[0]];

      targetRooms.forEach((room: string, idx: number) => {
        const activeTags = configCouncilTags.length ? configCouncilTags : allTags.slice(0, 2);
        const pickedStudents = pickStudentsByTags(activeTags, usedStudentCodes);
        pickedStudents.morning.forEach((code) => usedStudentCodes.add(code));
        pickedStudents.afternoon.forEach((code) => usedStudentCodes.add(code));

        const blockedSupervisors = new Set<string>();
        [...pickedStudents.morning, ...pickedStudents.afternoon].forEach((studentCode: string) => {
          const supervisorCode = findStudentByCode(studentCode)?.supervisorCode;
          if (supervisorCode) blockedSupervisors.add(supervisorCode);
        });

        const members = pickMembersByTags(activeTags, blockedSupervisors, usedLecturerCodes);
        members.forEach((member: CouncilMember) => {
          if (member.lecturerCode) usedLecturerCodes.add(member.lecturerCode);
        });

        const warning =
          pickedStudents.morning.length < FIXED_TOPICS_PER_SESSION ||
          pickedStudents.afternoon.length < FIXED_TOPICS_PER_SESSION ||
          members.some((member) => !member.lecturerCode)
            ? "Thiếu dữ liệu để chuẩn hóa đầy đủ 4 đề tài/buổi hoặc 4 thành viên."
            : undefined;

        generated.push({
          id: `HD-2026-${String(idx + 1).padStart(2, "0")}`,
          room,
          session: "Sang",
          slotId: `FULLDAY-${String(idx + 1).padStart(2, "0")}`,
          councilTags: activeTags,
          morningStudents: pickedStudents.morning,
          afternoonStudents: pickedStudents.afternoon,
          forbiddenLecturers: Array.from(blockedSupervisors),
          members,
          warning,
        });
      });

      setDrafts(generated);
      setSelectedCouncilId(generated[0]?.id ?? "");
      setManualMode(null);
      setManualReadOnly(false);
      setCouncilPage(1);
      setAssignmentLoading(false);
      setKanbanMessage(
        `Đã tạo ${generated.length} hội đồng theo tags. Cấu hình nhập (${topicsPerSessionConfig}/${membersPerCouncilConfig}) đã được chuẩn hóa về mẫu cố định: 2 buổi, mỗi buổi 4 đề tài và 4 thành viên.`
      );
    }, 900);
  };

  const finalize = () => {
    if (!drafts.length) return;
    if (hasUnresolvedWarning && !allowFinalizeAfterWarning) return;
    setIsFinalized(true);
  };

  const publishAllScores = () => {
    if (!isFinalized) return;
    setPublished(true);
  };

  const getLecturerNameByCode = (lecturerCode: string) =>
    MOCK_CAPABILITIES.find((item: LecturerCapability) => item.lecturerCode === lecturerCode)
      ?.lecturerName ?? "";

  const selectedCouncilStudents = useMemo(() => {
    const rows = [...manualMorningStudents.map((code) => ({ studentCode: code, sessionLabel: "Sáng" })), ...manualAfternoonStudents.map((code) => ({ studentCode: code, sessionLabel: "Chiều" }))];
    return rows.map((item) => {
      const student = findStudentByCode(item.studentCode);
      const supervisorCode = student?.supervisorCode ?? "";
      const supervisorName = supervisorCode ? getLecturerNameByCode(supervisorCode) || supervisorCode : "Chưa gán";
      return {
        studentCode: item.studentCode,
        studentName: student?.studentName ?? "-",
        topicTitle: student?.topicTitle ?? "-",
        supervisorCode: supervisorCode || "-",
        supervisorName,
        sessionLabel: item.sessionLabel,
      };
    });
  }, [manualMorningStudents, manualAfternoonStudents]);

  const resetManualForm = (defaultId?: string) => {
    const autoPicked = pickStudentsByTags(configCouncilTags.length ? configCouncilTags : allTags.slice(0, 2));
    setManualId(defaultId ?? nextGeneratedCouncilId);
    setManualRoom(selectedRooms[0] ?? ROOMS[0]);
    setManualCouncilTags(configCouncilTags.length ? configCouncilTags : allTags.slice(0, 2));
    setManualMorningStudents(autoPicked.morning);
    setManualAfternoonStudents(autoPicked.afternoon);
    setManualMembers([
      { role: "CT", lecturerCode: "", lecturerName: "" },
      { role: "TK", lecturerCode: "", lecturerName: "" },
      { role: "PB", lecturerCode: "", lecturerName: "" },
      { role: "UV", lecturerCode: "", lecturerName: "" },
    ]);
    setManualError("");
    setManualReadOnly(false);
  };

  const startCreateCouncil = () => {
    setManualMode("create");
    resetManualForm(nextGeneratedCouncilId);
  };

  const toggleConfigCouncilTag = (tag: string) => {
    setCouncilConfigConfirmed(false);
    setConfigCouncilTags((prev: string[]) =>
      prev.includes(tag) ? prev.filter((item: string) => item !== tag) : [...prev, tag]
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
      return next;
    });
  };

  const startEditCouncil = (councilId?: string, readOnly = false) => {
    const target = councilId
      ? editableDrafts.find((item: CouncilDraft) => item.id === councilId) ?? null
      : selectedCouncil;
    if (!target) return;
    setManualMode("edit");
    setSelectedCouncilId(target.id);
    setManualId(target.id);
    setManualRoom(target.room);
    setManualCouncilTags(target.councilTags);
    setManualMorningStudents(target.morningStudents);
    setManualAfternoonStudents(target.afternoonStudents);
    setManualMembers(
      (["CT", "TK", "PB", "UV"] as CouncilRole[]).map((role: CouncilRole) => {
        const current = target.members.find((member: CouncilMember) => member.role === role);
        return {
          role,
          lecturerCode: current?.lecturerCode ?? "",
          lecturerName: current?.lecturerName ?? "",
        };
      })
    );
    setManualError("");
    setManualReadOnly(readOnly);
  };

  const deleteSelectedCouncil = (councilId?: string) => {
    const target = councilId
      ? editableDrafts.find((item: CouncilDraft) => item.id === councilId) ?? null
      : selectedCouncil;
    if (!target) return;
    const source = editableDrafts;
    const next = source.filter((item: CouncilDraft) => item.id !== target.id);
    setDrafts(next);
    setSelectedCouncilId(next[0]?.id ?? "");
    setManualMode(null);
    setManualReadOnly(false);
    setKanbanMessage(`Đã xóa hội đồng ${target.id}.`);
  };

  const updateManualMember = (role: CouncilRole, lecturerCode: string) => {
    const lecturerName = getLecturerNameByCode(lecturerCode);
    setManualMembers((prev: CouncilMember[]) =>
      prev.map((member: CouncilMember) =>
        member.role === role
          ? {
              ...member,
              lecturerCode,
              lecturerName,
            }
          : member
      )
    );
  };

  const saveManualCouncil = () => {
    if (!manualId.trim()) {
      setManualError("Mã hội đồng không được để trống.");
      return;
    }

    if (manualMorningStudents.length !== FIXED_TOPICS_PER_SESSION || manualAfternoonStudents.length !== FIXED_TOPICS_PER_SESSION) {
      setManualError("Mỗi buổi phải có đúng 4 đề tài theo mẫu cố định của hệ thống.");
      return;
    }

    if (manualCouncilTags.length === 0) {
      setManualError("Vui lòng chọn ít nhất 1 tag cho hội đồng.");
      return;
    }

    const missingRoles = manualMembers.filter((item: CouncilMember) => !item.lecturerCode);
    if (missingRoles.length > 0) {
      setManualError("Vui lòng chọn đủ thành viên cho 4 vai trò CT/TK/PB/UV.");
      return;
    }

    const unique = new Set(manualMembers.map((item: CouncilMember) => item.lecturerCode));
    if (unique.size !== manualMembers.length) {
      setManualError("Một giảng viên không thể giữ đồng thời nhiều vai trò trong cùng hội đồng.");
      return;
    }

    const blockedSupervisors = new Set<string>();
    [...manualMorningStudents, ...manualAfternoonStudents].forEach((studentCode: string) => {
      const supervisorCode = findStudentByCode(studentCode)?.supervisorCode;
      if (supervisorCode) blockedSupervisors.add(supervisorCode);
    });
    const violating = manualMembers.find((member: CouncilMember) => blockedSupervisors.has(member.lecturerCode));
    if (violating) {
      setManualError(`Vi phạm ràng buộc: ${violating.lecturerCode} là GVHD của sinh viên trong hội đồng.`);
      return;
    }

    if (manualMode !== "edit" && editableDrafts.some((item: CouncilDraft) => item.id === manualId.trim())) {
      setManualError("Mã hội đồng đã tồn tại. Vui lòng nhập mã khác.");
      return;
    }

    const draft: CouncilDraft = {
      id: manualId.trim(),
      room: manualRoom,
      session: "Sang",
      slotId: `${manualId.trim()}-FULLDAY`,
      councilTags: manualCouncilTags,
      morningStudents: manualMorningStudents,
      afternoonStudents: manualAfternoonStudents,
      forbiddenLecturers: Array.from(blockedSupervisors),
      members: manualMembers,
      warning: undefined,
    };

    const source = editableDrafts;
    const next =
      manualMode === "edit" && selectedCouncil
        ? source.map((item: CouncilDraft) => (item.id === selectedCouncil.id ? draft : item))
        : [...source, draft];

    setDrafts(next);
    setSelectedCouncilId(draft.id);
    setManualMode(null);
    setManualError("");
    setManualReadOnly(false);
    setKanbanMessage(
      manualMode === "edit"
        ? `Đã cập nhật hội đồng ${draft.id}.`
        : `Đã tạo hội đồng thủ công ${draft.id}.`
    );
  };

  const closeManualModal = () => {
    setManualMode(null);
    setManualReadOnly(false);
    setManualError("");
  };

  const downloadCsv = (fileName: string, headers: string[], rows: Array<Array<string | number>>) => {
    const lines = [headers, ...rows].map((line) =>
      line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
    );
    const blob = new Blob([`\uFEFF${lines.join("\n")}`], { type: "text/csv;charset=utf-8;" });
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
      const chair = council.members.find((member: CouncilMember) => member.role === "CT")?.lecturerName ?? "-";
      const secretary = council.members.find((member: CouncilMember) => member.role === "TK")?.lecturerName ?? "-";
      const reviewer = council.members.find((member: CouncilMember) => member.role === "PB")?.lecturerName ?? "-";
      const member = council.members.find((memberItem: CouncilMember) => memberItem.role === "UV")?.lecturerName ?? "-";

      const rows = [
        ...council.morningStudents.map((studentCode) => ({ studentCode, session: "Sáng" })),
        ...council.afternoonStudents.map((studentCode) => ({ studentCode, session: "Chiều" })),
      ];

      rows.forEach((item) => {
        const student = findStudentByCode(item.studentCode);
        const supervisorName = student?.supervisorCode
          ? getLecturerNameByCode(student.supervisorCode) || student.supervisorCode
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

    downloadCsv(`tong-hop-hoi-dong-${new Date().getTime()}.csv`, headers, allLines);
  };

  const exportCouncilSummaryPdf = () => {
    const rows = councilScoreSummaries
      .map(
        (item) =>
          `<tr><td>${item.id}</td><td>${item.room}</td><td>${item.tags || "-"}</td><td>${item.studentCount}</td><td>${item.avg}</td><td>${item.max}</td><td>${item.min}</td></tr>`
      )
      .join("");
    openPrintableReport(
      "Báo cáo tổng hợp theo hội đồng",
      `<table><thead><tr><th>Hội đồng</th><th>Phòng</th><th>Tags</th><th>Số SV</th><th>Điểm TB</th><th>Cao nhất</th><th>Thấp nhất</th></tr></thead><tbody>${rows}</tbody></table>`
    );
  };

  const exportForm1Excel = () => {
    const selected = councilRows.find((item) => item.id === selectedCouncilId) ?? councilRows[0];
    if (!selected) return;
    const headers = ["Hội đồng", "Phòng", "Buổi", "Mã SV", "Họ tên", "Đề tài", "Điểm", "Xếp loại"];
    const rows = scoreRows
      .filter((row) => row.councilId === selected.id)
      .map((row) => [selected.id, selected.room, row.session, row.studentCode, row.studentName, row.topicTitle, row.score, row.grade]);
    downloadCsv(`form-1-${selected.id}.csv`, headers, rows);
  };

  const exportForm1Pdf = () => {
    const selected = councilRows.find((item) => item.id === selectedCouncilId) ?? councilRows[0];
    if (!selected) return;
    const rows = scoreRows
      .filter((row) => row.councilId === selected.id)
      .map(
        (row) =>
          `<tr><td>${row.session}</td><td>${row.studentCode}</td><td>${row.studentName}</td><td>${row.topicTitle}</td><td>${row.score}</td><td>${row.grade}</td></tr>`
      )
      .join("");
    openPrintableReport(
      `Mẫu Form 1 - ${selected.id}`,
      `<p>Phòng: ${selected.room} · Tags: ${selected.councilTags.join(", ") || "-"}</p><table><thead><tr><th>Buổi</th><th>Mã SV</th><th>Họ tên</th><th>Đề tài</th><th>Điểm</th><th>Xếp loại</th></tr></thead><tbody>${rows}</tbody></table>`
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
      scoreOverview.highest ? `${scoreOverview.highest.studentCode} - ${scoreOverview.highest.score}` : "-",
      scoreOverview.lowest ? `${scoreOverview.lowest.studentCode} - ${scoreOverview.lowest.score}` : "-",
    ]);
    downloadCsv(`bao-cao-cuoi-ky-${new Date().getTime()}.csv`, headers, rows);
  };

  const exportFinalTermPdf = () => {
    const summaryRows = councilScoreSummaries
      .map(
        (item) =>
          `<tr><td>${item.id}</td><td>${item.room}</td><td>${item.studentCount}</td><td>${item.avg}</td><td>${item.max}</td><td>${item.min}</td></tr>`
      )
      .join("");
    const highlight = `
      <p>Tổng sinh viên: <strong>${scoreOverview.totalStudents}</strong> · Điểm TB: <strong>${scoreOverview.average}</strong> · Tỷ lệ đạt: <strong>${scoreOverview.passRate}%</strong></p>
      <p>Điểm cao nhất: <strong>${scoreOverview.highest ? `${scoreOverview.highest.studentCode} - ${scoreOverview.highest.studentName} (${scoreOverview.highest.score})` : "-"}</strong></p>
      <p>Điểm thấp nhất: <strong>${scoreOverview.lowest ? `${scoreOverview.lowest.studentCode} - ${scoreOverview.lowest.studentName} (${scoreOverview.lowest.score})` : "-"}</strong></p>
    `;
    openPrintableReport(
      "Báo cáo cuối kỳ tổng hợp theo hội đồng",
      `${highlight}<table><thead><tr><th>Hội đồng</th><th>Phòng</th><th>Số SV</th><th>Điểm TB</th><th>Cao nhất</th><th>Thấp nhất</th></tr></thead><tbody>${summaryRows}</tbody></table>`
    );
  };

  const stageCard = (title: string, desc: string, icon: React.ReactNode, tone: string) => (
    <div
      style={{
        ...baseCard,
        borderLeft: `5px solid ${tone}`,
        paddingTop: 14,
        paddingBottom: 14,
        background:
          "linear-gradient(120deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.9) 52%, rgba(239,246,255,0.55) 100%)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: tone, fontWeight: 800 }}>
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: `${tone}20`,
            border: `1px solid ${tone}55`,
          }}
        >
          {icon}
        </span>
        {title}
      </div>
      <div style={{ marginTop: 8, color: "#475569", fontSize: 13, lineHeight: 1.5 }}>{desc}</div>
    </div>
  );

  return (
    <div
      style={{
        maxWidth: 1480,
        margin: "0 auto",
        padding: 24,
        fontFamily: "Inter, Poppins, Roboto, sans-serif",
        position: "relative",
      }}
      className="committee-root"
    >
      <style>
        {`
          .committee-root {
            --adm-ink: #0f172a;
            --adm-muted: #475569;
            --adm-main: #0f172a;
            --adm-accent: #0f766e;
            --adm-line: #cbd5e1;
            font-family: Inter, Poppins, Roboto, sans-serif;
            letter-spacing: .01em;
            color: var(--adm-ink);
            background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
          }
          .committee-root h1,
          .committee-root h2,
          .committee-root h3 {
            letter-spacing: .01em;
            line-height: 1.25;
          }
          @keyframes committeeFloatA {
            0% { transform: translate3d(0, 0, 0) scale(1); }
            50% { transform: translate3d(0, -12px, 0) scale(1.04); }
            100% { transform: translate3d(0, 0, 0) scale(1); }
          }
          @keyframes committeeFloatB {
            0% { transform: translate3d(0, 0, 0) scale(1); }
            50% { transform: translate3d(0, 10px, 0) scale(0.98); }
            100% { transform: translate3d(0, 0, 0) scale(1); }
          }
          @keyframes softPulse {
            0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.35); }
            100% { box-shadow: 0 0 0 14px rgba(37, 99, 235, 0); }
          }
          .committee-bg-layer {
            position: absolute;
            inset: 0;
            border-radius: 20px;
            overflow: hidden;
            pointer-events: none;
            z-index: 0;
            background:
              radial-gradient(circle at 8% 8%, rgba(15,118,110,.10) 0%, transparent 35%),
              radial-gradient(circle at 90% 90%, rgba(15,23,42,.08) 0%, transparent 34%);
          }
          .committee-blob-a,
          .committee-blob-b {
            position: absolute;
            filter: blur(22px);
            opacity: 0.42;
          }
          .committee-blob-a {
            width: 280px;
            height: 280px;
            top: -70px;
            right: -50px;
            border-radius: 999px;
            background: radial-gradient(circle, #5eead4 0%, #0f766e 70%, transparent 100%);
            animation: committeeFloatA 9s ease-in-out infinite;
          }
          .committee-blob-b {
            width: 240px;
            height: 240px;
            left: -60px;
            bottom: 130px;
            border-radius: 999px;
            background: radial-gradient(circle, #94a3b8 0%, #334155 72%, transparent 100%);
            animation: committeeFloatB 11s ease-in-out infinite;
          }
          .committee-content {
            position: relative;
            z-index: 1;
          }
          .committee-content section {
            transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
          }
          .committee-content section:hover {
            transform: translateY(-2px);
            box-shadow: 0 18px 32px rgba(15, 23, 42, 0.18);
            border-color: rgba(45, 212, 191, 0.5);
          }
          .committee-primary-btn {
            border: 1px solid #1e40af;
            border-radius: 12px;
            background: #1d4ed8;
            color: #fff;
            padding: 8px 14px;
            font-weight: 700;
            cursor: pointer;
            transition: background-color 0.2s ease, border-color 0.2s ease;
            letter-spacing: 0;
            font-size: 13px;
            line-height: 1;
            min-height: 40px;
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
            background: #1e40af;
            border-color: #1d4ed8;
          }
          .committee-primary-btn:disabled {
            border-color: #94a3b8;
            background: #94a3b8;
            color: #ffffff !important;
            box-shadow: none;
            cursor: not-allowed;
          }
          .committee-accent-btn {
            border: 1px solid #334155;
            border-radius: 12px;
            background: #334155;
            color: #ffffff;
            padding: 8px 14px;
            font-weight: 700;
            min-height: 40px;
            cursor: pointer;
          }
          .committee-accent-btn:hover:not(:disabled) {
            border-color: #1e293b;
            background: #1e293b;
          }
          .committee-accent-btn:disabled {
            border-color: #94a3b8;
            background: #94a3b8;
            color: #ffffff;
            cursor: not-allowed;
          }
          .committee-ghost-btn {
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            background: #ffffff;
            color: #1e40af;
            padding: 8px 12px;
            font-weight: 700;
            min-height: 40px;
            cursor: pointer;
          }
          .committee-ghost-btn:hover:not(:disabled) {
            border-color: #2563eb;
            background: #eff6ff;
          }
          .committee-danger-btn {
            border: 1px solid #dc2626;
            border-radius: 10px;
            background: #fef2f2;
            color: #b91c1c;
            padding: 8px 12px;
            font-weight: 700;
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
            border-radius: 16px;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            padding: 16px;
            color: #1e293b;
            font-family: "Segoe UI", Inter, Roboto, sans-serif;
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
            font-weight: 800;
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
            font-weight: 700;
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
            font-weight: 700;
          }
          .committee-status-dot {
            width: 9px;
            height: 9px;
            border-radius: 999px;
            background: #0f766e;
            animation: softPulse 2s infinite;
          }
          .committee-content button,
          .committee-content input,
          .committee-content textarea,
          .committee-content select {
            transition: all 0.22s ease;
          }
          .committee-content button {
            font-family: Inter, Poppins, Roboto, sans-serif;
            font-weight: 600;
            font-size: 13px;
            letter-spacing: 0;
            border-radius: 12px;
            color: #1e40af;
          }
          .committee-content button:hover:not(:disabled) {
            filter: none;
          }
          .committee-content button:disabled {
            opacity: 1;
            filter: none;
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
      <div className="committee-bg-layer">
        <div className="committee-blob-a" />
        <div className="committee-blob-b" />
      </div>
      <div className="committee-content">
      <section
        style={{
          borderRadius: 20,
          padding: 24,
          color: "#0f172a",
          background:
            "radial-gradient(circle at 85% 20%, rgba(15,118,110,0.12) 0%, rgba(15,118,110,0) 34%), linear-gradient(120deg, #ffffff 0%, #f8fafc 58%, #f0fdfa 100%)",
          border: "1px solid rgba(15,118,110,0.18)",
          boxShadow: "0 18px 40px rgba(15, 23, 42, 0.12)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 31, display: "flex", alignItems: "center", gap: 10, letterSpacing: 0.2 }}>
              <GraduationCap size={30} color="#0F766E" /> Quản lý đợt bảo vệ và phân công hội đồng
            </h1>
            <p style={{ margin: "10px 0 0", color: "#334155", maxWidth: 760, lineHeight: 1.55 }}>
              Không gian điều phối theo luồng nghiệp vụ, tối ưu thao tác cho Admin và đồng bộ dữ liệu cho giao diện Giảng viên, Sinh viên.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(130px, 1fr))", gap: 10, minWidth: 360 }}>
            <div style={{ background: "#FFFFFF", borderRadius: 14, padding: 12, border: "1px solid #DBEAFE" }}>
              <div style={{ fontSize: 12, color: "#64748B" }}>Hồ sơ hợp lệ</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{validRows.length}</div>
            </div>
            <div style={{ background: "#FFFFFF", borderRadius: 14, padding: 12, border: "1px solid #DBEAFE" }}>
              <div style={{ fontSize: 12, color: "#64748B" }}>Hội đồng nháp</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{drafts.length}</div>
            </div>
            <div style={{ background: "#FFFFFF", borderRadius: 14, padding: 12, border: "1px solid #FED7AA" }}>
              <div style={{ fontSize: 12, color: "#64748B" }}>Trạng thái đợt</div>
              <div style={{ fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                <span className="committee-status-dot" />
                {isFinalized ? "Đã chốt" : "Đang nháp"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
        {stageCard("Admin", "Khởi tạo dữ liệu, cấu hình, chốt và công bố", <Settings2 size={16} />, "#1D4ED8")}
        {stageCard("Giảng viên", "Chấm điểm trực tuyến, biên bản, duyệt chỉnh sửa", <Gavel size={16} />, "#2563EB")}
        {stageCard("Sinh viên", "Theo dõi lịch, kết quả, nộp bản chỉnh sửa", <Users size={16} />, "#EA580C")}
      </section>

      <section style={{ ...baseCard, marginTop: 16 }}>
        <div style={{ fontSize: 13, color: "#475569", marginBottom: 8, fontWeight: 600 }}>
          Điều hướng theo từng bước nghiệp vụ để thao tác đúng thứ tự và giảm lỗi vận hành.
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {stages.map((stage, idx) => (
            <button
              key={stage.key}
              type="button"
              className="stage-menu-btn"
              onClick={() => setActiveStage(stage.key)}
              style={{
                border: activeStage === stage.key ? "1px solid #1D4ED8" : "1px solid #CBD5E1",
                background: activeStage === stage.key ? "#DBEAFE" : "#FFFFFF",
                color: activeStage === stage.key ? "#1E40AF" : "#334155",
                borderRadius: 999,
                padding: "9px 14px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                boxShadow: "none",
              }}
            >
              {stage.icon}
              {idx + 1}. {stage.label}
              {idx < stages.length - 1 && <ChevronRight size={14} />}
            </button>
          ))}
        </div>
      </section>

      {activeStage === "prepare" && (
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
          <section style={baseCard}>
            <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <UploadCloud size={18} color="#1D4ED8" /> Bước 1 - Đồng bộ dữ liệu đầu vào
            </h2>
            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={syncData}
                disabled={syncing}
                className="committee-primary-btn"
              >
                <RefreshCw size={15} /> {syncing ? "Đang đồng bộ..." : "Kích hoạt đồng bộ"}
              </button>
              <button
                type="button"
                onClick={simulateTimeout}
                style={{
                  border: "1px solid #DC2626",
                  borderRadius: 10,
                  background: "#FEF2F2",
                  color: "#B91C1C",
                  padding: "10px 14px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Mô phỏng timeout
              </button>
            </div>

            {syncedAt && <div style={{ color: "#64748B", fontSize: 13 }}>Lần đồng bộ: {syncedAt}</div>}
            {syncStatus === "success" && (
              <div style={{ marginTop: 6, color: "#166534", display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle2 size={16} /> Đồng bộ thành công.
              </div>
            )}
            {syncStatus === "timeout" && (
              <div style={{ marginTop: 6, color: "#B91C1C", display: "flex", alignItems: "center", gap: 6 }}>
                <AlertTriangle size={16} /> Kết nối API bị timeout.
              </div>
            )}

            <div style={{ marginTop: 12, maxHeight: 280, overflow: "auto", border: "1px solid #E2E8F0", borderRadius: 12 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead style={{ background: "#F8FAFC" }}>
                  <tr>
                    <th style={{ textAlign: "left", padding: 9 }}>MSSV</th>
                    <th style={{ textAlign: "left", padding: 9 }}>Đề tài</th>
                    <th style={{ textAlign: "left", padding: 9 }}>GVHD</th>
                    <th style={{ textAlign: "left", padding: 9 }}>Tag</th>
                    <th style={{ textAlign: "left", padding: 9 }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((item: EligibleStudent) => (
                    <tr key={item.studentCode} style={{ background: item.valid ? "#fff" : "#FEF2F2" }}>
                      <td style={{ padding: 9, borderTop: "1px solid #E2E8F0" }}>{item.studentCode}</td>
                      <td style={{ padding: 9, borderTop: "1px solid #E2E8F0" }}>{item.topicTitle}</td>
                      <td style={{ padding: 9, borderTop: "1px solid #E2E8F0" }}>{item.supervisorCode || "-"}</td>
                      <td style={{ padding: 9, borderTop: "1px solid #E2E8F0" }}>{item.tags.join(", ") || "-"}</td>
                      <td style={{ padding: 9, borderTop: "1px solid #E2E8F0" }}>{item.valid ? "Hợp lệ" : item.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" style={{ marginTop: 10, border: 0, background: "transparent", color: "#1D4ED8", fontWeight: 800, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <Download size={16} /> Xuất CSV dữ liệu lỗi
            </button>
          </section>

          <section style={baseCard}>
            <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Settings2 size={18} color="#1D4ED8" /> Bước 2 - Cấu hình đợt bảo vệ
            </h2>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Phòng sử dụng</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
              {ROOMS.map((room: string) => (
                <button
                  key={room}
                  type="button"
                  onClick={() => toggleRoom(room)}
                  style={{
                    border: `1px solid ${selectedRooms.includes(room) ? "#1D4ED8" : "#CBD5E1"}`,
                    background: selectedRooms.includes(room) ? "#DBEAFE" : "#FFFFFF",
                    borderRadius: 999,
                    padding: "6px 12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {room}
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <label style={{ display: "grid", gap: 4 }}>
                Ca sáng
                <input type="time" value={morningStart} onChange={(e) => setMorningStart(e.target.value)} />
              </label>
              <label style={{ display: "grid", gap: 4 }}>
                Kết thúc ca sáng
                <input type="time" value={morningEnd} onChange={(e) => setMorningEnd(e.target.value)} />
              </label>
              <label style={{ display: "grid", gap: 4 }}>
                Ca chiều
                <input type="time" value={afternoonStart} onChange={(e) => setAfternoonStart(e.target.value)} />
              </label>
              <label style={{ display: "grid", gap: 4 }}>
                Kết thúc ca chiều
                <input type="time" value={afternoonEnd} onChange={(e) => setAfternoonEnd(e.target.value)} />
              </label>
            </div>

            <label style={{ display: "grid", gap: 4, marginTop: 8 }}>
              Số hội đồng tối đa/ngày (tham số mềm)
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

            {hasTimeConflict && <div style={{ color: "#B91C1C", marginTop: 8 }}>Ca sáng và chiều đang giao nhau.</div>}

            <button type="button" onClick={saveConfig} className="committee-primary-btn" style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <Save size={15} /> Lưu cấu hình
            </button>
            {configSaved && <div style={{ marginTop: 8, color: "#166534" }}>Đã lưu cấu hình tham số đợt bảo vệ.</div>}

            <div style={{ marginTop: 12, border: "1px solid #E2E8F0", borderRadius: 12, padding: 10 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Nhật ký đồng bộ</div>
              {MOCK_SYNC_AUDIT_LOGS.map((log: SyncAuditLog) => (
                <div key={`${log.timestamp}-${log.action}`} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                  <span>{log.timestamp}</span>
                  <span style={{ color: log.result === "Success" ? "#166534" : log.result === "Partial" ? "#B45309" : "#B91C1C" }}>
                    {log.result} · {log.records}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeStage === "grouping" && (
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
          <section style={baseCard}>
            <h2 style={{ marginTop: 0, display: "flex", gap: 8, alignItems: "center" }}>
              <Users size={18} color="#1D4ED8" /> Bước 3 - Quản lý năng lực giảng viên
            </h2>
            <div style={{ maxHeight: 300, overflow: "auto", border: "1px solid #E2E8F0", borderRadius: 12 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead style={{ background: "#F8FAFC" }}>
                  <tr>
                    <th style={{ textAlign: "left", padding: 9 }}>Giảng viên</th>
                    <th style={{ textAlign: "left", padding: 9 }}>Tag</th>
                    <th style={{ textAlign: "left", padding: 9 }}>Busy slot</th>
                    <th style={{ textAlign: "left", padding: 9 }}>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_CAPABILITIES.map((item: LecturerCapability) => (
                    <tr key={item.lecturerCode}>
                      <td style={{ borderTop: "1px solid #E2E8F0", padding: 9 }}>{item.lecturerName}</td>
                      <td style={{ borderTop: "1px solid #E2E8F0", padding: 9 }}>{item.tags.join(", ") || "-"}</td>
                      <td style={{ borderTop: "1px solid #E2E8F0", padding: 9 }}>{item.busySlots.join(", ")}</td>
                      <td style={{ borderTop: "1px solid #E2E8F0", padding: 9, color: item.warning ? "#B45309" : "#64748B" }}>{item.warning || "OK"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={lockCapabilities}
              className="committee-primary-btn"
              style={{ marginTop: 10 }}
            >
              Chốt ma trận năng lực
            </button>
            {capabilitiesLocked && <div style={{ marginTop: 8, color: "#166534" }}>Đã chốt lịch bận và tag năng lực.</div>}
          </section>

          <section style={baseCard}>
            <h2 style={{ marginTop: 0, display: "flex", gap: 8, alignItems: "center" }}>
              <Sparkles size={18} color="#1D4ED8" /> Bước 4 - Cấu hình hội đồng trước khi tạo
            </h2>
            <div style={{ color: "#475569", fontSize: 13, marginBottom: 10, lineHeight: 1.6 }}>
              Bỏ UC 2.1 Smart Grouping tự động. Tại bước này chỉ cấu hình tham số và tags để hệ thống chuẩn bị dữ liệu gợi ý.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>Số đề tài mong muốn/buổi</span>
                <select
                  value={topicsPerSessionConfig}
                  onChange={(event) => {
                    setTopicsPerSessionConfig(Number(event.target.value));
                    setCouncilConfigConfirmed(false);
                  }}
                >
                  {COUNCIL_CONFIG_OPTIONS.map((value) => (
                    <option key={`topics-${value}`} value={value}>{value}</option>
                  ))}
                </select>
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>Số thành viên mong muốn/hội đồng</span>
                <select
                  value={membersPerCouncilConfig}
                  onChange={(event) => {
                    setMembersPerCouncilConfig(Number(event.target.value));
                    setCouncilConfigConfirmed(false);
                  }}
                >
                  {COUNCIL_CONFIG_OPTIONS.map((value) => (
                    <option key={`members-${value}`} value={value}>{value}</option>
                  ))}
                </select>
              </label>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, color: "#475569", fontWeight: 700 }}>Tags hội đồng</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
              {allTags.map((tag: string) => (
                <button
                  key={`cfg-tag-${tag}`}
                  type="button"
                  onClick={() => toggleConfigCouncilTag(tag)}
                  className="committee-ghost-btn"
                  style={{
                    minHeight: 34,
                    padding: "6px 10px",
                    borderColor: configCouncilTags.includes(tag) ? "#1D4ED8" : "#CBD5E1",
                    background: configCouncilTags.includes(tag) ? "#DBEAFE" : "#fff",
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 12, border: "1px solid #E2E8F0", borderRadius: 10, background: "#F8FAFC", padding: 10, fontSize: 13, color: "#334155", lineHeight: 1.6 }}>
              <div>
                Cấu hình hiện tại: {topicsPerSessionConfig} đề tài/buổi, {membersPerCouncilConfig} thành viên/hội đồng, {configCouncilTags.length} tag.
              </div>
              <div>
                Chuẩn hóa khi tạo chính thức: <strong>1 hội đồng dùng cho cả ngày, luôn có 2 buổi, mỗi buổi 4 đề tài, 4 thành viên.</strong>
              </div>
              <div>
                Ràng buộc cứng: <strong>Giảng viên hướng dẫn không được xuất hiện trong hội đồng của sinh viên mình hướng dẫn.</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={saveCouncilConfig}
              className="committee-primary-btn"
              style={{ marginTop: 10 }}
            >
              <Save size={15} /> Xác nhận tham số cấu hình
            </button>
            {councilConfigConfirmed && (
              <div style={{ marginTop: 8, color: "#166534" }}>
                Đã xác nhận cấu hình. Có thể chuyển sang bước Phân công để tạo danh sách hội đồng.
              </div>
            )}
          </section>
        </div>
      )}

      {activeStage === "assignment" && (
        <div style={{ marginTop: 16, display: "grid", gap: 16 }}>
          <section style={baseCard}>
            <h2 style={{ marginTop: 0, display: "flex", gap: 8, alignItems: "center" }}>
              <Gavel size={18} color="#1D4ED8" /> Trung tâm quản lý hội đồng
            </h2>
            <div style={{ color: "#475569", fontSize: 13, marginBottom: 10 }}>
              Theo dõi danh sách hội đồng theo phòng, tags và trạng thái. Mỗi hội đồng được hiểu là 1 đơn vị vận hành cho cả ngày (2 buổi).
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginBottom: 12 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>Tìm hội đồng</span>
                <div style={{ position: "relative" }}>
                  <Search size={14} color="#64748B" style={{ position: "absolute", left: 10, top: 11 }} />
                  <input
                    value={searchCouncil}
                    onChange={(event) => {
                      setSearchCouncil(event.target.value);
                      setCouncilPage(1);
                    }}
                    placeholder="VD: HD-2026-01, FULLDAY"
                    style={{ width: "100%", padding: "8px 10px 8px 32px", borderRadius: 10, border: "1px solid #CBD5E1" }}
                  />
                </div>
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>Lọc theo tags</span>
                <select
                  value={tagFilter}
                  onChange={(event) => {
                    setTagFilter(event.target.value);
                    setCouncilPage(1);
                  }}
                >
                  <option value="all">Tất cả tags</option>
                  {allTags.map((tag) => (
                    <option key={`filter-tag-${tag}`} value={tag}>{tag}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>Lọc theo phòng</span>
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
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 10, flexWrap: "wrap" }}>
              <div style={{ color: "#334155", fontSize: 13 }}>
                Hiển thị <strong>{pagedCouncilRows.length}</strong> / {filteredCouncilRows.length} hội đồng
                {selectedCouncilId ? (
                  <span style={{ marginLeft: 8, color: "#1D4ED8", fontWeight: 700 }}>Đang chọn: {selectedCouncilId}</span>
                ) : null}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748B", fontSize: 12 }}>
                  <SlidersHorizontal size={14} /> Bộ lọc vận hành thời gian thực
                </div>
                <button type="button" className="committee-ghost-btn" onClick={exportCouncilSummary}>
                  <Download size={14} /> Xuất file tổng hợp
                </button>
                <button type="button" className="committee-primary-btn" onClick={startCreateCouncil}>
                  <Plus size={14} /> Thêm hội đồng thủ công
                </button>
              </div>
            </div>

            <div style={{ border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead style={{ background: "#F8FAFC" }}>
                  <tr>
                    <th style={{ textAlign: "left", padding: 10 }}>Mã hội đồng</th>
                    <th style={{ textAlign: "left", padding: 10 }}>Phòng</th>
                    <th style={{ textAlign: "left", padding: 10 }}>Tags</th>
                    <th style={{ textAlign: "left", padding: 10 }}>Sáng</th>
                    <th style={{ textAlign: "left", padding: 10 }}>Chiều</th>
                    <th style={{ textAlign: "left", padding: 10 }}>Thành viên</th>
                    <th style={{ textAlign: "left", padding: 10 }}>Trạng thái</th>
                    <th style={{ textAlign: "left", padding: 10 }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedCouncilRows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedCouncilId(row.id)}
                      style={{
                        background: selectedCouncilId === row.id ? "#eff6ff" : "transparent",
                        cursor: "pointer",
                      }}
                    >
                      <td style={{ padding: 10, borderTop: "1px solid #E2E8F0", fontWeight: 700 }}>{row.id}</td>
                      <td style={{ padding: 10, borderTop: "1px solid #E2E8F0" }}>{row.room}</td>
                      <td style={{ padding: 10, borderTop: "1px solid #E2E8F0" }}>{row.councilTags.join(", ") || "-"}</td>
                      <td style={{ padding: 10, borderTop: "1px solid #E2E8F0" }}>{row.morningStudents.length}/{FIXED_TOPICS_PER_SESSION}</td>
                      <td style={{ padding: 10, borderTop: "1px solid #E2E8F0" }}>{row.afternoonStudents.length}/{FIXED_TOPICS_PER_SESSION}</td>
                      <td style={{ padding: 10, borderTop: "1px solid #E2E8F0" }}>{row.memberCount}/{FIXED_MEMBERS_PER_COUNCIL}</td>
                      <td style={{ padding: 10, borderTop: "1px solid #E2E8F0" }}>
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
                      <td style={{ padding: 10, borderTop: "1px solid #E2E8F0" }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
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
                      <td colSpan={8} style={{ padding: 14, borderTop: "1px solid #E2E8F0", textAlign: "center", color: "#64748B" }}>
                        Không tìm thấy hội đồng phù hợp với bộ lọc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredCouncilRows.length > 10 && (
              <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div style={{ color: "#64748B", fontSize: 12 }}>
                  Trang {Math.min(councilPage, councilTotalPages)} / {councilTotalPages}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    className="committee-ghost-btn"
                    disabled={councilPage <= 1}
                    onClick={() => setCouncilPage((prev) => Math.max(1, prev - 1))}
                    style={{ minHeight: 34, padding: "6px 10px" }}
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    className="committee-ghost-btn"
                    disabled={councilPage >= councilTotalPages}
                    onClick={() => setCouncilPage((prev) => Math.min(councilTotalPages, prev + 1))}
                    style={{ minHeight: 34, padding: "6px 10px" }}
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </section>

          <section style={baseCard}>
            <h2 style={{ marginTop: 0, display: "flex", gap: 8, alignItems: "center" }}>
              <Workflow size={18} color="#1D4ED8" /> Bước 5 - Lập hội đồng theo cấu hình tags
            </h2>
            <button
              type="button"
              onClick={runAssignment}
              disabled={!canCreateCouncils || assignmentLoading}
              className="committee-primary-btn"
            >
              {assignmentLoading ? "Đang tạo danh sách hội đồng..." : "Tạo hội đồng (mẫu cố định 2 buổi)"}
            </button>
            <div style={{ marginTop: 8, color: "#334155", fontSize: 13 }}>
              Điều kiện tạo: dữ liệu hợp lệ + lưu cấu hình đợt + chốt ma trận năng lực + xác nhận tham số hội đồng.
            </div>
            <div style={{ marginTop: 6, color: "#334155", fontSize: 13 }}>
              Hard constraints: GVHD không ngồi hội đồng sinh viên mình hướng dẫn · hệ thống ưu tiên ghép tags giữa hội đồng, đề tài và giảng viên.
            </div>
            <div style={{ marginTop: 12, border: "1px solid #E2E8F0", borderRadius: 12, padding: 12, background: "#F8FAFC", color: "#334155", fontSize: 13 }}>
              {drafts.length
                ? `Đã tạo ${drafts.length} hội đồng nháp theo mẫu cả ngày (2 buổi). Thao tác chi tiết thực hiện trong cột Thao tác.`
                : "Chưa có dữ liệu nháp. Hãy xác nhận cấu hình rồi chạy tạo hội đồng."}
            </div>
            {kanbanMessage && <div style={{ marginTop: 10, color: kanbanMessage.includes("Vi phạm") ? "#B91C1C" : "#166534" }}>{kanbanMessage}</div>}
          </section>
        </div>
      )}

      {activeStage === "operation" && (
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          <section style={baseCard}>
            <h2 style={{ marginTop: 0, display: "flex", gap: 8, alignItems: "center" }}>
              <AlertTriangle size={18} color="#1D4ED8" /> Bước 6 - Điều hành và cảnh báo điểm lệch
            </h2>
            <label style={{ display: "grid", gap: 4, marginBottom: 8 }}>
              Ngưỡng cảnh báo
              <input type="number" step={0.1} min={0} value={varianceThreshold} onChange={(event) => setVarianceThreshold(Number(event.target.value))} />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              Phương sai hiện tại
              <input type="number" step={0.1} min={0} value={currentVariance} onChange={(event) => setCurrentVariance(Number(event.target.value))} />
            </label>
            {currentVariance > varianceThreshold ? (
              <div style={{ marginTop: 8, color: "#B91C1C", fontWeight: 700 }}>CẢNH BÁO ĐIỂM LỆCH: Yêu cầu hội đồng điều chỉnh.</div>
            ) : (
              <div style={{ marginTop: 8, color: "#166534", fontWeight: 700 }}>Điểm nằm trong ngưỡng an toàn.</div>
            )}
          </section>

          <section style={baseCard}>
            <h2 style={{ marginTop: 0, display: "flex", gap: 8, alignItems: "center" }}>
              <Lock size={18} color="#1D4ED8" /> Chốt danh sách và khóa ca
            </h2>
            {hasUnresolvedWarning && (
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={allowFinalizeAfterWarning}
                  onChange={(event) => setAllowFinalizeAfterWarning(event.target.checked)}
                />
                Cho phép chốt có điều kiện
              </label>
            )}
            <button
              type="button"
              onClick={finalize}
              className="committee-accent-btn"
              style={{ marginTop: 10 }}
            >
              Chốt và ban hành
            </button>
            <div style={{ marginTop: 8, color: isFinalized ? "#166534" : "#64748B" }}>
              {isFinalized ? "Đã khóa bản phân công." : "Chưa chốt bản phân công."}
            </div>
            {isFinalized && (
              <div style={{ marginTop: 10, border: "1px solid #E2E8F0", borderRadius: 10, padding: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}><Mail size={15} /> Hàng đợi email</div>
                <div style={{ fontSize: 13, color: "#64748B" }}>Đã gửi: 95 · Retry: {emailFailed} · Timeout SMTP: {emailFailed}</div>
              </div>
            )}
          </section>
        </div>
      )}

      {activeStage === "publish" && (
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          <section style={baseCard}>
            <h2 style={{ marginTop: 0, display: "flex", gap: 8, alignItems: "center" }}>
              <Download size={18} color="#1D4ED8" /> Hậu bảo vệ và xuất hồ sơ
            </h2>
            <div style={{ border: "1px solid #E2E8F0", borderRadius: 10, padding: 10, marginBottom: 10 }}>
              <div style={{ fontWeight: 700 }}>SV220101 - Ứng dụng AI trong phân loại văn bản</div>
              <div style={{ fontSize: 13, color: "#64748B" }}>Xác nhận: GVHD ✓ · TK ✓ · CT chờ duyệt</div>
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={exportMinutes} onChange={(event) => setExportMinutes(event.target.checked)} />
                Xuất biên bản
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={exportScores} onChange={(event) => setExportScores(event.target.checked)} />
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
              <button type="button" className="committee-ghost-btn" onClick={exportForm1Excel}>
                <FileSpreadsheet size={15} /> Xuất mẫu báo cáo Form 1 (Excel)
              </button>
              <button type="button" className="committee-ghost-btn" onClick={exportForm1Pdf}>
                <Download size={15} /> Xuất mẫu báo cáo Form 1 (PDF)
              </button>
              <button type="button" className="committee-ghost-btn" onClick={exportFinalTermExcel}>
                <FileSpreadsheet size={15} /> Xuất báo cáo cuối kỳ theo hội đồng (Excel)
              </button>
              <button type="button" className="committee-ghost-btn" onClick={exportFinalTermPdf}>
                <Download size={15} /> Xuất báo cáo cuối kỳ theo hội đồng (PDF)
              </button>
            </div>

            <div style={{ marginTop: 10, border: "1px solid #E2E8F0", borderRadius: 10, padding: 10 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Nhật ký batch export</div>
              {MOCK_EXPORT_JOBS.map((job: ExportJob) => (
                <div key={job.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span>{job.id} · {job.scope}</span>
                  <span style={{ color: job.status === "Done" ? "#166534" : job.status === "Running" ? "#1D4ED8" : "#B45309" }}>
                    {job.status} · {job.duration}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section style={baseCard}>
            <h2 style={{ marginTop: 0, display: "flex", gap: 8, alignItems: "center" }}>
              <Building2 size={18} color="#1D4ED8" /> Công bố điểm và analytics
            </h2>
            <button
              type="button"
              onClick={publishAllScores}
              disabled={!isFinalized}
              className="committee-primary-btn"
            >
              Công bố điểm đồng loạt
            </button>
            <div style={{ marginTop: 8, color: published ? "#166534" : "#64748B" }}>
              {published ? "Điểm đã được publish." : "Chưa công bố điểm."}
            </div>

            <div style={{ marginTop: 12, border: "1px solid #E2E8F0", borderRadius: 10, padding: 10 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Lịch sử công bố điểm</div>
              {MOCK_PUBLISH_BATCHES.map((batch: PublishBatch) => (
                <div key={batch.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span>{batch.id} · {batch.term} · {batch.totalStudents} SV</span>
                  <span style={{ color: batch.status === "Published" ? "#166534" : "#B45309" }}>
                    {batch.status} {batch.publishedAt !== "--" ? `· ${batch.publishedAt}` : ""}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 10, borderRadius: 10, background: "#F8FAFC", border: "1px solid #E2E8F0", padding: 10 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Kết nối 3 vai trò</div>
              <div style={{ fontSize: 13, color: "#334155" }}>
                Admin chốt đợt, Giảng viên thao tác trong ca bảo vệ, Sinh viên nhận kết quả và nộp chỉnh sửa theo cùng một luồng nghiệp vụ.
              </div>
            </div>

            <div style={{ marginTop: 12, border: "1px solid #E2E8F0", borderRadius: 12, padding: 12, background: "#FFFFFF" }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Dashboard thống kê sau chốt điểm</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8, marginBottom: 10 }}>
                <div style={{ border: "1px solid #DBEAFE", borderRadius: 10, padding: 8 }}>
                  <div style={{ fontSize: 12, color: "#64748B" }}>Tổng sinh viên</div>
                  <div style={{ fontWeight: 800, fontSize: 22 }}>{scoreOverview.totalStudents}</div>
                </div>
                <div style={{ border: "1px solid #DBEAFE", borderRadius: 10, padding: 8 }}>
                  <div style={{ fontSize: 12, color: "#64748B" }}>Điểm trung bình</div>
                  <div style={{ fontWeight: 800, fontSize: 22 }}>{scoreOverview.average}</div>
                </div>
                <div style={{ border: "1px solid #DBEAFE", borderRadius: 10, padding: 8 }}>
                  <div style={{ fontSize: 12, color: "#64748B" }}>Tỷ lệ đạt</div>
                  <div style={{ fontWeight: 800, fontSize: 22 }}>{scoreOverview.passRate}%</div>
                </div>
                <div style={{ border: "1px solid #DBEAFE", borderRadius: 10, padding: 8 }}>
                  <div style={{ fontSize: 12, color: "#64748B" }}>Điểm cao nhất/thấp nhất</div>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>
                    {scoreOverview.highest?.score ?? "-"} / {scoreOverview.lowest?.score ?? "-"}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 12, color: "#334155", marginBottom: 8 }}>
                Cao nhất: {scoreOverview.highest ? `${scoreOverview.highest.studentCode} - ${scoreOverview.highest.studentName}` : "-"}
              </div>
              <div style={{ fontSize: 12, color: "#334155", marginBottom: 10 }}>
                Thấp nhất: {scoreOverview.lowest ? `${scoreOverview.lowest.studentCode} - ${scoreOverview.lowest.studentName}` : "-"}
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                {scoreDistribution.map((item) => (
                  <div key={item.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span>{item.label}</span>
                      <span>{item.count} SV · {item.pct}%</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 999, background: "#E2E8F0", overflow: "hidden" }}>
                      <div style={{ width: `${item.pct}%`, height: "100%", background: item.color }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 12, maxHeight: 220, overflow: "auto", border: "1px solid #E2E8F0", borderRadius: 10 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead style={{ background: "#F8FAFC" }}>
                    <tr>
                      <th style={{ textAlign: "left", padding: 8 }}>Hội đồng</th>
                      <th style={{ textAlign: "left", padding: 8 }}>Phòng</th>
                      <th style={{ textAlign: "left", padding: 8 }}>Số SV</th>
                      <th style={{ textAlign: "left", padding: 8 }}>TB</th>
                      <th style={{ textAlign: "left", padding: 8 }}>Cao nhất</th>
                      <th style={{ textAlign: "left", padding: 8 }}>Thấp nhất</th>
                    </tr>
                  </thead>
                  <tbody>
                    {councilScoreSummaries.map((item) => (
                      <tr key={`score-summary-${item.id}`}>
                        <td style={{ padding: 8, borderTop: "1px solid #E2E8F0", fontWeight: 700 }}>{item.id}</td>
                        <td style={{ padding: 8, borderTop: "1px solid #E2E8F0" }}>{item.room}</td>
                        <td style={{ padding: 8, borderTop: "1px solid #E2E8F0" }}>{item.studentCount}</td>
                        <td style={{ padding: 8, borderTop: "1px solid #E2E8F0" }}>{item.avg}</td>
                        <td style={{ padding: 8, borderTop: "1px solid #E2E8F0" }}>{item.max}</td>
                        <td style={{ padding: 8, borderTop: "1px solid #E2E8F0" }}>{item.min}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      )}

      {manualMode && (
        <div className="committee-modal-overlay" onClick={closeManualModal}>
          <div className="committee-modal" onClick={(event) => event.stopPropagation()}>
            <div className="committee-modal-head">
              <div>
                <div className="committee-modal-title">
                  {manualMode === "create"
                    ? "Thêm hội đồng"
                    : manualReadOnly
                      ? `Chi tiết hội đồng ${selectedCouncilId}`
                      : `Chỉnh sửa hội đồng ${selectedCouncilId}`}
                </div>
                <div className="committee-modal-sub">
                  Biểu mẫu thống nhất: thông tin hội đồng, đề tài áp dụng, thành viên, sinh viên và giảng viên hướng dẫn.
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="committee-ghost-btn committee-icon-btn"
                  onClick={closeManualModal}
                  title="Đóng"
                  aria-label="Đóng"
                >
                  <X size={16} />
                </button>
                {manualReadOnly ? (
                  <button
                    type="button"
                    className="committee-primary-btn committee-icon-btn"
                    onClick={() => setManualReadOnly(false)}
                    title="Chuyển sang chỉnh sửa"
                    aria-label="Chuyển sang chỉnh sửa"
                  >
                    <Pencil size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="committee-accent-btn committee-icon-btn"
                    onClick={saveManualCouncil}
                    title={manualMode === "create" ? "Lưu hội đồng mới" : "Lưu cập nhật"}
                    aria-label={manualMode === "create" ? "Lưu hội đồng mới" : "Lưu cập nhật"}
                  >
                    <Save size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="committee-modal-body">
              <div className="committee-modal-grid-3">
                <label className="committee-modal-card">
                  <span className="committee-modal-label">Mã hội đồng</span>
                  {manualReadOnly ? (
                    <div className="committee-modal-value">{manualId || "-"}</div>
                  ) : (
                    <input
                      value={manualId}
                      onChange={(event) => setManualId(event.target.value)}
                      placeholder="VD: HD-2026-08"
                    />
                  )}
                </label>

                <label className="committee-modal-card">
                  <span className="committee-modal-label">Phòng</span>
                  {manualReadOnly ? (
                    <div className="committee-modal-value">{manualRoom || "-"}</div>
                  ) : (
                    <select value={manualRoom} onChange={(event) => setManualRoom(event.target.value)}>
                      {ROOMS.map((room) => (
                        <option key={room} value={room}>{room}</option>
                      ))}
                    </select>
                  )}
                </label>

                <label className="committee-modal-card">
                  <span className="committee-modal-label">Lịch hội đồng</span>
                  <div className="committee-modal-value">Cả ngày (2 buổi: Sáng + Chiều)</div>
                </label>
              </div>

              <div className="committee-modal-card">
                <span className="committee-modal-label">Tags hội đồng</span>
                {manualReadOnly ? (
                  <div className="committee-modal-value">{manualCouncilTags.join(", ") || "-"}</div>
                ) : (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {allTags.map((tag: string) => (
                      <button
                        key={`manual-tag-${tag}`}
                        type="button"
                        className="committee-ghost-btn"
                        onClick={() => toggleManualCouncilTag(tag)}
                        style={{
                          minHeight: 34,
                          padding: "6px 10px",
                          borderColor: manualCouncilTags.includes(tag) ? "#1D4ED8" : "#CBD5E1",
                          background: manualCouncilTags.includes(tag) ? "#DBEAFE" : "#fff",
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="committee-modal-grid-3">
                {(["CT", "TK", "PB", "UV"] as CouncilRole[]).map((role: CouncilRole) => {
                  const member = manualMembers.find((item: CouncilMember) => item.role === role);
                  return (
                    <label key={role} className="committee-modal-card">
                      <span className="committee-modal-label">Vai trò {role}</span>
                      {manualReadOnly ? (
                        <div className="committee-modal-value">
                          {member?.lecturerCode ? `${member.lecturerCode} - ${member.lecturerName}` : "-"}
                        </div>
                      ) : (
                        <select
                          value={member?.lecturerCode ?? ""}
                          onChange={(event) => updateManualMember(role, event.target.value)}
                        >
                          <option value="">Chọn giảng viên</option>
                          {MOCK_CAPABILITIES.map((lecturer: LecturerCapability) => (
                            <option key={`${role}-${lecturer.lecturerCode}`} value={lecturer.lecturerCode}>
                              {lecturer.lecturerCode} - {lecturer.lecturerName}
                            </option>
                          ))}
                        </select>
                      )}
                    </label>
                  );
                })}
              </div>

              <div className="committee-modal-card">
                <span className="committee-modal-label">Danh sách đề tài theo 2 buổi (mỗi buổi 4 đề tài)</span>
                {selectedCouncilStudents.length ? (
                  <table className="committee-supervisor-table">
                    <thead>
                      <tr>
                        <th>Buổi</th>
                        <th>MSSV</th>
                        <th>Sinh viên</th>
                        <th>Đề tài</th>
                        <th>GVHD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCouncilStudents.map((item) => (
                        <tr key={`${item.sessionLabel}-${item.studentCode}`}>
                          <td>{item.sessionLabel}</td>
                          <td>{item.studentCode}</td>
                          <td>{item.studentName}</td>
                          <td>{item.topicTitle}</td>
                          <td>{item.supervisorName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="committee-modal-value">Không đủ dữ liệu đề tài theo tags đã chọn.</div>
                )}
              </div>
            </div>

            {manualError && <div style={{ marginTop: 10, color: "#B91C1C", fontSize: 13, border: "1px solid #FECACA", background: "#FEF2F2", borderRadius: 10, padding: "8px 10px" }}>{manualError}</div>}
          </div>
        </div>
      )}

      <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ color: "#64748B", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          <Clock3 size={14} /> Giao diện mô phỏng sẵn sàng tích hợp API backend.
        </div>
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
