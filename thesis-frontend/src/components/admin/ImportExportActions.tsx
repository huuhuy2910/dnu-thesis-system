import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileUp,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import { fetchData } from "../../api/fetchData";
import { useToast } from "../../context/useToast";
import { getAccessToken } from "../../services/auth-session.service";
import type { ApiResponse } from "../../types/api";
import {
  academicModuleConfig,
  type EntityConfig,
  type ManagementModule,
} from "../../pages/studentservices/academicModuleConfig";

type DataExchangeFormat = "xlsx" | "csv" | "json";

type PreviewRow = Record<string, unknown>;

interface ImportErrorRow {
  row?: number;
  field?: string;
  message?: string;
  [key: string]: unknown;
}

type ImportErrorItem = ImportErrorRow | string;

interface ImportResult {
  totalRows: number;
  createdCount: number;
  updatedCount: number;
  failedCount: number;
  errors: ImportErrorItem[];
}

interface ImportExportActionsProps {
  moduleName: ManagementModule;
  moduleLabel: string;
  onImportSuccess?: () => Promise<void> | void;
}

const ALLOWED_FORMATS: DataExchangeFormat[] = ["xlsx", "csv", "json"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const IMPORT_PREVIEW_LIMIT = 8;
const EXPORT_PREVIEW_LIMIT = 5;

function normalizeText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeKey(value: string): string {
  return value.replace(/[\s_-]/g, "").toLowerCase();
}

function isSystemIdColumn(value: string): boolean {
  const normalized = normalizeKey(value);
  return normalized === "id" || normalized.endsWith("id");
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 MB";
  }

  const megabytes = bytes / (1024 * 1024);
  if (megabytes >= 1) {
    return `${megabytes.toFixed(megabytes >= 10 ? 1 : 2)} MB`;
  }

  const kilobytes = bytes / 1024;
  return `${kilobytes.toFixed(kilobytes >= 10 ? 0 : 1)} KB`;
}

function buildPagedRequestPath(path: string, pageSize: number): string {
  const [basePath, queryString = ""] = path.split("?");
  const params = new URLSearchParams(queryString);
  const keysToDelete: string[] = [];

  params.forEach((_, key) => {
    const normalized = normalizeKey(key);
    if (normalized === "page" || normalized === "pagesize") {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => params.delete(key));
  params.set("page", "1");
  params.set("pageSize", String(pageSize));

  const nextQuery = params.toString();
  return nextQuery ? `${basePath}?${nextQuery}` : basePath;
}

function getConfig(moduleName: ManagementModule): EntityConfig {
  return academicModuleConfig[moduleName];
}

function getExportColumns(rows: PreviewRow[], fieldNames: string[]): string[] {
  const orderedColumns = new Set<string>();

  fieldNames.forEach((fieldName) => {
    if (!isSystemIdColumn(fieldName)) {
      orderedColumns.add(fieldName);
    }
  });

  rows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (!isSystemIdColumn(key)) {
        orderedColumns.add(key);
      }
    });
  });

  return Array.from(orderedColumns);
}

function getBlobSize(bytesOrText: string | Blob): number {
  return typeof bytesOrText === "string" ? new Blob([bytesOrText]).size : bytesOrText.size;
}

function normalizeRows(payload: unknown): PreviewRow[] {
  if (Array.isArray(payload)) {
    return payload.filter((item) => item && typeof item === "object") as PreviewRow[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const source = payload as Record<string, unknown>;
  const containers = [source.items, source.records, source.result, source.data, source.list, source.payload];
  for (const container of containers) {
    if (Array.isArray(container)) {
      return container.filter((item) => item && typeof item === "object") as PreviewRow[];
    }
  }

  return [source];
}

function getRowValue(row: PreviewRow, key: string): unknown {
  const targetKey = normalizeKey(key);
  for (const [candidateKey, candidateValue] of Object.entries(row)) {
    if (normalizeKey(candidateKey) === targetKey) {
      return candidateValue;
    }
  }
  return undefined;
}

function buildModuleUrl(path: string, format?: DataExchangeFormat): string {
  const envBaseRaw = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5180").toString();
  const ensureScheme = (value: string) => (/^https?:\/\//i.test(value) ? value : `http://${value}`);
  const normalizedBase = (() => {
    const base = ensureScheme(envBaseRaw.trim());
    return base.endsWith("/") ? base.slice(0, -1) : base;
  })();
  const apiBase = `${normalizedBase}/api`;
  const url = path.startsWith("http") ? path : `${apiBase}${path.startsWith("/") ? path : `/${path}`}`;
  if (!format) return url;
  return url.includes("?") ? `${url}&format=${encodeURIComponent(format)}` : `${url}?format=${encodeURIComponent(format)}`;
}

function parseImportErrors(payload: ApiResponse<Record<string, unknown>>): ImportResult {
  const data = (payload.data ?? {}) as Record<string, unknown>;
  const errors = Array.isArray(data.errors)
    ? data.errors.map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") return item as ImportErrorRow;
        return null;
      }).filter((item): item is ImportErrorItem => item !== null)
    : [];

  return {
    totalRows: Number(data.totalRows ?? 0),
    createdCount: Number(data.createdCount ?? 0),
    updatedCount: Number(data.updatedCount ?? 0),
    failedCount: Number(data.failedCount ?? 0),
    errors,
  };
}

function renderImportErrorLine(item: ImportErrorItem, index: number): string {
  if (typeof item === "string") {
    return item;
  }

  const row = typeof item.row === "number" && Number.isFinite(item.row) ? `Dòng ${item.row}` : `Lỗi ${index + 1}`;
  const field = typeof item.field === "string" && item.field.trim() ? ` - ${item.field}` : "";
  const message = typeof item.message === "string" && item.message.trim() ? item.message : "Lỗi dữ liệu";
  return `${row}${field}: ${message}`;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function buildCsv(rows: PreviewRow[], columns: string[]): Blob {
  const escapeCell = (value: unknown) => {
    const text = normalizeText(value);
    const escaped = text.replace(/"/g, '""');
    return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
  };

  const header = columns.map((item) => escapeCell(item)).join(",");
  const body = rows.map((row) => columns.map((column) => escapeCell(getRowValue(row, column))).join(",")).join("\n");
  return new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
}

function buildJson(rows: PreviewRow[]): Blob {
  return new Blob([JSON.stringify(rows, null, 2)], { type: "application/json;charset=utf-8;" });
}

function buildXlsx(rows: PreviewRow[]): Blob {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  const arrayBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Blob([arrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

async function parseFile(file: File, format: DataExchangeFormat): Promise<PreviewRow[]> {
  if (format === "json") {
    const text = await file.text();
    const payload = JSON.parse(text) as unknown;
    return normalizeRows(payload);
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return [];
  }
  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  return rows.filter((item) => item && typeof item === "object");
}

function getColumnsFromRows(rows: PreviewRow[]): string[] {
  const columns = new Set<string>();
  rows.forEach((row) => {
    Object.keys(row).forEach((key) => columns.add(key));
  });
  return Array.from(columns);
}

function formatPreviewCell(value: unknown): string {
  if (value === null || value === undefined) return "--";
  if (typeof value === "string") return value || "--";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(formatPreviewCell).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

const ImportExportActions: React.FC<ImportExportActionsProps> = ({
  moduleName,
  moduleLabel,
  onImportSuccess,
}) => {
  const { addToast } = useToast();
  const config = getConfig(moduleName);
  const displayLabel = moduleLabel || config.title;
  const [dialogMode, setDialogMode] = useState<"import" | "export" | null>(null);
  const [importFormat, setImportFormat] = useState<DataExchangeFormat>("xlsx");
  const [exportFormat, setExportFormat] = useState<DataExchangeFormat>("xlsx");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<PreviewRow[]>([]);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [exportPreviewRows, setExportPreviewRows] = useState<PreviewRow[]>([]);
  const [isLoadingExportPreview, setIsLoadingExportPreview] = useState(false);
  const [exportPreviewError, setExportPreviewError] = useState<string | null>(null);

  const requiredFields = useMemo(
    () => config.fields.filter((field) => field.required).map((field) => field.name),
    [config.fields],
  );
  const optionalFields = useMemo(
    () => config.fields.filter((field) => !field.required).map((field) => field.name),
    [config.fields],
  );
  const expectedColumns = useMemo(() => config.tableColumns.map((column) => column.key), [config.tableColumns]);
  const previewColumns = useMemo(() => {
    const merged = new Set<string>(["#", ...expectedColumns, ...requiredFields, ...optionalFields]);
    return Array.from(merged).filter((item) => item !== "#");
  }, [expectedColumns, optionalFields, requiredFields]);

  const importPreviewColumns = useMemo(() => {
    if (parsedRows.length === 0) {
      return previewColumns.slice(0, 8);
    }
    const fileColumns = getColumnsFromRows(parsedRows);
    return Array.from(new Set([...previewColumns, ...fileColumns])).slice(0, 10);
  }, [parsedRows, previewColumns]);

  const exportPreviewColumns = useMemo(() => {
    return getExportColumns(exportPreviewRows, config.fields.map((field) => field.name));
  }, [config.fields, exportPreviewRows]);

  const exportColumnCount = useMemo(
    () => exportPreviewColumns.length,
    [exportPreviewColumns],
  );

  const activePreviewColumns = useMemo(
    () => (dialogMode === "export" ? exportPreviewColumns : importPreviewColumns),
    [dialogMode, exportPreviewColumns, importPreviewColumns],
  );

  const isHighlightedField = (fieldName: string): boolean => {
    const normalizedField = normalizeKey(fieldName);
    return activePreviewColumns.some(
      (column) => normalizeKey(column) === normalizedField,
    );
  };

  const missingRequiredColumns = useMemo(() => {
    const columns = new Set(getColumnsFromRows(parsedRows).map(normalizeKey));
    return requiredFields.filter((field) => !columns.has(normalizeKey(field)));
  }, [parsedRows, requiredFields]);

  const fileColumns = useMemo(() => getColumnsFromRows(parsedRows), [parsedRows]);
  const previewRows = useMemo(() => parsedRows.slice(0, IMPORT_PREVIEW_LIMIT), [parsedRows]);

  const importFileStats = useMemo(() => {
    const fileSize = selectedFile ? formatFileSize(selectedFile.size) : "0 MB";
    const recordCount = parsedRows.length;
    const columnCount = getColumnsFromRows(parsedRows).length;
    const expectedCount = requiredFields.length + optionalFields.length;
    return [
      {
        label: "Bản ghi",
        value: selectedFile ? String(recordCount || "0") : "--",
        hint: selectedFile ? "Dòng đã đọc từ file" : "Chưa chọn file",
      },
      {
        label: "Dung lượng",
        value: selectedFile ? fileSize : "--",
        hint: selectedFile ? (selectedFile.type || "file upload") : "Chưa chọn file",
      },
      {
        label: "Số cột",
        value: selectedFile ? String(columnCount || 0) : "--",
        hint: selectedFile ? `${missingRequiredColumns.length} cột bắt buộc còn thiếu` : `Template có ${expectedCount} cột`,
      },
      {
        label: "Định dạng",
        value: selectedFile ? importFormat.toUpperCase() : "--",
        hint: selectedFile ? "Sẽ gửi lên API import" : "Chưa có dữ liệu",
      },
    ];
  }, [importFormat, missingRequiredColumns.length, optionalFields.length, parsedRows, requiredFields.length, selectedFile]);

  const exportFileStats = useMemo(() => {
    const recordCount = exportPreviewRows.length;
    const previewSize = formatFileSize(getBlobSize(JSON.stringify(exportPreviewRows)));
    const totalDefinedFields = config.fields.filter((field) => !isSystemIdColumn(field.name)).length;
    const excludedColumns = config.fields.filter((field) => isSystemIdColumn(field.name)).length;
    return [
      {
        label: "Bản ghi",
        value: String(recordCount || 0),
        hint: "Dữ liệu xem trước để xuất",
      },
      {
        label: "Cột sẽ xuất",
        value: String(exportColumnCount || totalDefinedFields),
        hint: `Loại ${excludedColumns} cột id`,
      },
      {
        label: "Dung lượng ước tính",
        value: previewSize,
        hint: "Ước tính theo dữ liệu preview",
      },
      {
        label: "Nguồn",
        value: config.exchange.previewPath ? "API preview" : "List API",
        hint: "Dùng để dựng file export",
      },
    ];
  }, [config.exchange.previewPath, config.fields, exportColumnCount, exportPreviewRows]);

  const resetImportState = () => {
    setSelectedFile(null);
    setParsedRows([]);
    setPreviewError(null);
    setImportResult(null);
    setShowErrors(false);
    setImportFormat("xlsx");
    setIsParsingFile(false);
  };

  const closeDialog = () => {
    if (isImporting || isExporting) {
      return;
    }
    setDialogMode(null);
    resetImportState();
  };

  useEffect(() => {
    if (dialogMode !== "export") {
      return;
    }

    let cancelled = false;
    const loadPreview = async () => {
      setIsLoadingExportPreview(true);
      setExportPreviewError(null);

      try {
        const previewPath = config.exchange.previewPath || `${config.api.listPath}?page=1&pageSize=${EXPORT_PREVIEW_LIMIT}`;
        const response = await fetchData<ApiResponse<unknown>>(previewPath);
        if (!response.success) {
          throw new Error(response.message || response.title || "Không thể tải preview export.");
        }
        if (cancelled) return;
        setExportPreviewRows(normalizeRows(response.data).slice(0, EXPORT_PREVIEW_LIMIT));
      } catch (error) {
        if (!cancelled) {
          setExportPreviewRows([]);
          setExportPreviewError(error instanceof Error ? error.message : "Không thể tải preview export.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingExportPreview(false);
        }
      }
    };

    void loadPreview();
    return () => {
      cancelled = true;
    };
  }, [config.api.listPath, config.exchange.previewPath, dialogMode]);

  const handleOpenImport = () => {
    setDialogMode("import");
    setShowErrors(false);
  };

  const handleOpenExport = () => {
    setDialogMode("export");
  };

  const handleFileChange = async (file: File | null) => {
    setSelectedFile(file);
    setImportResult(null);
    setPreviewError(null);
    setParsedRows([]);

    if (!file) {
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setPreviewError("File vượt quá giới hạn 10MB.");
      addToast("File vượt quá giới hạn 10MB.", "error");
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase() as DataExchangeFormat | undefined;
    const detectedFormat = extension && ALLOWED_FORMATS.includes(extension) ? extension : importFormat;
    setImportFormat(detectedFormat);

    setIsParsingFile(true);
    try {
      const rows = await parseFile(file, detectedFormat);
      setParsedRows(rows);

      if (rows.length === 0) {
        setPreviewError("Không đọc được dữ liệu từ file đã chọn.");
        return;
      }

      const missingColumns = requiredFields.filter((field) =>
        !getColumnsFromRows(rows).some((column) => normalizeKey(column) === normalizeKey(field)),
      );

      if (missingColumns.length > 0) {
        setPreviewError(`Thiếu cột bắt buộc: ${missingColumns.join(", ")}`);
      } else {
        setPreviewError(null);
      }

      addToast("Đã tạo preview file thành công.", "success");
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : "Không thể đọc file.");
      addToast("Không thể preview file. Hãy kiểm tra định dạng hoặc nội dung.", "warning");
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      addToast("Vui lòng chọn file để import.", "warning");
      return;
    }

    if (missingRequiredColumns.length > 0) {
      addToast(`Thiếu cột bắt buộc: ${missingRequiredColumns.join(", ")}`, "error");
      return;
    }

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const token = getAccessToken();
      const importUrl = buildModuleUrl(config.exchange.importPath, config.exchange.importUsesFormatQuery ? importFormat : undefined);
      const response = await fetch(importUrl, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message.trim() || "Import dữ liệu thất bại.");
      }

      const payload = (await response.json()) as ApiResponse<Record<string, unknown>>;
      if (!payload.success) {
        throw new Error(payload.message || payload.title || "Import dữ liệu thất bại.");
      }

      const result = parseImportErrors(payload);
      setImportResult(result);
      addToast(`Import ${displayLabel} thành công.`, "success");
      if (onImportSuccess) {
        await onImportSuccess();
      }
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Import dữ liệu thất bại.", "error");
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const previewPath = config.exchange.previewPath || config.api.listPath;
      const exportUrl = buildPagedRequestPath(previewPath, 5000);
      const response = await fetchData<ApiResponse<unknown>>(exportUrl);

      if (!response.success) {
        throw new Error(response.message || response.title || "Không thể tải dữ liệu export.");
      }

      const rows = normalizeRows(response.data);
      const columns = getExportColumns(rows, config.fields.map((field) => field.name));

      if (rows.length === 0) {
        throw new Error("Chưa có dữ liệu để export.");
      }

      let blob: Blob;
      if (exportFormat === "csv") {
        blob = buildCsv(rows, columns);
      } else if (exportFormat === "json") {
        blob = buildJson(rows);
      } else {
        blob = buildXlsx(rows);
      }
      downloadBlob(blob, `${moduleName}-preview-export.${exportFormat}`);
      addToast(`Export preview ${displayLabel} thành công.`, "success");
      setDialogMode(null);
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Export dữ liệu thất bại.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const renderPreviewTable = (rows: PreviewRow[], columns: string[], emptyMessage: string) => {
    if (rows.length === 0) {
      return <div style={styles.emptyState}>{emptyMessage}</div>;
    }

    return (
      <div style={styles.scrollFrame}>
        <div style={styles.scrollArea} className="import-export-scroll-area">
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.thNo}>#</th>
                {columns.map((column) => (
                  <th key={column} style={styles.th}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${index}-${columns[0] || "row"}`}>
                  <td style={styles.tdNo}>{index + 1}</td>
                  {columns.map((column) => (
                    <td key={column} style={styles.td}>{formatPreviewCell(getRowValue(row, column))}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const dialogTitle = dialogMode === "import" ? `Import ${displayLabel}` : `Export ${displayLabel}`;

  const actionLabel = dialogMode === "import" ? "Import" : "Download";
  const actionHandler = dialogMode === "import" ? handleImport : handleExport;
  const actionDisabled = dialogMode === "import"
    ? isImporting || isParsingFile || selectedFile === null
    : isExporting;

  return (
    <>
      <style>{`
        .import-export-scroll-area {
          scrollbar-width: thin;
          scrollbar-color: #1e3a8a rgba(0, 28, 61, 0.1);
          scrollbar-gutter: stable;
          padding-right: 4px;
          box-sizing: border-box;
        }
        .import-export-scroll-area::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .import-export-scroll-area::-webkit-scrollbar-button {
          width: 0;
          height: 0;
          display: none;
        }
        .import-export-scroll-area::-webkit-scrollbar-button:single-button,
        .import-export-scroll-area::-webkit-scrollbar-button:double-button,
        .import-export-scroll-area::-webkit-scrollbar-button:vertical:decrement,
        .import-export-scroll-area::-webkit-scrollbar-button:vertical:increment,
        .import-export-scroll-area::-webkit-scrollbar-button:horizontal:decrement,
        .import-export-scroll-area::-webkit-scrollbar-button:horizontal:increment,
        .import-export-scroll-area::-webkit-scrollbar-button:vertical:start:decrement,
        .import-export-scroll-area::-webkit-scrollbar-button:vertical:end:increment,
        .import-export-scroll-area::-webkit-scrollbar-button:horizontal:start:decrement,
        .import-export-scroll-area::-webkit-scrollbar-button:horizontal:end:increment {
          width: 0;
          height: 0;
          display: none;
          background: transparent;
          border: none;
        }
        .import-export-scroll-area::-webkit-scrollbar-track {
          background: rgba(0, 28, 61, 0.1);
          border-radius: 999px;
        }
        .import-export-scroll-area::-webkit-scrollbar-thumb {
          background: #1e3a8a;
          border-radius: 999px;
        }
        .import-export-scroll-area::-webkit-scrollbar-thumb:hover {
          background: #152451;
        }
        .import-export-action-button {
          transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease, background 0.18s ease;
        }
        .import-export-action-button:hover:not(:disabled) {
          transform: translateY(-1px);
          filter: saturate(1.08);
          box-shadow: 0 18px 28px rgba(249, 115, 22, 0.3);
        }
        .import-export-action-button:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 12px 20px rgba(249, 115, 22, 0.24);
        }
        .import-export-action-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          box-shadow: none;
          filter: none;
          transform: none;
        }
      `}</style>
      <div style={styles.triggerGroup}>
        <button type="button" style={styles.secondaryButton} onClick={handleOpenImport}>
          <Upload size={16} /> Import
        </button>
        <button type="button" style={styles.secondaryButton} onClick={handleOpenExport}>
          <Download size={16} /> Export
        </button>
      </div>

      {dialogMode && (
        <div style={styles.overlay} role="dialog" aria-modal="true">
          <div style={styles.card}>
            <div style={styles.cardScroll} className="import-export-popup-scroll">
                  <div style={styles.cardHeader}>
                    <div>
                      <div style={styles.eyebrow}>Data exchange</div>
                      <h3 style={styles.title}>{dialogTitle}</h3>
                      <p style={styles.subtitle}>
                        Dùng một popup chung để xem trước dữ liệu, kiểm tra cột bắt buộc và xác nhận trước khi thao tác.
                      </p>
                    </div>
                    <button type="button" onClick={closeDialog} style={styles.iconButton} aria-label="Đóng">
                      <X size={18} />
                    </button>
                  </div>

                  <div style={styles.tabBar}>
                    <button
                      type="button"
                      onClick={() => setDialogMode("import")}
                      style={dialogMode === "import" ? styles.tabActive : styles.tab}
                    >
                      <FileUp size={15} /> Import
                    </button>
                    <button
                      type="button"
                      onClick={() => setDialogMode("export")}
                      style={dialogMode === "export" ? styles.tabActive : styles.tab}
                    >
                      <Download size={15} /> Export
                    </button>
                  </div>

                  <div style={styles.body}>
                    <aside style={styles.sidePanel}>
                      <div style={styles.sideSection}>
                        <div style={styles.sideHeading}>Ghi chú cột mẫu</div>
                        <div style={styles.noteList}>
                          {requiredFields.map((field) => (
                            <div
                              key={field}
                              style={{
                                ...styles.noteItemRequired,
                                ...(isHighlightedField(field)
                                  ? styles.noteItemHighlighted
                                  : null),
                              }}
                            >
                              <CheckCircle2 size={14} /> {field} là bắt buộc
                            </div>
                          ))}
                          {optionalFields.slice(0, 8).map((field) => (
                            <div
                              key={field}
                              style={{
                                ...styles.noteItemOptional,
                                ...(isHighlightedField(field)
                                  ? styles.noteItemHighlighted
                                  : null),
                              }}
                            >
                              <ArrowRight size={14} /> {field} tùy chọn
                            </div>
                          ))}
                          {config.exchange.importNotes?.map((note) => (
                            <div key={note} style={styles.noteItemInfo}>
                              <AlertCircle size={14} /> {note}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={styles.sideSection}>
                        <div style={styles.sideHeading}>Template preview</div>
                        <div style={styles.miniText}>Các cột chính đang được dùng: {expectedColumns.join(", ") || "--"}</div>
                        <div style={styles.miniText}>Tối đa {dialogMode === "import" ? IMPORT_PREVIEW_LIMIT : EXPORT_PREVIEW_LIMIT} dòng xem trước.</div>
                      </div>
                    </aside>

                    <section style={styles.mainPanel}>
                      {dialogMode === "import" ? (
                        <>
                          <div style={styles.importBox}>
                            <div style={styles.sectionHeaderRow}>
                              <div style={styles.sectionTitle}>Chọn file import</div>
                              <button
                                type="button"
                                style={styles.sectionActionButton}
                                className="import-export-action-button"
                                onClick={actionHandler}
                                disabled={actionDisabled}
                              >
                                {actionLabel}
                              </button>
                            </div>
                            <div style={styles.inlineRow}>
                              <label style={styles.formatSelectWrap}>
                                <span style={styles.labelText}>Định dạng</span>
                                <select
                                  value={importFormat}
                                  onChange={(event) => setImportFormat(event.target.value as DataExchangeFormat)}
                                  style={styles.select}
                                  disabled={isParsingFile || isImporting}
                                >
                                  {ALLOWED_FORMATS.map((format) => (
                                    <option key={format} value={format}>
                                      {format.toUpperCase()}
                                    </option>
                                  ))}
                                </select>
                              </label>

                              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                <label style={styles.fileButton}>
                                  <FileSpreadsheet size={16} />
                                  {selectedFile ? selectedFile.name : "Chọn file"}
                                  <input
                                    type="file"
                                    accept=".xlsx,.csv,.json"
                                    onChange={(event) => void handleFileChange(event.target.files?.[0] ?? null)}
                                    style={{ display: "none" }}
                                    disabled={isParsingFile || isImporting}
                                  />
                                </label>

                                {selectedFile && (
                                  <button
                                    type="button"
                                    onClick={() => handleFileChange(null)}
                                    style={styles.clearFileButton}
                                    aria-label="Bỏ chọn file"
                                    title="Bỏ chọn file"
                                    disabled={isParsingFile || isImporting}
                                  >
                                    <X size={16} />
                                  </button>
                                )}
                              </div>
                            </div>

                            <div style={styles.helperRow}>
                              <span style={styles.helperPill}>Có thể chọn lại file bất kỳ lúc nào</span>
                              <span style={styles.helperPill}>File &gt; 10MB sẽ bị chặn</span>
                            </div>

                            <div style={styles.infoGrid}>
                              {importFileStats.map((item) => (
                                <div key={item.label} style={styles.infoCard}>
                                  <div style={styles.infoLabel}>{item.label}</div>
                                  <div style={styles.infoValue}>{item.value}</div>
                                  <div style={styles.infoHint}>{item.hint}</div>
                                </div>
                              ))}
                            </div>

                            {previewError && (
                              <div style={styles.warningBox}>
                                <AlertCircle size={16} /> {previewError}
                              </div>
                            )}

                            {missingRequiredColumns.length > 0 && (
                              <div style={styles.errorBox}>
                                <AlertCircle size={16} /> Thiếu cột bắt buộc: {missingRequiredColumns.join(", ")}
                              </div>
                            )}

                            {parsedRows.length > 0 && (
                              <div style={styles.successBox}>
                                <CheckCircle2 size={16} /> Đã đọc {parsedRows.length} dòng. Preview hiển thị {previewRows.length} dòng đầu.
                              </div>
                            )}
                          </div>

                          <div style={styles.previewCard}>
                            <div style={styles.sectionHeaderRow}>
                              <div style={styles.sectionTitle}>Preview file trước khi import</div>
                              <div style={styles.sectionActionHint}>Xem trước dữ liệu trước khi xác nhận</div>
                            </div>
                            {renderPreviewTable(previewRows, importPreviewColumns, "Hãy chọn file để xem preview.")}
                            {fileColumns.length > 0 && (
                              <div style={styles.metaText}>Cột phát hiện: {fileColumns.join(", ")}</div>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={styles.importBox}>
                            <div style={styles.sectionHeaderRow}>
                              <div style={styles.sectionTitle}>Thiết lập export</div>
                              <button
                                type="button"
                                style={styles.sectionActionButton}
                                className="import-export-action-button"
                                onClick={actionHandler}
                                disabled={actionDisabled}
                              >
                                {actionLabel}
                              </button>
                            </div>
                            <label style={styles.formatSelectWrap}>
                              <span style={styles.labelText}>Định dạng</span>
                              <select
                                value={exportFormat}
                                onChange={(event) => setExportFormat(event.target.value as DataExchangeFormat)}
                                style={styles.select}
                                disabled={isExporting}
                              >
                                {ALLOWED_FORMATS.map((format) => (
                                  <option key={format} value={format}>
                                    {format.toUpperCase()}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <div style={styles.helperRow}>
                              <span style={styles.helperPill}>Preview được lấy từ API danh sách gần nhất</span>
                              <span style={styles.helperPill}>Nếu export server lỗi sẽ fallback sang file client-side</span>
                            </div>

                            <div style={styles.infoGrid}>
                              {exportFileStats.map((item) => (
                                <div key={item.label} style={styles.infoCard}>
                                  <div style={styles.infoLabel}>{item.label}</div>
                                  <div style={styles.infoValue}>{item.value}</div>
                                  <div style={styles.infoHint}>{item.hint}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div style={styles.previewCard}>
                            <div style={styles.sectionHeaderRow}>
                              <div style={styles.sectionTitle}>Preview dữ liệu export</div>
                              <div style={styles.sectionActionHint}>Dữ liệu sẽ được đóng gói đủ cột trừ cột id</div>
                            </div>
                            {isLoadingExportPreview ? (
                              <div style={styles.loadingBox}>
                                <RefreshCw size={16} className="spin" /> Đang tải dữ liệu preview...
                              </div>
                            ) : exportPreviewError ? (
                              <div style={styles.warningBox}>
                                <AlertCircle size={16} /> {exportPreviewError}
                              </div>
                            ) : (
                              renderPreviewTable(
                                exportPreviewRows,
                                exportPreviewColumns,
                                "Chưa có dữ liệu preview export.",
                              )
                            )}
                          </div>
                        </>
                      )}

                      {importResult && dialogMode === "import" && (
                        <div style={styles.resultCard}>
                          <div style={styles.sectionTitle}>Kết quả import</div>
                          <div style={styles.resultGrid}>
                            <div style={styles.resultStat}><span>Tổng dòng</span><strong>{importResult.totalRows}</strong></div>
                            <div style={styles.resultStat}><span>Tạo mới</span><strong>{importResult.createdCount}</strong></div>
                            <div style={styles.resultStat}><span>Cập nhật</span><strong>{importResult.updatedCount}</strong></div>
                            <div style={styles.resultStat}><span>Thất bại</span><strong>{importResult.failedCount}</strong></div>
                          </div>

                          {importResult.errors.length > 0 && (
                            <div style={styles.errorListWrap}>
                              <button
                                type="button"
                                onClick={() => setShowErrors((prev) => !prev)}
                                style={styles.smallButton}
                              >
                                {showErrors ? "Ẩn lỗi" : "Xem lỗi chi tiết"}
                              </button>
                              {showErrors && (
                                <div style={styles.errorListFrame}>
                                  <div style={styles.errorList}>
                                    {importResult.errors.map((item, index) => (
                                      <div key={`${index}-${typeof item === "string" ? item : item.row ?? "na"}`} style={styles.errorItem}>
                                        {renderImportErrorLine(item, index)}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </section>
                  </div>
                </div>
              </div>
            </div>
      )}
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  triggerGroup: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.58)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 120,
    padding: 16,
  },
  card: {
    width: "min(1200px, 100%)",
    maxHeight: "92vh",
    overflow: "hidden",
    background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
    borderRadius: 24,
    boxShadow: "0 28px 80px rgba(15,23,42,0.35)",
    border: "1px solid rgba(148,163,184,0.28)",
  },
  cardScroll: {
    maxHeight: "92vh",
    overflow: "auto",
    boxSizing: "border-box",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    padding: 24,
    borderBottom: "1px solid rgba(148,163,184,0.18)",
    background: "linear-gradient(135deg, rgba(243,112,33,0.08), rgba(14,165,233,0.05))",
  },
  eyebrow: {
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
  },
  title: {
    margin: "10px 0 6px",
    fontSize: 28,
    lineHeight: 1.1,
    color: "#0f172a",
  },
  subtitle: {
    margin: 0,
    color: "#64748b",
    lineHeight: 1.6,
    maxWidth: 760,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    background: "#fff",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    flexShrink: 0,
  },
  tabBar: {
    display: "flex",
    gap: 8,
    padding: "16px 24px 0",
  },
  tab: {
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#334155",
    borderRadius: 14,
    padding: "10px 14px",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 700,
    cursor: "pointer",
  },
  tabActive: {
    border: "1px solid rgba(243,112,33,0.3)",
    background: "linear-gradient(135deg, #fff7ed 0%, #fff 100%)",
    color: "#c2410c",
    borderRadius: 14,
    padding: "10px 14px",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 10px 20px rgba(243,112,33,0.08)",
  },
  body: {
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    gap: 18,
    padding: 24,
    alignItems: "start",
  },
  sidePanel: {
    display: "grid",
    gap: 16,
    alignSelf: "start",
  },
  sideSection: {
    borderRadius: 18,
    border: "1px solid #e2e8f0",
    background: "#fff",
    padding: 16,
    boxShadow: "0 10px 26px rgba(15,23,42,0.05)",
  },
  sideHeading: {
    fontSize: 13,
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.05,
  },
  noteList: {
    display: "grid",
    gap: 10,
  },
  noteItemRequired: {
    display: "flex",
    gap: 8,
    alignItems: "flex-start",
    color: "#166534",
    fontSize: 13,
    lineHeight: 1.45,
    background: "#f0fdf4",
    padding: 10,
    borderRadius: 12,
  },
  noteItemOptional: {
    display: "flex",
    gap: 8,
    alignItems: "flex-start",
    color: "#475569",
    fontSize: 13,
    lineHeight: 1.45,
    background: "#f8fafc",
    padding: 10,
    borderRadius: 12,
  },
  noteItemHighlighted: {
    background: "linear-gradient(135deg, rgba(243,112,33,0.16), rgba(255,247,237,0.96))",
    border: "1px solid rgba(243,112,33,0.28)",
    color: "#9a3412",
    boxShadow: "0 10px 20px rgba(243,112,33,0.08)",
  },
  noteItemInfo: {
    display: "flex",
    gap: 8,
    alignItems: "flex-start",
    color: "#9a3412",
    fontSize: 13,
    lineHeight: 1.45,
    background: "#fff7ed",
    padding: 10,
    borderRadius: 12,
  },
  miniText: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 1.55,
    marginTop: 8,
  },
  mainPanel: {
    display: "grid",
    gap: 16,
    gridAutoRows: "max-content",
    alignContent: "start",
  },
  importBox: {
    borderRadius: 20,
    border: "1px solid #e2e8f0",
    background: "#fff",
    padding: 18,
    display: "grid",
    gap: 14,
    boxShadow: "0 12px 26px rgba(15,23,42,0.05)",
  },
  previewCard: {
    borderRadius: 20,
    border: "1px solid #e2e8f0",
    background: "#fff",
    padding: 18,
    display: "grid",
    gap: 14,
    boxShadow: "0 12px 26px rgba(15,23,42,0.05)",
    minHeight: 240,
  },
  sectionHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  sectionActionButton: {
    border: "1px solid rgba(249,115,22,0.35)",
    background: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
    color: "#ffffff",
    borderRadius: 999,
    padding: "9px 16px",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
    minWidth: 108,
    boxShadow: "0 14px 24px rgba(249,115,22,0.24)",
    letterSpacing: 0.02,
  },
  sectionActionHint: {
    color: "#64748b",
    fontSize: 12,
    lineHeight: 1.4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: "#0f172a",
  },
  inlineRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "end",
  },
  formatSelectWrap: {
    display: "grid",
    gap: 6,
    minWidth: 180,
  },
  labelText: {
    fontSize: 12,
    fontWeight: 700,
    color: "#475569",
  },
  select: {
    border: "1px solid #cbd5e1",
    borderRadius: 14,
    padding: "10px 12px",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 600,
  },
  fileButton: {
    border: "1px dashed #f37021",
    borderRadius: 14,
    padding: "11px 14px",
    background: "linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)",
    color: "#c2410c",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 700,
    cursor: "pointer",
  },
  clearFileButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    border: "1px solid #fca5a5",
    background: "#fff",
    color: "#b91c1c",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },
  helperRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 10,
  },
  infoCard: {
    borderRadius: 14,
    border: "1px solid #e2e8f0",
    background: "linear-gradient(180deg, #fff, #f8fafc)",
    padding: 12,
    display: "grid",
    gap: 6,
    minHeight: 88,
  },
  infoLabel: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 0.06,
  },
  infoValue: {
    color: "#0f172a",
    fontSize: 20,
    fontWeight: 800,
    lineHeight: 1.1,
  },
  infoHint: {
    color: "#64748b",
    fontSize: 12,
    lineHeight: 1.4,
  },
  helperPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    padding: "6px 10px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    color: "#475569",
    fontSize: 12,
    fontWeight: 600,
  },
  warningBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 14,
    border: "1px solid #fcd34d",
    background: "#fffbeb",
    color: "#92400e",
    fontSize: 13,
    lineHeight: 1.5,
  },
  errorBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 14,
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#991b1b",
    fontSize: 13,
    lineHeight: 1.5,
  },
  successBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 14,
    border: "1px solid #bbf7d0",
    background: "#f0fdf4",
    color: "#166534",
    fontSize: 13,
    lineHeight: 1.5,
  },
  loadingBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    minHeight: 140,
    color: "#475569",
    fontWeight: 600,
  },
  emptyState: {
    borderRadius: 16,
    border: "1px dashed #cbd5e1",
    background: "#f8fafc",
    color: "#64748b",
    padding: 12,
    textAlign: "center",
    minHeight: 96,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollFrame: {
    borderRadius: 18,
    border: "1px solid #e2e8f0",
    background: "#fff",
    overflow: "hidden",
  },
  scrollArea: {
    overflow: "auto",
    maxHeight: 520,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
  },
  th: {
    position: "sticky",
    top: 0,
    background: "#f8fafc",
    color: "#334155",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.04,
    fontWeight: 800,
    padding: "10px 12px",
    borderBottom: "1px solid #e2e8f0",
    textAlign: "left",
    whiteSpace: "nowrap",
  },
  thNo: {
    position: "sticky",
    top: 0,
    background: "#f8fafc",
    color: "#334155",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.04,
    fontWeight: 800,
    padding: "10px 12px",
    borderBottom: "1px solid #e2e8f0",
    textAlign: "center",
    whiteSpace: "nowrap",
    width: 52,
  },
  td: {
    padding: "10px 12px",
    borderBottom: "1px solid #edf2f7",
    color: "#0f172a",
    fontSize: 13,
    whiteSpace: "nowrap",
    maxWidth: 260,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  tdNo: {
    padding: "10px 12px",
    borderBottom: "1px solid #edf2f7",
    color: "#0f172a",
    fontSize: 13,
    textAlign: "center",
    width: 52,
  },
  metaText: {
    color: "#64748b",
    fontSize: 12,
    lineHeight: 1.5,
  },
  resultCard: {
    borderRadius: 20,
    border: "1px solid #cbd5e1",
    background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
    padding: 18,
    display: "grid",
    gap: 14,
  },
  resultGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 10,
  },
  resultStat: {
    borderRadius: 14,
    border: "1px solid #e2e8f0",
    background: "#fff",
    padding: 12,
    display: "grid",
    gap: 4,
    color: "#334155",
  },
  errorListWrap: {
    display: "grid",
    gap: 12,
  },
  errorListFrame: {
    borderRadius: 16,
    border: "1px solid #fecaca",
    background: "#fff7f7",
    overflow: "hidden",
  },
  errorList: {
    maxHeight: 180,
    overflow: "auto",
    padding: 12,
    display: "grid",
    gap: 8,
  },
  errorItem: {
    color: "#991b1b",
    fontSize: 13,
    lineHeight: 1.45,
  },
  smallButton: {
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#0f172a",
    borderRadius: 12,
    padding: "8px 12px",
    fontWeight: 700,
    cursor: "pointer",
    width: "fit-content",
  },
  secondaryButton: {
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#0f172a",
    borderRadius: 14,
    padding: "10px 14px",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    minWidth: 132,
    justifyContent: "center",
    height: 42,
  },
  primaryButton: {
    border: "none",
    background: "linear-gradient(135deg, #f37021, #fb923c)",
    color: "#fff",
    borderRadius: 14,
    padding: "10px 16px",
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    boxShadow: "0 14px 24px rgba(243,112,33,0.22)",
    minWidth: 132,
    justifyContent: "center",
    height: 42,
  },
};

export default ImportExportActions;
