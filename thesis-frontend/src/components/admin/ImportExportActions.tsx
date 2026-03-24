import React, { useMemo, useState } from "react";
import { Download, Upload } from "lucide-react";
import { useToast } from "../../context/useToast";
import { getAccessToken } from "../../services/auth-session.service";
import type { ApiResponse } from "../../types/api";
import type { ManagementModule } from "../../pages/studentservices/academicModuleConfig";

type DataExchangeFormat = "xlsx" | "csv" | "json";

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

const ALLOWED_EXTENSIONS: Record<DataExchangeFormat, string[]> = {
  xlsx: ["xlsx"],
  csv: ["csv"],
  json: ["json"],
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

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

interface ImportExportActionsProps {
  moduleName: ManagementModule;
  moduleLabel: string;
  onImportSuccess?: () => Promise<void> | void;
}

const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 70,
  padding: 16,
};

const modalCardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 640,
  background: "#fff",
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  boxShadow: "0 12px 32px rgba(15,23,42,0.2)",
  maxHeight: "85vh",
  overflowY: "auto",
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#0f172a",
  borderRadius: 8,
  padding: "8px 12px",
  fontWeight: 600,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  cursor: "pointer",
};

const primaryButtonStyle: React.CSSProperties = {
  border: "none",
  background: "#f37021",
  color: "#fff",
  borderRadius: 8,
  padding: "10px 14px",
  fontWeight: 600,
  cursor: "pointer",
};

function getFileNameFromContentDisposition(
  header: string | null,
): string | null {
  if (!header) return null;

  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const asciiMatch = header.match(/filename="?([^";]+)"?/i);
  if (asciiMatch?.[1]) {
    return asciiMatch[1];
  }

  return null;
}

async function parseErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const payload = (await response.json()) as Record<string, unknown>;
      const message = payload.message ?? payload.title;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }

    const text = await response.text();
    if (text.trim()) {
      return text;
    }
  } catch {
    // ignore parse errors
  }

  return fallback;
}

function normalizeImportResult(
  payload: ApiResponse<Record<string, unknown>>,
): ImportResult {
  const data = (payload.data ?? {}) as Record<string, unknown>;
  const rawErrors = Array.isArray(data.errors)
    ? (data.errors as unknown[])
    : [];

  const errors: ImportErrorItem[] = rawErrors
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }
      if (item && typeof item === "object") {
        return item as ImportErrorRow;
      }
      return null;
    })
    .filter((item): item is ImportErrorItem => item !== null);

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

  const row =
    typeof item.row === "number" && Number.isFinite(item.row)
      ? `Dòng ${item.row}`
      : `Lỗi ${index + 1}`;
  const field =
    typeof item.field === "string" && item.field.trim()
      ? ` - ${item.field}`
      : "";
  const message =
    typeof item.message === "string" && item.message.trim()
      ? item.message
      : "Lỗi dữ liệu";
  return `${row}${field}: ${message}`;
}

const ImportExportActions: React.FC<ImportExportActionsProps> = ({
  moduleName,
  moduleLabel,
  onImportSuccess,
}) => {
  const { addToast } = useToast();
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [importFormat, setImportFormat] = useState<DataExchangeFormat>("xlsx");
  const [exportFormat, setExportFormat] = useState<DataExchangeFormat>("xlsx");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmittingImport, setIsSubmittingImport] = useState(false);
  const [isSubmittingExport, setIsSubmittingExport] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const acceptedFileHint = useMemo(
    () => ALLOWED_EXTENSIONS[importFormat].map((item) => `.${item}`).join(", "),
    [importFormat],
  );

  const resetImportState = () => {
    setSelectedFile(null);
    setImportResult(null);
    setShowErrors(false);
    setImportFormat("xlsx");
  };

  const handleCloseImport = () => {
    if (isSubmittingImport) return;
    setIsImportOpen(false);
    resetImportState();
  };

  const handleImport = async () => {
    if (!selectedFile) {
      addToast("Vui lòng chọn file để import.", "warning");
      return;
    }

    const extension = selectedFile.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS[importFormat].includes(extension)) {
      addToast(
        `Định dạng không hợp lệ. Chỉ chấp nhận ${acceptedFileHint}.`,
        "error",
      );
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      addToast("File vượt quá giới hạn 10MB.", "error");
      return;
    }

    setIsSubmittingImport(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const token = getAccessToken();
      const response = await fetch(
        `${apiBase}/DataExchange/import/${moduleName}?format=${importFormat}`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: formData,
        },
      );

      if (!response.ok) {
        const message = await parseErrorMessage(
          response,
          "Import dữ liệu thất bại.",
        );
        throw new Error(message);
      }

      const payload = (await response.json()) as ApiResponse<
        Record<string, unknown>
      >;
      if (!payload.success) {
        throw new Error(
          payload.message || payload.title || "Import dữ liệu thất bại.",
        );
      }

      const result = normalizeImportResult(payload);
      setImportResult(result);
      addToast(`Import ${moduleLabel} thành công.`, "success");
      if (onImportSuccess) {
        await onImportSuccess();
      }
    } catch (error) {
      console.error("Import API error", {
        moduleName,
        importFormat,
        file: selectedFile.name,
        error,
      });
      addToast(
        error instanceof Error ? error.message : "Import dữ liệu thất bại.",
        "error",
      );
    } finally {
      setIsSubmittingImport(false);
    }
  };

  const handleExport = async () => {
    setIsSubmittingExport(true);
    try {
      const token = getAccessToken();
      const response = await fetch(
        `${apiBase}/DataExchange/export/${moduleName}?format=${exportFormat}`,
        {
          method: "GET",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );

      if (!response.ok) {
        const message = await parseErrorMessage(
          response,
          "Export dữ liệu thất bại.",
        );
        throw new Error(message);
      }

      const blob = await response.blob();
      const filename =
        getFileNameFromContentDisposition(
          response.headers.get("content-disposition"),
        ) || `${moduleName}-export.${exportFormat}`;

      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(blobUrl);
      addToast(`Export ${moduleLabel} thành công.`, "success");
      setIsExportOpen(false);
    } catch (error) {
      console.error("Export API error", {
        moduleName,
        exportFormat,
        error,
      });
      addToast(
        error instanceof Error ? error.message : "Export dữ liệu thất bại.",
        "error",
      );
    } finally {
      setIsSubmittingExport(false);
    }
  };

  return (
    <>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          style={buttonStyle}
          onClick={() => setIsImportOpen(true)}
        >
          <Upload size={16} /> Import
        </button>
        <button
          type="button"
          style={buttonStyle}
          onClick={() => setIsExportOpen(true)}
        >
          <Download size={16} /> Export
        </button>
      </div>

      {isImportOpen && (
        <div style={modalOverlayStyle} role="dialog" aria-modal="true">
          <div style={modalCardStyle}>
            <div style={{ padding: 16, borderBottom: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: 0, color: "#0f172a" }}>
                Import {moduleLabel}
              </h3>
            </div>

            <div style={{ padding: 16, display: "grid", gap: 14 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 600 }}>Định dạng</span>
                <select
                  value={importFormat}
                  onChange={(event) =>
                    setImportFormat(event.target.value as DataExchangeFormat)
                  }
                  disabled={isSubmittingImport}
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                  }}
                >
                  <option value="xlsx">xlsx</option>
                  <option value="csv">csv</option>
                  <option value="json">json</option>
                </select>
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 600 }}>
                  File ({acceptedFileHint})
                </span>
                <input
                  type="file"
                  accept={acceptedFileHint}
                  disabled={isSubmittingImport}
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setSelectedFile(file);
                  }}
                />
              </label>

              {moduleName === "lecturers" && (
                <div
                  style={{
                    border: "1px solid #dbeafe",
                    borderRadius: 10,
                    padding: 12,
                    background: "#eff6ff",
                    color: "#1e3a8a",
                    display: "grid",
                    gap: 8,
                    fontSize: 13,
                  }}
                >
                  <div style={{ fontWeight: 700 }}>
                    Import giảng viên đã tự động đồng bộ tags theo cột tagCodes.
                  </div>
                  <div>
                    FE chỉ upload file qua DataExchange, không cần gọi thêm
                    LecturerTags/create theo từng dòng.
                  </div>
                  <div>
                    Cột template hỗ trợ: lecturerCode, departmentCode, fullName,
                    degree, email, phoneNumber, guideQuota, defenseQuota,
                    currentGuidingCount, gender, dateOfBirth, address, notes,
                    tagCodes, assignedByUserCode.
                  </div>
                </div>
              )}

              {importResult && (
                <div
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: 10,
                    padding: 12,
                    background: "#f8fafc",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, minmax(0,1fr))",
                      gap: 8,
                    }}
                  >
                    <div>
                      Tổng dòng: <strong>{importResult.totalRows}</strong>
                    </div>
                    <div>
                      Tạo mới: <strong>{importResult.createdCount}</strong>
                    </div>
                    <div>
                      Cập nhật: <strong>{importResult.updatedCount}</strong>
                    </div>
                    <div>
                      Thất bại: <strong>{importResult.failedCount}</strong>
                    </div>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <button
                        type="button"
                        onClick={() => setShowErrors((prev) => !prev)}
                        style={{ ...buttonStyle, padding: "6px 10px" }}
                      >
                        {showErrors ? "Ẩn lỗi" : "Xem lỗi chi tiết"}
                      </button>
                      {showErrors && (
                        <div
                          style={{
                            marginTop: 10,
                            maxHeight: 180,
                            overflowY: "auto",
                            border: "1px solid #e2e8f0",
                            borderRadius: 8,
                            background: "#fff",
                            padding: 10,
                          }}
                        >
                          {importResult.errors.map((item, index) => (
                            <div
                              key={`${index}-${
                                typeof item === "string"
                                  ? item.slice(0, 24)
                                  : item.row ?? "na"
                              }`}
                              style={{ fontSize: 13, marginBottom: 8 }}
                            >
                              {renderImportErrorLine(item, index)}
                            </div>
                          ))}
                        </div>
                      )}
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
                style={buttonStyle}
                onClick={handleCloseImport}
                disabled={isSubmittingImport}
              >
                Đóng
              </button>
              <button
                type="button"
                style={primaryButtonStyle}
                onClick={handleImport}
                disabled={isSubmittingImport}
              >
                {isSubmittingImport ? "Đang upload..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isExportOpen && (
        <div style={modalOverlayStyle} role="dialog" aria-modal="true">
          <div style={{ ...modalCardStyle, maxWidth: 520 }}>
            <div style={{ padding: 16, borderBottom: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: 0, color: "#0f172a" }}>
                Export {moduleLabel}
              </h3>
            </div>
            <div style={{ padding: 16 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontWeight: 600 }}>Định dạng</span>
                <select
                  value={exportFormat}
                  onChange={(event) =>
                    setExportFormat(event.target.value as DataExchangeFormat)
                  }
                  disabled={isSubmittingExport}
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                  }}
                >
                  <option value="xlsx">xlsx</option>
                  <option value="csv">csv</option>
                  <option value="json">json</option>
                </select>
              </label>
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
                style={buttonStyle}
                onClick={() => setIsExportOpen(false)}
                disabled={isSubmittingExport}
              >
                Hủy
              </button>
              <button
                type="button"
                style={primaryButtonStyle}
                onClick={handleExport}
                disabled={isSubmittingExport}
              >
                {isSubmittingExport ? "Đang tải..." : "Download"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImportExportActions;
