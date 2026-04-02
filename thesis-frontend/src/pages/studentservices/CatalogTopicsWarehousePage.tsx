import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Filter,
  Search,
} from "lucide-react";
import { fetchData, FetchDataError } from "../../api/fetchData";
import ImportExportActions from "../../components/admin/ImportExportActions";
import { useToast } from "../../context/useToast";
import type { ApiResponse } from "../../types/api";
import "../admin/Dashboard.css";

type CatalogTopicTagDto = {
  tagID: number;
  tagCode: string;
  tagName: string;
};

type CatalogTopicWithTagsDto = {
  catalogTopicID: number;
  catalogTopicCode: string;
  title: string;
  summary: string;
  departmentCode: string;
  assignedStatus: string;
  assignedAt: string;
  createdAt: string;
  lastUpdated: string;
  tags: CatalogTopicTagDto[];
};

type WarehouseFilters = {
  title: string;
  catalogTopicCode: string;
  departmentCode: string;
  assignedStatus: string;
  tagCode: string;
  tagName: string;
  fromDate: string;
  toDate: string;
};

type SortableField =
  | "catalogTopicCode"
  | "title"
  | "departmentCode"
  | "assignedStatus"
  | "createdAt"
  | "lastUpdated";

const sectionCardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
  padding: 16,
  display: "grid",
  gap: 12,
};

function normalizeCatalogTopicsWithTags(payload: unknown): {
  items: CatalogTopicWithTagsDto[];
  fallbackTotal: number;
} {
  if (Array.isArray(payload)) {
    return {
      items: payload as CatalogTopicWithTagsDto[],
      fallbackTotal: payload.length,
    };
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
    const list = candidates.find((item) => Array.isArray(item));
    if (Array.isArray(list)) {
      return {
        items: list as CatalogTopicWithTagsDto[],
        fallbackTotal: Number(
          source.totalCount ?? source.total ?? source.count ?? list.length,
        ),
      };
    }
  }

  return { items: [], fallbackTotal: 0 };
}

function formatDateTime(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
}

function normalizeQueryParams(
  source: Record<string, string | number | boolean | null | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();
  Object.entries(source).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    const normalized = String(value).trim();
    if (!normalized) return;
    params.append(key, normalized);
  });
  return params;
}

function getReadableError(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    const source = payload as Record<string, unknown>;
    if (typeof source.message === "string" && source.message.trim()) {
      return source.message;
    }
    if (typeof source.title === "string" && source.title.trim()) {
      return source.title;
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

const CatalogTopicsWarehousePage: React.FC = () => {
  const { addToast } = useToast();

  const [rows, setRows] = useState<CatalogTopicWithTagsDto[]>([]);
  const [isLoadingRows, setIsLoadingRows] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<WarehouseFilters>({
    title: "",
    catalogTopicCode: "",
    departmentCode: "",
    assignedStatus: "",
    tagCode: "",
    tagName: "",
    fromDate: "",
    toDate: "",
  });
  const [sortBy, setSortBy] = useState<SortableField>("lastUpdated");
  const [sortDescending, setSortDescending] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearchKeyword(searchInput.trim());
      setPage(1);
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(totalCount / Math.max(1, pageSize))),
    [pageSize, totalCount],
  );

  const queryParams = useMemo(
    () =>
      normalizeQueryParams({
        page,
        pageSize,
        search: searchKeyword,
        title: filters.title,
        catalogTopicCode: filters.catalogTopicCode,
        departmentCode: filters.departmentCode,
        assignedStatus: filters.assignedStatus,
        tagCode: filters.tagCode,
        tagName: filters.tagName,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        sortBy,
        sortDescending,
      }),
    [
      filters.assignedStatus,
      filters.catalogTopicCode,
      filters.departmentCode,
      filters.fromDate,
      filters.tagCode,
      filters.tagName,
      filters.title,
      filters.toDate,
      page,
      pageSize,
      searchKeyword,
      sortBy,
      sortDescending,
    ],
  );

  const loadRows = useCallback(async () => {
    setIsLoadingRows(true);
    try {
      const response = await fetchData<ApiResponse<unknown>>(
        `/CatalogTopics/get-list-with-tags?${queryParams.toString()}`,
        { method: "GET" },
      );

      if (!response?.success) {
        throw new Error(
          response?.message || "Không thể tải danh sách kho đề tài.",
        );
      }

      const normalized = normalizeCatalogTopicsWithTags(response.data);
      setRows(normalized.items);
      setTotalCount(
        Number(response.totalCount || 0) > 0
          ? Number(response.totalCount || 0)
          : normalized.fallbackTotal,
      );
    } catch (error) {
      const message =
        error instanceof FetchDataError
          ? getReadableError(error.data, error.message)
          : error instanceof Error
            ? error.message
            : "Không thể tải danh sách kho đề tài.";
      addToast(message, "error");
    } finally {
      setIsLoadingRows(false);
    }
  }, [addToast, queryParams]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const updateFilter = (key: keyof WarehouseFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearchKeyword("");
    setFilters({
      title: "",
      catalogTopicCode: "",
      departmentCode: "",
      assignedStatus: "",
      tagCode: "",
      tagName: "",
      fromDate: "",
      toDate: "",
    });
    setSortBy("lastUpdated");
    setSortDescending(true);
    setPage(1);
  };

  const toggleSort = (field: SortableField) => {
    setPage(1);
    if (sortBy === field) {
      setSortDescending((prev) => !prev);
      return;
    }
    setSortBy(field);
    setSortDescending(false);
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Kho đề tài có sẵn</h1>
        <p>
          Quản lý danh sách CatalogTopics theo API mới kèm tags, đồng thời vẫn
          hỗ trợ import danh mục theo file.
        </p>
      </div>

      <div style={sectionCardStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 1 320px", minWidth: 280 }}>
            <Search size={16} color="#64748b" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm kiếm theo search..."
              style={{
                width: "100%",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                padding: "9px 12px",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", flex: "0 1 auto" }}>
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                padding: "8px 12px",
                background: showFilters ? "#fff7ed" : "#fff",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontWeight: 600,
              }}
            >
              <Filter size={16} />
              {showFilters ? "Ẩn bộ lọc" : "Bộ lọc nâng cao"}
            </button>

            <select
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value as SortableField);
                setPage(1);
              }}
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                padding: "8px 10px",
                background: "#fff",
              }}
            >
              <option value="lastUpdated">Sort: lastUpdated</option>
              <option value="createdAt">Sort: createdAt</option>
              <option value="title">Sort: title</option>
              <option value="catalogTopicCode">Sort: catalogTopicCode</option>
              <option value="departmentCode">Sort: departmentCode</option>
              <option value="assignedStatus">Sort: assignedStatus</option>
            </select>

            <button
              type="button"
              onClick={() => {
                setSortDescending((prev) => !prev);
                setPage(1);
              }}
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                padding: "8px 12px",
                background: "#fff",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontWeight: 600,
              }}
            >
              {sortDescending ? (
                <ArrowDownWideNarrow size={16} />
              ) : (
                <ArrowUpWideNarrow size={16} />
              )}
              {sortDescending ? "DESC" : "ASC"}
            </button>

            <ImportExportActions
              moduleName="catalogtopics"
              moduleLabel="Kho đề tài có sẵn"
              onImportSuccess={loadRows}
            />
          </div>
        </div>

        {showFilters && (
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
                gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                gap: 10,
              }}
            >
              <input
                value={filters.catalogTopicCode}
                onChange={(event) =>
                  updateFilter("catalogTopicCode", event.target.value)
                }
                placeholder="Mã đề tài"
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: 8,
                }}
              />
              <input
                value={filters.title}
                onChange={(event) => updateFilter("title", event.target.value)}
                placeholder="Tiêu đề"
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: 8,
                }}
              />
              <input
                value={filters.departmentCode}
                onChange={(event) =>
                  updateFilter("departmentCode", event.target.value)
                }
                placeholder="Khoa"
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: 8,
                }}
              />
              <input
                value={filters.assignedStatus}
                onChange={(event) =>
                  updateFilter("assignedStatus", event.target.value)
                }
                placeholder="Trạng thái"
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: 8,
                }}
              />
              <input
                value={filters.tagCode}
                onChange={(event) =>
                  updateFilter("tagCode", event.target.value)
                }
                placeholder="Mã tag"
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: 8,
                }}
              />
              <input
                value={filters.tagName}
                onChange={(event) =>
                  updateFilter("tagName", event.target.value)
                }
                placeholder="Tên tag"
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: 8,
                }}
              />
              <input
                type="date"
                value={filters.fromDate}
                onChange={(event) =>
                  updateFilter("fromDate", event.target.value)
                }
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: 8,
                }}
              />
              <input
                type="date"
                value={filters.toDate}
                onChange={(event) => updateFilter("toDate", event.target.value)}
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: 8,
                }}
              />
            </div>

            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}
            >
              <button
                type="button"
                onClick={resetFilters}
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: "8px 12px",
                  background: "#fff",
                }}
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        )}

      </div>

      <div style={sectionCardStyle}>
        <div style={{ overflowX: "auto" }}>
          <table className="topics-table">
            <thead>
              <tr>
                <th>
                  <button
                    type="button"
                    onClick={() => toggleSort("catalogTopicCode")}
                    style={{
                      border: "none",
                      background: "transparent",
                      fontWeight: 700,
                    }}
                  >
                    Mã đề tài
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    onClick={() => toggleSort("title")}
                    style={{
                      border: "none",
                      background: "transparent",
                      fontWeight: 700,
                    }}
                  >
                    Tiêu đề
                  </button>
                </th>
                <th>Tóm tắt</th>
                <th>
                  <button
                    type="button"
                    onClick={() => toggleSort("departmentCode")}
                    style={{
                      border: "none",
                      background: "transparent",
                      fontWeight: 700,
                    }}
                  >
                    Khoa
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    onClick={() => toggleSort("assignedStatus")}
                    style={{
                      border: "none",
                      background: "transparent",
                      fontWeight: 700,
                    }}
                  >
                    Trạng thái
                  </button>
                </th>
                <th>Tags</th>
                <th>
                  <button
                    type="button"
                    onClick={() => toggleSort("createdAt")}
                    style={{
                      border: "none",
                      background: "transparent",
                      fontWeight: 700,
                    }}
                  >
                    Ngày tạo
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    onClick={() => toggleSort("lastUpdated")}
                    style={{
                      border: "none",
                      background: "transparent",
                      fontWeight: 700,
                    }}
                  >
                    Cập nhật
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoadingRows ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    {Array.from({ length: 8 }).map((__, idx) => (
                      <td key={`skeleton-${index}-${idx}`}>
                        <div
                          style={{
                            height: 14,
                            borderRadius: 999,
                            background: "#e2e8f0",
                            width: idx % 2 === 0 ? "70%" : "95%",
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8}>Không có dữ liệu kho đề tài.</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={`catalogtopic-${row.catalogTopicID}`}>
                    <td>{row.catalogTopicCode || "--"}</td>
                    <td>{row.title || "--"}</td>
                    <td>{row.summary || "--"}</td>
                    <td>{row.departmentCode || "--"}</td>
                    <td>{row.assignedStatus || "--"}</td>
                    <td>
                      {Array.isArray(row.tags) && row.tags.length > 0 ? (
                        <div
                          style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
                        >
                          {row.tags.map((tag) => (
                            <span
                              key={`${row.catalogTopicID}-${tag.tagID}`}
                              style={{
                                border: "1px solid #fed7aa",
                                color: "#9a3412",
                                background: "#fff7ed",
                                borderRadius: 999,
                                padding: "2px 8px",
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              {tag.tagCode || tag.tagName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        "--"
                      )}
                    </td>
                    <td>{formatDateTime(row.createdAt)}</td>
                    <td>{formatDateTime(row.lastUpdated)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
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
              </select>
            </label>

            <button
              type="button"
              disabled={page <= 1 || isLoadingRows}
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
              disabled={page >= pageCount || isLoadingRows}
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

    </div>
  );
};

export default CatalogTopicsWarehousePage;
