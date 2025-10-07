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

const Notifications: React.FC = () => {
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: "Đề tài đã được phê duyệt",
      message:
        'Đề tài "Hệ gợi ý khóa học cá nhân hóa" của bạn đã được phê duyệt bởi giảng viên hướng dẫn TS. Nguyễn Văn A. Vui lòng bắt đầu thực hiện theo kế hoạch.',
      date: "2025-04-15T10:30:00",
      type: "success",
      isRead: false,
    },
    {
      id: 2,
      title: "Nhắc nhở: Nộp báo cáo tiến độ",
      message:
        "Bạn cần nộp báo cáo tiến độ lần 2 trước ngày 15/04/2025. Hiện tại còn 3 ngày nữa đến hạn.",
      date: "2025-04-12T09:00:00",
      type: "warning",
      isRead: false,
    },
    {
      id: 3,
      title: "Lịch họp hướng dẫn",
      message:
        "Giảng viên TS. Nguyễn Văn A đã đặt lịch họp hướng dẫn vào ngày 20/04/2025 lúc 14:00 tại phòng B102. Vui lòng chuẩn bị tài liệu và có mặt đúng giờ.",
      date: "2025-04-10T15:20:00",
      type: "info",
      isRead: true,
    },
    {
      id: 4,
      title: "Thông báo: Lịch bảo vệ",
      message:
        'Lịch bảo vệ đồ án tốt nghiệp đã được công bố. Bạn sẽ bảo vệ vào ngày 10/06/2025 lúc 09:00 tại phòng A201. Vui lòng xem chi tiết trong mục "Lịch bảo vệ".',
      date: "2025-04-08T11:00:00",
      type: "info",
      isRead: true,
    },
    {
      id: 5,
      title: "Nhận xét báo cáo",
      message:
        'Giảng viên đã nhận xét báo cáo tiến độ lần 1 của bạn. Nhận xét: "Báo cáo tốt, tiến độ đúng kế hoạch. Tiếp tục duy trì!"',
      date: "2025-03-01T14:30:00",
      type: "success",
      isRead: true,
    },
    {
      id: 6,
      title: "Cảnh báo: Quá hạn nộp tài liệu",
      message:
        "Bạn chưa nộp tài liệu bổ sung theo yêu cầu của giảng viên. Vui lòng liên hệ với giảng viên hướng dẫn để được hỗ trợ.",
      date: "2025-02-25T08:00:00",
      type: "error",
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
            Xem tất cả thông báo liên quan đến đồ án của bạn
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

export default Notifications;
