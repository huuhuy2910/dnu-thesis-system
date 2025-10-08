import React, { useState } from "react";
import {
  Settings,
  Save,
  RefreshCw,
  Database,
  Mail,
  Shield,
  Clock,
  FileText,
} from "lucide-react";
import "../admin/Dashboard.css";

interface SystemConfig {
  systemName: string;
  systemVersion: string;
  maxStudentsPerLecturer: number;
  maxTopicsPerStudent: number;
  defenseDuration: number;
  emailNotifications: boolean;
  autoBackup: boolean;
  backupFrequency: string;
  sessionTimeout: number;
  maintenanceMode: boolean;
  registrationDeadline: string;
  defensePeriodStart: string;
  defensePeriodEnd: string;
}

const SystemConfig: React.FC = () => {
  const [config, setConfig] = useState<SystemConfig>({
    systemName: "Hệ thống Quản lý Đồ án Tốt nghiệp",
    systemVersion: "2.1.0",
    maxStudentsPerLecturer: 8,
    maxTopicsPerStudent: 3,
    defenseDuration: 45,
    emailNotifications: true,
    autoBackup: true,
    backupFrequency: "daily",
    sessionTimeout: 30,
    maintenanceMode: false,
    registrationDeadline: "2025-11-30",
    defensePeriodStart: "2025-12-01",
    defensePeriodEnd: "2025-12-31",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "general" | "academic" | "system" | "security"
  >("general");

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
    alert("Cấu hình đã được lưu thành công!");
  };

  const handleReset = () => {
    if (window.confirm("Bạn có chắc muốn khôi phục cài đặt mặc định?")) {
      // Reset to default values
      setConfig({
        systemName: "Hệ thống Quản lý Đồ án Tốt nghiệp",
        systemVersion: "2.1.0",
        maxStudentsPerLecturer: 8,
        maxTopicsPerStudent: 3,
        defenseDuration: 45,
        emailNotifications: true,
        autoBackup: true,
        backupFrequency: "daily",
        sessionTimeout: 30,
        maintenanceMode: false,
        registrationDeadline: "2025-11-30",
        defensePeriodStart: "2025-12-01",
        defensePeriodEnd: "2025-12-31",
      });
    }
  };

  const updateConfig = (
    field: keyof SystemConfig,
    value: string | number | boolean
  ) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const renderGeneralTab = () => (
    <div style={{ display: "grid", gap: "24px" }}>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "8px",
              color: "#002855",
            }}
          >
            Tên hệ thống
          </label>
          <input
            type="text"
            value={config.systemName}
            onChange={(e) => updateConfig("systemName", e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "14px",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#f37021")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "8px",
              color: "#002855",
            }}
          >
            Phiên bản hệ thống
          </label>
          <input
            type="text"
            value={config.systemVersion}
            onChange={(e) => updateConfig("systemVersion", e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "14px",
              backgroundColor: "#f9fafb",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#f37021")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
            disabled
          />
          <small style={{ color: "#6b7280", fontSize: "12px" }}>
            Không thể thay đổi phiên bản hệ thống
          </small>
        </div>
      </div>

      <div>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: "600",
            marginBottom: "12px",
            color: "#002855",
          }}
        >
          <Mail size={18} />
          Thông báo email
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={config.emailNotifications}
              onChange={(e) =>
                updateConfig("emailNotifications", e.target.checked)
              }
              style={{ width: "18px", height: "18px", accentColor: "#f37021" }}
            />
            <span>Bật thông báo email tự động</span>
          </label>
        </div>
        <p style={{ color: "#6b7280", fontSize: "13px", marginTop: "4px" }}>
          Gửi thông báo qua email cho sinh viên và giảng viên về các sự kiện
          quan trọng
        </p>
      </div>

      <div>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: "600",
            marginBottom: "12px",
            color: "#002855",
          }}
        >
          <Shield size={18} />
          Chế độ bảo trì
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={config.maintenanceMode}
              onChange={(e) =>
                updateConfig("maintenanceMode", e.target.checked)
              }
              style={{ width: "18px", height: "18px", accentColor: "#f37021" }}
            />
            <span>Kích hoạt chế độ bảo trì</span>
          </label>
        </div>
        <p style={{ color: "#6b7280", fontSize: "13px", marginTop: "4px" }}>
          Khi bật chế độ bảo trì, chỉ quản trị viên mới có thể truy cập hệ thống
        </p>
      </div>
    </div>
  );

  const renderAcademicTab = () => (
    <div style={{ display: "grid", gap: "24px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "20px",
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "8px",
              color: "#002855",
            }}
          >
            Số SV tối đa/giảng viên
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={config.maxStudentsPerLecturer}
            onChange={(e) =>
              updateConfig("maxStudentsPerLecturer", parseInt(e.target.value))
            }
            style={{
              width: "100%",
              padding: "12px",
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "14px",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#f37021")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "8px",
              color: "#002855",
            }}
          >
            Số đề tài tối đa/SV
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={config.maxTopicsPerStudent}
            onChange={(e) =>
              updateConfig("maxTopicsPerStudent", parseInt(e.target.value))
            }
            style={{
              width: "100%",
              padding: "12px",
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "14px",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#f37021")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "8px",
              color: "#002855",
            }}
          >
            Thời gian bảo vệ (phút)
          </label>
          <input
            type="number"
            min="15"
            max="120"
            value={config.defenseDuration}
            onChange={(e) =>
              updateConfig("defenseDuration", parseInt(e.target.value))
            }
            style={{
              width: "100%",
              padding: "12px",
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "14px",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#f37021")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
          />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "20px",
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "8px",
              color: "#002855",
            }}
          >
            Hạn đăng ký đề tài
          </label>
          <input
            type="date"
            value={config.registrationDeadline}
            onChange={(e) =>
              updateConfig("registrationDeadline", e.target.value)
            }
            style={{
              width: "100%",
              padding: "12px",
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "14px",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#f37021")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "8px",
              color: "#002855",
            }}
          >
            Kỳ bảo vệ bắt đầu
          </label>
          <input
            type="date"
            value={config.defensePeriodStart}
            onChange={(e) => updateConfig("defensePeriodStart", e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "14px",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#f37021")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "8px",
              color: "#002855",
            }}
          >
            Kỳ bảo vệ kết thúc
          </label>
          <input
            type="date"
            value={config.defensePeriodEnd}
            onChange={(e) => updateConfig("defensePeriodEnd", e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "14px",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#f37021")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
          />
        </div>
      </div>
    </div>
  );

  const renderSystemTab = () => (
    <div style={{ display: "grid", gap: "24px" }}>
      <div>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: "600",
            marginBottom: "12px",
            color: "#002855",
          }}
        >
          <Database size={18} />
          Sao lưu tự động
        </label>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={config.autoBackup}
              onChange={(e) => updateConfig("autoBackup", e.target.checked)}
              style={{ width: "18px", height: "18px", accentColor: "#f37021" }}
            />
            <span>Bật sao lưu tự động</span>
          </label>
        </div>

        {config.autoBackup && (
          <div>
            <label
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "8px",
                color: "#002855",
              }}
            >
              Tần suất sao lưu
            </label>
            <select
              value={config.backupFrequency}
              onChange={(e) => updateConfig("backupFrequency", e.target.value)}
              style={{
                padding: "12px",
                border: "2px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "14px",
                minWidth: "200px",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#f37021")}
              onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
            >
              <option value="hourly">Hàng giờ</option>
              <option value="daily">Hàng ngày</option>
              <option value="weekly">Hàng tuần</option>
              <option value="monthly">Hàng tháng</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div style={{ display: "grid", gap: "24px" }}>
      <div>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: "600",
            marginBottom: "8px",
            color: "#002855",
          }}
        >
          <Clock size={18} />
          Thời gian phiên làm việc (phút)
        </label>
        <input
          type="number"
          min="5"
          max="480"
          value={config.sessionTimeout}
          onChange={(e) =>
            updateConfig("sessionTimeout", parseInt(e.target.value))
          }
          style={{
            width: "200px",
            padding: "12px",
            border: "2px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "14px",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#f37021")}
          onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
        />
        <p style={{ color: "#6b7280", fontSize: "13px", marginTop: "4px" }}>
          Thời gian không hoạt động tối đa trước khi tự động đăng xuất
        </p>
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>
          <Settings size={32} style={{ marginRight: 12, color: "#f37021" }} />
          Cấu hình hệ thống
        </h1>
        <p>
          Thiết lập các thông số và cấu hình chung của hệ thống quản lý đồ án.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", borderBottom: "2px solid #e5e7eb" }}>
          {[
            { key: "general", label: "Tổng quan", icon: Settings },
            { key: "academic", label: "Học thuật", icon: FileText },
            { key: "system", label: "Hệ thống", icon: Database },
            { key: "security", label: "Bảo mật", icon: Shield },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() =>
                setActiveTab(
                  tab.key as "general" | "academic" | "system" | "security"
                )
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                border: "none",
                background: activeTab === tab.key ? "#f37021" : "transparent",
                color: activeTab === tab.key ? "white" : "#002855",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                borderBottom:
                  activeTab === tab.key
                    ? "3px solid #002855"
                    : "3px solid transparent",
                transition: "all 0.2s",
              }}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "32px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        {activeTab === "general" && renderGeneralTab()}
        {activeTab === "academic" && renderAcademicTab()}
        {activeTab === "system" && renderSystemTab()}
        {activeTab === "security" && renderSecurityTab()}
      </div>

      {/* Action Buttons */}
      <div
        style={{
          marginTop: "32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <button
          onClick={handleReset}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 24px",
            backgroundColor: "#6b7280",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#4b5563")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#6b7280")
          }
        >
          <RefreshCw size={16} />
          Khôi phục mặc định
        </button>

        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 24px",
            backgroundColor: isSaving ? "#9ca3af" : "#f37021",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: isSaving ? "not-allowed" : "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) =>
            !isSaving && (e.currentTarget.style.backgroundColor = "#d85f1a")
          }
          onMouseLeave={(e) =>
            !isSaving && (e.currentTarget.style.backgroundColor = "#f37021")
          }
        >
          {isSaving ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save size={16} />
              Lưu cấu hình
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SystemConfig;
