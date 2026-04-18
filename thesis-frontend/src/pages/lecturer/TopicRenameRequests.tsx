import { useEffect, useState } from "react";
import {
  BookOpen,
  Clock,
  FileText,
  Filter,
  Loader2,
  Search,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import TopicRenameRequestModal from "../../components/workflow/TopicRenameRequestModal";
import TablePagination from "../../components/TablePagination/TablePagination";
import { listTopicRenameRequests } from "../../services/topic-rename-request.service";
import type { TopicRenameRequestListItem } from "../../types/topic-rename-request";
import { useToast } from "../../context/useToast";
import { useAuth } from "../../hooks/useAuth";

type RenameRequestStatusFilter = "" | "Pending" | "Approved" | "Rejected";

type LecturerRenameRequestContext = {
  topicID?: number | null;
  topicCode?: string | null;
  title?: string | null;
  proposerUserCode?: string | null;
  supervisorUserCode?: string | null;
};

const normalizeStatus = (status: unknown) =>
  String(status ?? "")
    .trim()
    .toLowerCase();

const getStatusMeta = (status: unknown) => {
  const normalized = normalizeStatus(status);

  if (["pending", "dang cho", "đang chờ", "chờ duyệt"].includes(normalized)) {
    return { label: "Chờ duyệt", tone: "pending", icon: Clock };
  }

  if (["approved", "đã duyệt"].includes(normalized)) {
    return { label: "Đã duyệt", tone: "approved", icon: CheckCircle };
  }

  if (["rejected", "từ chối"].includes(normalized)) {
    return { label: "Từ chối", tone: "rejected", icon: AlertCircle };
  }

  return {
    label: String(status ?? "Khác").trim() || "Khác",
    tone: "unknown",
    icon: FileText,
  };
};

const TopicRenameRequestsPage = () => {
  const { addToast } = useToast();
  const auth = useAuth();
  const [requests, setRequests] = useState<TopicRenameRequestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] =
    useState<RenameRequestStatusFilter>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [summaryCount, setSummaryCount] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] =
    useState<LecturerRenameRequestContext | null>(null);

  const statusOptions: Array<{
    value: RenameRequestStatusFilter;
    label: string;
  }> = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "Pending", label: "Chờ duyệt" },
    { value: "Approved", label: "Đã duyệt" },
    { value: "Rejected", label: "Từ chối" },
  ];

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const loadRequests = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const response = await listTopicRenameRequests({
        reviewedByUserCode: auth.user?.userCode || undefined,
        status: statusFilter || undefined,
        search: searchTerm.trim() || undefined,
        sortBy: "createdAt",
        sortDescending: true,
        page: Math.max(0, currentPage - 1),
        pageSize,
      });

      setRequests(response.items);
      setTotalCount(response.totalCount);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Không thể tải danh sách đơn xin đổi tên đề tài.";
      setError(message);
      setRequests([]);
      setTotalCount(0);
      addToast(message, "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadSummary = async () => {
    try {
      const response = await listTopicRenameRequests({
        reviewedByUserCode: auth.user?.userCode || undefined,
        sortBy: "createdAt",
        sortDescending: true,
        page: 0,
        pageSize: 1000,
      });

      const summary = response.items.reduce(
        (accumulator, item) => {
          const meta = getStatusMeta(item.status);
          accumulator.total += 1;
          if (meta.tone === "pending") accumulator.pending += 1;
          if (meta.tone === "approved") accumulator.approved += 1;
          if (meta.tone === "rejected") accumulator.rejected += 1;
          return accumulator;
        },
        { total: 0, pending: 0, approved: 0, rejected: 0 },
      );

      setSummaryCount(summary);
    } catch {
      // Keep summary if refresh fails.
    }
  };

  useEffect(() => {
    void loadRequests();
    void loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user?.userCode, currentPage, statusFilter, searchTerm, pageSize]);

  const openDetailModal = (request: TopicRenameRequestListItem) => {
    setSelectedTopic({
      topicID: request.topicID ?? null,
      topicCode: request.topicCode || null,
      title: request.oldTitle || request.newTitle || null,
      proposerUserCode: request.requestedByUserCode || null,
      supervisorUserCode: request.reviewedByUserCode || null,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    void loadRequests();
    void loadSummary();
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "#1a1a1a",
            marginBottom: "8px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <BookOpen size={32} color="#F59E0B" />
          Xin đổi tên đề tài
        </h1>
        <p style={{ fontSize: "14px", color: "#666" }}>
          Danh sách và chi tiết workflow đổi tên đề tài của giảng viên.
        </p>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="text"
              value={searchInput}
              placeholder="Tìm theo mã request, tên đề tài cũ/mới..."
              style={{
                padding: "8px 12px",
                border: "1px solid #D1D5DB",
                borderRadius: "8px",
                fontSize: "14px",
                background: "white",
                minWidth: "300px",
                outline: "none",
              }}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  setSearchTerm(searchInput);
                  setCurrentPage(1);
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                setSearchTerm(searchInput);
                setCurrentPage(1);
              }}
              style={{
                padding: "8px 16px",
                background: "#F59E0B",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s ease",
              }}
            >
              <Search size={16} />
              Tìm kiếm
            </button>
          </div>

          <label
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#374151",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Filter size={16} />
            Lọc theo trạng thái:
          </label>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as RenameRequestStatusFilter);
              setCurrentPage(1);
            }}
            style={{
              padding: "8px 12px",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              fontSize: "14px",
              background: "white",
              cursor: "pointer",
              minWidth: "160px",
            }}
          >
            {statusOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => void loadRequests()}
            style={{
              padding: "8px 16px",
              background: "white",
              color: "#374151",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {refreshing ? (
              <Loader2
                size={16}
                style={{ animation: "spin 1s linear infinite" }}
              />
            ) : (
              <ArrowRight size={16} />
            )}
            Làm mới
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: "#FEE2E2",
            border: "1px solid #EF4444",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "24px",
            color: "#DC2626",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "20px",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
            border: "1px solid #F59E0B",
            borderRadius: "12px",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <BookOpen size={24} color="#F59E0B" style={{ marginBottom: "8px" }} />
          <div
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#F59E0B",
              marginBottom: "4px",
            }}
          >
            {summaryCount.total}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>Tổng đơn</div>
        </div>
        <div
          style={{
            background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
            border: "1px solid #F59E0B",
            borderRadius: "12px",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <Clock size={24} color="#F59E0B" style={{ marginBottom: "8px" }} />
          <div
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#F59E0B",
              marginBottom: "4px",
            }}
          >
            {summaryCount.pending}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>Chờ duyệt</div>
        </div>
        <div
          style={{
            background: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)",
            border: "1px solid #22C55E",
            borderRadius: "12px",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <CheckCircle
            size={24}
            color="#22C55E"
            style={{ marginBottom: "8px" }}
          />
          <div
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#22C55E",
              marginBottom: "4px",
            }}
          >
            {summaryCount.approved}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>Đã duyệt</div>
        </div>
        <div
          style={{
            background: "linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)",
            border: "1px solid #EF4444",
            borderRadius: "12px",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <AlertCircle
            size={24}
            color="#EF4444"
            style={{ marginBottom: "8px" }}
          />
          <div
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#EF4444",
              marginBottom: "4px",
            }}
          >
            {summaryCount.rejected}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>Từ chối</div>
        </div>
      </div>

      <div
        style={{
          background: "white",
          borderRadius: "24px",
          border: "1px solid #D9E1F2",
          padding: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px" }}>
            <Loader2
              size={32}
              color="#F59E0B"
              style={{ animation: "spin 1s linear infinite" }}
            />
            <p style={{ marginTop: "16px", color: "#666" }}>
              Đang tải danh sách đơn xin đổi tên đề tài...
            </p>
          </div>
        ) : requests.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "48px", color: "#64748B" }}
          >
            Chưa có đơn xin đổi tên đề tài nào.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{ width: "100%", fontSize: "13px", tableLayout: "fixed" }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid #E5ECFB",
                    background: "#F8FAFF",
                  }}
                >
                  <th
                    style={{
                      padding: "14px 16px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "#1F3C88",
                      textTransform: "uppercase",
                      fontSize: "11px",
                      width: "14%",
                    }}
                  >
                    Mã request
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "#1F3C88",
                      textTransform: "uppercase",
                      fontSize: "11px",
                      width: "28%",
                    }}
                  >
                    Đề tài
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "#1F3C88",
                      textTransform: "uppercase",
                      fontSize: "11px",
                      width: "13%",
                    }}
                  >
                    Người tạo
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "#1F3C88",
                      textTransform: "uppercase",
                      fontSize: "11px",
                      width: "13%",
                    }}
                  >
                    Người duyệt
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "#1F3C88",
                      textTransform: "uppercase",
                      fontSize: "11px",
                      width: "18%",
                    }}
                  >
                    Lý do
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "#1F3C88",
                      textTransform: "uppercase",
                      fontSize: "11px",
                      width: "14%",
                    }}
                  >
                    Trạng thái
                  </th>
                  <th
                    style={{
                      padding: "14px 16px",
                      textAlign: "center",
                      fontWeight: 600,
                      color: "#1F3C88",
                      textTransform: "uppercase",
                      fontSize: "11px",
                      width: "10%",
                    }}
                  >
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => {
                  const statusMeta = getStatusMeta(request.status);
                  const StatusIcon = statusMeta.icon;

                  return (
                    <tr
                      key={request.topicRenameRequestID}
                      style={{
                        borderBottom: "1px solid #F3F4F6",
                        transition: "background 0.2s ease",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.background = "#F9FAFB";
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.background = "white";
                      }}
                      onClick={() => openDetailModal(request)}
                    >
                      <td
                        style={{ padding: "14px 16px", verticalAlign: "top" }}
                      >
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#1a1a1a",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {request.requestCode ||
                            `#${request.topicRenameRequestID}`}
                        </div>
                        <div
                          style={{
                            marginTop: "4px",
                            fontSize: "11px",
                            color: "#666",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {request.topicCode || "-"}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          verticalAlign: "top",
                          maxWidth: "260px",
                        }}
                      >
                        <div style={{ display: "grid", gap: "4px" }}>
                          <div
                            style={{
                              fontSize: "13px",
                              color: "#1a1a1a",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              fontWeight: 600,
                            }}
                          >
                            {request.oldTitle || "-"}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#666",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Tên mới: {request.newTitle || "-"}
                          </div>
                        </div>
                      </td>
                      <td
                        style={{ padding: "14px 16px", verticalAlign: "top" }}
                      >
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#1a1a1a",
                            fontWeight: 600,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {request.requestedByName || "-"}
                        </div>
                        <div
                          style={{
                            marginTop: "4px",
                            fontSize: "11px",
                            color: "#666",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {request.requestedByStudentCode || "-"}
                        </div>
                      </td>
                      <td
                        style={{ padding: "14px 16px", verticalAlign: "top" }}
                      >
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#1a1a1a",
                            fontWeight: 600,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {request.reviewedByName || "-"}
                        </div>
                        <div
                          style={{
                            marginTop: "4px",
                            fontSize: "11px",
                            color: "#666",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {request.reviewedByLecturerCode || "-"}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          verticalAlign: "top",
                          maxWidth: "240px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#1a1a1a",
                            fontWeight: 600,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            lineHeight: 1.4,
                          }}
                        >
                          {request.reason || "-"}
                        </div>
                      </td>
                      <td
                        style={{ padding: "14px 16px", verticalAlign: "top" }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            borderRadius: "999px",
                            fontSize: "11px",
                            fontWeight: 600,
                            background:
                              statusMeta.tone === "approved"
                                ? "#F0FDF4"
                                : statusMeta.tone === "pending"
                                  ? "#FFF7ED"
                                  : statusMeta.tone === "rejected"
                                    ? "#FEF2F2"
                                    : "#F3F4F6",
                            color:
                              statusMeta.tone === "approved"
                                ? "#15803D"
                                : statusMeta.tone === "pending"
                                  ? "#C2410C"
                                  : statusMeta.tone === "rejected"
                                    ? "#B91C1C"
                                    : "#4B5563",
                            border: `1px solid ${statusMeta.tone === "approved" ? "#86EFAC" : statusMeta.tone === "pending" ? "#FDBA74" : statusMeta.tone === "rejected" ? "#FECACA" : "#D1D5DB"}`,
                          }}
                        >
                          <StatusIcon size={12} /> {statusMeta.label}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          verticalAlign: "top",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            justifyContent: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            type="button"
                            style={{
                              padding: "6px 10px",
                              background: "#F37021",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "11px",
                              fontWeight: 600,
                            }}
                            onClick={(event) => {
                              event.stopPropagation();
                              openDetailModal(request);
                            }}
                          >
                            Xem
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <TablePagination
          totalCount={totalCount}
          page={currentPage}
          pageCount={totalPages}
          pageSize={pageSize}
          isLoading={loading || refreshing}
          pageSizeOptions={[10, 20, 50]}
          totalLabel="Tổng bản ghi:"
          pageSizeLabel="Số dòng/trang"
          onPageChange={setCurrentPage}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setCurrentPage(1);
          }}
        />
      </div>

      <TopicRenameRequestModal
        isOpen={isModalOpen}
        onClose={closeModal}
        currentTopic={selectedTopic}
        initialMode="detail"
      />
    </div>
  );
};

export default TopicRenameRequestsPage;
