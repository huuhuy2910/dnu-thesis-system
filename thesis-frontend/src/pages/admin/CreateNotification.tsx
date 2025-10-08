import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  Send,
  Users,
  User,
  AlertTriangle,
  Info,
  CheckCircle,
  X,
} from "lucide-react";

// Types for notification
interface NotificationRecipient {
  id: string;
  name: string;
  type: "student" | "lecturer" | "admin";
  code: string;
}

interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  content: string;
  type: "info" | "warning" | "success" | "error";
}

// Mock data for recipients
const mockRecipients: NotificationRecipient[] = [
  { id: "1", name: "Nguyễn Văn An", type: "student", code: "SV001" },
  { id: "2", name: "Trần Thị Bình", type: "student", code: "SV002" },
  { id: "3", name: "Lê Văn Cường", type: "lecturer", code: "GV001" },
  { id: "4", name: "Phạm Thị Dung", type: "lecturer", code: "GV002" },
  { id: "5", name: "Hoàng Văn Em", type: "admin", code: "ADM001" },
];

// Mock notification templates
const notificationTemplates: NotificationTemplate[] = [
  {
    id: "1",
    name: "Thông báo deadline nộp đề tài",
    title: "Deadline nộp đề tài luận văn",
    content:
      "Kính gửi sinh viên,\n\nNhắc nhở về deadline nộp đề tài luận văn vào ngày [ngày]. Vui lòng hoàn thành và nộp đúng hạn.\n\nTrân trọng,\nBan quản lý",
    type: "warning",
  },
  {
    id: "2",
    name: "Thông báo lịch bảo vệ",
    title: "Lịch bảo vệ luận văn",
    content:
      "Kính gửi sinh viên và giảng viên,\n\nThông báo lịch bảo vệ luận văn của sinh viên [tên sinh viên] sẽ diễn ra vào [thời gian] tại [địa điểm].\n\nTrân trọng,\nBan quản lý",
    type: "info",
  },
  {
    id: "3",
    name: "Thông báo kết quả bảo vệ",
    title: "Kết quả bảo vệ luận văn",
    content:
      "Kính gửi sinh viên,\n\nKết quả bảo vệ luận văn của bạn là [điểm]. Chi tiết sẽ được thông báo sau.\n\nTrân trọng,\nBan quản lý",
    type: "success",
  },
];

const CreateNotification: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "info" as "info" | "warning" | "success" | "error",
    priority: "normal" as "low" | "normal" | "high",
    recipientType: "all" as
      | "all"
      | "students"
      | "lecturers"
      | "admins"
      | "specific",
    selectedRecipients: [] as string[],
    sendEmail: true,
    sendPush: true,
    scheduleSend: false,
    scheduledDate: "",
    scheduledTime: "",
  });

  const [showPreview, setShowPreview] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRecipientToggle = (recipientId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedRecipients: prev.selectedRecipients.includes(recipientId)
        ? prev.selectedRecipients.filter((id) => id !== recipientId)
        : [...prev.selectedRecipients, recipientId],
    }));
  };

  const handleTemplateSelect = (template: NotificationTemplate) => {
    setFormData((prev) => ({
      ...prev,
      title: template.title,
      content: template.content,
      type: template.type,
    }));
    setShowTemplates(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      console.log("Notification created:", formData);
      setIsSubmitting(false);
      navigate("/admin/notifications");
    }, 2000);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "info":
        return <Info size={20} color="#3B82F6" />;
      case "warning":
        return <AlertTriangle size={20} color="#F59E0B" />;
      case "success":
        return <CheckCircle size={20} color="#10B981" />;
      case "error":
        return <X size={20} color="#EF4444" />;
      default:
        return <Info size={20} color="#6B7280" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "info":
        return "#3B82F6";
      case "warning":
        return "#F59E0B";
      case "success":
        return "#10B981";
      case "error":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const filteredRecipients = mockRecipients.filter((recipient) => {
    if (formData.recipientType === "all") return true;
    if (formData.recipientType === "students")
      return recipient.type === "student";
    if (formData.recipientType === "lecturers")
      return recipient.type === "lecturer";
    if (formData.recipientType === "admins") return recipient.type === "admin";
    return formData.selectedRecipients.includes(recipient.id);
  });

  return (
    <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
          background: "#FFFFFF",
          padding: "24px",
          borderRadius: "12px",
          border: "1px solid #E5E7EB",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div>
          <button
            onClick={() => navigate("/admin")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              background: "#F3F4F6",
              color: "#374151",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              marginBottom: "16px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#E5E7EB";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#F3F4F6";
            }}
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>

          <h1
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#111827",
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <Bell size={32} color="#4F46E5" />
            Tạo thông báo mới
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "#6B7280",
              margin: 0,
            }}
          >
            Tạo và gửi thông báo đến sinh viên, giảng viên và quản trị viên
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => setShowTemplates(true)}
            style={{
              padding: "12px 20px",
              background: "#F3F4F6",
              color: "#374151",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#E5E7EB";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#F3F4F6";
            }}
          >
            Sử dụng mẫu
          </button>
          <button
            onClick={() => setShowPreview(true)}
            style={{
              padding: "12px 20px",
              background: "#4F46E5",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#4338CA";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#4F46E5";
            }}
          >
            Xem trước
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "24px" }}>
        {/* Basic Information */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "12px",
            padding: "24px",
            border: "1px solid #E5E7EB",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#111827",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Bell size={20} />
            Thông tin cơ bản
          </h3>

          <div style={{ display: "grid", gap: "16px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Tiêu đề thông báo *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "8px",
                  fontSize: "14px",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#4F46E5")}
                onBlur={(e) => (e.target.style.borderColor = "#D1D5DB")}
                placeholder="Nhập tiêu đề thông báo..."
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Nội dung thông báo *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => handleInputChange("content", e.target.value)}
                required
                rows={6}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  resize: "vertical",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#4F46E5")}
                onBlur={(e) => (e.target.style.borderColor = "#D1D5DB")}
                placeholder="Nhập nội dung thông báo..."
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "6px",
                  }}
                >
                  Loại thông báo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange("type", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #D1D5DB",
                    borderRadius: "8px",
                    fontSize: "14px",
                    background: "white",
                  }}
                >
                  <option value="info">Thông tin</option>
                  <option value="warning">Cảnh báo</option>
                  <option value="success">Thành công</option>
                  <option value="error">Lỗi</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "6px",
                  }}
                >
                  Độ ưu tiên
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    handleInputChange("priority", e.target.value)
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #D1D5DB",
                    borderRadius: "8px",
                    fontSize: "14px",
                    background: "white",
                  }}
                >
                  <option value="low">Thấp</option>
                  <option value="normal">Bình thường</option>
                  <option value="high">Cao</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Recipients */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "12px",
            padding: "24px",
            border: "1px solid #E5E7EB",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#111827",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Users size={20} />
            Người nhận
          </h3>

          <div style={{ display: "grid", gap: "16px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Loại người nhận
              </label>
              <select
                value={formData.recipientType}
                onChange={(e) =>
                  handleInputChange("recipientType", e.target.value)
                }
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "8px",
                  fontSize: "14px",
                  background: "white",
                }}
              >
                <option value="all">Tất cả</option>
                <option value="students">Chỉ sinh viên</option>
                <option value="lecturers">Chỉ giảng viên</option>
                <option value="admins">Chỉ quản trị viên</option>
                <option value="specific">Chọn cụ thể</option>
              </select>
            </div>

            {formData.recipientType === "specific" && (
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "12px",
                  }}
                >
                  Chọn người nhận ({formData.selectedRecipients.length} đã chọn)
                </label>
                <div
                  style={{
                    maxHeight: "200px",
                    overflow: "auto",
                    border: "1px solid #D1D5DB",
                    borderRadius: "8px",
                    padding: "12px",
                  }}
                >
                  {mockRecipients.map((recipient) => (
                    <label
                      key={recipient.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "8px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#F3F4F6";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedRecipients.includes(
                          recipient.id
                        )}
                        onChange={() => handleRecipientToggle(recipient.id)}
                        style={{ margin: 0 }}
                      />
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <User size={16} color="#6B7280" />
                        <div>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "500",
                              color: "#111827",
                            }}
                          >
                            {recipient.name}
                          </div>
                          <div style={{ fontSize: "12px", color: "#6B7280" }}>
                            {recipient.code} •{" "}
                            {recipient.type === "student"
                              ? "Sinh viên"
                              : recipient.type === "lecturer"
                              ? "Giảng viên"
                              : "Quản trị viên"}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div
              style={{
                padding: "16px",
                background: "#F9FAFB",
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "8px",
                }}
              >
                Sẽ gửi đến: {filteredRecipients.length} người nhận
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {filteredRecipients.slice(0, 5).map((recipient) => (
                  <span
                    key={recipient.id}
                    style={{
                      padding: "4px 8px",
                      background: "#E5E7EB",
                      color: "#374151",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "500",
                    }}
                  >
                    {recipient.name}
                  </span>
                ))}
                {filteredRecipients.length > 5 && (
                  <span
                    style={{
                      padding: "4px 8px",
                      background: "#E5E7EB",
                      color: "#374151",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "500",
                    }}
                  >
                    +{filteredRecipients.length - 5} người khác
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Options */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "12px",
            padding: "24px",
            border: "1px solid #E5E7EB",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#111827",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Send size={20} />
            Tùy chọn gửi
          </h3>

          <div style={{ display: "grid", gap: "16px" }}>
            <div style={{ display: "flex", gap: "24px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#374151",
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.sendEmail}
                  onChange={(e) =>
                    handleInputChange("sendEmail", e.target.checked)
                  }
                  style={{ margin: 0 }}
                />
                Gửi email
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#374151",
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.sendPush}
                  onChange={(e) =>
                    handleInputChange("sendPush", e.target.checked)
                  }
                  style={{ margin: 0 }}
                />
                Thông báo đẩy
              </label>
            </div>

            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#374151",
                  marginBottom: "12px",
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.scheduleSend}
                  onChange={(e) =>
                    handleInputChange("scheduleSend", e.target.checked)
                  }
                  style={{ margin: 0 }}
                />
                Lên lịch gửi
              </label>

              {formData.scheduleSend && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "6px",
                      }}
                    >
                      Ngày gửi
                    </label>
                    <input
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) =>
                        handleInputChange("scheduledDate", e.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "1px solid #D1D5DB",
                        borderRadius: "8px",
                        fontSize: "14px",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "6px",
                      }}
                    >
                      Giờ gửi
                    </label>
                    <input
                      type="time"
                      value={formData.scheduledTime}
                      onChange={(e) =>
                        handleInputChange("scheduledTime", e.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "1px solid #D1D5DB",
                        borderRadius: "8px",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
            padding: "24px",
            background: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E5E7EB",
          }}
        >
          <button
            type="button"
            onClick={() => navigate("/admin")}
            style={{
              padding: "12px 24px",
              background: "#F3F4F6",
              color: "#374151",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#E5E7EB";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#F3F4F6";
            }}
          >
            Hủy
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: "12px 24px",
              background: isSubmitting ? "#9CA3AF" : "#4F46E5",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              transition: "background-color 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting)
                e.currentTarget.style.backgroundColor = "#4338CA";
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting)
                e.currentTarget.style.backgroundColor = "#4F46E5";
            }}
          >
            {isSubmitting ? (
              <>
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid #FFFFFF",
                    borderTop: "2px solid transparent",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                Đang gửi...
              </>
            ) : (
              <>
                <Send size={16} />
                Gửi thông báo
              </>
            )}
          </button>
        </div>
      </form>

      {/* Preview Modal */}
      {showPreview && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "500px",
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: "#111827",
                  fontSize: "20px",
                  fontWeight: "600",
                }}
              >
                Xem trước thông báo
              </h2>
              <button
                onClick={() => setShowPreview(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#6B7280",
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                padding: "20px",
                border: `2px solid ${getTypeColor(formData.type)}`,
                borderRadius: "8px",
                background: "#F9FAFB",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                {getTypeIcon(formData.type)}
                <div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#111827",
                    }}
                  >
                    {formData.title || "Tiêu đề thông báo"}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      fontWeight: "500",
                    }}
                  >
                    {formData.type === "info"
                      ? "Thông tin"
                      : formData.type === "warning"
                      ? "Cảnh báo"
                      : formData.type === "success"
                      ? "Thành công"
                      : "Lỗi"}
                  </div>
                </div>
              </div>

              <div
                style={{
                  fontSize: "14px",
                  color: "#374151",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap",
                }}
              >
                {formData.content || "Nội dung thông báo sẽ hiển thị ở đây..."}
              </div>

              <div
                style={{
                  marginTop: "16px",
                  paddingTop: "16px",
                  borderTop: "1px solid #E5E7EB",
                  fontSize: "12px",
                  color: "#6B7280",
                }}
              >
                Sẽ gửi đến: {filteredRecipients.length} người nhận
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "24px",
              }}
            >
              <button
                onClick={() => setShowPreview(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#4F46E5",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#4338CA";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#4F46E5";
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: "#111827",
                  fontSize: "20px",
                  fontWeight: "600",
                }}
              >
                Chọn mẫu thông báo
              </h2>
              <button
                onClick={() => setShowTemplates(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#6B7280",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "grid", gap: "16px" }}>
              {notificationTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  style={{
                    padding: "16px",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#4F46E5";
                    e.currentTarget.style.backgroundColor = "#F3F4F6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#E5E7EB";
                    e.currentTarget.style.backgroundColor = "white";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "8px",
                    }}
                  >
                    {getTypeIcon(template.type)}
                    <div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "#111827",
                        }}
                      >
                        {template.name}
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#6B7280",
                        }}
                      >
                        {template.title}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#374151",
                      lineHeight: "1.5",
                    }}
                  >
                    {template.content.substring(0, 100)}...
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "24px",
              }}
            >
              <button
                onClick={() => setShowTemplates(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#F3F4F6",
                  color: "#374151",
                  border: "1px solid #D1D5DB",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateNotification;
