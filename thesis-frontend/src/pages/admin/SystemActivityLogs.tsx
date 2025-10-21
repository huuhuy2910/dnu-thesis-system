import React, { useState, useEffect } from "react";
import {
  Activity,
  Search,
  Clock,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  BarChart3,
  TrendingUp,
  Shield,
  ChevronDown,
  ChevronRight,
  Code,
} from "lucide-react";
import { fetchData } from "../../api/fetchData";
import type {
  SystemActivityLog,
  ApiResponseSystemActivityLogs,
} from "../../types/systemActivityLog";
import "../admin/Dashboard.css";

const SystemActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<SystemActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLog, setSelectedLog] = useState<SystemActivityLog | null>(
    null
  );
  const [showOldValue, setShowOldValue] = useState(true);
  const [showNewValue, setShowNewValue] = useState(true);
  const pageSize = 15;

  const loadLogs = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchData(
        `/SystemActivityLogs/get-list?Page=${page}&PageSize=${pageSize}`
      );

      const data = (response as ApiResponseSystemActivityLogs).data || [];
      setLogs(data);
      setTotalCount(
        (response as ApiResponseSystemActivityLogs).totalCount || 0
      );
    } catch (err) {
      setError("Không thể tải lịch sử hoạt động hệ thống");
      console.error("Error loading system activity logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (selectedLog) {
      setShowOldValue(true);
      setShowNewValue(true);
    }
  }, [selectedLog]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchTerm === "" ||
      log.userCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actionDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction =
      actionFilter === "all" || log.actionType === actionFilter;
    const matchesModule = moduleFilter === "all" || log.module === moduleFilter;
    return matchesSearch && matchesAction && matchesModule;
  });

  // Calculate statistics
  const stats = {
    total: filteredLogs.length,
    success: filteredLogs.filter((log) => log.status === "SUCCESS").length,
    failed: filteredLogs.filter((log) => log.status === "FAILED").length,
    warning: filteredLogs.filter((log) => log.status === "WARNING").length,
    create: filteredLogs.filter((log) => log.actionType === "CREATE").length,
    update: filteredLogs.filter((log) => log.actionType === "UPDATE").length,
    delete: filteredLogs.filter((log) => log.actionType === "DELETE").length,
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType.toUpperCase()) {
      case "CREATE":
        return <CheckCircle size={16} color="#10B981" />;
      case "UPDATE":
        return <FileText size={16} color="#F59E0B" />;
      case "DELETE":
        return <XCircle size={16} color="#EF4444" />;
      default:
        return <Activity size={16} color="#6B7280" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case "SUCCESS":
        return <CheckCircle size={16} color="#10B981" />;
      case "FAILED":
        return <XCircle size={16} color="#EF4444" />;
      case "WARNING":
        return <AlertCircle size={16} color="#F59E0B" />;
      default:
        return <Clock size={16} color="#6B7280" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "SUCCESS":
        return "#10B981";
      case "FAILED":
        return "#EF4444";
      case "WARNING":
        return "#F59E0B";
      default:
        return "#6B7280";
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType.toUpperCase()) {
      case "CREATE":
        return "#10B981";
      case "UPDATE":
        return "#F59E0B";
      case "DELETE":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  };

  const renderValue = (
    value: string,
    type: "old" | "new",
    compareValue?: string
  ) => {
    try {
      const parsed = JSON.parse(value);
      const compareParsed = compareValue ? JSON.parse(compareValue) : null;

      if (Array.isArray(parsed)) {
        // Render array as a nice list with comparison
        return (
          <div style={{ display: "grid", gap: "8px" }}>
            {parsed.map((item, index) => {
              const isNew =
                compareParsed &&
                Array.isArray(compareParsed) &&
                (!compareParsed[index] ||
                  JSON.stringify(compareParsed[index]) !==
                    JSON.stringify(item));

              return (
                <div
                  key={index}
                  style={{
                    backgroundColor: type === "old" ? "#FEF7F7" : "#F7FEF7",
                    border: `1px solid ${
                      type === "old" ? "#FECACA" : "#BBF7D0"
                    }`,
                    borderRadius: "6px",
                    padding: "12px",
                    fontSize: "13px",
                    color: type === "old" ? "#DC2626" : "#047857",
                  }}
                >
                  <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                    Item {index + 1}:
                  </div>
                  {typeof item === "object" ? (
                    <div style={{ marginLeft: "12px" }}>
                      {Object.entries(item).map(([key, val]) => (
                        <div key={key} style={{ marginBottom: "2px" }}>
                          <span style={{ fontWeight: "500" }}>{key}:</span>{" "}
                          {isNew && type === "new" && (
                            <span
                              style={{
                                display: "inline-block",
                                marginRight: "4px",
                                background:
                                  "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                                color: "white",
                                padding: "1px 4px",
                                borderRadius: "8px",
                                fontSize: "9px",
                                fontWeight: "600",
                                verticalAlign: "middle",
                                boxShadow: "0 1px 3px rgba(16, 185, 129, 0.3)",
                                animation:
                                  "newLabelPulse 2s ease-in-out infinite",
                                transition: "all 0.2s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "scale(1.1)";
                                e.currentTarget.style.boxShadow =
                                  "0 3px 6px rgba(16, 185, 129, 0.4)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "scale(1)";
                                e.currentTarget.style.boxShadow =
                                  "0 1px 3px rgba(16, 185, 129, 0.3)";
                              }}
                            >
                              NEW
                            </span>
                          )}
                          <span>{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span>
                      {isNew && type === "new" && (
                        <span
                          style={{
                            display: "inline-block",
                            marginRight: "4px",
                            background:
                              "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                            color: "white",
                            padding: "1px 4px",
                            borderRadius: "8px",
                            fontSize: "9px",
                            fontWeight: "600",
                            verticalAlign: "middle",
                            boxShadow: "0 1px 3px rgba(16, 185, 129, 0.3)",
                            animation: "newLabelPulse 2s ease-in-out infinite",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.1)";
                            e.currentTarget.style.boxShadow =
                              "0 3px 6px rgba(16, 185, 129, 0.4)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow =
                              "0 1px 3px rgba(16, 185, 129, 0.3)";
                          }}
                        >
                          NEW
                        </span>
                      )}
                      {String(item)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        );
      } else if (typeof parsed === "object" && parsed !== null) {
        // Render object as key-value pairs with comparison
        const allKeys = new Set([
          ...Object.keys(parsed),
          ...(compareParsed && typeof compareParsed === "object"
            ? Object.keys(compareParsed)
            : []),
        ]);

        return (
          <div style={{ display: "grid", gap: "6px" }}>
            {Array.from(allKeys).map((key) => {
              const oldVal =
                compareParsed && typeof compareParsed === "object"
                  ? compareParsed[key]
                  : undefined;
              const newVal = parsed[key];
              const isNew = oldVal === undefined && newVal !== undefined;
              const isChanged =
                oldVal !== undefined &&
                newVal !== undefined &&
                JSON.stringify(oldVal) !== JSON.stringify(newVal);

              return (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    backgroundColor: type === "old" ? "#FEF7F7" : "#F7FEF7",
                    border: `1px solid ${
                      type === "old" ? "#FECACA" : "#BBF7D0"
                    }`,
                    borderRadius: "6px",
                    fontSize: "13px",
                  }}
                >
                  <span style={{ fontWeight: "600", color: "#374151" }}>
                    {key}:
                  </span>
                  <span
                    style={{
                      color: type === "old" ? "#DC2626" : "#047857",
                      textAlign: "right",
                      flex: 1,
                      marginLeft: "12px",
                      fontWeight: isChanged || isNew ? "600" : "400",
                    }}
                  >
                    {(isNew || isChanged) && type === "new" && (
                      <span
                        style={{
                          display: "inline-block",
                          marginRight: "8px",
                          background:
                            "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                          color: "white",
                          padding: "2px 6px",
                          borderRadius: "10px",
                          fontSize: "10px",
                          fontWeight: "600",
                          verticalAlign: "middle",
                          boxShadow: "0 2px 4px rgba(16, 185, 129, 0.3)",
                          animation: "newLabelPulse 2s ease-in-out infinite",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "scale(1.1)";
                          e.currentTarget.style.boxShadow =
                            "0 4px 8px rgba(16, 185, 129, 0.4)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1)";
                          e.currentTarget.style.boxShadow =
                            "0 2px 4px rgba(16, 185, 129, 0.3)";
                        }}
                      >
                        NEW
                      </span>
                    )}
                    {typeof newVal === "object"
                      ? JSON.stringify(newVal)
                      : String(newVal)}
                  </span>
                </div>
              );
            })}
          </div>
        );
      }
    } catch {
      // Not JSON, render as plain text
    }

    // Default: render as formatted text
    return (
      <div
        style={{
          fontSize: "13px",
          color: type === "old" ? "#DC2626" : "#047857",
          lineHeight: "1.6",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    );
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "#F37021",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(243, 112, 33, 0.3)",
            }}
          >
            <Activity size={24} color="#FFFFFF" />
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                color: "#1F2937",
                fontSize: "32px",
                fontWeight: "700",
                lineHeight: "1.2",
              }}
            >
              Lịch sử hoạt động hệ thống
            </h1>
            <p
              style={{
                margin: "4px 0 0 0",
                color: "#6B7280",
                fontSize: "16px",
              }}
            >
              Theo dõi và giám sát tất cả hoạt động trong hệ thống
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)",
            borderRadius: "16px",
            padding: "24px",
            color: "white",
            boxShadow: "0 8px 25px rgba(102, 126, 234, 0.3)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <BarChart3 size={24} />
            <span style={{ fontSize: "24px", fontWeight: "700" }}>
              {stats.total}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "14px", opacity: 0.9 }}>
            Tổng hoạt động
          </p>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
            borderRadius: "16px",
            padding: "24px",
            color: "white",
            boxShadow: "0 8px 25px rgba(16, 185, 129, 0.3)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <CheckCircle size={24} />
            <span style={{ fontSize: "24px", fontWeight: "700" }}>
              {stats.success}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "14px", opacity: 0.9 }}>
            Thành công
          </p>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
            borderRadius: "16px",
            padding: "24px",
            color: "white",
            boxShadow: "0 8px 25px rgba(245, 158, 11, 0.3)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <TrendingUp size={24} />
            <span style={{ fontSize: "24px", fontWeight: "700" }}>
              {stats.update}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "14px", opacity: 0.9 }}>Cập nhật</p>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
            borderRadius: "16px",
            padding: "24px",
            color: "white",
            boxShadow: "0 8px 25px rgba(239, 68, 68, 0.3)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <XCircle size={24} />
            <span style={{ fontSize: "24px", fontWeight: "700" }}>
              {stats.delete}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "14px", opacity: 0.9 }}>Xóa</p>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "24px",
          border: "1px solid #E5E7EB",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        }}
      >
        <h3
          style={{
            margin: "0 0 20px 0",
            color: "#1F2937",
            fontSize: "18px",
            fontWeight: "600",
          }}
        >
          Bộ lọc và tìm kiếm
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "16px",
            alignItems: "end",
          }}
        >
          {/* Search */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#374151",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Tìm kiếm
            </label>
            <div style={{ position: "relative" }}>
              <Search
                size={20}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#9CA3AF",
                }}
              />
              <input
                type="text"
                placeholder="Tìm kiếm theo người dùng, hành động hoặc thực thể..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px 12px 44px",
                  border: "2px solid #E5E7EB",
                  borderRadius: "12px",
                  fontSize: "14px",
                  transition: "border-color 0.2s",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#F37021")}
                onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
              />
            </div>
          </div>

          {/* Action Filter */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#374151",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Hành động
            </label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #E5E7EB",
                borderRadius: "12px",
                fontSize: "14px",
                cursor: "pointer",
                backgroundColor: "#FFFFFF",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) =>
                ((e.target as HTMLElement).style.borderColor = "#F37021")
              }
              onBlur={(e) =>
                ((e.target as HTMLElement).style.borderColor = "#E5E7EB")
              }
            >
              <option value="all">Tất cả hành động</option>
              <option value="LOGIN">Đăng nhập</option>
              <option value="CREATE">Tạo mới</option>
              <option value="UPDATE">Cập nhật</option>
              <option value="DELETE">Xóa</option>
            </select>
          </div>

          {/* Module Filter */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#374151",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Module
            </label>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #E5E7EB",
                borderRadius: "12px",
                fontSize: "14px",
                cursor: "pointer",
                backgroundColor: "#FFFFFF",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) =>
                ((e.target as HTMLElement).style.borderColor = "#F37021")
              }
              onBlur={(e) =>
                ((e.target as HTMLElement).style.borderColor = "#E5E7EB")
              }
            >
              <option value="all">Tất cả module</option>
              <option value="System">System</option>
              <option value="Catalog">Catalog</option>
              <option value="Department">Department</option>
              <option value="Submission">Submission</option>
              <option value="Defense">Defense</option>
              <option value="Committee">Committee</option>
              <option value="Milestone">Milestone</option>
              <option value="Topic">Topic</option>
              <option value="Authentication">User</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "64px",
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E5E7EB",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                border: "4px solid #E5E7EB",
                borderTop: "4px solid #F37021",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 20px",
              }}
            ></div>
            <p
              style={{
                margin: 0,
                color: "#6B7280",
                fontSize: "16px",
                fontWeight: "500",
              }}
            >
              Đang tải lịch sử hoạt động...
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div
          style={{
            padding: "32px",
            backgroundColor: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: "16px",
            textAlign: "center",
            boxShadow: "0 4px 12px rgba(239, 68, 68, 0.1)",
          }}
        >
          <AlertCircle
            size={32}
            color="#EF4444"
            style={{ marginBottom: "12px" }}
          />
          <h3
            style={{
              margin: "0 0 8px 0",
              color: "#DC2626",
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            Lỗi tải dữ liệu
          </h3>
          <p style={{ margin: 0, color: "#DC2626", fontSize: "14px" }}>
            {error}
          </p>
        </div>
      )}

      {/* Activity Cards */}
      {!loading && !error && (
        <>
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              border: "1px solid #E5E7EB",
              overflow: "hidden",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                backgroundColor: "#F9FAFB",
                borderBottom: "1px solid #E5E7EB",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: "#1F2937",
                  fontSize: "18px",
                  fontWeight: "600",
                }}
              >
                Danh sách hoạt động ({filteredLogs.length} / {totalCount})
              </h3>
              <div style={{ fontSize: "14px", color: "#6B7280" }}>
                Trang {currentPage} / {totalPages}
              </div>
            </div>

            <div style={{ padding: "24px" }}>
              {filteredLogs.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "64px 24px",
                    color: "#6B7280",
                  }}
                >
                  <Activity
                    size={64}
                    color="#D1D5DB"
                    style={{ marginBottom: "20px" }}
                  />
                  <h3
                    style={{
                      margin: "0 0 8px 0",
                      color: "#374151",
                      fontSize: "18px",
                      fontWeight: "600",
                    }}
                  >
                    Không tìm thấy hoạt động nào
                  </h3>
                  <p style={{ margin: 0, fontSize: "14px" }}>
                    Thử điều chỉnh bộ lọc để tìm kiếm kết quả phù hợp hơn
                  </p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "16px" }}>
                  {filteredLogs.map((log) => (
                    <div
                      key={log.logID}
                      style={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E5E7EB",
                        borderRadius: "12px",
                        padding: "20px",
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#F37021";
                        e.currentTarget.style.boxShadow =
                          "0 4px 12px rgba(243, 112, 33, 0.15)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#E5E7EB";
                        e.currentTarget.style.boxShadow =
                          "0 2px 4px rgba(0, 0, 0, 0.05)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                      onClick={() => setSelectedLog(log)}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "16px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "10px",
                              backgroundColor:
                                getActionColor(log.actionType) + "20",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {getActionIcon(log.actionType)}
                          </div>
                          <div>
                            <h4
                              style={{
                                margin: "0 0 4px 0",
                                color: "#1F2937",
                                fontSize: "16px",
                                fontWeight: "600",
                              }}
                            >
                              {log.actionType}
                            </h4>
                            <p
                              style={{
                                margin: 0,
                                color: "#6B7280",
                                fontSize: "14px",
                              }}
                            >
                              {log.entityName} • {log.entityID}
                            </p>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "6px 12px",
                              borderRadius: "20px",
                              backgroundColor:
                                getStatusColor(log.status) + "20",
                              border: `1px solid ${getStatusColor(
                                log.status
                              )}40`,
                            }}
                          >
                            {getStatusIcon(log.status)}
                            <span
                              style={{
                                color: getStatusColor(log.status),
                                fontSize: "12px",
                                fontWeight: "600",
                              }}
                            >
                              {log.status}
                            </span>
                          </div>
                          <Eye size={18} color="#6B7280" />
                        </div>
                      </div>

                      <div style={{ marginBottom: "16px" }}>
                        <p
                          style={{
                            margin: 0,
                            color: "#374151",
                            fontSize: "14px",
                            lineHeight: "1.5",
                          }}
                        >
                          {truncateText(log.actionDescription, 150)}
                        </p>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <User size={14} color="#6B7280" />
                            <span
                              style={{
                                color: "#374151",
                                fontSize: "14px",
                                fontWeight: "500",
                              }}
                            >
                              {log.userCode}
                            </span>
                            <span
                              style={{ color: "#6B7280", fontSize: "12px" }}
                            >
                              ({log.userRole})
                            </span>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <Shield size={14} color="#6B7280" />
                            <span
                              style={{ color: "#374151", fontSize: "14px" }}
                            >
                              {log.module}
                            </span>
                          </div>
                        </div>

                        <div style={{ color: "#6B7280", fontSize: "12px" }}>
                          {formatDateTime(log.performedAt)}
                        </div>
                      </div>

                      {(log.ipAddress || log.deviceInfo) && (
                        <div
                          style={{
                            marginTop: "12px",
                            paddingTop: "12px",
                            borderTop: "1px solid #F3F4F6",
                            display: "flex",
                            gap: "16px",
                            fontSize: "12px",
                            color: "#6B7280",
                          }}
                        >
                          {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                          {log.deviceInfo && <span>{log.deviceInfo}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "12px",
                marginTop: "32px",
              }}
            >
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: "10px 16px",
                  border: "2px solid #E5E7EB",
                  borderRadius: "8px",
                  backgroundColor: currentPage === 1 ? "#F3F4F6" : "#FFFFFF",
                  color: currentPage === 1 ? "#9CA3AF" : "#374151",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== 1) {
                    e.currentTarget.style.borderColor = "#F37021";
                    e.currentTarget.style.backgroundColor = "#F37021";
                    e.currentTarget.style.color = "#FFFFFF";
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== 1) {
                    e.currentTarget.style.borderColor = "#E5E7EB";
                    e.currentTarget.style.backgroundColor = "#FFFFFF";
                    e.currentTarget.style.color = "#374151";
                  }
                }}
              >
                Trước
              </button>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                }}
              >
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum =
                    Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  if (pageNum > totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      style={{
                        padding: "10px 14px",
                        border: "2px solid",
                        borderColor:
                          currentPage === pageNum ? "#F37021" : "#E5E7EB",
                        borderRadius: "8px",
                        backgroundColor:
                          currentPage === pageNum ? "#F37021" : "#FFFFFF",
                        color: currentPage === pageNum ? "#FFFFFF" : "#374151",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        minWidth: "44px",
                        transition: "all 0.2s",
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                style={{
                  padding: "10px 16px",
                  border: "2px solid #E5E7EB",
                  borderRadius: "8px",
                  backgroundColor:
                    currentPage === totalPages ? "#F3F4F6" : "#FFFFFF",
                  color: currentPage === totalPages ? "#9CA3AF" : "#374151",
                  cursor:
                    currentPage === totalPages ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== totalPages) {
                    e.currentTarget.style.borderColor = "#F37021";
                    e.currentTarget.style.backgroundColor = "#F37021";
                    e.currentTarget.style.color = "#FFFFFF";
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== totalPages) {
                    e.currentTarget.style.borderColor = "#E5E7EB";
                    e.currentTarget.style.backgroundColor = "#FFFFFF";
                    e.currentTarget.style.color = "#374151";
                  }
                }}
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {selectedLog && (
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
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              width: "90vw",
              maxWidth: "1400px",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
            }}
          >
            <div
              style={{
                padding: "24px",
                borderBottom: "1px solid #E5E7EB",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "sticky",
                top: 0,
                backgroundColor: "#FFFFFF",
                zIndex: 10,
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: "#1F2937",
                  fontSize: "20px",
                  fontWeight: "600",
                }}
              >
                Chi tiết hoạt động
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px",
                  borderRadius: "6px",
                  color: "#6B7280",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#F3F4F6")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "24px" }}>
              <div style={{ display: "grid", gap: "20px" }}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      backgroundColor:
                        getActionColor(selectedLog.actionType) + "20",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {getActionIcon(selectedLog.actionType)}
                  </div>
                  <div>
                    <h4
                      style={{
                        margin: "0 0 4px 0",
                        color: "#1F2937",
                        fontSize: "18px",
                        fontWeight: "600",
                      }}
                    >
                      {selectedLog.actionType}
                    </h4>
                    <p
                      style={{ margin: 0, color: "#6B7280", fontSize: "14px" }}
                    >
                      {selectedLog.entityName} • {selectedLog.entityID}
                    </p>
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      color: "#374151",
                      fontSize: "14px",
                      fontWeight: "600",
                    }}
                  >
                    Mô tả hành động
                  </label>
                  <p
                    style={{
                      margin: 0,
                      color: "#374151",
                      fontSize: "14px",
                      lineHeight: "1.6",
                    }}
                  >
                    {selectedLog.actionDescription}
                  </p>
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
                        marginBottom: "8px",
                        color: "#374151",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      Người thực hiện
                    </label>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <User size={16} color="#6B7280" />
                      <span style={{ color: "#374151", fontSize: "14px" }}>
                        {selectedLog.userCode} ({selectedLog.userRole})
                      </span>
                    </div>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        color: "#374151",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      Module
                    </label>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Shield size={16} color="#6B7280" />
                      <span style={{ color: "#374151", fontSize: "14px" }}>
                        {selectedLog.module}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        color: "#374151",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      Trạng thái
                    </label>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {getStatusIcon(selectedLog.status)}
                      <span
                        style={{
                          color: getStatusColor(selectedLog.status),
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        {selectedLog.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        color: "#374151",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      Thời gian
                    </label>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Clock size={16} color="#6B7280" />
                      <span style={{ color: "#374151", fontSize: "14px" }}>
                        {formatDateTime(selectedLog.performedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {(selectedLog.ipAddress || selectedLog.deviceInfo) && (
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        color: "#374151",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      Thông tin kỹ thuật
                    </label>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      {selectedLog.ipAddress && (
                        <span style={{ color: "#6B7280", fontSize: "14px" }}>
                          IP: {selectedLog.ipAddress}
                        </span>
                      )}
                      {selectedLog.deviceInfo && (
                        <span style={{ color: "#6B7280", fontSize: "14px" }}>
                          Thiết bị: {selectedLog.deviceInfo}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {selectedLog.oldValue && (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                        cursor: "pointer",
                      }}
                      onClick={() => setShowOldValue(!showOldValue)}
                    >
                      <label
                        style={{
                          color: "#374151",
                          fontSize: "14px",
                          fontWeight: "600",
                          margin: 0,
                        }}
                      >
                        Giá trị cũ
                      </label>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Code size={14} color="#6B7280" />
                        {showOldValue ? (
                          <ChevronDown size={16} color="#6B7280" />
                        ) : (
                          <ChevronRight size={16} color="#6B7280" />
                        )}
                      </div>
                    </div>
                    {showOldValue && (
                      <div
                        style={{
                          backgroundColor: "#FEF2F2",
                          border: "1px solid #FECACA",
                          borderRadius: "8px",
                          padding: "16px",
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: "8px",
                            right: "8px",
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: "#EF4444",
                          }}
                        />
                        {renderValue(
                          selectedLog.oldValue,
                          "old",
                          selectedLog.newValue || undefined
                        )}
                      </div>
                    )}
                  </div>
                )}

                {selectedLog.newValue && (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                        cursor: "pointer",
                      }}
                      onClick={() => setShowNewValue(!showNewValue)}
                    >
                      <label
                        style={{
                          color: "#374151",
                          fontSize: "14px",
                          fontWeight: "600",
                          margin: 0,
                        }}
                      >
                        Giá trị mới
                      </label>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Code size={14} color="#6B7280" />
                        {showNewValue ? (
                          <ChevronDown size={16} color="#6B7280" />
                        ) : (
                          <ChevronRight size={16} color="#6B7280" />
                        )}
                      </div>
                    </div>
                    {showNewValue && (
                      <div
                        style={{
                          backgroundColor: "#F0FDF4",
                          border: "1px solid #BBF7D0",
                          borderRadius: "8px",
                          padding: "16px",
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: "8px",
                            right: "8px",
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: "#10B981",
                          }}
                        />
                        {renderValue(
                          selectedLog.newValue,
                          "new",
                          selectedLog.oldValue || undefined
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes newLabelPulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
};

export default SystemActivityLogs;
