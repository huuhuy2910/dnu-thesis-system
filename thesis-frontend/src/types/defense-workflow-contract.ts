export type SessionCode = "MORNING" | "AFTERNOON";

export type UcErrorCode =
  | "UC1.1-SYNC_TIMEOUT"
  | "UC1.4-TIME_CONFLICT"
  | "UC1.4-NO_ROOM"
  | "UC2.1-MISSING_TAGS"
  | "UC2.2-GENERATE_BLOCKED"
  | "UC2.3-MANUAL_EMPTY_ID"
  | "UC2.3-MANUAL_TOPIC_COUNT"
  | "UC2.3-MANUAL_MEMBER_COUNT"
  | "UC2.3-DUPLICATE_MEMBER"
  | "UC2.3-SUPERVISOR_CONFLICT"
  | "UC2.3-DUPLICATE_ID"
  | "UC2.4-CONCURRENCY_REQUIRED"
  | "UC2.5-FINALIZE_BLOCKED"
  | "UC2.5-FINALIZE_EMPTY"
  | "UC3.2-SCORE_INVALID"
  | "UC3.3-SESSION_LOCKED"
  | "UC3.4-CHAIR_ONLY"
  | "UC4.1-REVISION_EMPTY"
  | "UC4.2-REJECT_REASON_REQUIRED"
  | "UC4.4-PUBLISH_BLOCKED";

const UC_ERROR_MESSAGES: Record<UcErrorCode, string> = {
  "UC1.1-SYNC_TIMEOUT": "Đồng bộ dữ liệu bị timeout, vui lòng thử lại.",
  "UC1.4-TIME_CONFLICT": "Khung giờ sáng và chiều đang giao nhau.",
  "UC1.4-NO_ROOM": "Cần chọn ít nhất một phòng trước khi lưu cấu hình.",
  "UC2.1-MISSING_TAGS": "Cần chọn tối thiểu một tag trước khi xác nhận cấu hình hội đồng.",
  "UC2.2-GENERATE_BLOCKED": "Chưa đủ điều kiện generate hội đồng (sync/config/lock/council-config).",
  "UC2.3-MANUAL_EMPTY_ID": "Mã hội đồng không được để trống.",
  "UC2.3-MANUAL_TOPIC_COUNT": "Mỗi hội đồng phải đủ 4 đề tài MORNING và 4 đề tài AFTERNOON.",
  "UC2.3-MANUAL_MEMBER_COUNT": "Hội đồng phải đủ 4 vai trò CT, TK, PB, UV.",
  "UC2.3-DUPLICATE_MEMBER": "Một giảng viên không thể giữ nhiều vai trò trong cùng hội đồng.",
  "UC2.3-SUPERVISOR_CONFLICT": "GVHD không được tham gia hội đồng có sinh viên do mình hướng dẫn.",
  "UC2.3-DUPLICATE_ID": "Mã hội đồng đã tồn tại.",
  "UC2.4-CONCURRENCY_REQUIRED": "Thiếu concurrencyToken, không thể cập nhật an toàn.",
  "UC2.5-FINALIZE_BLOCKED": "Không thể finalize khi còn warning chưa được chấp nhận.",
  "UC2.5-FINALIZE_EMPTY": "Không thể finalize khi chưa có hội đồng.",
  "UC3.2-SCORE_INVALID": "Điểm phải nằm trong khoảng 0-10.",
  "UC3.3-SESSION_LOCKED": "Phiên đã khóa, không thể cập nhật điểm.",
  "UC3.4-CHAIR_ONLY": "Chỉ Chair mới được thao tác chức năng này.",
  "UC4.1-REVISION_EMPTY": "Cần nhập nội dung chỉnh sửa và đính kèm file.",
  "UC4.2-REJECT_REASON_REQUIRED": "Từ chối revision bắt buộc có lý do.",
  "UC4.4-PUBLISH_BLOCKED": "Chỉ được publish khi đợt đã finalize.",
};

export function ucError(code: UcErrorCode, detail?: string): string {
  const base = UC_ERROR_MESSAGES[code];
  return detail ? `[${code}] ${base} ${detail}` : `[${code}] ${base}`;
}

export function createIdempotencyKey(periodId: string, action: string): string {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${periodId}-${action}-${Date.now()}-${random}`;
}

export function createConcurrencyToken(scope: string): string {
  const random = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `${scope}-${Date.now()}-${random}`;
}

export type WorkflowActionTrace = {
  action: string;
  periodId: string;
  idempotencyKey: string;
  concurrencyToken?: string;
  note?: string;
  at: string;
};

export interface DefenseTermStateDto {
  defenseTermId: string;
  name: string;
  status: "Draft" | "Ready" | "Finalized" | "Published";
  rooms: string[];
  morningStart: string;
  afternoonStart: string;
  softMaxCapacity: number;
  lecturerCapabilitiesLocked: boolean;
  councilConfigConfirmed: boolean;
  finalized: boolean;
  scoresPublished: boolean;
  councilCount: number;
}

export interface CommitteeMemberDto {
  role: "CT" | "TK" | "PB" | "UV";
  lecturerCode: string;
}

export interface CommitteeDraftDto {
  committeeCode: string;
  room: string;
  session: SessionCode;
  councilTags: string[];
  morningStudentCodes: string[];
  afternoonStudentCodes: string[];
  members: CommitteeMemberDto[];
  concurrencyToken: string;
}

export interface DefenseRevisionDto {
  assignmentId: string;
  revisedContent: string;
  revisionFileUrl?: string;
  finalStatus: "Pending" | "Approved" | "Rejected";
  rejectReason?: string;
}
