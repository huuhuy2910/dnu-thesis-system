import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Download,
  FileUp,
  Filter,
  RefreshCw,
  Search,
  Upload,
} from "lucide-react";
import * as XLSX from "xlsx";
import { fetchData, FetchDataError } from "../../api/fetchData";
import { useToast } from "../../context/useToast";
import { getAccessToken } from "../../services/auth-session.service";
import type { ApiResponse } from "../../types/api";
import "../admin/Dashboard.css";

type DataExchangeFormat = "xlsx" | "csv" | "json";

type ImportResult = {
  module: string;
  format: string;
  totalRows: number;
  createdCount: number;
  updatedCount: number;
  failedCount: number;
  errors: string[];
};

type ParsedCatalogTopicRow = {
  rowNumber: number;
  catalogTopicCode: string;
  title: string;
  summary: string;
  departmentCode: string;
  assignedStatus: string;
  assignedAt: string;
  tagCodes?: string;
};

type ValidationResult = {
  missingTitleRows: number[];
  duplicateCatalogTopicCodes: Array<{ code: string; rows: number[] }>;
};

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

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const PREVIEW_SIZE = 10;
const ALLOWED_FORMATS: DataExchangeFormat[] = ["xlsx", "csv", "json"];

const envBaseRaw = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5180"
).toString();

const ensureScheme = (value: string) =>
  /^https?:\/\//i.test(value) ? value : `http://${value}`;

const normalizedBase = (() => {
  const base = ensureScheme(envBaseRaw.trim());
  return base.endsWith("/") ? base.slice(0, -1) : base;
})();

const apiBase = `${normalizedBase}/api`;

const sectionCardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
  padding: 16,
  display: "grid",
  gap: 12,
};

function toText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

function normalizeFieldName(value: string): string {
  return value.replace(/[\s_-]/g, "").toLowerCase();
}

function getFieldValue(
  row: Record<string, unknown>,
  candidates: string[],
): string {
  const entries = Object.entries(row);
  for (const candidate of candidates) {
    const expected = normalizeFieldName(candidate);
    const found = entries.find(
      ([key]) => normalizeFieldName(String(key)) === expected,
    );
    if (found) {
      return toText(found[1]).trim();
    }
  }
  return "";
}

function normalizeTagCodes(raw: string): string {
  const chunks = raw
    .split(/[;,|]/)
    .map((item) => item.trim())
    .filter(Boolean);

  const unique: string[] = [];
  const seen = new Set<string>();
  for (const item of chunks) {
    const normalized = item.toUpperCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push(item);
  }

  return unique.join(";");
}

function mapRowToCatalogTopic(
  row: Record<string, unknown>,
  rowNumber: number,
): ParsedCatalogTopicRow {
  const rawTagCodes = getFieldValue(row, ["tagCodes", "tagCode", "tags"]);
  return {
    rowNumber,
    catalogTopicCode: getFieldValue(row, ["catalogTopicCode"]),
    title: getFieldValue(row, ["title"]),
    summary: getFieldValue(row, ["summary", "description"]),
    departmentCode: getFieldValue(row, ["departmentCode"]),
    assignedStatus: getFieldValue(row, ["assignedStatus"]),
    assignedAt: getFieldValue(row, ["assignedAt"]),
    ...(rawTagCodes !== "" ? { tagCodes: normalizeTagCodes(rawTagCodes) } : {}),
  };
}

function inferFormatFromFileName(name: string): DataExchangeFormat | null {
  const ext = name.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  if (ext === "xlsx" || ext === "csv" || ext === "json") {
    return ext;
  }
  return null;
}

function validateRows(rows: ParsedCatalogTopicRow[]): ValidationResult {
  const missingTitleRows: number[] = [];
  const duplicates = new Map<string, number[]>();

  rows.forEach((row) => {
    if (!row.title.trim()) {
      missingTitleRows.push(row.rowNumber);
    }

    const code = row.catalogTopicCode.trim();
    if (!code) return;
    const normalizedCode = code.toUpperCase();
    const current = duplicates.get(normalizedCode) || [];
    current.push(row.rowNumber);
    duplicates.set(normalizedCode, current);
  });

  const duplicateCatalogTopicCodes = Array.from(duplicates.entries())
    .filter(([, rowsByCode]) => rowsByCode.length > 1)
    .map(([code, rowsByCode]) => ({ code, rows: rowsByCode }));

  return { missingTitleRows, duplicateCatalogTopicCodes };
}

function normalizeImportResult(source: unknown): ImportResult {
  const payload = (source ?? {}) as Record<string, unknown>;
  return {
    module: toText(payload.module),
    format: toText(payload.format),
    totalRows: Number(payload.totalRows || 0),
    createdCount: Number(payload.createdCount || 0),
    updatedCount: Number(payload.updatedCount || 0),
    failedCount: Number(payload.failedCount || 0),
    errors: Array.isArray(payload.errors)
      ? payload.errors.map((item) => toText(item)).filter(Boolean)
      : [],
  };
}

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

async function parseResponseError(response: Response): Promise<string> {
  const fallback = "Không thể xử lý yêu cầu import/export.";
  try {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const payload = (await response.json()) as unknown;
      return getReadableError(payload, fallback);
    }
    const text = await response.text();
    return text.trim() || fallback;
  } catch {
    return fallback;
  }
}

function toPayloadRows(
  rows: ParsedCatalogTopicRow[],
): Array<Record<string, string>> {
  return rows.map((row) => {
    const payload: Record<string, string> = {
      title: row.title,
    };

    if (row.catalogTopicCode) payload.catalogTopicCode = row.catalogTopicCode;
    if (row.summary) payload.summary = row.summary;
    if (row.departmentCode) payload.departmentCode = row.departmentCode;
    if (row.assignedStatus) payload.assignedStatus = row.assignedStatus;
    if (row.assignedAt) payload.assignedAt = row.assignedAt;
    if (Object.prototype.hasOwnProperty.call(row, "tagCodes")) {
      payload.tagCodes = row.tagCodes || "";
    }

    return payload;
  });
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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [format, setFormat] = useState<DataExchangeFormat>("xlsx");
  const [normalizeBeforeImport, setNormalizeBeforeImport] = useState(true);
  const [previewRows, setPreviewRows] = useState<ParsedCatalogTopicRow[]>([]);
  const [parsedRows, setParsedRows] = useState<ParsedCatalogTopicRow[]>([]);
  const [validation, setValidation] = useState<ValidationResult>({
    missingTitleRows: [],
    duplicateCatalogTopicCodes: [],
  });
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const canImport = useMemo(
    () => !!selectedFile && !isImporting,
    [isImporting, selectedFile],
  );

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

  const expectedColumns =
    "catalogTopicCode,title,summary,departmentCode,assignedStatus,assignedAt,tagCodes";

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

  const handleParseRows = async (
    file: File,
    inferredFormat: DataExchangeFormat,
  ) => {
    const rawBuffer = await file.arrayBuffer();

    if (inferredFormat === "json") {
      const text = new TextDecoder().decode(rawBuffer);
      const parsed = JSON.parse(text) as unknown;
      const arr = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === "object"
          ? ((parsed as Record<string, unknown>).items as unknown[])
          : [];

      if (!Array.isArray(arr)) {
        throw new Error(
          "JSON phải là mảng object (hoặc có trường items là mảng).",
        );
      }

      const mapped = arr
        .filter((item) => item && typeof item === "object")
        .map((item, index) =>
          mapRowToCatalogTopic(item as Record<string, unknown>, index + 1),
        );

      setParsedRows(mapped);
      setPreviewRows(mapped.slice(0, PREVIEW_SIZE));
      setValidation(validateRows(mapped));
      return;
    }

    const workbook = XLSX.read(rawBuffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error("Không tìm thấy sheet dữ liệu trong file.");
    }

    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });

    const mapped = rows.map((row, index) =>
      mapRowToCatalogTopic(row, index + 2),
    );
    setParsedRows(mapped);
    setPreviewRows(mapped.slice(0, PREVIEW_SIZE));
    setValidation(validateRows(mapped));
  };

  const resetDataState = () => {
    setPreviewRows([]);
    setParsedRows([]);
    setParsingError(null);
    setImportResult(null);
    setValidation({ missingTitleRows: [], duplicateCatalogTopicCodes: [] });
  };

  const handleSelectFile = async (file: File | null) => {
    setSelectedFile(file);
    resetDataState();
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      addToast("File vượt quá giới hạn 10MB.", "error");
      setSelectedFile(null);
      return;
    }

    const inferred = inferFormatFromFileName(file.name);
    if (!inferred) {
      addToast("Chỉ hỗ trợ file .xlsx, .csv hoặc .json.", "error");
      setSelectedFile(null);
      return;
    }

    setFormat(inferred);
    try {
      await handleParseRows(file, inferred);
      addToast("Đã đọc file và tạo preview thành công.", "success");
    } catch (error) {
      setParsingError(
        error instanceof Error ? error.message : "Không thể đọc dữ liệu file.",
      );
      addToast(
        "Không thể preview file. Bạn vẫn có thể import trực tiếp.",
        "warning",
      );
    }
  };

  const downloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      const token = getAccessToken();
      const response = await fetch(
        `${apiBase}/DataExchange/export/catalogtopics?format=${format}`,
        {
          method: "GET",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );

      if (!response.ok) {
        throw new Error(await parseResponseError(response));
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = `catalogtopics-template.${format}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(blobUrl);
      addToast("Tải template thành công.", "success");
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Không thể tải template.",
        "error",
      );
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const doImport = async () => {
    if (!selectedFile) {
      addToast("Vui lòng chọn file import.", "warning");
      return;
    }

    if (validation.missingTitleRows.length > 0) {
      addToast(
        `Thiếu cột title ở ${validation.missingTitleRows.length} dòng. Vui lòng sửa trước khi import.`,
        "error",
      );
      return;
    }

    if (validation.duplicateCatalogTopicCodes.length > 0) {
      addToast(
        "Phát hiện catalogTopicCode bị trùng trong cùng file. Hệ thống vẫn cho phép import nhưng có thể gây update ngoài ý muốn.",
        "warning",
      );
    }

    setIsImporting(true);
    try {
      const token = getAccessToken();
      const formData = new FormData();

      if (normalizeBeforeImport && parsedRows.length > 0) {
        const payloadRows = toPayloadRows(parsedRows);
        const jsonBlob = new Blob([JSON.stringify(payloadRows, null, 2)], {
          type: "application/json",
        });
        const baseName = selectedFile.name.replace(/\.[^/.]+$/, "");
        const normalizedFile = new File(
          [jsonBlob],
          `${baseName}-normalized.json`,
          {
            type: "application/json",
          },
        );
        formData.append("file", normalizedFile);
        formData.append("format", "json");
      } else {
        formData.append("file", selectedFile);
        formData.append("format", format);
      }

      const response = await fetch(
        `${apiBase}/DataExchange/import/catalogtopics`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error(await parseResponseError(response));
      }

      const payload = (await response.json()) as ApiResponse<unknown> | unknown;
      if (
        payload &&
        typeof payload === "object" &&
        "success" in payload &&
        (payload as ApiResponse<unknown>).success === false
      ) {
        throw new Error(
          (payload as ApiResponse<unknown>).message ||
            (payload as ApiResponse<unknown>).title ||
            "Import catalogtopics thất bại.",
        );
      }

      const source =
        payload &&
        typeof payload === "object" &&
        "data" in payload &&
        (payload as ApiResponse<unknown>).data
          ? (payload as ApiResponse<unknown>).data
          : payload;

      const result = normalizeImportResult(source);
      setImportResult(result);
      addToast("Import kho đề tài thành công.", "success");
    } catch (error) {
      addToast(
        error instanceof Error
          ? error.message
          : "Import catalogtopics thất bại.",
        "error",
      );
    } finally {
      setIsImporting(false);
    }
  };

  const exportErrorsAsJson = () => {
    if (!importResult || importResult.errors.length === 0) return;
    const payload = {
      module: importResult.module || "catalogtopics",
      failedCount: importResult.failedCount,
      errors: importResult.errors,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "catalogtopics-import-errors.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
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
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flex: "1 1 320px",
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

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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

      <div style={sectionCardStyle}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "grid", gap: 4 }}>
            <strong style={{ color: "#0f172a" }}>
              Bước 1: Tải template trước khi import
            </strong>
            <span style={{ color: "#64748b", fontSize: 13 }}>
              Cột mẫu: {expectedColumns}
            </span>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                padding: "0 8px",
                background: "#fff",
              }}
            >
              <span style={{ fontSize: 13, color: "#334155" }}>Định dạng</span>
              <select
                value={format}
                onChange={(event) =>
                  setFormat(event.target.value as DataExchangeFormat)
                }
                style={{
                  border: "none",
                  padding: "8px 0",
                  background: "transparent",
                }}
              >
                {ALLOWED_FORMATS.map((item) => (
                  <option key={item} value={item}>
                    {item.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => void downloadTemplate()}
              disabled={isDownloadingTemplate}
              style={{
                border: "1px solid #cbd5e1",
                background: "#fff",
                color: "#0f172a",
                borderRadius: 8,
                padding: "8px 12px",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {isDownloadingTemplate ? (
                <RefreshCw size={16} />
              ) : (
                <Download size={16} />
              )}
              Tải template
            </button>
          </div>
        </div>

        <div
          style={{
            borderRadius: 10,
            border: "1px dashed #cbd5e1",
            padding: 14,
            display: "grid",
            gap: 10,
            background: "#f8fafc",
          }}
        >
          <strong style={{ color: "#0f172a" }}>
            Bước 2: Chọn file để preview và kiểm tra nhanh
          </strong>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <label
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                padding: "8px 12px",
                background: "#fff",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              <FileUp size={16} />
              Chọn file
              <input
                type="file"
                accept=".xlsx,.csv,.json"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  void handleSelectFile(file);
                }}
                style={{ display: "none" }}
              />
            </label>

            <span style={{ color: "#475569", fontSize: 13 }}>
              {selectedFile
                ? `Đã chọn: ${selectedFile.name}`
                : "Chưa chọn file"}
            </span>

            {selectedFile && (
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  resetDataState();
                }}
                style={{
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  background: "#fff",
                  borderRadius: 8,
                  padding: "6px 10px",
                }}
              >
                Bỏ file
              </button>
            )}
          </div>

          <label
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <input
              type="checkbox"
              checked={normalizeBeforeImport}
              onChange={(event) =>
                setNormalizeBeforeImport(event.target.checked)
              }
            />
            <span style={{ color: "#334155", fontSize: 13 }}>
              Chuẩn hóa tagCodes và import bằng JSON (khuyến nghị)
            </span>
          </label>

          {parsingError && (
            <div
              style={{
                border: "1px solid #fecaca",
                background: "#fff1f2",
                borderRadius: 8,
                padding: 10,
                color: "#9f1239",
                fontSize: 13,
              }}
            >
              {parsingError}
            </div>
          )}

          {validation.missingTitleRows.length > 0 && (
            <div
              style={{
                border: "1px solid #fecaca",
                background: "#fff1f2",
                borderRadius: 8,
                padding: 10,
                color: "#9f1239",
                fontSize: 13,
              }}
            >
              Thiếu cột title tại dòng: {validation.missingTitleRows.join(", ")}
            </div>
          )}

          {validation.duplicateCatalogTopicCodes.length > 0 && (
            <div
              style={{
                border: "1px solid #fde68a",
                background: "#fffbeb",
                borderRadius: 8,
                padding: 10,
                color: "#92400e",
                fontSize: 13,
                display: "grid",
                gap: 6,
              }}
            >
              <strong>Cảnh báo trùng catalogTopicCode trong cùng file:</strong>
              {validation.duplicateCatalogTopicCodes.map((item) => (
                <span key={`${item.code}-${item.rows.join("-")}`}>
                  {item.code}: dòng {item.rows.join(", ")}
                </span>
              ))}
            </div>
          )}

          {previewRows.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table className="topics-table">
                <thead>
                  <tr>
                    <th>Dòng</th>
                    <th>catalogTopicCode</th>
                    <th>title</th>
                    <th>departmentCode</th>
                    <th>assignedStatus</th>
                    <th>assignedAt</th>
                    <th>tagCodes</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row) => (
                    <tr key={`preview-${row.rowNumber}`}>
                      <td>{row.rowNumber}</td>
                      <td>{row.catalogTopicCode || "-"}</td>
                      <td>{row.title || "-"}</td>
                      <td>{row.departmentCode || "-"}</td>
                      <td>{row.assignedStatus || "-"}</td>
                      <td>{row.assignedAt || "-"}</td>
                      <td>
                        {Object.prototype.hasOwnProperty.call(row, "tagCodes")
                          ? row.tagCodes || "(xóa tag)"
                          : "(giữ nguyên)"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <span style={{ color: "#64748b", fontSize: 12 }}>
                Preview {previewRows.length}/{parsedRows.length} dòng đầu.
              </span>
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => void doImport()}
            disabled={!canImport}
            style={{
              border: "none",
              background: "#f37021",
              color: "#fff",
              borderRadius: 8,
              padding: "9px 14px",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Upload size={16} />
            {isImporting
              ? "Đang import..."
              : importResult
                ? "Import lại"
                : "Bước 3: Import"}
          </button>
        </div>
      </div>

      <div style={sectionCardStyle}>
        <strong style={{ color: "#0f172a" }}>Quy tắc tagCodes</strong>
        <ul
          style={{
            margin: 0,
            paddingLeft: 18,
            color: "#334155",
            lineHeight: 1.5,
          }}
        >
          <li>
            Có cột tagCodes và để trống: backend sẽ xóa toàn bộ tag đang gán.
          </li>
          <li>
            Không có cột tagCodes: backend giữ nguyên quan hệ tag hiện tại.
          </li>
          <li>
            Nếu tồn tại tagCode chưa có trong hệ thống, cả dòng import sẽ lỗi.
          </li>
        </ul>
      </div>

      {importResult && (
        <div style={sectionCardStyle}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
              gap: 10,
            }}
          >
            {[
              { label: "Tổng dòng", value: importResult.totalRows },
              { label: "Tạo mới", value: importResult.createdCount },
              { label: "Cập nhật", value: importResult.updatedCount },
              { label: "Lỗi", value: importResult.failedCount },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: 12,
                  background: "#f8fafc",
                }}
              >
                <div style={{ color: "#64748b", fontSize: 12 }}>
                  {item.label}
                </div>
                <div
                  style={{ color: "#0f172a", fontSize: 22, fontWeight: 700 }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <strong style={{ color: "#0f172a" }}>Chi tiết lỗi theo dòng</strong>
            <button
              type="button"
              disabled={importResult.errors.length === 0}
              onClick={exportErrorsAsJson}
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
              <Download size={14} /> Tải lỗi JSON
            </button>
          </div>

          <div style={{ overflowX: "auto", maxHeight: 320, overflowY: "auto" }}>
            <table className="topics-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nội dung lỗi</th>
                </tr>
              </thead>
              <tbody>
                {importResult.errors.length === 0 ? (
                  <tr>
                    <td colSpan={2}>Không có lỗi.</td>
                  </tr>
                ) : (
                  importResult.errors.map((error, index) => (
                    <tr key={`import-error-${index}`}>
                      <td>{index + 1}</td>
                      <td>{error}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogTopicsWarehousePage;
