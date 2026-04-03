import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Eye,
  Filter,
  Loader2,
  PencilLine,
  Search,
  Trash2,
  X,
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

type CatalogTopicEligibleLecturerDto = {
  lecturerProfileID: number;
  lecturerCode: string;
  userCode: string;
  departmentCode: string;
  degree: string;
  guideQuota: number;
  defenseQuota: number;
  currentGuidingCount: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  tags: CatalogTopicTagDto[];
};

type CatalogTopicDetailDto = CatalogTopicWithTagsDto & {
  eligibleLecturers: CatalogTopicEligibleLecturerDto[];
};

type CatalogTopicEditForm = {
  title: string;
  summary: string;
  departmentCode: string;
  assignedStatus: string;
  assignedAt: string;
  tagCodes: string;
};

type ModalMode = "detail" | "edit" | null;

type TagLookupDto = {
  tagID: number;
  tagCode: string;
  tagName: string;
  description?: string;
  createdAt?: string;
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

function normalizeCatalogTopicDetail(
  payload: unknown,
  fallback: CatalogTopicWithTagsDto,
): CatalogTopicDetailDto {
  const source = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const tags = Array.isArray(source.tags) ? (source.tags as CatalogTopicTagDto[]) : fallback.tags;
  const eligibleLecturers = Array.isArray(source.eligibleLecturers)
    ? (source.eligibleLecturers as CatalogTopicEligibleLecturerDto[])
    : [];

  return {
    catalogTopicID: Number(source.catalogTopicID ?? fallback.catalogTopicID),
    catalogTopicCode: String(source.catalogTopicCode ?? fallback.catalogTopicCode),
    title: String(source.title ?? fallback.title ?? ""),
    summary: String(source.summary ?? fallback.summary ?? ""),
    departmentCode: String(source.departmentCode ?? fallback.departmentCode ?? ""),
    assignedStatus: String(source.assignedStatus ?? fallback.assignedStatus ?? ""),
    assignedAt: (source.assignedAt as string | null | undefined) ?? fallback.assignedAt,
    createdAt: String(source.createdAt ?? fallback.createdAt ?? ""),
    lastUpdated: String(source.lastUpdated ?? fallback.lastUpdated ?? ""),
    tags,
    eligibleLecturers,
  };
}

function formatDateTime(value: string | null | undefined): string {
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

function normalizeTagLookup(payload: unknown): TagLookupDto[] {
  if (Array.isArray(payload)) {
    return payload.filter((item) => item && typeof item === "object") as TagLookupDto[];
  }

  if (payload && typeof payload === "object") {
    const source = payload as Record<string, unknown>;
    const candidates = [source.items, source.records, source.result, source.data, source.list];
    const list = candidates.find((item) => Array.isArray(item));
    if (Array.isArray(list)) {
      return list.filter((item) => item && typeof item === "object") as TagLookupDto[];
    }
  }

  return [];
}

function normalizeDateTimeInput(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (input: number) => String(input).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseTagCodes(value: string): string[] {
  return value
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

const CatalogTopicsWarehousePage: React.FC = () => {
  const { addToast } = useToast();

  const [rows, setRows] = useState<CatalogTopicWithTagsDto[]>([]);
  const [tagLookup, setTagLookup] = useState<TagLookupDto[]>([]);
  const [isLoadingRows, setIsLoadingRows] = useState(false);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
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
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedTopic, setSelectedTopic] = useState<CatalogTopicDetailDto | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [isModalSaving, setIsModalSaving] = useState(false);
  const [isTagPickerOpen, setIsTagPickerOpen] = useState(false);
  const [tagPickerSearch, setTagPickerSearch] = useState("");
  const [tagSelectionDraft, setTagSelectionDraft] = useState<string[]>([]);
  const [editForm, setEditForm] = useState<CatalogTopicEditForm>({
    title: "",
    summary: "",
    departmentCode: "",
    assignedStatus: "",
    assignedAt: "",
    tagCodes: "",
  });

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

  const tagLookupMap = useMemo(
    () => new Map(tagLookup.map((tag) => [tag.tagCode.trim().toLowerCase(), tag])),
    [tagLookup],
  );

  const selectedTagCodes = useMemo(
    () => parseTagCodes(editForm.tagCodes),
    [editForm.tagCodes],
  );

  const filteredTagOptions = useMemo(() => {
    const keyword = tagPickerSearch.trim().toLowerCase();
    if (!keyword) return tagLookup;

    return tagLookup.filter((tag) => {
      const haystack = [tag.tagCode, tag.tagName, tag.description ?? ""].join(" ").toLowerCase();
      return haystack.includes(keyword);
    });
  }, [tagLookup, tagPickerSearch]);

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

  const loadTags = useCallback(async () => {
    setIsLoadingTags(true);
    try {
      const response = await fetchData<ApiResponse<unknown>>(
        "/Tags/list?Page=0&PageSize=100",
        { method: "GET" },
      );

      if (!response?.success) {
        throw new Error(response?.message || "Không thể tải danh sách tag.");
      }

      setTagLookup(normalizeTagLookup(response.data));
    } catch {
      setTagLookup([]);
    } finally {
      setIsLoadingTags(false);
    }
  }, []);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  useEffect(() => {
    void loadTags();
  }, [loadTags]);

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

  const closeModal = () => {
    setModalMode(null);
    setSelectedTopic(null);
    setIsModalLoading(false);
    setIsModalSaving(false);
    setIsTagPickerOpen(false);
    setTagPickerSearch("");
    setTagSelectionDraft([]);
  };

  const openTagPicker = () => {
    setTagSelectionDraft(selectedTagCodes);
    setTagPickerSearch("");
    setIsTagPickerOpen(true);
  };

  const toggleTagSelection = (tagCode: string) => {
    setTagSelectionDraft((prev) =>
      prev.some((item) => item.toLowerCase() === tagCode.toLowerCase())
        ? prev.filter((item) => item.toLowerCase() !== tagCode.toLowerCase())
        : [...prev, tagCode],
    );
  };

  const applyTagSelection = () => {
    setEditForm((prev) => ({
      ...prev,
      tagCodes: tagSelectionDraft.join(", "),
    }));
    setIsTagPickerOpen(false);
  };

  const openDetail = async (row: CatalogTopicWithTagsDto) => {
    setModalMode("detail");
    setSelectedTopic(null);
    setIsModalLoading(true);
    try {
      const response = await fetchData<ApiResponse<unknown>>(
        `/CatalogTopics/get-detail/${encodeURIComponent(row.catalogTopicCode)}`,
        { method: "GET" },
      );

      if (!response?.success) {
        throw new Error(response?.message || "Không thể tải chi tiết đề tài.");
      }

      setSelectedTopic(normalizeCatalogTopicDetail(response.data, row));
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Không thể tải chi tiết đề tài.",
        "error",
      );
      closeModal();
    } finally {
      setIsModalLoading(false);
    }
  };

  const openEdit = async (row: CatalogTopicWithTagsDto) => {
    setModalMode("edit");
    setSelectedTopic(null);
    setIsModalLoading(true);
    try {
      const response = await fetchData<ApiResponse<unknown>>(
        `/CatalogTopics/get-update/${encodeURIComponent(row.catalogTopicCode)}`,
        { method: "GET" },
      );

      if (!response?.success) {
        throw new Error(response?.message || "Không thể tải dữ liệu sửa.");
      }

      const payload = (response.data as Record<string, unknown>) || {};
      const tags = Array.isArray(payload.tags) ? (payload.tags as CatalogTopicTagDto[]) : row.tags;
      setSelectedTopic({
        ...row,
        ...payload,
        tags,
        eligibleLecturers: [],
      } as CatalogTopicDetailDto);
      setEditForm({
        title: String(payload.title ?? row.title ?? ""),
        summary: String(payload.summary ?? row.summary ?? ""),
        departmentCode: String(payload.departmentCode ?? row.departmentCode ?? ""),
        assignedStatus: String(payload.assignedStatus ?? row.assignedStatus ?? ""),
        assignedAt: normalizeDateTimeInput((payload.assignedAt as string | null | undefined) ?? row.assignedAt),
        tagCodes: tags.length > 0 ? tags.map((tag) => tag.tagCode).join(", ") : row.tags.map((tag) => tag.tagCode).join(", "),
      });
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Không thể tải dữ liệu sửa.",
        "error",
      );
      closeModal();
    } finally {
      setIsModalLoading(false);
    }
  };

  const saveEdit = async () => {
    if (!selectedTopic) return;
    setIsModalSaving(true);
    try {
      const normalizedCodes = selectedTagCodes;
      const resolvedTags = normalizedCodes
        .map((code) => tagLookupMap.get(code.toLowerCase()))
        .filter((item): item is TagLookupDto => Boolean(item));

      await fetchData(`/CatalogTopics/update/${encodeURIComponent(selectedTopic.catalogTopicCode)}`, {
        method: "PUT",
        body: {
          title: editForm.title.trim(),
          summary: editForm.summary.trim(),
          departmentCode: editForm.departmentCode.trim(),
          assignedStatus: editForm.assignedStatus.trim(),
          assignedAt: editForm.assignedAt ? new Date(editForm.assignedAt).toISOString() : null,
          tagIDs: resolvedTags.map((tag) => tag.tagID),
          tagCodes: normalizedCodes,
        },
      });

      addToast("Cập nhật đề tài thành công.", "success");
      closeModal();
      void loadRows();
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Không thể cập nhật đề tài.",
        "error",
      );
    } finally {
      setIsModalSaving(false);
    }
  };

  const removeTopic = async (row: CatalogTopicWithTagsDto) => {
    if (!window.confirm(`Bạn chắc chắn muốn xóa đề tài ${row.catalogTopicCode}?`)) return;

    try {
      await fetchData(`/CatalogTopics/delete/${encodeURIComponent(row.catalogTopicCode)}`, {
        method: "DELETE",
      });
      addToast("Xóa đề tài thành công.", "success");
      void loadRows();
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Không thể xóa đề tài.",
        "error",
      );
    }
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flex: "1 1 320px",
              minWidth: 280,
            }}
          >
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

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              alignItems: "center",
              flex: "0 1 auto",
            }}
          >
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
          <table
            className="topics-table"
            style={{ width: "100%", tableLayout: "fixed", minWidth: 0 }}
          >
            <colgroup>
              <col style={{ width: "13%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "30%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "16%" }} />
            </colgroup>
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
                <th style={{ textAlign: "center" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingRows ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    {Array.from({ length: 7 }).map((__, idx) => (
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
                  <td colSpan={7}>Không có dữ liệu kho đề tài.</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={`catalogtopic-${row.catalogTopicID}`}>
                    <td>{row.catalogTopicCode || "--"}</td>
                    <td style={{ wordBreak: "break-word" }}>{row.title || "--"}</td>
                    <td>
                      <div
                        title={row.summary || ""}
                        style={{
                          width: "100%",
                          display: "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: 2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "normal",
                          lineHeight: 1.5,
                        }}
                      >
                        {row.summary || "--"}
                      </div>
                    </td>
                    <td>{row.departmentCode || "--"}</td>
                    <td>{row.assignedStatus || "--"}</td>
                    <td>
                      {Array.isArray(row.tags) && row.tags.length > 0 ? (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
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
                    <td>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => void openDetail(row)}
                          title="Xem chi tiết"
                          style={{
                            border: "1px solid #cbd5e1",
                            background: "#fff",
                            borderRadius: 8,
                            padding: 6,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void openEdit(row)}
                          title="Sửa"
                          style={{
                            border: "1px solid #fcd34d",
                            background: "#fff",
                            color: "#b45309",
                            borderRadius: 8,
                            padding: 6,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                        >
                          <PencilLine size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeTopic(row)}
                          title="Xóa"
                          style={{
                            border: "1px solid #fecaca",
                            background: "#fff",
                            color: "#b91c1c",
                            borderRadius: 8,
                            padding: 6,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
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

      {modalMode && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 150,
            background: "rgba(15,23,42,0.58)",
            backdropFilter: "blur(4px)",
            padding: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "min(1400px, 100%)",
              maxHeight: "92vh",
              overflow: "hidden",
              borderRadius: 24,
              background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
              border: "1px solid rgba(148,163,184,0.28)",
              boxShadow: "0 28px 80px rgba(15,23,42,0.35)",
              display: "grid",
              gridTemplateRows: "auto 1fr auto",
            }}
          >
            <div
              style={{
                padding: 24,
                borderBottom: "1px solid rgba(148,163,184,0.18)",
                background:
                  "linear-gradient(135deg, rgba(243,112,33,0.08), rgba(14,165,233,0.05))",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
              }}
            >
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: "rgba(243,112,33,0.12)",
                    color: "#c2410c",
                    fontSize: 12,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: 0.06,
                  }}
                >
                  Data exchange
                </div>
                <h3 style={{ margin: "10px 0 6px", fontSize: 28, lineHeight: 1.1, color: "#0f172a" }}>
                  {modalMode === "detail"
                    ? `Chi tiết ${selectedTopic?.catalogTopicCode || "đề tài"}`
                    : `Sửa ${selectedTopic?.catalogTopicCode || "đề tài"}`}
                </h3>
                <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6, maxWidth: 860 }}>
                  {modalMode === "detail"
                    ? "Xem đầy đủ thông tin đề tài, danh sách tag và danh sách giảng viên đủ điều kiện."
                    : "Chỉnh sửa thông tin đề tài và cập nhật quan hệ tag theo tagCode."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ overflow: "auto", padding: 24, display: "grid", gap: 16 }}>
              {isModalLoading ? (
                <div
                  style={{
                    minHeight: 280,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    color: "#475569",
                    fontWeight: 600,
                  }}
                >
                  <Loader2 size={18} className="spin" /> Đang tải dữ liệu...
                </div>
              ) : modalMode === "detail" ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "0.95fr 1.05fr",
                    gap: 16,
                    alignItems: "start",
                  }}
                >
                  <div style={sectionCardStyle}>
                    <div style={{ display: "grid", gap: 8 }}>
                      <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Thông tin chính</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", lineHeight: 1.25 }}>
                        {selectedTopic?.title || "--"}
                      </div>
                      <div style={{ color: "#475569", lineHeight: 1.6 }}>{selectedTopic?.summary || "--"}</div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                      {[
                        ["Mã đề tài", selectedTopic?.catalogTopicCode],
                        ["Khoa/Bộ môn", selectedTopic?.departmentCode],
                        ["Trạng thái", selectedTopic?.assignedStatus],
                        ["Assigned at", formatDateTime(selectedTopic?.assignedAt ?? null)],
                        ["Created at", formatDateTime(selectedTopic?.createdAt ?? null)],
                        ["Last updated", formatDateTime(selectedTopic?.lastUpdated ?? null)],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          style={{
                            border: "1px solid #e2e8f0",
                            borderRadius: 14,
                            background: "linear-gradient(180deg, #fff, #f8fafc)",
                            padding: 12,
                            display: "grid",
                            gap: 6,
                          }}
                        >
                          <div style={{ color: "#64748b", fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>{label}</div>
                          <div style={{ color: "#0f172a", fontWeight: 700, lineHeight: 1.4 }}>{value || "--"}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 16 }}>
                    <div style={sectionCardStyle}>
                      <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Tags</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {selectedTopic?.tags?.length ? (
                          selectedTopic.tags.map((tag) => (
                            <span
                              key={tag.tagID}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "7px 10px",
                                borderRadius: 999,
                                background: "#fff7ed",
                                border: "1px solid #fed7aa",
                                color: "#9a3412",
                                fontSize: 13,
                                fontWeight: 700,
                              }}
                            >
                              {tag.tagCode}
                              <span style={{ color: "#c2410c", fontWeight: 600 }}>{tag.tagName}</span>
                            </span>
                          ))
                        ) : (
                          <div style={{ color: "#64748b", fontSize: 13 }}>Chưa có tag.</div>
                        )}
                      </div>
                    </div>

                    <div style={sectionCardStyle}>
                      <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Giảng viên đủ điều kiện</div>
                      {selectedTopic?.eligibleLecturers?.length ? (
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                            <thead>
                              <tr>
                                <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #e2e8f0", color: "#334155", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.04 }}>Giảng viên</th>
                                <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #e2e8f0", color: "#334155", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.04 }}>Khoa</th>
                                <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #e2e8f0", color: "#334155", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.04 }}>Học vị</th>
                                <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #e2e8f0", color: "#334155", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.04 }}>Quota</th>
                                <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #e2e8f0", color: "#334155", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.04 }}>Tag</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedTopic.eligibleLecturers.map((lecturer) => (
                                <tr key={lecturer.lecturerProfileID} style={{ verticalAlign: "top" }}>
                                  <td style={{ padding: "12px", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>
                                    <div style={{ fontWeight: 800, color: "#0f172a", lineHeight: 1.4, whiteSpace: "nowrap" }}>{lecturer.fullName}</div>
                                    <div style={{ color: "#64748b", fontSize: 13, marginTop: 4, lineHeight: 1.4, whiteSpace: "nowrap" }}>
                                      {lecturer.email || "--"} · {lecturer.phoneNumber || "--"}
                                    </div>
                                  </td>
                                  <td style={{ padding: "12px", borderBottom: "1px solid #f1f5f9", color: "#334155" }}>
                                    {lecturer.departmentCode || "--"}
                                  </td>
                                  <td style={{ padding: "12px", borderBottom: "1px solid #f1f5f9" }}>
                                    <span className="status-badge in-progress">{lecturer.degree || "--"}</span>
                                  </td>
                                  <td style={{ padding: "12px", borderBottom: "1px solid #f1f5f9", color: "#334155" }}>
                                    <div style={{ display: "grid", gap: 4 }}>
                                      <span>Hướng dẫn: {lecturer.currentGuidingCount}/{lecturer.guideQuota}</span>
                                      <span>Bảo vệ: {lecturer.defenseQuota}</span>
                                    </div>
                                  </td>
                                  <td style={{ padding: "12px", borderBottom: "1px solid #f1f5f9" }}>
                                    {Array.isArray(lecturer.tags) && lecturer.tags.length > 0 ? (
                                      <div style={{ display: "flex", flexWrap: "nowrap", gap: 6, overflowX: "auto" }}>
                                        {lecturer.tags.map((tag) => (
                                          <span
                                            key={`${lecturer.lecturerProfileID}-${tag.tagID}`}
                                            style={{
                                              padding: "4px 8px",
                                              borderRadius: 999,
                                              background: "#eff6ff",
                                              border: "1px solid #bfdbfe",
                                              color: "#1d4ed8",
                                              fontSize: 12,
                                              fontWeight: 700,
                                            }}
                                          >
                                            {tag.tagCode}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span style={{ color: "#64748b", fontSize: 13 }}>--</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div style={{ color: "#64748b", fontSize: 13 }}>Chưa có giảng viên đủ điều kiện.</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16, alignItems: "start" }}>
                  <div style={sectionCardStyle}>
                    <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Thông tin chỉnh sửa</div>
                    <div style={{ display: "grid", gap: 12 }}>
                      <label style={{ display: "grid", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Tiêu đề</span>
                        <input
                          value={editForm.title}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, title: event.target.value }))}
                          style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: "10px 12px", background: "#fff" }}
                        />
                      </label>

                      <label style={{ display: "grid", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Tóm tắt</span>
                        <textarea
                          value={editForm.summary}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, summary: event.target.value }))}
                          rows={6}
                          style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: 12, background: "#fff", fontFamily: "inherit", resize: "vertical" }}
                        />
                      </label>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                        <label style={{ display: "grid", gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Mã khoa/bộ môn</span>
                          <input
                            value={editForm.departmentCode}
                            onChange={(event) => setEditForm((prev) => ({ ...prev, departmentCode: event.target.value }))}
                            style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: "10px 12px", background: "#fff" }}
                          />
                        </label>

                        <label style={{ display: "grid", gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Trạng thái</span>
                          <input
                            value={editForm.assignedStatus}
                            onChange={(event) => setEditForm((prev) => ({ ...prev, assignedStatus: event.target.value }))}
                            style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: "10px 12px", background: "#fff" }}
                          />
                        </label>
                      </div>

                      <label style={{ display: "grid", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Assigned at</span>
                        <input
                          type="datetime-local"
                          value={editForm.assignedAt}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, assignedAt: event.target.value }))}
                          style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: "10px 12px", background: "#fff" }}
                        />
                      </label>

                      <label style={{ display: "grid", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Tags</span>
                        <div
                          style={{
                            border: "1px solid #cbd5e1",
                            borderRadius: 10,
                            padding: 12,
                            background: "#fff",
                            display: "grid",
                            gap: 10,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                            <div style={{ color: "#64748b", fontSize: 13 }}>
                              Chọn tag từ danh sách popup, hệ thống sẽ tự đồng bộ tagID khi lưu.
                            </div>
                            <button
                              type="button"
                              onClick={openTagPicker}
                              style={{
                                border: "1px solid #cbd5e1",
                                borderRadius: 8,
                                padding: "8px 12px",
                                background: "#fff",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              Chọn tag
                            </button>
                          </div>

                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {selectedTagCodes.length > 0 ? (
                              selectedTagCodes.map((code) => {
                                const matchedTag = tagLookupMap.get(code.toLowerCase());
                                return (
                                  <span
                                    key={code}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 6,
                                      padding: "6px 10px",
                                      borderRadius: 999,
                                      background: matchedTag ? "#f0fdf4" : "#fef2f2",
                                      border: matchedTag ? "1px solid #bbf7d0" : "1px solid #fecaca",
                                      color: matchedTag ? "#166534" : "#991b1b",
                                      fontSize: 13,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {code}
                                    <span style={{ fontWeight: 600 }}>{matchedTag ? matchedTag.tagName : "Không khớp"}</span>
                                  </span>
                                );
                              })
                            ) : (
                              <div style={{ color: "#64748b", fontSize: 13 }}>Chưa có tag nào được chọn.</div>
                            )}
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 16 }}>
                    <div style={sectionCardStyle}>
                      <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Xem trước tag</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {selectedTagCodes.length > 0 ? (
                          selectedTagCodes.map((code) => {
                            const matchedTag = tagLookupMap.get(code.toLowerCase());
                            return (
                              <span
                                key={code}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  padding: "7px 10px",
                                  borderRadius: 999,
                                  background: matchedTag ? "#f0fdf4" : "#fef2f2",
                                  border: matchedTag ? "1px solid #bbf7d0" : "1px solid #fecaca",
                                  color: matchedTag ? "#166534" : "#991b1b",
                                  fontSize: 13,
                                  fontWeight: 700,
                                }}
                              >
                                {code}
                                <span style={{ fontWeight: 600 }}>{matchedTag ? matchedTag.tagName : "Không khớp"}</span>
                              </span>
                            );
                          })
                        ) : (
                          <div style={{ color: "#64748b", fontSize: 13 }}>Chưa có tag codes.</div>
                        )}
                      </div>
                      <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.5 }}>
                        {isLoadingTags
                          ? "Đang tải danh sách tag để đồng bộ tagIDs..."
                          : `Đã tải ${tagLookup.length} tag để map tagIDs khi lưu.`}
                      </div>
                    </div>

                    <div style={sectionCardStyle}>
                      <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Thông tin hiện tại</div>
                      <div style={{ display: "grid", gap: 10 }}>
                        <div style={{ color: "#0f172a", fontWeight: 700 }}>{selectedTopic?.catalogTopicCode}</div>
                        <div style={{ color: "#475569", lineHeight: 1.6 }}>{selectedTopic?.summary || "--"}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {selectedTopic?.tags?.map((tag) => (
                            <span key={tag.tagID} style={{ padding: "6px 10px", borderRadius: 999, background: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412", fontSize: 12, fontWeight: 700 }}>
                              {tag.tagCode}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
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
                onClick={closeModal}
                disabled={isModalSaving}
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: "8px 12px",
                  background: "#fff",
                  fontWeight: 600,
                }}
              >
                {modalMode === "detail" ? "Đóng" : "Hủy"}
              </button>
              {modalMode === "edit" && (
                <button
                  type="button"
                  onClick={() => void saveEdit()}
                  disabled={isModalSaving}
                  style={{
                    border: "none",
                    background: "#f37021",
                    color: "#fff",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {isModalSaving ? <Loader2 size={16} className="spin" /> : null}
                  {isModalSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {modalMode === "edit" && isTagPickerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 170,
            background: "rgba(15,23,42,0.62)",
            backdropFilter: "blur(4px)",
            padding: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "min(920px, 100%)",
              maxHeight: "90vh",
              overflow: "hidden",
              borderRadius: 20,
              background: "#fff",
              border: "1px solid rgba(148,163,184,0.24)",
              boxShadow: "0 24px 70px rgba(15,23,42,0.3)",
              display: "grid",
              gridTemplateRows: "auto auto 1fr auto",
            }}
          >
            <div
              style={{
                padding: 20,
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <div>
                <div style={{ color: "#64748b", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>Tag picker</div>
                <h3 style={{ margin: "6px 0 0", fontSize: 22, color: "#0f172a" }}>Chọn tag cho đề tài</h3>
                <p style={{ margin: "6px 0 0", color: "#64748b", lineHeight: 1.6 }}>
                  Chọn nhiều tag trong popup này, sau đó hệ thống sẽ cập nhật tagCode và tagID tương ứng khi lưu.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsTagPickerOpen(false)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
                aria-label="Đóng popup tag"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 16, borderBottom: "1px solid #e2e8f0", display: "grid", gap: 12 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  value={tagPickerSearch}
                  onChange={(event) => setTagPickerSearch(event.target.value)}
                  placeholder="Tìm theo mã tag, tên tag hoặc mô tả"
                  style={{
                    flex: "1 1 320px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 10,
                    padding: "10px 12px",
                    background: "#fff",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setTagSelectionDraft([])}
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    padding: "9px 12px",
                    background: "#fff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Bỏ chọn hết
                </button>
              </div>

              <div style={{ color: "#64748b", fontSize: 13 }}>
                Đã chọn <strong>{tagSelectionDraft.length}</strong> / {tagLookup.length} tag
              </div>
            </div>

            <div style={{ overflow: "auto", padding: 16 }}>
              <div style={{ display: "grid", gap: 10 }}>
                {filteredTagOptions.length > 0 ? (
                  filteredTagOptions.map((tag) => {
                    const checked = tagSelectionDraft.some((item) => item.toLowerCase() === tag.tagCode.toLowerCase());
                    return (
                      <label
                        key={tag.tagID}
                        style={{
                          border: checked ? "1px solid #cbd5e1" : "1px solid #e2e8f0",
                          background: checked ? "#eff6ff" : "#fff",
                          borderRadius: 14,
                          padding: 14,
                          display: "grid",
                          gap: 8,
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTagSelection(tag.tagCode)}
                            style={{ marginTop: 4 }}
                          />
                          <div style={{ flex: 1, display: "grid", gap: 4 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                              <div style={{ fontWeight: 800, color: "#0f172a" }}>{tag.tagCode}</div>
                              <div style={{ fontSize: 13, color: "#64748b" }}>{tag.tagName}</div>
                            </div>
                            <div style={{ color: "#475569", fontSize: 13, lineHeight: 1.6 }}>
                              {tag.description || "Không có mô tả."}
                            </div>
                          </div>
                        </div>
                      </label>
                    );
                  })
                ) : (
                  <div style={{ color: "#64748b", fontSize: 13, padding: 12, textAlign: "center" }}>
                    Không tìm thấy tag phù hợp.
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: 16, borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                type="button"
                onClick={() => setIsTagPickerOpen(false)}
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: "8px 12px",
                  background: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={applyTagSelection}
                style={{
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 12px",
                  background: "#f37021",
                  color: "#fff",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Áp dụng tag
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CatalogTopicsWarehousePage;
