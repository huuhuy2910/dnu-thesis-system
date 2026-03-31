import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Search, RefreshCw, Eye } from "lucide-react";
import { useToast } from "../../context/useToast";
import {
  type WorkflowAuditFilter,
  type WorkflowAuditItem,
} from "../../types/workflow-topic";
import { getTopicWorkflowAudits } from "../../services/topic-workflow.service";
import "../admin/Dashboard.css";

const TopicWorkflowAudits: React.FC = () => {
  const { addToast } = useToast();
  const [rows, setRows] = useState<WorkflowAuditItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<WorkflowAuditItem | null>(
    null,
  );

  const [topicCode, setTopicCode] = useState("");
  const [actionType, setActionType] = useState("");
  const [statusCode, setStatusCode] = useState("");
  const [isSuccess, setIsSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(totalCount / Math.max(1, pageSize))),
    [pageSize, totalCount],
  );

  const loadAudits = useCallback(async () => {
    setLoading(true);
    try {
      const filters: WorkflowAuditFilter = {
        topicCode: topicCode.trim() || undefined,
        actionType: actionType || undefined,
        statusCode: statusCode || undefined,
        isSuccess: isSuccess === "" ? undefined : (Number(isSuccess) as 0 | 1),
        search: search.trim() || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        sortBy: "createdAt",
        sortDescending: true,
        page,
        pageSize,
      };

      const result = await getTopicWorkflowAudits(filters);
      setRows(result.items);
      setTotalCount(result.totalCount);
    } catch (error) {
      addToast(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách workflow audit.",
        "error",
      );
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [
    actionType,
    addToast,
    fromDate,
    isSuccess,
    page,
    pageSize,
    search,
    statusCode,
    toDate,
    topicCode,
  ]);

  useEffect(() => {
    void loadAudits();
  }, [loadAudits]);

  const resetFilters = () => {
    setTopicCode("");
    setActionType("");
    setStatusCode("");
    setIsSuccess("");
    setSearch("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Workflow Audit đề tài</h1>
        <p>Theo dõi toàn bộ lịch sử submit/decision và trạng thái workflow.</p>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          padding: 16,
          marginBottom: 16,
          display: "grid",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: 10,
          }}
        >
          <input
            value={topicCode}
            onChange={(e) => setTopicCode(e.target.value)}
            placeholder="topicCode"
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: 10,
            }}
          />
          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: 10,
            }}
          >
            <option value="">Tất cả actionType</option>
            <option value="SUBMIT">SUBMIT</option>
            <option value="DECISION">DECISION</option>
            <option value="ROLLBACK">ROLLBACK</option>
          </select>
          <select
            value={statusCode}
            onChange={(e) => setStatusCode(e.target.value)}
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: 10,
            }}
          >
            <option value="">Tất cả statusCode</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="REVISION_REQUIRED">REVISION_REQUIRED</option>
          </select>
          <select
            value={isSuccess}
            onChange={(e) => setIsSuccess(e.target.value)}
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: 10,
            }}
          >
            <option value="">Kết quả</option>
            <option value="1">Success</option>
            <option value="0">Failed</option>
          </select>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: 10,
            }}
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: 10,
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 280px" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#64748b",
              }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã, actor, comment..."
              style={{
                width: "100%",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                padding: "10px 10px 10px 34px",
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setPage(1);
              void loadAudits();
            }}
            style={{
              border: "none",
              borderRadius: 8,
              padding: "10px 14px",
              background: "#f37021",
              color: "#fff",
              fontWeight: 600,
            }}
          >
            Tìm
          </button>
          <button
            type="button"
            onClick={resetFilters}
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "10px 14px",
              background: "#fff",
            }}
          >
            <RefreshCw size={14} style={{ marginRight: 6 }} /> Reset
          </button>
        </div>
      </div>

      <div className="recent-topics-section" style={{ overflowX: "auto" }}>
        <table className="topics-table">
          <thead>
            <tr>
              <th>AuditCode</th>
              <th>TopicCode</th>
              <th>Action</th>
              <th>StatusCode</th>
              <th>Actor</th>
              <th>CreatedAt</th>
              <th>KQ</th>
              <th style={{ textAlign: "center" }}>Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8}>Đang tải dữ liệu...</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8}>Không có bản ghi audit.</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.auditID}>
                  <td>{row.auditCode}</td>
                  <td>{row.topicCode}</td>
                  <td>{row.actionType}</td>
                  <td>{row.statusCode || ""}</td>
                  <td>{row.actorUserCode || ""}</td>
                  <td>{new Date(row.createdAt).toLocaleString()}</td>
                  <td>{row.isSuccess ? "Success" : "Failed"}</td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      type="button"
                      onClick={() => setSelectedAudit(row)}
                      style={{
                        border: "1px solid #cbd5e1",
                        background: "#fff",
                        borderRadius: 8,
                        padding: 6,
                      }}
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div
          style={{
            marginTop: 14,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <div style={{ color: "#64748b", fontSize: 13 }}>
            Tổng bản ghi: <strong>{totalCount}</strong>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                padding: "6px 8px",
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                padding: "6px 10px",
                background: "#fff",
              }}
            >
              Trước
            </button>
            <span style={{ minWidth: 94, textAlign: "center", fontSize: 13 }}>
              Trang {page} / {pageCount}
            </span>
            <button
              type="button"
              disabled={page >= pageCount || loading}
              onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                padding: "6px 10px",
                background: "#fff",
              }}
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {selectedAudit && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.45)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 80,
            padding: 14,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 860,
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ padding: 16, borderBottom: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: 0, color: "#0f172a" }}>
                Chi tiết Workflow Audit
              </h3>
            </div>
            <div
              style={{
                padding: 16,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
                gap: 12,
              }}
            >
              {Object.entries(selectedAudit).map(([key, value]) => (
                <div
                  key={key}
                  style={{
                    padding: 10,
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    background: "#f8fafc",
                    display: "grid",
                    gap: 6,
                  }}
                >
                  <strong style={{ color: "#334155" }}>{key}</strong>
                  <span style={{ color: "#0f172a" }}>
                    {String(value ?? "")}
                  </span>
                </div>
              ))}
            </div>
            <div
              style={{
                padding: 16,
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedAudit(null)}
                style={{
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  borderRadius: 8,
                  padding: "9px 14px",
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicWorkflowAudits;
