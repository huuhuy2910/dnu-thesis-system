import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Edit,
  Eye,
  Filter,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { fetchData } from "../../api/fetchData";
import { useToast } from "../../context/useToast";
import type { ApiResponse } from "../../types/api";
import "../admin/Dashboard.css";

type RecordData = Record<string, unknown>;

type ModalType = "detail" | "create" | "edit" | null;

type TagReadDto = {
  tagID: number;
  tagCode: string;
  tagName: string;
  description?: string;
  createdAt: string;
};

type DataImportResultDto = {
  module: string;
  format: string;
  totalRows: number;
  createdCount: number;
  updatedCount: number;
  failedCount: number;
  errors: string[];
};

const acceptedExtensions = ["xlsx", "csv", "json"] as const;

function toDisplay(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function getApiError(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    const source = payload as Record<string, unknown>;
    if (typeof source.message === "string" && source.message.trim()) {
      return source.message;
    }
    if (source.errors && typeof source.errors === "object") {
      const first = Object.values(source.errors as Record<string, unknown>)[0];
      if (Array.isArray(first) && typeof first[0] === "string") {
        return first[0];
      }
    }
  }
  return fallback;
}

function normalizeList(payload: unknown): {
  items: TagReadDto[];
  fallbackTotal: number;
} {
  if (Array.isArray(payload)) {
    return { items: payload as TagReadDto[], fallbackTotal: payload.length };
  }

  if (payload && typeof payload === "object") {
    const source = payload as Record<string, unknown>;
    const candidates = [
      source.items,
      source.records,
      source.result,
      source.data,
      source.list,
    ];
    const arr = candidates.find((candidate) => Array.isArray(candidate));
    if (Array.isArray(arr)) {
      return {
        items: arr as TagReadDto[],
        fallbackTotal: Number(
          source.totalCount ?? source.total ?? source.count ?? arr.length,
        ),
      };
    }
  }

  return { items: [], fallbackTotal: 0 };
}

function normalizeSuggestions(payload: unknown): string[] {
  if (Array.isArray(payload)) {
    return payload
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const source = item as Record<string, unknown>;
          const code = toDisplay(source.tagCode).trim();
          const name = toDisplay(source.tagName).trim();
          return [code, name].filter(Boolean).join(" - ");
        }
        return "";
      })
      .filter(Boolean)
      .slice(0, 8);
  }
  return [];
}

function formatDate(value: unknown): string {
  const raw = toDisplay(value);
  if (!raw) return "";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleString("vi-VN");
}

async function requestApiData<T>(
  path: string,
  options?: Parameters<typeof fetchData>[1],
  fallback = "Không thể xử lý yêu cầu.",
): Promise<{ data: T; totalCount: number; message: string | null }> {
  const response = await fetchData<ApiResponse<T>>(path, options);
  if (!response?.success) {
    throw new Error(response.message || response.title || fallback);
  }
  return {
    data: response.data as T,
    totalCount: Number(response.totalCount || 0),
    message: response.message || null,
  };
}

const TagsManagement: React.FC = () => {
  const { addToast } = useToast();

  const [rows, setRows] = useState<TagReadDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedRow, setSelectedRow] = useState<TagReadDto | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    tagCode: "",
    tagName: "",
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  const [formValues, setFormValues] = useState({
    tagCode: "",
    tagName: "",
    description: "",
  });

  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFormat, setImportFormat] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [importResult, setImportResult] = useState<DataImportResultDto | null>(
    null,
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearchKeyword(searchInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const q = searchInput.trim();
    if (!q) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      try {
        const { data } = await requestApiData<unknown>(
          `/Tags/search?q=${encodeURIComponent(q)}`,
          { method: "GET" },
          "Không thể tải gợi ý tag.",
        );
        if (cancelled) return;
        setSuggestions(normalizeSuggestions(data));
      } catch {
        if (cancelled) return;
        setSuggestions([]);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [searchInput]);

  const queryObject = useMemo(
    () => ({
      page,
      pageSize,
      search: searchKeyword,
      tagCode: filters.tagCode,
      tagName: filters.tagName,
    }),
    [filters.tagCode, filters.tagName, page, pageSize, searchKeyword],
  );

  const buildListQuery = useCallback(() => {
    const params = new URLSearchParams();
    Object.entries(queryObject).forEach(([key, value]) => {
      const normalized = String(value ?? "").trim();
      if (!normalized) return;
      params.append(key, normalized);
    });
    const query = params.toString();
    return query ? `?${query}` : "";
  }, [queryObject]);

  const loadRows = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = buildListQuery();
      const { data, totalCount: apiTotal } = await requestApiData<unknown>(
        `/Tags/list${query}`,
        { method: "GET" },
        "Không thể tải danh sách tags.",
      );
      const normalized = normalizeList(data);
      setRows(normalized.items);
      setTotalCount(apiTotal > 0 ? apiTotal : normalized.fallbackTotal);
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Không thể tải danh sách tags.",
        "error",
      );
      setRows([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [addToast, buildListQuery]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(totalCount / Math.max(1, pageSize))),
    [pageSize, totalCount],
  );

  const openCreate = () => {
    setSelectedRow(null);
    setFormValues({ tagCode: "", tagName: "", description: "" });
    setActiveModal("create");
  };

  const openEdit = async (row: TagReadDto) => {
    const id = Number(row.tagID || 0);
    if (!id) {
      addToast("Không xác định được tagID để cập nhật.", "error");
      return;
    }

    try {
      const { data } = await requestApiData<RecordData>(
        `/Tags/get-update/${id}`,
        { method: "GET" },
        "Không thể tải dữ liệu cập nhật tag.",
      );
      setFormValues({
        tagCode: toDisplay(data.tagCode || row.tagCode),
        tagName: toDisplay(data.tagName || row.tagName),
        description: toDisplay(data.description ?? row.description ?? ""),
      });
      setSelectedRow(row);
      setActiveModal("edit");
    } catch (error) {
      addToast(
        error instanceof Error
          ? error.message
          : "Không thể tải dữ liệu cập nhật tag.",
        "error",
      );
    }
  };

  const openDetail = async (row: TagReadDto) => {
    const code = String(row.tagCode || "").trim();
    if (!code) {
      setSelectedRow(row);
      setActiveModal("detail");
      return;
    }

    try {
      const { data } = await requestApiData<TagReadDto>(
        `/Tags/get-by-code/${encodeURIComponent(code)}`,
        { method: "GET" },
        "Không thể tải chi tiết tag.",
      );
      setSelectedRow(data || row);
    } catch {
      setSelectedRow(row);
    }
    setActiveModal("detail");
  };

  const handleDelete = async (row: TagReadDto) => {
    const id = Number(row.tagID || 0);
    if (!id) {
      addToast("Không xác định được tagID để xóa.", "error");
      return;
    }

    if (!window.confirm(`Bạn chắc chắn muốn xóa tag ${row.tagCode}?`)) return;

    setIsSubmitting(true);
    try {
      await requestApiData<unknown>(
        `/Tags/delete/${id}`,
        { method: "DELETE" },
        "Không thể xóa tag.",
      );
      addToast("Xóa tag thành công.", "success");
      await loadRows();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Không thể xóa tag.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!formValues.tagName.trim()) {
      addToast("Tag Name là bắt buộc.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      if (activeModal === "create") {
        await requestApiData<unknown>(
          "/Tags/create",
          {
            method: "POST",
            body: {
              tagCode: formValues.tagCode.trim(),
              tagName: formValues.tagName.trim(),
              description: formValues.description.trim(),
            },
          },
          "Không thể tạo tag.",
        );
        addToast("Tạo tag thành công.", "success");
      }

      if (activeModal === "edit" && selectedRow) {
        const id = Number(selectedRow.tagID || 0);
        await requestApiData<unknown>(
          `/Tags/update/${id}`,
          {
            method: "PUT",
            body: {
              tagName: formValues.tagName.trim(),
              description: formValues.description.trim(),
            },
          },
          "Không thể cập nhật tag.",
        );
        addToast("Cập nhật tag thành công.", "success");
      }

      setActiveModal(null);
      await loadRows();
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Không thể lưu tag.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const detectFormatByName = (fileName: string): string => {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    return acceptedExtensions.includes(ext as (typeof acceptedExtensions)[number])
      ? ext
      : "";
  };

  const setImportFileWithValidation = (file: File | null) => {
    if (!file) {
      setImportFile(null);
      return;
    }

    const ext = detectFormatByName(file.name);
    if (!ext) {
      addToast("File import chỉ chấp nhận .xlsx, .csv hoặc .json.", "warning");
      setImportFile(null);
      return;
    }

    setImportFile(file);
    if (!importFormat) {
      setImportFormat(ext);
    }
  };

  const handleImportSubmit = async () => {
    if (!importFile) {
      addToast("Vui lòng chọn file import.", "warning");
      return;
    }

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      if (importFormat) {
        formData.append("format", importFormat);
      }

      const response = await fetchData<ApiResponse<DataImportResultDto>>(
        "/Tags/import",
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.success || !response.data) {
        throw new Error(
          getApiError(response, "Không thể import danh sách tags."),
        );
      }

      setImportResult(response.data);
      addToast("Import tags thành công.", "success");
      await loadRows();
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Không thể import tags.",
        "error",
      );
    } finally {
      setIsImporting(false);
    }
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearchKeyword("");
    setFilters({ tagCode: "", tagName: "" });
    setPage(1);
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Tag Management</h1>
        <p>Quản lý tags: danh sách, CRUD và import dữ liệu từ file.</p>
      </div>

      <div
        style={{
          background: "white",
          padding: "16px 18px",
          borderRadius: 12,
          marginBottom: 20,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 10, flex: "1 1 460px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 260px", position: "relative" }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
              }}
            />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm theo mã/tên tag..."
              style={{
                width: "100%",
                padding: "9px 10px 9px 34px",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
              }}
            />
            {suggestions.length > 0 && searchInput.trim() ? (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: 0,
                  right: 0,
                  zIndex: 20,
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  background: "#fff",
                  boxShadow: "0 8px 18px rgba(15,23,42,0.12)",
                  maxHeight: 220,
                  overflowY: "auto",
                }}
              >
                {suggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setSearchInput(item);
                      setSuggestions([]);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      border: "none",
                      background: "#fff",
                      padding: "10px 12px",
                      cursor: "pointer",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setShowAdvancedFilters((prev) => !prev)}
            style={{
              border: "1px solid #cbd5e1",
              background: showAdvancedFilters ? "#fff7ed" : "#fff",
              borderRadius: 8,
              padding: "9px 12px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Filter size={16} /> Bộ lọc
          </button>

          <button
            type="button"
            onClick={() => {
              setPage(1);
              void loadRows();
            }}
            style={{
              border: "1px solid #cbd5e1",
              background: "#fff",
              borderRadius: 8,
              padding: "9px 12px",
              fontWeight: 600,
            }}
          >
            Tìm kiếm
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
            <Plus size={16} /> Create Tag
          </button>

          <button
            type="button"
            onClick={() => {
              setShowImportModal(true);
              setImportResult(null);
              setImportFile(null);
              setImportFormat("");
            }}
            style={{
              border: "1px solid #fdba74",
              background: "#fff",
              color: "#c2410c",
              borderRadius: 8,
              padding: "9px 12px",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Upload size={16} /> Import Tags
          </button>
        </div>
      </div>

      {showAdvancedFilters && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: 10,
          }}
        >
          <input
            value={filters.tagCode}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, tagCode: event.target.value }))
            }
            placeholder="Lọc theo TagCode"
            style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: 10 }}
          />
          <input
            value={filters.tagName}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, tagName: event.target.value }))
            }
            placeholder="Lọc theo TagName"
            style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: 10 }}
          />
          <button
            type="button"
            onClick={resetFilters}
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "10px 12px",
              background: "#fff",
              fontWeight: 600,
            }}
          >
            Xóa bộ lọc
          </button>
        </div>
      )}

      <div className="recent-topics-section" style={{ overflowX: "auto" }}>
        <table className="topics-table">
          <thead>
            <tr>
              <th>TagCode</th>
              <th>TagName</th>
              <th>Description</th>
              <th>CreatedAt</th>
              <th style={{ textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5}>Đang tải dữ liệu...</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5}>Không có dữ liệu tag.</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={`${row.tagID}-${row.tagCode}`}>
                  <td>{row.tagCode}</td>
                  <td>{row.tagName}</td>
                  <td>{row.description || ""}</td>
                  <td>{formatDate(row.createdAt)}</td>
                  <td>
                    <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => void openDetail(row)}
                        title="Chi tiết"
                        style={{
                          border: "1px solid #cbd5e1",
                          background: "#fff",
                          borderRadius: 8,
                          padding: 6,
                        }}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void openEdit(row)}
                        title="Cập nhật"
                        style={{
                          border: "1px solid #cbd5e1",
                          background: "#fff",
                          borderRadius: 8,
                          padding: 6,
                        }}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(row)}
                        title="Xóa"
                        disabled={isSubmitting}
                        style={{
                          border: "1px solid #fecaca",
                          background: "#fff",
                          color: "#b91c1c",
                          borderRadius: 8,
                          padding: 6,
                        }}
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
            Tổng tags: <strong>{totalCount}</strong>
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
              maxWidth: 620,
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ padding: 16, borderBottom: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: 0 }}>
                {activeModal === "create"
                  ? "Create Tag"
                  : activeModal === "edit"
                    ? "Update Tag"
                    : "Tag Detail"}
              </h3>
            </div>

            {activeModal === "detail" ? (
              <div style={{ padding: 16, display: "grid", gap: 8 }}>
                {Object.entries(selectedRow || {}).map(([key, value]) => (
                  <div
                    key={key}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "180px 1fr",
                      gap: 8,
                    }}
                  >
                    <strong>{key}</strong>
                    <span>{toDisplay(value)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: 16, display: "grid", gap: 10 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span>Tag Code (optional)</span>
                  <input
                    value={formValues.tagCode}
                    onChange={(event) =>
                      setFormValues((prev) => ({
                        ...prev,
                        tagCode: event.target.value,
                      }))
                    }
                    disabled={activeModal === "edit"}
                    style={{
                      border: "1px solid #cbd5e1",
                      borderRadius: 8,
                      padding: 10,
                      background: activeModal === "edit" ? "#f8fafc" : "#fff",
                    }}
                  />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span>Tag Name *</span>
                  <input
                    value={formValues.tagName}
                    onChange={(event) =>
                      setFormValues((prev) => ({
                        ...prev,
                        tagName: event.target.value,
                      }))
                    }
                    style={{
                      border: "1px solid #cbd5e1",
                      borderRadius: 8,
                      padding: 10,
                    }}
                  />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span>Description</span>
                  <textarea
                    value={formValues.description}
                    onChange={(event) =>
                      setFormValues((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    rows={4}
                    style={{
                      border: "1px solid #cbd5e1",
                      borderRadius: 8,
                      padding: 10,
                      fontFamily: "inherit",
                    }}
                  />
                </label>
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
                disabled={isSubmitting}
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: "8px 12px",
                }}
              >
                {activeModal === "detail" ? "Đóng" : "Hủy"}
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
                    padding: "8px 12px",
                  }}
                >
                  {isSubmitting
                    ? "Đang lưu..."
                    : activeModal === "create"
                      ? "Tạo tag"
                      : "Lưu cập nhật"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.45)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 90,
            padding: 14,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 760,
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              maxHeight: "88vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                padding: 16,
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0 }}>Import Tags</h3>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "#64748b",
                }}
                title="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 16, display: "grid", gap: 14 }}>
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setIsDragOver(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragOver(false);
                  const file = event.dataTransfer.files?.[0] || null;
                  setImportFileWithValidation(file);
                }}
                onClick={() => document.getElementById("tags-import-file")?.click()}
                style={{
                  border: `2px dashed ${isDragOver ? "#f37021" : "#cbd5e1"}`,
                  borderRadius: 12,
                  padding: "26px 18px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: isDragOver ? "#fff7ed" : "#f8fafc",
                }}
              >
                <Upload size={24} style={{ color: "#f37021", marginBottom: 8 }} />
                <div style={{ fontWeight: 600 }}>
                  Kéo thả file hoặc bấm để chọn file import
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
                  Hỗ trợ: .xlsx, .csv, .json
                </div>
                <input
                  id="tags-import-file"
                  type="file"
                  accept=".xlsx,.csv,.json"
                  style={{ display: "none" }}
                  onChange={(event) =>
                    setImportFileWithValidation(event.target.files?.[0] || null)
                  }
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 220px",
                  gap: 10,
                }}
              >
                <input
                  value={importFile?.name || ""}
                  readOnly
                  placeholder="Chưa chọn file"
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    padding: 10,
                    background: "#f8fafc",
                  }}
                />
                <select
                  value={importFormat}
                  onChange={(event) => setImportFormat(event.target.value)}
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    padding: 10,
                  }}
                >
                  <option value="">Auto detect format</option>
                  <option value="xlsx">xlsx</option>
                  <option value="csv">csv</option>
                  <option value="json">json</option>
                </select>
              </div>

              <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
                Cột/keys kỳ vọng: <strong>tagCode</strong> (optional),
                <strong> tagName</strong> (required), <strong>description</strong>
                (optional).
              </div>

              {importResult && (
                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 10,
                    padding: 12,
                    background: "#f8fafc",
                    display: "grid",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))",
                      gap: 8,
                    }}
                  >
                    <div><strong>Total:</strong> {importResult.totalRows}</div>
                    <div><strong>Created:</strong> {importResult.createdCount}</div>
                    <div><strong>Updated:</strong> {importResult.updatedCount}</div>
                    <div><strong>Failed:</strong> {importResult.failedCount}</div>
                  </div>

                  {importResult.errors?.length > 0 && (
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 8, color: "#b91c1c" }}>
                        Danh sách lỗi import
                      </div>
                      <div
                        style={{
                          maxHeight: 170,
                          overflowY: "auto",
                          border: "1px solid #fecaca",
                          borderRadius: 8,
                          background: "#fff1f2",
                          padding: 8,
                        }}
                      >
                        {importResult.errors.map((item, idx) => (
                          <div key={`${item}-${idx}`} style={{ fontSize: 12, color: "#9f1239" }}>
                            - {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

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
                onClick={() => setShowImportModal(false)}
                disabled={isImporting}
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: "8px 12px",
                }}
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => void handleImportSubmit()}
                disabled={isImporting || !importFile}
                style={{
                  border: "none",
                  background: isImporting || !importFile ? "#94a3b8" : "#f37021",
                  color: "#fff",
                  borderRadius: 8,
                  padding: "8px 12px",
                }}
              >
                {isImporting ? "Đang import..." : "Import"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagsManagement;
