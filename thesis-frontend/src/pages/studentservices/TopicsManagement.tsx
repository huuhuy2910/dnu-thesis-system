import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Edit, Eye, Filter, Plus, Search, Trash2 } from "lucide-react";
import { fetchData } from "../../api/fetchData";
import ImportExportActions from "../../components/admin/ImportExportActions.tsx";
import { useToast } from "../../context/useToast";
import type { ApiResponse } from "../../types/api";
import "../admin/Dashboard.css";
import "./TopicsManagement.css";

type RecordData = Record<string, unknown>;
type FieldType = "text" | "number" | "date" | "textarea";

interface FieldDef {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
}

interface ColumnDef {
  key: string;
  label: string;
  aliases?: string[];
}

const fields: FieldDef[] = [
  { name: "topicCode", label: "topicCode" },
  { name: "title", label: "title", required: true },
  { name: "summary", label: "summary", type: "textarea" },
  { name: "type", label: "type" },
  { name: "proposerUserID", label: "proposerUserID", type: "number" },
  { name: "proposerUserCode", label: "proposerUserCode" },
  {
    name: "proposerStudentProfileID",
    label: "proposerStudentProfileID",
    type: "number",
  },
  { name: "proposerStudentCode", label: "proposerStudentCode" },
  { name: "supervisorUserID", label: "supervisorUserID", type: "number" },
  { name: "supervisorUserCode", label: "supervisorUserCode" },
  {
    name: "supervisorLecturerProfileID",
    label: "supervisorLecturerProfileID",
    type: "number",
  },
  { name: "supervisorLecturerCode", label: "supervisorLecturerCode" },
  { name: "catalogTopicID", label: "catalogTopicID", type: "number" },
  { name: "catalogTopicCode", label: "catalogTopicCode" },
  { name: "departmentID", label: "departmentID", type: "number" },
  { name: "departmentCode", label: "departmentCode" },
  { name: "status", label: "status" },
  { name: "resubmitCount", label: "resubmitCount", type: "number" },
  { name: "lecturerComment", label: "lecturerComment", type: "textarea" },
];

const filterFields: FieldDef[] = [
  { name: "topicCode", label: "Mã đề tài" },
  { name: "title", label: "Tên đề tài" },
  { name: "departmentCode", label: "Khoa/Bộ môn" },
  { name: "status", label: "Trạng thái" },
  { name: "type", label: "Loại đề tài" },
  { name: "proposerUserCode", label: "Mã người đề xuất" },
  { name: "supervisorUserCode", label: "Mã GV hướng dẫn" },
];

const columns: ColumnDef[] = [
  { key: "topicCode", label: "Mã đề tài", aliases: ["code"] },
  { key: "title", label: "Tên đề tài", aliases: ["topicTitle", "name"] },
  {
    key: "departmentCode",
    label: "Khoa/Bộ môn",
    aliases: ["departmentName", "department"],
  },
  {
    key: "proposerUserCode",
    label: "Người đề xuất",
    aliases: ["proposerStudentCode", "proposerCode", "proposerName"],
  },
  {
    key: "supervisorLecturerCode",
    label: "GV hướng dẫn",
    aliases: ["supervisorUserCode", "supervisorCode"],
  },
  { key: "status", label: "Trạng thái", aliases: ["topicStatus", "isActive"] },
];

function toDisplay(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function getColumnValue(row: RecordData, column: ColumnDef): unknown {
  const keys = [column.key, ...(column.aliases ?? [])];
  for (const key of keys) {
    const value = row[key];
    if (value === null || value === undefined) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    return value;
  }
  return "";
}

function toFormRecord(data: RecordData): Record<string, string> {
  return fields.reduce<Record<string, string>>((acc, field) => {
    acc[field.name] = toDisplay(data[field.name]);
    return acc;
  }, {});
}

function toPayload(formValues: Record<string, string>): RecordData {
  return fields.reduce<RecordData>((acc, field) => {
    const raw = (formValues[field.name] ?? "").trim();
    if (!raw) {
      acc[field.name] = field.type === "number" ? null : "";
      return acc;
    }
    if (field.type === "number") {
      const parsed = Number(raw);
      acc[field.name] = Number.isFinite(parsed) ? parsed : raw;
      return acc;
    }
    acc[field.name] = raw;
    return acc;
  }, {});
}

function buildQuery(input: Record<string, unknown>): string {
  const params = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    const normalized = String(value).trim();
    if (!normalized) return;
    params.append(key, normalized);
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

async function requestApiData<T>(
  path: string,
  options?: Parameters<typeof fetchData>[1],
  fallback = "Không thể tải dữ liệu.",
): Promise<{ data: T; totalCount: number }> {
  const response = await fetchData<ApiResponse<T>>(path, options);
  if (!response?.success) {
    throw new Error(response.message || response.title || fallback);
  }
  return {
    data: response.data as T,
    totalCount: Number(response.totalCount || 0),
  };
}

function normalizeList(payload: unknown): {
  items: RecordData[];
  fallbackTotal: number;
} {
  if (Array.isArray(payload)) {
    return { items: payload as RecordData[], fallbackTotal: payload.length };
  }
  if (payload && typeof payload === "object") {
    const source = payload as Record<string, unknown>;
    const nested = [
      source.items,
      source.records,
      source.result,
      source.data,
      source.list,
    ];
    const arr = nested.find((candidate) => Array.isArray(candidate));
    if (Array.isArray(arr)) {
      return {
        items: arr as RecordData[],
        fallbackTotal: Number(
          source.totalCount ?? source.total ?? source.count ?? arr.length,
        ),
      };
    }
  }
  return { items: [], fallbackTotal: 0 };
}

const TopicsManagement: React.FC = () => {
  const { addToast } = useToast();
  const [rows, setRows] = useState<RecordData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeModal, setActiveModal] = useState<
    "detail" | "create" | "edit" | null
  >(null);
  const [selectedRow, setSelectedRow] = useState<RecordData | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<
    Record<string, string>
  >(() =>
    filterFields.reduce<Record<string, string>>((acc, field) => {
      acc[field.name] = "";
      return acc;
    }, {}),
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearchKeyword(searchInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const listQuery = useMemo(
    () => ({
      page,
      pageSize,
      search: searchKeyword,
      ...advancedFilters,
    }),
    [advancedFilters, page, pageSize, searchKeyword],
  );

  const loadRows = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = buildQuery(listQuery);
      const { data, totalCount: apiTotal } = await requestApiData<unknown>(
        `/Topics/get-list${query}`,
        { method: "GET" },
        "Không thể tải danh sách đề tài.",
      );
      const normalized = normalizeList(data);
      setRows(normalized.items);
      setTotalCount(apiTotal > 0 ? apiTotal : normalized.fallbackTotal);
    } catch (error) {
      addToast(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách đề tài.",
        "error",
      );
      setRows([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [addToast, listQuery]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(totalCount / Math.max(1, pageSize))),
    [pageSize, totalCount],
  );

  const openCreate = async () => {
    try {
      const { data } = await requestApiData<RecordData>(
        "/Topics/get-create",
        { method: "GET" },
        "Không thể tải mẫu tạo mới.",
      );
      setFormValues(toFormRecord(data || {}));
    } catch {
      setFormValues(toFormRecord({}));
    }
    setSelectedRow(null);
    setActiveModal("create");
  };

  const openEdit = async (row: RecordData) => {
    const code = String(row.topicCode ?? "").trim();
    if (!code) {
      addToast("Không xác định được topicCode để cập nhật.", "error");
      return;
    }
    try {
      const { data } = await requestApiData<RecordData>(
        `/Topics/get-update/${encodeURIComponent(code)}`,
        { method: "GET" },
        "Không thể tải dữ liệu cập nhật.",
      );
      setFormValues(toFormRecord(data || row));
      setSelectedRow(row);
      setActiveModal("edit");
    } catch (error) {
      addToast(
        error instanceof Error
          ? error.message
          : "Không thể tải dữ liệu cập nhật.",
        "error",
      );
    }
  };

  const openDetail = async (row: RecordData) => {
    const code = String(row.topicCode ?? "").trim();
    if (!code) {
      setSelectedRow(row);
      setActiveModal("detail");
      return;
    }

    try {
      const { data } = await requestApiData<RecordData>(
        `/Topics/get-detail/${encodeURIComponent(code)}`,
        { method: "GET" },
        "Không thể tải chi tiết đề tài.",
      );
      setSelectedRow(data);
    } catch {
      setSelectedRow(row);
    }
    setActiveModal("detail");
  };

  const handleDelete = async (row: RecordData) => {
    const code = String(row.topicCode ?? "").trim();
    if (!code) {
      addToast("Không xác định được topicCode để xóa.", "error");
      return;
    }
    if (!window.confirm("Bạn chắc chắn muốn xóa bản ghi này?")) return;

    try {
      await requestApiData<unknown>(
        `/Topics/delete/${encodeURIComponent(code)}`,
        { method: "DELETE" },
        "Không thể xóa bản ghi.",
      );
      addToast("Xóa dữ liệu thành công.", "success");
      await loadRows();
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Không thể xóa bản ghi.",
        "error",
      );
    }
  };

  const handleSubmit = async () => {
    const payload = toPayload(formValues);
    const required = fields.find((field) => {
      if (!field.required) return false;
      const value = payload[field.name];
      return (
        value === null || value === undefined || String(value).trim() === ""
      );
    });
    if (required) {
      addToast(`Trường ${required.label} là bắt buộc.`, "warning");
      return;
    }

    const proposerUserID = Number(payload.proposerUserID ?? 0);
    const proposerUserCode = String(payload.proposerUserCode ?? "").trim();
    if (!proposerUserID && !proposerUserCode) {
      addToast("Cần proposerUserID hoặc proposerUserCode.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      if (activeModal === "create") {
        await requestApiData<RecordData>(
          "/Topics/create",
          { method: "POST", body: payload },
          "Không thể tạo bản ghi.",
        );
        addToast("Tạo mới thành công.", "success");
      }

      if (activeModal === "edit" && selectedRow) {
        const code = String(selectedRow.topicCode ?? "").trim();
        await requestApiData<RecordData>(
          `/Topics/update/${encodeURIComponent(code)}`,
          { method: "PUT", body: payload },
          "Không thể cập nhật bản ghi.",
        );
        addToast("Cập nhật thành công.", "success");
      }

      setActiveModal(null);
      await loadRows();
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Không thể lưu dữ liệu.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearchKeyword("");
    setAdvancedFilters(
      filterFields.reduce<Record<string, string>>((acc, field) => {
        acc[field.name] = "";
        return acc;
      }, {}),
    );
    setPage(1);
  };

  return (
    <div className="admin-dashboard topics-module">
      <div className="dashboard-header">
        <h1>Quản lý đề tài</h1>
        <p>
          Dữ liệu chuẩn theo schema Topics (title, summary, proposerUserCode,
          supervisorLecturerCode, status...).
        </p>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          padding: 16,
          marginBottom: 20,
          display: "grid",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flex: "1 1 300px",
            }}
          >
            <Search size={16} color="#64748b" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm kiếm nhanh..."
              style={{
                width: "100%",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                padding: "9px 12px",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
              style={{
                border: "1px solid #cbd5e1",
                background: "#fff",
                borderRadius: 8,
                padding: "8px 12px",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <Filter size={16} />{" "}
              {showAdvancedFilters ? "Ẩn lọc" : "Lọc nâng cao"}
            </button>
            <ImportExportActions
              moduleName="topics"
              moduleLabel="Quản lý đề tài"
              onImportSuccess={loadRows}
            />
            <button
              type="button"
              onClick={openCreate}
              style={{
                border: "none",
                background: "#f37021",
                color: "#fff",
                borderRadius: 8,
                padding: "9px 12px",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Plus size={16} /> Thêm mới
            </button>
          </div>
        </div>

        {showAdvancedFilters && (
          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: 12,
              display: "grid",
              gap: 10,
              background: "#f8fafc",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                gap: 10,
              }}
            >
              {filterFields.map((field) => (
                <label key={field.name} style={{ display: "grid", gap: 6 }}>
                  <span
                    style={{ fontSize: 13, color: "#334155", fontWeight: 600 }}
                  >
                    {field.label}
                  </span>
                  <input
                    type={
                      field.type === "number"
                        ? "number"
                        : field.type === "date"
                          ? "date"
                          : "text"
                    }
                    value={advancedFilters[field.name] ?? ""}
                    onChange={(event) => {
                      const next = event.target.value;
                      setAdvancedFilters((prev) => ({
                        ...prev,
                        [field.name]: next,
                      }));
                      setPage(1);
                    }}
                    style={{
                      border: "1px solid #cbd5e1",
                      borderRadius: 8,
                      padding: "8px 10px",
                      background: "#fff",
                    }}
                  />
                </label>
              ))}
            </div>

            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}
            >
              <button
                type="button"
                onClick={resetFilters}
                style={{
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  borderRadius: 8,
                  padding: "8px 12px",
                }}
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="recent-topics-section" style={{ overflowX: "auto" }}>
        <table className="topics-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
              <th style={{ textAlign: "center" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + 1}>Đang tải dữ liệu...</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1}>Không có dữ liệu.</td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={`topics-${index}-${String(row.topicCode ?? "")}`}>
                  {columns.map((column) => (
                    <td key={`${column.key}-${index}`}>
                      {toDisplay(getColumnValue(row, column))}
                    </td>
                  ))}
                  <td>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => void openDetail(row)}
                        style={{
                          border: "1px solid #cbd5e1",
                          borderRadius: 8,
                          padding: 6,
                          background: "#fff",
                        }}
                        title="Chi tiết"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void openEdit(row)}
                        style={{
                          border: "1px solid #cbd5e1",
                          borderRadius: 8,
                          padding: 6,
                          background: "#fff",
                        }}
                        title="Cập nhật"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(row)}
                        style={{
                          border: "1px solid #fecaca",
                          color: "#b91c1c",
                          borderRadius: 8,
                          padding: 6,
                          background: "#fff",
                        }}
                        title="Xóa"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
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
            <label
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <span style={{ color: "#64748b", fontSize: 13 }}>Page size</span>
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
                <option value={100}>100</option>
              </select>
            </label>

            <button
              type="button"
              disabled={page <= 1 || isLoading}
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
              disabled={page >= pageCount || isLoading}
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

      {activeModal && (
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
                {activeModal === "create" && "Tạo đề tài"}
                {activeModal === "edit" && "Cập nhật đề tài"}
                {activeModal === "detail" && "Chi tiết đề tài"}
              </h3>
            </div>

            {activeModal === "detail" ? (
              <div
                style={{
                  padding: "24px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: "16px",
                  background: "#f8fafc",
                }}
              >
                {Object.entries(selectedRow || {}).map(([key, value]) => {
                  const strVal = toDisplay(value);
                  const isLong = strVal.length > 60;
                  return (
                    <div
                      key={key}
                      style={{
                        padding: "16px",
                        background: "#fff",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                        gridColumn: isLong ? "1 / -1" : "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#64748b",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {key}
                      </span>
                      <span
                        style={{
                          fontSize: "15px",
                          color: "#0f172a",
                          lineHeight: "1.5",
                          wordBreak: "break-word",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {strVal || (
                          <span
                            style={{ color: "#94a3b8", fontStyle: "italic" }}
                          >
                            Trống
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  padding: 16,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
                  gap: 12,
                }}
              >
                {fields.map((field) => {
                  const value = formValues[field.name] ?? "";
                  return (
                    <label key={field.name} style={{ display: "grid", gap: 6 }}>
                      <span style={{ fontWeight: 600 }}>
                        {field.label}
                        {field.required ? " *" : ""}
                      </span>
                      {field.type === "textarea" ? (
                        <textarea
                          value={value}
                          onChange={(event) =>
                            setFormValues((prev) => ({
                              ...prev,
                              [field.name]: event.target.value,
                            }))
                          }
                          rows={3}
                          style={{
                            border: "1px solid #cbd5e1",
                            borderRadius: 8,
                            padding: 10,
                            resize: "vertical",
                          }}
                        />
                      ) : (
                        <input
                          type={
                            field.type === "number"
                              ? "number"
                              : field.type === "date"
                                ? "date"
                                : "text"
                          }
                          value={value}
                          onChange={(event) =>
                            setFormValues((prev) => ({
                              ...prev,
                              [field.name]: event.target.value,
                            }))
                          }
                          style={{
                            border: "1px solid #cbd5e1",
                            borderRadius: 8,
                            padding: 10,
                          }}
                        />
                      )}
                    </label>
                  );
                })}
              </div>
            )}

            <div
              style={{
                padding: 16,
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  borderRadius: 8,
                  padding: "9px 14px",
                }}
                disabled={isSubmitting}
              >
                Đóng
              </button>
              {activeModal !== "detail" && (
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={isSubmitting}
                  style={{
                    border: "none",
                    background: "#f37021",
                    color: "#fff",
                    borderRadius: 8,
                    padding: "9px 14px",
                    fontWeight: 600,
                  }}
                >
                  {isSubmitting ? "Đang lưu..." : "Lưu"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicsManagement;
