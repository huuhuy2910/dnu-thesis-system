import React, { useState } from "react";
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  Trash2,
  Filter,
} from "lucide-react";

interface Notification {
  id: number;
  title: string;
  message: string;
  date: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
}

const LecturerNotifications: React.FC = () => {
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: "Đề tài mới chờ phê duyệt",
      message:
        'Sinh viên Nguyễn Văn A vừa đăng ký đề tài "Hệ thống quản lý khóa luận tốt nghiệp thông minh". Vui lòng xem xét và phê duyệt trong vòng 3 ngày làm việc.',
      date: "2025-10-15T09:00:00Z",
      type: "warning",
      isRead: false,
    },
    {
      id: 2,
      title: "Báo cáo tiến độ cần chấm điểm",
      message:
        "Bạn có 5 sinh viên đã nộp báo cáo tiến độ lần 2. Hạn chấm điểm là 20/10/2025. Vui lòng hoàn thành việc chấm điểm đúng hạn.",
      date: "2025-10-14T15:30:00Z",
      type: "warning",
      isRead: false,
    },
    {
      id: 3,
      title: "Lịch họp hội đồng bảo vệ",
      message:
        "Bạn được phân công làm ủy viên hội đồng bảo vệ đồ án vào ngày 25/10/2025 lúc 13:30 tại phòng A201. Vui lòng chuẩn bị tài liệu và có mặt đúng giờ.",
      date: "2025-10-13T11:20:00Z",
      type: "info",
      isRead: false,
    },
    {
      id: 4,
      title: "Thông báo từ ban quản lý",
      message:
        "Theo yêu cầu của ban quản lý khoa, tất cả giảng viên hướng dẫn cần cập nhật điểm số cuối kỳ cho sinh viên trước ngày 30/10/2025.",
      date: "2025-10-12T08:45:00Z",
      type: "error",
      isRead: false,
    },
    {
      id: 5,
      title: "Sinh viên hoàn thành mốc quan trọng",
      message:
        'Sinh viên Trần Thị B đã hoàn thành mốc "Nộp báo cáo tiến độ lần 1". Nhận xét của bạn: "Báo cáo chi tiết, tiến độ tốt. Cần bổ sung thêm phần tài liệu tham khảo."',
      date: "2025-10-11T14:15:00Z",
      type: "success",
      isRead: true,
    },
    {
      id: 6,
      title: "Nhắc nhở: Chấm điểm báo cáo",
      message:
        "Bạn còn 3 báo cáo tiến độ chưa chấm điểm. Hạn cuối là 18/10/2025. Vui lòng hoàn thành để sinh viên có thể tiếp tục thực hiện.",
      date: "2025-10-10T10:30:00Z",
      type: "warning",
      isRead: true,
    },
    {
      id: 7,
      title: "Cập nhật từ hệ thống",
      message:
        "Hệ thống đã được nâng cấp với tính năng mới: Theo dõi tiến độ sinh viên real-time. Bạn có thể xem chi tiết tiến độ của từng sinh viên trong mục 'Sinh viên hướng dẫn'.",
      date: "2025-10-09T16:20:00Z",
      type: "info",
      isRead: true,
    },
    {
      id: 8,
      title: "Lịch bảo vệ đồ án",
      message:
        "Lịch bảo vệ đồ án tốt nghiệp kỳ II/2025 đã được công bố. Bạn có 4 sinh viên sẽ bảo vệ trong tuần tới. Vui lòng xem chi tiết lịch trong mục 'Lịch chấm bảo vệ'.",
      date: "2025-10-08T13:45:00Z",
      type: "info",
      isRead: true,
    },
    {
      id: 9,
      title: "Phản hồi từ sinh viên",
      message:
        'Sinh viên Lê Văn C đã phản hồi nhận xét của bạn về báo cáo tiến độ: "Cảm ơn thầy đã góp ý chi tiết. Em sẽ bổ sung thêm phần phân tích dữ liệu như thầy hướng dẫn."',
      date: "2025-10-07T09:15:00Z",
      type: "success",
      isRead: true,
    },
    {
      id: 10,
      title: "Thông báo khẩn cấp: Hệ thống bảo trì",
      message:
        "Hệ thống sẽ tạm ngừng hoạt động để bảo trì vào lúc 22:00 ngày 20/10/2025. Thời gian bảo trì dự kiến 2 giờ. Vui lòng lưu lại công việc đang thực hiện.",
      date: "2025-10-06T17:30:00Z",
      type: "error",
      isRead: true,
    },
    {
      id: 11,
      title: "Thống kê hướng dẫn",
      message:
        "Trong tháng qua, bạn đã hướng dẫn 8 sinh viên với 95% hoàn thành đúng tiến độ. Trung bình điểm số các sinh viên là 8.2/10. Chi tiết xem trong báo cáo tháng.",
      date: "2025-10-05T12:00:00Z",
      type: "info",
      isRead: true,
    },
    {
      id: 12,
      title: "Yêu cầu bổ sung tài liệu",
      message:
        'Sinh viên Phạm Thị D cần bổ sung tài liệu tham khảo cho đề tài "Ứng dụng AI trong giáo dục". Vui lòng hướng dẫn sinh viên bổ sung thêm 5-7 nguồn tài liệu uy tín.',
      date: "2025-10-04T11:45:00Z",
      type: "warning",
      isRead: true,
    },
  ]);

  const markAsRead = (id: number) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(
      notifications.map((notif) => ({ ...notif, isRead: true }))
    );
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter((notif) => notif.id !== id));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle size={24} color="#22c55e" />;
      case "warning":
        return <AlertCircle size={24} color="#f59e0b" />;
      case "error":
        return <AlertCircle size={24} color="#ef4444" />;
      default:
        return <Info size={24} color="#3b82f6" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return { bg: "#dcfce7", border: "#22c55e" };
      case "warning":
        return { bg: "#fef3c7", border: "#f59e0b" };
      case "error":
        return { bg: "#fee2e2", border: "#ef4444" };
      default:
        return { bg: "#dbeafe", border: "#3b82f6" };
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "unread") return !notif.isRead;
    if (filter === "read") return notif.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          marginBottom: "32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#1a1a1a",
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <Bell size={32} color="#f37021" />
            Thông báo
            {unreadCount > 0 && (
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  padding: "4px 12px",
                  backgroundColor: "#f37021",
                  color: "#fff",
                  borderRadius: "20px",
                }}
              >
                {unreadCount} mới
              </span>
            )}
          </h1>
          <p style={{ fontSize: "14px", color: "#666" }}>
            Xem tất cả thông báo liên quan đến công việc hướng dẫn của bạn
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            style={{
              padding: "10px 16px",
              backgroundColor: "#f37021",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#d95f1a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#f37021";
            }}
          >
            Đánh dấu đã đọc tất cả
          </button>
        )}
      </div>

      {/* Filter */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
          background: "#fff",
          padding: "16px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#666",
            fontWeight: "600",
          }}
        >
          <Filter size={18} />
          Lọc:
        </div>
        {[
          { value: "all", label: "Tất cả" },
          { value: "unread", label: "Chưa đọc" },
          { value: "read", label: "Đã đọc" },
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => setFilter(item.value as "all" | "unread" | "read")}
            style={{
              padding: "8px 16px",
              backgroundColor: filter === item.value ? "#f37021" : "#f3f4f6",
              color: filter === item.value ? "#fff" : "#666",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {filteredNotifications.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              background: "#fff",
              borderRadius: "12px",
              border: "2px dashed #e5e7eb",
            }}
          >
            <Bell size={48} color="#ccc" style={{ marginBottom: "16px" }} />
            <p style={{ fontSize: "16px", color: "#666" }}>
              {filter === "unread"
                ? "Không có thông báo chưa đọc"
                : filter === "read"
                ? "Không có thông báo đã đọc"
                : "Không có thông báo nào"}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const colors = getTypeColor(notif.type);
            return (
              <div
                key={notif.id}
                style={{
                  padding: "20px",
                  background: notif.isRead ? "#fff" : colors.bg,
                  border: `2px solid ${
                    notif.isRead ? "#e5e7eb" : colors.border
                  }`,
                  borderRadius: "12px",
                  transition: "all 0.3s ease",
                  opacity: notif.isRead ? 0.8 : 1,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ flexShrink: 0 }}>{getTypeIcon(notif.type)}</div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "8px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "#1a1a1a",
                        }}
                      >
                        {notif.title}
                        {!notif.isRead && (
                          <span
                            style={{
                              display: "inline-block",
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              backgroundColor: "#f37021",
                              marginLeft: "8px",
                            }}
                          />
                        )}
                      </h3>
                      <button
                        onClick={() => deleteNotification(notif.id)}
                        style={{
                          padding: "6px",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "#999",
                          transition: "color 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#ef4444";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "#999";
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <p
                      style={{
                        fontSize: "14px",
                        color: "#666",
                        lineHeight: "1.6",
                        marginBottom: "12px",
                      }}
                    >
                      {notif.message}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontSize: "13px", color: "#999" }}>
                        {new Date(notif.date).toLocaleString("vi-VN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      {!notif.isRead && (
                        <button
                          onClick={() => markAsRead(notif.id)}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "#f37021",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#d95f1a";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#f37021";
                          }}
                        >
                          Đánh dấu đã đọc
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LecturerNotifications;
