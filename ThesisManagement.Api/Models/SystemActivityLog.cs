using System;

namespace ThesisManagement.Api.Models
{
    /// <summary>
    /// Bảng ghi log hoạt động hệ thống - theo dõi tất cả thao tác quan trọng
    /// </summary>
    public class SystemActivityLog
    {
        /// <summary>
        /// ID tự tăng của log
        /// </summary>
        public int LogID { get; set; }

        /// <summary>
        /// Tên entity/bảng bị tác động (VD: "StudentProfiles", "ProgressSubmissions", "Topics")
        /// </summary>
        public string? EntityName { get; set; }

        /// <summary>
        /// ID hoặc Code của bản ghi liên quan (VD: "STU20231001", "TOP20231215001")
        /// </summary>
        public string? EntityID { get; set; }

        /// <summary>
        /// Loại hành động thực hiện:
        /// - CREATE: Tạo mới bản ghi
        /// - UPDATE: Cập nhật bản ghi
        /// - DELETE: Xóa bản ghi
        /// - LOGIN: Đăng nhập hệ thống
        /// - LOGOUT: Đăng xuất hệ thống
        /// - DOWNLOAD: Tải file xuống
        /// - UPLOAD: Tải file lên
        /// - APPROVE: Phê duyệt
        /// - REJECT: Từ chối
        /// - SUBMIT: Nộp bài
        /// - ASSIGN: Phân công
        /// - EVALUATE: Đánh giá
        /// </summary>
        public string ActionType { get; set; } = null!;

        /// <summary>
        /// Mô tả chi tiết hành động (VD: "Cập nhật điểm bảo vệ từ 7.5 lên 8.0", "Sinh viên A nộp bài lần 3")
        /// </summary>
        public string? ActionDescription { get; set; }

        /// <summary>
        /// Giá trị cũ trước khi thay đổi (JSON hoặc text) - dùng cho UPDATE/DELETE
        /// </summary>
        public string? OldValue { get; set; }

        /// <summary>
        /// Giá trị mới sau khi thay đổi (JSON hoặc text) - dùng cho CREATE/UPDATE
        /// </summary>
        public string? NewValue { get; set; }

        /// <summary>
        /// ID của người thực hiện hành động
        /// </summary>
        public int? UserID { get; set; }

        /// <summary>
        /// Mã người dùng thực hiện (VD: "LEC001", "STU20230001", "ADMIN")
        /// </summary>
        public string? UserCode { get; set; }

        /// <summary>
        /// Vai trò của người thực hiện:
        /// - Student: Sinh viên
        /// - Lecturer: Giảng viên
        /// - Admin: Quản trị viên
        /// - System: Hệ thống tự động
        /// </summary>
        public string? UserRole { get; set; }

        /// <summary>
        /// Địa chỉ IP của người thực hiện (hỗ trợ IPv4 và IPv6)
        /// </summary>
        public string? IPAddress { get; set; }

        /// <summary>
        /// Thông tin thiết bị và trình duyệt (VD: "Chrome 120 on Windows 10", "Safari on iPhone")
        /// </summary>
        public string? DeviceInfo { get; set; }

        /// <summary>
        /// Module/phân hệ liên quan:
        /// - Authentication: Xác thực đăng nhập
        /// - Topic: Quản lý đề tài
        /// - Milestone: Quản lý tiến độ
        /// - Submission: Nộp báo cáo
        /// - Defense: Bảo vệ đề tài
        /// - Committee: Hội đồng
        /// - User: Quản lý người dùng
        /// - Department: Quản lý khoa
        /// - Catalog: Danh mục đề tài
        /// </summary>
        public string? Module { get; set; }

        /// <summary>
        /// Thời điểm thực hiện hành động (UTC)
        /// </summary>
        public DateTime PerformedAt { get; set; }

        /// <summary>
        /// Trạng thái thực hiện:
        /// - SUCCESS: Thành công
        /// - FAILED: Thất bại
        /// - PENDING: Đang chờ xử lý
        /// - PARTIAL: Thành công một phần
        /// </summary>
        public string? Status { get; set; }

        /// <summary>
        /// Mã bản ghi liên quan khác (VD: SubmissionCode khi cập nhật Milestone, TopicCode khi assign Defense)
        /// </summary>
        public string? RelatedRecordCode { get; set; }

        /// <summary>
        /// Ghi chú bổ sung, lý do thực hiện, hoặc thông tin debug
        /// </summary>
        public string? Comment { get; set; }

        // Navigation properties
        public User? User { get; set; }
    }
}
